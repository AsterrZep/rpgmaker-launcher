#!/usr/bin/env python3
# ============================================================
#  RPG Maker Launcher - autotests (solo librería estándar)
#
#  Uso:   python3 tests/selftest.py
#  Sale con código 0 si todo pasa; imprime cada prueba.
#
#  Cubre: compilación de módulos, detección de motor, servidor
#  HTTP (inyección/presets/mods/traversal), editor de partidas
#  (round-trip zlib+JSON) y parseo de atajos.
# ============================================================
import importlib.util
import json
import os
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PASS = []
FAIL = []


def check(name, fn):
    try:
        fn()
        PASS.append(name)
        print("  ✓ %s" % name)
    except Exception as e:
        FAIL.append((name, e))
        print("  ✗ %s -> %s: %s" % (name, type(e).__name__, e))


def load_mod(filename, as_name=None):
    spec = importlib.util.spec_from_file_location(
        as_name or os.path.splitext(filename)[0].replace("-", "_"),
        os.path.join(ROOT, filename))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


# ---------- 1. compilación ----------
def t_py_compile():
    for f in ("rpgmaker-launcher-gui.py", "rpgmaker-server.py",
              "rpgmaker-webview.py", "rpgmaker-saveedit.py",
              "rpgmaker-plugins.py", "rpgmaker-config.py",
              "rpgmaker-decrypter.py"):
        r = subprocess.run([sys.executable, "-m", "py_compile",
                            os.path.join(ROOT, f)], capture_output=True)
        assert r.returncode == 0, r.stderr.decode()[-400:]


def t_node_check():
    if shutil.which("node") is None:
        print("    (node no disponible; se omite)")
        return
    for f in ("rpgmaker-cheats.js", "rpgmaker-savebridge.js",
              "rpgmaker-gamepad.js", "rpgmaker-browser-keys.js"):
        r = subprocess.run(["node", "--check", os.path.join(ROOT, f)],
                           capture_output=True)
        assert r.returncode == 0, r.stderr.decode()[-400:]


def t_cheats_smoke():
    if shutil.which("node") is None:
        print("    (node no disponible; se omite)")
        return
    r = subprocess.run(["node", os.path.join(ROOT, "tests", "cheats-smoke.js")],
                       capture_output=True, text=True)
    assert r.returncode == 0, (r.stdout + r.stderr)[-600:]


# ---------- 2. detección de motor ----------
def t_detect_engine():
    gui = load_mod("rpgmaker-launcher-gui.py")
    with tempfile.TemporaryDirectory() as tmp:
        mz = os.path.join(tmp, "mz")
        os.makedirs(os.path.join(mz, "js"))
        open(os.path.join(mz, "index.html"), "w").close()
        open(os.path.join(mz, "js", "rmmz_core.js"), "w").close()
        assert gui.detect_engine(mz)[1] == "MZ"

        mv = os.path.join(tmp, "mv")
        os.makedirs(os.path.join(mv, "js"))
        open(os.path.join(mv, "index.html"), "w").close()
        open(os.path.join(mv, "js", "rpg_core.js"), "w").close()
        assert gui.detect_engine(mv)[1] == "MV"

        vx = os.path.join(tmp, "vxace")
        os.makedirs(vx)
        open(os.path.join(vx, "Game.rgss3a"), "w").close()
        assert gui.detect_engine(vx)[1] == "VXAce"

        old = os.path.join(tmp, "2000")
        os.makedirs(old)
        open(os.path.join(old, "RPG_RT.exe"), "w").close()
        assert gui.detect_engine(old)[1] == "2000-2003"


# ---------- 3. servidor HTTP ----------
def _free_port():
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    port = s.getsockname()[1]
    s.close()
    return port


