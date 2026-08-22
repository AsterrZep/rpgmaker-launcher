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

    // i18n mínimo del panel: español base, inglés si general.lang = "en"
    var LANG_EN = !!(window.__RPG_CONFIG__ &&
        window.__RPG_CONFIG__.general &&
        window.__RPG_CONFIG__.general.lang === "en");
    function T(es, en) {
        return (LANG_EN && en != null) ? en : es;
    }

    var HOST = document.createElement("div");
    var shadow = HOST.attachShadow({ mode: "closed" });

    // El motor (Input de rmmz) hace preventDefault de Retroceso/flechas y rompe
    // la escritura en los campos del panel: si se está tecleando aquí, se corta
    // la propagación para que el juego ni vea esas teclas.
    var typingInPanel = false;
    shadow.addEventListener("focusin", function (ev) {
        var t = ev.target;
        typingInPanel = !!(t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA"));
    });
    shadow.addEventListener("focusout", function () { typingInPanel = false; });
    ["keydown", "keyup"].forEach(function (type) {
        document.addEventListener(type, function (ev) {
            if (typingInPanel) { ev.stopPropagation(); }
        }, true);
    });

    var panel = null;
    var visible = false;
    var ready = false;

    var STATS_CAP = 999999;

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
                s.textContent = ready ? T("Conectado al juego", "Connected to game")
                                      : T("Esperando al juego...", "Waiting for game...");
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

    // Fija el oro directamente (sin cantidad => al máximo permitido)
    function cheatGoldSet(n) {
        if (!ready) { return; }
        var max = (typeof $gameParty.maxGold === "function") ? $gameParty.maxGold() : 99999999;
        n = Math.floor(Number(n));
        if (!isFinite(n) || n <= 0) { n = max; }
        $gameParty._gold = Math.min(Math.max(0, n), max);
    }

    function cheatRecover() {
        if (!ready) { return; }
        partyBattlers().forEach(function (a) {
            a.recoverAll();
        });
    }

    // Volumen global del juego (BGM/BGS/ME/SE) en caliente y persistente
    function cheatVolume(v) {
        if (!ready || typeof ConfigManager === "undefined") { return; }
        v = Math.max(0, Math.min(100, Math.floor(Number(v) || 0)));
        ConfigManager.bgmVolume = v;
        ConfigManager.bgsVolume = v;
        ConfigManager.meVolume = v;
        ConfigManager.seVolume = v;
        try {
            if (typeof AudioManager !== "undefined" &&
                    typeof AudioManager.saveBgm === "function") {
                var bgm = AudioManager.saveBgm();
                if (bgm && bgm.name) { AudioManager.playBgm(bgm); }
            }
        } catch (e) { /* sin música activa */ }
        if (typeof ConfigManager.save === "function") { ConfigManager.save(); }
    }

    function cheatMute(on) {
        cheatVolume(on ? 0 : 100);
    }

    // Batidores del grupo actual (incluye reservas)
    function partyBattlers() {
        var p = $gameParty;
        if (!p) { return []; }
        if (typeof p.allMembers === "function") { return p.allMembers(); }
        if (typeof p.members === "function") { return p.members(); }
        return [];
    }

    // MZ NO tiene removeAllStates: usa clearStates() o vacía _states a mano
    function cheatClearStates() {
        if (!ready) { return; }
        partyBattlers().forEach(function (a) {
            if (typeof a.removeAllStates === "function") {
                a.removeAllStates();
            } else if (typeof a.clearStates === "function") {
                a.clearStates();
            } else if (Array.isArray(a._states)) {
                a._states.length = 0;
            } else {
                return;
            }
            if (typeof a.refresh === "function") { a.refresh(); }
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

    function cheatGiveAll(kind, count) {
        if (!ready) { return; }
        var db = kind === "w" ? $dataWeapons : kind === "a" ? $dataArmors : $dataItems;
        if (!db) { return; }
        for (var i = 1; i < db.length; i++) {
            if (db[i] && db[i].name) { $gameParty.gainItem(db[i], count); }
        }
    }

    function cheatAllItems() {
        if (!ready) { return; }
        cheatGiveAll("i", 99);
        cheatGiveAll("w", 10);
        cheatGiveAll("a", 10);
    }

    // Recorre todos los actores con nombre del juego (incluye los aún no reclutados)
    function eachActor(fn) {
        if (!$dataActors || !$gameActors) { return 0; }
        var count = 0;
        for (var id = 1; id < $dataActors.length; id++) {
            var meta = $dataActors[id];
            if (meta && meta.name) {
                fn($gameActors.actor(id), meta);
                count++;
            }
        }
        return count;
    }

    function cheatMaxLevel() {
        if (!ready) { return; }
        eachActor(function (a) {
            try {
                if (typeof a.maxLevel === "function") { a.changeLevel(a.maxLevel(), false); }
            } catch (e) { /* actor sin clase válida */ }
        });
    }

    // Sube los 8 parámetros base al tope vía _paramPlus (persiste en la partida)
    function cheatMaxStats(cap) {
        if (!ready) { return; }
        cap = Math.floor(Number(cap)) || STATS_CAP;
        eachActor(function (a) {
            if (!Array.isArray(a._paramPlus)) { a._paramPlus = [0, 0, 0, 0, 0, 0, 0, 0]; }
            for (var p = 0; p < 8; p++) {
                a.addParam(p, Math.max(0, cap - a.param(p)));
            }
            a.recoverAll();
        });
    }

    // Skills "legítimas": iniciales del personaje + las de su clase según nivel actual.
    // Permite deshacer skills de cheat aunque la partida guardada ya las trajera.
    function legitSkillIds(a) {
        var ids = [];
        function push(id) {
            id = Number(id);
            if (id > 0 && ids.indexOf(id) < 0) { ids.push(id); }
        }
        var meta = (typeof a.actor === "function") ? a.actor() : null;
        if (meta && Array.isArray(meta.skills)) {
            meta.skills.forEach(function (s) {
                // en MZ, actor.skills es un array de IDs; aceptamos también {id:n}
                if (s && typeof s === "object") { push(s.id); } else { push(s); }
            });
        }
        var cls = (typeof a.currentClass === "function") ? a.currentClass() : null;
        if (cls && Array.isArray(cls.learnings)) {
            var lv = a._level || 1;
            cls.learnings.forEach(function (l) {
                if (l && l.skillId && l.level <= lv) { push(l.skillId); }
            });
        }
        return ids;
    }

    function cheatAllSkills() {
        if (!ready || !$dataSkills) { return; }
        eachActor(function (a) {
            if (typeof a.learnSkill !== "function") { return; }
            for (var s = 1; s < $dataSkills.length; s++) {
                var sk = $dataSkills[s];
                if (sk && sk.name && sk.id > 0) { a.learnSkill(sk.id); }
            }
        });
    }

    // Deja solo las skills legítimas (clase + nivel + iniciales) y refresca.
    // Elimina la fuente cuando una pasiva re-aplica estados constantemente.
    function cheatRestoreSkills() {
        eachActor(function (a) {
            if (!Array.isArray(a._skills)) { return; }
            var legit = legitSkillIds(a);
            var changed = a._skills.length !== legit.length;
            for (var i = 0; i < a._skills.length && !changed; i++) {
                if (legit.indexOf(a._skills[i]) < 0) { changed = true; }
            }
            if (changed) {
                a._skills = legit;
                if (typeof a.refresh === "function") { a.refresh(); }
            }
        });
    }

    // Aprender/olvidar UNA habilidad concreta en todos los personajes.
    // Sirve para pasivas como 'Fe' o 'Sentido del Peligro'.
    function cheatLearnSkill(id, on) {
        if (!ready || !$dataSkills) { return; }
        id = Math.floor(Number(id));
        if (!(id > 0)) { return; }
        eachActor(function (a) {
            if (!Array.isArray(a._skills)) { return; }
            var i = a._skills.indexOf(id);
            if (on && i < 0) {
                if (typeof a.learnSkill === "function") { a.learnSkill(id); } else { a._skills.push(id); }
                if (typeof a.refresh === "function") { a.refresh(); }
            } else if (!on && i >= 0) {
                a._skills.splice(i, 1);
                if (typeof a.refresh === "function") { a.refresh(); }
            }
        });
    }

    function knownSkillCounts() {
        var c = {};
        eachActor(function (a) {
            var arr = Array.isArray(a._skills) ? a._skills : [];
            for (var i = 0; i < arr.length; i++) { c[arr[i]] = (c[arr[i]] || 0) + 1; }
        });
        return c;
    }

    // Añade o quita un estado por ID (fuerza el añadido si el juego lo resiste;
    // al quitar usa eraseState directo para que plugins no lo re-añadan igual)
    function cheatSetState(id, on) {
        if (!ready || !$dataStates || !$dataStates[id]) { return; }
        id = Math.floor(Number(id));
        if (!(id > 0)) { return; }
        partyBattlers().forEach(function (a) {
            if (on) {
                if (typeof a.addState === "function") { a.addState(id); }
                if (typeof a.isStateAffected === "function" &&
                        !a.isStateAffected(id) &&
                        Array.isArray(a._states) &&
                        a._states.indexOf(id) < 0) {
                    a._states.push(id);
                }
                if (typeof a.refresh === "function") { a.refresh(); }
            } else {
                if (typeof a.eraseState === "function") {
                    a.eraseState(id);
                } else if (Array.isArray(a._states)) {
                    var ix = a._states.indexOf(id);
                    if (ix >= 0) { a._states.splice(ix, 1); }
                }
                if (typeof a.refresh === "function") { a.refresh(); }
            }
        });
    }

    // Todos los estados con nombre del juego (buenos Y malos)
    function cheatAllStates(on) {
        if (!ready || !$dataStates) { return; }
        if (!on) { cheatClearStates(); return; }
        for (var s = 1; s < $dataStates.length; s++) {
            var st = $dataStates[s];
            if (st && st.name && st.id > 0) { cheatSetState(st.id, true); }
        }
    }

    // Detecta los estados activos en el grupo: [{id, name, count}]
    function listActiveStates() {
        var found = {};
        partyBattlers().forEach(function (a) {
            var arr = Array.isArray(a._states) ? a._states : [];
            for (var i = 0; i < arr.length; i++) {
                var id = arr[i];
                if ($dataStates && $dataStates[id]) {
                    if (!found[id]) {
                        found[id] = { id: id, name: $dataStates[id].name, count: 0 };
                    }
                    found[id].count++;
                }
            }
        });
        return Object.keys(found)
            .map(function (k) { return found[k]; })
            .sort(function (x, y) { return x.id - y.id; });
    }

    // Botón "LO TODO": oro máximo + todo el inventario + nivel/stats/skills
    function cheatEverything() {
        cheatGoldSet(0);
        cheatAllItems();
        cheatMaxLevel();
        cheatMaxStats(STATS_CAP);
        cheatAllSkills();
        cheatRecover();
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

    // ---------- presets (cheats-presets.json del juego) ----------
    function applyAction(a) {
        var api = window.__rpg_cheats_api__;
        if (!a || !a.type) { return T("accion vacia", "empty action"); }
        try {
            switch (a.type) {
                case "gold": api.gold(a.value == null ? 0 : a.value); break;
                case "goldMax": api.goldSet(a.value); break;
                case "item": api.item(a.id, a.count == null ? 1 : a.count); break;
                case "items": api.items(); break;
                case "level": api.maxLevel(); break;
                case "stats": api.maxStats(a.cap); break;
                case "skills": api.skills(); break;
                case "heal": api.heal(); break;
                case "clearStates": api.clearStates(); break;
                case "allStates": api.allStates(true); break;
                case "tp": api.tp(a.map, a.x, a.y); break;
                case "variable": api.variable(a.id, a.value == null ? 0 : a.value); break;
                case "switch": api.switch(a.id, !!a.on); break;
                case "eval": return api.eval(a.code || "");
                default: return T("tipo desconocido: ", "unknown type: ") + a.type;
            }
            return null;
        } catch (e) {
            return e && e.message ? e.message : String(e);
        }
    }

    function applyPreset(p) {
        var errs = [], ok = 0;
        (p.actions || []).forEach(function (a) {
            var err = applyAction(a);
            if (err) { errs.push((a && a.type ? a.type : "?") + ": " + err); }
            else { ok++; }
        });
        refreshStateViews();
        refreshSkillViews();
        return T("OK (", "OK (") + ok + T(" accion/es)", " action(s)") +
            (errs.length ? T(" · errores: ", " · errors: ") + errs.join("; ") : "");
    }

    // ---------- búsqueda por nombre (objetos, variables, switches) ----------
    function gameDbs() {
        return [$dataItems, $dataWeapons, $dataArmors];
    }

    function findItem(idOrName) {
        idOrName = String(idOrName || "").trim();
        if (!idOrName) { return null; }
        var dbs = gameDbs(), i, k, db;
        var n = Number(idOrName);
        if (!isNaN(n) && n > 0 && String(n) === idOrName) {
            for (i = 0; i < dbs.length; i++) {
                db = dbs[i];
                if (db && db[n]) { return db[n]; }
            }
            return null;
        }
        for (i = 0; i < dbs.length; i++) {
            db = dbs[i];
            if (!db) { continue; }
            for (k = 1; k < db.length; k++) {
                var it = db[k];
                if (it && it.name && it.name.toLowerCase() === idOrName.toLowerCase()) {
                    return it;
                }
            }
        }
        return null;
    }

    function cheatGiveNamed(idOrName, count) {
        if (!ready) { return; }
        count = Math.floor(Number(count)) || 1;
        var item = findItem(idOrName);
        if (item) { $gameParty.gainItem(item, count); }
    }

    // Rellena un <datalist> con los nombres de todos los objetos/armas/armaduras
    function fillItemList(dl) {
        if (!dl || typeof dl === "string") { return; }
        while (dl.firstChild) { dl.removeChild(dl.firstChild); }
        var labels = [T("Objeto", "Item"), T("Arma", "Weapon"), T("Defensa", "Armor")];
        gameDbs().forEach(function (db, d) {
            if (!db) { return; }
            for (var i = 1; i < db.length; i++) {
                if (db[i] && db[i].name) {
                    var o = document.createElement("option");
                    o.value = db[i].name;
                    o.label = labels[d] + " #" + i + " — " + db[i].name;
                    dl.appendChild(o);
                }
            }
        });
    }

    // Nombres legibles de variables/switches ($dataSystem)
    function systemNames(kind) {
        return ($dataSystem && $dataSystem[kind]) ? $dataSystem[kind] : [];
    }

    function describeId(kind, id) {
        id = Math.floor(Number(id));
        var list = systemNames(kind);
        return (id > 0 && list[id]) ? list[id] : "";
    }

    // Rellena un <datalist> con los nombres de variables o switches
    function fillIdList(dl, kind) {
        if (!dl || typeof dl === "string") { return; }
        while (dl.firstChild) { dl.removeChild(dl.firstChild); }
        var list = systemNames(kind);
        for (var i = 1; i < list.length; i++) {
            if (list[i]) {
                var o = document.createElement("option");
                o.value = String(i);
                o.label = i + " — " + list[i];
                dl.appendChild(o);
            }
        }
    }

    // Algunos visores no hacen scroll de la rueda dentro del Shadow DOM: scroll manual
    function attachWheel(target) {
        if (!target || typeof target.addEventListener !== "function") { return; }
        target.addEventListener("wheel", function (ev) {
            var d = ev.deltaY;
            if (!d && typeof ev.wheelDelta === "number") { d = -ev.wheelDelta; }
            if (!d && ev.detail) { d = ev.detail * 16; }
            if (!d) { return; }
            ev.preventDefault();
            ev.stopPropagation();
            target.scrollTop += d;
        }, { passive: false });
        target.addEventListener("touchstart", function (ev) {
            target.__tY = ev.touches[0] ? ev.touches[0].clientY : null;
        }, { passive: true });
        target.addEventListener("touchmove", function (ev) {
            if (target.__tY !== null && ev.touches[0]) {
                var y = ev.touches[0].clientY;
                target.scrollTop -= (y - target.__tY);
                target.__tY = y;
                ev.preventDefault();
            }
        }, { passive: false });
        target.addEventListener("touchend", function () { target.__tY = null; });
    }

    // Dibuja en el contenedor los estados activos detectados, con botón para quitar cada uno
    function renderStatesList(container) {
        if (!container) { return; }
        while (container.firstChild) { container.removeChild(container.firstChild); }
        if (!ready) { return; }
        var list = listActiveStates();
        if (!list.length) {
            container.appendChild(el("div", "rpgc-status rpgc-ok",
                T("Sin estados activos en el grupo.", "No active states in the party.")));
            return;
        }
        list.forEach(function (s) {
            var row = el("div", "rpgc-row");
            row.style.marginBottom = "3px";
            var idLab = el("span", "rpgc-label", "#" + s.id);
            idLab.style.width = "36px";
            row.appendChild(idLab);
            var nm = el("span", "rpgc-stname",
                s.name + (s.count > 1 ? " (" + s.count + ")" : ""));
            row.appendChild(nm);
            var b = el("button", "rpgc-btn", "\u2212");
            b.title = T("Quitar este estado a todo el grupo", "Remove this state from the whole party");
            b.onclick = function () {
                cheatSetState(s.id, false);
                refreshStateViews();
            };
            row.appendChild(b);
            container.appendChild(row);
        });
    }

    // Referencias a las vistas de estado (se asignan en buildPanel)
    var stView = { list: null, cat: null, filter: "" };
    var skillView = { cat: null, filter: "" };

    function refreshStateViews() {
        renderStatesList(stView.list);
        renderStateCatalog(stView.cat, stView.filter);
    }

    function refreshSkillViews() {
        renderSkillCatalog(skillView.cat, skillView.filter);
    }

    function activeCounts() {
        var counts = {};
        partyBattlers().forEach(function (a) {
            var arr = Array.isArray(a._states) ? a._states : [];
            for (var i = 0; i < arr.length; i++) {
                counts[arr[i]] = (counts[arr[i]] || 0) + 1;
            }
        });
        return counts;
    }

    // Describe si un estado es temporal o persistente (para el tooltip)
    function describeState(st) {
        var bits = [];
        if (st.removeAtBattleEnd) { bits.push(T("se quita al terminar la batalla", "removed when battle ends")); }
        if (st.removeByWalking) { bits.push(T("se quita al caminar", "removed by walking")); }
        if (st.removeByDamage) { bits.push(T("puede quitarse por daño", "can be removed by damage")); }
        if (st.maxTurns > 0) {
            bits.push(T("dura ", "lasts ") + (st.minTurns || 1) + "-" +
                st.maxTurns + T(" turnos", " turns"));
        }
        if (st.autoReleaseByNotDamage && st.minTurns > 0) {
            bits.push("se suelta sin recibir daño en " + st.minTurns + "+" +
                (st.maxTurns || "") + " turnos");
        }
        if (!bits.length) {
            bits.push(T("persistente: solo se quita por condiciones/eventos del juego",
                "persistent: only removed by game conditions/events"));
        }
        return "#" + st.id + " — " + bits.join("; ");
    }

    // Catálogo con TODOS los estados del juego, tengan o no el grupo alguno
    function renderStateCatalog(container, filter) {
        if (!container || !ready || !$dataStates) { return; }
        while (container.firstChild) { container.removeChild(container.firstChild); }
        filter = String(filter || "").trim().toLowerCase();
        var counts = activeCounts();
        var shown = 0;
        for (var id = 1; id < $dataStates.length; id++) {
            var st = $dataStates[id];
            if (!st || !st.name) { continue; }
            if (filter &&
                    st.name.toLowerCase().indexOf(filter) < 0 &&
                    String(id).indexOf(filter) !== 0) {
                continue;
            }
            shown++;
            var row = el("div", "rpgc-row");
            row.style.marginBottom = "3px";
            var lab = el("span", "rpgc-label", "#" + id);
            lab.style.width = "36px";
            row.appendChild(lab);
            var cnt = counts[id] ? " (" + counts[id] + ")" : "";
            var nm = el("span", "rpgc-stname", st.name + cnt);
            nm.title = describeState(st);
            if (counts[id]) { nm.style.color = "#7fd68f"; }
            row.appendChild(nm);
            (function (stateId, cont, f) {
                var bAdd = el("button", "rpgc-btn", "+");
                bAdd.title = T("Añadir este estado al grupo actual", "Add this state to current party");
                bAdd.onclick = function () {
                    cheatSetState(stateId, true);
                    refreshStateViews();
                };
                row.appendChild(bAdd);
                var bDel = el("button", "rpgc-btn", "\u2212");
                bDel.title = T("Quitar este estado", "Remove this state");
                bDel.onclick = function () {
                    cheatSetState(stateId, false);
                    refreshStateViews();
                };
                row.appendChild(bDel);
            })(id, container, filter);
            container.appendChild(row);
        }
        if (!shown) {
            container.appendChild(el("div", "rpgc-status rpgc-wait",
                T("Sin resultados. (Si buscas un indicador como 'Fe' y no está aquí, " +
                "no es un estado del motor: mira la pestaña Variables/Switches.)",
                "No results. (If you are looking for an indicator like 'Faith' and " +
                "it is not here, it is not an engine state: check Variables/Switches.)")));
        }
    }

    // Catálogo de TODAS las habilidades del juego, aprendidas o no
    function renderSkillCatalog(container, filter) {
        if (!container || !ready || !$dataSkills) { return; }
        while (container.firstChild) { container.removeChild(container.firstChild); }
        filter = String(filter || "").trim().toLowerCase();
        var counts = knownSkillCounts();
        var shown = 0;
        for (var id = 1; id < $dataSkills.length; id++) {
            var sk = $dataSkills[id];
            if (!sk || !sk.name || !(sk.id > 0)) { continue; }
            if (filter &&
                    sk.name.toLowerCase().indexOf(filter) < 0 &&
                    String(id).indexOf(filter) !== 0) {
                continue;
            }
            shown++;
            var row = el("div", "rpgc-row");
            row.style.marginBottom = "3px";
            var lab = el("span", "rpgc-label", "#" + id);
            lab.style.width = "36px";
            row.appendChild(lab);
            var cnt = counts[sk.id] ? " (" + counts[sk.id] + ")" : "";
            var nm = el("span", "rpgc-stname", sk.name + cnt);
            nm.title = "#" + sk.id + (counts[sk.id]
                ? T(" — la conocen ", " — known by ") + counts[sk.id] +
                  T(" personaje(s)", " character(s)")
                : T(" — nadie la conoce", " — nobody knows it"));
            if (counts[sk.id]) { nm.style.color = "#7fd68f"; }
            row.appendChild(nm);
            (function (sid) {
                var bAdd = el("button", "rpgc-btn", "+");
                bAdd.title = T("Aprender en todos los personajes", "Learn on all characters");
                bAdd.onclick = function () { cheatLearnSkill(sid, true); refreshSkillViews(); };
                row.appendChild(bAdd);
                var bDel = el("button", "rpgc-btn", "\u2212");
                bDel.title = T("Olvidar en todos los personajes", "Unlearn on all characters");
                bDel.onclick = function () { cheatLearnSkill(sid, false); refreshSkillViews(); };
                row.appendChild(bDel);
            })(sk.id);
            container.appendChild(row);
        }
        if (!shown) {
            container.appendChild(el("div", "rpgc-status rpgc-wait", T("Sin resultados.", "No results.")));
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
            ".rpgc-body{padding:10px;height:auto;max-height:min(430px,65vh);overflow:auto}" +
            ".rpgc-body::-webkit-scrollbar,.rpgc-stlist::-webkit-scrollbar{width:9px}" +
            ".rpgc-body::-webkit-scrollbar-thumb,.rpgc-stlist::-webkit-scrollbar-thumb{" +
            "background:#3a4152;border-radius:5px}" +
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
            ".rpgc-stlist{background:#14171e;border:1px solid #33394a;border-radius:6px;" +
            "max-height:110px;overflow:auto;padding:4px 6px;margin-bottom:8px}" +
            ".rpgc-stname{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px}" +
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
        btn.title = T("Abrir/cerrar trucos (", "Toggle cheats (") + configKey("trucos", "F8") + ")";
        shadow.appendChild(btn);

        panel = el("div", "rpgc-panel");

        var head = el("div", "rpgc-head");
        var title = el("div", "rpgc-title");
        title.appendChild(el("span", null, T("TRUCOS", "CHEATS")));
        title.appendChild(el("span", "rpgc-badge", "JoyPlay"));
        head.appendChild(title);
        var x = el("button", "rpgc-x", "×");
        x.title = "Cerrar";
        head.appendChild(x);
        panel.appendChild(head);

        var tabs = el("div", "rpgc-tabs");
        var presetsData = (window.__RPG_CHEATS_PRESETS__ &&
            window.__RPG_CHEATS_PRESETS__.presets) || [];
        var hasPresets = presetsData.length > 0;
        var TABS = [
            { key: "General",   label: T("General", "General") },
            { key: "Objetos",   label: T("Objetos", "Items") },
            { key: "Grupo",     label: T("Grupo", "Party") },
            { key: "Variables", label: "Variables" }
        ];
        if (hasPresets) { TABS.push({ key: "Presets", label: "Presets" }); }
        TABS.push({ key: "Código", label: T("Código", "Code") });
        var tabNames = TABS.map(function (t) { return t.key; });
        var tabLabels = {};
        TABS.forEach(function (t) { tabLabels[t.key] = t.label; });
        var tabBtns = tabNames.map(function (k) {
            var b = el("button", "rpgc-tab", tabLabels[k]);
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
        attachWheel(body);

        var status = el("div", "rpgc-status rpgc-wait", "Esperando al juego...");
        body.appendChild(status);

        // --- General ---
        var g = sections["General"];
        var rowG = el("div", "rpgc-row");
        rowG.appendChild(el("span", "rpgc-label", T("Oro", "Gold")));
        var gGold = makeInput(T("cantidad", "amount"), "999999");
        rowG.appendChild(gGold);
        var bGold = el("button", "rpgc-btn acc", T("Añadir", "Add"));
        bGold.onclick = function () { cheatGold(gGold.value); };
        rowG.appendChild(bGold);
        var bGoldMax = el("button", "rpgc-btn", "MAX");
        bGoldMax.title = T("Deja el oro al máximo permitido por el juego",
            "Sets gold to the maximum allowed by the game");
        bGoldMax.onclick = function () { cheatGoldSet(0); };
        rowG.appendChild(bGoldMax);
        g.appendChild(rowG);

        var rowTodo = el("div", "rpgc-row");
        var bTodo = el("button", "rpgc-btn acc wide",
            T("LO TODO: oro, objetos, nivel, stats y skills",
              "EVERYTHING: gold, items, level, stats & skills"));
        bTodo.title = T("Oro máximo + 99 objetos + 10 armas/armaduras + nivel y stats al tope " +
            "+ todas las habilidades. NO añade estados (para eso, pestaña Grupo).",
            "Max gold + 99 items + 10 weapons/armors + max level & stats " +
            "+ all skills. Does NOT add states (see Party tab).");
        bTodo.onclick = cheatEverything;
        rowTodo.appendChild(bTodo);
        g.appendChild(rowTodo);

        var rowR = el("div", "rpgc-row");
        rowR.appendChild(el("span", "rpgc-label", ""));
        var bRecover = el("button", "rpgc-btn", T("HP/MP/TP al máximo", "Full HP/MP/TP"));
        bRecover.onclick = cheatRecover;
        rowR.appendChild(bRecover);
        g.appendChild(rowR);

        var rowS = el("div", "rpgc-row");
        rowS.appendChild(el("span", "rpgc-label", ""));
        var bStates = el("button", "rpgc-btn", T("Quitar estados al grupo", "Clear party states"));
        bStates.onclick = cheatClearStates;
        rowS.appendChild(bStates);
        g.appendChild(rowS);

        var rowVol = el("div", "rpgc-row");
        rowVol.appendChild(el("span", "rpgc-label", T("Volumen", "Volume")));
        [0, 25, 50, 75, 100].forEach(function (vv) {
            var bv = el("button", "rpgc-btn",
                vv === 0 ? T("Mute", "Mute") : vv + "%");
            bv.onclick = function () { cheatVolume(vv); };
            rowVol.appendChild(bv);
        });
        g.appendChild(rowVol);

        var rowT = el("div", "rpgc-row");
        rowT.appendChild(el("span", "rpgc-label", T("Teletransp.", "Teleport")));
        var tMap = makeInput("mapa", "1");
        var tX = makeInput("X", "0");
        var tY = makeInput("Y", "0");
        rowT.appendChild(tMap);
        rowT.appendChild(tX);
        rowT.appendChild(tY);
        var bTp = el("button", "rpgc-btn acc", T("Ir", "Go"));
        bTp.onclick = function () { cheatTeleport(tMap.value, tX.value, tY.value); };
        rowT.appendChild(bTp);
        g.appendChild(rowT);

        // --- Objetos ---
        var o = sections["Objetos"];
        var dlItems = document.createElement("datalist");
        dlItems.id = "rpgc-items-list";
        shadow.appendChild(dlItems);

        var rowO = el("div", "rpgc-row");
        rowO.appendChild(el("span", "rpgc-label", T("Objeto", "Item")));
        var oId = makeInput(T("nombre o ID", "name or ID"));
        oId.setAttribute("list", dlItems.id);
        rowO.appendChild(oId);
        var oCount = makeInput(T("cant.", "qty"), "99");
        rowO.appendChild(oCount);
        var bGive = el("button", "rpgc-btn acc", T("Dar", "Give"));
        bGive.onclick = function () { cheatGiveNamed(oId.value, oCount.value); };
        rowO.appendChild(bGive);
        o.appendChild(rowO);

        var oHint = el("div", "rpgc-status rpgc-wait", "");
        oHint.style.textAlign = "left";
        oId.addEventListener("input", function () {
            var it = findItem(oId.value);
            if (it) {
                oHint.textContent = "#" + it.id + " — " + it.name;
                oHint.className = "rpgc-status rpgc-ok";
            } else {
                oHint.textContent = "";
            }
        });

        var mkWideBtn = function (txt, fn, acc) {
            var b = el("button", "rpgc-btn wide" + (acc ? " acc" : ""), txt);
            b.onclick = fn;
            return b;
        };
        o.appendChild(mkWideBtn(T("Dar 99 de TODOS los objetos", "Give 99 of ALL items"),
            cheatGiveAll.bind(null, "i", 99)));
        o.appendChild(mkWideBtn(T("Dar 10 de todas las ARMAS", "Give 10 of ALL weapons"),
            cheatGiveAll.bind(null, "w", 10)));
        o.appendChild(mkWideBtn(T("Dar 10 de todas las DEFENSAS", "Give 10 of ALL armors"),
            cheatGiveAll.bind(null, "a", 10)));
        o.appendChild(mkWideBtn(T("Dar TODO (objetos + armas + defensas)",
            "Give EVERYTHING (items + weapons + armors)"), cheatAllItems));

        // --- Grupo ---
        var gr = sections["Grupo"];
        var grNote = el("div", "rpgc-status rpgc-ok",
            T("Aplica a todos los personajes con nombre (incluye futuros reclutas).",
              "Applies to every named character (includes future recruits)."));
        grNote.style.textAlign = "left";
        gr.appendChild(grNote);

        var rowLv = el("div", "rpgc-row");
        rowLv.appendChild(el("span", "rpgc-label", T("Nivel", "Level")));
        var bLv = el("button", "rpgc-btn acc", T("Nivel MAX", "Level MAX"));
        bLv.onclick = cheatMaxLevel;
        rowLv.appendChild(bLv);
        gr.appendChild(rowLv);

        var rowSt = el("div", "rpgc-row");
        rowSt.appendChild(el("span", "rpgc-label", T("Stats", "Stats")));
        var stCap = makeInput(T("tope", "cap"), String(STATS_CAP));
        rowSt.appendChild(stCap);
        var bSt = el("button", "rpgc-btn acc", T("Stats MAX", "Stats MAX"));
        bSt.title = T("MHP, MMP, ATK, DEF, MAT, MDF, AGI y LUK al tope",
            "Maxes out MHP, MMP, ATK, DEF, MAT, MDF, AGI and LUK");
        bSt.onclick = function () { cheatMaxStats(stCap.value); };
        rowSt.appendChild(bSt);
        gr.appendChild(rowSt);

        var rowSk = el("div", "rpgc-row");
        rowSk.appendChild(el("span", "rpgc-label", "Skills"));
        var bSk = el("button", "rpgc-btn acc", "Aprender todas");
        bSk.onclick = cheatAllSkills;
        rowSk.appendChild(bSk);
        gr.appendChild(rowSk);

        // Catálogo de habilidades: aprender/olvidar cualquiera individualmente.
        // Aquí viven las pasivas tipo 'Fe' o 'Sentido del Peligro'.
        var rowSkC = el("div", "rpgc-row");
        rowSkC.appendChild(el("span", "rpgc-label", T("Habilidad", "Skill")));
        var skFilter = makeInput(T("buscar habilidad o ID...", "search skill or ID..."));
        skFilter.style.flex = "1";
        rowSkC.appendChild(skFilter);
        gr.appendChild(rowSkC);

        var skList = el("div", "rpgc-stlist");
        skList.style.maxHeight = "150px";
        gr.appendChild(skList);
        attachWheel(skList);
        skillView.cat = skList;
        skFilter.addEventListener("input", function () {
            skillView.filter = skFilter.value;
            renderSkillCatalog(skList, skillView.filter);
        });
        renderSkillCatalog(skList, "");

        // --- Estados ---
        var stWarn = el("div", "rpgc-status rpgc-wait",
            T("\u26A0 Añadir TODOS incluye también los estados malos (veneno, " +
            "maldiciones, muerte...). Si al quitarlos vuelven a aparecer, usa abajo " +
            "'Deshacer skills del cheat + limpiar estados'.",
            "\u26A0 Add ALL also includes bad states (poison, curses, death...). " +
            "If they keep coming back, use 'Undo cheat skills + clear states' below."));
        stWarn.style.textAlign = "left";
        gr.appendChild(stWarn);

        var rowEst = el("div", "rpgc-row");
        rowEst.appendChild(el("span", "rpgc-label", T("Estados", "States")));
        var bEstOn = el("button", "rpgc-btn", T("Añadir TODOS \u26A0", "Add ALL \u26A0"));
        bEstOn.title = T("Añade al grupo todos los estados del juego, incluidos los negativos",
            "Adds every state in the game to the party, including negative ones");
        bEstOn.onclick = function () { cheatAllStates(true); refreshStateViews(); };
        rowEst.appendChild(bEstOn);
        var bEstOff = el("button", "rpgc-btn acc", T("Quitar TODOS", "Remove ALL"));
        bEstOff.title = T("Quita todos los estados activos del grupo",
            "Removes all active states from the party");
        bEstOff.onclick = function () { cheatAllStates(false); refreshStateViews(); };
        rowEst.appendChild(bEstOff);
        gr.appendChild(rowEst);

        var rowEst1 = el("div", "rpgc-row");
        rowEst1.appendChild(el("span", "rpgc-label", T("Estado ID", "State ID")));
        var estId = makeInput("ID");
        rowEst1.appendChild(estId);
        var bEst1On = el("button", "rpgc-btn", "+");
        bEst1On.title = T("Añadir este estado", "Add this state");
        bEst1On.onclick = function () { cheatSetState(estId.value, true); refreshStateViews(); };
        rowEst1.appendChild(bEst1On);
        var bEst1Off = el("button", "rpgc-btn", "\u2212");
        bEst1Off.title = T("Quitar este estado", "Remove this state");
        bEst1Off.onclick = function () { cheatSetState(estId.value, false); refreshStateViews(); };
        rowEst1.appendChild(bEst1Off);
        gr.appendChild(rowEst1);

        var rowStLst = el("div", "rpgc-row");
        rowStLst.appendChild(el("span", "rpgc-label", T("Activos", "Active")));
        var bRefL = el("button", "rpgc-btn", T("Actualizar lista", "Refresh list"));
        bRefL.onclick = function () { refreshStateViews(); };
        rowStLst.appendChild(bRefL);
        gr.appendChild(rowStLst);

        // Listado en vivo de los estados que tiene ahora mismo el grupo
        var stList = el("div", "rpgc-stlist");
        gr.appendChild(stList);
        attachWheel(stList);
        stView.list = stList;
        renderStatesList(stList);

        // Catálogo completo: todos los estados del juego, activos o no
        var rowCat = el("div", "rpgc-row");
        rowCat.appendChild(el("span", "rpgc-label", T("Catálogo", "Catalog")));
        var catFilter = makeInput(T("buscar estado o ID...", "search state or ID..."));
        catFilter.style.flex = "1";
        rowCat.appendChild(catFilter);
        gr.appendChild(rowCat);

        var catList = el("div", "rpgc-stlist");
        catList.style.maxHeight = "150px";
        gr.appendChild(catList);
        attachWheel(catList);
        stView.cat = catList;
        catFilter.addEventListener("input", function () {
            stView.filter = catFilter.value;
            renderStateCatalog(catList, stView.filter);
        });
        renderStateCatalog(catList, "");

        var bUndoSk = el("button", "rpgc-btn wide",
            T("Deshacer skills del cheat + limpiar estados",
              "Undo cheat skills + clear states"));
        bUndoSk.title = T("Deja cada personaje solo con sus habilidades legítimas " +
            "(iniciales + las de su clase según el nivel actual) y limpia todos los estados. " +
            "Úsalo si los estados vuelven a aparecer: normalmente los re-aplica alguna " +
            "habilidad pasiva ganada con 'Aprender todas' o 'LO TODO', incluso en " +
            "partidas guardadas anteriormente.",
            "Leaves each character with only their legitimate skills (initial ones " +
            "+ class learnings up to current level) and clears all states. Use it if " +
            "states keep coming back: usually a passive learned via 'Learn all' or " +
            "'EVERYTHING' re-applies them, even in previously saved games.");
        bUndoSk.onclick = function () {
            cheatRestoreSkills();
            cheatClearStates();
            refreshStateViews();
        };
        gr.appendChild(bUndoSk);

        // --- Variables / switches ---
        var v = sections["Variables"];
        var dlVars = document.createElement("datalist");
        dlVars.id = "rpgc-vars-list";
        shadow.appendChild(dlVars);
        var dlSw = document.createElement("datalist");
        dlSw.id = "rpgc-sw-list";
        shadow.appendChild(dlSw);
        fillIdList(dlVars, "variables");
        fillIdList(dlSw, "switches");
        fillItemList(dlItems);

        var rowV = el("div", "rpgc-row");
        rowV.appendChild(el("span", "rpgc-label", T("Variable", "Variable")));
        var vId = makeInput(T("nombre/ID", "name/ID"));
        vId.setAttribute("list", dlVars.id);
        rowV.appendChild(vId);
        var vVal = makeInput(T("valor", "value"));
        rowV.appendChild(vVal);
        var bSetV = el("button", "rpgc-btn acc", T("Poner", "Set"));
        bSetV.onclick = function () { cheatVariable(vId.value, vVal.value); };
        rowV.appendChild(bSetV);
        v.appendChild(rowV);

        var vHint = el("div", "rpgc-status rpgc-wait", "");
        vHint.style.textAlign = "left";
        vId.addEventListener("input", function () {
            var n = Number(vId.value);
            if (!isNaN(n) && n > 0) {
                var name = describeId("variables", n);
                vHint.textContent = name ? "#" + n + " — " + name : "#" + n;
            } else {
                vHint.textContent = "";
            }
        });

        var rowSw = el("div", "rpgc-row");
        rowSw.appendChild(el("span", "rpgc-label", "Switch"));
        var sId = makeInput(T("nombre/ID", "name/ID"));
        sId.setAttribute("list", dlSw.id);
        rowSw.appendChild(sId);
        var sOn = el("button", "rpgc-btn", "ON");
        sOn.onclick = function () { cheatSwitch(sId.value, true); };
        rowSw.appendChild(sOn);
        var sOff = el("button", "rpgc-btn", "OFF");
        sOff.onclick = function () { cheatSwitch(sId.value, false); };
        rowSw.appendChild(sOff);
        v.appendChild(rowSw);

        var swHint = el("div", "rpgc-status rpgc-wait", "");
        swHint.style.textAlign = "left";
        sId.addEventListener("input", function () {
            var n = Number(sId.value);
            if (!isNaN(n) && n > 0) {
                var name = describeId("switches", n);
                swHint.textContent = name ? "#" + n + " — " + name : "#" + n;
            } else {
                swHint.textContent = "";
            }
        });

        // --- Presets (definidos en cheats-presets.json del juego) ---
        if (hasPresets) {
            var pr = sections["Presets"];
            var prNote = el("div", "rpgc-status rpgc-ok",
                T("Presets definidos para este juego (cheats-presets.json).",
                  "Presets defined for this game (cheats-presets.json)."));
            prNote.style.textAlign = "left";
            pr.appendChild(prNote);
            var prOut = el("div", "rpgc-out", "");
            presetsData.forEach(function (p, pi) {
                var b = el("button", "rpgc-btn wide" + (pi % 2 ? "" : " acc"),
                    p.name || ("Preset " + (pi + 1)));
                b.title = p.desc || T("Aplica las acciones definidas para este juego",
                    "Applies the actions defined for this game");
                b.onclick = function () { prOut.textContent = applyPreset(p); };
                pr.appendChild(b);
            });
            pr.appendChild(prOut);
        }

        // --- Código ---
        var c = sections["Código"];
        var codeArea = el("textarea", "rpgc-code");
        codeArea.placeholder = T(
            "Ej: $gameParty._gold = 999999\n    $gameActors.actor(1).recoverAll()",
            "E.g.: $gameParty._gold = 999999\n    $gameActors.actor(1).recoverAll()");
        c.appendChild(codeArea);
        var out = el("div", "rpgc-out", "");
        var bRun = el("button", "rpgc-btn acc wide", T("Ejecutar", "Run"));
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
            b.onclick = function () {
                show(tabNames[i]);
                if (tabNames[i] === "Grupo") {
                    refreshStateViews();
                    refreshSkillViews();
                }
            };
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

    // Tecla configurable (viene de /__config.js -> window.__RPG_CONFIG__)
    function configKey(action, fallback) {
        var t = (window.__RPG_CONFIG__ && window.__RPG_CONFIG__.teclas) || {};
        return t[action] || fallback;
    }

    function matchKey(ev, combo) {
        if (!combo) { return false; }
        var parts = String(combo).split("+");
        var key = parts.pop().toLowerCase();
        var wantCtrl = parts.some(function (m) { return /^(ctrl|control)$/i.test(m); });
        var wantShift = parts.some(function (m) { return /^shift$/i.test(m); });
        var wantAlt = parts.some(function (m) { return /^alt$/i.test(m); });
        var k = (ev.key || "").toLowerCase();
        var alias = { "equal": "=", "plus": "+", "minus": "-" };
        var k2 = alias[k] || k;
        var keyMatch = k2 === key ||
            (key === "equal" && k2 === "=") ||
            (key === "minus" && k2 === "-") ||
            (key === "plus" && k2 === "+");
        return keyMatch &&
            !!ev.ctrlKey === wantCtrl &&
            !!ev.shiftKey === wantShift &&
            !!ev.altKey === wantAlt;
    }

    // Abrir/cerrar con la tecla configurada (ignora si escribes en un campo)
    document.addEventListener("keydown", function (ev) {
        var tag = document.activeElement && document.activeElement.tagName;
        if (/^(INPUT|TEXTAREA)$/.test(tag || "")) { return; }
        if (matchKey(ev, configKey("trucos", "F8"))) {
            ev.preventDefault();
            toggle();
        }
    });

    // Expuesto para los atajos del navegador / diagnóstico
    window.__rpg_cheats_toggle__ = toggle;
    window.__rpg_cheats_ready__ = function () { return ready; };

    // API programática (útil desde consola o desde otros scripts)
    window.__rpg_cheats_api__ = {
        gold: cheatGold,
        goldSet: cheatGoldSet,
        heal: cheatRecover,
        item: function (id, n) { var it = findItem(id); if (it) { $gameParty.gainItem(it, Math.floor(Number(n)) || 1); } },
        items: cheatAllItems,
        maxLevel: cheatMaxLevel,
        maxStats: cheatMaxStats,
        skills: cheatAllSkills,
        all: cheatEverything,
        variable: cheatVariable,
        switch: cheatSwitch,
        tp: cheatTeleport,
        eval: cheatEval,
        findItem: findItem,
        setState: cheatSetState,
        allStates: cheatAllStates,
        clearStates: cheatClearStates,
        listStates: listActiveStates,
        restoreSkills: cheatRestoreSkills,
        learnSkill: cheatLearnSkill
    };

    // Montaje al final del body (los scripts del servidor se inyectan en <head>)
    function mount() {
        if (!document.body) {
            document.addEventListener("DOMContentLoaded", mount);
            return;
        }
        document.body.appendChild(HOST);
        var timer = window.setInterval(function () {
            refreshReady();
            if (ready) {
                window.clearInterval(timer);
            }
        }, 700);
    }
    mount();
})();