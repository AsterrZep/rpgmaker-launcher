#!/usr/bin/env python3
# ============================================================
#  RPG Maker Launcher - GUI ligera (Tkinter)
#  Lista los juegos, detecta el motor y los lanza con el
#  runtime adecuado. Incluye control de servidores HTTP y
#  limpieza opcional de los .zip.
# ============================================================
import os
import sys
import time
import glob
import shutil
import threading
import subprocess
import tkinter as tk
from tkinter import ttk, messagebox

BASE_DIR = os.path.dirname(os.path.realpath(__file__))
GAMES_DIR = os.path.join(BASE_DIR, "games")
RUN_DIR = os.path.join(BASE_DIR, "runtimes")
MKXPZ = os.path.join(RUN_DIR, "mkxp-z")
EASYRPG = "easyrpg-player"
MAX_DEPTH = 5
MARKER = ".extracted"

ENGINE_LABEL = {
    "MZ": "RPG Maker MZ",
    "MV": "RPG Maker MV",
    "web": "Web (MV/MZ)",
    "2000-2003": "RPG Maker 2000/2003",
    "renpy": "Ren'Py",
    "VXAce": "RPG Maker VX Ace",
    "VX": "RPG Maker VX",
    "XP": "RPG Maker XP",
    "incomplete": "Descarga incompleta",
    "renpy-incomplete": "Ren'Py sin parte Linux",
}


# ---------- detección (misma lógica que el lanzador bash) ----------
def first_find(root, name):
    root = os.path.abspath(root)
    for dirpath, dirnames, filenames in os.walk(root):
        depth = dirpath[len(root):].count(os.sep)
        if depth >= MAX_DEPTH:
            dirnames[:] = []
            continue
        dirnames.sort()
        if name in filenames:
            return os.path.join(dirpath, name)
    return None


def find_glob(root, pattern):
    for dirpath, dirnames, filenames in os.walk(root):
        depth = dirpath[len(root):].count(os.sep)
        if depth >= MAX_DEPTH:
            dirnames[:] = []
            continue
        dirnames.sort()
        if filenames:
            m = glob.fnmatch.filter(filenames, pattern)
            if m:
                return os.path.join(dirpath, m[0])
    return None


def find_dir(root, name):
    for dirpath, dirnames, filenames in os.walk(root):
        depth = dirpath[len(root):].count(os.sep)
        if depth >= MAX_DEPTH:
            dirnames[:] = []
            continue
        dirnames.sort()
        if name in dirnames:
            return os.path.join(dirpath, name)
    return None


def detect_engine(top):
    f = first_find(top, "index.html")
    if f:
        root = os.path.dirname(f)
        if os.path.isfile(os.path.join(root, "js", "rmmz_core.js")):
            return root, "MZ"
        if os.path.isfile(os.path.join(root, "js", "rpg_core.js")):
            return root, "MV"
        return root, "web"

    for file, eng in (("Game.rgss3a", "VXAce"), ("Game.rgss2a", "VX"), ("Game.rgssad", "XP")):
        f = first_find(top, file)
        if f:
            return os.path.dirname(f), eng

    for pat in ("RPG_RT.exe", "RPG_RT.ini"):
        f = first_find(top, pat)
        if f:
            return os.path.dirname(f), "2000-2003"
    f = find_glob(top, "*.lmt")
    if f:
        return os.path.dirname(f), "2000-2003"

    f = find_glob(top, "*.py")
    if f:
        rdir = os.path.dirname(f)
        if all(os.path.isdir(os.path.join(rdir, d)) for d in ("renpy", "game", "lib/linux-x86_64")):
            return rdir, "renpy"

    for file, eng in (("Scripts.rvdata2", "VXAce"), ("Scripts.rvdata", "VX"), ("Scripts.rxdata", "XP")):
        f = first_find(top, file)
        if f:
            return os.path.dirname(f), eng

    if first_find(top, "System.json") or first_find(top, "Map001.json"):
        return top, "incomplete"
    if find_dir(top, "renpy"):
        return top, "renpy-incomplete"
    return None, None


def free_port():
    import socket
    s = socket.socket()
    s.bind(("", 0))
    port = s.getsockname()[1]
    s.close()
    return port


def zip_for_game(name):
    """Devuelve la ruta del .zip correspondiente al nombre de la carpeta del juego."""
    return os.path.join(BASE_DIR, name + ".zip")


