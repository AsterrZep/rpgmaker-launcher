<p align="center">
  <img src="https://raw.githubusercontent.com/AsterrZep/rpgmaker-launcher/main/docs/itchio-assets/cover-630x500.png" alt="RPG Maker Launcher" width="600"/>
</p>

<h1 align="center">🎮 RPG Maker Launcher</h1>

<p align="center">
  <b>El lanzador definitivo para juegos de RPG Maker y Ren'Py en Linux</b><br>
  Nacido para Chrome OS (Crostini) · Funciona en cualquier distribución
</p>

<p align="center">
  <a href="https://github.com/AsterrZep/rpgmaker-launcher/releases/latest"><img src="https://img.shields.io/github/v/release/AsterrZep/rpgmaker-launcher?label=Última%20Versión&style=for-the-badge&logo=github" alt="Última Versión"></a>
  <a href="https://github.com/AsterrZep/rpgmaker-launcher/releases"><img src="https://img.shields.io/github/downloads/AsterrZep/rpgmaker-launcher/total?style=for-the-badge&logo=github&label=Descargas" alt="Total Descargas"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/Licencia-GPLv3-blue?style=for-the-badge" alt="Licencia"></a>
  <a href="https://github.com/AsterrZep/rpgmaker-launcher/actions"><img src="https://img.shields.io/github/actions/workflow/status/AsterrZep/rpgmaker-launcher/release.yml?style=for-the-badge&logo=githubactions&label=Build" alt="Estado del Build"></a>
</p>

<p align="center">
  <a href="README.md">🇺🇸 English</a> •
  <a href="#-inicio-rápido">Inicio Rápido</a> •
  <a href="#-características">Características</a> •
  <a href="#-instalación">Instalación</a> •
  <a href="#-descarga">Descarga</a> •
  <a href="#-solución-de-problemas">Solución de Problemas</a>
</p>

---

## 🌟 ¿Por qué RPG Maker Launcher?

| Antes | Después |
|-------|---------|
| ❌ Partidas atrapadas en localStorage del navegador | ✅ **Archivos de partida reales** en disco — copia, backup, edita libremente |
| ❌ Cada motor necesita configuración manual | ✅ **Auto-detecta el motor** — ejecuta con el runtime correcto al instante |
| ❌ Pestañas pesadas del navegador para juegos web | ✅ **Visor WebKit ligero** — 50% menos RAM, inicio más rápido |
| ❌ Plugins rotos en navegador | ✅ **Analizador de plugins** — identifica y desactiva plugins incompatibles |
| ❌ Sin trucos, sin mods | ✅ **Trucos estilo JoyPlay** (F8) + **Mods de usuario** (suelta `.js` en `mods/`) |
| ❌ Juegos cifrados injugables | ✅ **Descifrado integrado** — un clic para descifrar XP/VX/Ace/MV/MZ |
| ❌ Cambio de puerto = partidas perdidas | ✅ **Puerto fijo por juego** — las partidas persisten para siempre |

---

## ✨ Características Destacadas

### 🎯 **Soporte Universal de Motores**
```
RPG Maker MZ/MV    → Servidor HTTP local + Visor WebKit o Navegador
RPG Maker XP/VX/Ace → mkxp-z binario nativo
RPG Maker 2000/2003 → EasyRPG Player binario nativo
Ren'Py             → Motor Linux incluido
```

### 🧠 **Sistema Inteligente de Partidas**
- **Puertos fijos** — cada juego recibe un puerto determinista (hash MD5 del nombre)
- **Partidas en disco** — archivos `.rpgsave` / `.rmmzsave` en carpeta `save/`
- **Gestor de Partidas GUI** — backup, restaurar, exportar, borrar, abrir carpeta
- **Auto-backup** — cada edición crea un backup con timestamp

### ⚡ **Rendimiento Primero**
- **Servidor HTTP multi-hilo** — sirve `.wasm` con MIME correcto, cabeceras de caché
- **Visor WebKit** — sin chrome del navegador, sin extensiones, juego puro
- **Perfilador de plugins** — desactiva plugins pesados, gana hasta **31% más rápido el bucle del juego**

