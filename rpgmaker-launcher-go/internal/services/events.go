package services

import (
	"encoding/json"
	"log"
	"sync"
)

// EventType enumerates the known event types.
type EventType string

const (
	EventExtractionProgress EventType = "extraction_progress"
	EventServerStarted      EventType = "server_started"
	EventServerStopped      EventType = "server_stopped"
	EventSyncComplete       EventType = "sync_complete"
	EventGameLaunched       EventType = "game_launched"
	EventExtractionComplete EventType = "extraction_complete"
)

// EventData represents an emitted event.
type EventData struct {
	Type EventType              `json:"event_type"`
	Data map[string]interface{} `json:"data"`
}

// EventsService manages event broadcasting and history.
type EventsService struct {
	mu      sync.RWMutex
	history []EventData
}

// NewEventsService creates a new events service.
func NewEventsService() *EventsService {
	return &EventsService{}
}

// Emit records an event in the history.
func (es *EventsService) Emit(eventType EventType, data map[string]interface{}) {
	es.mu.Lock()
	defer es.mu.Unlock()
	es.history = append(es.history, EventData{Type: eventType, Data: data})
	// Keep last 100 events
	if len(es.history) > 100 {
		es.history = es.history[len(es.history)-100:]
	}
	log.Printf("[Event] %s: %v", eventType, data)
}

// GetHistory returns the most recent events.
func (es *EventsService) GetHistory(limit int) []EventData {
	es.mu.RLock()
	defer es.mu.RUnlock()
	n := len(es.history)
	if limit > 0 && limit < n {
		n = limit
	}
	result := make([]EventData, n)
	copy(result, es.history[len(es.history)-n:])
	return result
}

// ClearHistory empties the event history.
func (es *EventsService) ClearHistory() {
	es.mu.Lock()
	defer es.mu.Unlock()
	es.history = nil
}

// MarshalJSON implements json.Marshaler.
func (ed EventData) MarshalJSON() ([]byte, error) {
	type Alias EventData
	return json.Marshal(struct {
		Alias
		Event string `json:"event"`
	}{
		Alias: (Alias)(ed),
		Event: string(ed.Type),
	})
}
