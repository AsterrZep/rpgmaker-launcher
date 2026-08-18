// ============================================================
//  Save Bridge - redirige el guardado web (LocalStorage/IndexedDB)
//  de RPG Maker MV/MZ a archivos reales en disco, escritos por
//  rpgmaker-server.py en la carpeta save/ de cada juego.
//
//  Inyectado automáticamente en index.html por el servidor.
// ============================================================
(function () {
    "use strict";

    // ---------- utilidades de red ----------
    function xhrSync(method, name, body) {
        var xhr = new XMLHttpRequest();
        xhr.open(method, "/__save/" + encodeURIComponent(name), false);
        xhr.setRequestHeader("Content-Type", "text/plain");
        xhr.send(body === undefined ? null : body);
        if (xhr.status >= 200 && xhr.status < 300) {
            return xhr.responseText;
        }
        return null;
    }

    function fetchAsync(method, name, body) {
        return fetch("/__save/" + encodeURIComponent(name), {
            method: method,
            body: body === undefined ? undefined : body
        });
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

    function applyBridge() {
        // ---------- RPG Maker MV ----------
        if (window.StorageManager && window.LZString &&
                typeof StorageManager.saveToWebStorage === "function") {
            StorageManager.saveToWebStorage = function (savefileId, json) {
                var data = LZString.compressToBase64(json);
                var key = StorageManager.webStorageKey(savefileId);
                xhrSync("POST", mvFilename(key, false), data);
            };
            StorageManager.loadFromWebStorage = function (savefileId) {
                var key = StorageManager.webStorageKey(savefileId);
                var data = xhrSync("GET", mvFilename(key, false));
                return data ? LZString.decompressFromBase64(data) : null;
            };
            StorageManager.webStorageExists = function (savefileId) {
                var key = StorageManager.webStorageKey(savefileId);
                return xhrSync("GET", mvFilename(key, false)) !== null;
            };
            StorageManager.removeWebStorage = function (savefileId) {
                var key = StorageManager.webStorageKey(savefileId);
                xhrSync("DELETE", mvFilename(key, false));
            };
            StorageManager.webStorageBackupExists = function (savefileId) {
                var key = StorageManager.webStorageKey(savefileId);
                return xhrSync("GET", mvFilename(key, true)) !== null;
            };
            StorageManager.loadFromWebStorageBackup = function (savefileId) {
                var key = StorageManager.webStorageKey(savefileId);
                var data = xhrSync("GET", mvFilename(key, true));
                return data ? LZString.decompressFromBase64(data) : null;
            };
            StorageManager.removeBackup = function (savefileId) {
                var key = StorageManager.webStorageKey(savefileId);
                xhrSync("DELETE", mvFilename(key, true));
            };
            return true;
        }

        // ---------- RPG Maker MZ ----------
        if (window.StorageManager &&
                typeof StorageManager.saveToForage === "function") {
            StorageManager.saveToForage = function (saveName, zip) {
                return fetchAsync("POST", mzFilename(saveName, false), zip)
                    .then(function () { return true; });
            };
            StorageManager.loadFromForage = function (saveName) {
                return fetchAsync("GET", mzFilename(saveName, false))
                    .then(function (resp) {
                        if (resp.ok) { return resp.text(); }
                        return null;
                    });
            };
            StorageManager.forageExists = function (saveName) {
                return fetchAsync("GET", mzFilename(saveName, false))
                    .then(function (resp) { return resp.ok; });
            };
            StorageManager.removeForage = function (saveName) {
                return fetchAsync("DELETE", mzFilename(saveName, false))
                    .then(function () { return true; });
            };
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