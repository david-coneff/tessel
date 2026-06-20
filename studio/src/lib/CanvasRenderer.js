import { FIELD_TYPES } from './metadata.js';
import { uid, slugify } from './utils.js';
import { inputPushUndo } from './undo.js';
import { icon } from '../tessel-ui/index.js';
import { deleteBlock, selectBlock, insertBlock } from './BlockOps.js';
import { showInsertFloat } from './InsertMenu.js';
import { markUnsaved, flatBlockList } from './FileOps.js';
import { updateOutline } from './PropsPanel.js';
import { updateToolbarState } from './InlineFormat.js';
import { formatDatePattern } from './DateUtils.js';

var _deps = {};

export function initCanvasRenderer(deps) { _deps = deps; }

export function renderCanvas() {
  var blocks = _deps.getBlocks();
  var root = document.getElementById('blocks-root');
  var empty = document.getElementById('canvas-empty');
  root.innerHTML = '';
  if (blocks.length === 0) { empty.style.display = ''; }
  else {
    empty.style.display = 'none';
    blocks.forEach(function(b) { root.appendChild(createBlockEl(b, blocks)); });
  }
  updateOutline();
}

export function createBlockEl(b, arr) {
  var wrap = document.createElement('div');
  wrap.className = 'block-wrap';
  wrap.dataset.blockId = b.id;
  wrap.draggable = true;

  var actions = document.createElement('div');
  actions.className = 'block-actions';

  var dragH = document.createElement('span');
  dragH.className = 'drag-handle';
  dragH.textContent = '⣿';
  dragH.title = 'Drag to reorder';
  actions.appendChild(dragH);

  var addBtn = document.createElement('button');
  addBtn.className = 'block-add-btn';
  addBtn.textContent = '+';
  addBtn.title = 'Insert block below';
  addBtn.addEventListener('click', function(e) { e.stopPropagation(); showInsertFloat(b.id, addBtn); });
  actions.appendChild(addBtn);

  wrap.appendChild(actions);

  if (b.type === 'heading' || b.type === 'paragraph' || b.type === 'hr' || b.type === 'list' || b.type === 'attachment') {
    var delBtn = document.createElement('button');
    delBtn.className = 'block-corner-del';
    delBtn.textContent = '×';
    delBtn.title = 'Delete block';
    delBtn.addEventListener('click', function(e) { e.stopPropagation(); deleteBlock(b.id); });
    wrap.appendChild(delBtn);
  }

  var inner = document.createElement('div');
  inner.className = 'block-inner';

  if (b.type === 'heading') inner.appendChild(createHeadingEl(b, arr));
  else if (b.type === 'paragraph') inner.appendChild(createParaEl(b, arr));
  else if (b.type === 'hr') inner.appendChild(createHrEl(b));
  else if (b.type === 'list') inner.appendChild(createListEl(b));
  else if (b.type === 'field') inner.appendChild(createFieldEl(b));
  else if (b.type === 'section') inner.appendChild(createSectionEl(b));
  else if (b.type === 'codeblock') inner.appendChild(createCodeEl(b));
  else if (b.type === 'attachment') inner.appendChild(createAttachmentEl(b));

  if (b.indent) inner.style.paddingLeft = (b.indent * 24) + 'px';
  wrap.appendChild(inner);
  setupDragDrop(wrap, b, arr);
  return wrap;
}

