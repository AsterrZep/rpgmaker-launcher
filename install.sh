#!/usr/bin/env bash
#
# RPG Maker Launcher - instalación de dependencias y runtimes
#
# Instala:
#   1. Dependencias del sistema (python3-tk, unzip, SDL, herramientas de build)
#   2. EasyRPG Player        (RPG Maker 2000 / 2003)
#   3. mkxp-z compilado      (RPG Maker XP / VX / VX Ace)
#   4. Acceso directo de la app en el escritorio Linux / Chrome OS
#
# Uso:  ./install.sh
#

set -euo pipefail

BASEDIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNTIMES="$BASEDIR/runtimes"
WORKDIR="${RPGMAKER_BUILD_DIR:-/tmp/rpgmaker-build}"
OBS_BASE="https://download.opensuse.org/repositories/home:/easyrpg/Debian_13/amd64"
EASYRPG_VER="0.8.1.1-3+14.3"
LIBLCF_VER="0.8.1-3+14.3"
JOBS="$(nproc)"

c_log()  { printf '\033[1;34m[install]\033[0m EN: %s\n\033[1;34m[install]\033[0m ES: %s\n' "$1" "$2"; }
c_ok()   { printf '\033[1;32m[ok]     \033[0m EN: %s\n\033[1;32m[ok]     \033[0m ES: %s\n' "$1" "$2"; }
c_warn() { printf '\033[1;33m[warn]   \033[0m EN: %s\n\033[1;33m[aviso]  \033[0m ES: %s\n' "$1" "$2"; }
c_err()  { printf '\033[1;31m[error]  \033[0m EN: %s\n\033[1;31m[error]  \033[0m ES: %s\n' "$1" "$2"; }

need_sudo() {
  if [ "$(id -u)" -eq 0 ]; then
    SUDO=""
  elif command -v sudo >/dev/null 2>&1; then
    SUDO="sudo"
  else
    c_err "You need root privileges. Run with sudo or from a sudo-enabled account." \
          "Necesitas privilegios de root. Ejecuta con sudo o desde una cuenta con sudo."
    exit 1
  fi
}

die() { c_err "$1" "$2"; exit 1; }

# ---------------------------------------------------------------- requisitos
need_sudo
[ -x "$(command -v apt-get)" ] || die "Only Debian/Ubuntu systems (apt) are supported." \
                                      "Solo se soportan sistemas Debian/Ubuntu (apt)."

# ----------------------------------------------------- dependencias del sistema
c_log "Installing system dependencies (apt)..." \
      "Instalando dependencias del sistema (apt)..."
$SUDO apt-get update -qq
$SUDO apt-get install -y --no-install-recommends \
  python3-tk python3-pil unzip ca-certificates wget curl git \
  python3-gi gir1.2-webkit2-4.1 \
  build-essential cmake pkg-config ninja-build meson \
  ruby-dev \
  libsdl2-dev libsdl2-image-dev libsdl2-ttf-dev libsdl2-mixer-dev \
  libopenal-dev libphysfs-dev libgl1-mesa-dev libfluidsynth-dev \
  libpng-dev zlib1g-dev libtheora-dev libvorbis-dev libogg-dev \
  libfreetype-dev libpixman-1-dev libuchardet-dev libbz2-dev \
  libmp3lame-dev libmpg123-dev libjack-jackd2-dev libsndfile1-dev
c_ok "System dependencies installed." \
     "Dependencias del sistema instaladas."

# ------------------------------------------------------------- EasyRPG Player
if command -v easyrpg-player >/dev/null 2>&1; then
  c_ok "easyrpg-player is already installed ($(easyrpg-player --version 2>/dev/null | head -1 || echo '?'))." \
       "easyrpg-player ya está instalado ($(easyrpg-player --version 2>/dev/null | head -1 || echo '?'))."
else
  c_log "Installing EasyRPG Player (2000/2003)..." \
        "Instalando EasyRPG Player (2000/2003)..."
  mkdir -p "$WORKDIR"
  wget -q -O "$WORKDIR/liblcf0.deb"  "$OBS_BASE/liblcf0_${LIBLCF_VER}_amd64.deb"
  wget -q -O "$WORKDIR/easyrpg.deb"  "$OBS_BASE/easyrpg-player_${EASYRPG_VER}_amd64.deb"
  $SUDO apt-get install -y --no-install-recommends "$WORKDIR/liblcf0.deb" "$WORKDIR/easyrpg.deb"
  c_ok "easyrpg-player installed (${EASYRPG_VER})." \
       "easyrpg-player instalado (${EASYRPG_VER})."
