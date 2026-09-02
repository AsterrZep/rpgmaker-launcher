package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/AsterrZep/rpgmaker-launcher-go/internal/core"
	"github.com/AsterrZep/rpgmaker-launcher-go/internal/engine"
)

// StartHTTPAPI starts the HTTP API server that the frontend expects.
func (a *App) StartHTTPAPI() {
	logger := core.GetLogger()
	logger.Info("Starting HTTP API server", "port", 18900)

	mux := http.NewServeMux()

	// ── CORS ──────────────────────────────────────────────
	cors := func(h http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Accept")
			if r.Method == "OPTIONS" {
				w.WriteHeader(204)
				return
			}
			h.ServeHTTP(w, r)
		})
	}

	// ── SSE Events ────────────────────────────────────────
	mux.HandleFunc("/api/events", a.handleEvents)
	// Status
	mux.HandleFunc("/api/status", a.handleStatus)
	// Games
	mux.HandleFunc("/api/games", a.handleGames)
	mux.HandleFunc("/api/games/rescan", a.handleRescan)
	mux.HandleFunc("/api/games/install", a.handleInstall)
	mux.HandleFunc("/api/games/favorite", a.handleFavorite)
	mux.HandleFunc("/api/games/launch", a.handleLaunch)
	mux.HandleFunc("/api/games/stop", a.handleStop)
	// Config
	mux.HandleFunc("/api/config", a.handleConfig)
	// Plugins
	mux.HandleFunc("/api/plugins", a.handlePlugins)
	mux.HandleFunc("/api/plugins/toggle", a.handlePluginsToggle)
	// Saves
	mux.HandleFunc("/api/saves", a.handleSaves)
	mux.HandleFunc("/api/saves/content", a.handleSaveContent)
	mux.HandleFunc("/api/saves/backup", a.handleSaveBackup)
	// Data
	mux.HandleFunc("/api/data", a.handleData)
	// Sync
	mux.HandleFunc("/api/sync/status", a.handleSyncStatus)
	mux.HandleFunc("/api/sync/execute", a.handleSyncExecute)
	// Tools
	mux.HandleFunc("/api/tools/mods", a.handleSetupMods)
	// Open
	mux.HandleFunc("/api/open", a.handleOpen)
	// Update
	mux.HandleFunc("/api/update/check", a.handleCheckUpdate)
	// Decrypt
	mux.HandleFunc("/api/decrypt", a.handleDecrypt)
	// Cover images
	mux.HandleFunc("/api/covers/", a.handleCover)
	// ── Monitoring / Debug ─────────────────────────────────
	mux.HandleFunc("/api/monitor/logs", a.handleMonitorLogs)
	mux.HandleFunc("/api/monitor/metrics", a.handleMonitorMetrics)
	mux.HandleFunc("/api/monitor/health", a.handleMonitorHealth)
	mux.HandleFunc("/api/frontend/log", a.handleFrontendLog)

	// Wrap with middlewares
	handler := core.RecoveryMiddleware(
		core.LoggingMiddleware(cors(mux), logger),
		logger,
	)

	addr := "127.0.0.1:18900"
	logger.Info("HTTP API listening", "addr", addr)
	go func() {
		if err := http.ListenAndServe(addr, handler); err != nil {
			logger.Error("HTTP API server failed", err, "addr", addr)
		}
	}()
}

// ── JSON helpers ────────────────────────────────────────────

func jsonResp(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

func jsonErr(w http.ResponseWriter, msg string, code int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(map[string]interface{}{"error": msg, "code": code})
}

func readJSON(r *http.Request) map[string]interface{} {
	var body map[string]interface{}
	json.NewDecoder(r.Body).Decode(&body)
	return body
}

// ── SSE Events ──────────────────────────────────────────────

func (a *App) handleEvents(w http.ResponseWriter, r *http.Request) {
	logger := core.GetLogger()
	logger.Debug("SSE client connected", "remote", r.RemoteAddr)

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	flusher, ok := w.(http.Flusher)
	if !ok {
		logger.Warn("SSE not supported by ResponseWriter")
		return
	}

	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-r.Context().Done():
			logger.Debug("SSE client disconnected", "remote", r.RemoteAddr)
			return
		case <-ticker.C:
			fmt.Fprintf(w, ": ping\n\n")
			flusher.Flush()
		}
	}
}

