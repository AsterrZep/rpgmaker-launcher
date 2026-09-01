package core

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
)

// TeclasConfig holds keyboard shortcut bindings.
type TeclasConfig struct {
	Trucos                 string `json:"trucos"`
	Recargar               string `json:"recargar"`
	FPS                    string `json:"fps"`
	Captura                string `json:"captura"`
	PantallaCompleta       string `json:"pantalla_completa"`
	SalirPantallaCompleta  string `json:"salir_pantalla_completa"`
	ZoomIn                 string `json:"zoom_in"`
	ZoomOut                string `json:"zoom_out"`
	Zoom0                  string `json:"zoom_0"`
}

// GeneralConfig holds general application settings.
type GeneralConfig struct {
	WebKit         bool    `json:"webkit"`
	AutoDeleteZip  bool    `json:"auto_delete_zip"`
	Lang           *string `json:"lang,omitempty"`
	GamesDir       *string `json:"games_dir,omitempty"`
}

// SyncConfig holds synchronization settings.
type SyncConfig struct {
	Folder *string `json:"folder,omitempty"`
	Auto   bool    `json:"auto"`
}

// AppConfig is the root configuration object.
type AppConfig struct {
	Teclas  TeclasConfig  `json:"teclas"`
	General GeneralConfig `json:"general"`
	Sync    *SyncConfig   `json:"sync,omitempty"`
}

// DefaultConfig returns a configuration with sane defaults.
func DefaultConfig() AppConfig {
	return AppConfig{
		Teclas: TeclasConfig{
			Trucos:                "F8",
			Recargar:              "F5",
			FPS:                   "F9",
			Captura:               "F12",
			PantallaCompleta:      "F11",
			SalirPantallaCompleta: "Escape",
			ZoomIn:                "Control+equal",
			ZoomOut:               "Control+minus",
			Zoom0:                 "Control+0",
		},
		General: GeneralConfig{
			WebKit:        false,
			AutoDeleteZip: false,
		},
	}
}

// ConfigManager provides atomic configuration read/write.
type ConfigManager struct {
	mu         sync.RWMutex
	config     AppConfig
	configPath string
}

// NewConfigManager creates a ConfigManager backed by dataDir.
func NewConfigManager(dataDir string) *ConfigManager {
	cfgPath := filepath.Join(dataDir, "launcher-config.json")
	cfg := loadFromFile(cfgPath)
	return &ConfigManager{
		config:     cfg,
		configPath: cfgPath,
	}
}

func loadFromFile(path string) AppConfig {
	data, err := os.ReadFile(path)
	if err != nil {
		return DefaultConfig()
	}
	var cfg AppConfig
	if err := json.Unmarshal(data, &cfg); err != nil {
		return DefaultConfig()
	}
	return cfg
}

// Get returns a copy of the current configuration.
func (cm *ConfigManager) Get() AppConfig {
	cm.mu.RLock()
	defer cm.mu.RUnlock()
	return cm.config
}

// Update replaces the configuration and persists it.
func (cm *ConfigManager) Update(cfg AppConfig) error {
	cm.mu.Lock()
	cm.config = cfg
	cm.mu.Unlock()
	return cm.save()
}

func (cm *ConfigManager) save() error {
	cm.mu.RLock()
	data, err := json.MarshalIndent(cm.config, "", "  ")
	cm.mu.RUnlock()
	if err != nil {
		return err
	}
	tmp := cm.configPath + ".tmp"
	if err := os.WriteFile(tmp, data, 0644); err != nil {
		return err
	}
	return os.Rename(tmp, cm.configPath)
}

// GetGamesDir returns the configured games directory.
func (cm *ConfigManager) GetGamesDir() string {
	cm.mu.RLock()
	defer cm.mu.RUnlock()
	if cm.config.General.GamesDir != nil && *cm.config.General.GamesDir != "" {
		return *cm.config.General.GamesDir
	}
	return filepath.Join(DataDir(), "games")
}

// GetSyncSettings returns the sync folder and auto-sync flag.
func (cm *ConfigManager) GetSyncSettings() (string, bool) {
	cm.mu.RLock()
	defer cm.mu.RUnlock()
	if cm.config.Sync != nil {
		folder := ""
		if cm.config.Sync.Folder != nil {
			folder = *cm.config.Sync.Folder
		}
		return folder, cm.config.Sync.Auto
	}
	return "", false
}

// DataDir returns the application data directory.
func DataDir() string {
	if d := os.Getenv("RPGMAKER_DATA_DIR"); d != "" {
		return d
	}
	home, _ := os.UserHomeDir()
	if home == "" {
		return "."
	}
	return filepath.Join(home, ".local", "share", "rpgmaker-launcher")
}

// BackupsDir returns the backups directory.
func BackupsDir() string {
	return filepath.Join(DataDir(), "backups")
}

// LogsDir returns the logs directory.
func LogsDir() string {
	return filepath.Join(DataDir(), "logs")
}

// EnsureDataDirs creates all required data directories.
func EnsureDataDirs() {
	for _, sub := range []string{"games", "backups", "logs", "zooms", "screenshots"} {
		os.MkdirAll(filepath.Join(DataDir(), sub), 0755)
	}
}
