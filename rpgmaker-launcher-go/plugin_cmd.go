package main

import (
	"fmt"

	"github.com/AsterrZep/rpgmaker-launcher-go/internal/engine"
)

// GetPlugins returns plugin status for a game.
func (a *App) GetPlugins(gamePath string) (map[string]interface{}, error) {
	status, err := engine.GetPluginsStatus(gamePath)
	if err != nil {
		return nil, err
	}
	return map[string]interface{}{
		"ok": true, "plugins": status.Plugins, "has_backup": status.HasBackup,
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
		"ok": true, "modified": modified,
		"message": fmt.Sprintf("%d plugin(s) %s", len(modified), action),
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
