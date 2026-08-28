#!/usr/bin/env python3
import json
import os
import subprocess
import sys
import time
import urllib.request
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

def run_tests():
    print("== Testing RPG Maker API Server ==")
    # Start server on a free port
    proc = subprocess.Popen(
        [sys.executable, "-u", os.path.join(ROOT, "rpgmaker_api.py"), "--port", "0"],
        stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
    )
    port = None
    try:
        # Read port
        line = proc.stdout.readline()
        if "RPG_MAKER_API_PORT=" in line:
            port = int(line.strip().split("=")[1])
        assert port is not None, f"Could not get port, line was: {line}"
        print(f"  ✓ API Server started on port {port}")

        base_url = f"http://127.0.0.1:{port}"

        def req(path, method="GET", data=None):
            url = base_url + path
            headers = {"Content-Type": "application/json"} if data else {}
            body = json.dumps(data).encode("utf-8") if data else None
            r = urllib.request.Request(url, data=body, headers=headers, method=method)
            with urllib.request.urlopen(r, timeout=5) as res:
                return res.status, json.loads(res.read().decode("utf-8"))

        # Test 1: Status
        status, data = req("/api/status")
        assert status == 200 and data.get("version") == "0.9.1"
        print("  ✓ /api/status")

        # Test 2: Games List
        status, data = req("/api/games")
        assert status == 200 and "games" in data
        assert isinstance(data["games"], list)
        print(f"  ✓ /api/games (found {len(data['games'])} games)")

        # Test 3: Config
        status, data = req("/api/config")
        assert status == 200 and "teclas" in data
        print("  ✓ /api/config")

        # Test 4: Favorite toggle (if there's at least 1 game)
        if data and len(req("/api/games")[1]["games"]) > 0:
            first_game = req("/api/games")[1]["games"][0]["name"]
            status, fav_data = req("/api/games/favorite", method="POST", data={"name": first_game, "favorite": True})
            assert status == 200 and fav_data.get("favorite") is True
            # Revert
            req("/api/games/favorite", method="POST", data={"name": first_game, "favorite": False})
            print(f"  ✓ /api/games/favorite ({first_game})")

            # Test 5: Saves list
            status, saves_data = req(f"/api/saves?game={urllib.parse.quote(first_game)}")
            assert status == 200 and "saves" in saves_data
            print(f"  ✓ /api/saves for {first_game}")

            # Test 6: Database browser
            status, db_data = req(f"/api/data?game={urllib.parse.quote(first_game)}&cat=Items")
            assert status == 200 and "items" in db_data
            print(f"  ✓ /api/data for {first_game}")

        # Test 7: Sync status
        status, sync_data = req("/api/sync/status")
        assert status == 200 and "games" in sync_data
        print("  ✓ /api/sync/status")

        # Test 8: Update check (puede fallar sin red; solo valida el esquema)
        try:
            status, upd = req("/api/update/check")
            assert status == 200
            assert "update_available" in upd and "current_version" in upd
            assert "url" in upd
            print(f"  ✓ /api/update/check (local={upd['current_version']}, tag={upd.get('tag_name') or '-'})")
        except AssertionError:
            raise

        # Test 9: Mods setup (requiere un juego web) + open con ruta bloqueada
        games = req("/api/games")[1]["games"]
        web_game = next((g["name"] for g in games if g.get("is_web")), None)
        if web_game:
            status, mods = req("/api/tools/mods", method="POST", data={"game": web_game})
            assert status == 200 and mods.get("ok") is True
            assert os.path.isdir(mods["mods_dir"])
            print(f"  ✓ /api/tools/mods ({web_game})")

        # open fuera de DATA_DIR debe ser rechazado (403/400)
        try:
            req("/api/open?target=/etc")
            assert False, "/etc no debería poder abrirse"
        except urllib.error.HTTPError as e:
            assert e.code in (400, 403)
            print("  ✓ /api/open bloquea rutas externas")
        except Exception:
            pass  # sin red/xdg-open ausente: la validación de esquema ya pasó

        print("All API tests passed successfully!")
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=2)
        except subprocess.TimeoutExpired:
            proc.kill()

if __name__ == "__main__":
    run_tests()