def t_server_http():
    with tempfile.TemporaryDirectory() as tmp:
        gdir = os.path.join(tmp, "juego")
        os.makedirs(os.path.join(gdir, "js"))
        os.makedirs(os.path.join(gdir, "mods"))
        html = ('<html><head><meta name="apple-mobile-web-app-capable" '
                'content="yes"></head><body></body></html>')
        open(os.path.join(gdir, "index.html"), "w", encoding="utf-8").write(html)
        open(os.path.join(gdir, "js", "rmmz_core.js"), "w").close()
        json.dump({"presets": [{"name": "P", "actions": []}]},
                  open(os.path.join(gdir, "cheats-presets.json"), "w"))
        open(os.path.join(gdir, "mods", "mi-mod.js"), "w").write("//mod\n")
        # BD cifrada simulada
        header = b"RPGMV" + b"\x00" * 7 + b"\x01" + b"\x00" * 3
        raw = json.dumps([None, {"id": 1, "name": "X", "price": 1}]).encode()
        open(os.path.join(gdir, "data", "Items.rpgmdata"), "wb").write(header + raw) \
            if os.makedirs(os.path.join(gdir, "data"), exist_ok=True) is None else None

        port = _free_port()
        proc = subprocess.Popen(
            [sys.executable, os.path.join(ROOT, "rpgmaker-server.py"),
             str(port), "--dir", gdir],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        try:
            base = "http://127.0.0.1:%d" % port
            ref = {"Referer": base + "/index.html"}
            deadline = time.time() + 8
            while True:
                try:
                    urllib.request.urlopen(base + "/index.html", timeout=1)
                    break
                except Exception:
                    if time.time() > deadline:
                        raise AssertionError("el servidor no arrancó")
                    time.sleep(0.2)

            def get(path, headers=None):
                req = urllib.request.Request(base + path,
                                             headers=headers or {})
                try:
                    with urllib.request.urlopen(req, timeout=4) as fh:
                        return fh.read().decode("utf-8", "replace")
                except urllib.error.HTTPError as e:
                    return "HTTP%d" % e.code

            idx = get("/index.html")
            assert "/__presets.js" in idx and "/__rewind.js" in idx \
                and "/__cheats.js" in idx \
                and "/__mods/mi-mod.js" in idx, "falta inyección"
            assert 'name="mobile-web-app-capable"' in idx, "meta no reescrita"

            pr = get("/__presets.js", ref)
            assert '"presets"' in pr and "__RPG_CHEATS_PRESETS__" in pr, pr[:120]

            md = get("/__mods/mi-mod.js", ref)
            assert md.strip() == "//mod", md[:80]

            assert get("/__mods/../evil.js", ref).startswith("HTTP"), \
                "traversal permitido!"
            assert get("/__presets.js").strip().endswith("null;")
        finally:
            proc.terminate()


# ---------- 4. editor de partidas ----------
def t_saveedit_roundtrip():
    se = load_mod("rpgmaker-saveedit.py")
    obj = {"party": {"@": "Game_Party", "_gold": 10, "_items": {"1": 3}},
           "variables": {"_data": [None, 0, 7]},
           "switches": {"_data": [None, True]}}
    with tempfile.TemporaryDirectory() as tmp:
        p = os.path.join(tmp, "file1.rmmzsave")
        se.dump_save(p, obj)
        obj2 = se.load_save(p)
        assert obj2["party"]["_gold"] == 10
        assert obj2["variables"]["_data"][2] == 7
        raw = open(p, "rb").read()
        assert raw[:2] == b"x\x01", "cabecera zlib inesperada"


# ---------- 5. atajos ----------
def t_sync_push_pull():
    se = load_mod("rpgmaker-sync.py")
    with tempfile.TemporaryDirectory() as tmp:
        saves = os.path.join(tmp, "game", "save")
        os.makedirs(saves)
        open(os.path.join(saves, "file1.rmmzsave"), "w").write("A")
        dest = os.path.join(tmp, "sync", "game", "save")
        assert se.push(saves, dest) == 1
        assert se.count_saves(dest) == 1
        open(os.path.join(dest, "file1.rmmzsave"), "w").write("B")
        n, bak = se.pull(saves, dest)
        assert n == 1 and bak and "pre-pull" in bak
        assert open(os.path.join(saves, "file1.rmmzsave")).read() == "B"
        assert open(os.path.join(bak, "file1.rmmzsave")).read() == "A"


def t_gtk_gui():
    r = subprocess.run([sys.executable, "-m", "py_compile",
                        os.path.join(ROOT, "rpgmaker-launcher-gtk.py")],
                       capture_output=True)
    assert r.returncode == 0, r.stderr.decode()[-400:]
    if shutil.which("xvfb-run") is None:
        print("    (xvfb-run no disponible; solo compila)")
        return
    env = dict(os.environ)
    env["RPGMAKER_DATA_DIR"] = tempfile.mkdtemp()
    code = (
        "import sys, importlib.util\n"
        "sys.path.insert(0, {root!r})\n"
        "spec = importlib.util.spec_from_file_location('g', {f!r})\n"
        "m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)\n"
        "import os\n"
        "app = m.GtkApp()\n"
        "app.win.show_all()\n"
        "from gi.repository import GLib\n"
        "def _done():\n"
        "    print('GTK_SMOKE_OK', flush=True)\n"
        "    os._exit(0)\n"
        "GLib.timeout_add(700, _done)\n"
        "m.main()\n"
    ).format(root=ROOT, f=os.path.join(ROOT, "rpgmaker-launcher-gtk.py"))
    r = subprocess.run(["xvfb-run", "-a", sys.executable, "-u", "-c", code],
                       capture_output=True, text=True, timeout=90, env=env)
    assert "GTK_SMOKE_OK" in (r.stdout + r.stderr), \
        (r.stdout[-300:] + r.stderr[-500:])


def t_config_parse_key():
    cfg = load_mod("rpgmaker-config.py")
    kv, mods = cfg.parse_key("Control+equal")
    assert kv != 0, "Control+equal no parsea"
    assert cfg.parse_key("") == (0, 0)


TESTS = [
    ("py_compile", t_py_compile),
    ("node --check js", t_node_check),
    ("smoke panel trucos (node)", t_cheats_smoke),
    ("detect_engine", t_detect_engine),
    ("servidor http (inyección/presets/mods/traversal)", t_server_http),
    ("saveedit round-trip", t_saveedit_roundtrip),
    ("config.parse_key", t_config_parse_key),
    ("sync push/pull", t_sync_push_pull),
    ("gui gtk (compila + smoke xvfb)", t_gtk_gui),
]

if __name__ == "__main__":
    print("== Autotests RPG Maker Launcher ==")
    for name, fn in TESTS:
        check(name, fn)
    print("\n%d OK, %d fallos" % (len(PASS), len(FAIL)))
    sys.exit(1 if FAIL else 0)
