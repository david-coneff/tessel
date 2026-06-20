import { pushUndo } from './undo.js';
import { uid } from './utils.js';

var _deps = {};

export function initBlockOps(deps) { _deps = deps; }

export function selectAll(el) {
  var range = document.createRange();
  range.selectNodeContents(el);
  var sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

export function getBlock(id) {
  function search(arr) {
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].id === id) return arr[i];
      if (arr[i].type === 'section' && arr[i].children) { var r = search(arr[i].children); if (r) return r; }
    }
    return null;
  }
  return search(_deps.getBlocks());
}

export function insertBlockInSections(block, afterId, arr) {
  for (var i = 0; i < arr.length; i++) {
    if (arr[i].type === 'section') {
      var children = arr[i].children || [];
      var idx = children.findIndex(function(b){ return b.id === afterId; });
      if (idx >= 0) { children.splice(idx + 1, 0, block); return true; }
      if (insertBlockInSections(block, afterId, children)) return true;
    }
  }
  return false;
}

export function insertBlock(block, afterId) {
  pushUndo();
  var blocks = _deps.getBlocks();
  if (!afterId) {
    blocks.push(block);
  } else {
    var idx = blocks.findIndex(function(b){ return b.id === afterId; });
    if (idx >= 0) {
      blocks.splice(idx + 1, 0, block);
    } else if (!insertBlockInSections(block, afterId, blocks)) {
      blocks.push(block);
    }
  }
  _deps.renderCanvas();
  _deps.markUnsaved();
  setTimeout(function() {
    var el = document.querySelector('[data-block-id="' + block.id + '"]');
    if (el) {
      var editable = el.querySelector('[contenteditable]');
      if (editable) { editable.focus(); selectAll(editable); }
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    if (block.type === 'field') selectBlock(block.id);
  }, 30);
}

export function deleteBlockFromSections(id, arr) {
  for (var i = 0; i < arr.length; i++) {
    if (arr[i].type === 'section') {
      var children = arr[i].children || [];
      var idx = children.findIndex(function(b){ return b.id === id; });
      if (idx >= 0) { children.splice(idx, 1); return true; }
      if (deleteBlockFromSections(id, children)) return true;
    }
  }
  return false;
}

export function deleteBlock(id) {
  pushUndo();
  var blocks = _deps.getBlocks();
  var idx = blocks.findIndex(function(b){ return b.id === id; });
  if (idx >= 0) { blocks.splice(idx, 1); }
  else { deleteBlockFromSections(id, blocks); }
  if (_deps.getSelectedBlockId() === id) { _deps.setSelectedBlockId(null); _deps.renderProps(); }
  _deps.renderCanvas();
  _deps.markUnsaved();
}

export function selectBlock(id) {
  _deps.setSelectedBlockId(id);
  document.querySelectorAll('.field-card').forEach(function(el) { el.classList.remove('selected'); });
  if (id) {
    var card = document.querySelector('[data-block-id="' + id + '"] .field-card');
    if (card) card.classList.add('selected');
  }
  _deps.renderProps();
}

export var dragSrcId = null;

export function reorderBlock(srcId, targetId, insertBefore, arr) {
  pushUndo();
  var srcIdx = arr.findIndex(function(b){ return b.id === srcId; });
  if (srcIdx < 0) return;
  var src = arr.splice(srcIdx, 1)[0];
  var tgtIdx = arr.findIndex(function(b){ return b.id === targetId; });
  if (tgtIdx < 0) arr.push(src);
  else arr.splice(insertBefore ? tgtIdx : tgtIdx + 1, 0, src);
  _deps.renderCanvas();
  _deps.markUnsaved();
}

export function setupDragDrop(wrap, b, arr) {
  wrap.addEventListener('dragstart', function(e) {
    dragSrcId = b.id;
    wrap.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });
  wrap.addEventListener('dragend', function() {
    dragSrcId = null;
    wrap.classList.remove('dragging');
    document.querySelectorAll('.drag-over-top,.drag-over-bottom').forEach(function(el) {
      el.classList.remove('drag-over-top','drag-over-bottom');
    });
  });
  wrap.addEventListener('dragover', function(e) {
    if (!dragSrcId || dragSrcId === b.id) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    var rect = wrap.getBoundingClientRect();
    document.querySelectorAll('.drag-over-top,.drag-over-bottom').forEach(function(el) {
      el.classList.remove('drag-over-top','drag-over-bottom');
    });
    wrap.classList.add(e.clientY < rect.top + rect.height / 2 ? 'drag-over-top' : 'drag-over-bottom');
  });
  wrap.addEventListener('dragleave', function() {
    wrap.classList.remove('drag-over-top','drag-over-bottom');
  });
  wrap.addEventListener('drop', function(e) {
    if (!dragSrcId || dragSrcId === b.id) return;
    e.preventDefault();
    var rect = wrap.getBoundingClientRect();
    var before = e.clientY < rect.top + rect.height / 2;
    reorderBlock(dragSrcId, b.id, before, arr);
    wrap.classList.remove('drag-over-top','drag-over-bottom');
  });
}