export function createHeadingEl(b) {
  var container = document.createElement('div');
  container.style.position = 'relative';

  var el = document.createElement('div');
  el.className = 'block-heading h' + b.level;
  el.contentEditable = 'true';
  el.textContent = b.text || '';
  el.dataset.placeholder = 'Heading ' + b.level;

  el.addEventListener('input', function() { inputPushUndo(); b.text = el.textContent; markUnsaved(); updateOutline(); });
  el.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      var nb = { type:'paragraph', text:'', id:uid() };
      insertBlock(nb, b.id);
      _deps.setLastFocusedTextBlockId(nb.id);
    }
    if (e.key === 'Backspace' && el.textContent === '') { e.preventDefault(); deleteBlock(b.id); }
  });
  el.addEventListener('focus', function() { _deps.setLastFocusedTextBlockId(b.id); updateToolbarState(b); });
  container.appendChild(el);

  var sel = document.createElement('div');
  sel.className = 'heading-level-sel';
  [1,2,3].forEach(function(lvl) {
    var btn = document.createElement('button');
    btn.className = 'hl-btn' + (b.level === lvl ? ' active' : '');
    btn.textContent = 'H' + lvl;
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      b.level = lvl;
      el.className = 'block-heading h' + lvl;
      sel.querySelectorAll('.hl-btn').forEach(function(bb, i) { bb.classList.toggle('active', i+1 === lvl); });
      markUnsaved();
    });
    sel.appendChild(btn);
  });
  container.appendChild(sel);
  return container;
}

export function createParaEl(b) {
  var el = document.createElement('div');
  el.className = 'block-para';
  el.contentEditable = 'true';
  el.dataset.placeholder = 'Type something…';
  el.innerHTML = b.text || '';

  el.addEventListener('input', function() { inputPushUndo(); b.text = el.innerHTML; markUnsaved(); });
  el.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      insertBlock({ type:'paragraph', text:'', id:uid() }, b.id);
    }
    if (e.key === 'Backspace' && el.textContent === '' && el.innerHTML === '') {
      e.preventDefault();
      var flat = flatBlockList(_deps.getBlocks());
      var idx = flat.findIndex(function(x){ return x.id === b.id; });
      deleteBlock(b.id);
      if (idx > 0 && flat[idx-1]) {
        var prevEl = document.querySelector('[data-block-id="' + flat[idx-1].id + '"] [contenteditable]');
        if (prevEl) prevEl.focus();
      }
    }
  });
  el.addEventListener('focus', function() { _deps.setLastFocusedTextBlockId(b.id); updateToolbarState(b); });
  return el;
}

export function createHrEl(b) {
  var wrap = document.createElement('div');
  wrap.className = 'block-hr-wrap';
  var hr = document.createElement('hr');
  wrap.appendChild(hr);
  wrap.title = 'Divider';
  return wrap;
}

export function placeCursorAtEnd(el) {
  var range = document.createRange();
  var sel = window.getSelection();
  range.selectNodeContents(el);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}

export function createListEl(b) {
  var list = document.createElement(b.ordered ? 'ol' : 'ul');
  list.className = 'block-list';

  function syncItems() {
    b.items = Array.from(list.querySelectorAll('.block-list-item')).map(function(li) { return li.innerHTML; });
  }

  function makeItemEl(html) {
    var li = document.createElement('li');
    li.className = 'block-list-item';
    li.contentEditable = 'true';
    li.innerHTML = html || '';
    li.addEventListener('input', function() { inputPushUndo(); syncItems(); markUnsaved(); });
    li.addEventListener('focus', function() { _deps.setLastFocusedTextBlockId(b.id); updateToolbarState(b); });
    li.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        var newLi = makeItemEl('');
        li.insertAdjacentElement('afterend', newLi);
        syncItems();
        markUnsaved();
        newLi.focus();
      }
      if (e.key === 'Backspace' && li.textContent === '') {
        e.preventDefault();
        var prev = li.previousElementSibling;
        if (!prev && !li.nextElementSibling) {
          deleteBlock(b.id);
        } else {
          li.remove();
          syncItems();
          markUnsaved();
          if (prev) { prev.focus(); placeCursorAtEnd(prev); }
        }
      }
    });
    return li;
  }

  (b.items && b.items.length ? b.items : ['']).forEach(function(text) {
    list.appendChild(makeItemEl(text));
  });

  return list;
}

