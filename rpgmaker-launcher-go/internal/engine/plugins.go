package engine

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"unicode"

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

	// Strip UTF-8 BOM
	raw = strings.TrimPrefix(raw, "\xef\xbb\xbf")

	// Extract the JSON array portion
	jsonArray, err := extractJSONArray(raw)
	if err != nil {
		return path, raw, nil, fmt.Errorf("could not extract JSON array: %w", err)
	}

	// Try direct JSON parse first
	if err := json.Unmarshal([]byte(jsonArray), &plugins); err == nil {
		return path, raw, plugins, nil
	}

	// Fallback: normalize JS to JSON
	normalized := normalizeJS(jsonArray)
	if err := json.Unmarshal([]byte(normalized), &plugins); err != nil {
		return path, raw, nil, fmt.Errorf("error parsing plugins.js: %w", err)
	}
	return path, raw, plugins, nil
}

// normalizeJS converts JS object notation to valid JSON.
func normalizeJS(raw string) string {
	raw = convertSingleQuotes(raw)
	raw = removeTrailingCommas(raw)
	raw = quoteUnquotedKeys(raw)
	return raw
}// extractJSONArray finds the JSON array in the file content.
// It uses the same greedy approach as the Python version: match from the
// first '[' to the LAST ']', which reliably captures the top-level array
// even when comments or variable declarations contain stray brackets.
func extractJSONArray(raw string) (string, error) {
	start := strings.IndexByte(raw, '[')
	if start == -1 {
		return "", fmt.Errorf("no '[' found in file")
	}

	// Walk counting depth; keep going to find the LAST ']' at depth 0
	// (mirrors Python's greedy re.search(r"\[.*\]", ..., re.S)).
	depth := 0
	inString := false
	escape := false
	lastClose := -1

	for i := start; i < len(raw); i++ {
		ch := raw[i]

		if escape {
			escape = false
			continue
		}

		if ch == '\\' && inString {
			escape = true
			continue
		}

		if ch == '"' {
			inString = !inString
			continue
		}

		if inString {
			continue
		}

		if ch == '[' {
			depth++
		} else if ch == ']' {
			depth--
			if depth == 0 {
				lastClose = i
				// Don't break — keep going to find the LAST matching ']'
			}
		}
	}

	if lastClose == -1 {
		return "", fmt.Errorf("unmatched brackets in file")
	}

	return raw[start : lastClose+1], nil
}

// removeTrailingCommas removes trailing commas before } or ].
func removeTrailingCommas(raw string) string {
	re := regexp.MustCompile(`,\s*([}\]])`)
	return re.ReplaceAllString(raw, "$1")
}

// convertSingleQuotes converts JS single-quoted strings to double-quoted JSON strings.
func convertSingleQuotes(raw string) string {
	var out []byte
	i, n := 0, len(raw)
	inDQ := false

	for i < n {
		c := raw[i]
		if inDQ {
			out = append(out, c)
			if c == '\\' && i+1 < n {
				out = append(out, raw[i+1])
				i += 2
				continue
			}
			if c == '"' {
				inDQ = false
			}
			i++
			continue
		}
		if c == '"' {
			inDQ = true
			out = append(out, c)
			i++
			continue
		}
		if c == '\'' {
			// Collect single-quoted string
			var buf []byte
			j := i + 1
			for j < n {
				if raw[j] == '\\' && j+1 < n {
					buf = append(buf, raw[j], raw[j+1])
					j += 2
					continue
				}
				if raw[j] == '\'' {
					break
				}
				buf = append(buf, raw[j])
				j++
			}
			if j < n {
				// Convert to double-quoted JSON string
				jsonStr, _ := json.Marshal(string(buf))
				out = append(out, jsonStr...)
				i = j + 1
				continue
			}
			out = append(out, c)
			i++
			continue
		}
		out = append(out, c)
		i++
	}
	return string(out)
}

// quoteUnquotedKeys quotes unquoted object keys for JSON compatibility.
func quoteUnquotedKeys(raw string) string {
	re := regexp.MustCompile(`([,\[{]\s*)([^\s"'` + "`" + `:{}[\],]+)\s*:`)
	return re.ReplaceAllStringFunc(raw, func(match string) string {
		parts := re.FindStringSubmatch(match)
		if len(parts) < 3 {
			return match
		}
		key, _ := json.Marshal(parts[2])
		return parts[1] + string(key) + ":"
	})
}

// SavePlugins writes modified plugins back to plugins.js.
func SavePlugins(path, raw string, plugins []map[string]interface{}) error {
	bak := path + ".bak"
	if _, err := os.Stat(bak); os.IsNotExist(err) {
		copyFile(path, bak)
	}

	start := strings.IndexByte(raw, '[')
	if start == -1 {
		return fmt.Errorf("array not found in plugins.js")
	}

	depth := 0
	inString := false
	escape := false
	end := -1
	for i := start; i < len(raw); i++ {
		ch := raw[i]
		if escape {
			escape = false
			continue
		}
		if ch == '\\' && inString {
			escape = true
			continue
		}
		if ch == '"' {
			inString = !inString
			continue
		}
		if inString {
			continue
		}
		if ch == '[' {
			depth++
		} else if ch == ']' {
			depth--
			if depth == 0 {
				end = i
				break
			}
		}
	}

	if end == -1 {
		return fmt.Errorf("could not find matching bracket")
	}

	newJSON, err := json.Marshal(plugins)
	if err != nil {
		return fmt.Errorf("error serializing: %w", err)
	}

	newContent := raw[:start] + string(newJSON) + raw[end+1:]
	return os.WriteFile(path, []byte(newContent), 0644)
}

// AnalyzePlugin checks a plugin for WebKit compatibility.
func AnalyzePlugin(name, root string) core.PluginInfo {
	pluginFile := filepath.Join(root, "js", "plugins", name+".js")

	if !fileExists(pluginFile) {
		return core.PluginInfo{
			Name:     name,
			Category: "sin-fichero",
			Motivos:  []string{fmt.Sprintf("no existe plugins/%s.js", name)},
		}
	}

	data, err := os.ReadFile(pluginFile)
	if err != nil {
		return core.PluginInfo{Name: name, Category: "ok", Motivos: []string{}}
	}
	src := stripComments(string(data))

	var tokens []string
	for _, pair := range nwTokens {
		re := regexp.MustCompile(pair[0])
		if re.MatchString(src) {
			tokens = append(tokens, pair[1])
		}
	}

	if len(tokens) == 0 {
		return core.PluginInfo{Name: name, Category: "ok", Motivos: []string{}}
	}

	for _, g := range guards {
		if strings.Contains(src, g) {
			return core.PluginInfo{Name: name, Category: "nw-protegido", Motivos: tokens}
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

func stripComments(src string) string {
	re1 := regexp.MustCompile(`(?s)/\*.*?\*/`)
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

// unused but kept for reference
var _ = unicode.IsSpace
