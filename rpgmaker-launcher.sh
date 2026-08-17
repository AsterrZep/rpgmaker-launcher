#!/usr/bin/env bash
# ============================================================
#  RPG Maker Launcher  (Chrome OS / Linux)
#  Detecta el motor de cada juego y lo lanza con el runtime
#  adecuado:
#    - MV / MZ          -> servidor HTTP + navegador
#    - 2000 / 2003      -> EasyRPG Player
#    - XP / VX / VX Ace -> mkxp-z
# ============================================================
set -u

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GAMES_DIR="$BASE_DIR/games"
RUN_DIR="$BASE_DIR/runtimes"
MAX_DEPTH=5

MKXPZ="$RUN_DIR/mkxp-z"
EASYRPG="easyrpg-player"
WEBVIEW="$BASE_DIR/rpgmaker-webview.py"

mkdir -p "$GAMES_DIR"

# ---------- utilidades ----------
free_port() {
    python3 -c 'import socket; s=socket.socket(); s.bind(("",0)); print(s.getsockname()[1]); s.close()'
}

first_find() {
    # primer archivo que coincida con el patrón, hasta MAX_DEPTH
    find "$1" -maxdepth "$MAX_DEPTH" -type f \( -name "$2" \) 2>/dev/null | head -n1
}

extract_zips() {
    local zip
    local name
    local marker
    for zip in "$BASE_DIR"/*.zip; do
        [ -f "$zip" ] || continue
        name="$(basename "$zip" .zip)"
        marker="$GAMES_DIR/$name/.extracted"
        if [ -f "$marker" ]; then
            continue
        fi
        echo ">> Extrayendo: $(basename "$zip")"
        mkdir -p "$GAMES_DIR/$name"
        if unzip -o -q "$zip" -d "$GAMES_DIR/$name" && touch "$marker"; then
            echo "   OK"
        else
            echo "   ERROR extrayendo $zip"
            rm -f "$marker"
        fi
    done
}

# ---------- detección de motor ----------
# Devuelve "RAIZ|MOTOR|ETIQUETA"
detect_engine() {
    local top="$1"
    local f root engine

    # 1) Web: index.html (MV/MZ y derivados web)
    f="$(first_find "$top" "index.html")"
    if [ -n "$f" ]; then
        root="$(dirname "$f")"
        if [ -f "$root/js/rmmz_core.js" ]; then
            engine="MZ"
        elif [ -f "$root/js/rpg_core.js" ]; then
            engine="MV"
        else
            engine="web"
        fi
        echo "$root|$engine"
        return
    fi

    # 2) RGSS: XP / VX / VX Ace (archivos cifrados o Game.ini)
    for pair in "Game.rgss3a:VXAce" "Game.rgss2a:VX" "Game.rgssad:XP"; do
        file="${pair%%:*}"
        eng="${pair##*:}"
        f="$(first_find "$top" "$file")"
        if [ -n "$f" ]; then
            echo "$(dirname "$f")|$eng"
            return
        fi
    done

    # 3) RPG Maker 2000 / 2003
    f="$(first_find "$top" "RPG_RT.exe")"
    [ -z "$f" ] && f="$(first_find "$top" "RPG_RT.ini")"
    [ -z "$f" ] && f="$(first_find "$top" "*.lmt")"
    if [ -n "$f" ]; then
        echo "$(dirname "$f")|2000-2003"
        return
    fi

    # 4) Ren'Py (motor de novelas visuales, versión Linux incluida)
    f="$(first_find "$top" "*.py")"
    if [ -n "$f" ]; then
        rdir="$(dirname "$f")"
        if [ -d "$rdir/renpy" ] && [ -d "$rdir/game" ] && [ -d "$rdir/lib/linux-x86_64" ]; then
            echo "$rdir|renpy"
            return
        fi
    fi

    # 5) RGSS sin cifrar (Data/Scripts.*)
    for pair in "Scripts.rvdata2:VXAce" "Scripts.rvdata:VX" "Scripts.rxdata:XP"; do
        file="${pair%%:*}"
        eng="${pair##*:}"
        f="$(first_find "$top" "$file")"
        if [ -n "$f" ]; then
            echo "$(dirname "$f")|$eng"
            return
        fi
    done

    echo ""
}

# ---------- lanzamiento ----------
launch_web() {
    local dir="$1"
    local viewer="$2"
    local port
    port="$(free_port)"
    echo ""
    echo ">> Servidor en: http://localhost:$port  (directorio: $dir)"
    python3 -m http.server "$port" --bind 127.0.0.1 --directory "$dir" >/dev/null 2>&1 &
    local pid=$!
    sleep 1
    if [ "$viewer" = "webkit" ]; then
        echo ">> Abriendo el visor WebKit ligero..."
        python3 -u "$WEBVIEW" --url "http://localhost:$port/index.html" \
            --title "$(basename "$dir")" >> "$GAMES_DIR/$(basename "$dir").webkit.log" 2>/dev/null &
        local vpid=$!
        trap 'kill "$pid" "$vpid" 2>/dev/null; exit 0' INT
        wait "$pid"
    else
        echo ">> Abriendo el navegador..."
        xdg-open "http://localhost:$port/index.html" >/dev/null 2>&1 || true
        echo ">> Juego abierto. Pulsa Ctrl+C para cerrar el servidor."
        trap 'kill "$pid" 2>/dev/null; exit 0' INT
        wait "$pid"
    fi
}

launch_native() {
    local dir="$1"
    local engine="$2"
    local cmd
    case "$engine" in
        2000-2003)
            cmd=("$EASYRPG" "$dir")
            ;;
        renpy)
            cmd=("./$(basename "$(first_find "$dir" "*.py")" .py).sh")
            ;;
        *)
            cmd=("$MKXPZ")
            ;;
    esac
    echo ""
    echo ">> Lanzando ($engine): ${cmd[*]}  (directorio: $dir)"
    (cd "$dir" && nohup "${cmd[@]}" >/dev/null 2>&1 &)
    echo ">> Abierto en su propia ventana. Vuelve aquí cuando quieras."
    sleep 2
}

# ---------- principal ----------
echo ""
echo "========== RPG MAKER LAUNCHER =========="

extract_zips

GAMES=()
NAMES=()
for top in "$GAMES_DIR"/*/; do
    [ -d "$top" ] || continue
    det="$(detect_engine "${top%/}")"
    if [ -z "$det" ]; then
        if [ -n "$(first_find "${top%/}" "System.json")" ] || [ -n "$(first_find "${top%/}" "Map001.json")" ]; then
            echo "!! $(basename "$top"): parece RPG Maker (MZ/MV) pero su descarga está INCOMPLETA"
            echo "   (falta la carpeta js/ e index.html). No se puede lanzar."
        elif [ -d "$(find "$top" -maxdepth "$MAX_DEPTH" -type d -name renpy 2>/dev/null | head -n1)" ]; then
            echo "!! $(basename "$top"): juego Ren'Py sin la parte Linux (falta lib/linux-x86_64)."
        fi
        continue
    fi
    root="${det%%|*}"
    engine="${det#*|}"
    case "$engine" in
        MZ) label="MZ (web)";;
        MV) label="MV (web)";;
        web) label="Web (MV/MZ)";;
        2000-2003) label="RPG Maker 2000/2003";;
        renpy) label="Ren'Py (Linux)";;
        VXAce) label="VX Ace";;
        VX) label="VX";;
        XP) label="XP";;
    esac
    GAMES+=("$root|$engine")
    NAMES+=("$(basename "$top")  [$label]")
