# RPG Maker Launcher — página de itch.io

Guía para publicar el proyecto en itch.io (https://itch.io) con la descripción,
clasificación, etiquetas y material de promoción. Está pensada para una
**herramienta** (no un juego): se publica en la categoría **Tools**.

---

## 1. Datos de la página

| Campo | Valor |
|---|---|
| **Título** | RPG Maker Launcher |
| **Tagline / sub** | Play your RPG Maker & Ren'Py games on Linux (incl. Chrome OS) |
| **Clasificación** | Tools (Herramientas) |
| **Género** | Software / Utilidad |
| **Plataforma** | Linux (incluye Chrome OS · Crostini) |
| **Precio** | Gratis (puedes activar "Name your own price" con donación opcional) |
| **Licencia** | GNU GPL v3 (GPLv3) |
| **URL sugerida** | `https://asterrzep.itch.io/rpg-maker-launcher` |

**Tags recomendados** (10 máximo en itch.io):
`rpg-maker`, `renpy`, `launcher`, `linux`, `chrome-os`, `crostini`, `rpg`, `visual-novel`, `tools`, `utility`

---

## 2. Descripción completa (pégalo en el editor)

### Version corta (para el tagline)

> Playing RPG Maker and Ren'Py games on Linux without Windows? This launcher detects the engine of every game, extracts the `.zip` if needed and runs it with the correct runtime, without touching the game itself. Works on any Linux desktop (it started life as a Chrome OS app).

### Descripción larga (HTML con diseño)

Pega **todo el contenido de [`docs/itchio-long-description.html`](itchio-long-description.html)** en el campo
**Long description** del editor de itch.io. Es HTML auto-contenido con diseño oscuro
(tarjetas, tabla de motores, bloques de instalación) que hace juego con la app:

```text
docs/itchio-long-description.html  <- copia TODO este archivo y pégalo en itch.io
```

> **Antes de publicar:**
> 1. Sube 3-5 capturas de pantalla a itch.io y sustituye `REPLACE_WITH_SCREENSHOT_1/2/3`
>    por las URLs de tus capturas dentro del HTML.
> 2. Los botones de descarga apuntan a GitHub Releases; si prefieres que se descargue
>    el fichero desde itch.io, cambia los `href` por las URLs de tus ficheros de itch.io.
> 3. La descripción está en **inglés** (comunidad internacional).

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
RPG Maker Launcher v0.2.0

A universal RPG Maker & Ren'Py launcher for Linux (started life as a Chrome OS app).
Auto-detects the engine, extracts .zips and runs MZ, MV, XP, VX, VX Ace, 2000/2003
and Ren'Py games (both old Python 2 and modern Python 3 ones). Includes a lightweight
WebKit viewer, on-disk saves, cheats, gamepad support, a plugin manager and a decrypter.
Now in English and Spanish (switchable from the GUI).

Free & open-source (GPLv3).
Download: https://github.com/AsterrZep/rpgmaker-launcher/releases
itch.io: https://asterrzep.itch.io/rpg-maker-launcher
```

### Dónde publicar

- **Reddit**: r/linux_gaming, r/RPGMaker, r/visualnovels, r/opensource, y de paso r/chromeos y r/ChromebookGaming (su comunidad original).
- **Discord**: servidores de la comunidad de itch.io, de RPG Maker, de Ren'Py y de Linux.
- **Redes**: X/Twitter (etiqueta @itchio), Mastodon, grupos de Facebook de Linux/Chrome OS.
- **YouTube**: un vídeo corto de 30-60 s mostrando cómo se lanza un MZ y un Ren'Py en Linux ayuda muchísimo.

### Consejos para el lanzamiento

1. Publica primero en itch.io y luego comparte el enlace (el tráfico de itch.io es gratuito para herramientas).
2. Sube capturas reales del launcher, no maquetas.
3. Responde rápido a los comentarios: la comunidad de Linux/Chrome OS agradece que el proyecto tenga soporte.
4. En el README ya hay sección de "Solución de problemas": enlázala en cada respuesta a bugs.
5. Si quieres donaciones, marca el precio "a tu gusto" (name your own price) en itch.io.