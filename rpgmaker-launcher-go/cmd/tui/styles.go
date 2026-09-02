package main

import "github.com/charmbracelet/lipgloss"

// ── Color palette (dark theme) ────────────────────────────

var (
	// Base colors
	bg        = lipgloss.Color("#1a1b26")
	fg        = lipgloss.Color("#c0caf5")
	dim       = lipgloss.Color("#565f89")
	dimFg     = lipgloss.Color("#737aa2")

	// Accent colors
	primary   = lipgloss.Color("#7aa2f7")
	secondary = lipgloss.Color("#bb9af7")
	success   = lipgloss.Color("#9ece6a")
	warning   = lipgloss.Color("#e0af68")
	error     = lipgloss.Color("#f7768e")
	cyan      = lipgloss.Color("#7dcfff")

	// UI elements
	surface   = lipgloss.Color("#24283b")
	surfaceH  = lipgloss.Color("#292e42")
	border    = lipgloss.Color("#3b4261")
	selBg     = lipgloss.Color("#33467c")
)

// ── Styles ────────────────────────────────────────────────

var (
	// App title
	titleStyle = lipgloss.NewStyle().
			Bold(true).
			Foreground(primary).
			Padding(0, 1)

	// Status bar
	statusBarStyle = lipgloss.NewStyle().
			Foreground(dimFg).
			Background(surface).
			Padding(0, 1)

	// Sidebar
	sidebarStyle = lipgloss.NewStyle().
			Border(lipgloss.NormalBorder(), false, true, false, false).
			BorderForeground(border).
			Padding(0, 1)

	// Game list item
	gameItemStyle = lipgloss.NewStyle().
			Padding(0, 1)

	gameItemSelectedStyle = lipgloss.NewStyle().
				Padding(0, 1).
				Background(selBg).
				Foreground(fg).
				Bold(true)

	// Engine badge
	badgeMZ = lipgloss.NewStyle().
		Foreground(bg).
		Background(primary).
		Padding(0, 1).
		Bold(true)

	badgeMV = lipgloss.NewStyle().
		Foreground(bg).
		Background(cyan).
		Padding(0, 1).
		Bold(true)

	badgeRenpy = lipgloss.NewStyle().
			Foreground(bg).
			Background(secondary).
			Padding(0, 1).
			Bold(true)

	badgeOld = lipgloss.NewStyle().
			Foreground(bg).
			Background(warning).
			Padding(0, 1).
			Bold(true)

	badgeIncomplete = lipgloss.NewStyle().
			Foreground(dim).
			Background(surface).
			Padding(0, 1)

	// Plugin status badges
	pluginOK = lipgloss.NewStyle().
			Foreground(success).
			Bold(true)

	pluginBroken = lipgloss.NewStyle().
			Foreground(error).
			Bold(true)

	pluginNW = lipgloss.NewStyle().
			Foreground(warning).
			Bold(true)

	pluginMissing = lipgloss.NewStyle().
			Foreground(dim)

	// Info labels
	labelStyle = lipgloss.NewStyle().
			Foreground(dimFg).
			Bold(true)

	valueStyle = lipgloss.NewStyle().
			Foreground(fg)

	// Help text
	helpStyle = lipgloss.NewStyle().
			Foreground(dim).
			Italic(true)

	// Header
	headerStyle = lipgloss.NewStyle().
			Foreground(primary).
			Bold(true).
			Padding(0, 0, 0, 0)

	// Section divider
	dividerStyle = lipgloss.NewStyle().
			Foreground(border)
)

func engineBadge(engine string) lipgloss.Style {
	switch engine {
	case "MZ":
		return badgeMZ
	case "MV":
		return badgeMV
	case "renpy":
		return badgeRenpy
	case "VXAce", "VX", "XP", "2000-2003":
		return badgeOld
	case "incomplete", "renpy-incomplete":
		return badgeIncomplete
	default:
		return badgeIncomplete
	}
}

func pluginBadge(category string) lipgloss.Style {
	switch category {
	case "ok":
		return pluginOK
	case "roto":
		return pluginBroken
	case "nw-protegido":
		return pluginNW
	default:
		return pluginMissing
	}
}
