package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/AsterrZep/rpgmaker-launcher-go/internal/core"
	"github.com/AsterrZep/rpgmaker-launcher-go/internal/engine"
	"github.com/charmbracelet/bubbles/key"
	"github.com/charmbracelet/bubbles/list"
	"github.com/charmbracelet/bubbles/spinner"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

// ── View modes ────────────────────────────────────────────

type view int

const (
	viewGames view = iota
	viewPlugins
	viewSaves
)

// ── App model ─────────────────────────────────────────────

type app struct {
	// State
	view     view
	games    []core.GameInfo
	selected int
	detector *engine.Detector
	gamesDir string
	dataDir  string

	// Plugin view
	pluginStatus *core.PluginsStatus
	pluginCursor int

	// Save view
	saves      []saveEntry
	saveCursor int

	// UI components
	list    list.Model
	spinner spinner.Model
	width   int
	height  int
	ready   bool
	loading bool
	errMsg  string
}

type saveEntry struct {
	Name     string
	SizeKB   float64
	MTimeStr string
}

// ── Key bindings ──────────────────────────────────────────

type keyMap struct {
	Up         key.Binding
	Down       key.Binding
	Enter      key.Binding
	Back       key.Binding
	Quit       key.Binding
	Plugins    key.Binding
	Saves      key.Binding
	Refresh    key.Binding
	Toggle     key.Binding
}

var keys = keyMap{
	Up:      key.NewBinding(key.WithKeys("k", "up"), key.WithHelp("↑/k", "up")),
	Down:    key.NewBinding(key.WithKeys("j", "down"), key.WithHelp("↓/j", "down")),
	Enter:   key.NewBinding(key.WithKeys("enter", "l"), key.WithHelp("enter/l", "open")),
	Back:    key.NewBinding(key.WithKeys("esc", "h", "backspace"), key.WithHelp("esc/h", "back")),
	Quit:    key.NewBinding(key.WithKeys("q", "ctrl+c"), key.WithHelp("q", "quit")),
	Plugins: key.NewBinding(key.WithKeys("p"), key.WithHelp("p", "plugins")),
	Saves:   key.NewBinding(key.WithKeys("s"), key.WithHelp("s", "saves")),
	Refresh: key.NewBinding(key.WithKeys("r"), key.WithHelp("r", "refresh")),
	Toggle:  key.NewBinding(key.WithKeys("x"), key.WithHelp("x", "toggle")),
}

func (k keyMap) ShortHelp() []key.Binding {
	return []key.Binding{k.Up, k.Down, k.Enter, k.Back, k.Quit}
}

func (k keyMap) FullHelp() [][]key.Binding {
	return [][]key.Binding{
		{k.Up, k.Down, k.Enter, k.Back},
		{k.Plugins, k.Saves, k.Refresh, k.Toggle},
		{k.Quit},
	}
}

// ── Messages ──────────────────────────────────────────────

type gamesLoadedMsg struct {
	games []core.GameInfo
}

type loadErrMsg struct {
	text string
}

type pluginsLoadedMsg struct {
	status *core.PluginsStatus
}

type savesLoadedMsg struct {
	saves []saveEntry
}

type toggleDoneMsg struct{}

// ── Initialization ────────────────────────────────────────

func newApp(gamesDir, dataDir string) app {
	detector := engine.NewDetector()

	// Game list delegate
	delegate := list.NewDefaultDelegate()

	l := list.New([]list.Item{}, delegate, 0, 0)
	l.Title = "🎮 Games"
	l.SetShowStatusBar(false)
	l.SetFilteringEnabled(true)
	l.KeyMap.Filter.SetEnabled(true)
	l.SetShowHelp(false)
	l.SetShowTitle(true)

	// Spinner
	s := spinner.New()
	s.Spinner = spinner.Dot
	s.Style = lipgloss.NewStyle().Foreground(primary)

	return app{
		view:     viewGames,
		detector: detector,
		gamesDir: gamesDir,
		dataDir:  dataDir,
		list:     l,
		spinner:  s,
		loading:  true,
	}
}

