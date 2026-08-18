// ============================================================
//  Cheat Menu (estilo JoyPlay) para juegos RPG Maker MV/MZ
//
//  Inyectado automáticamente por rpgmaker-server.py en index.html.
//  Panel flotante con trucos: oro, HP/MP, objetos, variables,
//  switches, teletransporte y una consola de código.
//
//  Atajo: tecla F8 (o el botón flotante "T" abajo a la derecha).
// ============================================================
(function () {
    "use strict";

    var HOST = document.createElement("div");
    var shadow = HOST.attachShadow({ mode: "closed" });
    var panel = null;
    var visible = false;
    var ready = false;

    function gameReady() {
        return typeof window.$gameParty !== "undefined";
    }

    function refreshReady() {
        ready = gameReady();
        if (ready && !panel) {
            buildPanel();
        }
        if (panel) {
            var s = panel.querySelector(".rpgc-status");
            if (s) {
                s.textContent = ready ? "Conectado al juego" : "Esperando al juego...";
                s.className = "rpgc-status " + (ready ? "rpgc-ok" : "rpgc-wait");
            }
        }
    }

    // ---------- acciones ----------
    function cheatGold(n) {
        if (!ready) { return; }
        n = Math.floor(Number(n) || 0);
        $gameParty.gainGold(n);
    }

    function cheatRecover() {
        if (!ready) { return; }
        $gameParty.members().forEach(function (a) {
            a.recoverAll();
        });
    }

    function cheatClearStates() {
        if (!ready) { return; }
        $gameParty.members().forEach(function (a) {
            a.removeAllStates();
        });
    }

    function cheatItem(id, count) {
        if (!ready) { return; }
        id = Math.floor(Number(id) || 0);
        count = Math.floor(Number(count) || 1);
        var item = $dataItems[id] || $dataWeapons[id] || $dataArmors[id];
        if (item) {
            $gameParty.gainItem(item, count);
        }
    }

    function cheatAllItems() {
        if (!ready) { return; }
        if ($dataItems) {
            for (var i = 1; i < $dataItems.length; i++) {
                if ($dataItems[i]) {
                    $gameParty.gainItem($dataItems[i], 99);
                }
            }
        }
    }

    function cheatVariable(id, value) {
        if (!ready) { return; }
        id = Math.floor(Number(id) || 0);
        $gameVariables.setValue(id, value);
    }

    function cheatSwitch(id, on) {
        if (!ready) { return; }
        id = Math.floor(Number(id) || 0);
        $gameSwitches.setValue(id, !!on);
    }

    function cheatTeleport(mapId, x, y) {
        if (!ready) { return; }
        mapId = Math.floor(Number(mapId) || 1);
        x = Math.floor(Number(x) || 0);
        y = Math.floor(Number(y) || 0);
        $gamePlayer.reserveTransfer(mapId, x, y, 2, 0);
        if (typeof SceneManager !== "undefined" &&
                SceneManager._scene &&
                SceneManager._scene.constructor &&
                SceneManager._scene.constructor.name !== "Scene_Map") {
            SceneManager.goto(Scene_Map);
        }
    }

    function cheatEval(code) {
        if (!ready && !code) { return; }
        try {
            var result = (0, eval)(code);
            return "OK" + (result !== undefined ? ": " + String(result) : "");
        } catch (e) {
            return "ERROR: " + (e && e.message ? e.message : String(e));
        }
    }

    // ---------- estilos (Shadow DOM: aislado del CSS del juego) ----------
    function css() {
        return (
            ".rpgc-panel{position:fixed;z-index:99999;top:10px;right:10px;width:320px;" +
            "font:13px/1.4 'Segoe UI',Roboto,sans-serif;color:#eee;background:rgba(18,20,26,0.94);" +
            "border:1px solid #3a3f4b;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,0.6);" +
            "user-select:none;overflow:hidden}" +
            ".rpgc-head{display:flex;align-items:center;justify-content:space-between;" +
            "padding:8px 10px;background:#262b36;cursor:move;font-weight:700}" +
            ".rpgc-title{display:flex;align-items:center;gap:6px}" +
            ".rpgc-badge{background:#e0603a;color:#fff;font-size:10px;border-radius:4px;padding:1px 5px}" +
            ".rpgc-x{border:0;background:none;color:#aaa;font-size:16px;cursor:pointer;padding:0 4px}" +
            ".rpgc-x:hover{color:#fff}" +
            ".rpgc-tabs{display:flex;background:#1b1f28}" +
            ".rpgc-tab{flex:1;border:0;background:none;color:#9aa1b0;padding:7px 0;cursor:pointer;font-size:12px}" +
            ".rpgc-tab.on{color:#fff;background:#303644;font-weight:600}" +
            ".rpgc-body{padding:10px;height:270px;overflow:auto}" +
            ".rpgc-row{display:flex;align-items:center;gap:6px;margin-bottom:8px}" +
            ".rpgc-label{width:74px;color:#9aa1b0;font-size:11px;flex-shrink:0}" +
            ".rpgc-in{flex:1;min-width:0;background:#14171e;color:#eee;border:1px solid #33394a;" +
            "border-radius:6px;padding:5px 7px;font-size:13px;outline:none}" +
            ".rpgc-in:focus{border-color:#e0603a}" +
            ".rpgc-btn{background:#3b4356;color:#fff;border:0;border-radius:6px;padding:6px 9px;" +
            "cursor:pointer;font-size:12px;white-space:nowrap}" +
            ".rpgc-btn:hover{background:#49536b}" +
            ".rpgc-btn.acc{background:#e0603a}.rpgc-btn.acc:hover{background:#f06a42}" +
            ".rpgc-btn.wide{width:100%;margin-top:2px}" +
            ".rpgc-status{font-size:11px;margin-top:8px;text-align:center}" +
            ".rpgc-ok{color:#7fd68f}.rpgc-wait{color:#e0c06a}" +
            ".rpgc-code{width:100%;height:100px;box-sizing:border-box;background:#14171e;color:#d7e1ff;" +
            "border:1px solid #33394a;border-radius:6px;padding:6px;font:12px monospace;resize:vertical;outline:none}" +
            ".rpgc-out{background:#14171e;color:#b8f0b0;border:1px solid #33394a;border-radius:6px;" +
            "padding:6px;font:11px monospace;min-height:18px;margin-top:6px;white-space:pre-wrap;word-break:break-all}" +
            ".rpgc-toggle{position:fixed;z-index:99998;right:10px;bottom:10px;width:34px;height:34px;" +
            "border:0;border-radius:50%;background:rgba(224,96,58,0.9);color:#fff;font-weight:700;font-size:15px;" +
            "cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,0.4)}" +
            ".rpgc-toggle:hover{background:#f06a42}"
        );
    }

    function el(tag, className, text) {
        var e = document.createElement(tag);
        if (className) { e.className = className; }
        if (text !== undefined) { e.textContent = text; }
        return e;
    }

    function makeInput(placeholder, initial) {
        var i = el("input", "rpgc-in");
        i.type = "text";
        i.placeholder = placeholder || "";
        if (initial !== undefined) { i.value = initial; }
        return i;
    }

    // ---------- construcción del panel ----------
    function buildPanel() {
        var style = document.createElement("style");
        style.textContent = css();
        shadow.appendChild(style);

        var btn = el("button", "rpgc-toggle", "T");
        btn.title = "Abrir/cerrar trucos (F8)";
        shadow.appendChild(btn);

        panel = el("div", "rpgc-panel");

        var head = el("div", "rpgc-head");
        var title = el("div", "rpgc-title");
        title.appendChild(el("span", null, "TRUCOS"));
        title.appendChild(el("span", "rpgc-badge", "JoyPlay"));
        head.appendChild(title);
        var x = el("button", "rpgc-x", "×");
        x.title = "Cerrar";
        head.appendChild(x);
        panel.appendChild(head);

        var tabs = el("div", "rpgc-tabs");
        var tabNames = ["General", "Objetos", "Variables", "Código"];
        var tabBtns = tabNames.map(function (t) {
            var b = el("button", "rpgc-tab", t);
            tabs.appendChild(b);
            return b;
        });
        panel.appendChild(tabs);

        var body = el("div", "rpgc-body");
        var sections = {};
        tabNames.forEach(function (t) {
            var s = el("div", "rpgc-sec");
            s.style.display = "none";
            body.appendChild(s);
            sections[t] = s;
        });
        panel.appendChild(body);

        var status = el("div", "rpgc-status rpgc-wait", "Esperando al juego...");
        body.appendChild(status);

        // --- General ---
        var g = sections["General"];
        var rowG = el("div", "rpgc-row");
        rowG.appendChild(el("span", "rpgc-label", "Oro"));
        var gGold = makeInput("cantidad", "999999");
        rowG.appendChild(gGold);
        var bGold = el("button", "rpgc-btn acc", "Añadir");
        bGold.onclick = function () { cheatGold(gGold.value); };
        rowG.appendChild(bGold);
        g.appendChild(rowG);

        var rowR = el("div", "rpgc-row");
        rowR.appendChild(el("span", "rpgc-label", ""));
        var bRecover = el("button", "rpgc-btn", "HP/MP/TP al máximo");
        bRecover.onclick = cheatRecover;
        rowR.appendChild(bRecover);
        g.appendChild(rowR);

        var rowS = el("div", "rpgc-row");
        rowS.appendChild(el("span", "rpgc-label", ""));
        var bStates = el("button", "rpgc-btn", "Quitar estados al grupo");
        bStates.onclick = cheatClearStates;
        rowS.appendChild(bStates);
        g.appendChild(rowS);

        var rowT = el("div", "rpgc-row");
        rowT.appendChild(el("span", "rpgc-label", "Teletransp."));
        var tMap = makeInput("mapa", "1");
        var tX = makeInput("X", "0");
        var tY = makeInput("Y", "0");
        rowT.appendChild(tMap);
        rowT.appendChild(tX);
        rowT.appendChild(tY);
        var bTp = el("button", "rpgc-btn acc", "Ir");
        bTp.onclick = function () { cheatTeleport(tMap.value, tX.value, tY.value); };
        rowT.appendChild(bTp);
        g.appendChild(rowT);

        // --- Objetos ---
        var o = sections["Objetos"];
        var rowO = el("div", "rpgc-row");
        rowO.appendChild(el("span", "rpgc-label", "ID objeto"));
        var oId = makeInput("ID");
        rowO.appendChild(oId);
        var oCount = makeInput("cant.", "99");
        rowO.appendChild(oCount);
        var bGive = el("button", "rpgc-btn acc", "Dar");
        bGive.onclick = function () { cheatItem(oId.value, oCount.value); };
        rowO.appendChild(bGive);
        o.appendChild(rowO);

        var bAll = el("button", "rpgc-btn wide", "Dar 99 de todos los objetos");
        bAll.onclick = cheatAllItems;
        o.appendChild(bAll);

        // --- Variables / switches ---
        var v = sections["Variables"];
        var rowV = el("div", "rpgc-row");
        rowV.appendChild(el("span", "rpgc-label", "Variable"));
        var vId = makeInput("ID");
        rowV.appendChild(vId);
        var vVal = makeInput("valor");
        rowV.appendChild(vVal);
        var bSetV = el("button", "rpgc-btn acc", "Poner");
        bSetV.onclick = function () { cheatVariable(vId.value, vVal.value); };
        rowV.appendChild(bSetV);
        v.appendChild(rowV);

        var rowSw = el("div", "rpgc-row");
        rowSw.appendChild(el("span", "rpgc-label", "Switch"));
        var sId = makeInput("ID");
        rowSw.appendChild(sId);
        var sOn = el("button", "rpgc-btn", "ON");
        sOn.onclick = function () { cheatSwitch(sId.value, true); };
        rowSw.appendChild(sOn);
        var sOff = el("button", "rpgc-btn", "OFF");
        sOff.onclick = function () { cheatSwitch(sId.value, false); };
        rowSw.appendChild(sOff);
        v.appendChild(rowSw);

        // --- Código ---
        var c = sections["Código"];
        var codeArea = el("textarea", "rpgc-code");
        codeArea.placeholder = "Ej: $gameParty._gold = 999999\n    $gameActors.actor(1).recoverAll()";
        c.appendChild(codeArea);
        var out = el("div", "rpgc-out", "");
        var bRun = el("button", "rpgc-btn acc wide", "Ejecutar");
        bRun.onclick = function () {
            out.textContent = cheatEval(codeArea.value);
        };
        c.appendChild(bRun);
        c.appendChild(out);

        // --- tabs ---
        var show = function (name) {
            tabNames.forEach(function (t) {
                sections[t].style.display = (t === name) ? "" : "none";
                tabBtns[tabNames.indexOf(t)].className = "rpgc-tab" + (t === name ? " on" : "");
            });
        };
        tabBtns.forEach(function (b, i) {
            b.onclick = function () { show(tabNames[i]); };
        });
        show("General");

        // --- drag ---
        var dragging = false, dx = 0, dy = 0;
        head.addEventListener("mousedown", function (ev) {
            dragging = true;
            dx = ev.clientX - panel.offsetLeft;
            dy = ev.clientY - panel.offsetTop;
            ev.preventDefault();
        });
        document.addEventListener("mousemove", function (ev) {
            if (dragging) {
                panel.style.left = (ev.clientX - dx) + "px";
                panel.style.top = (ev.clientY - dy) + "px";
            }
        });
        document.addEventListener("mouseup", function () { dragging = false; });

        // --- cierre / toggle ---
        x.onclick = function () { hide(); };
        btn.onclick = function () { toggle(); };

        shadow.appendChild(panel);
        showOrHide();
    }

    function show() {
        if (!panel) { buildPanel(); }
        if (panel) { panel.style.display = ""; visible = true; }
    }

    function hide() {
        if (panel) { panel.style.display = "none"; visible = false; }
    }

    function toggle() {
        if (visible) { hide(); } else { show(); }
    }

    function showOrHide() {
        if (panel) { panel.style.display = visible ? "" : "none"; }
    }

    // F8 para abrir/cerrar (ignora si escribes en un campo)
    document.addEventListener("keydown", function (ev) {
        if (ev.key === "F8" && !/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) {
            ev.preventDefault();
            toggle();
        }
    });

    // Botón flotante y estado "conectado" una vez el juego carga
    document.body.appendChild(HOST);
    var timer = window.setInterval(function () {
        var was = ready;
        refreshReady();
        if (was !== ready && !panel) {
            // buildPanel() ya se llama desde refreshReady
        }
        if (ready) {
            window.clearInterval(timer);
        }
    }, 700);
})();