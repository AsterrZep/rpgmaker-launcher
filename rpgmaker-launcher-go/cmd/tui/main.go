package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/AsterrZep/rpgmaker-launcher-go/internal/core"
	"github.com/AsterrZep/rpgmaker-launcher-go/internal/engine"
	"github.com/AsterrZep/rpgmaker-launcher-go/internal/services"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

const version = "1.0.0"

func main() {
	dataDir := core.DataDir()
	gamesDir := filepath.Join(dataDir, "games")

	// Check for custom games dir from config
	cm := core.NewConfigManager(dataDir)
	cfg := cm.Get()
	if cfg.General.GamesDir != nil && *cfg.General.GamesDir != "" {
		gamesDir = *cfg.General.GamesDir
	}

	args := os.Args[1:]

	if len(args) == 0 {
		// No args: launch interactive TUI
		runTUI(gamesDir, dataDir)
		return
	}

	switch args[0] {
	case "list", "ls":
		cmdList(gamesDir)
	case "launch", "run":
		if len(args) < 2 {
			fatal("Usage: rpgmaker-cli launch <game-name>")
		}
		cmdLaunch(gamesDir, args[1])
	case "plugins", "pl":
		if len(args) < 2 {
			fatal("Usage: rpgmaker-cli plugins <game-name>")
		}
		cmdPlugins(gamesDir, args[1])
	case "saves", "sv":
		if len(args) < 2 {
			fatal("Usage: rpgmaker-cli saves <game-name>")
		}
		cmdSaves(gamesDir, args[1])
	case "help", "-h", "--help":
		printHelp()
	case "version", "-v", "--version":
		fmt.Printf("rpgmaker-cli %s\n", version)
	default:
		fatal(fmt.Sprintf("Unknown command: %s\nRun 'rpgmaker-cli help' for usage.", args[0]))
	}
}

// ── CLI Commands ──────────────────────────────────────────

func cmdList(gamesDir string) {
	detector := engine.NewDetector()
	games, err := detector.ScanGames(gamesDir)
	if err != nil {
		fatal(err.Error())
	}
	if len(games) == 0 {
		fmt.Println("No games found in", gamesDir)
		return
	}

	w := 60
	fmt.Println()
	title := lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("#7aa2f7")).Render("🎮 Games")
	fmt.Println(title)
	fmt.Println(lipgloss.NewStyle().Foreground(lipgloss.Color("#3b4261")).Render(strings.Repeat("─", w)))
	fmt.Println()

	for i, g := range games {
		// Engine badge
		badge := engineBadgeString(g.Engine, g.EngineLabel)

		// Favorite
		fav := ""
		if g.Favorite {
			fav = lipgloss.NewStyle().Foreground(lipgloss.Color("#e0af68")).Render(" ★")
		}

		// Play time
		time := ""
		if g.Seconds > 0 {
			h := g.Seconds / 3600
			m := (g.Seconds % 3600) / 60
			if h > 0 {
				time = fmt.Sprintf(" %dh%dm", h, m)
			} else {
				time = fmt.Sprintf(" %dm", m)
			}
		}

		num := lipgloss.NewStyle().Foreground(lipgloss.Color("#565f89")).Render(fmt.Sprintf("  %2d.", i+1))
		name := lipgloss.NewStyle().Bold(true).Render(g.Name)

		fmt.Printf("%s %s %s%s%s\n", num, name, badge, fav, lipgloss.NewStyle().Foreground(lipgloss.Color("#737aa2")).Render(time))
	}

	fmt.Println()
	status := lipgloss.NewStyle().Foreground(lipgloss.Color("#565f89")).Render(
		fmt.Sprintf("  %d games · %d web", len(games), countWeb(games)),
	)
	fmt.Println(status)
	fmt.Println()
}

func cmdLaunch(gamesDir, name string) {
	detector := engine.NewDetector()
	gamePath := filepath.Join(gamesDir, name)
	root, engineName, ok := detector.DetectEngine(gamePath)
	if !ok {
		fatal(fmt.Sprintf("Cannot detect engine for '%s'", name))
	}
	if engine.IsIncomplete(engineName) {
		fatal(fmt.Sprintf("Game '%s' is incomplete", name))
	}

	fmt.Printf("Launching %s (%s)...\n", name, engineName)

	if engine.IsWebEngine(engineName) {
		port := engine.StablePort(name)
		server := services.NewGameServer(root, port)
		actualPort, err := server.Start(name)
		if err != nil {
			fatal(err.Error())
		}
		fmt.Printf("Server running on http://127.0.0.1:%d\n", actualPort)
		fmt.Println("Press Ctrl+C to stop.")
		select {}
	} else {
		pm := engine.NewProcessManager()
		if err := pm.LaunchNativeGame(name, root, engineName); err != nil {
			fatal(err.Error())
		}
		fmt.Println("Game launched.")
	}
}

