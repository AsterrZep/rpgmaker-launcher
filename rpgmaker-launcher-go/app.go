package main

import (
	"context"

	"github.com/AsterrZep/rpgmaker-launcher-go/internal/core"
	"github.com/AsterrZep/rpgmaker-launcher-go/internal/engine"
	"github.com/AsterrZep/rpgmaker-launcher-go/internal/services"
)

// App is the Wails application struct. Methods on App become IPC bindings.
// Commands are split across *_cmd.go files for maintainability:
//   config_cmd.go  — GetConfig, UpdateConfig, ResetConfig, GetGamesDir, GetDataDir
//   game_cmd.go    — GetGames, LaunchGame, StopGame, ToggleFavorite, DetectGameEngine
//   decrypt_cmd.go — DecryptGameAssets, ReadEncryptionKey, HasEncryptedAssets
//   save_cmd.go    — GetSaves, GetSaveContent, UpdateSaveContent, BackupSave
//   plugin_cmd.go  — GetPlugins, TogglePlugins, RestorePlugins
//   tools_cmd.go   — GetData, SetupMods, OpenTarget, GetStatus, CheckUpdate, Ping
//   event_cmd.go   — GetEventHistory, ClearEventHistory
//   sync_cmd.go    — GetSyncStatus, ExecuteSync
//   extract_cmd.go — RescanGames, ExtractZips, ExtractZipsInDir, InstallZips
type App struct {
	configManager *core.ConfigManager
	detector      *engine.Detector
	saveEditor    *engine.SaveEditor
	eventsService *services.EventsService
	syncService   *services.SyncService
	activeServer  *services.GameServer
	activeGame    *core.ActiveSession
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