### 🎮 **Funciones Pro Gaming**
- **Menú de Trucos (F8)** — oro, objetos, stats, variables, switches, teletransporte, consola JS
- **Presets de Trucos** — `cheats-presets.json` → botones de un clic en el panel
- **Soporte Gamepad** — mapeo automático (flechas=mover, Z=confirmar, X=cancelar, Shift=correr)
- **Control de Volumen** — sliders BGM/BGS/ME/SE en menú de trucos, persistente
- **Mods de Usuario** — suelta `.js` en `mods/`, auto-inyectados al arrancar

### 🔧 **Herramientas de Desarrollo**
- **Analizador de Plugins** — detecta APIs nw.js (`require`, `fs`, `process`)
- **Navegador de Datos** — lee Objetos/Armas/Defensas/Habilidades/Enemigos (BDs cifradas soportadas)
- **Editor de Partidas** — editor visual de oro, objetos, variables, switches
- **Modo Diagnóstico** — `--test` verifica si el juego llega a la pantalla de título, tiempos, errores JS
- **Descifrador** — un clic para descifrar `.rgss3a/.rgss2a/.rgssad` + assets MV/MZ

---

## 📸 Capturas

<p align="center">
  <img src="https://raw.githubusercontent.com/AsterrZep/rpgmaker-launcher/main/docs/itchio-assets/banner-960x300.png" alt="UI del Launcher" width="800"/>
</p>

> **Izquierda:** Biblioteca visual con portadas, favoritos, tiempo de juego  
> **Centro:** Visor WebKit ejecutando un juego MZ  
> **Derecha:** Menú de trucos con características estilo JoyPlay

---

## 🚀 Inicio Rápido

```bash
# 1. Instala (Debian/Ubuntu/Chrome OS)
curl -fsSL https://raw.githubusercontent.com/AsterrZep/rpgmaker-launcher/main/install.sh | bash

# 2. Añade tus juegos
# Suelta archivos .zip o carpetas extraídas en ~/Games/

# 3. ¡Juega!
# Abre "RPG Maker Launcher" desde tu menú de aplicaciones
```

---

## 📥 Métodos de Instalación

### 🏆 Recomendado: Paquetes Pre-compilados (Sin Compilar)

