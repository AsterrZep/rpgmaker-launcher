# 🎨 Especificación de Diseño UI/UX — RPG Maker Launcher

> **Documento pensado para ser consumido por una herramienta de diseño con IA**
> (v0, Midjourney/Figma AI, Galileo, Uizard, etc.) y como blueprint para migrar
> el frontend a tecnologías web (Tauri) manteniendo Python como backend.
>
> Versión del producto descrita: **0.7.x** · Idiomas: ES (base) / EN
> Plataformas: Linux (Windows/macOS deseables)

---

## 1. Visión general del producto

**RPG Maker Launcher** es un lanzador de juegos hechos con RPG Maker y Ren'Py.
El usuario arrastra/baja `.zip` de juegos (frecuentemente de itch.io), el
launcher los extrae, **detecta el motor automáticamente** y los lanza con el
runtime adecuado:

| Motor | Detección | Cómo se lanza |
|---|---|---|
| RPG Maker MZ / MV / web | `index.html` + `js/rmmz_core.js` o `rpg_core.js` | Servidor HTTP local (puerto fijo por juego para conservar partidas) + visor WebKit propio o navegador |
| RPG Maker XP / VX / VX Ace | `Game.rgss*a` | runtime mkxp-z |
| RPG Maker 2000/2003 | `RPG_RT.exe` | EasyRPG Player |
| Ren'Py | `*.py` + `renpy/` + `game/` | lanzador `.sh` del juego |

Además inyecta mejoras en los juegos web: **panel de trucos estilo JoyPlay,
rewind/save-states, mods JS del usuario, presets de trucos**, guardado de
partidas en archivos reales, etc.

**Filosofía visual actual**: tema oscuro "gamer" morado, tarjetas tipo Steam,
todo compacto, sin dependencias visuales externas.

---

## 2. Arquitectura objetivo (migración Tauri)

```
┌──────────────────────────── Tauri shell (Rust) ───────────────────────────┐
│  Frontend Web (JS/TS + framework ligero: Svelte/Solid/vanilla)            │
│      · Biblioteca, diálogos, ajustes — todo el UI                        │
└───────────────▲──────────────────────────────┬────────────────────────────┘
                │ HTTP JSON/WS localhost       │ invocación directa
┌───────────────┴──────────────────────────────▼────────────────────────────┐
│  Backend Python (sidecar): rpgmaker-server.py ampliado a API              │
│   · detección de motor, extracción zips, biblioteca/estado               │
│   · lanzamiento de juegos (servidor HTTP de juegos + visor WebKit)       │
│   · plugins, saveedit (zlib+JSON), sync, presets, mods, decrypter        │
│   · WebSocket: eventos en vivo (progreso extracción, servidor ON/OFF,    │
│     sesión de juego, tiempo jugado)                                      │
└───────────────────────────────────────────────────────────────────────────┘
```

**Clave**: ya existe un servidor HTTP Python multihilo (`rpgmaker-server.py`)
que sirve los juegos; se convierte en el backend API del frontend.

### API propuesta (backend Python)

| Método/ruta | Función |
|---|---|
| `GET /api/games` | lista: nombre, motor, portada(base64 o ruta), horas, última partida, favorito, estado |
| `POST /api/games/rescan` | extrae nuevos .zip (SSE/WS progreso) |
| `POST /api/games/{name}/launch` | lanza (query: `viewer=webkit\|browser`) |
| `POST /api/server/stop` | detiene servidor del último juego |
| `PATCH /api/games/{name}/favorite` | alterna favorito |
| `GET /api/tools/plugins?game=` | lista plugins + análisis WebKit |
| `POST /api/tools/plugins` | activar/desactivar (body: names+status) |
| `GET /api/saves?game=` | lista partidas (tamaño, fecha) |
| `POST /api/saves/{game}/backup·restore·export` | gestor de partidas |
| `GET /api/saves/{game}/{file}/content` | save decodificado (JSON zlib) |
| `PUT /api/saves/{game}/{file}/content` | guardar con backup previo |
| `GET /api/data/{game}?cat=items` | navegador de BD (soporta cifrado) |
| `POST /api/sync/push·pull` | sincronizar partidas a carpeta destino |
| `GET/PUT /api/config` | idioma, atajos, toggles, carpeta sync |
| `WS /api/events` | eventos push |

