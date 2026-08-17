# 🎮 RPG Maker Launcher

Lanzador universal de juegos de RPG Maker y Ren'Py para **Chrome OS** (Linux / Crostini) y cualquier Linux con escritorio. Detecta automáticamente el motor de cada juego, descomprime el `.zip` si hace falta y lo ejecuta con el runtime correcto, sin tocar nada del juego.

> Probado en: Chrome OS con contenedor Linux (Debian trixie), Debian 13 trixie x86_64.

---

## ✨ Características

- **Detección automática de motor** — MZ, MV, XP, VX, VX Ace, 2000 y 2003, y Ren'Py.
- **Descompresión automática** — si el juego viene en `.zip`, se extrae al vuelo (una sola vez) con marcador de integridad.
- **Interfaz gráfica** — ventana sencilla tipo app de Chrome OS, con botón **Detener servidor**, **Borrar .zip** y opción de eliminar el comprimido tras extraer.
- **Visor WebKit ligero** — los juegos web (MZ/MV) pueden abrirse en un visor WebKit propio en vez del navegador completo: menos memoria y arranque más rápido para juegos pesados.
- **Versión de terminal** — menú clásico para quien prefiera la consola.
- **Sin solapamientos** — si lanzas un juego web y luego otro, el servidor anterior se cierra solo.
- **Advertencia de descarga incompleta** — detecta juegos a medio descomprimir o descargas cortadas.
- **Diagnóstico de errores** — el visor WebKit guarda los mensajes de consola JS en `<juego>.webkit.log`, lo que ayuda a detectar plugins rotos (p. ej. `require is not defined`).

## 🎛️ Motores soportados

| Motor | Generación | Runtime | Forma de ejecución |
|-------|-----------|---------|--------------------|
| RPG Maker MZ | Web | Servidor HTTP local | Navegador o **visor WebKit ligero** |
| RPG Maker MV | Web | Servidor HTTP local | Navegador o **visor WebKit ligero** |
| RPG Maker XP / VX / VX Ace | Escritorio | [mkxp-z](https://github.com/mkxp-z/mkxp-z) | binario nativo |
| RPG Maker 2000 / 2003 | Escritorio | [EasyRPG Player](https://easyrpg.org/) | binario nativo |
| Ren'Py | Escritorio | Motor Ren'Py incluido | `.sh` de Linux |

## 📦 Requisitos

- Chrome OS con **Linux (Crostini)** activado, o cualquier Linux con escritorio.
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
4. Genera e instala el acceso directo de la app en Chrome OS.

Cuando termine, busca **RPG Maker Launcher** en la lista de aplicaciones de Linux de Chrome OS. Si no aparece, cierra sesión y vuelve a entrar (o reinicia el contenedor Linux).

## 🕹️ Uso

### Interfaz gráfica

1. Abre la app **RPG Maker Launcher**.
2. Si hay un `.zip` en `~/Games`, se extrae automáticamente al lanzar el juego.
3. Pulsa el nombre del juego. Los juegos web (MZ/MV) se abren en el navegador (o en el **visor WebKit ligero** si marcas la casilla "Visor WebKit (más ligero)"); los demás se abren en una ventana.
4. Usa **Detener servidor** para apagar el servidor web en cualquier momento (también se apaga solo al cerrar la app).

### Visor WebKit ligero

Para juegos web pesados, marca la casilla **"Visor WebKit (más ligero)"** antes de pulsar **Jugar**: en vez de abrir el navegador completo (que consume mucha memoria), el juego se abre en una ventana de WebKitGTK con solo la página del juego.

- Atajos: `Ctrl + / Ctrl -` zoom, `Ctrl 0` tamaño normal, `F11` pantalla completa, `Esc` salir de pantalla completa, `F5` recargar.
- Los mensajes de consola JS se guardan en `<juego>.webkit.log` (junto a la carpeta de juegos) para diagnóstico.
- Desde terminal, el lanzador te pregunta con qué abrir cada juego web.

### Diagnóstico de un juego que no arranca

El visor incluye un modo de diagnóstico que carga el juego, espera unos segundos y comprueba si llegó a la escena de título, si hay errores de JavaScript y si quedó atascado en el cargador:

```bash
python3 rpgmaker-webview.py --url "http://localhost:PUERTO/index.html" --test
```

Salida de ejemplo: `{"scene": "Scene_Title", "errors": []}` (juego OK) o `{"scene": "none", "errors": [{"message": "...", "file": "...", "line": ...}]}` con el error exacto.

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
- **`require is not defined`** (u otro error de consola): algún plugin o parte del juego está pensado solo para la versión de escritorio (nw.js) y usa módulos de Node. Abre el juego con el **visor WebKit** y mira `<juego>.webkit.log`: ahí aparece el fichero y la línea exactos del error. En algunos juegos (p. ej. el plugin `Text2Frame` de *Hotel Pretender*) basta con proteger la llamada a `require()` para que no rompa el juego en el navegador.
- **Un juego MV/MZ no carga** con `nw is not defined`: algunos plugins (p. ej. `SRD_HUDMakerUltra`) están pensados para la versión de escritorio y fallan en navegador. El lanzador lo maneja si el juego trae los plugins correctos; consulta el `README` del juego.
- **Juegos para Windows con mayúsculas raras**: en Linux los nombres de fichero distinguen mayúsculas. Si un juego falla al abrir, revisa que las rutas de sus scripts coincidan exactamente (p. ej. `Input.js` vs `Input.JS`).

## ⚖️ Aviso legal

Este proyecto es un **lanzador**: no incluye ningún juego. Las partidas y comprimidos que pongas en `~/Games/` son tuyos y de sus respectivos autores. Este repositorio no contiene juegos comerciales ni material protegido por terceros.

## 📄 Licencia

Este proyecto se distribuye bajo **Creative Commons Atribución-NoComercial 4.0 Internacional** (`CC BY-NC 4.0`).

Puedes **usar, modificar y compartir** este lanzador **libremente para fines no comerciales**, citando al autor. Está **prohibido** el uso comercial, incluida la venta del código o de servicios basados en él.

Ver el fichero [`LICENSE`](LICENSE) para el texto completo.

## 🙏 Créditos

- [mkxp-z](https://github.com/mkxp-z/mkxp-z) — reimplementación de la runtime de RPG Maker XP/VX/VX Ace (licencia GPL).
- [EasyRPG Player](https://easyrpg.org/) — runtime para RPG Maker 2000/2003 (licencia GPL).
- [Ren'Py](https://www.renpy.org/) — motor de novelas visuales (licencia MIT).

---

Hecho con ❤️ para jugar en Chromebooks.