import * as StorageEngine from './StorageEngine.js';
export function updateToolbarState(b) {
  var activeType  = b ? b.type  : null;
  var activeLevel = b ? b.level : null;
  var map = { 'btn-h1': ['heading',1], 'btn-h2': ['heading',2], 'btn-h3': ['heading',3], 'btn-para': ['paragraph',null] };
  Object.keys(map).forEach(function(id) {
    var t = map[id][0], l = map[id][1];
    var matches = activeType === t && (l === null || activeLevel === l);
    document.getElementById(id).classList.toggle('active', matches);
  });
}

export var FONT_MAP = [
  { key: 'georgia',  re: /georgia/i },
  { key: 'franklin', re: /franklin\s*gothic/i },
  { key: 'verdana',  re: /verdana/i },
];

function normFont(fontFamily) {
  for (var i = 0; i < FONT_MAP.length; i++) {
    if (FONT_MAP[i].re.test(fontFamily)) return FONT_MAP[i].key;
  }
  return 'default';
}

function collectRangeStyles(range) {
  var bold = false, italic = false, underline = false;
  var fonts = {};
  var root = range.commonAncestorContainer;
  if (root.nodeType === 3) root = root.parentNode;
  while (root && !root.isContentEditable) root = root.parentNode;
  if (!root) return null;
  var iter = document.createNodeIterator(root, NodeFilter.SHOW_TEXT);
  var node;
  while ((node = iter.nextNode())) {
    if (range.comparePoint(node, 0) > 0) continue;
    if (range.comparePoint(node, node.length) < 0) continue;
    var el = node.parentNode;
    var cs = window.getComputedStyle(el);
    if (parseInt(cs.fontWeight, 10) >= 700 || cs.fontWeight === 'bold' || cs.fontWeight === 'bolder') bold = true;
    if (cs.fontStyle === 'italic' || cs.fontStyle === 'oblique') italic = true;
    if (cs.textDecorationLine && cs.textDecorationLine.indexOf('underline') !== -1) underline = true;
    fonts[normFont(cs.fontFamily)] = true;
  }
  return { bold: bold, italic: italic, underline: underline, fonts: fonts };
}

export function updateInlineFormatState() {
  var sel = window.getSelection();
  var empty = !sel || sel.rangeCount === 0 || sel.isCollapsed;
  var bold = false, italic = false, underline = false;
  var fonts = {};
  if (!empty) {
    var range = sel.getRangeAt(0);
    var styles = collectRangeStyles(range);
    if (styles) { bold = styles.bold; italic = styles.italic; underline = styles.underline; fonts = styles.fonts; }
  } else {
    try { bold = document.queryCommandState('bold'); italic = document.queryCommandState('italic'); underline = document.queryCommandState('underline'); } catch(e) {}
    if (sel && sel.anchorNode) {
      var el = sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentNode : sel.anchorNode;
      if (el && el.closest && el.closest('[contenteditable]')) {
        fonts[normFont(window.getComputedStyle(el).fontFamily)] = true;
      }
    }
  }
  document.getElementById('btn-bold').classList.toggle('active', bold);
  document.getElementById('btn-italic').classList.toggle('active', italic);
  document.getElementById('btn-underline').classList.toggle('active', underline);
  var inLink = false;
  if (sel && sel.anchorNode) {
    var ln = sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentNode : sel.anchorNode;
    inLink = !!(ln && ln.closest && ln.closest('a'));
  }
  document.getElementById('btn-link').classList.toggle('active', inLink);
  var builtInFontBtnMap = { 'default': 'btn-font-default', 'georgia': 'btn-font-georgia', 'franklin': 'btn-font-franklin', 'verdana': 'btn-font-verdana' };
  Object.keys(builtInFontBtnMap).forEach(function(key) {
    var el = document.getElementById(builtInFontBtnMap[key]);
    if (el) el.classList.toggle('active', !!fonts[key]);
  });
  FONT_MAP.forEach(function(entry) {
    if (builtInFontBtnMap[entry.key] !== undefined) return;
    if (entry.key === 'default') return;
    var el = document.getElementById(entry.key);
    if (el) el.classList.toggle('active', !!fonts[entry.key]);
  });
}

export function isBlockLevelFormatting() {
  try { return StorageEngine.getItem('tvs:opts:block-fmt') === '1'; } catch(e) { return false; }
}

export function closePreview() {
  document.getElementById('preview-modal').classList.remove('show');
  document.getElementById('btn-preview').classList.remove('active');
}

// ── deps-injected functions ────────────────────────────────────────────────
var _deps = {};

export function initInlineFormat(deps) {
  _deps = deps;

  document.addEventListener('selectionchange', function() {
    var sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) { updateInlineFormatState(); return; }
    var node = sel.anchorNode;
    if (node && node.nodeType === 3) node = node.parentNode;
    if (node && node.closest && node.closest('#canvas [contenteditable]')) {
      updateInlineFormatState();
    }
  });
}

