package engine

import (
	"os"
	"reflect"
	"testing"
)

func TestIsRubyMarshal(t *testing.T) {
	if !IsRubyMarshal([]byte{4, 8, 'n'}) {
		t.Error("expected true for Ruby Marshal header")
	}
	if IsRubyMarshal([]byte{0x78, 0x9C, 0x00}) {
		t.Error("expected false for zlib data")
	}
	if IsRubyMarshal([]byte{4}) {
		t.Error("expected false for short data")
	}
}

func TestUnmarshalNil(t *testing.T) {
	data := []byte{4, 8, rmNil}
	v, err := RbUnmarshal(data)
	if err != nil {
		t.Fatal(err)
	}
	if v != nil {
		t.Errorf("expected nil, got %v", v)
	}
}

func TestUnmarshalTrue(t *testing.T) {
	data := []byte{4, 8, rmTrue}
	v, err := RbUnmarshal(data)
	if err != nil {
		t.Fatal(err)
	}
	if v != true {
		t.Errorf("expected true, got %v", v)
	}
}

func TestUnmarshalFalse(t *testing.T) {
	data := []byte{4, 8, rmFalse}
	v, err := RbUnmarshal(data)
	if err != nil {
		t.Fatal(err)
	}
	if v != false {
		t.Errorf("expected false, got %v", v)
	}
}

func TestUnmarshalFixnum(t *testing.T) {
	tests := []struct {
		name     string
		input    []byte
		expected int64
	}{
		// Zero: fixnum marker + 0
		{"zero", []byte{4, 8, rmFixnum, 0}, 0},
		// One: fixnum marker + 1 (length) + 1 (value)
		{"one", []byte{4, 8, rmFixnum, 1, 1}, 1},
		// 256: fixnum marker + 2 (length) + 0x00, 0x01 (little-endian)
		{"256", []byte{4, 8, rmFixnum, 2, 0, 1}, 256},
		// -1: fixnum marker + -1 (0xFF as int8, meaning 1 byte negative) + 0xFF (value)
		{"neg1", []byte{4, 8, rmFixnum, 0xFF, 0xFF}, -1},
		// -2: fixnum marker + -1 (1 byte negative) + 0xFE
		{"neg2", []byte{4, 8, rmFixnum, 0xFF, 0xFE}, -2},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			v, err := RbUnmarshal(tt.input)
			if err != nil {
				t.Fatal(err)
			}
			if v != tt.expected {
				t.Errorf("expected %d, got %v", tt.expected, v)
			}
		})
	}
}

func TestUnmarshalString(t *testing.T) {
	// "hello" = '"' + raw_fixnum(5) + "hello"
	// raw fixnum(5) = 1 (length byte) + 5 (value)
	data := []byte{4, 8, rmString, 1, 5, 'h', 'e', 'l', 'l', 'o'}
	v, err := RbUnmarshal(data)
	if err != nil {
		t.Fatal(err)
	}
	if v != "hello" {
		t.Errorf("expected 'hello', got %v", v)
	}
}

func TestUnmarshalArray(t *testing.T) {
	// [1, 2, 3] = '[' + raw_fixnum(3) + raw_fixnum(1) + raw_fixnum(2) + raw_fixnum(3)
	data := []byte{
		4, 8, rmArray,
		1, 3, // array length = 3 (raw fixnum)
		rmFixnum, 1, 1, // element 0 = 1 (standalone fixnum)
		rmFixnum, 1, 2, // element 1 = 2
		rmFixnum, 1, 3, // element 2 = 3
	}
	v, err := RbUnmarshal(data)
	if err != nil {
		t.Fatal(err)
	}
	arr, ok := v.([]interface{})
	if !ok {
		t.Fatalf("expected array, got %T", v)
	}
	if len(arr) != 3 {
		t.Errorf("expected 3 elements, got %d", len(arr))
	}
	if arr[0] != int64(1) || arr[1] != int64(2) || arr[2] != int64(3) {
		t.Errorf("unexpected values: %v", arr)
	}
}

func TestUnmarshalHash(t *testing.T) {
	// {"key" => "value"} = '{' + raw_fixnum(1) + "key" + "value"
	data := []byte{
		4, 8, rmHash,
		1, 1, // 1 pair
		rmString, 1, 3, 'k', 'e', 'y', // key
		rmString, 1, 5, 'v', 'a', 'l', 'u', 'e', // value
	}
	v, err := RbUnmarshal(data)
	if err != nil {
		t.Fatal(err)
	}
	m, ok := v.(map[string]interface{})
	if !ok {
		t.Fatalf("expected map, got %T", v)
	}
	if m["key"] != "value" {
		t.Errorf("expected key=value, got %v", m)
	}
}

