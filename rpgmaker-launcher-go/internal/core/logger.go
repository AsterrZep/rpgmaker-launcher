package core

import (
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"time"
)

// ── Log Levels ────────────────────────────────────────────────

type LogLevel int

const (
	LevelTrace LogLevel = iota
	LevelDebug
	LevelInfo
	LevelWarn
	LevelError
	LevelFatal
	LevelOff
)

var levelNames = map[LogLevel]string{
	LevelTrace: "TRACE",
	LevelDebug: "DEBUG",
	LevelInfo:  "INFO ",
	LevelWarn:  "WARN ",
	LevelError: "ERROR",
	LevelFatal: "FATAL",
	LevelOff:   "OFF  ",
}

func (l LogLevel) String() string {
	if name, ok := levelNames[l]; ok {
		return name
	}
	return "?????"
}

// ── Color codes for terminal ──────────────────────────────────

const (
	colorReset  = "\033[0m"
	colorRed    = "\033[31m"
	colorGreen  = "\033[32m"
	colorYellow = "\033[33m"
	colorBlue   = "\033[34m"
	colorPurple = "\033[35m"
	colorCyan   = "\033[36m"
	colorGray   = "\033[90m"
)

var levelColors = map[LogLevel]string{
	LevelTrace: colorGray,
	LevelDebug: colorCyan,
	LevelInfo:  colorGreen,
	LevelWarn:  colorYellow,
	LevelError: colorRed,
	LevelFatal: colorPurple,
}

// ── Log Entry ─────────────────────────────────────────────────

type LogEntry struct {
	Timestamp  time.Time
	Level      LogLevel
	Caller     string
	Message    string
	Fields     map[string]interface{}
	Err        error
	StackTrace string
}

func (e LogEntry) String() string {
	ts := e.Timestamp.Format("15:04:05.000")
	level := levelNames[e.Level]
	caller := e.Caller
	if len(caller) > 30 {
		caller = caller[len(caller)-30:]
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("%s [%s] %s │ ", ts, level, caller))
	sb.WriteString(e.Message)

	if e.Err != nil {
		sb.WriteString(fmt.Sprintf(" err=%q", e.Err.Error()))
	}

	for k, v := range e.Fields {
		sb.WriteString(fmt.Sprintf(" %s=%v", k, v))
	}

	return sb.String()
}

func (e LogEntry) ColorString() string {
	ts := e.Timestamp.Format("15:04:05.000")
	level := levelNames[e.Level]
	caller := e.Caller
	if len(caller) > 30 {
		caller = caller[len(caller)-30:]
	}
	color := levelColors[e.Level]

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("%s%s [%s] %s%s │ ", color, ts, level, caller, colorReset))
	sb.WriteString(e.Message)

	if e.Err != nil {
		sb.WriteString(fmt.Sprintf(" %serr=%q%s", colorRed, e.Err.Error(), colorReset))
	}

	for k, v := range e.Fields {
		sb.WriteString(fmt.Sprintf(" %s%s=%v%s", colorCyan, k, v, colorReset))
	}

	return sb.String()
}

// ── Logger ────────────────────────────────────────────────────

type Logger struct {
	mu          sync.RWMutex
	level       LogLevel
	file        *os.File
	fileLogger  *log.Logger
	console     bool
	jsonMode    bool
	entries     []LogEntry
	maxEntries  int
	onEntry     func(LogEntry) // callback for real-time consumers
	serviceName string
}

var (
	defaultLogger *Logger
	once          sync.Once
)