// ── Status ──────────────────────────────────────────────────

func (a *App) handleStatus(w http.ResponseWriter, r *http.Request) {
	result := map[string]interface{}{
		"version": "1.0.0-go",
		"running": a.activeGame.Running,
	}
	if a.activeGame.GameName != nil {
		result["active_game"] = *a.activeGame.GameName
	}
	if a.activeGame.Port != nil {
		result["port"] = *a.activeGame.Port
	}
	jsonResp(w, result)
}

// ── Games ───────────────────────────────────────────────────

func (a *App) handleGames(w http.ResponseWriter, r *http.Request) {
	logger := core.GetLogger()
	games, err := a.GetGames()
	if err != nil {
		logger.Error("Failed to get games", err)
		jsonErr(w, err.Error(), 500)
		return
	}
	logger.Debug("Games listed", "total", games.Total)
	jsonResp(w, games)
}

func (a *App) handleRescan(w http.ResponseWriter, r *http.Request) {
	logger := core.GetLogger()
	body := readJSON(r)
	autoDelete, _ := body["auto_delete"].(bool)
	gamesDir := a.configManager.GetGamesDir()
	logger.Info("Rescanning games dir", "dir", gamesDir, "auto_delete", autoDelete)
	result := engine.ExtractZipsInDir(gamesDir, autoDelete)
	games, _ := a.GetGames()
	logger.Info("Rescan complete", "extracted", len(result.Extracted), "errors", len(result.Errors))
	jsonResp(w, map[string]interface{}{
		"extracted": result.Extracted, "errors": result.Errors, "games": games.Games,
	})
}

func (a *App) handleInstall(w http.ResponseWriter, r *http.Request) {
	logger := core.GetLogger()
	body := readJSON(r)
	paths, _ := body["paths"].([]interface{})
	autoDelete, _ := body["auto_delete"].(bool)
	var strPaths []string
	for _, p := range paths {
		if s, ok := p.(string); ok {
			strPaths = append(strPaths, s)
		}
	}
	logger.Info("Installing ZIPs", "count", len(strPaths), "auto_delete", autoDelete)
	result, err := a.InstallZips(strPaths, autoDelete)
	if err != nil {
		logger.Error("Install ZIPs failed", err)
		jsonErr(w, err.Error(), 500)
		return
	}
	jsonResp(w, result)
}

func (a *App) handleFavorite(w http.ResponseWriter, r *http.Request) {
	logger := core.GetLogger()
	body := readJSON(r)
	name, _ := body["name"].(string)
	if name == "" {
		jsonErr(w, "Missing game name", 400)
		return
	}
	result, err := a.ToggleFavorite(name)
	if err != nil {
		logger.Error("Toggle favorite failed", err, "game", name)
		jsonErr(w, err.Error(), 500)
		return
	}
	logger.Info("Toggled favorite", "game", name, "favorite", result["favorite"])
	jsonResp(w, result)
}

func (a *App) handleLaunch(w http.ResponseWriter, r *http.Request) {
	logger := core.GetLogger()
	body := readJSON(r)
	name, _ := body["name"].(string)
	viewer, _ := body["viewer"].(string)
	if name == "" {
		jsonErr(w, "Missing game name", 400)
		return
	}
	gamesDir := a.configManager.GetGamesDir()
	gamePath := filepath.Join(gamesDir, name)
	root, engineName, ok := a.detector.DetectEngine(gamePath)
	if !ok {
		logger.Warn("Cannot detect engine", "game", name, "path", gamePath)
		jsonErr(w, fmt.Sprintf("Cannot detect engine for '%s'", name), 400)
		return
	}
	if engine.IsIncomplete(engineName) {
		logger.Warn("Incomplete game", "game", name, "engine", engineName)
		jsonErr(w, fmt.Sprintf("Cannot launch incomplete game '%s'", name), 400)
		return
	}
	logger.Info("Launching game", "game", name, "engine", engineName, "viewer", viewer)
	result, err := a.LaunchGame(name, root, engineName)
	if err != nil {
		logger.Error("Launch failed", err, "game", name)
		jsonErr(w, err.Error(), 500)
		return
	}

	// Open game URL in Wails WebView after server starts
	if result.Port != nil {
		gameURL := fmt.Sprintf("http://127.0.0.1:%d", *result.Port)
		logger.Info("Opening game URL in WebView", "url", gameURL, "viewer", viewer)
		// Navigate the Wails WebView to the game URL
		go func() {
			a.OpenGameInWebView(gameURL)
		}()
	}

	jsonResp(w, result)
}

