package main

import (
	"fmt"

	"github.com/AsterrZep/rpgmaker-launcher-go/internal/engine"
)

// DecryptGameAssets decrypts all encrypted assets in a game directory.
func (a *App) DecryptGameAssets(gamePath, encryptionKey string) (map[string]interface{}, error) {
	if !dirExists(gamePath) {
		return nil, fmt.Errorf("game directory does not exist")
	}
	d, err := engine.NewDecrypter(encryptionKey)
	if err != nil {
		return nil, err
	}
	success, failed, _, err := d.DecryptDirectory(gamePath)
	if err != nil {
		return nil, err
	}
	return map[string]interface{}{
		"success_count": success, "failed_count": failed, "total_files": success + failed,
	}, nil
}

// ReadEncryptionKey reads the encryption key from rpg_project.json.
func (a *App) ReadEncryptionKey(gamePath string) (*string, error) {
	key, err := engine.ReadKeyFromProject(gamePath)
	if err != nil || key == "" {
		return nil, err
	}
	return &key, nil
}

// HasEncryptedAssets checks if a game has encrypted assets.
func (a *App) HasEncryptedAssets(gamePath string) bool {
	return engine.HasEncryptedAssets(gamePath)
}
