// ============================================================
//  Gamepad → teclado para RPG Maker MV/MZ
//
//  Inyectado automáticamente por rpgmaker-server.py en index.html.
//  Traduce un mando (Xbox/DualShock/Switch) a los atajos por
//  defecto del motor: flechas (moverse), Z (confirmar), X
//  (cancelar), Shift (correr) y Escape (menú).
//
//  Requiere la Gamepad API (WebKitGTK moderno la soporta). Si el
//  navegador/visor no la ofrece, este script no hace nada.
// ============================================================
(function () {
    "use strict";

    if (!navigator.getGamepads) {
        return;
    }

    // ---------- mapeo a teclas de MV/MZ ----------
    var MAP_BUTTON = {
        0: "z",        // A (inferior) → Z / confirmar
        1: "x",        // B (derecha) → X / cancelar
        2: "Shift",    // X (izquierda) → correr
        9: "Escape",   // Start/Menu → menú
        8: "Escape",   // Back/View → menú (alternativa)
        4: "Escape",   // LB → menú (alternativa)
        5: "z"         // RB → confirmar (alternativa)
    };

    // Sensibilidad para la cruceta digital en el stick izquierdo
    var AXIS_DEADZONE = 0.45;

    function keyFor(name) {
        // Devuelve la tecla del navegador (KeyboardEvent.key)
        switch (name) {
            case "z": return "z";
            case "x": return "x";
            case "Shift": return "Shift";
            case "Escape": return "Escape";
            case "up": return "ArrowUp";
            case "down": return "ArrowDown";
            case "left": return "ArrowLeft";
            case "right": return "ArrowRight";
            default: return name;
        }
    }

    // Estado anterior de cada tecla sintetizada
    var prev = {};

    function setKey(name, down) {
        if (!!prev[name] === !!down) {
            return;
        }
        prev[name] = !!down;
        var key = keyFor(name);
        var ev = new KeyboardEvent(down ? "keydown" : "keyup", {
            key: key,
            code: key,
            bubbles: true,
            cancelable: true
        });
        // MV/MZ escuchan sobre document/canvas
        document.dispatchEvent(ev);
        if (document.body) {
            document.body.dispatchEvent(ev);
        }
    }

    function axisDirs(ax, ay) {
        var dirs = {};
        if (ax < -AXIS_DEADZONE) { dirs.left = true; }
        if (ax > AXIS_DEADZONE) { dirs.right = true; }
        if (ay < -AXIS_DEADZONE) { dirs.up = true; }
        if (ay > AXIS_DEADZONE) { dirs.down = true; }
        return dirs;
    }

    var lastDir = {};

    function poll() {
        var pads = navigator.getGamepads ? navigator.getGamepads() : [];
        var pad = null;
        for (var i = 0; i < pads.length; i++) {
            if (pads[i] && pads[i].connected) {
                pad = pads[i];
                break;
            }
        }
        if (!pad) {
            // Mando desconectado: soltar todo lo pulsado
            for (var k in prev) {
                if (prev[k]) { setKey(k, false); }
            }
            return;
        }

        var now = {};
        for (var b in MAP_BUTTON) {
            if (pad.buttons[b] && pad.buttons[b].pressed) {
                now[MAP_BUTTON[b]] = true;
            }
        }
        // Cruceta (botones 12-15) y stick izquierdo
        var up = (pad.buttons[12] && pad.buttons[12].pressed) ||
                 (pad.axes[1] !== undefined && pad.axes[1] < -AXIS_DEADZONE);
        var down = (pad.buttons[13] && pad.buttons[13].pressed) ||
                   (pad.axes[1] !== undefined && pad.axes[1] > AXIS_DEADZONE);
        var left = (pad.buttons[14] && pad.buttons[14].pressed) ||
                   (pad.axes[0] !== undefined && pad.axes[0] < -AXIS_DEADZONE);
        var right = (pad.buttons[15] && pad.buttons[15].pressed) ||
                    (pad.axes[0] !== undefined && pad.axes[0] > AXIS_DEADZONE);
        if (up) { now.up = true; }
        if (down) { now.down = true; }
        if (left) { now.left = true; }
        if (right) { now.right = true; }

        // Suelta las que ya no están
        for (var name in prev) {
            if (prev[name] && !now[name]) {
                setKey(name, false);
            }
        }
        // Pulsa las nuevas
        for (var n in now) {
            if (!prev[n]) {
                setKey(n, true);
            }
        }
    }

    window.setInterval(poll, 16);
})();