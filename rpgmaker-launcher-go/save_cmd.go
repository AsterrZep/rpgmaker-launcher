package main

import (
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/AsterrZep/rpgmaker-launcher-go/internal/core"
)

// GetSaves lists save files for a game.
func (a *App) GetSaves(gamePath string) (map[string]interface{}, error) {
	savesDir := filepath.Join(gamePath, "save")
	if !dirExists(savesDir) {
		return map[string]interface{}{"saves": []core.SaveFileInfo{}, "count": 0}, nil
	}
	var saves []core.SaveFileInfo
	entries, _ := os.ReadDir(savesDir)
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		info, _ := e.Info()
		saves = append(saves, core.SaveFileInfo{
			Name: e.Name(), SizeBytes: info.Size(), SizeKB: float64(info.Size()) / 1024,
			MTime: info.ModTime().Unix(), MTimeStr: info.ModTime().Format("02/01/2006 15:04"),
		})
	}
	return map[string]interface{}{"saves": saves, "saves_dir": savesDir, "count": len(saves)}, nil
}

// GetSaveContent returns the parsed content of a save file.
func (a *App) GetSaveContent(gamePath, saveName string) (*core.SaveInfo, error) {
	savePath := filepath.Join(gamePath, "save", saveName)
	return a.saveEditor.GetSaveInfo(savePath)
}

// UpdateSaveContent applies updates to a save file.
func (a *App) UpdateSaveContent(gamePath, saveName string, updates map[string]interface{}) (bool, error) {
	savePath := filepath.Join(gamePath, "save", saveName)
	if !fileExists(savePath) {
		return false, fmt.Errorf("save file does not exist")
	}
	err := a.saveEditor.UpdateSave(savePath, updates)
	return err == nil, err
}

// BackupSave creates a backup of a save file.
func (a *App) BackupSave(gamePath, saveName string) (string, error) {
	savePath := filepath.Join(gamePath, "save", saveName)
	if !fileExists(savePath) {
		return "", fmt.Errorf("save file does not exist")
	}
	ts := time.Now().Format("20060102-150405")
	gameName := filepath.Base(filepath.Dir(filepath.Dir(savePath)))
	backupDir := filepath.Join(core.BackupsDir(), gameName, "save-edit-"+ts)
	os.MkdirAll(backupDir, 0755)
	data, _ := os.ReadFile(savePath)
	backupPath := filepath.Join(backupDir, saveName)
	os.WriteFile(backupPath, data, 0644)
	return backupPath, nil
}