export function createFieldEl(b) {
  var def = FIELD_TYPES[b.fieldType] || { icon:'?', badge:'Field', hasOptions:false };
  var card = document.createElement('div');
  card.className = 'field-card' + (_deps.getSelectedBlockId() === b.id ? ' selected' : '');
  card.addEventListener('click', function() { selectBlock(b.id); });

  var hdr = document.createElement('div');
  hdr.className = 'field-card-header';

  var iconEl = document.createElement('span');
  iconEl.className = 'field-icon';
  iconEl.textContent = def.icon;

  var badge = document.createElement('span');
  badge.className = 'field-badge';
  badge.textContent = def.badge;

  var btns = document.createElement('div');
  btns.className = 'field-card-btns';

  var settingsBtn = document.createElement('button');
  settingsBtn.className = 'field-card-btn';
  settingsBtn.textContent = '⚙';
  settingsBtn.title = 'Edit properties';
  settingsBtn.addEventListener('click', function(e) { e.stopPropagation(); selectBlock(b.id); });

  var delBtn = document.createElement('button');
  delBtn.className = 'field-card-btn del';
  delBtn.textContent = '🗑';
  delBtn.title = 'Delete field';
  delBtn.addEventListener('click', function(e) { e.stopPropagation(); deleteBlock(b.id); });

  btns.appendChild(settingsBtn);
  btns.appendChild(delBtn);
  hdr.appendChild(iconEl);
  hdr.appendChild(badge);
  hdr.appendChild(btns);
  card.appendChild(hdr);

  var labelEl = document.createElement('div');
  labelEl.className = 'field-label';
  labelEl.contentEditable = 'true';
  labelEl.textContent = b.label || '';
  labelEl.addEventListener('input', function() {
    b.label = labelEl.textContent;
    if (!b.meta._idManuallySet) b.meta.id = slugify(b.label);
    markUnsaved();
    if (_deps.getSelectedBlockId() === b.id) renderProps();
  });
  labelEl.addEventListener('click', function(e) { e.stopPropagation(); selectBlock(b.id); });
  card.appendChild(labelEl);

  var metaRow = document.createElement('div');
  metaRow.className = 'field-meta-row';
  if (b.meta.required) {
    var req = document.createElement('span'); req.className = 'field-meta-tag'; req.textContent = 'Required';
    metaRow.appendChild(req);
  }
  if (b.meta.id) {
    var idTag = document.createElement('span'); idTag.className = 'field-meta-tag'; idTag.textContent = 'ID: ' + b.meta.id;
    metaRow.appendChild(idTag);
  }
  if (metaRow.children.length) card.appendChild(metaRow);

  if (def.hasOptions && b.options && b.options.length) {
    var chips = document.createElement('div');
    chips.className = 'field-options-chips';
    b.options.forEach(function(opt) {
      var chip = document.createElement('span'); chip.className = 'field-option-chip'; chip.textContent = opt;
      chips.appendChild(chip);
    });
    card.appendChild(chips);
  }

  // Preview hints for special types
  var hint = null;
  if (b.fieldType === 'image') {
    hint = document.createElement('div');
    hint.className = 'field-preview-hint';
    hint.textContent = b.meta.src ? 'src: ' + b.meta.src : 'No source URL set';
  } else if (b.fieldType === 'computed') {
    hint = document.createElement('div');
    hint.className = 'field-preview-hint';
    hint.textContent = b.meta.expr ? 'expr: ' + b.meta.expr : 'No expression set';
  } else if (b.fieldType === 'signature') {
    hint = document.createElement('div');
    hint.className = 'field-preview-hint';
    hint.textContent = 'Signature pad';
  } else if (b.fieldType === 'richtext') {
    hint = document.createElement('div');
    hint.className = 'field-preview-hint';
    hint.textContent = 'Rich text area';
  } else if (b.fieldType === 'date' || b.fieldType === 'datetime') {
    var dfmtHint = b.meta.dateFormat || (b.fieldType === 'date' ? 'YYYY-MM-DD' : 'YYYY-MM-DD HH:mm');
    hint = document.createElement('div');
    hint.className = 'field-preview-hint';
    hint.textContent = 'Format: ' + dfmtHint + '  →  ' + formatDatePattern(new Date(), dfmtHint);
  } else if (b.fieldType === 'attachment') {
    // Live consumer-facing attachment input — embedded directly in the card
    if (!b.meta.files) b.meta.files = [];
    var attWrap = document.createElement('div');
    attWrap.className = 'attachment-block';

    var attList = document.createElement('div');
    attList.className = 'attachment-file-list';

    var renderAttFiles = function renderAttFiles() {
      attList.innerHTML = '';
      (b.meta.files || []).forEach(function(f, idx) {
        var item = document.createElement('div');
        item.className = 'attachment-item';
        item.title = 'Double-click to open ' + f.name;

        var ico = document.createElement('div');
        ico.className = 'attachment-item-icon';
        ico.textContent = fileIcon(f.name);

        var nm = document.createElement('div');
        nm.className = 'attachment-item-name';
        nm.textContent = f.name;

        var del = document.createElement('button');
        del.className = 'attachment-item-del';
        del.textContent = '×';
        del.title = 'Remove';
        del.addEventListener('click', function(e) {
          e.stopPropagation();
          b.meta.files.splice(idx, 1);
          renderAttFiles();
          markUnsaved();
        });

        item.addEventListener('dblclick', function() {
          var a = document.createElement('a');
          a.href = f.data; a.target = '_blank'; a.rel = 'noopener';
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
        });

        item.appendChild(ico); item.appendChild(nm); item.appendChild(del);
        attList.appendChild(item);
      });
    }
    renderAttFiles();

    var attDrop = document.createElement('div');
    attDrop.className = 'attachment-dropzone';
    attDrop.innerHTML = '<div>&#128206; Drop files here</div><div style="margin-top:4px;font-size:10px;">or <u style="cursor:pointer">click to choose</u></div>';
    var attInput = document.createElement('input');
    attInput.type = 'file'; attInput.multiple = true;
    attDrop.appendChild(attInput);

    var processAttFiles = function processAttFiles(fileList) {
      Array.from(fileList).forEach(function(file) {
        var reader = new FileReader();
        reader.onload = function(ev) {
          b.meta.files.push({ name: file.name, type: file.type, data: ev.target.result });
          renderAttFiles(); markUnsaved();
        };
        reader.readAsDataURL(file);
      });
    }

    attDrop.addEventListener('click', function(e) { if (e.target !== attInput) attInput.click(); });
    attInput.addEventListener('change', function() { if (attInput.files.length) processAttFiles(attInput.files); attInput.value = ''; });
    attDrop.addEventListener('dragover', function(e) { e.preventDefault(); e.stopPropagation(); attDrop.classList.add('drag-over'); });
    attDrop.addEventListener('dragleave', function() { attDrop.classList.remove('drag-over'); });
    attDrop.addEventListener('drop', function(e) {
      e.preventDefault(); e.stopPropagation();
      attDrop.classList.remove('drag-over');
      if (e.dataTransfer.files.length) processAttFiles(e.dataTransfer.files);
    });

    attWrap.appendChild(attList);
    attWrap.appendChild(attDrop);
    card.appendChild(attWrap);
  }
  if (hint) card.appendChild(hint);

  return card;
}

