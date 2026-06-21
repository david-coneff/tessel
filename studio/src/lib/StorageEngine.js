// StorageEngine — OPFS-backed key/value store with localStorage fallback.
//
// OPFS provides true per-app storage isolation scoped to the app's origin
// path (PWA) or app origin (Tauri). Falls back to localStorage on file://
// where OPFS is unavailable.
//
// Uses top-level await so the in-memory cache is fully populated before any
// importing module's own synchronous init code runs. All reads are sync
// (from cache); writes update the cache immediately and flush to disk async.
//
// Migration: on first OPFS init, all tvs: keys are copied from localStorage
// to OPFS and then removed from localStorage.

var _cache = new Map();
var _useOpfs = false;
var _opfsRoot = null;
var _saveTimer = null;

function _isOpfsAvailable() {
  return typeof navigator !== 'undefined'
    && navigator.storage
    && typeof navigator.storage.getDirectory === 'function'
    && location.protocol !== 'file:';
}

async function _load() {
  try {
    var fh = await _opfsRoot.getFileHandle('tvs-state.json');
    var file = await fh.getFile();
    var obj = JSON.parse(await file.text());
    for (var k in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, k)) _cache.set(k, obj[k]);
    }
    return true;
  } catch(e) { return false; }
}

function _scheduleSave() {
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(_flushToDisk, 300);
}

async function _flushToDisk() {
  _saveTimer = null;
  try {
    var data = JSON.stringify(Object.fromEntries(_cache));
    var fh = await _opfsRoot.getFileHandle('tvs-state.json', { create: true });
    var w = await fh.createWritable();
    await w.write(data);
    await w.close();
  } catch(e) {}
}

// One-time migration: copy all tvs: keys from localStorage to OPFS cache,
// then remove them from localStorage.
function _migrateFromLocalStorage() {
  try {
    var toRemove = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf('tvs:') === 0) {
        var v = localStorage.getItem(k);
        if (v !== null) _cache.set(k, v);
        toRemove.push(k);
      }
    }
    toRemove.forEach(function(k) { try { localStorage.removeItem(k); } catch(e) {} });
  } catch(e) {}
}

// Init — runs at module load time via top-level await.
if (_isOpfsAvailable()) {
  try {
    _opfsRoot = await navigator.storage.getDirectory();
    _useOpfs = true;
    var _loaded = await _load();
    if (!_loaded) {
      _migrateFromLocalStorage();
      await _flushToDisk();
    }
  } catch(e) {
    _useOpfs = false;
  }
}

// Sync read from in-memory cache (populated at init).
export function getItem(key) {
  if (_useOpfs) return _cache.has(key) ? _cache.get(key) : null;
  try { return localStorage.getItem(key); } catch(e) { return null; }
}

// Sync-feeling set: updates cache immediately, flushes to disk async.
export function setItem(key, value) {
  if (_useOpfs) {
    _cache.set(key, String(value));
    _scheduleSave();
    return;
  }
  try { localStorage.setItem(key, value); } catch(e) {}
}

export function removeItem(key) {
  if (_useOpfs) {
    _cache.delete(key);
    _scheduleSave();
    return;
  }
  try { localStorage.removeItem(key); } catch(e) {}
}

// Returns all stored keys, optionally filtered by prefix.
// Replaces localStorage.length / localStorage.key(i) enumeration patterns.
export function getKeys(prefix) {
  var result = [];
  if (_useOpfs) {
    _cache.forEach(function(_, k) {
      if (!prefix || k.indexOf(prefix) === 0) result.push(k);
    });
  } else {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && (!prefix || k.indexOf(prefix) === 0)) result.push(k);
      }
    } catch(e) {}
  }
  return result;
}

export var isOpfs = _useOpfs;
