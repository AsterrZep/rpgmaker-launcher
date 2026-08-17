#!/usr/bin/env bash
#
# RPG Maker Launcher - instalación de dependencias y runtimes
#
# Instala:
#   1. Dependencias del sistema (python3-tk, unzip, SDL, herramientas de build)
#   2. EasyRPG Player        (RPG Maker 2000 / 2003)
#   3. mkxp-z compilado      (RPG Maker XP / VX / VX Ace)
#   4. Acceso directo de la app en Chrome OS / escritorio Linux
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

c_log()  { printf '\033[1;34m[install]\033[0m %s\n' "$*"; }
c_ok()   { printf '\033[1;32m[ok]     \033[0m %s\n' "$*"; }
c_warn() { printf '\033[1;33m[aviso]  \033[0m %s\n' "$*"; }
c_err()  { printf '\033[1;31m[error]  \033[0m %s\n' "$*"; }

need_sudo() {
  if [ "$(id -u)" -eq 0 ]; then
    SUDO=""
  elif command -v sudo >/dev/null 2>&1; then
    SUDO="sudo"
  else
    c_err "Necesitas privilegios de root. Ejecuta con sudo o desde una cuenta con sudo."
    exit 1
  fi
}

die() { c_err "$1"; exit 1; }

# ---------------------------------------------------------------- requisitos
need_sudo
[ -x "$(command -v apt-get)" ] || die "Solo se soportan sistemas Debian/Ubuntu (apt)."

# ----------------------------------------------------- dependencias del sistema
c_log "Instalando dependencias del sistema (apt)..."
$SUDO apt-get update -qq
$SUDO apt-get install -y --no-install-recommends \
  python3-tk unzip ca-certificates wget curl git \
  build-essential cmake pkg-config ninja-build meson \
  ruby-dev \
  libsdl2-dev libsdl2-image-dev libsdl2-ttf-dev libsdl2-mixer-dev \
  libopenal-dev libphysfs-dev libgl1-mesa-dev libfluidsynth-dev \
  libpng-dev zlib1g-dev libtheora-dev libvorbis-dev libogg-dev \
  libfreetype-dev libpixman-1-dev libuchardet-dev libbz2-dev \
  libmp3lame-dev libmpg123-dev libjack-jackd2-dev libsndfile1-dev
c_ok "Dependencias del sistema instaladas."

# ------------------------------------------------------------- EasyRPG Player
if command -v easyrpg-player >/dev/null 2>&1; then
  c_ok "easyrpg-player ya está instalado ($(easyrpg-player --version 2>/dev/null | head -1 || echo '?'))."
else
  c_log "Instalando EasyRPG Player (2000/2003)..."
  mkdir -p "$WORKDIR"
  wget -q -O "$WORKDIR/liblcf0.deb"  "$OBS_BASE/liblcf0_${LIBLCF_VER}_amd64.deb"
  wget -q -O "$WORKDIR/easyrpg.deb"  "$OBS_BASE/easyrpg-player_${EASYRPG_VER}_amd64.deb"
  $SUDO apt-get install -y --no-install-recommends "$WORKDIR/liblcf0.deb" "$WORKDIR/easyrpg.deb"
  c_ok "easyrpg-player instalado (${EASYRPG_VER})."
fi

# ------------------------------------------------------------------ mkxp-z
if [ -x "$RUNTIMES/mkxp-z" ]; then
  c_ok "mkxp-z ya compilado en $RUNTIMES/mkxp-z."
