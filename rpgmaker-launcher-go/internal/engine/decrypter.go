package engine

import (
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
)

const headerLen = 16

// RPGMV header signature (first 16 bytes of encrypted files).
var headerSignature = []byte("RPGMV\x00\x00\x00\x00\x03\x01\x00\x00\x00\x00\x00")

// Encrypted extensions and their decrypted counterparts.
var encryptedExtensions = map[string]string{
	"rpgmvp": "png",
	"rpgmvm": "m4a",
	"rpgmvo": "ogg",
	"png_":   "png",
	"m4a_":   "m4a",
	"ogg_":   "ogg",
}

// Decrypter handles XOR-based decryption of RPG Maker assets.
type Decrypter struct {
	key []byte
}

// NewDecrypter creates a decrypter from a hex key string.
func NewDecrypter(keyHex string) (*Decrypter, error) {
	if keyHex == "" {
		return nil, fmt.Errorf("empty encryption key")
	}
	key, err := hex.DecodeString(keyHex)
	if err != nil {
		return nil, fmt.Errorf("invalid hex key: %w", err)
	}
	if len(key) == 0 {
		return nil, fmt.Errorf("key cannot be empty")
	}
	return &Decrypter{key: key}, nil
}

// DecryptBuffer decrypts a byte slice in memory.
func (d *Decrypter) DecryptBuffer(data []byte) ([]byte, error) {
	if len(data) < headerLen {
		return nil, fmt.Errorf("file too small to be an RPG Maker asset")
	}
	if string(data[:headerLen]) != string(headerSignature) {
		return nil, fmt.Errorf("RPG Maker header not detected")
	}
	body := make([]byte, len(data)-headerLen)
	copy(body, data[headerLen:])
	keyLen := len(d.key)
	for i := 0; i < headerLen && i < len(body); i++ {
		body[i] ^= d.key[i%keyLen]
	}
	return body, nil
}

// DecryptFile decrypts a single file.
func (d *Decrypter) DecryptFile(inputPath, outputPath string) error {
	data, err := os.ReadFile(inputPath)
	if err != nil {
		return err
	}
	decrypted, err := d.DecryptBuffer(data)
	if err != nil {
		return err
	}
	if parent := filepath.Dir(outputPath); parent != "" {
		os.MkdirAll(parent, 0755)
	}
	return os.WriteFile(outputPath, decrypted, 0644)
}

// DecryptBatch decrypts multiple files in parallel.
func (d *Decrypter) DecryptBatch(files [][2]string) []error {
	results := make([]error, len(files))
	var wg sync.WaitGroup
	for i, pair := range files {
		wg.Add(1)
		go func(i int, input, output string) {
			defer wg.Done()
			results[i] = d.DecryptFile(input, output)
		}(i, pair[0], pair[1])
	}
	wg.Wait()
	return results
}

// DecryptDirectory decrypts all encrypted assets in a directory.
func (d *Decrypter) DecryptDirectory(dir string) (success, failed int, files []string, err error) {
	encrypted := scanEncryptedFiles(dir)
	if len(encrypted) == 0 {
		return 0, 0, nil, nil
	}

	var pairs [][2]string
	for _, pair := range encrypted {
		output := getOutputPath(pair[0])
		pairs = append(pairs, [2]string{pair[0], output})
	}

	results := d.DecryptBatch(pairs)
	for i, e := range results {
		if e != nil {
			failed++
		} else {
			success++
			files = append(files, pairs[i][1])
		}
	}

	// Remove originals on success
	for i, e := range results {
		if e == nil {
			os.Remove(pairs[i][0])
		}
	}
	return
}

// ReadKeyFromProject reads the encryption key from rpg_project.json.
func ReadKeyFromProject(gameDir string) (string, error) {
	candidates := []string{
		filepath.Join(gameDir, "www", "rpg_project.json"),
		filepath.Join(gameDir, "rpg_project.json"),
	}
	for _, path := range candidates {
		data, err := os.ReadFile(path)
		if err != nil {
			continue
		}
		var project map[string]interface{}
		if err := json.Unmarshal(data, &project); err != nil {
			continue
		}
		if key, ok := project["encryptionKey"].(string); ok && key != "" {
			return key, nil
		}
	}
	return "", nil
}

// HasEncryptedAssets checks if a directory has encrypted files.
func HasEncryptedAssets(dir string) bool {
	return len(scanEncryptedFiles(dir)) > 0
}

func scanEncryptedFiles(dir string) [][2]string {
	var results [][2]string
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil
	}
	for _, entry := range entries {
		path := filepath.Join(dir, entry.Name())
		if entry.IsDir() {
			results = append(results, scanEncryptedFiles(path)...)
			continue
		}
		ext := filepath.Ext(path)
		if ext != "" {
			ext = ext[1:] // remove dot
		}
		if decExt, ok := encryptedExtensions[ext]; ok {
			results = append(results, [2]string{path, decExt})
		}
	}
	return results
}

func getOutputPath(input string) string {
	ext := filepath.Ext(input)
	if ext != "" {
		ext = ext[1:]
	}
	if decExt, ok := encryptedExtensions[ext]; ok {
		base := input[:len(input)-len(filepath.Ext(input))]
		return base + "." + decExt
	}
	return input
}