fi

# ------------------------------------------------------------------ mkxp-z
if [ -x "$RUNTIMES/mkxp-z" ]; then
  c_ok "mkxp-z already built at $RUNTIMES/mkxp-z." \
       "mkxp-z ya compilado en $RUNTIMES/mkxp-z."
else
  c_log "Building mkxp-z (XP/VX/VX Ace). This can take several minutes..." \
        "Compilando mkxp-z (XP/VX/VX Ace). Esto puede tardar varios minutos..."
  [ "$(uname -m)" = "x86_64" ] || c_warn "mkxp-z has only been tested on x86_64." \
                                         "mkxp-z solo se ha probado en x86_64."

  mkdir -p "$WORKDIR" "$RUNTIMES"
  cd "$WORKDIR"

  # --- SDL_sound (mkxp-z compatible fork, shared library)
  if [ ! -d SDL_sound/.git ]; then
    git clone --quiet https://github.com/icculus/SDL_sound.git SDL_sound
  fi
  cd SDL_sound
  cmake -S . -B build -DSDLSOUND_BUILD_SHARED=TRUE -DSDLSOUND_BUILD_STATIC=FALSE >/dev/null
  cmake --build build -j"$JOBS" >/dev/null
  $SUDO cmake --install build >/dev/null
  cd "$WORKDIR"
  c_ok "SDL_sound built." \
       "SDL_sound construido."

  # --- SDL2_ttf (mkxp-z fork)
  if [ ! -d sdl2_ttf/.git ]; then
    git clone --quiet -b mkxp-z https://github.com/mkxp-z/sdl_ttf.git sdl2_ttf
  fi
  cd sdl2_ttf
  cmake -S . -B build >/dev/null
  cmake --build build -j"$JOBS" >/dev/null
  $SUDO cmake --install build >/dev/null
  # the fork header must be used instead of the system one
  if [ -f SDL_ttf.h ]; then
    $SUDO cp -f SDL_ttf.h /usr/include/SDL2/SDL_ttf.h
  fi
  cd "$WORKDIR"
  c_ok "SDL2_ttf (mkxp-z fork) built." \
       "SDL2_ttf (fork mkxp-z) construido."

  # --- libiconv/libcharset: glibc provides them inside libc.so.6
  if [ ! -e /usr/local/lib/libiconv.so ]; then
    $SUDO ln -sf /lib/x86_64-linux-gnu/libc.so.6 /usr/local/lib/libiconv.so
    $SUDO ln -sf /lib/x86_64-linux-gnu/libc.so.6 /usr/local/lib/libcharset.so
    c_ok "libiconv/libcharset symlinks created." \
         "Symlinks de libiconv/libcharset creados."
  fi

  # --- pkg-config override of Theora (adds -ltheoradec -ltheoraenc)
  mkdir -p /usr/local/lib/pkgconfig
  if ! grep -q "theoradec" /usr/local/lib/pkgconfig/theora.pc 2>/dev/null; then
    $SUDO tee /usr/local/lib/pkgconfig/theora.pc >/dev/null <<'EOF'
prefix=/usr
exec_prefix=${prefix}
libdir=/usr/lib/x86_64-linux-gnu
includedir=${prefix}/include

Name: theora
Description: Theora video codec
Version: 1.1.1
Libs: -L${libdir} -ltheora -ltheoradec -ltheoraenc
Cflags: -I${includedir}
EOF
    c_ok "Theora pkg-config override installed." \
         "Override pkg-config de Theora instalado."
  fi

  # --- Debian's libphysfs.a may arrive without a symbol index
  if [ -f /usr/lib/x86_64-linux-gnu/libphysfs.a ]; then
    $SUDO ranlib /usr/lib/x86_64-linux-gnu/libphysfs.a
  fi

  # --- mkxp-z
  if [ ! -d mkxp-z/.git ]; then
    git clone --quiet https://github.com/mkxp-z/mkxp-z.git mkxp-z
  fi
  # Parche: no vaciar el $LOAD_PATH de Ruby (sin esto falla require 'zlib'
  # con el Ruby del sistema; el zlib.so vive en /usr/lib/<multiarch>/ruby).
  if ! grep -q "defaultLpaths" mkxp-z/binding/binding-mri.cpp; then
    python3 - mkxp-z/binding/binding-mri.cpp <<'PYEOF'
