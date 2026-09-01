package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/AsterrZep/rpgmaker-launcher-go/internal/core"
	"github.com/AsterrZep/rpgmaker-launcher-go/internal/engine"
	"github.com/AsterrZep/rpgmaker-launcher-go/internal/services"
)

// App is the Wails application struct. Methods on App become IPC bindings.
type App struct {
	configManager  *core.ConfigManager
	detector       *engine.Detector
	saveEditor     *engine.SaveEditor
	eventsService  *services.EventsService
	syncService    *services.SyncService
	activeServer   *services.GameServer
	activeGame     *core.ActiveSession
}

// NewApp creates and initializes the application.
func NewApp() *App {
	core.EnsureDataDirs()
	dataDir := core.DataDir()

	cm := core.NewConfigManager(dataDir)
	detector := engine.NewDetector()
	se := engine.NewSaveEditor(core.BackupsDir())
	events := services.NewEventsService()

	folder, auto := cm.GetSyncSettings()
	sync := services.NewSyncService(folder, auto)

	return &App{
		configManager: cm,
		detector:      detector,
		saveEditor:    se,
		eventsService: events,
		syncService:   sync,
		activeGame:    &core.ActiveSession{},
	}
}

// startup is called by Wails when the application starts.
func (a *App) startup(ctx context.Context) {
	// Application initialization if needed
}

// ──────────────────────────────────────────────────────────
//  Config Commands
// ──────────────────────────────────────────────────────────

// GetConfig returns the current configuration.
func (a *App) GetConfig() core.AppConfig {
	return a.configManager.Get()
}

// UpdateConfig replaces the configuration.
func (a *App) UpdateConfig(cfg core.AppConfig) (map[string]interface{}, error) {
	err := a.configManager.Update(cfg)
	if err != nil {
		return nil, err
	}
	return map[string]interface{}{"ok": true, "config": cfg}, nil
}

// ResetConfig restores default configuration.
func (a *App) ResetConfig() (map[string]interface{}, error) {
	cfg := core.DefaultConfig()
	err := a.configManager.Update(cfg)
	if err != nil {
		return nil, err
	}
	return map[string]interface{}{"ok": true, "config": cfg}, nil
}

// GetGamesDir returns the configured games directory.
func (a *App) GetGamesDir() string {
	return a.configManager.GetGamesDir()
}

// GetDataDir returns the application data directory.
func (a *App) GetDataDir() string {
	return core.DataDir()
}

// ──────────────────────────────────────────────────────────
//  Game Commands
// ──────────────────────────────────────────────────────────

// GetGames scans and returns the list of games.
func (a *App) GetGames() (core.ScanResult, error) {
	gamesDir := a.configManager.GetGamesDir()
	games, err := a.detector.ScanGames(gamesDir)
	if err != nil {
		return core.ScanResult{}, fmt.Errorf("error scanning games: %w", err)
	}
	// Enrich with saved state
	for i := range games {
		state := a.loadGameState(games[i].Name)
		if fav, ok := state["favorite"].(bool); ok {
			games[i].Favorite = fav
		}
		if sec, ok := state["seconds"].(float64); ok {
			games[i].Seconds = uint64(sec)
		}
		if lp, ok := state["last_played"].(float64); ok {
			v := uint64(lp)
			games[i].LastPlayed = &v
		}
	}
	sortGames(games)
	return core.ScanResult{Games: games, Total: len(games)}, nil
}

// LaunchGame starts a game (web or native).
func (a *App) LaunchGame(name, gamePath, engineName string) (*core.LaunchResult, error) {
	if !dirExists(gamePath) {
		return nil, fmt.Errorf("game directory does not exist")
	}

	isWeb := engine.IsWebEngine(engineName)

	if isWeb {
		// Stop previous server
		if a.activeServer != nil {
			a.activeServer.Stop()
			a.activeServer = nil
		}

		port := engine.StablePort(name)
		server := services.NewGameServer(gamePath, port)
		actualPort, err := server.Start(name)
		if err != nil {
			return nil, fmt.Errorf("error starting HTTP server: %w", err)
		}

		a.activeServer = server
		now := time.Now().Unix()
		a.activeGame = &core.ActiveSession{
			GameName:  &name,
			Port:      &actualPort,
			StartTime: &now,
			Running:   true,
		}
		a.eventsService.Emit(services.EventServerStarted, map[string]interface{}{
			"game": name, "port": actualPort,
		})

		return &core.LaunchResult{OK: true, Game: name, Type: "web", Port: &actualPort}, nil
	}

	// Native game
	pm := engine.NewProcessManager()
	if err := pm.LaunchNativeGame(name, gamePath, engineName); err != nil {
		return nil, fmt.Errorf("error launching game: %w", err)
	}

	now := time.Now().Unix()
	a.activeGame = &core.ActiveSession{
		GameName:  &name,
		StartTime: &now,
		Running:   true,
	}
	a.eventsService.Emit(services.EventGameLaunched, map[string]interface{}{
		"game": name, "engine": engineName,
	})

	return &core.LaunchResult{OK: true, Game: name, Engine: &engineName}, nil
}

