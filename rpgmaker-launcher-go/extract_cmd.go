package main

import (
	"os"
	"path/filepath"
	"strings"

	"github.com/AsterrZep/rpgmaker-launcher-go/internal/core"
	"github.com/AsterrZep/rpgmaker-launcher-go/internal/engine"
)

// RescanGames re-scans the games directory.
func (a *App) RescanGames() (core.ScanResult, error) {
	return a.GetGames()
}

// ExtractZips extracts ZIP files into the games directory.
func (a *App) ExtractZips(paths []string, autoDelete bool) (map[string]interface{}, error) {
	gamesDir := a.configManager.GetGamesDir()
	result := engine.ExtractZips(paths, gamesDir, autoDelete)
	games, _ := a.GetGames()
	return map[string]interface{}{"extracted": result.Extracted, "errors": result.Errors, "games": games.Games}, nil
}

// ExtractZipsInDir scans games dir for ZIPs and extracts them.
func (a *App) ExtractZipsInDir(autoDelete bool) (map[string]interface{}, error) {
	gamesDir := a.configManager.GetGamesDir()
	result := engine.ExtractZipsInDir(gamesDir, autoDelete)
	games, _ := a.GetGames()
	return map[string]interface{}{"extracted": result.Extracted, "errors": result.Errors, "games": games.Games}, nil
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
		"copied": copied, "skipped": skipped,
		"extracted": result.Extracted, "errors": result.Errors, "games": games.Games,
	}, nil
}
