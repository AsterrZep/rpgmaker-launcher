// ============================================================
//  Save Bridge - redirige el guardado web (LocalStorage/IndexedDB)
//  de RPG Maker MV/MZ a archivos reales en disco, escritos por
//  rpgmaker-server.py en la carpeta save/ de cada juego.
//
//  Inyectado automáticamente en index.html por el servidor.
//
//  Rendimiento: TODAS las lecturas se sirven desde una caché en
//  memoria y las escrituras se envían en segundo plano (async),
//  de modo que el hilo de JavaScript del juego NUNCA se bloquea
//  (el tiro clásico de los XHR síncronos desaparece).
// ============================================================
(function () {
    "use strict";

    // ---------- caché en memoria ----------
    var cache = {};
    var cacheReady = false;

    function b64decode(s) {
        try {
            return atob(s);
        } catch (e) {
            return null;
        }
    }

    function storeAll(raw) {
        try {
            var obj = JSON.parse(raw);
            for (var k in obj) {
                cache[k] = b64decode(obj[k]);
            }
        } catch (e) {
            /* ignora: sin partidas o JSON corrupto */
        }
        cacheReady = true;
    }

    // Precarga asíncrona de todas las partidas existentes.
    function loadAllAsync() {
        fetch("/__save/__all")
            .then(function (r) { return r.text(); })
            .then(storeAll)
            .catch(function () { cacheReady = true; });
    }

    // Último recurso (solo al arrancar y si la precarga aún no acabó):
    // un único XHR síncrono con el listado completo.
    function loadAllSync() {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "/__save/__all", false);
        xhr.send(null);
        if (xhr.status >= 200 && xhr.status < 300) {
            storeAll(xhr.responseText);
        } else {
            cacheReady = true;
        }
    }

    function ensureCache() {
        if (!cacheReady) {
            loadAllSync();
        }
    }

    // Lecturas: siempre desde la caché (instantáneas, sin red).
    function read(name) {
        ensureCache();
        return (name in cache) ? cache[name] : null;
    }

    // Escrituras: actualizan la caché al instante y envían la
    // petición en segundo plano (no bloquean el juego).
    function write(name, data, binary) {
        ensureCache();
        cache[name] = data;
        var body = binary ? strToBytes(data) : data;
        fetch("/__save/" + encodeURIComponent(name), {
            method: "POST",
            body: body
        }).catch(function () {});
    }

    function remove(name) {
        ensureCache();
        cache[name] = null;
        fetch("/__save/" + encodeURIComponent(name), {
            method: "DELETE"
        }).catch(function () {});
    }

    // ---------- binario (partidas MZ) ----------
    function strToBytes(s) {
        var b = new Uint8Array(s.length);
        for (var i = 0; i < s.length; i++) {
            b[i] = s.charCodeAt(i) & 0xff;
        }
        return b;
    }

    // ---------- nombres de archivo ----------
    function mvFilename(key, backup) {
        var name;
        if (key === "RPG Config") {
            name = "config";
        } else if (key === "RPG Global") {
            name = "global";
        } else {
            name = "file" + key.replace("RPG File", "");
        }
        return name + ".rpgsave" + (backup ? ".bak" : "");
    }

    function mzFilename(saveName, backup) {
        return saveName + ".rmmzsave" + (backup ? ".bak" : "");
    }

    // ---------- parcheo del motor ----------
    function applyBridge() {
        // ---------- RPG Maker MV ----------
        if (window.StorageManager && window.LZString &&
                typeof StorageManager.saveToWebStorage === "function") {
            StorageManager.saveToWebStorage = function (savefileId, json) {
                var data = LZString.compressToBase64(json);
                write(mvFilename(StorageManager.webStorageKey(savefileId), false), data);
            };
            StorageManager.loadFromWebStorage = function (savefileId) {
                var data = read(mvFilename(StorageManager.webStorageKey(savefileId), false));
                return data ? LZString.decompressFromBase64(data) : null;
            };
            StorageManager.webStorageExists = function (savefileId) {
                return read(mvFilename(StorageManager.webStorageKey(savefileId), false)) !== null;
            };
            StorageManager.removeWebStorage = function (savefileId) {
                remove(mvFilename(StorageManager.webStorageKey(savefileId), false));
            };
            StorageManager.webStorageBackupExists = function (savefileId) {
                return read(mvFilename(StorageManager.webStorageKey(savefileId), true)) !== null;
            };
            StorageManager.loadFromWebStorageBackup = function (savefileId) {
                var data = read(mvFilename(StorageManager.webStorageKey(savefileId), true));
                return data ? LZString.decompressFromBase64(data) : null;
            };
            StorageManager.removeBackup = function (savefileId) {
                remove(mvFilename(StorageManager.webStorageKey(savefileId), true));
            };
            loadAllAsync();
            return true;
        }

        // ---------- RPG Maker MZ ----------
        if (window.StorageManager &&
                typeof StorageManager.saveToForage === "function") {
            StorageManager.saveToForage = function (saveName, zip) {
                write(mzFilename(saveName, false), zip, true);
                return Promise.resolve(true);
            };
            StorageManager.loadFromForage = function (saveName) {
                return Promise.resolve(read(mzFilename(saveName, false)));
            };
            StorageManager.forageExists = function (saveName) {
                return Promise.resolve(read(mzFilename(saveName, false)) !== null);
            };
            StorageManager.removeForage = function (saveName) {
                remove(mzFilename(saveName, false));
                return Promise.resolve(true);
            };
            loadAllAsync();
            return true;
        }

        return false;
    }

    // Aplicar en cuanto StorageManager exista (puede tardar
    // hasta que terminen de cargar los scripts del motor).
    function tryApply() {
        if (applyBridge()) {
            return;
        }
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", tryApply);
        } else {
            window.setTimeout(tryApply, 100);
        }
    }

    tryApply();
})();