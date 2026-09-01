package engine

import (
	"bytes"
	"encoding/binary"
	"fmt"
	"io"
	"math"
	"strconv"
)

// Ruby Marshal v4.8 type bytes.
// In Ruby Marshal: 'f' = float, 'F' = false, 'T' = true, 'n' = nil
const (
	rmFloat   byte = 'f' // float
	rmFixnum  byte = 'i' // fixnum
	rmSymbol  byte = ':' // symbol
	rmString  byte = '"' // string
	rmArray   byte = '[' // array
	rmHash    byte = '{' // hash
	rmObject  byte = 'o' // object
	rmIvar    byte = 'I' // instance variables
	rmUObject byte = 'U' // user object
	rmStruct  byte = 'S' // struct
	rmNil     byte = 'n' // nil
	rmTrue    byte = 'T' // true
	rmFalse   byte = 'F' // false
	rmLink    byte = '@' // link
	rmSymlink byte = ';' // symbol link
	rmRegexp  byte = '/' // regexp
	rmClass   byte = 'c' // class
	rmModule  byte = 'm' // module
	rmBignum  byte = 'l' // bignum
	rmData    byte = 'd' // data
	rmProc    byte = 'p' // proc
	rmMemo    byte = '}' // memo
)

// RbMarshal decodes a Ruby Marshal v4.8 byte stream into Go values.
type RbMarshal struct {
	data   []byte
	pos    int
	symbol []string // symbol table
	refs   []interface{}
}

// RbUnmarshal parses a Ruby Marshal v4.8 byte slice and returns a Go value.
// Supported types: nil, bool, int, float, string, symbol, array, hash,
// instance variables, user objects (RPG Maker classes).
func RbUnmarshal(data []byte) (interface{}, error) {
	if len(data) < 2 {
		return nil, fmt.Errorf("data too short for Ruby Marshal")
	}
	// Marshal version: 0x04 0x08
	if data[0] != 4 || data[1] != 8 {
		return nil, fmt.Errorf("unsupported Ruby Marshal version: %d.%d", data[0], data[1])
	}
	rm := &RbMarshal{data: data[2:], pos: 0}
	return rm.read()
}

func (rm *RbMarshal) read() (interface{}, error) {
	if rm.pos >= len(rm.data) {
		return nil, io.ErrUnexpectedEOF
	}
	b := rm.data[rm.pos]
	rm.pos++

	switch b {
	case rmNil:
		return nil, nil
	case rmTrue:
		return true, nil
	case rmFalse:
		return false, nil
	case rmFixnum:
		return rm.readFixnum()
	case rmFloat:
		return rm.readFloat()
	case rmString, rmIvar:
		return rm.readString(b)
	case rmSymbol:
		return rm.readSymbol()
	case rmSymlink:
		return rm.readSymlink()
	case rmArray:
		return rm.readArray()
	case rmHash:
		return rm.readHash()
	case rmObject, rmUObject:
		return rm.readObject(b)
	case rmStruct:
		return rm.readStruct()
	case rmLink:
		return rm.readLink()
	default:
		return nil, fmt.Errorf("unsupported Ruby Marshal type: 0x%02x ('%c') at pos %d", b, rune(b), rm.pos-1)
	}
}

func (rm *RbMarshal) readFixnum() (int64, error) {
	if rm.pos >= len(rm.data) {
		return 0, io.ErrUnexpectedEOF
	}
	b := int8(rm.data[rm.pos])
	rm.pos++

	if b == 0 {
		return 0, nil
	}

	var numBytes int
	if b > 0 {
		numBytes = int(b)
	} else {
		numBytes = int(-b)
	}

	if rm.pos+numBytes > len(rm.data) {
		return 0, io.ErrUnexpectedEOF
	}

	var val int64
	if b > 0 {
		// Positive
		for i := 0; i < numBytes; i++ {
			val |= int64(rm.data[rm.pos+i]) << (uint(i) * 8)
		}
	} else {
		// Negative: fill high bytes with 0xFF
		val = -1
		for i := 0; i < numBytes; i++ {
			val &^= (0xFF << (uint(i) * 8))
			val |= int64(rm.data[rm.pos+i]) << (uint(i) * 8)
		}
	}
	rm.pos += numBytes
	return val, nil
}

func (rm *RbMarshal) readFloat() (float64, error) {
	s, err := rm.readByteString()
	if err != nil {
		return 0, err
	}
	f, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return 0, fmt.Errorf("invalid float: %s", s)
	}
	return f, nil
}

func (rm *RbMarshal) readString(typeByte byte) (string, error) {
	if typeByte == rmIvar {
		// Instance variable string: read inner string, then ivars
		inner, err := rm.read()
		if err != nil {
			return "", err
		}
		str, ok := inner.(string)
		if !ok {
			return fmt.Sprintf("%v", inner), nil
		}
		// Read and discard instance variables (encoding info etc.)
		rm.readIvars()
		return str, nil
	}
	return rm.readByteString()
}

