#!/usr/bin/env python3
# ============================================================
#  RPG Maker Launcher - Gestor de Plugins
# ============================================================
# Permite ver qué plugins usa un juego, detectar los que pueden
# dar problemas en el visor WebKit (usan APIs de nw.js) y
# activarlos/desactivarlos para mejorar rendimiento o arranque.
# ============================================================
import json
import os
import re
import shutil

from .utils import log

# Patrones de API que solo existen en la versión de escritorio (nw.js)
NW_TOKENS = [
    (r"require\s*\(", "require()"),
    (r"\bprocess\.", "process."),
    (r"\bnw\.", "nw."),
    (r"child_process", "child_process"),
    (r"\bfs\.", "fs."),
    (r"\bpath\.", "path."),
]

# Si el plugin contiene alguno de estos, el uso de nw.js suele estar
# protegido y no rompe el juego en el navegador
GUARDS = [
    "Utils.isNwjs",
    "isNwjs",
    "typeof require",
    "typeof nw",
    "require.main",
    "window.require",
    "nw&&",
    "nw &&",
    "process&&",
    "process &&",
]


def find_plugins_js(root):
    """Busca el archivo plugins.js en el directorio del juego."""
    if os.path.isfile(os.path.join(root, "js", "plugins.js")):
        return os.path.join(root, "js", "plugins.js")
    
    for dirpath, dirnames, filenames in os.walk(root):
        if dirpath.count(os.sep) - root.count(os.sep) > 3:
            del dirnames[:]
            continue
        if "plugins.js" in filenames and dirpath.endswith("js"):
            return os.path.join(dirpath, "plugins.js")
    return None


def _convert_single_quotes(raw):
    """Convierte cadenas con comillas simples a cadenas JSON de dobles
    comillas, respetando escapes y sin tocar lo que está dentro de
    cadenas ya delimitadas por dobles comillas.
    """
    out, i, n = [], 0, len(raw)
    in_dq = False
    
    while i < n:
        c = raw[i]
        if in_dq:
            out.append(c)
            if c == "\\" and i + 1 < n:
                out.append(raw[i + 1])
                i += 2
                continue
            if c == '"':
                in_dq = False
            i += 1
            continue
        if c == '"':
            in_dq = True
            out.append(c)
            i += 1
            continue
        if c == "'":
            buf, j = [], i + 1
            while j < n:
                if raw[j] == "\\" and j + 1 < n:
                    buf.append(raw[j])
                    buf.append(raw[j + 1])
                    j += 2
                    continue
                if raw[j] == "'":
                    break
                buf.append(raw[j])
                j += 1
            if j < n:
                out.append(json.dumps("".join(buf)))
                i = j + 1
                continue
            out.append(c)
            i += 1
            continue
        out.append(c)
        i += 1
    
    return "".join(out)


def _normalize(raw):
    """Normaliza plugins.js (JS) a JSON válido."""
    raw = _convert_single_quotes(raw)                 # 1) comillas simples
    raw = re.sub(r",\s*([}\]])", r"\1", raw)           # 2) comas finales (MV)
    # 3) claves sin comillas -> con comillas (soporta unicode/japonés)
    return re.sub(
        r"([,{]\s*)([^\s\"'`:{}\[\],]+)\s*:",
        lambda m: m.group(1) + json.dumps(m.group(2)) + ":",
        raw
    )


def _strip_comments(src):
    """Elimina comentarios JS (aproximado)."""
    src = re.sub(r"/\*.*?\*/", " ", src, flags=re.S)
    return re.sub(r"//[^\n]*", " ", src)


def load_plugins(root):
    """Carga los plugins de un juego desde plugins.js.
    
    Returns:
        tuple: (ruta_archivo, contenido_raw, lista_plugins)
    
    Raises:
        SystemExit: Si no se encuentra o no se puede parsear plugins.js
    """
    path = find_plugins_js(root)
    if not path:
        raise SystemExit("No se encontró js/plugins.js en: " + root)
    
    raw = open(path, encoding="utf-8-sig").read()
    m = re.search(r"\[.*\]", raw, re.S)
    if not m:
        raise SystemExit("No se pudo interpretar js/plugins.js (formato raro).")
    
    try:
        plugins = json.loads(_normalize(m.group(0)))
    except ValueError as e:
        raise SystemExit("Error al interpretar plugins.js: %s" % e)
    
    return path, raw, plugins


def save_plugins(path, raw, plugins):
    """Guarda los plugins modificados en plugins.js.
    
    Crea una copia de seguridad (plugins.js.bak) en la primera modificación.
    """
    if not os.path.exists(path + ".bak"):
        shutil.copy2(path, path + ".bak")
    
    m = re.search(r"\[.*\]", raw, re.S)
    new = raw[:m.start()] + json.dumps(plugins, ensure_ascii=False) + raw[m.end():]
    open(path, "w", encoding="utf-8").write(new)