func InitLogger(serviceName string, dataDir string, minLevel LogLevel) *Logger {
	once.Do(func() {
		l := &Logger{
			level:       minLevel,
			console:     true,
			maxEntries:  5000,
			entries:     make([]LogEntry, 0, 256),
			serviceName: serviceName,
		}

		// Open log file
		logDir := filepath.Join(dataDir, "logs")
		os.MkdirAll(logDir, 0755)
		logFile := filepath.Join(logDir, fmt.Sprintf("app-%s.log", time.Now().Format("2006-01-02")))

		f, err := os.OpenFile(logFile, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
		if err == nil {
			l.file = f
			l.fileLogger = log.New(io.MultiWriter(f, os.Stdout), "", 0)
		} else {
			l.fileLogger = log.New(os.Stdout, "", 0)
		}

		// Rotate old logs (>7 days)
		go l.rotateOldLogs(logDir)

		defaultLogger = l
	})

	return defaultLogger
}

func GetLogger() *Logger {
	if defaultLogger == nil {
		return InitLogger("rpgmaker", DataDir(), LevelInfo)
	}
	return defaultLogger
}

// ── Logging methods ───────────────────────────────────────────

func (l *Logger) Log(level LogLevel, msg string, fields ...interface{}) {
	if level < l.level {
		return
	}

	entry := LogEntry{
		Timestamp: time.Now(),
		Level:     level,
		Caller:    getCaller(3),
		Message:   msg,
		Fields:    parseFields(fields...),
	}

	l.mu.Lock()
	l.entries = append(l.entries, entry)
	if len(l.entries) > l.maxEntries {
		l.entries = l.entries[len(l.entries)-l.maxEntries:]
	}
	l.mu.Unlock()

	// Console output
	if l.console {
		fmt.Println(entry.ColorString())
	}

	// File output
	if l.fileLogger != nil {
		l.fileLogger.Println(entry.String())
	}

	// Callback
	if l.onEntry != nil {
		l.onEntry(entry)
	}
}

func (l *Logger) Trace(msg string, fields ...interface{}) {
	l.Log(LevelTrace, msg, fields...)
}

func (l *Logger) Debug(msg string, fields ...interface{}) {
	l.Log(LevelDebug, msg, fields...)
}

func (l *Logger) Info(msg string, fields ...interface{}) {
	l.Log(LevelInfo, msg, fields...)
}

func (l *Logger) Warn(msg string, fields ...interface{}) {
	l.Log(LevelWarn, msg, fields...)
}

func (l *Logger) Error(msg string, err error, fields ...interface{}) {
	entry := LogEntry{
		Timestamp: time.Now(),
		Level:     LevelError,
		Caller:    getCaller(3),
		Message:   msg,
		Fields:    parseFields(fields...),
		Err:       err,
	}

	l.mu.Lock()
	l.entries = append(l.entries, entry)
	l.mu.Unlock()

	if l.console {
		fmt.Println(entry.ColorString())
	}
	if l.fileLogger != nil {
		l.fileLogger.Println(entry.String())
	}
	if l.onEntry != nil {
		l.onEntry(entry)
	}
}

func (l *Logger) Fatal(msg string, err error, fields ...interface{}) {
	entry := LogEntry{
		Timestamp: time.Now(),
		Level:     LevelFatal,
		Caller:    getCaller(3),
		Message:   msg,
		Fields:    parseFields(fields...),
		Err:       err,
	}

	if l.console {
		fmt.Println(entry.ColorString())
	}
	if l.fileLogger != nil {
		l.fileLogger.Println(entry.String())
	}
	if l.onEntry != nil {
		l.onEntry(entry)
	}

	os.Exit(1)
}

// ── HTTP Request/Response logging ─────────────────────────────

type HTTPLogEntry struct {
	Method     string
	Path       string
	StatusCode int
	Duration   time.Duration
	IP         string
	UserAgent  string
	Error      string
	BodySize   int
}

func (l *Logger) LogRequest(method, path, ip string, duration time.Duration, statusCode int, bodySize int, errMsg string) {
	level := LevelInfo
	if statusCode >= 500 {
		level = LevelError
	} else if statusCode >= 400 {
		level = LevelWarn
	}

	fields := []interface{}{
		"method", method,
		"path", path,
		"status", statusCode,
		"duration_ms", duration.Milliseconds(),
		"body_size", bodySize,
		"ip", ip,
	}
	if errMsg != "" {
		fields = append(fields, "error", errMsg)
	}

	// Color-code status
	statusColor := colorGreen
	if statusCode >= 500 {
		statusColor = colorRed
	} else if statusCode >= 400 {
		statusColor = colorYellow
	} else if statusCode >= 300 {
		statusColor = colorCyan
	}

	msg := fmt.Sprintf("%s %s → %s%d%s (%dms)",
		method, path,
		statusColor, statusCode, colorReset,
		duration.Milliseconds())

	l.Log(level, msg, fields...)
}

// ── SetLevel / OnEntry / RecentEntries ────────────────────────

func (l *Logger) SetLevel(level LogLevel) {
	l.mu.Lock()
	l.level = level
	l.mu.Unlock()
}

func (l *Logger) OnEntry(fn func(LogEntry)) {
	l.mu.Lock()
	l.onEntry = fn
	l.mu.Unlock()
}

func (l *Logger) RecentEntries(n int) []LogEntry {
	l.mu.RLock()
	defer l.mu.RUnlock()
	if n <= 0 || n > len(l.entries) {
		n = len(l.entries)
	}
	result := make([]LogEntry, n)
	copy(result, l.entries[len(l.entries)-n:])
	return result
}

func (l *Logger) RecentEntriesAsStrings(n int) []string {
	entries := l.RecentEntries(n)
	result := make([]string, len(entries))
	for i, e := range entries {
		result[i] = e.String()
	}
	return result
}

// ── Helpers ───────────────────────────────────────────────────

func getCaller(skip int) string {
	_, file, line, ok := runtime.Caller(skip)
	if !ok {
		return "???:0"
	}
	// Extract just filename
	parts := strings.Split(file, "/")
	if len(parts) > 2 {
		file = strings.Join(parts[len(parts)-2:], "/")
	}
	return fmt.Sprintf("%s:%d", file, line)
}

func parseFields(args ...interface{}) map[string]interface{} {
	fields := make(map[string]interface{})
	for i := 0; i+1 < len(args); i += 2 {
		key, ok := args[i].(string)
		if ok {
			fields[key] = args[i+1]
		}
	}
	return fields
}

func (l *Logger) rotateOldLogs(logDir string) {
	entries, err := os.ReadDir(logDir)
	if err != nil {
		return
	}
	cutoff := time.Now().AddDate(0, 0, -7)
	for _, e := range entries {
		if e.IsDir() || !strings.HasPrefix(e.Name(), "app-") {
			continue
		}
		info, err := e.Info()
		if err != nil {
			continue
		}
		if info.ModTime().Before(cutoff) {
			os.Remove(filepath.Join(logDir, e.Name()))
		}
	}
}

// ── Package-level convenience functions ────────────────────────

func LogTrace(msg string, fields ...interface{}) { GetLogger().Trace(msg, fields...) }
func LogDebug(msg string, fields ...interface{}) { GetLogger().Debug(msg, fields...) }
func LogInfo(msg string, fields ...interface{})  { GetLogger().Info(msg, fields...) }
func LogWarn(msg string, fields ...interface{})  { GetLogger().Warn(msg, fields...) }
func LogError(msg string, err error, fields ...interface{}) {
	GetLogger().Error(msg, err, fields...)
}