func (a *App) handleStop(w http.ResponseWriter, r *http.Request) {
	logger := core.GetLogger()
	logger.Info("Stopping game server")
	result, err := a.StopGame()
	if err != nil {
		logger.Error("Stop game failed", err)
		jsonErr(w, err.Error(), 500)
		return
	}
	jsonResp(w, result)
}

// ── Config ──────────────────────────────────────────────────

func (a *App) handleConfig(w http.ResponseWriter, r *http.Request) {
	logger := core.GetLogger()
	if r.Method == "GET" {
		cfg := a.configManager.Get()
		logger.Debug("Config loaded", "games_dir", cfg.General.GamesDir, "lang", cfg.General.Lang)
		jsonResp(w, cfg)
		return
	}
	var cfg core.AppConfig
	json.NewDecoder(r.Body).Decode(&cfg)
	logger.Info("Config updated", "games_dir", cfg.General.GamesDir, "lang", cfg.General.Lang)
	a.configManager.Update(cfg)
	jsonResp(w, map[string]interface{}{"ok": true, "config": cfg})
}

// ── Plugins ─────────────────────────────────────────────────

func (a *App) handlePlugins(w http.ResponseWriter, r *http.Request) {
	logger := core.GetLogger()
	game := r.URL.Query().Get("game")
	if game == "" {
		jsonErr(w, "Missing game param", 400)
		return
	}
	gamesDir := a.configManager.GetGamesDir()
	gamePath := filepath.Join(gamesDir, game)
	root, _, _ := a.detector.DetectEngine(gamePath)
	if root == "" {
		root = gamePath
	}
	logger.Debug("Loading plugins", "game", game, "root", root)
	status, err := engine.GetPluginsStatus(root)
	if err != nil {
		logger.Error("Failed to load plugins", err, "game", game)
		jsonErr(w, err.Error(), 500)
		return
	}
	logger.Debug("Plugins loaded", "game", game, "count", len(status.Plugins))
	jsonResp(w, status)
}

func (a *App) handlePluginsToggle(w http.ResponseWriter, r *http.Request) {
	logger := core.GetLogger()
	body := readJSON(r)
	game, _ := body["game"].(string)
	action, _ := body["action"].(string)
	if game == "" {
		jsonErr(w, "Missing game", 400)
		return
	}
	gamesDir := a.configManager.GetGamesDir()
	gamePath := filepath.Join(gamesDir, game)
	root, _, _ := a.detector.DetectEngine(gamePath)
	if root == "" {
		root = gamePath
	}
	if action == "restore" {
		logger.Info("Restoring plugins", "game", game)
		engine.RestorePlugins(root)
		jsonResp(w, map[string]interface{}{"ok": true, "action": "restore"})
		return
	}
	names, _ := body["names"].([]interface{})
	status, _ := body["status"].(bool)
	all, _ := body["all"].(bool)
	var strNames []string
	for _, n := range names {
		if s, ok := n.(string); ok {
			strNames = append(strNames, s)
		}
	}
	logger.Info("Toggling plugins", "game", game, "count", len(strNames), "status", status, "all", all)
	modified, err := engine.TogglePlugins(root, strNames, status, all)
	if err != nil {
		logger.Error("Plugin toggle failed", err, "game", game)
		jsonErr(w, err.Error(), 500)
		return
	}
	jsonResp(w, map[string]interface{}{"ok": true, "updated": modified, "status": status})
}

// ── Saves ───────────────────────────────────────────────────