// ── Init ──────────────────────────────────────────────────

func (m app) Init() tea.Cmd {
	return tea.Batch(m.spinner.Tick, m.loadGames())
}

func (m app) loadGames() tea.Cmd {
	return func() tea.Msg {
		games, err := m.detector.ScanGames(m.gamesDir)
		if err != nil {
			return loadErrMsg{text: err.Error()}
		}
		return gamesLoadedMsg{games: games}
	}
}

func (m app) loadPlugins(game core.GameInfo) tea.Cmd {
	return func() tea.Msg {
		status, err := engine.GetPluginsStatus(game.Path)
		if err != nil {
			return loadErrMsg{text: err.Error()}
		}
		return pluginsLoadedMsg{status: status}
	}
}

func (m app) loadSaves(game core.GameInfo) tea.Cmd {
	return func() tea.Msg {
		savesDir := filepath.Join(game.Path, "save")
		var saves []saveEntry
		entries, _ := filepath.Glob(filepath.Join(savesDir, "*"))
		for _, e := range entries {
			fi, err := os.Stat(e)
			if err != nil || fi.IsDir() {
				continue
			}
			saves = append(saves, saveEntry{
				Name:     filepath.Base(e),
				SizeKB:   float64(fi.Size()) / 1024,
				MTimeStr: fi.ModTime().Format("02/01 15:04"),
			})
		}
		return savesLoadedMsg{saves: saves}
	}
}

func (m app) togglePlugin(gameName string, names []string, status bool) tea.Cmd {
	return func() tea.Msg {
		_, err := engine.TogglePlugins(
			filepath.Join(m.gamesDir, gameName),
			names, status, false,
		)
		if err != nil {
			return loadErrMsg{text: err.Error()}
		}
		return toggleDoneMsg{}
	}
}

// ── Update ────────────────────────────────────────────────

func (m app) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmds []tea.Cmd

	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
		m.list.SetWidth(msg.Width)
		m.list.SetHeight(msg.Height - 4)
		return m, nil

	case gamesLoadedMsg:
		m.loading = false
		m.games = msg.games
		items := make([]list.Item, len(msg.games))
		for i, g := range msg.games {
			items[i] = gameItem{game: g}
		}
		m.list.SetItems(items)
		return m, nil

	case pluginsLoadedMsg:
		m.loading = false
		m.pluginStatus = msg.status
		m.pluginCursor = 0
		return m, nil

	case savesLoadedMsg:
		m.loading = false
		m.saves = msg.saves
		m.saveCursor = 0
		return m, nil

	case toggleDoneMsg:
		m.loading = false
		if m.view == viewPlugins && m.selected < len(m.games) {
			return m, m.loadPlugins(m.games[m.selected])
		}
		return m, nil

	case loadErrMsg:
		m.loading = false
		m.errMsg = msg.text
		return m, nil

	case tea.KeyMsg:
		if m.loading {
			return m, nil
		}
		m.errMsg = ""

		// Global keys
		switch {
		case key.Matches(msg, keys.Quit):
			return m, tea.Quit

		case key.Matches(msg, keys.Back):
			if m.view != viewGames {
				m.view = viewGames
				m.pluginStatus = nil
				m.saves = nil
				return m, nil
			}

		case key.Matches(msg, keys.Plugins):
			if m.view == viewGames && m.selected < len(m.games) {
				game := m.games[m.selected]
				if game.IsWeb {
					m.view = viewPlugins
					m.loading = true
					return m, m.loadPlugins(game)
				}
			}

		case key.Matches(msg, keys.Saves):
			if m.view == viewGames && m.selected < len(m.games) {
				game := m.games[m.selected]
				m.view = viewSaves
				m.loading = true
				return m, m.loadSaves(game)
			}

		case key.Matches(msg, keys.Toggle):
			if m.view == viewPlugins && m.pluginStatus != nil {
				idx := m.pluginCursor
				if idx < len(m.pluginStatus.Plugins) {
					p := m.pluginStatus.Plugins[idx]
					newStatus := !p.Status
					game := m.games[m.selected]
					m.loading = true
					return m, m.togglePlugin(game.Name, []string{p.Name}, newStatus)
				}
			}

		case key.Matches(msg, keys.Refresh):
			m.loading = true
			m.detector.ClearCache()
			return m, m.loadGames()
		}
	}

	// Forward to active view
	// Type-assert to tea.KeyMsg for key matching
	km, isKey := msg.(tea.KeyMsg)

	switch m.view {
	case viewGames:
		var cmd tea.Cmd
		m.list, cmd = m.list.Update(msg)
		if selected := m.list.Index(); selected != m.selected {
			m.selected = selected
		}
		cmds = append(cmds, cmd)

	case viewPlugins:
		if isKey && m.pluginStatus != nil {
			switch {
			case key.Matches(km, keys.Up):
				if m.pluginCursor > 0 {
					m.pluginCursor--
				}
			case key.Matches(km, keys.Down):
				if m.pluginCursor < len(m.pluginStatus.Plugins)-1 {
					m.pluginCursor++
				}
			}
		}

	case viewSaves:
		if isKey {
			switch {
			case key.Matches(km, keys.Up):
				if m.saveCursor > 0 {
					m.saveCursor--
				}
			case key.Matches(km, keys.Down):
				if m.saveCursor < len(m.saves)-1 {
					m.saveCursor++
				}
			}
		}
	}

	cmds = append(cmds, m.spinner.Tick)
	return m, tea.Batch(cmds...)
}

