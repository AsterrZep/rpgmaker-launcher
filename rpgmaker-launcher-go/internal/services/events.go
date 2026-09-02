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
	mu       sync.RWMutex
	history  []EventData
	clients  map[chan EventData]struct{}
	clientsMu sync.Mutex
}

// NewEventsService creates a new event service.
func NewEventsService() *EventsService {
	return &EventsService{clients: make(map[chan EventData]struct{})}
}

// Emit records an event and broadcasts to all connected SSE clients.
func (es *EventsService) Emit(eventType EventType, data map[string]interface{}) {
	event := EventData{Type: eventType, Data: data}

	// Record in history
	es.mu.Lock()
	es.history = append(es.history, event)
	if len(es.history) > 100 {
		es.history = es.history[len(es.history)-100:]
	}
	es.mu.Unlock()

	log.Printf("[Event] %s: %v", eventType, data)

	// Broadcast to connected SSE clients
	es.clientsMu.Lock()
	defer es.clientsMu.Unlock()
	for ch := range es.clients {
		select {
		case ch <- event:
		default:
			// Client too slow, skip
		}
	}
}

// Subscribe returns a channel that receives events. Caller must Unsubscribe when done.
func (es *EventsService) Subscribe() chan EventData {
	ch := make(chan EventData, 32)
	es.clientsMu.Lock()
	es.clients[ch] = struct{}{}
	es.clientsMu.Unlock()
	return ch
}

// Unsubscribe removes a client channel.
func (es *EventsService) Unsubscribe(ch chan EventData) {
	es.clientsMu.Lock()
	delete(es.clients, ch)
	es.clientsMu.Unlock()
	close(ch)
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