function maybeExpandSelToBlock() {
  if (!isBlockLevelFormatting()) return;
  var ce = null;
  var lastId = _deps.getLastFocusedTextBlockId();
  if (lastId) {
    var wrap = document.querySelector('[data-block-id="' + lastId + '"]');
    if (wrap) ce = wrap.querySelector('[contenteditable]');
  }
  if (!ce) {
    var sel = window.getSelection();
    if (sel && sel.rangeCount) {
      var node = sel.anchorNode;
      if (node && node.nodeType === 3) node = node.parentNode;
      if (node) ce = node.closest('[contenteditable]');
    }
  }
  if (!ce) return;
  var range = document.createRange();
  range.selectNodeContents(ce);
  var sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

export function applyFontFamily(family) {
  maybeExpandSelToBlock();
  var sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
  var range = sel.getRangeAt(0);
  var frag = range.extractContents();
  var span = document.createElement('span');
  span.style.fontFamily = family;
  span.appendChild(frag);
  range.insertNode(span);
  var newRange = document.createRange();
  newRange.selectNodeContents(span);
  sel.removeAllRanges();
  sel.addRange(newRange);
  var blockWrap = span.closest('[data-block-id]');
  if (blockWrap) {
    var b = _deps.getBlock(blockWrap.dataset.blockId);
    if (b && (b.type === 'paragraph' || b.type === 'list')) {
      var ce = blockWrap.querySelector('[contenteditable]');
      if (ce) { b.text = ce.innerHTML; _deps.markUnsaved(); }
    }
  }
}

function getSelCharOffsets(el) {
  var sel = window.getSelection();
  if (!sel || !sel.rangeCount) return null;
  var range = sel.getRangeAt(0);
  if (!el.contains(range.commonAncestorContainer)) return null;
  var pre = range.cloneRange();
  pre.selectNodeContents(el);
  pre.setEnd(range.startContainer, range.startOffset);
  var start = pre.toString().length;
  return { start: start, end: start + range.toString().length };
}

function restoreSelCharOffsets(el, offsets) {
  if (!offsets) return;
  var sel = window.getSelection();
  var range = document.createRange();
  var charCount = 0, startNode, startOff = 0, endNode, endOff = 0;
  (function walk(node) {
    if (startNode && endNode) return;
    if (node.nodeType === 3) {
      var len = node.nodeValue.length;
      if (!startNode && charCount + len >= offsets.start) { startNode = node; startOff = offsets.start - charCount; }
      if (!endNode   && charCount + len >= offsets.end)   { endNode   = node; endOff   = offsets.end   - charCount; }
      charCount += len;
    } else { for (var i = 0; i < node.childNodes.length; i++) walk(node.childNodes[i]); }
  })(el);
  if (!startNode) { startNode = el; startOff = 0; }
  if (!endNode)   { endNode = startNode; endOff = startOff; }
  try { range.setStart(startNode, startOff); range.setEnd(endNode, endOff); sel.removeAllRanges(); sel.addRange(range); } catch(e) {}
}

export function convertFocusedBlock(newType, level) {
  var lastId = _deps.getLastFocusedTextBlockId();
  if (!lastId) return;
  var b = _deps.getBlock(lastId);
  if (!b) return;

  if (newType === 'heading' && b.type === 'heading') {
    b.level = level;
    var blockWrap = document.querySelector('[data-block-id="' + b.id + '"]');
    if (blockWrap) {
      var hEl = blockWrap.querySelector('.block-heading');
      if (hEl) hEl.className = 'block-heading h' + level;
      blockWrap.querySelectorAll('.hl-btn').forEach(function(btn, i) {
        btn.classList.toggle('active', i + 1 === level);
      });
    }
    updateToolbarState(b);
    _deps.markUnsaved();
    return;
  }

  var oldCe = document.querySelector('[data-block-id="' + b.id + '"] [contenteditable]');
  var savedSel = oldCe ? getSelCharOffsets(oldCe) : null;

  if (newType === 'heading') {
    b.type = 'heading'; b.level = level;
    b.text = (b.text || '').replace(/<[^>]+>/g, '') || 'Heading';
  } else {
    b.type = 'paragraph';
    if (b.text === undefined) b.text = '';
  }

  var wrap = document.querySelector('[data-block-id="' + b.id + '"]');
  if (wrap) {
    var inner = wrap.querySelector('.block-inner');
    if (inner) {
      inner.innerHTML = '';
      if (b.type === 'heading') inner.appendChild(_deps.createHeadingEl(b));
      else inner.appendChild(_deps.createParaEl(b));
    }
  }

  updateToolbarState(b);
  _deps.markUnsaved();

  var newCe = document.querySelector('[data-block-id="' + b.id + '"] [contenteditable]');
  if (newCe) { newCe.focus(); if (savedSel) restoreSelCharOffsets(newCe, savedSel); }
}
