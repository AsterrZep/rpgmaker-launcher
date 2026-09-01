package services

import (
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/AsterrZep/rpgmaker-launcher-go/internal/core"
)

// SyncService handles save synchronization.
type SyncService struct {
	DestFolder string
	AutoSync   bool
}

// NewSyncService creates a new sync service.
func NewSyncService(destFolder string, autoSync bool) *SyncService {
	return &SyncService{DestFolder: destFolder, AutoSync: autoSync}
}

// SyncGame synchronizes saves for a single game.
func (ss *SyncService) SyncGame(gameName, localSavesDir, mode string) (*core.SyncResult, error) {
	destSavesDir := filepath.Join(ss.DestFolder, gameName, "save")

	switch mode {
	case "push":
		count, err := copyFiles(localSavesDir, destSavesDir)
		if err != nil {
			return nil, err
		}
		return &core.SyncResult{Game: gameName, Count: count, Direction: "push"}, nil
	case "pull":
		count, err := ss.pullSaves(localSavesDir, destSavesDir)
		if err != nil {
			return nil, err
		}
		return &core.SyncResult{Game: gameName, Count: count, Direction: "pull"}, nil
	default:
		return nil, fmt.Errorf("invalid mode: %s", mode)
	}
}

// SyncAll synchronizes saves for all games.
func (ss *SyncService) SyncAll(games []core.GameInfo, mode string) []core.SyncResult {
	var results []core.SyncResult
	for _, g := range games {
		savesDir := filepath.Join(g.Path, "save")
		if !dirExists(savesDir) {
			continue
		}
		result, err := ss.SyncGame(g.Name, savesDir, mode)
		if err != nil {
			continue
		}
		results = append(results, *result)
	}
	return results
}

// IsConfigured returns true if a sync folder is set.
func (ss *SyncService) IsConfigured() bool {
	return ss.DestFolder != "" && dirExists(ss.DestFolder)
}

func (ss *SyncService) pullSaves(localDir, destDir string) (int, error) {
	if !dirExists(destDir) {
		return 0, nil
	}
	// Backup before pull
	if dirExists(localDir) && countFiles(localDir) > 0 {
		createPrePullBackup(localDir)
	}
	return copyFiles(destDir, localDir)
}

func createPrePullBackup(savesDir string) {
	ts := time.Now().Format("20060102-150405")
	parent := filepath.Dir(savesDir)
	dirName := filepath.Base(savesDir)
	backupDir := filepath.Join(parent, dirName+"-pre-pull-"+ts)
	os.MkdirAll(backupDir, 0755)
	copyFiles(savesDir, backupDir)
}

func copyFiles(src, dst string) (int, error) {
	if !dirExists(src) {
		return 0, nil
	}
	os.MkdirAll(dst, 0755)
	count := 0
	entries, err := os.ReadDir(src)
	if err != nil {
		return 0, err
	}
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		srcPath := filepath.Join(src, e.Name())
		dstPath := filepath.Join(dst, e.Name())
		data, err := os.ReadFile(srcPath)
		if err != nil {
			continue
		}
		if err := os.WriteFile(dstPath, data, 0644); err == nil {
			count++
		}
	}
	return count, nil
}

func countFiles(dir string) int {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return 0
	}
	count := 0
	for _, e := range entries {
		if !e.IsDir() {
			count++
		}
	}
	return count
}

func dirExists(path string) bool {
	info, err := os.Stat(path)
	return err == nil && info.IsDir()
}