// ── View ──────────────────────────────────────────────────

func (m app) View() string {
	if m.loading {
		return m.renderLoading()
	}

	var content string
	switch m.view {
	case viewGames:
		content = m.renderGameList()
	case viewPlugins:
		content = m.renderPlugins()
	case viewSaves:
		content = m.renderSaves()
	}

	statusBar := m.renderStatusBar()
	return lipgloss.JoinVertical(lipgloss.Left, content, statusBar)
}

func (m app) renderLoading() string {
	return lipgloss.JoinVertical(lipgloss.Center,
		"",
		m.spinner.View()+" Loading...",
		"",
	)
}

func (m app) renderGameList() string {
	return m.list.View()
}

func (m app) renderPlugins() string {
	if m.pluginStatus == nil {
		return "No plugin data"
	}

	w := m.width
	if w < 40 {
		w = 40
	}

	game := m.games[m.selected]
	header := headerStyle.Render(fmt.Sprintf("🔌 Plugins · %s", game.Name))
	sub := helpStyle.Render("j/k: navigate · x: toggle · esc: back")
	sep := dividerStyle.Render(strings.Repeat("─", w-2))

	var lines []string
	lines = append(lines, header, sub, sep)

	if len(m.pluginStatus.Plugins) == 0 {
		lines = append(lines, "", helpStyle.Render("  No plugins found in this game."))
	} else {
		for i, p := range m.pluginStatus.Plugins {
			cursor := "  "
			if i == m.pluginCursor {
				cursor = lipgloss.NewStyle().Foreground(primary).Render("▸ ")
			}

			statusIcon := "○"
			if p.Status {
				statusIcon = lipgloss.NewStyle().Foreground(success).Render("●")
			} else {
				statusIcon = lipgloss.NewStyle().Foreground(dim).Render("○")
			}

			badge := pluginBadge(p.Category).Render(strings.ToUpper(p.Category))

			name := valueStyle.Render(p.Name)
			if i == m.pluginCursor {
				name = lipgloss.NewStyle().Foreground(fg).Bold(true).Render(p.Name)
			}

			line := fmt.Sprintf("%s%s %s  %s", cursor, statusIcon, name, badge)
			if len(p.Motivos) > 0 {
				line += helpStyle.Render("  " + strings.Join(p.Motivos, ", "))
			}
			lines = append(lines, line)
		}
	}

	lines = append(lines, sep)
	lines = append(lines, helpStyle.Render("  x: toggle on/off · esc: back"))
	return lipgloss.JoinVertical(lipgloss.Left, lines...)
}