export function createSectionEl(b) {
  var sec = document.createElement('div');
  sec.className = 'section-block';

  var hdr = document.createElement('div');
  hdr.className = 'section-header';

  var toggle = document.createElement('span');
  toggle.className = 'section-toggle';
  toggle.textContent = '▼';

  var titleEl = document.createElement('div');
  titleEl.className = 'section-title-edit';
  titleEl.contentEditable = 'true';
  titleEl.textContent = b.title || 'Section';
  titleEl.addEventListener('input', function() { inputPushUndo(); b.title = titleEl.textContent; markUnsaved(); });
  titleEl.addEventListener('focus', function() { _deps.setLastFocusedTextBlockId(b.id); updateToolbarState(b); });
  titleEl.addEventListener('click', function(e) { e.stopPropagation(); });
  titleEl.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!b.children) b.children = [];
      if (!b.children.length) {
        var nb = { type:'paragraph', text:'', id:uid() };
        b.children.push(nb);
        renderCanvas();
        markUnsaved();
        setTimeout(function() {
          var el2 = document.querySelector('[data-block-id="' + nb.id + '"] [contenteditable]');
          if (el2) el2.focus();
        }, 30);
      } else {
        var firstChild = b.children[0];
        var el2 = document.querySelector('[data-block-id="' + firstChild.id + '"] [contenteditable]');
        if (el2) el2.focus();
      }
    }
  });

  var delBtn = document.createElement('button');
  delBtn.className = 'section-del-btn';
  delBtn.textContent = '✕';
  delBtn.title = 'Delete section';
  delBtn.addEventListener('click', function(e) { e.stopPropagation(); deleteBlock(b.id); });

  hdr.appendChild(toggle);
  hdr.appendChild(titleEl);
  hdr.appendChild(delBtn);
  sec.appendChild(hdr);

  var body = document.createElement('div');
  body.className = 'section-body';
  var collapsed = false;

  hdr.addEventListener('click', function() {
    collapsed = !collapsed;
    body.classList.toggle('collapsed', collapsed);
    toggle.textContent = collapsed ? '▶' : '▼';
  });

  if (b.children && b.children.length) {
    b.children.forEach(function(child) { body.appendChild(createBlockEl(child, b.children)); });
  } else {
    var hint = document.createElement('div');
    hint.style.cssText = 'color:var(--muted);font-size:11px;padding:8px;text-align:center';
    hint.textContent = 'Empty section — use Insert ▾ to add blocks';
    body.appendChild(hint);
  }

  var addSec = document.createElement('button');
  addSec.style.cssText = 'margin-top:8px;font-size:11px;background:none;border:1px dashed var(--border);border-radius:4px;padding:4px 10px;cursor:pointer;color:var(--muted);width:100%';
  addSec.textContent = '+ Add block to section';
  addSec.addEventListener('click', function() {
    var nb = { type:'paragraph', text:'', id:uid() };
    b.children = b.children || [];
    b.children.push(nb);
    renderCanvas();
    markUnsaved();
  });
  body.appendChild(addSec);
  sec.appendChild(body);
  return sec;
}

