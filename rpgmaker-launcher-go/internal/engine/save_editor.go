package engine

import (
	"bytes"
	"compress/zlib"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"time"

	"github.com/AsterrZep/rpgmaker-launcher-go/internal/core"
)

// SaveFormat represents the detected format of a save file.
type SaveFormat int

const (
	SaveFormatUnknown SaveFormat = iota
	SaveFormatMvMz
	SaveFormatRubyMarshal
)

// SaveEditor provides save file reading and writing.
type SaveEditor struct {
	BackupsDir string
}

// NewSaveEditor creates a new save editor.
func NewSaveEditor(backupsDir string) *SaveEditor {
	return &SaveEditor{BackupsDir: backupsDir}
}

// DetectFormat identifies the format of a save file.
func DetectFormat(path string) SaveFormat {
	f, err := os.Open(path)
	if err != nil {
		return SaveFormatUnknown
	}
	defer f.Close()

	header := make([]byte, 16)
	if _, err := io.ReadFull(f, header); err != nil {
		return SaveFormatUnknown
	}

	// MV/MZ: zlib compressed
	if header[0] == 0x78 && (header[1] == 0x01 || header[1] == 0x9C || header[1] == 0xDA) {
		return SaveFormatMvMz
	}
	// Ruby Marshal header 4.8
	if header[0] == 4 && header[1] == 8 {
		return SaveFormatRubyMarshal
	}
	return SaveFormatUnknown
}

// LoadSave reads an RPG Maker MV/MZ save file (zlib-compressed JSON).
func (se *SaveEditor) LoadSave(path string) (map[string]interface{}, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var jsonStr string
	if len(data) >= 2 && data[0] == 0x78 {
		reader, err := zlib.NewReader(bytes.NewReader(data))
		if err != nil {
			return nil, fmt.Errorf("zlib decompress error: %w", err)
		}
		defer reader.Close()
		decompressed, err := io.ReadAll(reader)
		if err != nil {
			return nil, err
		}
		jsonStr = string(decompressed)
	} else {
		jsonStr = string(data)
	}

	var result map[string]interface{}
	if err := json.Unmarshal([]byte(jsonStr), &result); err != nil {
		return nil, err
	}
	return result, nil
}

// SaveSave writes an RPG Maker MV/MZ save file (zlib-compressed JSON).
func (se *SaveEditor) SaveSave(path string, data map[string]interface{}) error {
	// Create backup if configured
	if se.BackupsDir != "" {
		if _, err := os.Stat(path); err == nil {
			se.createBackup(path)
		}
	}

	jsonBytes, err := json.Marshal(data)
	if err != nil {
		return err
	}

	var buf bytes.Buffer
	writer, _ := zlib.NewWriterLevel(&buf, zlib.BestSpeed)
	writer.Write(jsonBytes)
	writer.Close()

	return os.WriteFile(path, buf.Bytes(), 0644)
}

// GetSaveInfo extracts readable info from a save.
func (se *SaveEditor) GetSaveInfo(path string) (*core.SaveInfo, error) {
	data, err := se.LoadSave(path)
	if err != nil {
		return nil, err
	}
	return extractSaveInfo(data), nil
}

// UpdateSave applies partial updates to a save.
func (se *SaveEditor) UpdateSave(path string, updates map[string]interface{}) error {
	data, err := se.LoadSave(path)
	if err != nil {
		return err
	}

	// Apply gold
	if gold, ok := updates["gold"]; ok {
		party := getOrInitMap(data, "party")
		party["_gold"] = gold
	}

	// Apply items
	if items, ok := updates["items"].(map[string]interface{}); ok {
		party := getOrInitMap(data, "party")
		partyItems := getOrInitMap(party, "_items")
		for k, v := range items {
			partyItems[k] = v
		}
	}

	// Apply variables
	if variables, ok := updates["variables"].(map[string]interface{}); ok {
		varObj := getOrInitMap(data, "variables")
		dataArr := getOrInitSlice(varObj, "_data")
		for k, v := range variables {
			var idx int
			fmt.Sscanf(k, "%d", &idx)
			for len(dataArr) <= idx {
				dataArr = append(dataArr, nil)
			}
			dataArr[idx] = v
		}
		varObj["_data"] = dataArr
	}

	// Apply switches
	if switches, ok := updates["switches"].(map[string]interface{}); ok {
		swObj := getOrInitMap(data, "switches")
		dataArr := getOrInitSlice(swObj, "_data")
		for k, v := range switches {
			var idx int
			fmt.Sscanf(k, "%d", &idx)
			for len(dataArr) <= idx {
				dataArr = append(dataArr, false)
			}
			if b, ok := v.(bool); ok {
				dataArr[idx] = b
			} else {
				dataArr[idx] = true
			}
		}
		swObj["_data"] = dataArr
	}

	return se.SaveSave(path, data)
}

func (se *SaveEditor) createBackup(path string) {
	ts := time.Now().Format("20060102-150405")
	gameName := filepath.Base(filepath.Dir(filepath.Dir(path)))
	backupDir := filepath.Join(se.BackupsDir, gameName, "save-edit-"+ts)
	os.MkdirAll(backupDir, 0755)
	data, _ := os.ReadFile(path)
	if data != nil {
		os.WriteFile(filepath.Join(backupDir, filepath.Base(path)), data, 0644)
	}
}

func extractSaveInfo(data map[string]interface{}) *core.SaveInfo {
	info := &core.SaveInfo{}

	party, _ := data["party"].(map[string]interface{})
	if party != nil {
		if gold, ok := party["_gold"].(float64); ok {
			info.Gold = int(gold)
		}
	}

	// Extract actors
	actorsObj, _ := data["actors"].(map[string]interface{})
	if actorsData, ok := actorsObj["_data"].([]interface{}); ok {
		for i, a := range actorsData {
			actor, ok := a.(map[string]interface{})
			if !ok {
				continue
			}
			name, _ := actor["_name"].(string)
			if name == "" {
				continue
			}
			ai := core.ActorInfo{ID: i, Name: name}
			if v, ok := actor["_level"].(float64); ok {
				ai.Level = int(v)
			}
			if v, ok := actor["_hp"].(float64); ok {
				ai.HP = int(v)
			}
			if v, ok := actor["_mp"].(float64); ok {
				ai.MP = int(v)
			}
			info.Actors = append(info.Actors, ai)
		}
	}

	return info
}

func getOrInitMap(parent map[string]interface{}, key string) map[string]interface{} {
	if m, ok := parent[key].(map[string]interface{}); ok {
		return m
	}
	m := make(map[string]interface{})
	parent[key] = m
	return m
}

func getOrInitSlice(parent map[string]interface{}, key string) []interface{} {
	if s, ok := parent[key].([]interface{}); ok {
		return s
	}
	return nil
}