func cmdPlugins(gamesDir, name string) {
	detector := engine.NewDetector()
	gamePath := filepath.Join(gamesDir, name)
	root, _, ok := detector.DetectEngine(gamePath)
	if !ok {
		root = gamePath
	}

	status, err := engine.GetPluginsStatus(root)
	if err != nil {
		fatal(err.Error())
	}

	w := 60
	fmt.Println()
	title := lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("#7aa2f7")).Render(
		fmt.Sprintf("🔌 Plugins · %s", name),
	)
	fmt.Println(title)
	fmt.Println(lipgloss.NewStyle().Foreground(lipgloss.Color("#3b4261")).Render(strings.Repeat("─", w)))
	fmt.Println()

	if len(status.Plugins) == 0 {
		fmt.Println("  No plugins found.")
	} else {
		on := 0
		for _, p := range status.Plugins {
			icon := lipgloss.NewStyle().Foreground(lipgloss.Color("#565f89")).Render("○")
			if p.Status {
				icon = lipgloss.NewStyle().Foreground(lipgloss.Color("#9ece6a")).Render("●")
				on++
			}

			badge := pluginCategoryBadge(p.Category)
			motivos := ""
			if len(p.Motivos) > 0 {
				motivos = lipgloss.NewStyle().Foreground(lipgloss.Color("#565f89")).Render(
					"  " + strings.Join(p.Motivos, ", "),
				)
			}

			fmt.Printf("  %s %s  %s%s\n", icon, p.Name, badge, motivos)
		}
		fmt.Println()
		fmt.Printf("  %d/%d enabled\n", on, len(status.Plugins))
	}
	fmt.Println()
}

func cmdSaves(gamesDir, name string) {
	detector := engine.NewDetector()
	gamePath := filepath.Join(gamesDir, name)
	root, _, ok := detector.DetectEngine(gamePath)
	if !ok {
		root = gamePath
	}

	savesDir := filepath.Join(root, "save")
	entries, err := filepath.Glob(filepath.Join(savesDir, "*"))
	if err != nil || len(entries) == 0 {
		fmt.Printf("No saves found for '%s'.\n", name)
		return
	}

	w := 60
	fmt.Println()
	title := lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("#7aa2f7")).Render(
		fmt.Sprintf("💾 Saves · %s", name),
	)
	fmt.Println(title)
	fmt.Println(lipgloss.NewStyle().Foreground(lipgloss.Color("#3b4261")).Render(strings.Repeat("─", w)))
	fmt.Println()

	for _, e := range entries {
		info, _ := os.Stat(e)
		name := filepath.Base(e)
		size := ""
		if info != nil {
			kb := float64(info.Size()) / 1024
			size = fmt.Sprintf("%.1f KB", kb)
		}
		fmt.Printf("  %-30s %s\n", name, lipgloss.NewStyle().Foreground(lipgloss.Color("#737aa2")).Render(size))
	}
	fmt.Println()
}

// ── Interactive TUI ───────────────────────────────────────

func runTUI(gamesDir, dataDir string) {
	m := newApp(gamesDir, dataDir)
	p := tea.NewProgram(m, tea.WithAltScreen(), tea.WithMouseCellMotion())
	if _, err := p.Run(); err != nil {
		fatal(err.Error())
	}
}

// ── Helpers ───────────────────────────────────────────────

func printHelp() {
	fmt.Print(`
  rpgmaker-cli — RPG Maker & Ren'Py game launcher (TUI)

  USAGE:
    rpgmaker-cli                  Interactive TUI (default)
    rpgmaker-cli list             List all games
    rpgmaker-cli launch <game>    Launch a game
    rpgmaker-cli plugins <game>   Show plugins status
    rpgmaker-cli saves <game>     Show save files
    rpgmaker-cli help             Show this help
    rpgmaker-cli version          Show version

  TUI KEYS:
    j/k or ↑/↓     Navigate
    Enter/l         Open/launch
    p               Plugins
    s               Saves
    x               Toggle plugin
    r               Refresh
    esc/h           Back
    /               Filter
    q               Quit
`)
}

func fatal(msg string) {
	fmt.Fprintln(os.Stderr, lipgloss.NewStyle().Foreground(lipgloss.Color("#f7768e")).Render("Error: "+msg))
	os.Exit(1)
}

func countWeb(games []core.GameInfo) int {
	n := 0
	for _, g := range games {
		if g.IsWeb {
			n++
		}
	}
	return n
}

func engineBadgeString(engine, label string) string {
	var color string
	switch engine {
	case "MZ":
		color = "#7aa2f7"
	case "MV":
		color = "#7dcfff"
	case "renpy":
		color = "#bb9af7"
	case "VXAce", "VX", "XP", "2000-2003":
		color = "#e0af68"
	default:
		color = "#565f89"
	}
	return lipgloss.NewStyle().
		Foreground(lipgloss.Color("#1a1b26")).
		Background(lipgloss.Color(color)).
		Padding(0, 1).
		Bold(true).
		Render(label)
}

func pluginCategoryBadge(category string) string {
	var color string
	switch category {
	case "ok":
		color = "#9ece6a"
	case "roto":
		color = "#f7768e"
	case "nw-protegido":
		color = "#e0af68"
	default:
		color = "#565f89"
	}
	return lipgloss.NewStyle().
		Foreground(lipgloss.Color(color)).
		Bold(true).
		Render(strings.ToUpper(category))
}
