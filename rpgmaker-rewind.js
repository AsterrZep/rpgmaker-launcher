// ============================================================
//  Rewind / Save-states para juegos RPG Maker MV/MZ
//
//  Inyectado automáticamente por rpgmaker-server.py en index.html.
//
//  - F6: guarda un estado instantáneo (anillo de 10 estados)
//  - F7: restaura el último estado guardado
//  - Auto: snapshot cada 45 s mientras estés en el mapa
//          (se activa desde el menú de trucos, F8 -> General)
//
//  Solo se permite restaurar en Scene_Map para no romper batallas
//  ni menús. Los estados viven en memoria (sesión actual).
// ============================================================
(function () {
    "use strict";

    var MAX_STATES = 10;
    var AUTO_MS = 45000;
    var states = [];            // [{t: Date, d: string}]
    var autoTimer = null;

    function ready() {
        return typeof DataManager !== "undefined" &&
            typeof JsonEx !== "undefined" &&
            typeof SceneManager !== "undefined" &&
            typeof $gameParty !== "undefined";
    }

    function inMap() {
        return !!SceneManager._scene &&
            SceneManager._scene.constructor.name === "Scene_Map";
    }

    function typingSomewhere() {
        var t = document.activeElement && document.activeElement.tagName;
        if (/^(INPUT|TEXTAREA)$/.test(t || "")) { return true; }
        if (typeof window.__rpg_panel_typing__ === "function" &&
                window.__rpg_panel_typing__()) { return true; }
        return false;
    }

    function pack(str) {
        try {
            if (typeof pako !== "undefined") {
                return { c: 1, d: pako.deflate(str, { to: "string" }) };
            }
        } catch (e) { /* sin pako */ }
        return { c: 0, d: str };
    }

    function unpack(entry) {
        try {
            if (entry.c === 1 && typeof pako !== "undefined") {
                return pako.inflate(entry.d, { to: "string" });
            }
        } catch (e) { /* corrupto */ }
        return entry.d;
    }

    function toast(msg, ok) {
        var el = document.createElement("div");
        el.textContent = msg;
        el.style.cssText =
            "position:fixed;left:12px;bottom:12px;z-index:2147483000;" +
            "font:bold 13px sans-serif;color:#fff;padding:8px 14px;" +
            "border-radius:8px;background:" + (ok ? "rgba(60,160,90,.92)"
                                                  : "rgba(190,70,60,.92)") + ";" +
            "box-shadow:0 4px 14px rgba(0,0,0,.5);transition:opacity .5s;";
        document.body.appendChild(el);
        setTimeout(function () { el.style.opacity = "0"; }, 1200);
        setTimeout(function () { el.remove(); }, 1800);
    }

    // ---------- núcleo ----------
    function saveState(silent) {
        if (!ready()) {
            if (!silent) { toast("Rewind: juego no listo", false); }
            return false;
        }
        if (!inMap()) {
            if (!silent) { toast("Rewind: solo en el mapa", false); }
            return false;
        }
        try {
            var json = JsonEx.stringify(DataManager.makeSaveContents());
            var packed = pack(json);
            states.unshift({ t: new Date(), d: packed });
            if (states.length > MAX_STATES) { states.pop(); }
            if (!silent) {
                toast(T_MSG().saved + " (" + states.length + "/" + MAX_STATES + ")",
                      true);
            }
            notifyChange();
            return true;
        } catch (e) {
            if (!silent) {
                toast("Rewind: " + (e && e.message ? e.message : e), false);
            }
            return false;
        }
    }

    function loadState(idx) {
        if (!states.length) {
            toast(T_MSG().empty, false);
            return false;
        }
        if (!ready()) { return false; }
        if (!inMap()) {
            toast(T_MSG().mapOnly, false);
            return false;
        }
        var entry = states[Math.max(0, Math.min(states.length - 1,
                                                idx == null ? 0 : idx))];
        try {
            var json = unpack(entry.d);
            var contents = JsonEx.parse(json);
            DataManager.createGameObjects();
            DataManager.extractSaveContents(contents);
            if ($gameSystem && $gameSystem.onAfterLoad) {
                $gameSystem.onAfterLoad();
            }
            SceneManager.goto(Scene_Map);
            toast(T_MSG().restored +
                  " · " + entry.t.toLocaleTimeString(), true);
            return true;
        } catch (e) {
            toast("Rewind: " + (e && e.message ? e.message : e), false);
            return false;
        }
    }

    // ---------- auto ----------
    function setAuto(on) {
        try {
            localStorage.setItem(autoKey(), on ? "1" : "0");
        } catch (e) { /* storage bloqueado */ }
        if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
        if (on && ready()) {
            autoTimer = setInterval(function () {
                if (inMap()) { saveState(true); }
            }, AUTO_MS);
        }
        notifyChange();
    }

    function getAuto() {
        try {
            return localStorage.getItem(autoKey()) === "1";
        } catch (e) {
            return false;
        }
    }

    function autoKey() {
        return "rpg_rewind_auto_" + (location.port || "local") +
               "_" + location.pathname.length;
    }

    // arranca el auto si estaba activado (cuando el juego esté listo)
    var bootTimer = setInterval(function () {
        if (ready()) {
            clearInterval(bootTimer);
            if (getAuto()) { setAuto(true); }
        }
    }, 900);

    // ---------- teclas ----------
    document.addEventListener("keydown", function (ev) {
        if (typingSomewhere()) { return; }
        if (ev.key === "F6") {
            ev.preventDefault();
            saveState(false);
        } else if (ev.key === "F7") {
            ev.preventDefault();
            loadState(0);
        }
    });

    // ---------- integración con el panel de trucos ----------
    function T_MSG() {
        var en = !!(window.__RPG_CONFIG__ && window.__RPG_CONFIG__.general &&
                    window.__RPG_CONFIG__.general.lang === "en");
        return en ? {
            saved: "Estado guardado",
            restored: "Estado restaurado",
            empty: "Sin estados guardados",
            mapOnly: "Solo se puede restaurar en el mapa"
        } : {
            saved: "Estado guardado",
            restored: "Estado restaurado",
            empty: "Sin estados guardados",
            mapOnly: "Solo se puede restaurar en el mapa"
        };
    }

    var listeners = [];
    function notifyChange() {
        listeners.forEach(function (fn) {
            try { fn(); } catch (e) { /* panel cerrándose */ }
        });
    }

    window.__rpg_rewind = {
        save: saveState,
        load: loadState,
        count: function () { return states.length; },
        max: function () { return MAX_STATES; },
        lastTime: function () {
            return states.length ? states[0].t.toLocaleTimeString() : "";
        },
        getAuto: getAuto,
        setAuto: setAuto,
        onChange: function (fn) { listeners.push(fn); }
    };
})();
