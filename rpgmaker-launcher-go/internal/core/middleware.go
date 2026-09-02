package core

import (
	"net/http"
	"sync"
	"sync/atomic"
	"time"
)

// ── Request Metrics ───────────────────────────────────────────

type RequestMetrics struct {
	mu              sync.RWMutex
	TotalRequests   int64            `json:"total_requests"`
	ActiveRequests  int64            `json:"active_requests"`
	ErrorRequests   int64            `json:"error_requests"`
	RequestsByPath  map[string]int64 `json:"requests_by_path"`
	ErrorsByPath    map[string]int64 `json:"errors_by_path"`
	StatusCodeHist  map[int]int64    `json:"status_code_histogram"`
	LastRequestTime string           `json:"last_request_time"`
	AvgDurationMs   float64          `json:"avg_duration_ms"`
	totalDuration   time.Duration
	startTime       time.Time
}

var GlobalMetrics = &RequestMetrics{
	RequestsByPath: make(map[string]int64),
	ErrorsByPath:   make(map[string]int64),
	StatusCodeHist: make(map[int]int64),
	startTime:      time.Now(),
}

func (m *RequestMetrics) RecordRequest(path string, statusCode int, duration time.Duration) {
	atomic.AddInt64(&m.TotalRequests, 1)

	m.mu.Lock()
	m.RequestsByPath[path]++
	m.StatusCodeHist[statusCode]++
	m.totalDuration += duration
	m.LastRequestTime = time.Now().Format("15:04:05")
	m.AvgDurationMs = float64(m.totalDuration.Milliseconds()) / float64(m.TotalRequests)
	if statusCode >= 400 {
		atomic.AddInt64(&m.ErrorRequests, 1)
		m.ErrorsByPath[path]++
	}
	m.mu.Unlock()
}

func (m *RequestMetrics) RecordActiveRequest(delta int64) {
	atomic.AddInt64(&m.ActiveRequests, delta)
}

func (m *RequestMetrics) Snapshot() map[string]interface{} {
	m.mu.RLock()
	defer m.mu.RUnlock()

	// Copy maps
	paths := make(map[string]int64)
	for k, v := range m.RequestsByPath {
		paths[k] = v
	}
	errors := make(map[string]int64)
	for k, v := range m.ErrorsByPath {
		errors[k] = v
	}
	codes := make(map[int]int64)
	for k, v := range m.StatusCodeHist {
		codes[k] = v
	}

	uptime := time.Since(m.startTime)

	return map[string]interface{}{
		"total_requests":    atomic.LoadInt64(&m.TotalRequests),
		"active_requests":   atomic.LoadInt64(&m.ActiveRequests),
		"error_requests":    atomic.LoadInt64(&m.ErrorRequests),
		"requests_by_path":  paths,
		"errors_by_path":    errors,
		"status_code_hist":  codes,
		"last_request_time": m.LastRequestTime,
		"avg_duration_ms":   m.AvgDurationMs,
		"uptime_seconds":    int64(uptime.Seconds()),
		"uptime_human":      uptime.Truncate(time.Second).String(),
		"error_rate":        errorRate(atomic.LoadInt64(&m.ErrorRequests), atomic.LoadInt64(&m.TotalRequests)),
	}
}

func errorRate(errors, total int64) float64 {
	if total == 0 {
		return 0
	}
	return float64(errors) / float64(total) * 100
}

// ── Response Capture ──────────────────────────────────────────

type responseCapture struct {
	http.ResponseWriter
	statusCode int
	bodySize   int
}

func (rc *responseCapture) WriteHeader(code int) {
	rc.statusCode = code
	rc.ResponseWriter.WriteHeader(code)
}

func (rc *responseCapture) Write(b []byte) (int, error) {
	n, err := rc.ResponseWriter.Write(b)
	rc.bodySize += n
	return n, err
}

// Flush implements http.Flusher — required for SSE to work through middleware.
func (rc *responseCapture) Flush() {
	if f, ok := rc.ResponseWriter.(http.Flusher); ok {
		f.Flush()
	}
}

// ── Logging Middleware ────────────────────────────────────────

func LoggingMiddleware(next http.Handler, logger *Logger) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		GlobalMetrics.RecordActiveRequest(1)
		defer GlobalMetrics.RecordActiveRequest(-1)

		// Capture response
		rc := &responseCapture{
			ResponseWriter: w,
			statusCode:     200,
		}

		next.ServeHTTP(rc, r)

		duration := time.Since(start)
		GlobalMetrics.RecordRequest(r.URL.Path, rc.statusCode, duration)

		logger.LogRequest(
			r.Method,
			r.URL.Path,
			r.RemoteAddr,
			duration,
			rc.statusCode,
			rc.bodySize,
			"",
		)
	})
}

// ── Panic Recovery Middleware ─────────────────────────────────

func RecoveryMiddleware(next http.Handler, logger *Logger) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				logger.Error("Panic recovered in HTTP handler", nil,
					"method", r.Method,
					"path", r.URL.Path,
					"panic", err,
				)
				http.Error(w, `{"error":"internal server error"}`, 500)
			}
		}()
		next.ServeHTTP(w, r)
	})
}
