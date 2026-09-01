package main

import "fmt"

// GetSyncStatus returns the sync status.
func (a *App) GetSyncStatus() map[string]interface{} {
	folder, auto := a.configManager.GetSyncSettings()
	games, _ := a.GetGames()
	type gameSummary struct {
		Name       string `json:"name"`
		LocalSaves int    `json:"local_saves"`
		DestSaves  int    `json:"dest_saves"`
	}
	var summaries []gameSummary
	for _, g := range games.Games {
		summaries = append(summaries, gameSummary{Name: g.Name, LocalSaves: -1, DestSaves: -1})
	}
	return map[string]interface{}{"destination": folder, "auto_sync": auto, "games": summaries}
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