def analyze(name, root):
    """Analiza un plugin para detectar compatibilidad con WebKit.
    
    Returns:
        dict: {"categoria": "ok"|"nw-protegido"|"roto"|"sin-fichero", 
               "motivos": [...]}
    """
    f = os.path.join(root, "js", "plugins", name + ".js")
    if not os.path.isfile(f):
        return {
            "categoria": "sin-fichero",
            "motivos": ["no existe plugins/%s.js" % name]
        }
    
    src = _strip_comments(open(f, encoding="utf-8", errors="ignore").read())
    tokens = [label for pat, label in NW_TOKENS if re.search(pat, src)]
    
    if not tokens:
        return {"categoria": "ok", "motivos": []}
    
    guarded = any(g in src for g in GUARDS)
    if guarded:
        return {"categoria": "nw-protegido", "motivos": tokens}
    
    return {"categoria": "roto", "motivos": tokens}


def get_plugins_status(root):
    """Obtiene el estado completo de los plugins de un juego.
    
    Returns:
        tuple: (ruta_plugins, plugins_analizados, tiene_backup)
    """
    path, raw, plugins = load_plugins(root)
    analyzed = []
    
    for p in plugins:
        pname = p.get("name", "")
        analysis = analyze(pname, root)
        analyzed.append({
            "name": pname,
            "status": bool(p.get("status", False)),
            "description": p.get("description", ""),
            "category": analysis.get("categoria", "ok"),
            "motivos": analysis.get("motivos", []),
        })
    
    has_bak = os.path.isfile(path + ".bak") if path else False
    return path, analyzed, has_bak


def toggle_plugin(root, names, status=True, all_plugins=False):
    """Activa o desactiva plugins específicos o todos.
    
    Args:
        root: Directorio raíz del juego
        names: Lista de nombres de plugins a modificar
        status: True para activar, False para desactivar
        all_plugins: Si True, modifica todos los plugins
    
    Returns:
        set: Nombres de plugins modificados
    """
    path, raw, plugins = load_plugins(root)
    all_names = {p.get("name") for p in plugins}
    
    if all_plugins:
        targets = list(all_names)
    else:
        for n in names:
            if n not in all_names:
                raise ValueError("Plugin no encontrado: %s" % n)
        targets = names
    
    modified = set()
    for p in plugins:
        if p.get("name") in targets and p.get("status") != status:
            p["status"] = status
            modified.add(p.get("name"))
    
    if modified:
        save_plugins(path, raw, plugins)
    
    return modified


def restore_plugins(root):
    """Restaura plugins.js desde la copia de seguridad (.bak).
    
    Raises:
        SystemExit: Si no existe la copia de seguridad
    """
    path, _, _ = load_plugins(root)
    bak = path + ".bak"
    
    if not os.path.exists(bak):
        raise SystemExit("No hay copia de seguridad en %s" % bak)
    
    shutil.copy2(bak, path)
    log("plugins.js restaurado desde la copia original.")


# ---------- CLI ----------
if __name__ == "__main__":
    import argparse
    import sys
    
    ap = argparse.ArgumentParser(description="Gestor de plugins de juegos RPG Maker (MZ/MV)")
    sub = ap.add_subparsers(dest="cmd")
    sub.required = True
    
    p = sub.add_parser("list", help="ver plugins y su compatibilidad con el visor WebKit")
    p.add_argument("juego")
    
    for nombre, help_ in (("disable", "desactivar"), ("enable", "activar")):
        p = sub.add_parser(nombre, help="%s plugins" % help_)
        p.add_argument("juego")
        p.add_argument("nombres", nargs="*")
        p.add_argument("--all", action="store_true")
    
    p = sub.add_parser("restore", help="volver al plugins.js original")
    p.add_argument("juego")
    
    args = ap.parse_args()
    
    if args.cmd == "list":
        path, analyzed, has_bak = get_plugins_status(args.juego)
        n_on = sum(1 for p in analyzed if p.get("status"))
        print("Plugins: %d activos de %d totales  (%s)" % (n_on, len(analyzed), os.path.relpath(path)))
        if n_on and not has_bak:
            print("(aún sin copia de seguridad: la primera modificación creará plugins.js.bak)")
        print()
        for p in analyzed:
            estado = "ON " if p.get("status") else "off"
            icon = {"roto": "ROTO ", "nw-protegido": "NW  ", "ok": "ok  ", "sin-fichero": "??  "}[p["category"]]
            extra = ""
            if p["category"] != "ok":
                extra = "  <- " + ", ".join(p["motivos"])
            print("%s %s %s%s" % (estado, icon, p.get("name", "?"), extra))
    
    elif args.cmd in ("disable", "enable"):
        activar = args.cmd == "enable"
        try:
            modified = toggle_plugin(args.juego, args.nombres, activar, args.all)
            if not modified:
                print("Nada que cambiar (ya estaban %s)." % ("activados" if activar else "desactivados"))
            else:
                verbo = "activados" if activar else "desactivados"
                print("%s: %d plugin(s) %s" % (verbo, len(modified), ", ".join(modified)))
                if not activar:
                    print("Recuerda: relanza el juego para ver el efecto.")
        except ValueError as e:
            print("Error: %s" % e, file=sys.stderr)
            sys.exit(1)
    
    elif args.cmd == "restore":
        restore_plugins(args.juego)
