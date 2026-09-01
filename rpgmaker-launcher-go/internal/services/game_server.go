package services

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

// GameServer serves a web game via HTTP with script injection.
type GameServer struct {
	GameDir       string
	Port          int
	GameName      string
	injectScripts []string
	server        *http.Server
	mu            sync.Mutex
}

// NewGameServer creates a new game server for the given directory.
func NewGameServer(gameDir string, port int) *GameServer {
	return &GameServer{
		GameDir:  gameDir,
		Port:     port,
		GameName: filepath.Base(gameDir),
	}
}

// Start begins serving the game and returns the actual port.
func (gs *GameServer) Start(gameName string) (int, error) {
	gs.GameName = gameName
	mux := http.NewServeMux()

	// Special script routes
	mux.HandleFunc("/__config.js", gs.serveConfigJS)
	mux.HandleFunc("/__savebridge.js", gs.serveFile("rpgmaker-savebridge.js"))
	mux.HandleFunc("/__presets.js", gs.servePresets)
	mux.HandleFunc("/__rewind.js", gs.serveFile("rpgmaker-rewind.js"))
	mux.HandleFunc("/__cheats.js", gs.serveFile("rpgmaker-cheats.js"))
	mux.HandleFunc("/__gamepad.js", gs.serveFile("rpgmaker-gamepad.js"))
	mux.HandleFunc("/__browserkeys.js", gs.serveFile("rpgmaker-browser-keys.js"))

	// Save API
	mux.HandleFunc("/__save/__all", gs.handleSaveList)
	mux.HandleFunc("/__save/", gs.handleSave)

	// Mods
	mux.HandleFunc("/__mods/", gs.handleMod)

	// Fallback: serve index.html with injection
	mux.HandleFunc("/", gs.serveIndexWithInjection)

	listener, err := net.Listen("tcp", fmt.Sprintf("127.0.0.1:%d", gs.Port))
	if err != nil {
		return 0, err
	}

	gs.server = &http.Server{Handler: withCORS(mux)}
	go func() {
		log.Printf("[GameServer] Serving '%s' on http://127.0.0.1:%d", gs.GameName, listener.Addr().(*net.TCPAddr).Port)
		if err := gs.server.Serve(listener); err != nil && err != http.ErrServerClosed {
			log.Printf("[GameServer] Error: %v", err)
		}
	}()

	return listener.Addr().(*net.TCPAddr).Port, nil
}

// Stop gracefully shuts down the server.
func (gs *GameServer) Stop() {
	gs.mu.Lock()
	defer gs.mu.Unlock()
	if gs.server != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer cancel()
		gs.server.Shutdown(ctx)
		gs.server = nil
		log.Printf("[GameServer] Stopped for '%s'", gs.GameName)
	}
}

func (gs *GameServer) serveConfigJS(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/javascript")
	fmt.Fprintf(w, "window.__RPG_CONFIG__ = {};")
}

func (gs *GameServer) servePresets(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/javascript")
	presetsPath := filepath.Join(gs.GameDir, "cheats-presets.json")
	data, err := os.ReadFile(presetsPath)
	if err != nil {
		data = []byte("null")
	}
	fmt.Fprintf(w, "window.__RPG_CHEATS_PRESETS__ = %s;", string(data))
}

func (gs *GameServer) serveFile(name string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Look next to the binary, then in the game dir
		candidates := []string{name, filepath.Join(gs.GameDir, name)}
		for _, c := range candidates {
			if data, err := os.ReadFile(c); err == nil {
				w.Header().Set("Content-Type", "application/javascript")
				w.Write(data)
				return
			}
		}
		http.NotFound(w, r)
	}
}

func (gs *GameServer) handleSaveList(w http.ResponseWriter, r *http.Request) {
	saveDir := filepath.Join(gs.GameDir, "save")
	result := make(map[string]string)
	if entries, err := os.ReadDir(saveDir); err == nil {
		for _, e := range entries {
			if !e.IsDir() {
				data, err := os.ReadFile(filepath.Join(saveDir, e.Name()))
				if err == nil {
					result[e.Name()] = base64.StdEncoding.EncodeToString(data)
				}
			}
		}
	}
	w.Header().Set("Content-Type", "application/json")
	data, _ := json.Marshal(result)
	w.Write(data)
}

func (gs *GameServer) handleSave(w http.ResponseWriter, r *http.Request) {
	name := strings.TrimPrefix(r.URL.Path, "/__save/")
	if strings.Contains(name, "/") || strings.Contains(name, "..") {
		http.Error(w, "bad path", http.StatusBadRequest)
		return
	}
	savePath := filepath.Join(gs.GameDir, "save", name)

	switch r.Method {
	case "GET":
		data, err := os.ReadFile(savePath)
		if err != nil {
			http.NotFound(w, r)
			return
		}
		w.Write(data)
	case "POST":
		os.MkdirAll(filepath.Dir(savePath), 0755)
		data, _ := io.ReadAll(r.Body)
		os.WriteFile(savePath, data, 0644)
		http.Error(w, "", http.StatusNoContent)
	case "DELETE":
		os.Remove(savePath)
		http.Error(w, "", http.StatusNoContent)
	}
}

func (gs *GameServer) handleMod(w http.ResponseWriter, r *http.Request) {
	name := strings.TrimPrefix(r.URL.Path, "/__mods/")
	modPath := filepath.Join(gs.GameDir, "mods", name)
	data, err := os.ReadFile(modPath)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	w.Header().Set("Content-Type", "application/javascript")
	w.Write(data)
}

func (gs *GameServer) serveIndexWithInjection(w http.ResponseWriter, r *http.Request) {
	indexPath := filepath.Join(gs.GameDir, "index.html")
	content, err := os.ReadFile(indexPath)
	if err != nil {
		http.NotFound(w, r)
		return
	}

	html := string(content)
	scripts := []string{
		"/__config.js", "/__savebridge.js", "/__presets.js",
		"/__rewind.js", "/__cheats.js", "/__gamepad.js", "/__browserkeys.js",
	}
	for _, script := range scripts {
		tag := fmt.Sprintf(`<script src="%s"></script>`, script)
		if !strings.Contains(html, tag) {
			if strings.Contains(html, "</head>") {
				html = strings.Replace(html, "</head>", tag+"\n</head>", 1)
			} else if strings.Contains(html, "</body>") {
				html = strings.Replace(html, "</body>", tag+"\n</body>", 1)
			} else {
				html += "\n" + tag
			}
		}
	}

	// Inject user mods
	modsDir := filepath.Join(gs.GameDir, "mods")
	if entries, err := os.ReadDir(modsDir); err == nil {
		for _, e := range entries {
			if !e.IsDir() && strings.HasSuffix(e.Name(), ".js") {
				tag := fmt.Sprintf(`<script src="/__mods/%s"></script>`, e.Name())
				if !strings.Contains(html, tag) {
					html += "\n" + tag
				}
			}
		}
	}

	w.Header().Set("Content-Type", "text/html")
	w.Write([]byte(html))
}

func withCORS(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == "OPTIONS" {
			w.WriteHeader(204)
			return
		}
		h.ServeHTTP(w, r)
	})
}