// StopGame stops the currently active game.
func (a *App) StopGame() (map[string]interface{}, error) {
	if !a.activeGame.Running {
		return map[string]interface{}{"ok": true, "game": nil, "seconds_added": 0}, nil
	}

	gameName := ""
	var elapsed int64
	if a.activeGame.GameName != nil {
		gameName = *a.activeGame.GameName
	}
	if a.activeGame.StartTime != nil {
		elapsed = time.Now().Unix() - *a.activeGame.StartTime
	}

	// Stop server
	if a.activeServer != nil {
		a.activeServer.Stop()
		a.activeServer = nil
	}

	// Update play time
	if gameName != "" && elapsed > 0 {
		a.updatePlayTime(gameName, uint64(elapsed))
	}

	a.activeGame = &core.ActiveSession{}
	a.eventsService.Emit(services.EventServerStopped, map[string]interface{}{
		"game": gameName, "seconds_added": elapsed,
	})

	return map[string]interface{}{
		"ok": true, "game": gameName, "seconds_added": elapsed,
	}, nil
}

// ToggleFavorite toggles the favorite state of a game.
func (a *App) ToggleFavorite(gameName string) (map[string]interface{}, error) {
	state := a.loadGameState(gameName)
	current, _ := state["favorite"].(bool)
	newFav := !current

	a.saveGameState(gameName, map[string]interface{}{"favorite": newFav})
	return map[string]interface{}{"ok": true, "name": gameName, "favorite": newFav}, nil
}

// DetectGameEngine detects the engine for a game path.
func (a *App) DetectGameEngine(gamePath string) (map[string]interface{}, error) {
	if !dirExists(gamePath) {
		return nil, fmt.Errorf("game directory does not exist")
	}
	root, engineName, ok := a.detector.DetectEngine(gamePath)
	if !ok {
		return map[string]interface{}{"ok": false}, nil
	}
	return map[string]interface{}{
		"ok":           true,
		"root":         root,
		"engine":       engineName,
		"engine_label": engine.EngineLabel(engineName),
		"is_web":       engine.IsWebEngine(engineName),
		"is_incomplete": engine.IsIncomplete(engineName),
	}, nil
}

// ──────────────────────────────────────────────────────────
//  Decrypter Commands
// ──────────────────────────────────────────────────────────

// DecryptGameAssets decrypts all encrypted assets in a game directory.
func (a *App) DecryptGameAssets(gamePath, encryptionKey string) (map[string]interface{}, error) {
	if !dirExists(gamePath) {
		return nil, fmt.Errorf("game directory does not exist")
	}
	d, err := engine.NewDecrypter(encryptionKey)
	if err != nil {
		return nil, err
	}
	success, failed, _, err := d.DecryptDirectory(gamePath)
	if err != nil {
		return nil, err
	}
	return map[string]interface{}{
		"success_count": success,
		"failed_count":  failed,
		"total_files":   success + failed,
	}, nil
}

// ReadEncryptionKey reads the encryption key from rpg_project.json.
func (a *App) ReadEncryptionKey(gamePath string) (*string, error) {
	key, err := engine.ReadKeyFromProject(gamePath)
	if err != nil || key == "" {
		return nil, err
	}
	return &key, nil
}

// HasEncryptedAssets checks if a game has encrypted assets.
func (a *App) HasEncryptedAssets(gamePath string) bool {
	return engine.HasEncryptedAssets(gamePath)
}

// ──────────────────────────────────────────────────────────
//  Save Editor Commands
// ──────────────────────────────────────────────────────────