export function createCodeEl(b) {
  var wrap = document.createElement('div');
  wrap.className = 'code-block';

  var hdr = document.createElement('div');
  hdr.className = 'code-block-header';

  var langEl = document.createElement('span');
  langEl.className = 'code-lang';
  langEl.contentEditable = 'true';
  langEl.textContent = b.lang || 'text';
  langEl.title = 'Click to edit language';
  langEl.addEventListener('input', function() { inputPushUndo(); b.lang = langEl.textContent.trim(); markUnsaved(); });

  var delBtn = document.createElement('button');
  delBtn.className = 'code-del-btn';
  delBtn.textContent = '🗑 Delete';
  delBtn.addEventListener('click', function() { deleteBlock(b.id); });

  hdr.appendChild(langEl);
  hdr.appendChild(delBtn);
  wrap.appendChild(hdr);

  var codeEl = document.createElement('textarea');
  codeEl.className = 'code-edit';
  codeEl.value = b.code || '';
  codeEl.placeholder = 'Enter code here…';
  codeEl.spellcheck = false;
  codeEl.addEventListener('input', function() { inputPushUndo(); b.code = codeEl.value; markUnsaved(); });
  codeEl.addEventListener('focus', function() { _deps.setLastFocusedTextBlockId(b.id); updateToolbarState(b); });
  codeEl.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      var s = codeEl.selectionStart;
      codeEl.value = codeEl.value.slice(0, s) + '  ' + codeEl.value.slice(codeEl.selectionEnd);
      codeEl.selectionStart = codeEl.selectionEnd = s + 2;
    }
  });
  wrap.appendChild(codeEl);
  return wrap;
}

