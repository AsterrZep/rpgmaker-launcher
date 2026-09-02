package engine

import (
	"crypto/sha256"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/AsterrZep/rpgmaker-launcher-go/internal/core"
)

const maxDepth = 5

var engineLabels = map[string]string{
	"MZ":             "RPG Maker MZ",
	"MV":             "RPG Maker MV",
	"web":            "Web (MV/MZ)",
	"2000-2003":      "RPG Maker 2000/2003",
	"renpy":          "Ren'Py",
	"VXAce":          "RPG Maker VX Ace",
	"VX":             "RPG Maker VX",
	"XP":             "RPG Maker XP",
	"incomplete":     "Descarga incompleta",
	"renpy-incomplete": "Ren'Py sin parte Linux",
}

var webEngines = map[string]bool{"MZ": true, "MV": true, "web": true}
var incompleteEngines = map[string]bool{"incomplete": true, "renpy-incomplete": true}

type cacheEntry struct {
	timestamp time.Time
	root      string
	engine    string
}

// Detector scans a games directory and detects engines.
type Detector struct {
	mu    sync.RWMutex
	cache map[string]cacheEntry
}

// NewDetector creates a new game detector.
func NewDetector() *Detector {
	return &Detector{cache: make(map[string]cacheEntry)}
}

// DetectEngine identifies the engine for a given game path.
func (d *Detector) DetectEngine(path string) (root, engine string, ok bool) {
	absPath, _ := filepath.Abs(path)

	// Check cache
	d.mu.RLock()
	if e, found := d.cache[absPath]; found && time.Since(e.timestamp) < 60*time.Second {
		d.mu.RUnlock()
		if e.root != "" {
			return e.root, e.engine, true
		}
		return "", "", false
	}
	d.mu.RUnlock()

	root, engine = d.detectEngineUncached(absPath)

	// Update cache
	d.mu.Lock()
	d.cache[absPath] = cacheEntry{timestamp: time.Now(), root: root, engine: engine}
	d.mu.Unlock()

	return root, engine, root != ""
}

func (d *Detector) detectEngineUncached(path string) (string, string) {
	// 1. Web games: index.html (MZ/MV)
	if root := findFile(path, "index.html", maxDepth); root != "" {
		if fileExists(filepath.Join(root, "js", "rmmz_core.js")) {
			return root, "MZ"
		}
		if fileExists(filepath.Join(root, "js", "rpg_core.js")) {
			return root, "MV"
		}
		return root, "web"
	}

	// 1b. MZ desktop (NW.js): Game.rpgproject + package.json
	if root := findFile(path, "Game.rpgproject", maxDepth); root != "" {
		if fileExists(filepath.Join(root, "package.json")) {
			return root, "MZ"
		}
	}

	// 2. VX Ace, VX, XP (archive files)
	for _, pair := range [][2]string{
		{"Game.rgss3a", "VXAce"},
		{"Game.rgss2a", "VX"},
		{"Game.rgssad", "XP"},
	} {
		if root := findFile(path, pair[0], maxDepth); root != "" {
			return root, pair[1]
		}
	}

	// 3. RPG Maker 2000/2003
	for _, name := range []string{"RPG_RT.exe", "RPG_RT.ini"} {
		if root := findFile(path, name, maxDepth); root != "" {
			return root, "2000-2003"
		}
	}
	if found := findGlob(path, "*.lmt", maxDepth); found != "" {
		return filepath.Dir(found), "2000-2003"
	}

	// 4. Ren'Py
	if py := findGlob(path, "*.py", maxDepth); py != "" {
		dir := filepath.Dir(py)
		if dirExists(filepath.Join(dir, "renpy")) && dirExists(filepath.Join(dir, "game")) {
			if renpyLibOK(dir) {
				return dir, "renpy"
			}
		}
	}

	// 5. VX Ace/VX/XP (script files)
	for _, pair := range [][2]string{
		{"Scripts.rvdata2", "VXAce"},
		{"Scripts.rvdata", "VX"},
		{"Scripts.rxdata", "XP"},
	} {
		if root := findFile(path, pair[0], maxDepth); root != "" {
			return root, pair[1]
		}
	}

	// 6. MZ/MV via plugins.js (fallback for unusual structures)
	if pluginsJS := findPluginsJSInDir(path, maxDepth); pluginsJS != "" {
		// plugins.js is at <root>/js/plugins.js, so root is the parent of the js dir
		jsDir := filepath.Dir(pluginsJS) // js/
		root := filepath.Dir(jsDir)      // parent of js/
		return root, "MZ"
	}

	// 7. Incomplete games
	if findFile(path, "System.json", maxDepth) != "" || findFile(path, "Map001.json", maxDepth) != "" {
		return path, "incomplete"
	}
	if findDir(path, "renpy", maxDepth) != "" {
		return path, "renpy-incomplete"
	}

	return "", ""
}