// GetSaves lists save files for a game.
func (a *App) GetSaves(gamePath string) (map[string]interface{}, error) {
	savesDir := filepath.Join(gamePath, "save")
	if !dirExists(savesDir) {
		return map[string]interface{}{"saves": []core.SaveFileInfo{}, "count": 0}, nil
	}

	var saves []core.SaveFileInfo
	entries, _ := os.ReadDir(savesDir)
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		info, _ := e.Info()
		saves = append(saves, core.SaveFileInfo{
			Name:      e.Name(),
			SizeBytes: info.Size(),
			SizeKB:    float64(info.Size()) / 1024,
			MTime:     info.ModTime().Unix(),
			MTimeStr:  info.ModTime().Format("02/01/2006 15:04"),
		})
	}
	return map[string]interface{}{
		"saves": saves, "saves_dir": savesDir, "count": len(saves),
	}, nil
}

// GetSaveContent returns the parsed content of a save file.
func (a *App) GetSaveContent(gamePath, saveName string) (*core.SaveInfo, error) {
	savePath := filepath.Join(gamePath, "save", saveName)
	return a.saveEditor.GetSaveInfo(savePath)
}

// UpdateSaveContent applies updates to a save file.
func (a *App) UpdateSaveContent(gamePath, saveName string, updates map[string]interface{}) (bool, error) {
	savePath := filepath.Join(gamePath, "save", saveName)
	if !fileExists(savePath) {
		return false, fmt.Errorf("save file does not exist")
	}
	err := a.saveEditor.UpdateSave(savePath, updates)
	return err == nil, err
}

// BackupSave creates a backup of a save file.
func (a *App) BackupSave(gamePath, saveName string) (string, error) {
	savePath := filepath.Join(gamePath, "save", saveName)
	if !fileExists(savePath) {
		return "", fmt.Errorf("save file does not exist")
	}
	ts := time.Now().Format("20060102-150405")
	gameName := filepath.Base(filepath.Dir(filepath.Dir(savePath)))
	backupDir := filepath.Join(core.BackupsDir(), gameName, "save-edit-"+ts)
	os.MkdirAll(backupDir, 0755)
	data, _ := os.ReadFile(savePath)
	backupPath := filepath.Join(backupDir, saveName)
	os.WriteFile(backupPath, data, 0644)
	return backupPath, nil
}

// ──────────────────────────────────────────────────────────
//  Plugin Commands
// ──────────────────────────────────────────────────────────

// GetPlugins returns plugin status for a game.
func (a *App) GetPlugins(gamePath string) (map[string]interface{}, error) {
	status, err := engine.GetPluginsStatus(gamePath)
	if err != nil {
		return nil, err
	}
	return map[string]interface{}{
		"ok":         true,
		"plugins":    status.Plugins,
		"has_backup": status.HasBackup,
	}, nil
}

// TogglePlugins enables/disables plugins.
func (a *App) TogglePlugins(gamePath string, names []string, status bool, all bool) (map[string]interface{}, error) {
	modified, err := engine.TogglePlugins(gamePath, names, status, all)
	if err != nil {
		return nil, err
	}
	action := "activated"
	if !status {
		action = "deactivated"
	}
	return map[string]interface{}{
		"ok":       true,
		"modified": modified,
		"message":  fmt.Sprintf("%d plugin(s) %s", len(modified), action),
	}, nil
}

// RestorePlugins restores plugins.js from backup.
func (a *App) RestorePlugins(gamePath string) (map[string]interface{}, error) {
	err := engine.RestorePlugins(gamePath)
	if err != nil {
		return nil, err
	}
	return map[string]interface{}{"ok": true, "message": "plugins.js restored"}, nil
}

// ──────────────────────────────────────────────────────────
//  Tools Commands
// ──────────────────────────────────────────────────────────