export function fileIcon(name) {
  var ext = (name.split('.').pop() || '').toLowerCase();
  var map = {
    pdf:'📄', doc:'📝', docx:'📝', xls:'📊', xlsx:'📊', ppt:'📊', pptx:'📊',
    jpg:'🖼', jpeg:'🖼', png:'🖼', gif:'🖼', svg:'🖼', webp:'🖼',
    mp3:'🎵', wav:'🎵', ogg:'🎵', mp4:'🎬', mov:'🎬', zip:'📦', gz:'📦',
    txt:'📃', csv:'📃', json:'📋', xml:'📋', html:'🌐', js:'⚙', ts:'⚙', py:'⚙',
  };
  return map[ext] || '📎';
}

export function createAttachmentEl(b) {
  if (!b.files) b.files = [];
  var wrap = document.createElement('div');
  wrap.className = 'attachment-block';

  var list = document.createElement('div');
  list.className = 'attachment-file-list';

  function renderFiles() {
    list.innerHTML = '';
    b.files.forEach(function(f, idx) {
      var item = document.createElement('div');
      item.className = 'attachment-item';
      item.title = 'Double-click to open ' + f.name;
      var ico = document.createElement('div'); ico.className = 'attachment-item-icon'; ico.textContent = fileIcon(f.name);
      var nm  = document.createElement('div'); nm.className = 'attachment-item-name';  nm.textContent  = f.name;
      var del = document.createElement('button');
      del.className = 'attachment-item-del'; del.textContent = '×'; del.title = 'Remove';
      del.addEventListener('click', function(e) { e.stopPropagation(); b.files.splice(idx, 1); renderFiles(); markUnsaved(); });
      item.addEventListener('dblclick', function() {
        var a = document.createElement('a'); a.href = f.data; a.target = '_blank'; a.rel = 'noopener';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      });
      item.appendChild(ico); item.appendChild(nm); item.appendChild(del);
      list.appendChild(item);
    });
  }
  renderFiles();

  var dropzone = document.createElement('div');
  dropzone.className = 'attachment-dropzone';
  dropzone.innerHTML = '<div>&#128206; Drop files here</div><div style="margin-top:4px;font-size:10px;">or <u style="cursor:pointer">click to choose</u></div>';
  var fileInput = document.createElement('input'); fileInput.type = 'file'; fileInput.multiple = true;
  dropzone.appendChild(fileInput);

  function processFiles(fileList) {
    Array.from(fileList).forEach(function(file) {
      var reader = new FileReader();
      reader.onload = function(e) { b.files.push({ name: file.name, type: file.type, data: e.target.result }); renderFiles(); markUnsaved(); };
      reader.readAsDataURL(file);
    });
  }
  dropzone.addEventListener('click', function(e) { if (e.target !== fileInput) fileInput.click(); });
  fileInput.addEventListener('change', function() { if (fileInput.files.length) processFiles(fileInput.files); fileInput.value = ''; });
  dropzone.addEventListener('dragover', function(e) { e.preventDefault(); e.stopPropagation(); dropzone.classList.add('drag-over'); });
  dropzone.addEventListener('dragleave', function() { dropzone.classList.remove('drag-over'); });
  dropzone.addEventListener('drop', function(e) { e.preventDefault(); e.stopPropagation(); dropzone.classList.remove('drag-over'); if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files); });

  wrap.appendChild(list);
  wrap.appendChild(dropzone);
  return wrap;
}
