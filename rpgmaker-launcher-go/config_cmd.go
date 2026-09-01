package main

import "github.com/AsterrZep/rpgmaker-launcher-go/internal/core"

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
