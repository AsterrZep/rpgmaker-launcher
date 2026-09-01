package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/AsterrZep/rpgmaker-launcher-go/internal/core"
)

// GetData reads RPG Maker database files (Items, Weapons, etc.).
func (a *App) GetData(gamePath, category string) (*core.DataResult, error) {
	dataDir := filepath.Join(gamePath, "data")
	if !dirExists(dataDir) {
		return nil, fmt.Errorf("data directory not found")
	}
	fnMap := map[string]string{
		"Items": "Items.json", "Weapons": "Weapons.json", "Armors": "Armors.json",
		"Skills": "Skills.json", "Enemies": "Enemies.json",
	}
	targetFn := fnMap[category]
	if targetFn == "" {
		targetFn = "Items.json"
	}
	base := strings.TrimSuffix(targetFn, ".json")
	for _, cand := range []string{targetFn, base + ".rpgmdata", base + ".json_", base + ".rndata"} {
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
		"version": "1.0.0-go", "running": a.activeGame.Running,
		"active_game": nil, "port": nil,
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
		UpdateAvailable: versionNewer(tag, "1.0.0-go"), TagName: tag,
		CurrentVersion: "1.0.0-go", URL: "https://github.com/AsterrZep/rpgmaker-launcher/releases",
	}, nil
}

// Ping is a diagnostic ping.
func (a *App) Ping() string {
	return "pong v1.0.0-go"
}