// GetData reads RPG Maker database files (Items, Weapons, etc.).
func (a *App) GetData(gamePath, category string) (*core.DataResult, error) {
	dataDir := filepath.Join(gamePath, "data")
	if !dirExists(dataDir) {
		return nil, fmt.Errorf("data directory not found")
	}

	fnMap := map[string]string{
		"Items":   "Items.json",
		"Weapons": "Weapons.json",
		"Armors":  "Armors.json",
		"Skills":  "Skills.json",
		"Enemies": "Enemies.json",
	}
	targetFn := fnMap[category]
	if targetFn == "" {
		targetFn = "Items.json"
	}

	base := strings.TrimSuffix(targetFn, ".json")
	candidates := []string{
		targetFn, base + ".rpgmdata", base + ".json_", base + ".rndata",
	}

	for _, cand := range candidates {
		p := filepath.Join(dataDir, cand)
		if !fileExists(p) {
			continue
		}
		items, err := readDataFile(p, category)
		if err != nil {
			continue
		}
		return &core.DataResult{Category: category, Items: items, Count: len(items)}, nil
	}
	return &core.DataResult{Category: category, Items: nil, Count: 0}, nil
}

// SetupMods creates a mods directory with an example mod.
func (a *App) SetupMods(gamePath string) (*core.ModsResult, error) {
	if !dirExists(gamePath) {
		return nil, fmt.Errorf("game directory does not exist")
	}
	modsDir := filepath.Join(gamePath, "mods")
	created := !dirExists(modsDir)
	os.MkdirAll(modsDir, 0755)

	examplePath := filepath.Join(modsDir, "ejemplo.js")
	if !fileExists(examplePath) {
		os.WriteFile(examplePath, []byte(modExample), 0644)
	}

	var mods []string
	entries, _ := os.ReadDir(modsDir)
	for _, e := range entries {
		if !e.IsDir() && strings.HasSuffix(e.Name(), ".js") {
			mods = append(mods, e.Name())
		}
	}
	return &core.ModsResult{OK: true, ModsDir: modsDir, Created: created, Mods: mods}, nil
}

// OpenTarget opens a folder or URL in the system default handler.
func (a *App) OpenTarget(target string) bool {
	if strings.HasPrefix(target, "http://") || strings.HasPrefix(target, "https://") {
		go openWithxdg(target)
		return true
	}
	if dirExists(target) {
		go openWithxdg(target)
		return true
	}
	return false
}

// GetStatus returns the current application status.
func (a *App) GetStatus() map[string]interface{} {
	result := map[string]interface{}{
		"version":    "1.0.0-go",
		"running":    a.activeGame.Running,
		"active_game": nil,
		"port":        nil,
	}
	if a.activeGame.GameName != nil {
		result["active_game"] = *a.activeGame.GameName
	}
	if a.activeGame.Port != nil {
		result["port"] = *a.activeGame.Port
	}
	if a.activeGame.StartTime != nil {
		result["uptime_seconds"] = time.Now().Unix() - *a.activeGame.StartTime
	}
	return result
}

// CheckUpdate checks for updates from GitHub.
func (a *App) CheckUpdate() (*core.UpdateResult, error) {
	client := &http.Client{Timeout: 8 * time.Second}
	req, _ := http.NewRequest("GET", "https://api.github.com/repos/AsterrZep/rpgmaker-launcher/releases/latest", nil)
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("User-Agent", "rpgmaker-launcher")

	resp, err := client.Do(req)
	if err != nil {
		return &core.UpdateResult{CurrentVersion: "1.0.0-go", URL: "https://github.com/AsterrZep/rpgmaker-launcher/releases"}, nil
	}
	defer resp.Body.Close()

	var data map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&data)

	tag, _ := data["tag_name"].(string)
	return &core.UpdateResult{
		UpdateAvailable: versionNewer(tag, "1.0.0-go"),
		TagName:         tag,
		CurrentVersion:  "1.0.0-go",
		URL:             "https://github.com/AsterrZep/rpgmaker-launcher/releases",
	}, nil
}

// Ping is a diagnostic ping.
func (a *App) Ping() string {
	return "pong v1.0.0-go"
}

// ──────────────────────────────────────────────────────────
//  Event Commands
// ──────────────────────────────────────────────────────────

// GetEventHistory returns recent events.
func (a *App) GetEventHistory(limit int) []services.EventData {
	return a.eventsService.GetHistory(limit)
}

// ClearEventHistory clears the event history.
func (a *App) ClearEventHistory() {
	a.eventsService.ClearHistory()
}

// ──────────────────────────────────────────────────────────
//  Sync Commands
// ──────────────────────────────────────────────────────────