else
  c_log "Compilando mkxp-z (XP/VX/VX Ace). Esto puede tardar varios minutos..."
  [ "$(uname -m)" = "x86_64" ] || c_warn "mkxp-z solo se ha probado en x86_64."

  mkdir -p "$WORKDIR" "$RUNTIMES"
  cd "$WORKDIR"

  # --- SDL_sound (fork compatible con mkxp-z, librería compartida)
  if [ ! -d SDL_sound/.git ]; then
    git clone --quiet https://github.com/icculus/SDL_sound.git SDL_sound
  fi
  cd SDL_sound
  cmake -S . -B build -DSDLSOUND_BUILD_SHARED=TRUE -DSDLSOUND_BUILD_STATIC=FALSE >/dev/null
  cmake --build build -j"$JOBS" >/dev/null
  $SUDO cmake --install build >/dev/null
  cd "$WORKDIR"
  c_ok "SDL_sound construido."

  # --- SDL2_ttf (fork de mkxp-z)
  if [ ! -d sdl2_ttf/.git ]; then
    git clone --quiet -b mkxp-z https://github.com/mkxp-z/sdl_ttf.git sdl2_ttf
  fi
  cd sdl2_ttf
  cmake -S . -B build >/dev/null
  cmake --build build -j"$JOBS" >/dev/null
  $SUDO cmake --install build >/dev/null
  # la cabecera del fork debe usarse en lugar de la del sistema
  if [ -f SDL_ttf.h ]; then
    $SUDO cp -f SDL_ttf.h /usr/include/SDL2/SDL_ttf.h
  fi
  cd "$WORKDIR"
  c_ok "SDL2_ttf (fork mkxp-z) construido."

  # --- libiconv/libcharset: glibc los proporciona dentro de libc.so.6
  if [ ! -e /usr/local/lib/libiconv.so ]; then
    $SUDO ln -sf /lib/x86_64-linux-gnu/libc.so.6 /usr/local/lib/libiconv.so
    $SUDO ln -sf /lib/x86_64-linux-gnu/libc.so.6 /usr/local/lib/libcharset.so
    c_ok "Symlinks de libiconv/libcharset creados."
  fi

  # --- pkg-config override de Theora (añade -ltheoradec -ltheoraenc)
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
    c_ok "Override pkg-config de Theora instalado."
  fi

  # --- libphysfs.a de Debian puede llegar sin índice de símbolos
  if [ -f /usr/lib/x86_64-linux-gnu/libphysfs.a ]; then
    $SUDO ranlib /usr/lib/x86_64-linux-gnu/libphysfs.a
  fi

  # --- mkxp-z
  if [ ! -d mkxp-z/.git ]; then
    git clone --quiet https://github.com/mkxp-z/mkxp-z.git mkxp-z
  fi
  cd mkxp-z
  MRI_VER="$(ruby -e 'print RUBY_VERSION' | cut -d. -f1-2)"
  c_log "Detectada MRI ${MRI_VER} (usa la versión de mruby correspondiente)."
  meson setup build -Dmri_version="$MRI_VER" -Dstatic_executable=false >/dev/null
  ninja -C build >/dev/null
  cp build/mkxp-z.x86_64 "$RUNTIMES/mkxp-z"
  cd "$BASEDIR"
  c_ok "mkxp-z compilado y copiado a $RUNTIMES/mkxp-z."
fi

# ------------------------------------------------------ acceso directo de la app
c_log "Generando acceso directo..."
chmod +x "$BASEDIR/rpgmaker-launcher.sh" "$BASEDIR/rpgmaker-launcher-gui.py"
mkdir -p "$HOME/.local/share/applications"
sed "s|__BASEDIR__|$BASEDIR|g" "$RUNTIMES/rpgmaker-launcher.desktop" \
  > "$HOME/.local/share/applications/rpgmaker-launcher.desktop"
if command -v desktop-file-validate >/dev/null 2>&1; then
  desktop-file-validate "$HOME/.local/share/applications/rpgmaker-launcher.desktop" || true
fi
c_ok "Acceso directo creado: RPG Maker Launcher."

# ---------------------------------------------------------------------- fin
cat <<EOF

------------------------------------------------------------------
  RPG Maker Launcher instalado.

  - Añade tus juegos como .zip (o carpetas) dentro de:
        $BASEDIR
  - Abre la app "RPG Maker Launcher" desde las apps de Linux
    (en Chrome OS puede hacer falta cerrar sesión o reiniciar el
    contenedor Linux para que aparezca).
  - Desde terminal:
        $BASEDIR/rpgmaker-launcher.sh
  - En Chrome OS, las aplicaciones .desktop aparecen en:
        chrome://apps

  Recuerda: este lanzador NO incluye juegos. Pon solo juegos
  que tengas legalmente y respeta las licencias de cada autor.
------------------------------------------------------------------
EOF