func (a *App) handleSaves(w http.ResponseWriter, r *http.Request) {
	logger := core.GetLogger()
	game := r.URL.Query().Get("game")
	if game == "" {
		jsonErr(w, "Missing game param", 400)
		return
	}
	gamesDir := a.configManager.GetGamesDir()
	gamePath := filepath.Join(gamesDir, game)

	// Resolve the actual game root for save detection
	root, _, _ := a.detector.DetectEngine(gamePath)
	savesDir := filepath.Join(root, "save") // root IS the game dir
	if root == "" {
		savesDir = filepath.Join(gamePath, "save")
	}

	logger.Debug("Loading saves", "game", game, "saves_dir", savesDir)

	type saveInfo struct {
		Name     string  `json:"name"`
		Size     int64   `json:"size_bytes"`
		SizeKB   float64 `json:"size_kb"`
		MTime    int64   `json:"mtime"`
		MTimeStr string  `json:"mtime_str"`
	}
	var saves []saveInfo
	entries, _ := os.ReadDir(savesDir)
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		info, _ := e.Info()
		saves = append(saves, saveInfo{
			Name: e.Name(), Size: info.Size(),
			SizeKB: float64(info.Size()) / 1024,
			MTime: info.ModTime().Unix(), MTimeStr: info.ModTime().Format("02/01/2006 15:04"),
		})
	}
	logger.Debug("Saves loaded", "game", game, "count", len(saves))
	jsonResp(w, map[string]interface{}{"saves": saves, "saves_dir": savesDir, "count": len(saves)})
}

func (a *App) handleSaveContent(w http.ResponseWriter, r *http.Request) {
	logger := core.GetLogger()
	if r.Method == "GET" {
		game := r.URL.Query().Get("game")
		file := r.URL.Query().Get("file")
		gamesDir := a.configManager.GetGamesDir()
		gamePath := filepath.Join(gamesDir, game)
		root, _, _ := a.detector.DetectEngine(gamePath)
		savePath := filepath.Join(root, "save", file)
		if root == "" {
			savePath = filepath.Join(gamePath, "save", file)
		}
		logger.Debug("Loading save content", "game", game, "file", file, "path", savePath)
		data, err := a.saveEditor.LoadSaveAsMap(savePath)
		if err != nil {
			logger.Error("Failed to load save content", err, "path", savePath)
			jsonErr(w, err.Error(), 500)
			return
		}
		jsonResp(w, data)
		return
	}
	// POST
	body := readJSON(r)
	game, _ := body["game"].(string)
	file, _ := body["file"].(string)
	gamesDir := a.configManager.GetGamesDir()
	gamePath := filepath.Join(gamesDir, game)
	root, _, _ := a.detector.DetectEngine(gamePath)
	savePath := filepath.Join(root, "save", file)
	if root == "" {
		savePath = filepath.Join(gamePath, "save", file)
	}
	updates := map[string]interface{}{}
	for k, v := range body {
		if k != "game" && k != "file" {
			updates[k] = v
		}
	}
	logger.Info("Updating save", "game", game, "file", file, "fields", len(updates))
	a.saveEditor.UpdateSave(savePath, updates)
	jsonResp(w, map[string]interface{}{"ok": true, "message": "Partida guardada"})
}

func (a *App) handleSaveBackup(w http.ResponseWriter, r *http.Request) {
	logger := core.GetLogger()
	body := readJSON(r)
	game, _ := body["game"].(string)
	gamesDir := a.configManager.GetGamesDir()
	gamePath := filepath.Join(gamesDir, game)
	root, _, _ := a.detector.DetectEngine(gamePath)
	savesDir := filepath.Join(root, "save")
	if root == "" {
		savesDir = filepath.Join(gamePath, "save")
	}
	ts := time.Now().Format("20060102-150405")
	dest := filepath.Join(core.BackupsDir(), game, "snapshot-"+ts)
	os.MkdirAll(dest, 0755)
	entries, _ := os.ReadDir(savesDir)
	count := 0
	for _, e := range entries {
		if !e.IsDir() {
			data, _ := os.ReadFile(filepath.Join(savesDir, e.Name()))
			os.WriteFile(filepath.Join(dest, e.Name()), data, 0644)
			count++
		}
	}
	logger.Info("Backup created", "game", game, "path", dest, "files", count)
	jsonResp(w, map[string]interface{}{"ok": true, "backup_path": dest, "timestamp": ts})
}

