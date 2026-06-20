var undoStack = [], redoStack = [];
var _undoDebounceTimer = null;
var _undoPendingSnapshot = null;
var _deps = { getBlocks: null, setBlocks: null, setSelectedBlockId: null,
              renderCanvas: null, renderProps: null, setStatus: null };

export function initUndo(deps) {
  _deps = deps;
}

export function getUndoDepth() {
  try { var v = parseInt(localStorage.getItem('tvs:opts:undo-depth'), 10); if (v > 0) return v; } catch(e) {}
  return 100;
}
export function getUndoGranularity() {
  try { return localStorage.getItem('tvs:opts:undo-granularity') || 'action'; } catch(e) { return 'action'; }
}
export function getUndoTimeWindow() {
  try { var v = parseInt(localStorage.getItem('tvs:opts:undo-time-window'), 10); if (v > 0) return v; } catch(e) {}
  return 1000;
}

export function inputPushUndo() {
  if (getUndoGranularity() === 'action') {
    pushUndo();
  } else {
    if (_undoDebounceTimer === null) {
      _undoPendingSnapshot = JSON.stringify(_deps.getBlocks());
    }
    clearTimeout(_undoDebounceTimer);
    _undoDebounceTimer = setTimeout(function() {
      _undoDebounceTimer = null;
      if (_undoPendingSnapshot !== null) {
        undoStack.push(_undoPendingSnapshot);
        _undoPendingSnapshot = null;
        var depth = getUndoDepth();
        while (undoStack.length > depth) undoStack.shift();
        redoStack = [];
        updateUndoButtons();
      }
    }, getUndoTimeWindow());
  }
}

export function pushUndo() {
  undoStack.push(JSON.stringify(_deps.getBlocks()));
  var depth = getUndoDepth();
  while (undoStack.length > depth) undoStack.shift();
  redoStack = [];
  updateUndoButtons();
}

export function undo() {
  if (!undoStack.length) return;
  redoStack.push(JSON.stringify(_deps.getBlocks()));
  _deps.setBlocks(JSON.parse(undoStack.pop()));
  _deps.setSelectedBlockId(null);
  _deps.renderCanvas();
  _deps.renderProps();
  updateUndoButtons();
  _deps.setStatus('Undo');
}

export function redo() {
  if (!redoStack.length) return;
  undoStack.push(JSON.stringify(_deps.getBlocks()));
  _deps.setBlocks(JSON.parse(redoStack.pop()));
  _deps.setSelectedBlockId(null);
  _deps.renderCanvas();
  _deps.renderProps();
  updateUndoButtons();
  _deps.setStatus('Redo');
}

export function updateUndoButtons() {
  document.getElementById('btn-undo').disabled = undoStack.length === 0;
  document.getElementById('btn-redo').disabled = redoStack.length === 0;
}

export function clearUndoHistory() {
  undoStack = [];
  redoStack = [];
}

export function saveUndoHistory() {
  return { undoStack: undoStack, redoStack: redoStack };
}

export function loadUndoHistory(stack, rstack) {
  undoStack = stack || [];
  redoStack = rstack || [];
}

export function trimUndoStack(depth) {
  while (undoStack.length > depth) undoStack.shift();
}

export function cancelUndoDebounce() {
  clearTimeout(_undoDebounceTimer);
  _undoDebounceTimer = null;
}
