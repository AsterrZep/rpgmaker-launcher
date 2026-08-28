#!/usr/bin/env python3
# ============================================================
#  RPG Maker Launcher - autotests (solo librería estándar)
#
#  Uso:   python3 tests/selftest.py
#  Sale con código 0 si todo pasa; imprime cada prueba.
#
#  Cubre: compilación de módulos, detección de motor, servidor
#  HTTP (inyección/presets/mods/traversal), editor de partidas
#  (round-trip zlib+JSON), parseo de atajos y backend API.
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
    for f in ("rpgmaker-server.py",
              "rpgmaker-webview.py", "rpgmaker-saveedit.py",
              "rpgmaker-plugins.py", "rpgmaker-config.py",
              "rpgmaker-decrypter.py", "rpgmaker_api.py"):
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
    api = load_mod("rpgmaker_api.py")
    with tempfile.TemporaryDirectory() as tmp:
        mz = os.path.join(tmp, "mz")
        os.makedirs(os.path.join(mz, "js"))
        open(os.path.join(mz, "index.html"), "w").close()
        open(os.path.join(mz, "js", "rmmz_core.js"), "w").close()
        assert api.detect_engine(mz)[1] == "MZ"

        mv = os.path.join(tmp, "mv")
        os.makedirs(os.path.join(mv, "js"))
        open(os.path.join(mv, "index.html"), "w").close()
        open(os.path.join(mv, "js", "rpg_core.js"), "w").close()
        assert api.detect_engine(mv)[1] == "MV"

        vx = os.path.join(tmp, "vxace")
        os.makedirs(vx)
        open(os.path.join(vx, "Game.rgss3a"), "w").close()
        assert api.detect_engine(vx)[1] == "VXAce"

        old = os.path.join(tmp, "2000")
        os.makedirs(old)
        open(os.path.join(old, "RPG_RT.exe"), "w").close()
        assert api.detect_engine(old)[1] == "2000-2003"


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
    saveedit = load_mod("rpgmaker-saveedit.py")
    sample = {
        "party": {"_gold": 12345, "_items": {"1": 5, "2": 0, "3": 10}},
        "variables": {"_data": [None, 42, "hello", 0]},
        "switches": {"_data": [None, True, False, True]},
        "actors": {"_data": [{"_name": "Hero"}, {"_name": "Mage"}]},
    }
    with tempfile.TemporaryDirectory() as tmp:
        f = os.path.join(tmp, "file1.rmmzsave")
        bdir = os.path.join(tmp, "backups")
        saveedit.dump_save(f, sample, backups_dir=bdir, game_name="t")
        assert os.path.isfile(f)
        loaded = saveedit.load_save(f)
        assert loaded["party"]["_gold"] == 12345
        assert loaded["variables"]["_data"][1] == 42
        s = saveedit.summary(loaded)
        assert s["gold"] == 12345
        assert s["items_kinds"] == 2
        assert s["variables_used"] == 2
        assert s["switches_on"] == 2
        assert "Hero" in s["actors"]


# ---------- 5. sync ----------
def t_sync_push_pull():
    sync = load_mod("rpgmaker-sync.py")
    with tempfile.TemporaryDirectory() as tmp:
        loc = os.path.join(tmp, "local")
        dst = os.path.join(tmp, "dest")
        os.makedirs(loc)
        open(os.path.join(loc, "f1.rmmzsave"), "w").write("a")
        open(os.path.join(loc, "f2.rmmzsave"), "w").write("b")
        assert sync.count_saves(loc) == 2

        n = sync.push(loc, dst)
        assert n == 2
        assert sync.count_saves(dst) == 2

        open(os.path.join(dst, "f3.rmmzsave"), "w").write("c")
        n, bak = sync.pull(loc, dst)
        assert n == 3
        assert sync.count_saves(loc) == 3
        assert bak is not None and os.path.isdir(bak)


# ---------- 6. config parse key ----------
def t_config_parse_key():
    cfg = load_mod("rpgmaker-config.py")
    kv, mods = cfg.parse_key("Control+equal")
    assert kv != 0, "Control+equal no parsea"
    assert cfg.parse_key("") == (0, 0)


# ---------- 7. backend api ----------
def t_backend_api():
    r = subprocess.run([sys.executable, os.path.join(ROOT, "tests", "test_api.py")],
                       capture_output=True, text=True)
    assert r.returncode == 0, (r.stdout + r.stderr)[-600:]


TESTS = [
    ("py_compile", t_py_compile),
    ("node --check js", t_node_check),
    ("smoke panel trucos (node)", t_cheats_smoke),
    ("detect_engine", t_detect_engine),
    ("servidor http (inyección/presets/mods/traversal)", t_server_http),
    ("saveedit round-trip", t_saveedit_roundtrip),
    ("config.parse_key", t_config_parse_key),
    ("sync push/pull", t_sync_push_pull),
    ("backend api (rpgmaker_api.py)", t_backend_api),
]

if __name__ == "__main__":
    print("== Autotests RPG Maker Launcher ==")
    for name, fn in TESTS:
        check(name, fn)
    print("\n%d OK, %d fallos" % (len(PASS), len(FAIL)))
    sys.exit(1 if FAIL else 0)