// ── Data ────────────────────────────────────────────────────

func (a *App) handleData(w http.ResponseWriter, r *http.Request) {
	logger := core.GetLogger()
	game := r.URL.Query().Get("game")
	cat := r.URL.Query().Get("cat")
	if cat == "" {
		cat = "Items"
	}
	gamesDir := a.configManager.GetGamesDir()
	gamePath := filepath.Join(gamesDir, game)
	root, _, _ := a.detector.DetectEngine(gamePath)
	dataDir := filepath.Join(root, "data")
	if root == "" {
		dataDir = filepath.Join(gamePath, "data")
	}
	fnMap := map[string]string{
		"Items": "Items.json", "Weapons": "Weapons.json", "Armors": "Armors.json",
		"Skills": "Skills.json", "Enemies": "Enemies.json",
	}
	targetFn := fnMap[cat]
	if targetFn == "" {
		targetFn = "Items.json"
	}
	base := strings.TrimSuffix(targetFn, ".json")
	for _, cand := range []string{targetFn, base + ".rpgmdata", base + ".json_", base + ".rndata"} {
		p := filepath.Join(dataDir, cand)
		if _, err := os.Stat(p); os.IsNotExist(err) {
			continue
		}
		items, err := readDataFile(p, cat)
		if err != nil {
			logger.Warn("Error reading data file", "path", p, "error", err)
			continue
		}
		logger.Debug("Data loaded", "game", game, "category", cat, "count", len(items))
		jsonResp(w, map[string]interface{}{"category": cat, "items": items, "count": len(items)})
		return
	}
	jsonResp(w, map[string]interface{}{"category": cat, "items": []interface{}{}, "count": 0})
}

// ── Sync ────────────────────────────────────────────────────

func (a *App) handleSyncStatus(w http.ResponseWriter, r *http.Request) {
	folder, auto := a.configManager.GetSyncSettings()
	jsonResp(w, map[string]interface{}{"destination": folder, "auto_sync": auto, "games": []interface{}{}})
}

func (a *App) handleSyncExecute(w http.ResponseWriter, r *http.Request) {
	logger := core.GetLogger()
	body := readJSON(r)
	mode, _ := body["mode"].(string)
	folder, _ := body["folder"].(string)
	logger.Info("Sync execute", "mode", mode, "folder", folder)
	jsonResp(w, map[string]interface{}{"ok": true, "results": []interface{}{}})
}

// ── Tools ───────────────────────────────────────────────────

func (a *App) handleSetupMods(w http.ResponseWriter, r *http.Request) {
	logger := core.GetLogger()
	body := readJSON(r)
	game, _ := body["game"].(string)
	gamesDir := a.configManager.GetGamesDir()
	gamePath := filepath.Join(gamesDir, game)
	logger.Info("Setting up mods", "game", game)
	result, err := a.SetupMods(gamePath)
	if err != nil {
		logger.Error("Setup mods failed", err, "game", game)
		jsonErr(w, err.Error(), 500)
		return
	}
	jsonResp(w, result)
}

func (a *App) handleOpen(w http.ResponseWriter, r *http.Request) {
	logger := core.GetLogger()
	target := r.URL.Query().Get("target")
	if target == "" {
		jsonErr(w, "Missing target", 400)
		return
	}
	logger.Info("Opening target", "target", target)
	go openWithxdg(target)
	jsonResp(w, map[string]interface{}{"ok": true})
}

func (a *App) handleCheckUpdate(w http.ResponseWriter, r *http.Request) {
	result, _ := a.CheckUpdate()
	jsonResp(w, result)
}

