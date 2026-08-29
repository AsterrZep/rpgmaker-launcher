#!/usr/bin/env python3
# ============================================================
#  RPG Maker Launcher - Descifrador de Juegos RPG Maker
# ============================================================
# Integra RPGMakerDecrypter (https://github.com/uuksu/RPGMakerDecrypter):
# descifra archivos cifrados de XP/VX/VX Ace (Game.rgssad, Game.rgss2a,
# Game.rgss3a) y de MV/MZ (imágenes/audio .rpgmvp/.rpgmvo/.rpgmvm).
#
# El binario se descarga una sola vez desde los releases oficiales y se
# guarda en runtimes/. Es un programa de terceros: se ejecuta tal cual.
# ============================================================
import os
import platform
import shutil
import subprocess
import sys
import urllib.request

from .utils import BASE_DIR, RUN_DIR, log

# Configuración del descifrador
BIN = os.path.join(RUN_DIR, "RPGMakerDecrypter-cli")
VERSION = "v3.0.4"
URL = (
    "https://github.com/uuksu/RPGMakerDecrypter/releases/download/%s/"
    "RPGMakerDecrypter-cli" % VERSION
)

RGSS_EXT = (".rgssad", ".rgss2a", ".rgss3a")

# Extensiones de assets cifrados MV/MZ
MV_MZ_ENCRYPTED_EXTENSIONS = {
    "rpgmvp": "png",
    "rpgmvm": "m4a",
    "rpgmvo": "ogg",
    "png_": "png",
    "m4a_": "m4a",
    "ogg_": "ogg",
}

# Firma de cabecera de RPG Maker MV/MZ (16 bytes)
RPG_MV_HEADER = b"RPGMV\x00\x00\x00\x00\x03\x01\x00\x00\x00\x00\x00"


def die(msg):
    """Imprime error y termina con código de error."""
    print("ERROR: %s" % msg, file=sys.stderr)
    sys.exit(1)


def have_arch(root):
    """Busca archivos RGSS encriptados en el directorio."""
    for dirpath, _, files in os.walk(root):
        for f in files:
            if f.lower().endswith(RGSS_EXT):
                return os.path.join(dirpath, f)
    return None


def ensure_binary():
    """Descarga el binario del descifrador si no existe."""
    if os.path.isfile(BIN) and os.access(BIN, os.X_OK):
        return
    
    log("Descargando RPGMakerDecrypter %s (una sola vez)..." % VERSION)
    os.makedirs(RUN_DIR, exist_ok=True)
    tmp = BIN + ".tmp"
    
    try:
        req = urllib.request.Request(URL, headers={"User-Agent": "rpgmaker-launcher"})
        with urllib.request.urlopen(req, timeout=120) as r, open(tmp, "wb") as fh:
            shutil.copyfileobj(r, fh)
        os.chmod(tmp, 0o755)
        os.replace(tmp, BIN)
    except Exception as e:
        try:
            os.remove(tmp)
        except OSError:
            pass
        die("No se pudo descargar el descifrador: %s\n%s" % (e, URL))
    
    log("Binario listo: %s" % BIN)


def find_target(arg):
    """Determina el objetivo a descifrar (archivo o directorio)."""
    if os.path.isdir(arg):
        arch = have_arch(arg)
        if arch:
            return arch
        # MV/MZ: la carpeta entera es la entrada
        return arg
    if os.path.isfile(arg):
        return arg
    die("No existe: %s" % arg)


def decrypt_rgss(target, output=None, recreate=False, overwrite=False):
    """Descifra archivos RGSS (XP/VX/VX Ace) usando el binario externo."""
    ensure_binary()
    
    cmd = [BIN]
    if target.lower().endswith(RGSS_EXT):
        cmd.append(target)
    else:
        cmd.append(target)
    
    if recreate:
        cmd.append("--reconstruct-project")
    if overwrite:
        cmd.append("--overwrite")
    
    out = output or (
        os.path.splitext(target)[0] if target.lower().endswith(RGSS_EXT)
        else target.rstrip(os.sep)
    ) + "_descifrado"
    cmd.append("--output=%s" % out)
    
    log("Descifrando: %s" % target)
    log("Salida:      %s" % out)
    
    try:
        r = subprocess.run(cmd)
    except OSError as e:
        die("No se pudo ejecutar %s: %s" % (BIN, e))
    
    if r.returncode == 0:
        log("¡Listo! Archivos descifrados en: %s" % out)
    else:
        log("El descifrador terminó con código %d. Revisa el mensaje anterior." % r.returncode)
    
    return r.returncode, out