func (rm *RbMarshal) readByteString() (string, error) {
	length, err := rm.readRawFixnum()
	if err != nil {
		return "", err
	}
	if length < 0 || rm.pos+int(length) > len(rm.data) {
		return "", io.ErrUnexpectedEOF
	}
	s := string(rm.data[rm.pos : rm.pos+int(length)])
	rm.pos += int(length)
	return s, nil
}

// readRawFixnum reads a fixnum value WITHOUT a leading type marker.
// Used for string/array/hash lengths and inline fixnum values.
func (rm *RbMarshal) readRawFixnum() (int64, error) {
	if rm.pos >= len(rm.data) {
		return 0, io.ErrUnexpectedEOF
	}
	b := int8(rm.data[rm.pos])
	rm.pos++

	if b == 0 {
		return 0, nil
	}

	var numBytes int
	if b > 0 {
		numBytes = int(b)
	} else {
		numBytes = int(-b)
	}

	if rm.pos+numBytes > len(rm.data) {
		return 0, io.ErrUnexpectedEOF
	}

	var val int64
	if b > 0 {
		for i := 0; i < numBytes; i++ {
			val |= int64(rm.data[rm.pos+i]) << (uint(i) * 8)
		}
	} else {
		val = -1
		for i := 0; i < numBytes; i++ {
			val &^= (0xFF << (uint(i) * 8))
			val |= int64(rm.data[rm.pos+i]) << (uint(i) * 8)
		}
	}
	rm.pos += numBytes
	return val, nil
}

func (rm *RbMarshal) readSymbol() (string, error) {
	s, err := rm.readByteString()
	if err != nil {
		return "", err
	}
	// Add to symbol table
	rm.symbol = append(rm.symbol, s)
	return s, nil
}

func (rm *RbMarshal) readSymlink() (string, error) {
	idx, err := rm.readRawFixnum()
	if err != nil {
		return "", err
	}
	if idx < 0 || int(idx) >= len(rm.symbol) {
		return "", fmt.Errorf("symbol link index out of range: %d", idx)
	}
	return rm.symbol[idx], nil
}

func (rm *RbMarshal) readArray() ([]interface{}, error) {
	length, err := rm.readRawFixnum()
	if err != nil {
		return nil, err
	}
	arr := make([]interface{}, length)
	for i := int64(0); i < length; i++ {
		v, err := rm.read()
		if err != nil {
			return nil, err
		}
		arr[i] = v
	}
	return arr, nil
}

func (rm *RbMarshal) readHash() (map[string]interface{}, error) {
	length, err := rm.readRawFixnum()
	if err != nil {
		return nil, err
	}
	m := make(map[string]interface{}, length)
	for i := int64(0); i < length; i++ {
		k, err := rm.read()
		if err != nil {
			return nil, err
		}
		v, err := rm.read()
		if err != nil {
			return nil, err
		}
		// Convert key to string
		key := fmt.Sprintf("%v", k)
		m[key] = v
	}
	return m, nil
}

func (rm *RbMarshal) readObject(typeByte byte) (map[string]interface{}, error) {
	// Read class name (symbol)
	className, err := rm.readSymlinkOrSymbol()
	if err != nil {
		return nil, err
	}

	// Read instance variables
	ivars, err := rm.readIvars()
	if err != nil {
		return nil, err
	}

	// Wrap in a map with class metadata
	result := make(map[string]interface{})
	result["__class__"] = className
	for k, v := range ivars {
		result[k] = v
	}
	return result, nil
}

func (rm *RbMarshal) readStruct() (map[string]interface{}, error) {
	className, err := rm.readSymlinkOrSymbol()
	if err != nil {
		return nil, err
	}

	numMembers, err := rm.readRawFixnum()
	if err != nil {
		return nil, err
	}

	result := make(map[string]interface{})
	result["__class__"] = className

	for i := int64(0); i < numMembers; i++ {
		memberName, err := rm.readSymlinkOrSymbol()
		if err != nil {
			return nil, err
		}
		v, err := rm.read()
		if err != nil {
			return nil, err
		}
		result[memberName] = v
	}
	return result, nil
}

func (rm *RbMarshal) readLink() (interface{}, error) {
	idx, err := rm.readRawFixnum()
	if err != nil {
		return nil, err
	}
	if idx < 0 || int(idx) >= len(rm.refs) {
		return nil, fmt.Errorf("reference link index out of range: %d", idx)
	}
	return rm.refs[idx], nil
}

func (rm *RbMarshal) readSymlinkOrSymbol() (string, error) {
	if rm.pos >= len(rm.data) {
		return "", io.ErrUnexpectedEOF
	}
	b := rm.data[rm.pos]
	if b == rmSymlink {
		rm.pos++
		return rm.readSymlink()
	}
	if b == rmSymbol {
		rm.pos++
		return rm.readSymbol()
	}
	return "", fmt.Errorf("expected symbol or symlink, got 0x%02x at pos %d", b, rm.pos)
}