// GetSyncStatus returns the sync status.
func (a *App) GetSyncStatus() map[string]interface{} {
	folder, auto := a.configManager.GetSyncSettings()
	games, _ := a.GetGames()
	type gameSummary struct {
		Name        string `json:"name"`
		LocalSaves  int    `json:"local_saves"`
		DestSaves   int    `json:"dest_saves"`
	}
	var summaries []gameSummary
	for _, g := range games.Games {
		summaries = append(summaries, gameSummary{Name: g.Name, LocalSaves: -1, DestSaves: -1})
	}
	return map[string]interface{}{
		"destination": folder,
		"auto_sync":   auto,
		"games":       summaries,
	}
}

// ExecuteSync runs a sync operation.
func (a *App) ExecuteSync(mode string, folder string) (map[string]interface{}, error) {
	if folder != "" {
		a.syncService.DestFolder = folder
	}
	if !a.syncService.IsConfigured() {
		return nil, fmt.Errorf("destination folder not configured")
	}
	games, err := a.GetGames()
	if err != nil {
		return nil, err
	}
	results := a.syncService.SyncAll(games.Games, mode)
	return map[string]interface{}{"results": results}, nil
}

// ──────────────────────────────────────────────────────────
//  Rescan / Install
// ──────────────────────────────────────────────────────────

// RescanGames re-scans the games directory.
func (a *App) RescanGames() (core.ScanResult, error) {
	return a.GetGames()
}

// ExtractZips extracts ZIP files into the games directory.
func (a *App) ExtractZips(paths []string, autoDelete bool) (map[string]interface{}, error) {
	gamesDir := a.configManager.GetGamesDir()
	result := engine.ExtractZips(paths, gamesDir, autoDelete)
	games, _ := a.GetGames()
	return map[string]interface{}{
		"extracted": result.Extracted,
		"errors":   result.Errors,
		"games":    games.Games,
	}, nil
}

// ExtractZipsInDir scans games dir for ZIPs and extracts them.
func (a *App) ExtractZipsInDir(autoDelete bool) (map[string]interface{}, error) {
	gamesDir := a.configManager.GetGamesDir()
	result := engine.ExtractZipsInDir(gamesDir, autoDelete)
	games, _ := a.GetGames()
	return map[string]interface{}{
		"extracted": result.Extracted,
		"errors":   result.Errors,
		"games":    games.Games,
	}, nil
}

// InstallZips copies and extracts ZIP files from local paths.
func (a *App) InstallZips(paths []string, autoDelete bool) (map[string]interface{}, error) {
	gamesDir := a.configManager.GetGamesDir()
	os.MkdirAll(gamesDir, 0755)

	var copied, skipped []string
	for _, p := range paths {
		if !fileExists(p) || !strings.HasSuffix(strings.ToLower(p), ".zip") {
			skipped = append(skipped, p)
			continue
		}
		dest := filepath.Join(gamesDir, filepath.Base(p))
		data, err := os.ReadFile(p)
		if err != nil {
			skipped = append(skipped, p)
			continue
		}
		if err := os.WriteFile(dest, data, 0644); err != nil {
			skipped = append(skipped, p)
			continue
		}
		copied = append(copied, dest)
	}

	result := engine.ExtractZips(copied, gamesDir, autoDelete)
	games, _ := a.GetGames()
	return map[string]interface{}{
		"copied":    copied,
		"skipped":   skipped,
		"extracted": result.Extracted,
		"errors":    result.Errors,
		"games":     games.Games,
	}, nil
}

// ──────────────────────────────────────────────────────────
//  Internal helpers
// ──────────────────────────────────────────────────────────

func (a *App) loadGameState(gameName string) map[string]interface{} {
	stateFile := filepath.Join(core.DataDir(), "launcher-state.json")
	data, err := os.ReadFile(stateFile)
	if err != nil {
		return map[string]interface{}{}
	}
	var state map[string]interface{}
	if err := json.Unmarshal(data, &state); err != nil {
		return map[string]interface{}{}
	}
	games, _ := state["games"].(map[string]interface{})
	if games == nil {
		return map[string]interface{}{}
	}
	gameState, _ := games[gameName].(map[string]interface{})
	if gameState == nil {
		return map[string]interface{}{}
	}
	return gameState
}

