# 🎮 RPG Maker Launcher

[English](README.md) · **Español**

Lanzador universal de juegos de RPG Maker y Ren'Py para **Linux** con escritorio. Nació pensado para **Chrome OS** (Linux / Crostini) y ha evolucionado hasta funcionar en cualquier distribución: detecta automáticamente el motor de cada juego, descomprime el `.zip` si hace falta y lo ejecuta con el runtime correcto, sin tocar nada del juego.

> Probado en: Debian 13 trixie x86_64 y Chrome OS con contenedor Linux (Debian trixie).

---

## ✨ Características

- **Detección automática de motor** — MZ, MV, XP, VX, VX Ace, 2000 y 2003, y Ren'Py.
- **Descompresión automática** — si el juego viene en `.zip`, se extrae al vuelo (una sola vez) con marcador de integridad.
- **Interfaz gráfica** — ventana sencilla tipo app, con botón **Detener servidor**, **Borrar .zip** y opción de eliminar el comprimido tras extraer.
- **Visor WebKit ligero** — los juegos web (MZ/MV) pueden abrirse en un visor WebKit propio en vez del navegador completo: menos memoria y arranque más rápido para juegos pesados.
- **Atajos configurables** — todas las teclas (trucos, FPS, captura, pantalla completa, recargar, zoom) se editan desde la GUI y funcionan tanto en el visor WebKit como en la versión navegador.
- **Servidor HTTP rápido** — los juegos web se sirven con un servidor multihilo que envía cabeceras de caché y el MIME correcto para `.wasm`. Evita los tirones al cargar muchos assets de golpe (el `python3 -m http.server` normal es de un solo hilo).
- **Gestor de plugins (MZ/MV)** — herramienta `rpgmaker-plugins.py` y botón **Plugins** en la GUI para listar, analizar la compatibilidad con WebKit (APIs nw.js) y activar/desactivar plugins. Desactivar plugins pesados reduce el tiempo del bucle del juego hasta un 31%.
- **Partidas seguras en disco** — las partidas de los juegos web se guardan como archivos reales en la carpeta `save/` de cada juego (con un puerto fijo por juego), para poder copiarlas, exportarlas o editarlas. La GUI incluye **gestor de partidas** con copias de seguridad, restaurar, exportar y borrar.
- **Trucos estilo JoyPlay** — menú flotante (F8) en juegos MZ/MV: oro, objetos/armas/armaduras, nivel y stats al máximo, catálogos de habilidades y estados con buscador, variables y switches con nombres reales, teletransporte y consola JS. Bilingüe ES/EN.
- **Interfaz GTK3 opcional** — el mismo lanzador con interfaz nativa GTK3 (`rpgmaker-launcher-gtk.py`); el Flatpak la usa y ya no compila Tcl/Tk dentro del bundle.
- **Presets de trucos por juego** — `cheats-presets.json` junto a `index.html` se convierte en botones de un clic dentro del panel (con generador de plantilla).
- **Mods del usuario** — suelta archivos `.js` en la carpeta `mods/` del juego y se inyectan automáticamente al arrancar.
- **Volumen en el juego** — Silencio/25/50/75/100 para BGM/BGS/ME/SE desde el menú de trucos, aplicado en caliente y persistente.
- **Mando (gamepad)** — juega con mando en MZ/MV (mapeo automático a las teclas del motor).
- **Librería visual** — portadas, favoritos (★), última partida y tiempo total jugado; arrastra `.zip` a la ventana para instalarlos.
- **Navegador de datos y editor de partidas** — visor de la base de datos del juego (objetos/armas/defensas/habilidades/enemigos, soporta BD cifradas) y editor visual de saves MV/MZ: oro, cantidades, variables y switches con backup automático.
- **Comprobador de actualizaciones** — avisa cuando hay un release nuevo y enlaza a él.
- **Descifrador integrado** — botón **Descifrar** y script para abrir archivos cifrados de XP/VX/VX Ace/MV/MZ (descarga RPGMakerDecrypter al vuelo).
- **Versión de terminal** — menú clásico para quien prefiera la consola.
- **Sin solapamientos** — si lanzas un juego web y luego otro, el servidor anterior se cierra solo.
- **Advertencia de descarga incompleta** — detecta juegos a medio descomprimir o descargas cortadas.
- **Diagnóstico de errores** — el visor tiene un modo `--test` que comprueba si el juego llega a la pantalla de título, cuánto tarda y qué errores de JavaScript aparecen.

## 🎛️ Motores soportados