func TestEncodeDecodeFixnum(t *testing.T) {
	tests := []int64{0, 1, -1, 42, 256, -256, 100000}
	for _, val := range tests {
		encoded := EncodeFixnum(val)
		data := append([]byte{4, 8, rmFixnum}, encoded...)
		v, err := RbUnmarshal(data)
		if err != nil {
			t.Errorf("val=%d: %v", val, err)
			continue
		}
		if v != val {
			t.Errorf("val=%d: got %v", val, v)
		}
	}
}

func TestMarshalString(t *testing.T) {
	s := "hello world"
	encoded := EncodeString(s)
	data := append([]byte{4, 8}, encoded...)
	v, err := RbUnmarshal(data)
	if err != nil {
		t.Fatal(err)
	}
	if v != s {
		t.Errorf("expected %q, got %v", s, v)
	}
}

func TestMarshalToBytesRoundtrip(t *testing.T) {
	original := map[string]interface{}{
		"name": "Test",
		"gold": int64(1234),
		"items": []interface{}{
			map[string]interface{}{
				"id":   int64(1),
				"name": "Sword",
			},
		},
	}

	encoded, err := MarshalToBytes(original)
	if err != nil {
		t.Fatal(err)
	}

	decoded, err := RbUnmarshal(encoded)
	if err != nil {
		t.Fatal(err)
	}

	m, ok := decoded.(map[string]interface{})
	if !ok {
		t.Fatalf("expected map, got %T", decoded)
	}
	if m["name"] != "Test" {
		t.Errorf("name: expected 'Test', got %v", m["name"])
	}
	if m["gold"] != int64(1234) {
		t.Errorf("gold: expected 1234, got %v", m["gold"])
	}
}

func TestDetectFormat(t *testing.T) {
	tests := []struct {
		name     string
		data     []byte
		expected SaveFormat
	}{
		{"nil_ruby", []byte{4, 8, 'n'}, SaveFormatRubyMarshal},
		{"mvmz", []byte{0x78, 0x9C, 0x01}, SaveFormatMvMz},
		{"ruby_fixnum", []byte{4, 8, rmFixnum, 0}, SaveFormatRubyMarshal},
		{"empty", []byte{}, SaveFormatUnknown},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			dir := t.TempDir()
			path := dir + "/test.save"
			os.WriteFile(path, tt.data, 0644)
			got := DetectFormat(path)
			if got != tt.expected {
				t.Errorf("DetectFormat() = %v, want %v", got, tt.expected)
			}
		})
	}
}

func TestRubyMarshalObject(t *testing.T) {
	// Simulate: #<RPG::Actor @actor_id=1>
	// Object: 'o' + symbol("RPG::Actor") + ivar count + ivars
	classSym := "RPG::Actor"
	ivarKey := "@actor_id"

	// Build the object manually
	data := []byte{4, 8} // version
	data = append(data, rmObject)
	// Class name as symbol
	data = append(data, rmSymbol)
	data = append(data, EncodeFixnum(int64(len(classSym)))...)
	data = append(data, classSym...)
	// Ivar count (encoded as '@' + fixnum)
	data = append(data, '@')
	data = append(data, EncodeFixnum(1)...)
	// Ivar key as symbol
	data = append(data, rmSymbol)
	data = append(data, EncodeFixnum(int64(len(ivarKey)))...)
	data = append(data, ivarKey...)
	// Ivar value: fixnum 1
	data = append(data, rmFixnum)
	data = append(data, 1, 1)

	v, err := RbUnmarshal(data)
	if err != nil {
		t.Fatal(err)
	}
	m, ok := v.(map[string]interface{})
	if !ok {
		t.Fatalf("expected map, got %T", v)
	}
	if m["__class__"] != "RPG::Actor" {
		t.Errorf("expected class RPG::Actor, got %v", m["__class__"])
	}
	if !reflect.DeepEqual(m["@actor_id"], int64(1)) {
		t.Errorf("expected @actor_id=1, got %v", m["@actor_id"])
	}
}

func TestUnmarshalEmptyString(t *testing.T) {
	data := []byte{4, 8, rmString, 0}
	v, err := RbUnmarshal(data)
	if err != nil {
		t.Fatal(err)
	}
	if v != "" {
		t.Errorf("expected empty string, got %q", v)
	}
}

func TestUnmarshalEmptyArray(t *testing.T) {
	data := []byte{4, 8, rmArray, 1, 0}
	v, err := RbUnmarshal(data)
	if err != nil {
		t.Fatal(err)
	}
	arr, ok := v.([]interface{})
	if !ok {
		t.Fatalf("expected array, got %T", v)
	}
	if len(arr) != 0 {
		t.Errorf("expected empty array, got %d elements", len(arr))
	}
}