| Plataforma | Descarga | Comando de Instalación |
|------------|----------|------------------------|
| **Debian / Ubuntu / Linux Mint / Pop!_OS / Chrome OS** | [`.deb`](https://github.com/AsterrZep/rpgmaker-launcher/releases/latest/download/rpgmaker-launcher_0.9.1_amd64.deb) | `sudo apt install ./rpgmaker-launcher_*.deb` |
| **Cualquier Distribución (Portable)** | [`.AppImage`](https://github.com/AsterrZep/rpgmaker-launcher/releases/latest/download/rpgmaker-launcher-0.9.1-x86_64.AppImage) | `chmod +x *.AppImage && ./*.AppImage` |
| **Flatpak (Sandboxed)** | [`.flatpak`](https://github.com/AsterrZep/rpgmaker-launcher/releases/latest/download/rpgmaker-launcher-0.9.1.flatpak) | `flatpak install rpgmaker-launcher-*.flatpak` |

> 💡 **Tip para Chrome OS / Poco Espacio en Disco**: Usa **`.deb`** o **`.AppImage`**. Flatpak instala el runtime de GNOME (~2-3 GB). El `.deb` pesa ~1 MB, el AppImage ~80 MB.

### 🛠️ Desde Código Fuente (Desarrolladores)

```bash
git clone https://github.com/AsterrZep/rpgmaker-launcher.git
cd rpgmaker-launcher
chmod +x install.sh
./install.sh    # instala deps, compila mkxp-z, crea acceso directo
```

---

## 🎮 Añadir Juegos — Así de Simple

```
~/Games/
├── Mi_Juego.zip          ← Suelta .zip aquí, auto-extrae al lanzar
├── Otro_Juego/           ← O usa carpetas ya extraídas
└── games/                ← Juegos extraídos (auto-creado)
    └── Mi_Juego/
        ├── www/          ← Archivos web MZ/MV
        ├── save/         ← ¡Tus partidas reales!
        └── mods/         ← Suelta .js mods aquí
```

**Detección automática por archivos:**
| Archivo Encontrado | Motor Detectado |
|-------------------|-----------------|
| `index.html` + `js/rmmz_core.js` | RPG Maker MZ |
| `index.html` + `js/rpg_core.js` | RPG Maker MV |
| `Game.rgss3a` | VX Ace |
| `Game.rgss2a` | VX |
| `Game.rgssad` | XP |
| `RPG_RT.exe` / `.ini` / `.lmt` | 2000 / 2003 |
| `*.py` + `renpy/` + `game/` | Ren'Py |

---

## ⌨️ Atajos Por Defecto (Todos Configurables)

| Acción | Tecla Por Defecto | Funciona En |
|--------|-------------------|-------------|
| Abrir Trucos | `F8` | WebKit + Navegador |
| Recargar Juego | `F5` | WebKit + Navegador |
| Mostrar/Ocultar FPS | `F9` | WebKit + Navegador |
| Captura de Pantalla | `F12` | WebKit |
| Pantalla Completa | `F11` | WebKit |
| Salir Pantalla Completa | `Esc` | WebKit |
| Zoom In/Out | `Ctrl +` / `Ctrl -` | WebKit |
| Reset Zoom | `Ctrl 0` | WebKit |

> Cambia cualquier tecla en **Configuración → Atajos** — funciona tanto en el visor WebKit como en la versión navegador.

---

## 🔧 Configuración

| Variable | Por Defecto | Descripción |
|----------|-------------|-------------|
| `RPGMAKER_DATA_DIR` | `~/Games` | Dónde viven juegos, partidas, config |
| `general.games_dir` | `~/Games` | **Nuevo en 0.9.1** — carpeta personalizada para juegos y .zip |
| `general.webkit` | `false` | Usar visor WebKit por defecto |
| `general.auto_delete_zip` | `false` | Borrar .zip tras extraer |
| `sync.folder` | — | Sincronizar partidas a Dropbox/Syncthing/Nextcloud/USB |

---

## 🛠️ Solución de Problemas

<details>
<summary><b>❌ "Juego incompleto" / El juego no arranca</b></summary>

La descarga o extracción se cortó. Borra la carpeta del juego en `~/Games/games/` y vuelve a lanzar — el `.zip` se re-extrae solo.
</details>

<details>
<summary><b>❌ `require is not defined` / `nw is not defined`</b></summary>

Un plugin usa APIs de Node.js solo disponibles en nw.js (escritorio).
1. Ejecuta diagnóstico: `python3 rpgmaker-webview.py --url "http://localhost:PUERTO/index.html" --test`
2. Revisa el archivo/línea exacta del error
3. Abre **Plugins** en la GUI → desactiva el plugin problemático
4. O envuelve la llamada a `require()`: `if (typeof require !== 'undefined') { ... }`
</details>

<details>
<summary><b>❌ Partidas perdidas entre sesiones</b></summary>

Asegúrate de usar la misma instancia del lanzador (puerto fijo por juego). Si moviste la carpeta del juego, el puerto cambia. No renombres carpetas de juegos tras el primer lanzamiento.
</details>

<details>
<summary><b>❌ Nombres de archivo con mayúsculas/minúsculas (Windows → Linux)</b></summary>

Linux distingue mayúsculas. Si un juego falla, verifica que las rutas coincidan exactamente:
- `Input.js` ≠ `Input.JS`
- `SceneManager` ≠ `scenemanager`
</details>

<details>
<summary><b>❌ Flatpak: "No space left on device"</b></summary>

Flatpak instala el runtime de GNOME (~2-3 GB). En Chrome OS o discos pequeños, usa el **`.deb`** o **`.AppImage`**.
</details>

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Tauri (Rust + TS)               │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────────────┐  │
│  │  Grid Juegos│ │  Sidebar    │ │  Config / Sync /     │  │
│  │  (Portadas, │ │  (Biblioteca,│ │  Plugins / Partidas /│  │
│  │  Favoritos) │ │  Plugins,   │ │  Descifrar / Mods    │  │
│  │             │ │  Partidas)  │ │                      │  │
│  └─────────────┘ └─────────────┘ └──────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST API + SSE
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend Python (rpgmaker_api.py)               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │ Servidor │ │ Puente   │ │ Inyección│ │ Herramientas   │   │
│  │ HTTP     │ │ Partidas │ │ Trucos   │ │ Plugin/Descifr │   │
│  │ Multi-hilo│ │(Disco    │ │(Estilo   │ │              │   │
│  │          │ │ Real)    │ │ JoyPlay) │ │              │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │ spawns
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌────────────┐ ┌─────────────┐ ┌────────────┐
    │  mkxp-z    │ │ EasyRPG     │ │  Ren'Py    │
    │ (XP/VX/Ace)│ │ (2000/2003) │ │ (Visual)   │
    └────────────┘ └─────────────┘ └────────────┘
```

---

## 🤝 Contribuir

1. Haz fork del repo
2. Crea una rama: `git checkout -b feat/caracteristica-increible`
3. Commit: `git commit -m 'feat: añadir característica increíble'`
4. Push: `git push origin feat/caracteristica-increible`
5. Abre un Pull Request

**Estilo de código**: Python (black), TypeScript (prettier), Rust (rustfmt)

---

## 📄 Licencia

Distribuido bajo **GNU GPL v3**. Ver [`LICENSE`](LICENSE) para detalles.

> **Resumen**: Libre para usar, modificar, compartir. Derivados deben ser GPL v3.

---

## 🙏 Créditos y Agradecimientos

| Proyecto | Rol | Licencia |
|----------|-----|----------|
| [mkxp-z](https://github.com/mkxp-z/mkxp-z) | Runtime XP/VX/Ace | GPL-3.0 |
| [EasyRPG Player](https://easyrpg.org/) | Runtime 2000/2003 | GPL-3.0 |
| [Ren'Py](https://www.renpy.org/) | Motor Novelas Visuales | MIT |
| [Tauri](https://tauri.app/) | Framework App Desktop | MIT/Apache-2.0 |
| [WebKitGTK](https://webkitgtk.org/) | Renderizador Web | LGPL |
| [RPGMakerDecrypter](https://github.com/ExpiredLime/RPGMakerDecrypter) | Herramienta Descifrado | GPL-3.0 |

---

## 💬 Comunidad y Soporte

- 🐛 **Reportar Bugs**: [GitHub Issues](https://github.com/AsterrZep/rpgmaker-launcher/issues)
- 💡 **Solicitar Features**: [GitHub Discussions](https://github.com/AsterrZep/rpgmaker-launcher/discussions)
- ⭐ **Dale una estrella** si te resulta útil!

---

<p align="center">
  <b>Hecho con ❤️ para jugar RPGs en Linux</b><br>
  <sub>Empezó como app para Chromebook · Ahora corre en todas partes</sub>
</p>

<p align="center">
  <a href="https://github.com/AsterrZep/rpgmaker-launcher/stargazers"><img src="https://img.shields.io/github/stars/AsterrZep/rpgmaker-launcher?style=social" alt="Estrellas"></a>
  <a href="https://github.com/AsterrZep/rpgmaker-launcher/forks"><img src="https://img.shields.io/github/forks/AsterrZep/rpgmaker-launcher?style=social" alt="Forks"></a>
  <a href="https://github.com/AsterrZep/rpgmaker-launcher/watchers"><img src="https://img.shields.io/github/watchers/AsterrZep/rpgmaker-launcher?style=social" alt="Observadores"></a>
</p>