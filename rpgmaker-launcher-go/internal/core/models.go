package core

// GameInfo describes a detected game.
type GameInfo struct {
	Name         string  `json:"name"`
	Path         string  `json:"path"`
	Engine       string  `json:"engine"`
	EngineLabel  string  `json:"engine_label"`
	IsWeb        bool    `json:"is_web"`
	IsIncomplete bool    `json:"is_incomplete"`
	HasCover     bool    `json:"has_cover"`
	CoverURL     *string `json:"cover_url,omitempty"`
	Favorite     bool    `json:"favorite"`
	Seconds      uint64  `json:"seconds"`
	LastPlayed   *uint64 `json:"last_played,omitempty"`
	HasSaves     bool    `json:"has_saves"`
}

// ScanResult wraps a list of games.
type ScanResult struct {
	Games []GameInfo `json:"games"`
	Total int        `json:"total"`
}

// SaveFileInfo describes a single save file.
type SaveFileInfo struct {
	Name     string `json:"name"`
	SizeBytes int64  `json:"size_bytes"`
	SizeKB   float64 `json:"size_kb"`
	MTime    int64  `json:"mtime"`
	MTimeStr string `json:"mtime_str"`
}

// SaveInfo holds the parsed content of a save.
type SaveInfo struct {
	Summary  map[string]interface{} `json:"summary"`
	Gold     int                    `json:"gold"`
	Items    map[string]int         `json:"items"`
	Weapons  map[string]int         `json:"weapons"`
	Armors   map[string]int         `json:"armors"`
	Variables map[string]interface{} `json:"variables"`
	Switches map[string]interface{} `json:"switches"`
	Actors   []ActorInfo            `json:"actors"`
}

// ActorInfo holds data for a single actor in a save.
type ActorInfo struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Level int    `json:"level"`
	HP    int    `json:"hp"`
	MP    int    `json:"mp"`
}

// PluginInfo describes a single plugin.
type PluginInfo struct {
	Name        string   `json:"name"`
	Status      bool     `json:"status"`
	Description string   `json:"description"`
	Category    string   `json:"category"`
	Motivos     []string `json:"motivos"`
}

// PluginsStatus holds the full plugin state for a game.
type PluginsStatus struct {
	Path       string       `json:"path"`
	Plugins    []PluginInfo `json:"plugins"`
	HasBackup  bool         `json:"has_backup"`
}

// ActiveSession tracks the currently running game.
type ActiveSession struct {
	GameName  *string `json:"active_game"`
	Port      *int    `json:"port"`
	StartTime *int64  `json:"start_time"`
	Running   bool    `json:"running"`
}

// DataItem represents a row from the RPG Maker database browser.
type DataItem struct {
	ID          uint32  `json:"id"`
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Price       *uint32 `json:"price,omitempty"`
	Atk         *uint32 `json:"atk,omitempty"`
	Def         *uint32 `json:"def,omitempty"`
	MpCost      *uint32 `json:"mp_cost,omitempty"`
	HP          *uint32 `json:"hp,omitempty"`
	Exp         *uint32 `json:"exp,omitempty"`
	Gold        *uint32 `json:"gold,omitempty"`
}

// DataResult holds the result of a database query.
type DataResult struct {
	Category string     `json:"category"`
	Items    []DataItem `json:"items"`
	Count    int        `json:"count"`
}

// SyncResult holds the result of a sync operation.
type SyncResult struct {
	Game      string `json:"game"`
	Count     int    `json:"count"`
	Direction string `json:"direction"`
}

// UpdateResult holds the result of an update check.
type UpdateResult struct {
	UpdateAvailable bool   `json:"update_available"`
	TagName         string `json:"tag_name"`
	CurrentVersion  string `json:"current_version"`
	URL             string `json:"url"`
}

// ModsResult holds the result of setup_mods.
type ModsResult struct {
	OK      bool     `json:"ok"`
	ModsDir string   `json:"mods_dir"`
	Created bool     `json:"created"`
	Mods    []string `json:"mods"`
}

// LaunchResult holds the result of launching a game.
type LaunchResult struct {
	OK     bool    `json:"ok"`
	Game   string  `json:"game"`
	Engine *string `json:"engine,omitempty"`
	Type   string  `json:"type,omitempty"`
	Port   *int    `json:"port,omitempty"`
}
