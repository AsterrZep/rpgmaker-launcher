package main

import "github.com/AsterrZep/rpgmaker-launcher-go/internal/services"

// GetEventHistory returns recent events.
func (a *App) GetEventHistory(limit int) []services.EventData {
	return a.eventsService.GetHistory(limit)
}

// ClearEventHistory clears the event history.
func (a *App) ClearEventHistory() {
	a.eventsService.ClearHistory()
}