done

if [ "${#GAMES[@]}" -eq 0 ]; then
    echo "No se encontraron juegos en: $GAMES_DIR"
    echo "Coloca los .zip de tus juegos de RPG Maker junto a este script y vuelve a ejecutarlo."
    exit 1
fi

echo ""
echo "Juegos disponibles:"
PS3="Elige un número (o $((${#GAMES[@]} + 1)) para salir): "
select name in "${NAMES[@]}" "Salir"; do
    case "$name" in
        "Salir")
            echo "¡Hasta luego!"
            exit 0
            ;;
        "")
            echo "Opción inválida."
            ;;
        *)
            idx=$((REPLY - 1))
            root="${GAMES[$idx]%%|*}"
            engine="${GAMES[$idx]#*|}"
            case "$engine" in
                MZ|MV|web)
                    if [ -f "$WEBVIEW" ]; then
                        echo ""
                        echo "¿Cómo abrir '$(basename "$root")'?"
                        select v in "Navegador (Chrome)" "Visor WebKit ligero" "Cancelar"; do
                            case "$v" in
                                "Visor WebKit ligero") launch_web "$root" webkit; break ;;
                                "Cancelar") echo "Cancelado."; break ;;
                                "Navegador (Chrome)") launch_web "$root" browser; break ;;
                                *) echo "Opción inválida." ;;
                            esac
                        done
                    else
                        launch_web "$root" browser
                    fi
                    ;;
                *)         launch_native "$root" "$engine" ;;
            esac
            break
            ;;
    esac
done