// ScanGames scans a directory for games.
func (d *Detector) ScanGames(gamesDir string) ([]core.GameInfo, error) {
	var games []core.GameInfo
	if !dirExists(gamesDir) {
		return games, nil
	}

	entries, err := os.ReadDir(gamesDir)
	if err != nil {
		return nil, err
	}

	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		gamePath := filepath.Join(gamesDir, entry.Name())
		root, engine, ok := d.DetectEngine(gamePath)
		if !ok {
			continue
		}

		label := EngineLabel(engine)
		isWeb := webEngines[engine]
		isIncomplete := incompleteEngines[engine]
		cover := FindCover(gamePath, root)

		// Check saves
		savesDir := filepath.Join(root, "save")
		hasSaves := dirExists(savesDir) && hasFiles(savesDir)

		games = append(games, core.GameInfo{
			Name:         entry.Name(),
			Path:         root,
			Engine:       engine,
			EngineLabel:  label,
			IsWeb:        isWeb,
			IsIncomplete: isIncomplete,
			HasCover:     cover != "",
			CoverURL:     coverURL(entry.Name(), cover),
			HasSaves:     hasSaves,
		})
	}

	// Sort: incomplete at end, then favorites, then last played, then alpha
	sortGames(games)
	return games, nil
}

// ClearCache empties the detection cache.
func (d *Detector) ClearCache() {
	d.mu.Lock()
	d.cache = make(map[string]cacheEntry)
	d.mu.Unlock()
}

// EngineLabel returns a human-readable label for an engine.
func EngineLabel(engine string) string {
	if l, ok := engineLabels[engine]; ok {
		return l
	}
	return engine
}

// IsWebEngine returns true for MZ/MV/web engines.
func IsWebEngine(engine string) bool { return webEngines[engine] }

// IsIncomplete returns true for incomplete downloads.
func IsIncomplete(engine string) bool { return incompleteEngines[engine] }

// StablePort computes a deterministic port for a game using SHA-256.
func StablePort(gameName string) int {
	h := sha256.Sum256([]byte(gameName))
	val := uint16(h[0])<<8 | uint16(h[1])
	return 1024 + int(val%64000)
}

// FindCover searches for a cover image for a game.
func FindCover(gameTop, root string) string {
	candidates := []string{
		filepath.Join(gameTop, "cover.png"),
		filepath.Join(gameTop, "cover.jpg"),
		filepath.Join(gameTop, "cover.webp"),
		filepath.Join(root, "icon", "icon.png"),
		filepath.Join(root, "pictures", "title.png"),
		filepath.Join(root, "system", "Title.png"),
		filepath.Join(root, "system", "title.png"),
		filepath.Join(root, "game", "gui", "main_menu.png"),
		filepath.Join(root, "game", "gui", "game_menu.png"),
	}
	for _, c := range candidates {
		if fileExists(c) {
			return c
		}
	}
	// Ren'Py screenshots
	if shots := findGlobAll(root, "screenshot*.png"); len(shots) > 0 {
		return shots[0]
	}
	return ""
}

// --- File helpers ---

func fileExists(path string) bool {
	info, err := os.Stat(path)
	return err == nil && !info.IsDir()
}

func dirExists(path string) bool {
	info, err := os.Stat(path)
	return err == nil && info.IsDir()
}

func hasFiles(dir string) bool {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return false
	}
	for _, e := range entries {
		if !e.IsDir() {
			return true
		}
	}
	return false
}

func findFile(root, name string, maxD int) string {
	var result string
	filepath.WalkDir(root, func(path string, d os.DirEntry, err error) error {
		if err != nil || d.IsDir() {
			return nil
		}
		rel, _ := filepath.Rel(root, path)
		depth := len(strings.Split(rel, string(filepath.Separator)))
		if depth > maxD {
			return filepath.SkipDir
		}
		if d.Name() == name {
			result = filepath.Dir(path)
			return filepath.SkipAll
		}
		return nil
	})
	return result
}

