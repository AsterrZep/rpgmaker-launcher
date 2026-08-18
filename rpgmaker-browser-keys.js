// ============================================================
//  Atajos de teclado configurables para la VERSIÓN NAVEGADOR
//
//  Se inyecta desde rpgmaker-server.py en index.html. Lee la
//  configuración de /__config.js (window.__RPG_CONFIG__), igual
//  que el visor WebKit. Se desactiva solo si detecta el visor
//  WebKit (que ya gestiona sus propias teclas en GTK).
//
//  Atajos soportados en navegador: recargar, pantalla completa,
//  salir de pantalla completa y contador de FPS. El menú de
//  trucos lo gestiona rpgmaker-cheats.js.
// ============================================================
(function () {
    "use strict";

    if (window.__rpg_webkit__) { return; }

    var cfg = window.__RPG_CONFIG__ || {};
    var teclas = cfg.teclas || {};
    var inputs = /^(INPUT|TEXTAREA|SELECT)$/;

    function spec(combo) {
        if (!combo) { return null; }
        var parts = String(combo).split("+");
        var k = parts.pop().toLowerCase();
        var wantCtrl = parts.some(function (m) { return /^(ctrl|control)$/i.test(m); });
        var wantShift = parts.some(function (m) { return /^shift$/i.test(m); });
        var wantAlt = parts.some(function (m) { return /^alt$/i.test(m); });
        return { key: k, ctrl: wantCtrl, shift: wantShift, alt: wantAlt };
    }

    function match(ev, combo) {
        var s = spec(combo);
        if (!s) { return false; }
        var k = (ev.key || "").toLowerCase();
        var alias = { "equal": "=", "plus": "+", "minus": "-", "space": " " };
        var k2 = alias[k] || k;
        var keyMatch = k2 === s.key ||
            (s.key === "equal" && k2 === "=") ||
            (s.key === "minus" && k2 === "-") ||
            (s.key === "plus" && k2 === "+");
        return keyMatch &&
            !!ev.ctrlKey === s.ctrl &&
            !!ev.shiftKey === s.shift &&
            !!ev.altKey === s.alt;
    }

    function toast(msg) {
        var d = document.createElement("div");
        d.textContent = msg;
        d.style.cssText = "position:fixed;z-index:100000;bottom:14px;left:50%;" +
            "transform:translateX(-50%);background:rgba(18,20,26,0.95);color:#eee;" +
            "font:13px sans-serif;padding:8px 16px;border:1px solid #3a3f4b;" +
            "border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.5);pointer-events:none;";
        document.body.appendChild(d);
        setTimeout(function () { d.remove(); }, 1800);
    }

    // Contador de FPS (igual al del visor WebKit)
    function installFps() {
        if (window.__rpg_browser_fps__) { return; }
        window.__rpg_browser_fps__ = true;
        var d = document.createElement("div");
        d.id = "rpg-browser-fps";
        d.style.cssText = "position:fixed;z-index:99999;top:6px;left:8px;font:12px monospace;" +
            "color:#fff;background:rgba(0,0,0,0.55);padding:3px 8px;border-radius:6px;" +
            "display:none;pointer-events:none;";
        document.documentElement.appendChild(d);
        var frames = 0;
        var last = performance.now ? performance.now() : Date.now();
        window.__rpg_browser_fps_toggle__ = function () {
            d.style.display = (d.style.display === "none") ? "block" : "none";
        };
        (function loop(t) {
            frames++;
            if (t - last >= 500) {
                d.textContent = Math.round(frames * 1000 / (t - last)) + " FPS";
                frames = 0;
                last = t;
            }
            requestAnimationFrame(loop);
        })(last);
    }

    document.addEventListener("keydown", function (ev) {
        var tag = document.activeElement && document.activeElement.tagName;
        if (inputs.test(tag || "")) { return; }

        if (match(ev, teclas.recargar)) {
            ev.preventDefault();
            location.reload();
        } else if (match(ev, teclas.pantalla_completa)) {
            ev.preventDefault();
            var el = document.documentElement;
            if (document.fullscreenElement) {
                (document.exitFullscreen || function () {}).call(document);
            } else {
                (el.requestFullscreen || el.webkitRequestFullscreen || function () {}).call(el);
            }
        } else if (match(ev, teclas.salir_pantalla_completa)) {
            if (document.fullscreenElement) {
                ev.preventDefault();
                (document.exitFullscreen || function () {}).call(document);
            }
        } else if (match(ev, teclas.fps)) {
            ev.preventDefault();
            installFps();
            window.__rpg_browser_fps_toggle__();
        } else if (match(ev, teclas.captura)) {
            ev.preventDefault();
            toast("Captura de pantalla: usa el visor WebKit (F12).");
        }
    });
})();