func (rm *RbMarshal) readIvars() (map[string]interface{}, error) {
	if rm.pos >= len(rm.data) {
		return nil, io.ErrUnexpectedEOF
	}
	// Expect '@' for ivar count
	if rm.data[rm.pos] != '@' {
		return nil, fmt.Errorf("expected '@' for ivar count, got 0x%02x at pos %d", rm.data[rm.pos], rm.pos)
	}
	rm.pos++

	count, err := rm.readRawFixnum()
	if err != nil {
		return nil, err
	}

	ivars := make(map[string]interface{}, count)
	for i := int64(0); i < count; i++ {
		key, err := rm.readSymlinkOrSymbol()
		if err != nil {
			return nil, err
		}
		val, err := rm.read()
		if err != nil {
			return nil, err
		}
		ivars[key] = val
	}
	return ivars, nil
}

// EncodeFixnum encodes an int64 as a Ruby Marshal fixnum.
func EncodeFixnum(val int64) []byte {
	var buf bytes.Buffer
	if val == 0 {
		buf.WriteByte(0)
		return buf.Bytes()
	}

	if val > 0 {
		b := make([]byte, 0, 8)
		v := uint64(val)
		for v > 0 {
			b = append(b, byte(v&0xFF))
			v >>= 8
		}
		buf.WriteByte(byte(len(b)))
		buf.Write(b)
	} else {
		b := make([]byte, 0, 8)
		v := uint64(val)
		for v > 0 {
			b = append(b, byte(v&0xFF))
			v >>= 8
		}
		// Pad with 0xFF for negative
		for len(b) < 8 {
			b = append(b, 0xFF)
		}
		// Trim trailing 0xFF
		for len(b) > 1 && b[len(b)-1] == 0xFF && b[len(b)-2]&0x80 != 0 {
			b = b[:len(b)-1]
		}
		buf.WriteByte(byte(-len(b)))
		buf.Write(b)
	}
	return buf.Bytes()
}

// EncodeString encodes a string as a Ruby Marshal string.
func EncodeString(s string) []byte {
	var buf bytes.Buffer
	buf.WriteByte(rmString)
	b := EncodeFixnum(int64(len(s)))
	buf.Write(b)
	buf.WriteString(s)
	return buf.Bytes()
}

// MarshalToBytes converts a Go value back to Ruby Marshal bytes.
// This is a simplified encoder for the types used in RPG Maker saves.
func MarshalToBytes(v interface{}) ([]byte, error) {
	var buf bytes.Buffer
	buf.Write([]byte{4, 8}) // version
	if err := marshalValue(&buf, v); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func marshalValue(buf *bytes.Buffer, v interface{}) error {
	if v == nil {
		buf.WriteByte(rmNil)
		return nil
	}
	switch val := v.(type) {
	case bool:
		if val {
			buf.WriteByte(rmTrue)
		} else {
			buf.WriteByte(rmFalse)
		}
	case int:
		return marshalValue(buf, int64(val))
	case int64:
		buf.WriteByte(rmFixnum)
		buf.Write(EncodeFixnum(val))
	case float64:
		buf.WriteByte(rmFloat)
		s := strconv.FormatFloat(val, 'g', -1, 64)
		buf.Write(EncodeFixnum(int64(len(s))))
		buf.WriteString(s)
	case string:
		buf.Write(EncodeString(val))
	case []interface{}:
		buf.WriteByte(rmArray)
		buf.Write(EncodeFixnum(int64(len(val))))
		for _, item := range val {
			if err := marshalValue(buf, item); err != nil {
				return err
			}
		}
	case map[string]interface{}:
		// Check if it's an RPG Maker object with __class__
		if className, ok := val["__class__"]; ok {
			buf.WriteByte(rmObject)
			// Write class name as symbol
			buf.WriteByte(rmSymbol)
			buf.Write(EncodeFixnum(int64(len(className.(string)))))
			buf.WriteString(className.(string))
			// Count non-class fields
			count := 0
			for k := range val {
				if k != "__class__" {
					count++
				}
			}
			// Write ivar count
			buf.WriteByte('@')
			buf.Write(EncodeFixnum(int64(count)))
			for k, v := range val {
				if k == "__class__" {
					continue
				}
				buf.WriteByte(rmSymbol)
				buf.Write(EncodeFixnum(int64(len(k))))
				buf.WriteString(k)
				if err := marshalValue(buf, v); err != nil {
					return err
				}
			}
			return nil
		}
		// Plain hash
		buf.WriteByte(rmHash)
		buf.Write(EncodeFixnum(int64(len(val))))
		for k, v := range val {
			if err := marshalValue(buf, k); err != nil {
				return err
			}
			if err := marshalValue(buf, v); err != nil {
				return err
			}
		}
	default:
		return fmt.Errorf("unsupported type for marshal: %T", v)
	}
	return nil
}

// IsRubyMarshal checks if data starts with a Ruby Marshal header.
func IsRubyMarshal(data []byte) bool {
	return len(data) >= 2 && data[0] == 4 && data[1] == 8
}

// Float64FromBytes converts 8 bytes to float64 (big-endian).
func Float64FromBytes(b []byte) float64 {
	if len(b) < 8 {
		return 0
	}
	return math.Float64frombits(binary.LittleEndian.Uint64(b))
}
