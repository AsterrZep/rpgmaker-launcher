package engine

import (
	"archive/zip"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

// ExtractResult holds the result of a ZIP extraction.
type ExtractResult struct {
	Extracted []string `json:"extracted"`
	Errors    []string `json:"errors"`
}

// ExtractZip extracts a ZIP archive to a destination directory.
// Preserves directory structure and file permissions where possible.
func ExtractZip(zipPath, destDir string) error {
	r, err := zip.OpenReader(zipPath)
	if err != nil {
		return fmt.Errorf("cannot open zip: %w", err)
	}
	defer r.Close()

	os.MkdirAll(destDir, 0755)

	for _, f := range r.File {
		// Sanitize path to prevent zip slip
		fpath := filepath.Join(destDir, filepath.Clean(f.Name))
		if !strings.HasPrefix(fpath, filepath.Clean(destDir)+string(filepath.Separator)) {
			return fmt.Errorf("illegal file path in zip: %s", f.Name)
		}

		if f.FileInfo().IsDir() {
			os.MkdirAll(fpath, 0755)
			continue
		}

		// Ensure parent directory exists
		if parent := filepath.Dir(fpath); parent != "" {
			os.MkdirAll(parent, 0755)
		}

		outFile, err := os.OpenFile(fpath, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, f.Mode())
		if err != nil {
			return fmt.Errorf("cannot create %s: %w", fpath, err)
		}

		rc, err := f.Open()
		if err != nil {
			outFile.Close()
			return fmt.Errorf("cannot open entry %s: %w", f.Name, err)
		}

		_, err = io.Copy(outFile, rc)
		rc.Close()
		outFile.Close()
		if err != nil {
			return fmt.Errorf("cannot extract %s: %w", f.Name, err)
		}
	}
	return nil
}

// ExtractZips extracts multiple ZIP files into a games directory.
// Returns extracted game names and any errors.
func ExtractZips(zipPaths []string, gamesDir string, autoDelete bool) ExtractResult {
	result := ExtractResult{}

	for _, zipPath := range zipPaths {
		gameName := ZipGameName(zipPath)
		destDir := filepath.Join(gamesDir, gameName)

		if err := os.MkdirAll(destDir, 0755); err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("%s: %s", gameName, err))
			continue
		}

		if err := ExtractZip(zipPath, destDir); err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("%s: %s", gameName, err))
			continue
		}

		result.Extracted = append(result.Extracted, gameName)

		if autoDelete {
			os.Remove(zipPath)
		}
	}
	return result
}

// ExtractZipsInDir scans a directory for ZIPs and extracts them.
func ExtractZipsInDir(gamesDir string, autoDelete bool) ExtractResult {
	entries, err := os.ReadDir(gamesDir)
	if err != nil {
		return ExtractResult{Errors: []string{err.Error()}}
	}

	var zipPaths []string
	for _, e := range entries {
		if !e.IsDir() && strings.ToLower(filepath.Ext(e.Name())) == ".zip" {
			zipPaths = append(zipPaths, filepath.Join(gamesDir, e.Name()))
		}
	}
	return ExtractZips(zipPaths, gamesDir, autoDelete)
}

// ZipGameName derives a game name from a ZIP filename.
// Strips .zip extensions: "Game.zip" → "Game", "Game.zip.zip" → "Game"
func ZipGameName(zipPath string) string {
	name := filepath.Base(zipPath)
	for strings.HasSuffix(strings.ToLower(name), ".zip") {
		name = strings.TrimSuffix(name, filepath.Ext(name))
	}
	if name == "" || name == "." {
		return "juego"
	}
	return name
}

// HasZipFiles checks if a directory contains any ZIP files.
func HasZipFiles(dir string) bool {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return false
	}
	for _, e := range entries {
		if !e.IsDir() && strings.ToLower(filepath.Ext(e.Name())) == ".zip" {
			return true
		}
	}
	return false
}