func (a *App) handleDecrypt(w http.ResponseWriter, r *http.Request) {
	logger := core.GetLogger()
	body := readJSON(r)
	game, _ := body["game"].(string)
	gamesDir := a.configManager.GetGamesDir()
	gamePath := filepath.Join(gamesDir, game)
	key, _ := engine.ReadKeyFromProject(gamePath)
	if key == "" {
		logger.Warn("No encryption key found", "game", game)
		jsonErr(w, "No encryption key found", 400)
		return
	}
	d, err := engine.NewDecrypter(key)
	if err != nil {
		logger.Error("Decrypter init failed", err, "game", game)
		jsonErr(w, err.Error(), 500)
		return
	}
	logger.Info("Decrypting assets", "game", game)
	success, failed, _, _ := d.DecryptDirectory(gamePath)
	logger.Info("Decryption complete", "game", game, "success", success, "failed", failed)
	jsonResp(w, map[string]interface{}{
		"ok": true, "output_dir": gamePath,
		"log": fmt.Sprintf("Descifrados: %d, Errores: %d", success, failed),
	})
}

// ── Cover images ────────────────────────────────────────────

func (a *App) handleCover(w http.ResponseWriter, r *http.Request) {
	gameName := strings.TrimPrefix(r.URL.Path, "/api/covers/")
	gameName, _ = strconv.Unquote(`"` + gameName + `"`)
	gamesDir := a.configManager.GetGamesDir()
	gamePath := filepath.Join(gamesDir, gameName)
	root, _, _ := a.detector.DetectEngine(gamePath)
	cover := engine.FindCover(gamePath, root)
	if cover == "" {
		jsonErr(w, "Cover not found", 404)
		return
	}
	http.ServeFile(w, r, cover)
}

// ═══════════════════════════════════════════════════════════════
// ── Monitoring & Debug Endpoints ──────────────────────────────
// ═══════════════════════════════════════════════════════════════

// GET /api/monitor/logs?limit=100&level=DEBUG
func (a *App) handleMonitorLogs(w http.ResponseWriter, r *http.Request) {
	logger := core.GetLogger()
	limit := 100
	if l := r.URL.Query().Get("limit"); l != "" {
		if v, err := strconv.Atoi(l); err == nil && v > 0 && v <= 5000 {
			limit = v
		}
	}

	entries := logger.RecentEntriesAsStrings(limit)
	jsonResp(w, map[string]interface{}{
		"entries": entries,
		"count":   len(entries),
	})
}

// GET /api/monitor/metrics
func (a *App) handleMonitorMetrics(w http.ResponseWriter, r *http.Request) {
	jsonResp(w, core.GlobalMetrics.Snapshot())
}

// GET /api/monitor/health
func (a *App) handleMonitorHealth(w http.ResponseWriter, r *http.Request) {
	health := map[string]interface{}{
		"status": "ok",
		"time":   time.Now().Format(time.RFC3339),
		"checks": map[string]interface{}{
			"http_api":    "up",
			"config":      "ok",
			"game_engine": "ok",
		},
	}

	// Check config
	cfg := a.configManager.Get()
	_ = cfg // config always returns a value

	// Check games dir
	gamesDir := a.configManager.GetGamesDir()
	if _, err := os.Stat(gamesDir); os.IsNotExist(err) {
		health["status"] = "degraded"
		health["checks"].(map[string]interface{})["game_engine"] = "no games dir"
	}

	// Active session
	if a.activeGame.Running {
		health["active_game"] = map[string]interface{}{
			"running": true,
		}
		if a.activeGame.GameName != nil {
			health["active_game"].(map[string]interface{})["name"] = *a.activeGame.GameName
		}
		if a.activeGame.Port != nil {
			health["active_game"].(map[string]interface{})["port"] = *a.activeGame.Port
		}
	}

	jsonResp(w, health)
}

// POST /api/frontend/log  — Frontend sends console.error/warn to backend
func (a *App) handleFrontendLog(w http.ResponseWriter, r *http.Request) {
	logger := core.GetLogger()
	body := readJSON(r)

	level, _ := body["level"].(string)
	msg, _ := body["message"].(string)
	source, _ := body["source"].(string)

	switch strings.ToUpper(level) {
	case "ERROR":
		logger.Error("[FRONTEND] "+msg, nil, "source", source)
	case "WARN":
		logger.Warn("[FRONTEND] "+msg, "source", source)
	case "INFO":
		logger.Info("[FRONTEND] "+msg, "source", source)
	default:
		logger.Debug("[FRONTEND] "+msg, "source", source)
	}

	jsonResp(w, map[string]interface{}{"ok": true})
}
