package engine

import (
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

// ProcessManager handles launching game processes.
type ProcessManager struct{}

// NewProcessManager creates a new process manager.
func NewProcessManager() *ProcessManager {
	return &ProcessManager{}
}

// LaunchNativeGame starts a native game process.
func (pm *ProcessManager) LaunchNativeGame(name, root, engine string) error {
	var cmd *exec.Cmd

	switch engine {
	case "2000-2003":
		cmd = exec.Command("easyrpg-player", root)
	case "renpy":
		sh := findRenpyLauncher(root)
		if sh == "" {
			return os.ErrNotExist
		}
		cmd = exec.Command(sh)
		cmd.Dir = root
	default:
		mkxpz := findMkxpz()
		if mkxpz == "" {
			return os.ErrNotExist
		}
		cmd = exec.Command(mkxpz)
		cmd.Dir = root
	}

	cmd.Env = append(os.Environ(), "SRCDIR="+root)
	cmd.Stdout = nil
	cmd.Stderr = nil
	return cmd.Start()
}

func findRenpyLauncher(root string) string {
	entries, err := os.ReadDir(root)
	if err != nil {
		return ""
	}
	for _, e := range entries {
		if !e.IsDir() && strings.HasSuffix(e.Name(), ".sh") && e.Name() != "." {
			return filepath.Join(root, e.Name())
		}
	}
	return ""
}

func findMkxpz() string {
	candidates := []string{
		filepath.Join("runtimes", "mkxp-z"),
		"mkxp-z",
	}
	for _, c := range candidates {
		if info, err := os.Stat(c); err == nil && info.Mode()&0111 != 0 {
			return c
		}
	}
	// Check PATH
	path, err := exec.LookPath("mkxp-z")
	if err == nil {
		return path
	}
	return ""
}
