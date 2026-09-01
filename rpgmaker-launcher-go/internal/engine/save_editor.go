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
	SaveFormatUnknown     SaveFormat = iota
	SaveFormatMvMz                    // zlib-compressed JSON
	SaveFormatRubyMarshal             // Ruby Marshal v4.8 binary
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
	data, err := os.ReadFile(path)
	if err != nil || len(data) < 2 {
		return SaveFormatUnknown
	}

	// MV/MZ: zlib compressed (starts with 0x78)
	if data[0] == 0x78 && (data[1] == 0x01 || data[1] == 0x9C || data[1] == 0xDA) {
		return SaveFormatMvMz
	}
	// Ruby Marshal header 4.8
	if IsRubyMarshal(data) {
		return SaveFormatRubyMarshal
	}
	return SaveFormatUnknown
}

// LoadSave reads any supported save format and returns a Go value.
func (se *SaveEditor) LoadSave(path string) (interface{}, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	format := DetectFormat(path)

	switch format {
	case SaveFormatMvMz:
		return se.loadMvMzSave(data)
	case SaveFormatRubyMarshal:
		return se.loadRubyMarshalSave(data)
	default:
		// Try as plain JSON
		var result interface{}
		if err := json.Unmarshal(data, &result); err != nil {
			return nil, fmt.Errorf("unsupported save format")
		}
		return result, nil
	}
}

// LoadSaveAsMap reads a save and returns it as a map (for MV/MZ and JSON).
// For Ruby Marshal saves, returns a map with the decoded data.
func (se *SaveEditor) LoadSaveAsMap(path string) (map[string]interface{}, error) {
	format := DetectFormat(path)

	if format == SaveFormatRubyMarshal {
		data, err := os.ReadFile(path)
		if err != nil {
			return nil, err
		}
		return se.loadRubyMarshalAsMap(data)
	}

	v, err := se.LoadSave(path)
	if err != nil {
		return nil, err
	}
	if m, ok := v.(map[string]interface{}); ok {
		return m, nil
	}
	return nil, fmt.Errorf("save is not a map")
}

// GetSaveInfo extracts readable info from a save.
func (se *SaveEditor) GetSaveInfo(path string) (*core.SaveInfo, error) {
	format := DetectFormat(path)

	if format == SaveFormatRubyMarshal {
		return se.getRubyMarshalSaveInfo(path)
	}

	v, err := se.LoadSave(path)
	if err != nil {
		return nil, err
	}
	data, ok := v.(map[string]interface{})
	if !ok {
		return &core.SaveInfo{}, nil
	}
	return extractSaveInfo(data), nil
}

// UpdateSave applies partial updates to a save.
func (se *SaveEditor) UpdateSave(path string, updates map[string]interface{}) error {
	format := DetectFormat(path)

	if format == SaveFormatRubyMarshal {
		return se.updateRubyMarshalSave(path, updates)
	}

	data, err := se.LoadSaveAsMap(path)
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

// SaveSave writes a save in its original format.
func (se *SaveEditor) SaveSave(path string, data interface{}) error {
	// Create backup if configured
	if se.BackupsDir != "" {
		if _, err := os.Stat(path); err == nil {
			se.createBackup(path)
		}
	}

	format := DetectFormat(path)

	switch format {
	case SaveFormatMvMz:
		return se.saveMvMzSave(path, data)
	case SaveFormatRubyMarshal:
		return se.saveRubyMarshalSave(path, data)
	default:
		// Default: write as JSON
		jsonBytes, err := json.MarshalIndent(data, "", "  ")
		if err != nil {
			return err
		}
		return os.WriteFile(path, jsonBytes, 0644)
	}
}

// ──────────────────────────────────────────────────────────
//  MV/MZ format (zlib-compressed JSON)
// ──────────────────────────────────────────────────────────

func (se *SaveEditor) loadMvMzSave(data []byte) (interface{}, error) {
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

	var result interface{}
	if err := json.Unmarshal([]byte(jsonStr), &result); err != nil {
		return nil, err
	}
	return result, nil
}

func (se *SaveEditor) saveMvMzSave(path string, data interface{}) error {
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

// ──────────────────────────────────────────────────────────
//  Ruby Marshal format (XP/VX/VX Ace)
// ──────────────────────────────────────────────────────────

func (se *SaveEditor) loadRubyMarshalSave(data []byte) (interface{}, error) {
	return RbUnmarshal(data)
}

func (se *SaveEditor) loadRubyMarshalAsMap(data []byte) (map[string]interface{}, error) {
	v, err := RbUnmarshal(data)
	if err != nil {
		return nil, err
	}
	if m, ok := v.(map[string]interface{}); ok {
		return m, nil
	}
	// Wrap in a map if it's an array or other type
	return map[string]interface{}{"__raw__": v}, nil
}

func (se *SaveEditor) saveRubyMarshalSave(path string, data interface{}) error {
	var marshalData interface{}
	switch v := data.(type) {
	case map[string]interface{}:
		// Remove __class__ wrapper if present
		if _, ok := v["__class__"]; ok {
			marshalData = v
		} else {
			marshalData = v
		}
	default:
		marshalData = data
	}

	bytes, err := MarshalToBytes(marshalData)
	if err != nil {
		return fmt.Errorf("ruby marshal encode error: %w", err)
	}
	return os.WriteFile(path, bytes, 0644)
}

func (se *SaveEditor) getRubyMarshalSaveInfo(path string) (*core.SaveInfo, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	v, err := RbUnmarshal(data)
	if err != nil {
		return nil, fmt.Errorf("ruby marshal parse error: %w", err)
	}

	info := &core.SaveInfo{}

	// Try to extract common RPG Maker fields
	if m, ok := v.(map[string]interface{}); ok {
		// Gold from party
		if party, ok := m["party"].(map[string]interface{}); ok {
			if gold, ok := party["_gold"].(int64); ok {
				info.Gold = int(gold)
			}
		}

		// Actors
		if actors, ok := m["actors"].(map[string]interface{}); ok {
			if dataArr, ok := actors["_data"].([]interface{}); ok {
				for i, a := range dataArr {
					if actor, ok := a.(map[string]interface{}); ok {
						name, _ := actor["_name"].(string)
						if name == "" {
							continue
						}
						ai := core.ActorInfo{ID: i, Name: name}
						if v, ok := actor["_level"].(int64); ok {
							ai.Level = int(v)
						}
						if v, ok := actor["_hp"].(int64); ok {
							ai.HP = int(v)
						}
						if v, ok := actor["_mp"].(int64); ok {
							ai.MP = int(v)
						}
						info.Actors = append(info.Actors, ai)
					}
				}
			}
		}
	}

	return info, nil
}

func (se *SaveEditor) updateRubyMarshalSave(path string, updates map[string]interface{}) error {
	data, err := se.loadRubyMarshalAsMap(readFileBytes(path))
	if err != nil {
		return err
	}

	// Apply updates (same as MV/MZ for the map structure)
	if gold, ok := updates["gold"]; ok {
		party := getOrInitMap(data, "party")
		party["_gold"] = gold
	}

	if items, ok := updates["items"].(map[string]interface{}); ok {
		party := getOrInitMap(data, "party")
		partyItems := getOrInitMap(party, "_items")
		for k, v := range items {
			partyItems[k] = v
		}
	}

	return se.saveRubyMarshalSave(path, data)
}

// ──────────────────────────────────────────────────────────
//  Common helpers
// ──────────────────────────────────────────────────────────

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

func readFileBytes(path string) []byte {
	data, _ := os.ReadFile(path)
	return data
}