func (m app) renderSaves() string {
	w := m.width
	if w < 40 {
		w = 40
	}

	game := m.games[m.selected]
	header := headerStyle.Render(fmt.Sprintf("💾 Saves · %s", game.Name))
	sub := helpStyle.Render("j/k: navigate · esc: back")
	sep := dividerStyle.Render(strings.Repeat("─", w-2))

	var lines []string
	lines = append(lines, header, sub, sep)

	if len(m.saves) == 0 {
		lines = append(lines, "", helpStyle.Render("  No saves found."))
	} else {
		colName := labelStyle.Render(fmt.Sprintf("%-30s", "File"))
		colSize := labelStyle.Render(fmt.Sprintf("%10s", "Size"))
		lines = append(lines, fmt.Sprintf("  %s %s", colName, colSize))
		lines = append(lines, sep)

		for i, s := range m.saves {
			cursor := "  "
			if i == m.saveCursor {
				cursor = lipgloss.NewStyle().Foreground(primary).Render("▸ ")
			}

			name := valueStyle.Render(fmt.Sprintf("%-30s", s.Name))
			if i == m.saveCursor {
				name = lipgloss.NewStyle().Foreground(fg).Bold(true).Render(
					fmt.Sprintf("%-30s", s.Name),
				)
			}
			size := lipgloss.NewStyle().Foreground(dimFg).Render(fmt.Sprintf("%10s", fmt.Sprintf("%.1f KB", s.SizeKB)))
			lines = append(lines, fmt.Sprintf("%s%s %s", cursor, name, size))
		}
	}

	lines = append(lines, sep)
	lines = append(lines, helpStyle.Render("  esc: back"))
	return lipgloss.JoinVertical(lipgloss.Left, lines...)
}

func (m app) renderStatusBar() string {
	left := statusBarStyle.Render(" rpgmaker-cli ")
	middle := ""

	if m.view == viewGames {
		total := len(m.games)
		web := 0
		for _, g := range m.games {
			if g.IsWeb {
				web++
			}
		}
		middle = statusBarStyle.Render(fmt.Sprintf(" %d games (%d web) ", total, web))
	} else if m.view == viewPlugins && m.pluginStatus != nil {
		on := 0
		for _, p := range m.pluginStatus.Plugins {
			if p.Status {
				on++
			}
		}
		middle = statusBarStyle.Render(fmt.Sprintf(" %d/%d plugins enabled ", on, len(m.pluginStatus.Plugins)))
	} else if m.view == viewSaves {
		middle = statusBarStyle.Render(fmt.Sprintf(" %d saves ", len(m.saves)))
	}

	right := helpStyle.Render(" q: quit ")
	gapWidth := max(0, m.width-lipgloss.Width(left)-lipgloss.Width(middle)-lipgloss.Width(right))
	gap := strings.Repeat(" ", gapWidth)
	return lipgloss.JoinHorizontal(lipgloss.Bottom, left, middle, gap, right)
}

// ── Game list item ────────────────────────────────────────

type gameItem struct {
	game core.GameInfo
}

func (i gameItem) FilterValue() string { return i.game.Name }
func (i gameItem) Title() string       { return i.game.Name }
func (i gameItem) Description() string {
	badge := engineBadgeString(i.game.Engine, i.game.EngineLabel)

	var parts []string
	parts = append(parts, badge)

	if i.game.Favorite {
		parts = append(parts, "★")
	}

	extra := ""
	if i.game.Seconds > 0 {
		h := i.game.Seconds / 3600
		m := (i.game.Seconds % 3600) / 60
		if h > 0 {
			extra += fmt.Sprintf("%dh%dm", h, m)
		} else {
			extra += fmt.Sprintf("%dm", m)
		}
	}
	if extra != "" {
		parts = append(parts, lipgloss.NewStyle().Foreground(dimFg).Render(extra))
	}

	return strings.Join(parts, " ")
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
