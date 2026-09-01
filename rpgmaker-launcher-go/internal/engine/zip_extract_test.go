package engine

import (
	"archive/zip"
	"os"
	"path/filepath"
	"testing"
)

func createTestZip(t *testing.T, dir string, files map[string]string) string {
	t.Helper()
	zipPath := filepath.Join(dir, "test.zip")
	f, err := os.Create(zipPath)
	if err != nil {
		t.Fatal(err)
	}
	defer f.Close()

	w := zip.NewWriter(f)
	for name, content := range files {
		fw, err := w.Create(name)
		if err != nil {
			t.Fatal(err)
		}
		fw.Write([]byte(content))
	}
	w.Close()
	return zipPath
}

func TestExtractZip(t *testing.T) {
	dir := t.TempDir()
	zipPath := createTestZip(t, dir, map[string]string{
		"index.html":       "<html></html>",
		"js/rmmz_core.js":  "core",
		"save/Save1.rpgmz": "data",
	})

	destDir := filepath.Join(dir, "output")
	err := ExtractZip(zipPath, destDir)
	if err != nil {
		t.Fatal(err)
	}

	// Verify files
	for _, f := range []string{"index.html", "js/rmmz_core.js", "save/Save1.rpgmz"} {
		path := filepath.Join(destDir, f)
		data, err := os.ReadFile(path)
		if err != nil {
			t.Errorf("missing file %s: %v", f, err)
			continue
		}
		if len(data) == 0 {
			t.Errorf("file %s is empty", f)
		}
	}
}

func TestExtractZipPreventsZipSlip(t *testing.T) {
	dir := t.TempDir()
	zipPath := createTestZip(t, dir, map[string]string{
		"../../../etc/passwd": "hacked",
	})

	destDir := filepath.Join(dir, "output")
	err := ExtractZip(zipPath, destDir)
	if err == nil {
		t.Error("expected error for zip slip path, got nil")
	}
}

func TestZipGameName(t *testing.T) {
	tests := []struct{ input, expected string }{
		{"/path/to/MyGame.zip", "MyGame"},
		{"/path/to/MyGame.zip.zip", "MyGame"},
		{"/path/to/.zip", "juego"},
		{"Game.zip", "Game"},
	}
	for _, tt := range tests {
		got := ZipGameName(tt.input)
		if got != tt.expected {
			t.Errorf("ZipGameName(%q) = %q, want %q", tt.input, got, tt.expected)
		}
	}
}

func TestExtractZips(t *testing.T) {
	dir := t.TempDir()
	gamesDir := filepath.Join(dir, "games")
	os.MkdirAll(gamesDir, 0755)

	zip1 := createTestZip(t, dir, map[string]string{"index.html": "<html>Game1</html>"})
	os.Rename(zip1, filepath.Join(gamesDir, "Game1.zip"))

	zip2 := createTestZip(t, dir, map[string]string{"index.html": "<html>Game2</html>"})
	os.Rename(zip2, filepath.Join(gamesDir, "Game2.zip"))

	result := ExtractZipsInDir(gamesDir, false)
	if len(result.Extracted) != 2 {
		t.Errorf("expected 2 extracted, got %d", len(result.Extracted))
	}
	if len(result.Errors) != 0 {
		t.Errorf("expected 0 errors, got %d: %v", len(result.Errors), result.Errors)
	}
}
