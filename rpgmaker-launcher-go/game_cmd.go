package main

import (
	"fmt"
	"time"

	"github.com/AsterrZep/rpgmaker-launcher-go/internal/core"
	"github.com/AsterrZep/rpgmaker-launcher-go/internal/engine"
	"github.com/AsterrZep/rpgmaker-launcher-go/internal/services"
)

// GetGames scans and returns the list of games.
func (a *App) GetGames() (core.ScanResult, error) {
	gamesDir := a.configManager.GetGamesDir()
	games, err := a.detector.ScanGames(gamesDir)
	if err != nil {
		return core.ScanResult{}, fmt.Errorf("error scanning games: %w", err)
	}
	for i := range games {
		state := loadGameState(games[i].Name)
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

	if engine.IsWebEngine(engineName) {
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
		a.activeGame = &core.ActiveSession{GameName: &name, Port: &actualPort, StartTime: &now, Running: true}
		a.eventsService.Emit(services.EventServerStarted, map[string]interface{}{"game": name, "port": actualPort})
		return &core.LaunchResult{OK: true, Game: name, Type: "web", Port: &actualPort}, nil
	}

	pm := engine.NewProcessManager()
	if err := pm.LaunchNativeGame(name, gamePath, engineName); err != nil {
		return nil, fmt.Errorf("error launching game: %w", err)
	}
	now := time.Now().Unix()
	a.activeGame = &core.ActiveSession{GameName: &name, StartTime: &now, Running: true}
	a.eventsService.Emit(services.EventGameLaunched, map[string]interface{}{"game": name, "engine": engineName})
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
	if a.activeServer != nil {
		a.activeServer.Stop()
		a.activeServer = nil
	}
	if gameName != "" && elapsed > 0 {
		updatePlayTime(gameName, uint64(elapsed))
	}
	a.activeGame = &core.ActiveSession{}
	a.eventsService.Emit(services.EventServerStopped, map[string]interface{}{"game": gameName, "seconds_added": elapsed})
	return map[string]interface{}{"ok": true, "game": gameName, "seconds_added": elapsed}, nil
}

// ToggleFavorite toggles the favorite state of a game.
func (a *App) ToggleFavorite(gameName string) (map[string]interface{}, error) {
	state := loadGameState(gameName)
	current, _ := state["favorite"].(bool)
	newFav := !current
	saveGameState(gameName, map[string]interface{}{"favorite": newFav})
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
		"ok": true, "root": root, "engine": engineName,
		"engine_label": engine.EngineLabel(engineName),
		"is_web": engine.IsWebEngine(engineName), "is_incomplete": engine.IsIncomplete(engineName),
	}, nil
}