import sys
p = sys.argv[1]
src = open(p).read()
old = "    rb_ary_clear(lpaths);"
new = """    /* Snapshot the default (system) load paths before clearing: distro
     * rubies keep extensions like zlib.so in multiarch dirs that must
     * stay reachable. */
    VALUE defaultLpaths = rb_ary_dup(lpaths);
    rb_ary_clear(lpaths);"""
assert old in src, "ancla del parche no encontrada"
src = src.replace(old, new, 1)
old2 = """#ifndef WORKDIR_CURRENT
    else {
        rb_ary_push(lpaths, rb_utf8_str_new_cstr(mkxp_fs::getCurrentDirectory().c_str()));
    }
#endif"""
new2 = old2 + """

    /* Restore the default system paths (lowest priority). */
    rb_ary_concat(lpaths, defaultLpaths);"""
assert old2 in src, "ancla 2 del parche no encontrada"
src = src.replace(old2, new2, 1)
open(p, "w").write(src)
print("parche loadpath aplicado")
PYEOF
  fi
  # Parche 2: coerción de booleanos estilo RGSS oficial (RTEST). La
  # comprobación estricta rompe scripts habituales (MOG_Anti_Lag, etc.)
  # al asignar valores no-bool a propiedades como visible=.
  if ! grep -q "RGSS-compatible" mkxp-z/binding/binding-util.h; then
    python3 - mkxp-z/binding/binding-util.h <<'PYEOF'
import sys
p = sys.argv[1]
src = open(p).read()
old = """        default:
            throw Exception(Exception::TypeError, "Argument %d: Expected bool", argPos);"""
new = """        default:
            /* Official RGSS coerced any value via RTEST; strict type
             * checking breaks common scripts (MOG_Anti_Lag etc.). */
            *out = RTEST(arg);
            break;"""
assert old in src, "ancla del parche bool no encontrada"
src = src.replace(old, new, 1)
open(p, "w").write(src)
print("parche bool RGSS aplicado")
PYEOF
  fi
  cd mkxp-z
  MRI_VER="$(ruby -e 'print RUBY_VERSION' | cut -d. -f1-2)"
  c_log "Detected MRI ${MRI_VER} (uses the matching mruby version)." \
        "Detectada MRI ${MRI_VER} (usa la versión de mruby correspondiente)."
  meson setup build -Dmri_version="$MRI_VER" -Dstatic_executable=false -Dworkdir_current=true >/dev/null
  ninja -C build >/dev/null
  cp build/mkxp-z.x86_64 "$RUNTIMES/mkxp-z"
  cd "$BASEDIR"
  c_ok "mkxp-z compiled and copied to $RUNTIMES/mkxp-z." \
       "mkxp-z compilado y copiado a $RUNTIMES/mkxp-z."
fi

# ------------------------------------------------------ acceso directo de la app
c_log "Generating the app shortcut..." \
      "Generando acceso directo..."
mkdir -p "$HOME/.local/share/applications"
sed "s|__BASEDIR__|$BASEDIR|g" "$RUNTIMES/rpgmaker-launcher.desktop" \
  > "$HOME/.local/share/applications/rpgmaker-launcher.desktop"
if command -v desktop-file-validate >/dev/null 2>&1; then
  desktop-file-validate "$HOME/.local/share/applications/rpgmaker-launcher.desktop" || true
fi
c_ok "Shortcut created: RPG Maker Launcher." \
     "Acceso directo creado: RPG Maker Launcher."

# ---------------------------------------------------------------------- fin
cat <<EOF

------------------------------------------------------------------
  RPG Maker Launcher installed. / RPG Maker Launcher instalado.

  EN:
  - Add your games as .zip (or folders) inside:
        $HOME/Games
  - Open the "RPG Maker Launcher" app from your Linux desktop's
    application menu.
  - From the terminal:
        rpgmaker-launcher
  - Web games (MZ/MV) open in the lightweight WebKit viewer
    (uses less memory than a full browser).
  - On Chrome OS the shortcut appears in chrome://apps
    (if it does not, restart the Linux container or log out/in).

  ES:
  - Añade tus juegos como .zip (o carpetas) dentro de:
        $HOME/Games
  - Abre la app "RPG Maker Launcher" desde el menú de aplicaciones
    de tu escritorio Linux.
  - Desde terminal:
        rpgmaker-launcher
  - Los juegos web (MZ/MV) usan el visor WebKit ligero,
    que consume menos memoria.
  - En Chrome OS, el acceso directo aparece en chrome://apps
    (si no sale, reinicia el contenedor Linux o cierra sesión).

  Remember / Recuerda: this launcher does NOT include games. Put only
  games you legally own and respect each author's license.
------------------------------------------------------------------
EOF