package main

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/AsterrZep/rpgmaker-launcher-go/internal/core"
)

// ── Filesystem helpers ──────────────────────────────────────

func dirExists(path string) bool {
	info, err := os.Stat(path)
	return err == nil && info.IsDir()
}

func fileExists(path string) bool {
	info, err := os.Stat(path)
	return err == nil && !info.IsDir()
}

// ── Game sorting ────────────────────────────────────────────

func sortGames(games []core.GameInfo) {
	for i := 0; i < len(games); i++ {
		for j := i + 1; j < len(games); j++ {
			a, b := games[j], games[i]
			if a.IsIncomplete && !b.IsIncomplete {
				games[i], games[j] = games[j], games[i]
			} else if a.Favorite && !b.Favorite {
				games[i], games[j] = games[j], games[i]
			}
		}
	}
}

// ── Version comparison ──────────────────────────────────────

func versionNewer(tag, current string) bool {
	parse := func(s string) []int {
		s = strings.TrimLeft(s, "v")
		var parts []int
		for _, p := range strings.Split(s, ".") {
			var n int
			fmt.Sscanf(p, "%d", &n)
			parts = append(parts, n)
		}
		return parts
	}
	t, c := parse(tag), parse(current)
	for i := 0; i < len(t) && i < len(c); i++ {
		if t[i] > c[i] {
			return true
		}
		if t[i] < c[i] {
			return false
		}
	}
	return false
}

// ── System opener ───────────────────────────────────────────

func openWithxdg(target string) {
	cmd := exec.Command("xdg-open", target)
	cmd.Start()
}

// ── State persistence ───────────────────────────────────────

func loadGameState(gameName string) map[string]interface{} {
	stateFile := filepath.Join(core.DataDir(), "launcher-state.json")
	data, err := os.ReadFile(stateFile)
	if err != nil {
		return map[string]interface{}{}
	}
	var state map[string]interface{}
	if err := json.Unmarshal(data, &state); err != nil {
		return map[string]interface{}{}
	}
	games, _ := state["games"].(map[string]interface{})
	if games == nil {
		return map[string]interface{}{}
	}
	gameState, _ := games[gameName].(map[string]interface{})
	if gameState == nil {
		return map[string]interface{}{}
	}
	return gameState
}

func saveGameState(gameName string, updates map[string]interface{}) {
	stateFile := filepath.Join(core.DataDir(), "launcher-state.json")
	state := map[string]interface{}{"games": map[string]interface{}{}}
	data, err := os.ReadFile(stateFile)
	if err == nil {
		json.Unmarshal(data, &state)
	}
	games, _ := state["games"].(map[string]interface{})
	gameState, _ := games[gameName].(map[string]interface{})
	if gameState == nil {
		gameState = map[string]interface{}{}
	}
	for k, v := range updates {
		gameState[k] = v
	}
	games[gameName] = gameState
	data, _ = json.MarshalIndent(state, "", "  ")
	if err := os.WriteFile(stateFile, data, 0644); err != nil {
		core.GetLogger().Warn("Failed to save game state", "game", gameName, "error", err)
	}
}

func updatePlayTime(gameName string, seconds uint64) {
	state := loadGameState(gameName)
	current, _ := state["seconds"].(float64)
	saveGameState(gameName, map[string]interface{}{
		"seconds":     uint64(current) + seconds,
		"last_played": time.Now().Unix(),
	})
}

// ── Data file reader ────────────────────────────────────────

func readDataFile(path, category string) ([]core.DataItem, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	if len(data) > 16 && (strings.HasPrefix(string(data[:5]), "RPGMV") || strings.HasPrefix(string(data[:5]), "RGGO")) {
		data = data[16:]
	}

	var parsed []map[string]interface{}
	if err := json.Unmarshal(data, &parsed); err != nil {
		return nil, err
	}

	var items []core.DataItem
	for idx, entry := range parsed {
		if entry == nil {
			continue
		}
		name, _ := entry["name"].(string)
		if name == "" {
			continue
		}
		id := uint32(idx)
		if v, ok := entry["id"].(float64); ok {
			id = uint32(v)
		}
		desc, _ := entry["description"].(string)

		item := core.DataItem{ID: id, Name: name, Description: desc}

		if category == "Items" || category == "Weapons" || category == "Armors" {
			if v, ok := entry["price"].(float64); ok {
				p := uint32(v)
				item.Price = &p
			}
		}
		if params, ok := entry["params"].([]interface{}); ok {
			getP := func(i int) *uint32 {
				if i < len(params) {
					if v, ok := params[i].(float64); ok {
						p := uint32(v)
						return &p
					}
				}
				return nil
			}
			switch category {
			case "Weapons":
				item.Atk = getP(2)
			case "Armors":
				item.Def = getP(3)
			case "Skills":
				if v, ok := entry["mpCost"].(float64); ok {
					p := uint32(v)
					item.MpCost = &p
				}
			case "Enemies":
				item.HP = getP(0)
				if v, ok := entry["exp"].(float64); ok {
					p := uint32(v)
					item.Exp = &p
				}
				if v, ok := entry["gold"].(float64); ok {
					p := uint32(v)
					item.Gold = &p
				}
			}
		}
		items = append(items, item)
	}
	return items, nil
}

// ── Mod example template ────────────────────────────────────

const modExample = `// ============================================================
//  Mod de ejemplo para RPG Maker Launcher
// ============================================================
(function () {
    "use strict";
    document.addEventListener("keydown", function (ev) {
        if (ev.key === "F10") {
            ev.preventDefault();
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                document.documentElement.requestFullscreen();
            }
        }
    });
})();`