Los **diálogos pesados** (editor de partidas, navegador de datos, plugins)
son 100% factibles en frontend: toda su lógica ya está en módulos Python
puros (`rpgmaker-saveedit.py`, `rpgmaker-plugins.py`, `rpgmaker-sync.py`).

---

## 3. Design System actual (referencia a mantener/mejorar)

### 3.1 Paleta oscura

| Token | Hex | Uso |
|---|---|---|
| `bg` | `#0f1115` | fondo general de la app |
| `surface` | `#161a22` | cabecera, barras, pies de diálogo |
| `card` | `#1b202b` | tarjetas de juego |
| `card-hover` | `#232a3b` | hover de tarjeta |
| `card-selected` | `#252c41` | tarjeta seleccionada |
| `border` | `#2a3142` | bordes de tarjeta |
| `accent` | `#7c6cf0` | morado principal (botones clave, meta) |
| `accent-hover` | `#9182f6` | hover del acento |
| `accent-soft` | `#2a2f52` | selección suave (filas de tablas) |
| `text` | `#e7e9f0` | texto principal |
| `text-muted` | `#8a92a8` | texto secundario |
| `text-faint` | `#5a6275` | texto terciario/deshabilitado |
| `bad` | `#e06c75` | errores |
| `ok` | `#4ade80` | éxito / plugin ok / estado activo |
| `warn` | `#e5b567` | avisos / estrella favorito alternativa |

> El diseño IA puede proponer una evolución de esta paleta, pero debe seguir
> siendo **oscura, gaming y de bajo contraste agresivo**, con morado como color
> de marca (el icono de la app es morado).

### 3.2 Métricas actuales

- Tarjeta: 178×218 px · portada interna 150×104 px · padding lateral 16 px
- Tipografía: DejaVu Sans (17 bold título / 10 botones-cards / 8 metadatos)
- Esquinas redondeadas 8 px en cards, botones planos sin borde
- Ventana base: 1020×660 (mínimo 760×520), redimensionable

### 3.3 Iconografía

Actual: caracteres Unicode (▶ ★ ☆ ⚠ ↩ 💾 − + ↓). En web migrar a Lucide/
Tabler icons: play, star, star-off, refresh, square(stop), folder-open,
download, upload, gamepad-2, keyboard, puzzle, database, file-edit, refresh-ccw
(rewind), volume-2/volume-x, search, settings, chevron-left/right.

---

## 4. Pantallas y apartados

### 4.1 HOMEPAGE / BIBLIOTECA (pantalla principal)

**Propósito**: ver todos los juegos, lanzarlos y acceder a las herramientas.

```
┌──────────────────────────────────────────────────────────────────────┐
│ [logo] RPG Maker Launcher          [↓ v0.8] [ES] [⟳ Actualizar]     │  ← HEADER
│        Juegos de RPG Maker · Linux                                   │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐  │
│   │portada★│ │portada☆│ │portada★│ │portada │ │portada │ │portada │  │  ← GRID
│   │ Nombre │ │ Nombre │ │  ...   │ │  ...   │ │  ...   │ │  ...   │  │
│   │MZ·2h12m│ │MV·45m  │ │        │ │        │ │        │ │        │  │
│   │hace 2 h│ │ayer    │ │        │ │        │ │        │ │        │  │
│   └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘  │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│ [▶ Jugar] [Plugins][Partidas][Datos][Mods][Sync][Descifrar]          │  ← ACTIONBAR
│          [Detener servidor]        [☑WebKit][☑Del zip] [Atajos][Salir]│
├──────────────────────────────────────────────────────────────────────┤
│ ● Servidor 'Unholy Maiden' en puerto 18321 (WebKit)...               │  ← STATUS
└──────────────────────────────────────────────────────────────────────┘
```

**HEADER (superior)**
1. **Logo + título** ("RPG Maker Launcher") + subtítulo.
2. **Buscador** (propuesta nueva): filtra tarjetas por nombre en vivo.
3. **Botón update** `↓ vX.Y.Z`: solo aparece cuando hay release nuevo;
   accent; abre la página de releases.
4. **Selector idioma** `ES/EN`: alterna y persiste (`general.lang`).
5. **Actualizar**: busca `.zip` junto al launcher, los extrae (progreso en
   status bar), opcionalmente borra el zip tras extraer (toggle).
6. Toggle **Eliminar .zip** y toggle **Visor WebKit** (vs navegador):
   switches pequeños con label.