| Motor | Generación | Runtime | Forma de ejecución |
|-------|-----------|---------|--------------------|
| RPG Maker MZ | Web | Servidor HTTP local | Navegador o **visor WebKit ligero** |
| RPG Maker MV | Web | Servidor HTTP local | Navegador o **visor WebKit ligero** |
| RPG Maker XP / VX / VX Ace | Escritorio | [mkxp-z](https://github.com/mkxp-z/mkxp-z) | binario nativo |
| RPG Maker 2000 / 2003 | Escritorio | [EasyRPG Player](https://easyrpg.org/) | binario nativo |
| Ren'Py | Escritorio | Motor Ren'Py incluido | `.sh` de Linux |

## 📦 Requisitos

- Cualquier Linux con escritorio (incluido Chrome OS con **Linux/Crostini** activado).
- Python 3 (viene en todas las distribuciones).
- `unzip`.
- Para XP/VX/VX Ace: construir `mkxp-z` (lo hace `install.sh`).
- Para 2000/2003: instalar `easyrpg-player` (lo hace `install.sh`).
- Para la interfaz gráfica: `python3-tk` (lo hace `install.sh`).

## 🚀 Instalación

```bash
git clone https://github.com/AsterrZep/rpgmaker-launcher.git
cd rpgmaker-launcher
chmod +x install.sh
./install.sh
```

El script de instalación:

1. Instala dependencias del sistema (`python3-tk`, `unzip`, SDL, etc.).
2. Instala **EasyRPG Player** (2000/2003).
3. Compila **mkxp-z** desde el código fuente (XP/VX/VX Ace).
4. Genera e instala el acceso directo de la app en tu escritorio (Linux o Chrome OS).

Cuando termine, busca **RPG Maker Launcher** en la lista de aplicaciones de tu sistema. En Chrome OS, si no aparece, cierra sesión y vuelve a entrar (o reinicia el contenedor Linux).

## 📦 Paquetes y releases

Cada versión se publica como release en GitHub con binarios listos para usar (sin necesidad de compilar):

| Formato | Archivo | Qué instala |
|---------|---------|-------------|
| **Debian/Ubuntu** | `rpgmaker-launcher_<versión>_amd64.deb` | App en el sistema, acceso directo y runtimes (`sudo apt install ./rpgmaker-launcher_*.deb`) |
| **AppImage** | `rpgmaker-launcher-<versión>-x86_64.AppImage` | Portable, incluye su propio Python con tkinter (`chmod +x` y ejecutar) |
| **Flatpak** | `rpgmaker-launcher-<versión>.flatpak` | Sandbox de GNOME (`flatpak install rpgmaker-launcher-*.flatpak`) |

> ⚠️ **Sobre el Flatpak**: es la opción **menos recomendada si el espacio te preocupa**. El paquete en sí pesa ~55 MB, pero Flatpak instala el runtime de GNOME (`org.gnome.Platform` + SDK, **~2-3 GB** en disco) la primera vez. En máquinas con poco espacio (p. ej. el contenedor Linux de Chrome OS) usa mejor el **`.deb`** o el **AppImage**: ocupan mucho menos y se instalan al momento. Los tres dan exactamente el mismo lanzador.

Las versiones instaladas guardan los juegos en `~/Games/` (se puede cambiar con la variable `RPGMAKER_DATA_DIR`). Los scripts de empaquetado están en `packaging/`:

```bash
./packaging/build_deb.sh 0.1.0        # requiere dpkg-deb
./packaging/build_appimage.sh 0.1.0   # descarga python-build-standalone + appimagetool
./packaging/build_flatpak.sh 0.1.0    # requiere flatpak-builder y flathub
```

> **Builds automáticos**: al publicar un tag `v*` (p. ej. `git tag v0.1.3 && git push origin v0.1.3`), **GitHub Actions** construye los tres paquetes (`.deb`, AppImage y `.flatpak`) y los adjunta al release automáticamente (`.github/workflows/release.yml`).

## 🕹️ Uso

### Interfaz gráfica

1. Abre la app **RPG Maker Launcher**.
2. Si hay un `.zip` en `~/Games`, se extrae automáticamente al lanzar el juego.
3. Pulsa el nombre del juego. Los juegos web (MZ/MV) se abren en el navegador (o en el **visor WebKit ligero** si marcas la casilla "Visor WebKit (más ligero)"); los demás se abren en una ventana.
4. Con un juego web seleccionado, los botones **Plugins** y **Partidas** abren sus gestores. Con un juego XP/VX/VX Ace, el botón **Descifrar** extrae sus datos cifrados.
5. Usa **Detener servidor** para apagar el servidor web en cualquier momento (también se apaga solo al cerrar la app).

### Visor WebKit ligero

Para juegos web pesados, marca la casilla **"Visor WebKit (más ligero)"** antes de pulsar **Jugar**: en vez de abrir el navegador completo (que consume mucha memoria), el juego se abre en una ventana de WebKitGTK con solo la página del juego.

- Atajos: `Ctrl + / Ctrl -` zoom, `Ctrl 0` tamaño normal, `F11` pantalla completa, `Esc` salir de pantalla completa, `F5` recargar, `F9` mostrar/ocultar FPS, `F12` guardar captura de pantalla en `screenshots/`. **Todos se pueden cambiar** con el botón **Atajos** de la GUI. En la versión navegador también funcionan los atajos configurables (recargar, pantalla completa y FPS); los trucos se abren con la tecla configurada (F8 por defecto).
- Por defecto **no** escribe los mensajes de consola a un fichero: hacerlo en cada frame provocaría tirones en juegos que loguean mucho. Si necesitas verlos para diagnosticar, añade `--log-console`.
- Desde terminal, el lanzador te pregunta con qué abrir cada juego web.

### Diagnóstico de un juego que no arranca

El visor incluye un modo de diagnóstico que carga el juego y comprueba si llega a la escena de título, cuánto tarda (`t_escena_s`), si hay errores de JavaScript y si quedó atascado en el cargador:

```bash
python3 rpgmaker-webview.py --url "http://localhost:PUERTO/index.html" --test
```

Salida de ejemplo: `{"scene": "Scene_Title", "t_escena_s": 6.8, "errors": []}` (juego OK) o `{"scene": "none", "errors": [{"message": "...", "file": "...", "line": ...}]}` con el error exacto.

### Gestor de plugins (`rpgmaker-plugins.py`)

Muchos juegos web llevan decenas de plugins (Yanfly, VisuMZ, etc.) que añaden carga en cada fotograma. Además, algunos usan APIs exclusivas de la versión de escritorio (`require()`, `process.`, `fs.`).

`rpgmaker-plugins.py` te permite analizar y gestionar los plugins de cualquier juego MZ/MV:

```bash
# Listar plugins y ver su compatibilidad con WebKit
python3 rpgmaker-plugins.py list "games/Mi_Juego"

# Desactivar plugins problemáticos o pesados
python3 rpgmaker-plugins.py disable "games/Mi_Juego" PluginIncompatible

# Restaurar el js/plugins.js original
python3 rpgmaker-plugins.py restore "games/Mi_Juego"
```

La primera modificación crea automáticamente una copia de seguridad en `js/plugins.js.bak`.

### Guardado de partidas (juegos web MZ/MV)

Los juegos web (MZ/MV) guardan normalmente en el almacenamiento del navegador (`LocalStorage`/`IndexedDB`), que **se aísla por origen** (host + puerto). Este lanzador resuelve ese problema de dos formas:

1. **Puerto fijo por juego** — cada juego recibe siempre el mismo puerto (calculado por su nombre), así el navegador siempre usa el mismo "origen" y las partidas no se pierden entre sesiones.
2. **Guardado en disco real** — el servidor inyecta un pequeño puente (`rpgmaker-savebridge.js`) que redirige los guardados a archivos reales en la carpeta `save/` de cada juego:

```
games/Mi_Juego/www/save/
├── file1.rpgsave      ← partida 1 (MV)
├── global.rpgsave     ← información global de partidas (MV)
├── config.rpgsave     ← configuración del juego (MV)
├── file1.rmmzsave     ← partida 1 (MZ)
└── global.rmmzsave    ← (MZ)
```

Esa carpeta está a la vista en tu disco: puedes **copiar, exportar, hacer copias de seguridad o editarlas** con herramientas externas (editores de partidas de RPG Maker) mientras el juego esté cerrado. Los formatos son los nativos de cada motor (`.rpgsave` para MV, `.rmmzsave` para MZ).

Desde la **GUI**, el botón **Partidas** (juegos MZ/MV) permite hacer copias de seguridad, restaurar, exportar, borrar archivos de partida y abrir la carpeta `save/` (las copias quedan en `backups/<juego>/<fecha>/`).

### Trucos / cheats (estilo JoyPlay)

El servidor inyecta en los juegos MZ/MV un **menú de trucos** flotante: pulsa **F8** (o el botón "T" abajo a la derecha) para abrirlo. Permite:

- Dar **oro**.
- **HP/MP/TP al máximo** y quitar estados al grupo.
- Dar **objetos** por ID (o 99 de todos).
- Cambiar **variables** y **switches** por ID.
- **Teletransporte** (mapa, X, Y).
- **Consola de código** para ejecutar JavaScript directamente (`$gameParty._gold = 999999`).

### Mando (gamepad)

Los juegos MZ/MV se pueden jugar con mando: el script `rpgmaker-gamepad.js` traduce el gamepad a los atajos del motor (flechas = moverse, Z = confirmar, X = cancelar, Shift = correr, Start/Select = menú). Requiere un navegador o visor con la Gamepad API (WebKitGTK moderno la soporta).

### Descifrar juegos cifrados (`rpgmaker-decrypter.py`)

Algunos juegos de XP/VX/VX Ace vienen con los datos cifrados en `Game.rgss3a`/`.rgss2a`/`.rgssad` (y MV/MZ pueden llevar imágenes/audio cifrados). Para modding o traducción puedes descifrarlos:

```bash
# Descifra el juego (descarga RPGMakerDecrypter en runtimes/ en la 1ª ejecución)
python3 rpgmaker-decrypter.py "games/Mi_Juego"

# Opciones: --output DIR, --recreate (reconstruir el proyecto), --overwrite
python3 rpgmaker-decrypter.py "games/Mi_Juego" --recreate --overwrite
```

En la GUI hay un botón **Descifrar** activo al seleccionar un juego XP/VX/VX Ace.

### Terminal

```bash
./rpgmaker-launcher.sh
```

## 🎯 Añadir juegos

Basta con colocar el `.zip` (o la carpeta del juego ya descomprimida) dentro de `~/Games/`:

```
~/Games/
├── rpgmaker-launcher.sh
├── rpgmaker-launcher-gui.py
├── games/            ← juegos descomprimidos (creado automáticamente)
│   └── Mi_Juego/
└── Mi_Juego.zip      ← se extrae solo al lanzarlo
```

El lanzador detecta el motor mirando estos ficheros:

| Fichero | Motor |
|---------|-------|
| `index.html` + `js/rmmz_core.js` | MZ |
| `index.html` + `js/rpg_core.js` | MV |
| `Game.rgss3a` | VX Ace |
| `Game.rgss2a` | VX |
| `Game.rgssad` | XP |
| `RPG_RT.exe` / `.ini` / `.lmt` | 2000 / 2003 |
| `*.py` + `renpy/` + `game/` | Ren'Py |
| `Data/Scripts.rvdata2` / `.rvdata` / `.rxdata` | VX Ace / VX / XP |

## 🛠️ Solución de problemas

- **"Juego incompleto"**: significa que la descarga o la descompresión se cortó. Borra la carpeta del juego y vuelve a lanzarlo (el `.zip` se re-extrae solo).
- **`require is not defined`** (u otro error de consola): algún plugin o parte del juego está pensado solo para la versión de escritorio (nw.js) y usa módulos de Node. Ejecuta el diagnóstico `--test` (o añade `--log-console`): ahí aparece el fichero y la línea exactos del error. En algunos juegos (p. ej. el plugin `Text2Frame` de *Hotel Pretender*) basta con proteger la llamada a `require()` para que no rompa el juego en el navegador.
- **Un juego MV/MZ no carga** con `nw is not defined`: algunos plugins (p. ej. `SRD_HUDMakerUltra`) están pensados para la versión de escritorio y fallan en navegador. El lanzador lo maneja si el juego trae los plugins correctos; consulta el `README` del juego.
- **Juegos para Windows con mayúsculas raras**: en Linux los nombres de fichero distinguen mayúsculas. Si un juego falla al abrir, revisa que las rutas de sus scripts coincidan exactamente (p. ej. `Input.js` vs `Input.JS`).

## ⚖️ Aviso legal

Este proyecto es un **lanzador**: no incluye ningún juego. Las partidas y comprimidos que pongas en `~/Games/` son tuyos y de sus respectivos autores. Este repositorio no contiene juegos comerciales ni material protegido por terceros.

## 📄 Licencia

Este proyecto se distribuye bajo **GNU General Public License versión 3** (`GPLv3`).

Puedes **usar, modificar y compartir** este lanzador libremente, siempre que las obras derivadas también se distribuyan bajo la misma licencia (copyleft) y se cite al autor. Consulta la [licencia completa](https://www.gnu.org/licenses/gpl-3.0.html) para los detalles.

Ver el fichero [`LICENSE`](LICENSE) para el texto completo.

## 🙏 Créditos

- [mkxp-z](https://github.com/mkxp-z/mkxp-z) — reimplementación de la runtime de RPG Maker XP/VX/VX Ace (licencia GPL).
- [EasyRPG Player](https://easyrpg.org/) — runtime para RPG Maker 2000/2003 (licencia GPL).
- [Ren'Py](https://www.renpy.org/) — motor de novelas visuales (licencia MIT).

---

Hecho con ❤️ para jugar en Linux (empezó como una app para Chromebooks).