def decrypt_mv_mz_asset(data, key):
    """Descifra un asset individual de RPG Maker MV/MZ.
    
    Args:
        data: Datos del archivo encriptado (bytes)
        key: Clave de encriptación en hexadecimal (string)
    
    Returns:
        tuple: (datos descifrados, extensión destino)
    
    Raises:
        ValueError: Si el archivo no tiene cabecera válida o la clave es inválida
    """
    if len(data) < 16:
        raise ValueError("Archivo demasiado pequeño")
    
    # Verificar la firma de cabecera
    if data[:16] != RPG_MV_HEADER:
        raise ValueError("Cabecera RPG Maker no detectada")
    
    # Decodificar la clave hexadecimal
    try:
        key_bytes = bytes.fromhex(key)
    except ValueError:
        raise ValueError("Clave hex inválida")
    
    # Remover la cabecera de 16 bytes
    body = bytearray(data[16:])
    
    # Aplicar máscara XOR con la clave en los primeros 16 bytes del cuerpo
    for i in range(min(16, len(body))):
        body[i] ^= key_bytes[i % len(key_bytes)]
    
    return bytes(body)


def scan_encrypted_files(directory):
    """Escanea un directorio buscando archivos encriptados de MV/MZ.
    
    Args:
        directory: Directorio a escanear
    
    Returns:
        list: Lista de tuplas (ruta_original, extensión_destino)
    """
    encrypted = []
    for root, dirs, files in os.walk(directory):
        for f in files:
            ext = f.lower().rsplit(".", 1)[-1] if "." in f else ""
            if ext in MV_MZ_ENCRYPTED_EXTENSIONS:
                src = os.path.join(root, f)
                dst_ext = MV_MZ_ENCRYPTED_EXTENSIONS[ext]
                encrypted.append((src, dst_ext))
    return encrypted


def decrypt_directory(directory, key, output_dir=None):
    """Descifra todos los assets encriptados de un directorio.
    
    Args:
        directory: Directorio raíz del juego
        key: Clave de encriptación en hexadecimal
        output_dir: Directorio de salida (opcional, por defecto es el mismo)
    
    Returns:
        tuple: (éxito, fallos, lista de archivos descifrados)
    """
    encrypted_files = scan_encrypted_files(directory)
    if not encrypted_files:
        return 0, 0, []
    
    success = 0
    failed = 0
    decrypted_files = []
    
    for src_path, dst_ext in encrypted_files:
        try:
            with open(src_path, "rb") as fh:
                data = fh.read()
            
            decrypted_data = decrypt_mv_mz_asset(data, key)
            
            # Determinar ruta de salida
            if output_dir:
                rel_path = os.path.relpath(src_path, directory)
                dst_path = os.path.join(output_dir, os.path.splitext(rel_path)[0] + "." + dst_ext)
                os.makedirs(os.path.dirname(dst_path), exist_ok=True)
            else:
                dst_path = os.path.splitext(src_path)[0] + "." + dst_ext
            
            with open(dst_path, "wb") as fh:
                fh.write(decrypted_data)
            
            # Eliminar archivo encriptado original si fue transformado
            if dst_path != src_path and os.path.splitext(src_path)[1] != "." + dst_ext:
                try:
                    os.remove(src_path)
                except OSError:
                    pass
            
            decrypted_files.append(dst_path)
            success += 1
            
        except Exception as e:
            log("Error descifrando %s: %s" % (src_path, e))
            failed += 1
    
    return success, failed, decrypted_files


# ---------- CLI ----------
if __name__ == "__main__":
    import argparse
    
    ap = argparse.ArgumentParser(description="Descifra archivos cifrados de juegos RPG Maker")
    ap.add_argument("juego", nargs="?", help="carpeta del juego o archivo .rgss3a/.rgss2a/.rgssad")
    ap.add_argument("--output", "-o", help="carpeta de salida")
    ap.add_argument("--recreate", action="store_true",
                    help="intentar reconstruir la estructura original del proyecto")
    ap.add_argument("--overwrite", action="store_true",
                    help="sobrescribir archivos de destino existentes")
    ap.add_argument("--download-only", action="store_true")
    args = ap.parse_args()

    ensure_binary()

    if args.download_only:
        print("RPGMakerDecrypter disponible en %s" % BIN)
        sys.exit(0)

    if not args.juego:
        ap.print_help()
        sys.exit(1)

    machine = platform.machine().lower()
    if machine not in ("x86_64", "amd64"):
        print("Aviso: binario pensado para x86_64; tu máquina es '%s' (puede no funcionar)." % machine)

    target = find_target(args.juego)
    code, out = decrypt_rgss(target, args.output, args.recreate, args.overwrite)
    sys.exit(code)