func (a *App) saveGameState(gameName string, updates map[string]interface{}) {
	stateFile := filepath.Join(core.DataDir(), "launcher-state.json")
	state := map[string]interface{}{"games": map[string]interface{}{}}
	data, err := os.ReadFile(stateFile)
	if err == nil {
		json.Unmarshal(data, &state)
	}
	games, _ := state["games"].(map[string]interface{})
	gameState, _ := games[gameName].(map[string]interface{})
	if gameState == nil {
		gameState = map[string]interface{}{}
	}
	for k, v := range updates {
		gameState[k] = v
	}
	games[gameName] = gameState
	data, _ = json.MarshalIndent(state, "", "  ")
	os.WriteFile(stateFile, data, 0644)
}

func (a *App) updatePlayTime(gameName string, seconds uint64) {
	state := a.loadGameState(gameName)
	current, _ := state["seconds"].(float64)
	a.saveGameState(gameName, map[string]interface{}{
		"seconds":      uint64(current) + seconds,
		"last_played":  time.Now().Unix(),
	})
}

func versionNewer(tag, current string) bool {
	// Simple version comparison
	parse := func(s string) []int {
		s = strings.TrimLeft(s, "v")
		var parts []int
		for _, p := range strings.Split(s, ".") {
			var n int
			fmt.Sscanf(p, "%d", &n)
			parts = append(parts, n)
		}
		return parts
	}
	t, c := parse(tag), parse(current)
	for i := 0; i < len(t) && i < len(c); i++ {
		if t[i] > c[i] {
			return true
		}
		if t[i] < c[i] {
			return false
		}
	}
	return false
}

func openWithxdg(target string) {
	cmd := exec.Command("xdg-open", target)
	cmd.Start()
}

// readDataFile reads an RPG Maker data file and returns items.
func readDataFile(path, category string) ([]core.DataItem, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	// Skip RPG Maker header if present
	if len(data) > 16 && (strings.HasPrefix(string(data[:5]), "RPGMV") || strings.HasPrefix(string(data[:5]), "RGGO")) {
		data = data[16:]
	}

	var parsed []map[string]interface{}
	if err := json.Unmarshal(data, &parsed); err != nil {
		return nil, err
	}

	var items []core.DataItem
	for idx, entry := range parsed {
		if entry == nil {
			continue
		}
		name, _ := entry["name"].(string)
		if name == "" {
			continue
		}
		id := uint32(idx)
		if v, ok := entry["id"].(float64); ok {
			id = uint32(v)
		}
		desc, _ := entry["description"].(string)

		item := core.DataItem{ID: id, Name: name, Description: desc}

		if category == "Items" || category == "Weapons" || category == "Armors" {
			if v, ok := entry["price"].(float64); ok {
				p := uint32(v)
				item.Price = &p
			}
		}
		if params, ok := entry["params"].([]interface{}); ok {
			getP := func(i int) *uint32 {
				if i < len(params) {
					if v, ok := params[i].(float64); ok {
						p := uint32(v)
						return &p
					}
				}
				return nil
			}
			switch category {
			case "Weapons":
				item.Atk = getP(2)
			case "Armors":
				item.Def = getP(3)
			case "Skills":
				if v, ok := entry["mpCost"].(float64); ok {
					p := uint32(v)
					item.MpCost = &p
				}
			case "Enemies":
				item.HP = getP(0)
				if v, ok := entry["exp"].(float64); ok {
					p := uint32(v)
					item.Exp = &p
				}
				if v, ok := entry["gold"].(float64); ok {
					p := uint32(v)
					item.Gold = &p
				}
			}
		}
		items = append(items, item)
	}
	return items, nil
}

func sortGames(games []core.GameInfo) {
	for i := 0; i < len(games); i++ {
		for j := i + 1; j < len(games); j++ {
			a, b := games[j], games[i]
			if a.IsIncomplete && !b.IsIncomplete {
				games[i], games[j] = games[j], games[i]
			} else if a.Favorite && !b.Favorite {
				games[i], games[j] = games[j], games[i]
			}
		}
	}
}

const modExample = `// ============================================================
//  Mod de ejemplo para RPG Maker Launcher
// ============================================================
(function () {
    "use strict";
    document.addEventListener("keydown", function (ev) {
        if (ev.key === "F10") {
            ev.preventDefault();
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                document.documentElement.requestFullscreen();
            }
        }
    });
})();`

// dirExists and fileExists helpers
func dirExists(path string) bool {
	info, err := os.Stat(path)
	return err == nil && info.IsDir()
}

func fileExists(path string) bool {
	info, err := os.Stat(path)
	return err == nil && !info.IsDir()
}