func findGlob(root, pattern string, maxD int) string {
	// Separate glob prefix from suffix (e.g. "*.lmt" -> prefix="", suffix=".lmt")
	prefix, suffix := "", pattern
	if idx := strings.IndexByte(pattern, '*'); idx >= 0 {
		prefix = pattern[:idx]
		suffix = pattern[idx+1:]
	}
	var result string
	filepath.WalkDir(root, func(path string, d os.DirEntry, err error) error {
		if err != nil || d.IsDir() {
			return nil
		}
		rel, _ := filepath.Rel(root, path)
		depth := len(strings.Split(rel, string(filepath.Separator)))
		if depth > maxD {
			return filepath.SkipDir
		}
		name := d.Name()
		if strings.HasPrefix(name, prefix) && strings.HasSuffix(name, suffix) {
			result = path
			return filepath.SkipAll
		}
		return nil
	})
	return result
}

func findGlobAll(root, pattern string) []string {
	var results []string
	// Separate glob prefix from suffix (e.g. "screenshot*.png" -> prefix="screenshot", suffix=".png")
	prefix, suffix := "", pattern
	if idx := strings.IndexByte(pattern, '*'); idx >= 0 {
		prefix = pattern[:idx]
		suffix = pattern[idx+1:]
	}
	filepath.WalkDir(root, func(path string, d os.DirEntry, err error) error {
		if err != nil || d.IsDir() {
			return nil
		}
		name := d.Name()
		if strings.HasPrefix(name, prefix) && strings.HasSuffix(name, suffix) {
			results = append(results, path)
		}
		return nil
	})
	return results
}

func findDir(root, name string, maxD int) string {
	var result string
	filepath.WalkDir(root, func(path string, d os.DirEntry, err error) error {
		if err != nil {
			return nil
		}
		if d.IsDir() {
			rel, _ := filepath.Rel(root, path)
			depth := len(strings.Split(rel, string(filepath.Separator)))
			if depth > maxD {
				return filepath.SkipDir
			}
			if d.Name() == name {
				result = path
				return filepath.SkipAll
			}
		}
		return nil
	})
	return result
}

// findPluginsJSInDir searches for js/plugins.js as a fallback engine detection.
func findPluginsJSInDir(root string, maxD int) string {
	var result string
	filepath.WalkDir(root, func(path string, d os.DirEntry, err error) error {
		if err != nil || d.IsDir() {
			return nil
		}
		rel, _ := filepath.Rel(root, path)
		depth := len(strings.Split(rel, string(filepath.Separator)))
		if depth > maxD {
			return filepath.SkipDir
		}
		if d.Name() == "plugins.js" {
			parent := filepath.Base(filepath.Dir(path))
			if parent == "js" {
				result = path
				return filepath.SkipAll
			}
		}
		return nil
	})
	return result
}

func renpyLibOK(root string) bool {
	for _, d := range []string{"linux-x86_64", "linux-i686", "py2-linux-x86_64", "py2-linux-i686"} {
		if dirExists(filepath.Join(root, "lib", d)) {
			return true
		}
	}
	return false
}

func coverURL(name, coverPath string) *string {
	if coverPath == "" {
		return nil
	}
	url := fmt.Sprintf("/api/covers/%s", name)
	return &url
}

func sortGames(games []core.GameInfo) {
	for i := 0; i < len(games); i++ {
		for j := i + 1; j < len(games); j++ {
			if gameLess(games[j], games[i]) {
				games[i], games[j] = games[j], games[i]
			}
		}
	}
}

func gameLess(a, b core.GameInfo) bool {
	if a.IsIncomplete != b.IsIncomplete {
		return !a.IsIncomplete && b.IsIncomplete
	}
	if a.Favorite != b.Favorite {
		return a.Favorite && !b.Favorite
	}
	aLP := uint64(0)
	bLP := uint64(0)
	if a.LastPlayed != nil {
		aLP = *a.LastPlayed
	}
	if b.LastPlayed != nil {
		bLP = *b.LastPlayed
	}
	if aLP != bLP {
		return aLP > bLP
	}
	return strings.ToLower(a.Name) < strings.ToLower(b.Name)
}