**GRID central**
- Flow/grid responsive: 3–6 columnas según ancho.
- Ordenación fija: **favoritos → última partida reciente → alfabético**.
  Los juegos con descarga incompleta van AL FINAL con badge `(!)` y no son
  jugables (tooltip lo explica).
- Estado vacío: mensaje centrado *"No hay juegos todavía. Coloca los .zip
  junto al lanzador y pulsa Actualizar."*

**Tarjeta de juego (componente reutilizable)** — ver 4.2.

**ACTIONBAR (inferior)**
Botones planos oscuros; el primario resalta:
- `▶ Jugar` (accent, disabled sin selección). Lanza según motor; si es web,
  arranca el servidor HTTP y abre visor/navegador.
- Herramientas (deshabilitadas si el motor no corresponde, mostrando aviso
  explicativo al pulsarlas en vez de nada):
  - **Plugins**: gestor de plugins del juego (ver 4.4)
  - **Partidas**: gestor de saves (ver 4.5)
  - **Datos**: navegador de la base de datos (ver 4.7)
  - **Mods**: abre carpeta `mods/` del juego creando plantilla documentada
  - **Sync**: sincronización de partidas (ver 4.8)
  - **Descifrar**: solo XP/VX/VXAce; desencripta assets con RPGMakerDecrypter
- `Detener servidor`: corta el HTTP del juego web activo (cierra sesión de
  tiempo jugado).
- Derecha: `Atajos` (editor de combinaciones) y `Salir`.

**STATUS BAR (pie)**: mensajes dinámicos de todo el flujo (extrayendo…,
servidor iniciado puerto N, copias hechas, nueva versión disponible…).
Si hay servidor activo muestra `'Juego' (puerto N)`.

**Interacciones clave**
- Un clic selecciona tarjeta; **doble clic = Jugar**.
- ★ en la esquina sup. derecha de la portada alterna favorito (sin abrir
  nada); reordena la parrilla en vivo.
