package engine

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/AsterrZep/rpgmaker-launcher-go/internal/core"
)

// nw.js tokens that may break WebKit compatibility.
var nwTokens = [][2]string{
	{`require\s*\(`, "require()"},
	{`\bprocess\.`, "process."},
	{`\bnw\.`, "nw."},
	{`child_process`, "child_process"},
	{`\bfs\.`, "fs."},
	{`\bpath\.`, "path."},
}

// Guard patterns: if a plugin contains these, nw.js usage is usually protected.
var guards = []string{
	"Utils.isNwjs", "isNwjs", "typeof require", "typeof nw",
	"require.main", "window.require", "nw&&", "nw &&",
	"process&&", "process &&",
}

// FindPluginsJS locates js/plugins.js in a game directory.
func FindPluginsJS(root string) string {
	direct := filepath.Join(root, "js", "plugins.js")
	if fileExists(direct) {
		return direct
	}
	// Recursive search with depth limit
	var result string
	filepath.WalkDir(root, func(path string, d os.DirEntry, err error) error {
		if err != nil || d.IsDir() {
			return nil
		}
		rel, _ := filepath.Rel(root, path)
		depth := len(strings.Split(rel, string(filepath.Separator)))
		if depth > 3 {
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

// LoadPlugins reads and parses plugins.js.
func LoadPlugins(root string) (path, raw string, plugins []map[string]interface{}, err error) {
	path = FindPluginsJS(root)
	if path == "" {
		return "", "", nil, fmt.Errorf("js/plugins.js not found in %s", root)
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return "", "", nil, fmt.Errorf("error reading plugins.js: %w", err)
	}
	raw = string(data)

	// Extract JSON array from JS
	re := regexp.MustCompile(`(?s)\[.*\]`)
	m := re.FindString(raw)
	if m == "" {
		return path, raw, nil, fmt.Errorf("could not parse plugins.js format")
	}

	normalized := normalizePluginsJS(m)
	if err := json.Unmarshal([]byte(normalized), &plugins); err != nil {
		return path, raw, nil, fmt.Errorf("error parsing plugins.js: %w", err)
	}
	return path, raw, plugins, nil
}

// SavePlugins writes modified plugins back to plugins.js.
func SavePlugins(path, raw string, plugins []map[string]interface{}) error {
	bak := path + ".bak"
	if _, err := os.Stat(bak); os.IsNotExist(err) {
		copyFile(path, bak)
	}

	re := regexp.MustCompile(`(?s)\[.*\]`)
	m := re.FindString(raw)
	if m == "" {
		return fmt.Errorf("array not found in plugins.js")
	}

	newJSON, err := json.Marshal(plugins)
	if err != nil {
		return fmt.Errorf("error serializing: %w", err)
	}

	newContent := raw[:strings.Index(raw, m)] + string(newJSON) + raw[strings.Index(raw, m)+len(m):]
	return os.WriteFile(path, []byte(newContent), 0644)
}

// AnalyzePlugin checks a plugin for WebKit compatibility.
func AnalyzePlugin(name, root string) core.PluginInfo {
	pluginFile := filepath.Join(root, "js", "plugins", name+".js")

	if !fileExists(pluginFile) {
		return core.PluginInfo{
			Name:     name,
			Category: "sin_fichero",
			Motivos:  []string{fmt.Sprintf("no existe plugins/%s.js", name)},
		}
	}

	data, err := os.ReadFile(pluginFile)
	if err != nil {
		return core.PluginInfo{Name: name, Category: "ok"}
	}
	src := stripComments(string(data))

	// Detect nw.js tokens
	var tokens []string
	for _, pair := range nwTokens {
		re := regexp.MustCompile(pair[0])
		if re.MatchString(src) {
			tokens = append(tokens, pair[1])
		}
	}

	if len(tokens) == 0 {
		return core.PluginInfo{Name: name, Category: "ok"}
	}

	// Check guards
	for _, g := range guards {
		if strings.Contains(src, g) {
			return core.PluginInfo{Name: name, Category: "nw_protegido", Motivos: tokens}
		}
	}

	return core.PluginInfo{Name: name, Category: "roto", Motivos: tokens}
}

// GetPluginsStatus returns the full plugin status for a game.
func GetPluginsStatus(root string) (*core.PluginsStatus, error) {
	path, _, plugins, err := LoadPlugins(root)
	if err != nil {
		return nil, err
	}

	var analyzed []core.PluginInfo
	for _, p := range plugins {
		pname, _ := p["name"].(string)
		status, _ := p["status"].(bool)
		description, _ := p["description"].(string)

		info := AnalyzePlugin(pname, root)
		info.Status = status
		info.Description = description
		analyzed = append(analyzed, info)
	}

	hasBak := fileExists(path + ".bak")
	return &core.PluginsStatus{Path: path, Plugins: analyzed, HasBackup: hasBak}, nil
}

// TogglePlugins enables/disables specific plugins or all.
func TogglePlugins(root string, names []string, status bool, allPlugins bool) ([]string, error) {
	path, raw, plugins, err := LoadPlugins(root)
	if err != nil {
		return nil, err
	}

	var allNames []string
	for _, p := range plugins {
		if n, ok := p["name"].(string); ok {
			allNames = append(allNames, n)
		}
	}

	targets := make(map[string]bool)
	if allPlugins {
		for _, n := range allNames {
			targets[n] = true
		}
	} else {
		for _, n := range names {
			targets[n] = true
		}
	}

	var modified []string
	for _, p := range plugins {
		pname, _ := p["name"].(string)
		if targets[pname] {
			current, _ := p["status"].(bool)
			if current != status {
				p["status"] = status
				modified = append(modified, pname)
			}
		}
	}

	if len(modified) > 0 {
		if err := SavePlugins(path, raw, plugins); err != nil {
			return nil, err
		}
	}
	return modified, nil
}

// RestorePlugins restores plugins.js from backup.
func RestorePlugins(root string) error {
	path := FindPluginsJS(root)
	if path == "" {
		return fmt.Errorf("plugins.js not found")
	}
	bak := path + ".bak"
	if !fileExists(bak) {
		return fmt.Errorf("no backup found at %s", bak)
	}
	return copyFile(bak, path)
}

// --- helpers ---

func normalizePluginsJS(raw string) string {
	// Single to double quotes
	result := convertSingleQuotes(raw)
	// Remove trailing commas
	re := regexp.MustCompile(`,\s*([}\]])`)
	result = re.ReplaceAllString(result, "$1")
	// Quote unquoted keys
	re2 := regexp.MustCompile(`([,{]\s*)([^\s"'` + "`" + `:{}\[\],]+)\s*:`)
	result = re2.ReplaceAllString(result, `$1"$2":`)
	return result
}

func convertSingleQuotes(raw string) string {
	// Simple conversion: replace ' with " (basic, handles most cases)
	return strings.ReplaceAll(raw, "'", `"`)
}

func stripComments(src string) string {
	re1 := regexp.MustCompile(`/\*.*?\*/`)
	re2 := regexp.MustCompile(`//[^\n]*`)
	result := re1.ReplaceAllString(src, " ")
	return re2.ReplaceAllString(result, " ")
}

func copyFile(src, dst string) error {
	data, err := os.ReadFile(src)
	if err != nil {
		return err
	}
	return os.WriteFile(dst, data, 0644)
}
