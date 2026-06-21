import * as StorageEngine from './StorageEngine.js';
import { parseMd as TesselParseMd, blocksToHtml, buildPage as TesselBuildPage } from './TesselCompiler.js';
import { uid } from './utils.js';
import { saveUndoHistory, loadUndoHistory, updateUndoButtons } from './undo.js';

var _deps = {};

export function initFileOps(deps) { _deps = deps; }

export function isPersistUndo() {
  try { return StorageEngine.getItem('tvs:opts:persist-undo') === '1'; } catch(e) { return false; }
}

var _statusTimer = null;
export function setStatus(msg) {
  document.getElementById('status-bar').textContent = msg;
  if (_statusTimer) clearTimeout(_statusTimer);
  _statusTimer = setTimeout(function() { document.getElementById('status-bar').textContent = 'Ready'; }, 4000);
}

export function markUnsaved() { _deps.setUnsaved(true); setStatus('Unsaved changes'); }

export function saveDraft() {
  try {
    var payload = { blocks: _deps.getBlocks() };
    if (isPersistUndo()) { var _uh = saveUndoHistory(); payload.undoStack = _uh.undoStack; payload.redoStack = _uh.redoStack; }
    StorageEngine.setItem('tvs:draft', JSON.stringify(payload));
  } catch(e) {}
  _deps.setUnsaved(false);
  setStatus('Draft saved');
}

export function loadDraft() {
  try {
    var raw = StorageEngine.getItem('tvs:draft');
    if (!raw) return;
    var payload = JSON.parse(raw);
    if (Array.isArray(payload)) {
      _deps.setBlocks(payload);
    } else {
      _deps.setBlocks(payload.blocks || []);
      if (payload.undoStack) { loadUndoHistory(payload.undoStack, payload.redoStack); }
    }
    _deps.renderCanvas();
    updateUndoButtons();
    setStatus('Draft restored');
  } catch(e) {}
  try { var fn = StorageEngine.getItem('tvs:filename'); if (fn) _deps.setFilename(fn); } catch(e) {}
}

export function flatBlockList(arr) {
  var result = [];
  arr.forEach(function(b) {
    result.push(b);
    if (b.type === 'section' && b.children) result = result.concat(flatBlockList(b.children));
  });
  return result;
}

export function openMd(file) {
  _deps.setFilename(file.name.replace(/\.md$/i, ''));
  try { StorageEngine.setItem('tvs:filename', _deps.getFilename()); } catch(e) {}
  var rd = new FileReader();
  rd.onload = function(e) {
    try {
      _deps.setBlocks(TesselParseMd(e.target.result));
      _deps.setSelectedBlockId(null);
      _deps.renderCanvas(); _deps.renderProps();
      _deps.setUnsaved(false);
      saveDraft();
      setStatus('Opened ' + file.name);
    } catch(ex) { setStatus('Error parsing file: ' + ex.message); }
  };
  rd.readAsText(file);
}

export function openHtml(file) {
  _deps.setFilename(file.name.replace(/\.html?$/i, ''));
  try { StorageEngine.setItem('tvs:filename', _deps.getFilename()); } catch(e) {}
  var rd = new FileReader();
  rd.onload = function(ev) {
    var html = ev.target.result;
    var m = html.match(/<script[^>]+type="text\/tessel-source"[^>]*data-encoding="base64"[^>]*>([\s\S]*?)<\/script>/i)
           || html.match(/<script[^>]+data-encoding="base64"[^>]+type="text\/tessel-source"[^>]*>([\s\S]*?)<\/script>/i);
    if (!m) { setStatus('No tessel source found in this HTML file.'); return; }
    try {
      var raw = decodeURIComponent(escape(atob(m[1].trim())));
      var parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        _deps.setBlocks(parsed.map(function(b) { b.id = b.id || uid(); return b; }));
      } else {
        _deps.setBlocks(TesselParseMd(raw));
      }
      _deps.setSelectedBlockId(null);
      _deps.renderCanvas(); _deps.renderProps();
      _deps.setUnsaved(false);
      saveDraft();
      setStatus('Opened ' + file.name);
    } catch(ex) { setStatus('Error: ' + ex.message); }
  };
  rd.readAsText(file);
}

export function getCustomFontFaceCSS() {
  var css = '';
  var prefix = 'tvs:font:';
  try {
    StorageEngine.getKeys(prefix).forEach(function(k) {
      var d = JSON.parse(StorageEngine.getItem(k));
      css += '@font-face { font-family: "' + d.family + '"; src: url("' + d.dataUrl + '") format("' + d.format + '"); }\n';
    });
  } catch(e) {}
  return css;
}

export function getCompiledHtml() {
  var bodyHtml = blocksToHtml(_deps.getBlocks());
  var srcB64 = '';
  try { srcB64 = btoa(unescape(encodeURIComponent(JSON.stringify(_deps.getBlocks())))); } catch(e) {}
  var extraCss = '';
  try {
    if (StorageEngine.getItem('tvs:opts:embed-fonts') === '1') {
      var fc = getCustomFontFaceCSS();
      if (fc) extraCss = fc;
    }
  } catch(e) {}
  return TesselBuildPage(bodyHtml, { title: _deps.getFilename(), extraCss: extraCss, sourceB64: srcB64 });
}

export function saveFile(fname, content, mimeType, lsKey) {
  var mode = (function(){ try { return StorageEngine.getItem(lsKey) || 'picker'; } catch(e) { return 'picker'; } })();
  if (mode === 'picker' && window.showSaveFilePicker) {
    var ext = fname.split('.').pop().toLowerCase();
    var typeMap = { html: 'text/html', md: 'text/markdown', json: 'application/json', zip: 'application/zip' };
    window.showSaveFilePicker({
      suggestedName: fname,
      types: [{ description: fname, accept: { [typeMap[ext] || mimeType]: ['.' + ext] } }]
    }).then(function(fh) {
      return fh.createWritable().then(function(w) {
        return w.write(content).then(function() { return w.close(); });
      }).then(function() { setStatus('Saved ' + fname); });
    }).catch(function(ex) {
      if (ex.name !== 'AbortError') setStatus('Save error: ' + ex.message);
    });
  } else {
    var blob = new Blob([content], { type: mimeType });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = fname;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function() { URL.revokeObjectURL(url); }, 1200);
    setStatus('Exported ' + fname);
  }
}

export function showPreview() {
  try {
    var html = getCompiledHtml();
    document.getElementById('preview-frame').srcdoc = html;
    document.getElementById('preview-modal').classList.add('show');
    document.getElementById('btn-preview').classList.add('active');
  } catch(ex) { setStatus('Preview error: ' + ex.message); }
}

export function closeAllDropdowns() {
  document.querySelectorAll('.dropdown-menu').forEach(function(m){ m.classList.remove('show'); });
  document.getElementById('insert-float').classList.remove('show');
}

export function setupDropdown(btnId, menuId) {
  document.getElementById(btnId).addEventListener('click', function(e) {
    e.stopPropagation();
    var menu = document.getElementById(menuId);
    var was = menu.classList.contains('show');
    closeAllDropdowns();
    if (!was) menu.classList.add('show');
  });
}

export function initFileOpsListeners() {
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.dropdown') && !e.target.closest('#insert-float') && !e.target.closest('.block-add-btn')) {
      closeAllDropdowns();
    }
  });
  setupDropdown('btn-file-dd', 'dm-file');
}
