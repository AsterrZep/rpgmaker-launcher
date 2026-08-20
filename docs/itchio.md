# RPG Maker Launcher — página de itch.io

Guía para publicar el proyecto en itch.io (https://itch.io) con la descripción,
clasificación, etiquetas y material de promoción. Está pensada para una
**herramienta** (no un juego): se publica en la categoría **Tools**.

---

## 1. Datos de la página

| Campo | Valor |
|---|---|
| **Título** | RPG Maker Launcher |
| **Tagline / sub** | Juega a tus RPG Maker y Ren'Py en tu Chromebook o Linux |
| **Clasificación** | Tools (Herramientas) |
| **Género** | Software / Utilidad |
| **Plataforma** | Linux (Chrome OS · Crostini) |
| **Precio** | Gratis (puedes activar "Name your own price" con donación opcional) |
| **Licencia** | GNU GPL v3 (GPLv3) |
| **URL sugerida** | `https://asterrzep.itch.io/rpg-maker-launcher` |

**Tags recomendados** (10 máximo en itch.io):
`rpg-maker`, `renpy`, `launcher`, `chrome-os`, `crostini`, `chromebook`, `linux`, `rpg`, `visual-novel`, `tools`

---

## 2. Descripción completa (pégalo en el editor)

### Version corta (para el tagline)

> ¿Tienes un Chromebook? Juega a tus RPG Maker y novelas visuales de Ren'Py sin instalar Windows. Este lanzador detecta el motor de cada juego, descomprime el `.zip` si hace falta y lo ejecuta con el runtime correcto, sin tocar nada del juego.

### Descripción larga (markdown)

```markdown
**¿Tienes un Chromebook y te mueres por jugar a esos RPG Maker y novelas visuales de Ren'Py?**

**RPG Maker Launcher** es un lanzador universal de escritorio para **Chrome OS (Linux/Crostini)** y cualquier Linux con escritorio. Detecta automáticamente el motor de cada juego, descomprime el `.zip` si hace falta y lo ejecuta con el runtime adecuado, sin tocar nada del juego.

### Motores soportados

- **RPG Maker MZ y MV** (web) → se abren en el navegador o en un visor WebKit ligero.
- **RPG Maker XP, VX y VX Ace** → con mkxp-z (binario nativo).
- **RPG Maker 2000 y 2003** → con EasyRPG Player.
- **Ren'Py** → tanto los juegos antiguos de **Python 2** como los modernos de **Python 3** (se usa el motor que el propio juego incluye).

### Características

- ✅ **Descompresión automática** de `.zip` (una sola vez, con marcador de integridad).
- ✅ **Detección automática del motor** en más de 10 variantes.
- ✅ **Visor WebKit ligero** para juegos web pesados (mucho menos memoria que el navegador).
- ✅ **Servidor HTTP multihilo con caché**: sin tirones al cargar muchos assets de golpe.
- ✅ **Gestor de plugins MZ/MV**: detecta plugins incompatibles o pesados y los desactiva (hasta un 31 % más rápido).
- ✅ **Partidas en disco real**: guarda en archivos `.rpgsave`/`.rmmzsave` exportables, con copias de seguridad desde la propia GUI.
- ✅ **Trucos estilo JoyPlay** (F8): oro, HP/MP, objetos, variables, switches, teletransporte y consola de código.
- ✅ **Mando (gamepad)** para juegos MZ/MV.
- ✅ **Atajos configurables**: FPS, captura de pantalla, pantalla completa, zoom, recargar…
- ✅ **Descifrador integrado** para XP/VX/VX Ace/MV/MZ.
- ✅ **Librería visual** con portadas, "última vez jugado" y tiempo total.
- ✅ **Versión de terminal** y **versión gráfica** (GUI).
- ✅ **Diagnóstico de errores** (`--test`) para saber por qué un juego no arranca.

### Instalación (elige una)

1. **Debian/Ubuntu — recomendado en Chrome OS** (ocupa poco):
   ```bash
   sudo apt install ./rpgmaker-launcher_<versión>_amd64.deb
   ```
2. **AppImage** (portable, sin instalar, incluye su propio Python):
   ```bash
   chmod +x rpgmaker-launcher-<versión>-x86_64.AppImage && ./rpgmaker-launcher-<versión>-x86_64.AppImage
   ```
3. **Flatpak** (sandbox de GNOME; ojo: la primera vez descarga el runtime de GNOME, ~2-3 GB):
   ```bash
   flatpak install rpgmaker-launcher-<versión>.flatpak
   ```

> Si el espacio te preocupa, usa el **.deb** o el **AppImage**: ocupan muchísimo menos que el Flatpak.

### Cómo se usa

1. Coloca tus juegos (`.zip` o carpetas ya descomprimidas) dentro de `~/Games/`.
2. Abre **RPG Maker Launcher**.
3. Pulsa el nombre del juego… ¡y a jugar!

### Requisitos

- Chrome OS con **Linux (Crostini)** activado, o cualquier Linux con escritorio.
- **Python 3** (viene en todas las distribuciones).
- `unzip`.
- XP/VX/VX Ace: `mkxp-z` (lo compila el instalador automáticamente).
- 2000/2003: `easyrpg-player` (lo instala el instalador).

### Enlaces

- **Código fuente y releases**: https://github.com/AsterrZep/rpgmaker-launcher
- **Guía completa (README)**: instalación, solución de problemas, trucos, partidas.

### Licencia

Proyecto bajo **GNU General Public License versión 3 (GPLv3)**: software libre con copyleft — puedes usarlo, modificarlo y compartirlo, y las obras derivadas deben distribuirse bajo la misma licencia. Este lanzador **no incluye ningún juego**: las partidas y comprimidos que pongas en `~/Games/` son tuyos y de sus autores.
```

---

## 3. Material que debes subir / preparar

- **Fichero del proyecto**: sube en itch.io un `.zip` con los tres formatos
  (`*.deb`, `*.AppImage`, `*.flatpak`), el `README.md` y la carpeta `docs/`
  para que se pueda descargar la versión que cada uno prefiera.
- **Portada / cover**: usa `rpgmaker-icon.png` (512×512 o mayor) o diseña un
  banner con el estilo de `docs/index.html` (fondo morado oscuro, gradiente
  violeta→rosa).
- **Capturas de pantalla** (obligatorio, 3-5):
  1. La librería visual con varias tarjetas de juegos.
  2. El visor WebKit abriendo un juego MV/MZ.
  3. El menú de trucos (F8).
  4. Un juego Ren'Py abierto.
  5. Un juego de XP/VX en ventana (mkxp-z).
- **Embed / vista embebida**: en la configuración de la página, activa la
  vista embebida y usa `docs/index.html` (tu página de presentación) o sube
  `docs/index.html` como proyecto embebible.
- **Fecha de publicación**: hoy (o cuando termines de preparar capturas).

---

## 4. Textos para publicitarlo (copiar y pegar)

### Texto corto (Reddit / Discord / foros)

```
RPG Maker Launcher v0.1.2

Lanzador universal de juegos de RPG Maker y Ren'Py para Chrome OS (Crostini) y Linux.
Detecta el motor, descomprime .zips y ejecuta MZ, MV, XP, VX, VX Ace, 2000/2003 y Ren'Py
(tanto los de Python 2 como los de Python 3). Incluye visor WebKit ligero, partidas en disco,
trucos, mando, gestor de plugins y descifrador.

Gratis y open-source (GPLv3).
Descárgalo: https://github.com/AsterrZep/rpgmaker-launcher/releases
Página en itch.io: https://asterrzep.itch.io/rpg-maker-launcher
```

### Texto en inglés (para comunidades internacionales)

```
RPG Maker Launcher v0.1.2

A universal RPG Maker & Ren'Py launcher for Chrome OS (Crostini) and Linux.
Auto-detects the engine, extracts .zips and runs MZ, MV, XP, VX, VX Ace, 2000/2003
and Ren'Py games (both old Python 2 and modern Python 3 ones). Includes a lightweight
WebKit viewer, on-disk saves, cheats, gamepad support, a plugin manager and a decrypter.

Free & open-source (GPLv3).
Download: https://github.com/AsterrZep/rpgmaker-launcher/releases
itch.io: https://asterrzep.itch.io/rpg-maker-launcher
```

### Dónde publicar

- **Reddit**: r/chromeos, r/ChromebookGaming, r/RPGMaker, r/visualnovels, r/linux_gaming, r/opensource.
- **Discord**: servidores de la comunidad de itch.io, de RPG Maker, de Ren'Py y de Chrome OS.
- **Redes**: X/Twitter (etiqueta @itchio, @makecode si procede), Mastodon, grupos de Facebook de Chrome OS/Chromebook.
- **YouTube**: un vídeo corto de 30-60 s mostrando cómo se lanza un MZ y un Ren'Py en un Chromebook ayuda muchísimo.

### Consejos para el lanzamiento

1. Publica primero en itch.io y luego comparte el enlace (el tráfico de itch.io es gratuito para herramientas).
2. Sube capturas reales del launcher, no maquetas.
3. Responde rápido a los comentarios: la comunidad de Chrome OS agradece que el proyecto tenga soporte.
4. En el README ya hay sección de "Solución de problemas": enlázala en cada respuesta a bugs.
5. Si quieres donaciones, marca el precio "a tu gusto" (name your own price) en itch.io.