- **Drag & drop**: soltar `.zip` en cualquier zona de la parrilla los copia
  a la biblioteca y dispara la extracción (mostrar overlay "Suelta tus
  .zip aquí" mientras se arrastra).
- Al cerrar un juego web se registra tiempo jugado (sesión), zoom del visor
  y, si el auto-sync está activo, se empujan las partidas.

---

### 4.2 TARJETA DE JUEGO (componente)

| Zona | Contenido | Datos |
|---|---|---|
| Portada | imagen 150×104 (cover.png/jpg/webp del juego → icon/icon.png → title.png). Sin portada: inicial gigante tenue | archivo |
| Badge favorito | ★ dorado / ☆ gris, esquina sup-derecha de la PORTADA | `games[name].favorite` |
| Nombre | bold, wrap 2 líneas máx | nombre de carpeta |
| Meta | `MOTOR · Xh Ym` (motor coloreado en accent) | detección + `seconds` |
| Última partida | "ahora / hace N min / hace N h / hace N d / fecha" | `last_played` |

Estados: normal, hover (fondo más claro), seleccionada (borde accent +
fondo card-selected). Juego incompleto: overlay/badge de advertencia y
acciones bloqueadas.

---

### 4.3 FLUJO LANZAR JUEGO WEB

1. Clic ▶ Jugar → status "Iniciando servidor para X (WebKit)..."
2. Backend: puerto determinista por nombre (md5 → 18000–27999) para que las
   partidas del navegador sobrevivan entre sesiones.
3. Se inyectan automáticamente en el juego: configuración de usuario, bridge
   de guardados reales, presets, rewind, panel de trucos, gamepad, atajos.
4. Abre visor WebKit (zoom recordado por juego) o navegador por defecto.
5. Status: `'Juego' (puerto N)`. Botón Detener servidor pasa a relevante.

---

### 4.4 DIÁLOGO PLUGINS

Ventana modal 660×480, título "Plugins · <juego>", subtítulo explicativo.

- Tabla: **Plugin | Estado (ON/off) | WebKit** (categoría compatibilidad:
  `ok`, `NW protegido`, `ROTO (nw.js)`, `sin fichero`) con colores.
- Selección múltiple; botones inferiores: `Copia de seguridad`(accent),
  `Restaurar` (vuelve al plugins.js original), `Exportar—no`, `Borrar`,
  `Abrir carpeta`, `Cerrar`.
- Casos: aviso "Selecciona al menos un plugin", "No encontrados: …".
- Nota: desactivar plugins pesados mejora rendimiento en visor WebKit.

---

### 4.5 DIÁLOGO PARTIDAS (gestor de guardados)

Modal 620×460. Requiere carpeta `save/` existente (si no, mensaje guía).

- Tabla: **Archivo | Tamaño (KB) | Modificado (dd/mm/YYYY HH:MM)**.
- Selección múltiple.
- Acciones: `Copia de seguridad` (→ backups/<juego>/<timestamp>/),
  `Restaurar` (elige snapshot), `Exportar` (a carpeta elegida),
  `Borrar` (confirmación), `Abrir carpeta`.
- Botón destacado **`Editar contenido`** → abre 4.6 (requiere exactamente
  1 archivo; confirma antes).

---

### 4.6 EDITOR DE PARTIDAS (MZ/MV)

Modal 780×560. Banner amarillo arriba:
"⚠ Cierra el juego antes de editar: si está abierto, su autoguardado puede
sobrescribir tus cambios."

- Línea resumen: Oro · Objetos distintos · Variables usadas · Switches ON ·
  Personajes.
- **Pestañas**:
  - *General*: campo Oro.
  - *Objetos*: tabla ID/Nombre/Cantidad (nombres reales de items+armas+
    defensas), buscador, editar cantidad, Añadir por ID (+cantidad).
  - *Variables*: tabla ID/Nombre/Valor; búsqueda por id/nombre/valor;
    editar valor (numérico o texto).
  - *Switches*: tabla ID/Nombre/Estado; buscador; botón ON/OFF.
- Barra inferior: `Guardar cambios` (accent) + `Cerrar`. Guardar = backup
  automático del original en `backups/<juego>/save-edit-<ts>/` + status.

Formato interno: los saves MV/MZ son **zlib + JSON** (pako).

---

### 4.7 NAVEGADOR DE DATOS

Modal 760×540 read-only sobre `data/*.json` (soporta BD cifradas MV/MZ:
cabecera RPGMV de 16 bytes en `.rpgmdata`/`.json_`).

- Fila superior: selector **Categoría** (Objetos/Armas/Defensas/Habilidades/
  Enemigos) + **Buscar** (nombre o ID) + contador "%d elemento(s)".
- Tabla: ID | Nombre | columnas por categoría:
  - Objetos/Armas/Defensas: Precio (+ATK/+DEF)
  - Habilidades: coste MP
  - Enemigos: HP, EXP, Oro
- Si no hay datos legibles: "Sin datos legibles (¿cifrados o vacíos?)".

---

### 4.8 SYNC DE PARTIDAS

Modal 680×460. Propósito: llevarse los saves a Dropbox/Syncthing/Nextcloud/
USB (carpeta cualquiera elegida por el usuario).

- Cabecera explicativa.
- Fila "Carpeta de destino: <ruta>" + `Cambiar...` (selector de carpetas).
- Tabla por juego: **Juego | Local (N) | Destino (N)**.
- Botones: `Enviar al destino →` (accent), `← Traer del destino`
  (con backup automático `save-pre-pull-<ts>/`), `Abrir destino`.
- Checkbox **"Sincronizar automáticamente al cerrar una partida"**.
- Pie con totales Local/Destino.

---

### 4.9 PANEL DE TRUCOS IN-GAME (F8) — overlay dentro del juego

Panel flotante 320px, esquina sup-derecha, arrastrable, Shadow DOM aislado,
botón flotante "T". Pestañas:

1. **General**: Oro (input+Añadir+MAX) · botón LO TODO (oro+inventario+
   nivel+stats+skills, nunca estados) · HP/MP/TP al máximo · Quitar estados
   · **Volumen** Mute/25/50/75/100 · **Rewind** (💾 Guardar F6 / ↩ Restaurar
   F7 / Auto cada 45s checkbox / contador n/10 · hora) · Teletransporte
   (mapa,X,Y).
2. **Objetos**: dar objeto por **nombre o ID** (autocompletado, cant.) +
   botones masivos (99 objetos / 10 armas / 10 defensas / TODO).
3. **Grupo**: aplica a todos los personajes con nombre — Nivel MAX · Stats
   MAX (tope configurable) · Aprender todas las skills · catálogo de
   **Habilidades** buscable (+ aprender / − olvidar individual, verde=conocida,
   contador) · advertencia estados · **Estados**: Añadir TODOS ⚠ /
   Quitar TODOS / por ID ± · lista "Activos" en vivo con − individual ·
   Catálogo completo de estados del juego (buscador, verde=activo, tooltip
   temporal vs persistente, +/−) · botón "Deshacer skills del cheat + limpiar
   estados".
4. **Variables / Switches**: input con autocompletado de nombres reales,
   hint "#ID — nombre", Poner/ON/OFF.
5. **Presets** (si existe cheats-presets.json): un botón por preset que
   ejecuta sus acciones en orden (gold/goldMax/item/items/level/stats/skills/
   heal/clearStates/allStates/tp/variable/switch/eval) + salida OK/errores.
6. **Código**: textarea eval JS libre + salida.

Extras in-game fuera del panel: **F6/F7 rewind**, toasts de feedback,
teclas ignoradas mientras se escribe en el panel.

> Este panel es JS inyectado; en Tauri puede seguir igual o rediseñarse como
> overlay web del propio frontend. El diseño IA puede proponerle look nuevo
> manteniendo TODAS las funciones listadas.

---

### 4.10 OTROS APARTADOS

- **Plantilla trucos / Mods**: acciones de un clic que generan
  `cheats-presets.json` (+LEEME con todos los tipos de acción) o `mods/`
  (+ejemplo comentado) junto al index.html del juego, y abren la carpeta.
- **Atajos de teclado**: editor con captura de tecla por acción (trucos,
  recargar, FPS, captura, fullscreen, zoom±/0). Persisten en config.
- **Descifrar**: para XP/VX/VXAce; descarga RPGMakerDecrypter una vez y
  escribe los assets abiertos en `<juego>_descifrado`.
- **Capturas**: F12 guarda PNG en screenshots/ con nombre del juego+fecha.
- **FPS overlay**: F9 muestra contador en el visor.

---

## 5. Estados transversales

| Estado | Tratamiento |
|---|---|
| Sin juegos | empty-state centrado con instrucciones |
| Descarga incompleta | badge `(!)` en card, bloqueado, va al final |
| Error en callback | diálogo de error visible SIEMPRE (nunca silencioso) |
| Confirmaciones | modal genérico Sí/No reutilizable |
| Inputs de texto | modal genérico con entry |
| Éxitos | barra de estado (no molestar con modales) salvo acciones críticas |
| Update disponible | chip accent permanente en header |

---

## 6. i18n

Todo texto visible pasa por tabla ES→EN (`_(...)`). La IA debe dejar los
strings agrupados y sin hardcodear en el diseño (entregable: JSON de copy).

---

## 7. Qué pedirle a la herramienta de diseño IA (prompt sugerido)

> "Diseña la interfaz completa de un **lanzador de juegos retro-indie
> (RPG Maker / Ren'Py)** para Linux, **tema oscuro gaming** con paleta
> basada en #0f1115 / #1b202b / acento morado #7c6cf0. Entrega:
> ① Homepage con header (logo, buscador, idioma ES/EN, actualizar, chip de
> nueva versión), grid responsive de tarjetas de juego (portada, nombre,
> motor + horas jugadas, última partida, estrella favorito) ordenadas por
> favoritos/recientes, actionbar inferior con botones Jugar/Herramientas/
> Detener servidor y barra de estado.
> ② Componente tarjeta en 3 estados (normal/hover/seleccionada) + variante
> 'incompleto' y estado vacío.
> ③ Modales: gestor de partidas, editor de partidas con 4 pestañas y banner
> de advertencia, navegador de base de datos con categorías y buscador,
> gestor de plugins con tabla y badges de compatibilidad, sync de partidas
> con tabla Local/Destino.
> ④ Overlay in-game: menú de trucos con 6 pestañas y mini-reproductor de
> volumen + rewind.
> Estilo: compacto, esquinas 8px, botones planos, tipografía sans moderna,
> accesible (contraste AA), textos ES/EN."

---

## 8. Criterios de aceptación de la migración

1. Todas las funciones de este documento operativas en el frontend web.
2. Backend Python intacto y reutilizado (sin reescribir lógica).
3. Partidas/saves 100% compatibles con las versiones anteriores.
4. Arranque en frío < 1 s; binario único multiplataforma.
5. Los juegos siguen lanzándose con su servidor HTTP de puertos fijos.
