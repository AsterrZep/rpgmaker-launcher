#!/usr/bin/env python3
# ============================================================
#  RPG Maker Launcher - gestor de plugins para juegos web (MZ/MV)
#
#  Permite ver qué plugins usa un juego, detectar los que pueden
#  dar problemas en el visor WebKit (usan APIs de nw.js) y
#  activarlos/desactivarlos para mejorar rendimiento o arranque.
#
#  Uso:
#    rpgmaker-plugins.py list    CARPETA_DEL_JUEGO
#    rpgmaker-plugins.py info    CARPETA_DEL_JUEGO NOMBRE
#    rpgmaker-plugins.py disable CARPETA_DEL_JUEGO NOMBRE... | --all
#    rpgmaker-plugins.py enable  CARPETA_DEL_JUEGO NOMBRE... | --all
#    rpgmaker-plugins.py restore CARPETA_DEL_JUEGO
#
#  La primera modificación crea una copia de seguridad en
#  js/plugins.js.bak (restore devuelve ese original).
# ============================================================
import argparse
import json
import os
import re
import shutil
import sys

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
    # Convierte cadenas con comillas simples a cadenas JSON de dobles
    # comillas, respetando escapes y sin tocar lo que está dentro de
    # cadenas ya delimitadas por dobles comillas.
    out, i, n = [], 0, len(raw)
    in_dq = False
    while i < n:
        c = raw[i]
        if in_dq:
            out.append(c)
            if c == "\\" and i + 1 < n:
                out.append(raw[i + 1]); i += 2; continue
            if c == '"':
                in_dq = False
            i += 1
            continue
        if c == '"':
            in_dq = True; out.append(c); i += 1; continue
        if c == "'":
            buf, j = [], i + 1
            while j < n:
                if raw[j] == "\\" and j + 1 < n:
                    buf.append(raw[j]); buf.append(raw[j + 1]); j += 2; continue
                if raw[j] == "'":
                    break
                buf.append(raw[j]); j += 1
            if j < n:
                out.append(json.dumps("".join(buf))); i = j + 1; continue
            out.append(c); i += 1; continue
        out.append(c); i += 1
    return "".join(out)


def _normalize(raw):
    # plugins.js es JS (no JSON): normaliza a JSON válido.
    raw = _convert_single_quotes(raw)                 # 1) comillas simples
    raw = re.sub(r",\s*([}\]])", r"\1", raw)           # 2) comas finales (MV)
    # 3) claves sin comillas -> con comillas (soporta unicode/japonés)
    return re.sub(r"([,{]\s*)([^\s\"'`:{}[\],]+)\s*:",
                  lambda m: m.group(1) + json.dumps(m.group(2)) + ":", raw)


def _strip_comments(src):
    # Quita comentarios JS (aproximado): evita falsos positivos como
    # palabras "process." mencionadas en la documentación del plugin
    src = re.sub(r"/\*.*?\*/", " ", src, flags=re.S)
    return re.sub(r"//[^\n]*", " ", src)


def load_plugins(root):
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
    if not os.path.exists(path + ".bak"):
        shutil.copy2(path, path + ".bak")
    m = re.search(r"\[.*\]", raw, re.S)
    new = raw[:m.start()] + json.dumps(plugins, ensure_ascii=False) + raw[m.end():]
    open(path, "w", encoding="utf-8").write(new)


def analyze(name, root):
    f = os.path.join(root, "js", "plugins", name + ".js")
    if not os.path.isfile(f):
        return {"categoria": "sin-fichero", "motivos": ["no existe plugins/%s.js" % name]}
    src = _strip_comments(open(f, encoding="utf-8", errors="ignore").read())
    tokens = [label for pat, label in NW_TOKENS if re.search(pat, src)]
    if not tokens:
        return {"categoria": "ok", "motivos": []}
    guarded = any(g in src for g in GUARDS)
    if guarded:
        return {"categoria": "nw-protegido", "motivos": tokens}
    return {"categoria": "roto", "motivos": tokens}


def cmd_list(args):
    path, raw, plugins = load_plugins(args.juego)
    root = os.path.dirname(os.path.dirname(path))
    n_on = sum(1 for p in plugins if p.get("status"))
    print("Plugins: %d activos de %d totales  (%s)" % (n_on, len(plugins), os.path.relpath(path)))
    if n_on and not os.path.exists(path + ".bak"):
        print("(aún sin copia de seguridad: la primera modificación creará plugins.js.bak)")
    print()
    for p in plugins:
        a = analyze(p.get("name", "?"), root)
        estado = "ON " if p.get("status") else "off"
        icon = {"roto": "ROTO ", "nw-protegido": "NW  ", "ok": "ok  ", "sin-fichero": "??  "}[a["categoria"]]
        extra = ""
        if a["categoria"] != "ok":
            extra = "  <- " + ", ".join(a["motivos"])
        print("%s %s %s%s" % (estado, icon, p.get("name", "?"), extra))


def cmd_set(args, activar):
    path, raw, plugins = load_plugins(args.juego)
    names = {p.get("name") for p in plugins}
    if args.all:
        targets = list(names)
    else:
        for n in args.nombres:
            if n not in names:
                raise SystemExit("Plugin no encontrado: %s" % n)
        targets = args.nombres
    cambiados = []
    for p in plugins:
        if p.get("name") in targets and p.get("status") != activar:
            p["status"] = activar
            cambiados.append(p.get("name"))
    if not cambiados:
        print("Nada que cambiar (ya estaban %s)." % ("activados" if activar else "desactivados"))
        return
    save_plugins(path, raw, plugins)
    verbo = "activados" if activar else "desactivados"
    print("%s: %d plugin(s) %s (%s)" % (verbo, len(cambiados), ", ".join(cambiados), os.path.relpath(path)))
    if not activar:
        print("Recuerda: relanza el juego para ver el efecto. Para volver: rpgmaker-plugins.py enable ...")


def cmd_restore(args):
    path, _, _ = load_plugins(args.juego)
    bak = path + ".bak"
    if not os.path.exists(bak):
        raise SystemExit("No hay copia de seguridad en %s" % bak)
    shutil.copy2(bak, path)
    print("plugins.js restaurado desde la copia original.")


def main():
    ap = argparse.ArgumentParser(description="Gestor de plugins de juegos RPG Maker (MZ/MV)")
    sub = ap.add_subparsers(dest="cmd")
    sub.required = True
    p = sub.add_parser("list", help="ver plugins y su compatibilidad con el visor WebKit")
    p.add_argument("juego"); p.set_defaults(func=cmd_list)
    for nombre, help_ in (("disable", "desactivar"), ("enable", "activar")):
        p = sub.add_parser(nombre, help="%s plugins" % help_)
        p.add_argument("juego")
        p.add_argument("nombres", nargs="*")
        p.add_argument("--all", action="store_true")
        p.set_defaults(func=lambda a, _v=nombre == "enable": cmd_set(a, _v))
    p = sub.add_parser("restore", help="volver al plugins.js original")
    p.add_argument("juego"); p.set_defaults(func=cmd_restore)
    args = ap.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()