# ---------- extracción ----------
def extract_zips(callback=None, auto_delete=False):
    done, errors = [], []
    for z in sorted(glob.glob(os.path.join(BASE_DIR, "*.zip"))):
        name = os.path.splitext(os.path.basename(z))[0]
        target = os.path.join(GAMES_DIR, name)
        marker = os.path.join(target, MARKER)
        if os.path.isfile(marker):
            continue
        os.makedirs(target, exist_ok=True)
        if callback:
            callback("Extrayendo: %s ..." % os.path.basename(z))
        r = subprocess.run(["unzip", "-o", "-q", z, "-d", target])
        if r.returncode == 0:
            with open(marker, "w") as fh:
                fh.write("ok\n")
            done.append(name)
            if auto_delete:
                try:
                    os.remove(z)
                    done[-1] = name + " (+ .zip borrado)"
                except OSError as e:
                    errors.append("no se pudo borrar %s: %s" % (os.path.basename(z), e))
        else:
            errors.append(name)
    return done, errors


# ---------- lanzadores ----------
class Launcher:
    def __init__(self):
        self.server_proc = None
        self.server_info = None  # (nombre, puerto)

    @property
    def server_running(self):
        return bool(self.server_proc and self.server_proc.poll() is None)

    def stop_server(self):
        if self.server_running:
            self.server_proc.terminate()
            try:
                self.server_proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.server_proc.kill()
        self.server_proc = None
        self.server_info = None

    def launch_web(self, root, name):
        self.stop_server()
        port = free_port()
        self.server_proc = subprocess.Popen(
            [sys.executable, "-m", "http.server", str(port), "--bind", "127.0.0.1", "--directory", root],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        self.server_info = (name, port)
        time.sleep(1)
        subprocess.Popen(["xdg-open", "http://localhost:%d/index.html" % port],
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return port

    def launch_native(self, root, engine):
        if engine == "2000-2003":
            cmd = [EASYRPG, root]
        elif engine == "renpy":
            py = first_find(root, "*.py")
            cmd = [os.path.join(root, os.path.splitext(py)[0] + ".sh")]
        else:
            cmd = [MKXPZ]
        subprocess.Popen(cmd, cwd=root, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


# ---------- ventana ----------
class App:
    def __init__(self):
        self.launcher = Launcher()
        self.games = []  # (nombre, root, engine) o None si incompleto

        self.root = tk.Tk()
        self.root.title("RPG Maker Launcher")
        self.root.geometry("600x440")
        self.root.minsize(520, 380)
        self.root.protocol("WM_DELETE_WINDOW", self.on_close)

        style = ttk.Style()
        try:
            style.theme_use("clam")
        except tk.TclError:
            pass

        top = ttk.Frame(self.root, padding=(12, 10))
        top.pack(fill="x")
        ttk.Label(top, text="RPG Maker Launcher", font=("Sans", 14, "bold")).pack(side="left")
        ttk.Label(top, text="Chrome OS / Linux", foreground="#666").pack(side="left", padx=8, pady=6)
        self.auto_delete = tk.BooleanVar(value=False)
        ttk.Checkbutton(top, text="Eliminar .zip tras extraer",
                        variable=self.auto_delete).pack(side="right")

        mid = ttk.Frame(self.root, padding=(12, 0))
        mid.pack(fill="both", expand=True)
        self.tree = ttk.Treeview(mid, columns=("engine",), show="tree headings", selectmode="browse")
        self.tree.heading("#0", text="Juego")
        self.tree.heading("engine", text="Motor")
        self.tree.column("#0", width=380, anchor="w")
        self.tree.column("engine", width=160, anchor="w")
        vsb = ttk.Scrollbar(mid, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=vsb.set)
        self.tree.pack(side="left", fill="both", expand=True)
        vsb.pack(side="right", fill="y")
        self.tree.bind("<Double-1>", lambda e: self.play_selected())

        btns = ttk.Frame(self.root, padding=(12, 10))
        btns.pack(fill="x")
        self.play_btn = ttk.Button(btns, text="Jugar", command=self.play_selected)
        self.play_btn.pack(side="left")
        ttk.Button(btns, text="Actualizar", command=self.rescan).pack(side="left", padx=6)
        self.stop_btn = ttk.Button(btns, text="Detener servidor", command=self.stop_server_action)
        self.stop_btn.pack(side="left", padx=6)
        ttk.Button(btns, text="Borrar .zip", command=self.delete_zip_action).pack(side="left")
        ttk.Button(btns, text="Salir", command=self.on_close).pack(side="right")

        self.status = tk.StringVar(value="Cargando...")
        ttk.Label(self.root, textvariable=self.status, padding=(12, 6), foreground="#555").pack(fill="x")

        self.load_games()

    # --- datos ---
    def load_games(self):
        self.games = []
        self.tree.delete(*self.tree.get_children())
        for top in sorted(glob.glob(os.path.join(GAMES_DIR, "*"))):
            if not os.path.isdir(top):
                continue
            name = os.path.basename(top.rstrip(os.sep))
            root, eng = detect_engine(top)
            if eng is None:
                continue
            if eng in ("incomplete", "renpy-incomplete"):
                label = ENGINE_LABEL.get(eng, eng)
                iid = self.tree.insert("", "end", text=name, values=("(!) " + label,))
                self.tree.item(iid, tags=("bad",))
                self.games.append(None)
            else:
                iid = self.tree.insert("", "end", text=name, values=(ENGINE_LABEL.get(eng, eng),))
                self.games.append((name, root, eng))
        self.tree.tag_configure("bad", foreground="#b00")
        self._update_status("Listos: %d juego(s)" % sum(1 for g in self.games if g))

    def rescan(self):
        self._update_status("Buscando nuevos .zip...")
        threading.Thread(target=self._rescan_worker, daemon=True).start()

    def _rescan_worker(self):
        extracted, errors = extract_zips(callback=self._set_status,
                                         auto_delete=self.auto_delete.get())
        self.root.after(0, lambda: self._finish_rescan(extracted, errors))

    def _finish_rescan(self, extracted, errors):
        if extracted:
            msg = "Extraídos: %s" % ", ".join(extracted)
        else:
            msg = "Sin nuevos .zip"
        if errors:
            msg += "  |  ERROR: %s" % ", ".join(errors)
        self.load_games()
        self._update_status(msg)

    def _set_status(self, msg):
        self.root.after(0, lambda: self._update_status(msg))

    def _update_status(self, msg):
        if self.launcher.server_running and self.launcher.server_info:
            name, port = self.launcher.server_info
            self.status.set("Servidor ACTIVO: %s -> http://localhost:%d   |   %s"
                            % (name, port, msg))
        else:
            self.status.set(msg)

    # --- acciones ---
    def selected(self):
        sel = self.tree.focus()
        if not sel:
            return None
        idx = self.tree.index(sel)
        if idx >= len(self.games):
            return None
        return idx, self.games[idx]

    def play_selected(self):
        sel = self.selected()
        if not sel:
            return
        idx, game = sel
        if not game:
            messagebox.showwarning("RPG Maker Launcher",
                                   "Este juego está incompleto (descarga con archivos faltantes).\nVuelve a descargarlo.")
            return
        name, root, engine = game
        if engine in ("MZ", "MV", "web"):
            self._update_status("Iniciando servidor para %s..." % name)
            self.root.update_idletasks()
            threading.Thread(target=self._play_web, args=(root, name), daemon=True).start()
        else:
            self._update_status("Lanzando %s (%s) en su ventana..." % (name, ENGINE_LABEL.get(engine, engine)))
            self.root.update_idletasks()
            self.launcher.launch_native(root, engine)
            self._update_status("%s lanzado. Cierra la ventana del juego cuando termines." % name)

    def _play_web(self, root, name):
        port = self.launcher.launch_web(root, name)
        self._set_status("")

    def stop_server_action(self):
        if self.launcher.server_running:
            name, port = self.launcher.server_info
            self.launcher.stop_server()
            self._update_status("Servidor de '%s' (puerto %d) detenido." % (name, port))
        else:
            self._update_status("No hay ningún servidor activo.")

    def delete_zip_action(self):
        sel = self.selected()
        if not sel:
            return
        idx, game = sel
        name = self.tree.item(self.tree.focus(), "text")
        zpath = zip_for_game(name)
        if not os.path.isfile(zpath):
            self._update_status("No existe el .zip de '%s'." % name)
            return
        size = os.path.getsize(zpath) / (1024 * 1024)
        ok = messagebox.askyesno("RPG Maker Launcher",
                                 "¿Eliminar el .zip de '%s'?\n\n%s\n(%.0f MB — el juego ya extraído se conserva)"
                                 % (name, os.path.basename(zpath), size))
        if not ok:
            return
        try:
            os.remove(zpath)
            self._update_status(".zip de '%s' eliminado. El juego sigue disponible." % name)
        except OSError as e:
            messagebox.showerror("RPG Maker Launcher", "No se pudo borrar: %s" % e)

    def on_close(self):
        self.launcher.stop_server()
        self.root.destroy()


def main():
    if not os.path.isdir(GAMES_DIR):
        os.makedirs(GAMES_DIR, exist_ok=True)
    app = App()
    app.root.mainloop()


if __name__ == "__main__":
    main()