
/*
 * TESSEL VS — DEFERRED FEATURES (roadmap, not yet implemented)
 *
 * These were part of the larger tessel-studio.html but are intentionally
 * excluded here until they can be cleanly integrated:
 *
 * - Accessibility audit panel (WCAG 2.1/2.2, Section 508, EN 301 549)
 * - Ribbon toolbar docking (top/bottom/left/right positions)
 * - Toolbar customization (per-user show/hide of ribbon buttons)
 * - Edit history time-travel panel (visual snapshot browser)
 * - Find/Replace panel
 * - Document statistics (word/char/field counts)
 * - Pagination preview mode for compiled output
 * - PDF/UA compositing
 * - Preference export/import
 * - Mobile/touch layout optimizations
 * - Mode pill toggle to merge with Tessel Studio Markdown (split-pane IDE view)
 * - Inline richtext formatting toolbar (bold/italic/link in paragraph blocks)
 * - YAML front-matter header in .md files (--- fences at top): standard fields
 *   (title, author, created, modified, description, tags) + author-defined custom
 *   typed fields (text, number, integer, date, datetime, boolean); front-matter
 *   is stripped before HTML rendering so it never appears in compiled output;
 *   round-tripped on open so the editor restores all header values; compatible
 *   with Jekyll/Hugo/GitHub tooling by convention
 * - File metadata dialog (File menu): UI for viewing and editing the front-matter
 *   block — standard fields pre-populated, plus an "Add field" row for custom
 *   author-defined header fields with a type selector
 * - Filename / document-title state variable driven by front-matter `title:`
 *   (editor title bar and _filename both reflect it); md header variable
 *   constructor for templating metadata into block content at export time
 *   (e.g. {{title}}, {{author}}, {{date}})
 * - Undo history sidecar: persist undo/redo stacks to a <name>.undo file
 *   alongside the .md (editor state, not document content — kept separate to
 *   preserve content hash); inside ZIP packages stored as _tessel/<name>.undo;
 *   schema: JSON { schemaVersion, undoStack, redoStack, savedAt }; loaded
 *   automatically when the matching .md or .zip is opened, silently ignored if absent
 * - Multi-document ZIP package support: index.json manifest auto-generated from
 *   each .md's YAML front-matter `title:` field (not the filename); manifest
 *   records title, source filename, and order; ZIP open/save treats the full set
 *   as a project; batch HTML export derives page titles and inter-page <a href>
 *   links from the manifest (slugified from title, not filename)
 * - Contents badge button (upper-left toolbar): for single docs shows heading
 *   outline; for multi-doc packages shows a project-level table of contents
 *   auto-built from each document's front-matter title; in exported HTML the
 *   badge becomes a collapsible sidebar nav with relative-path links between
 *   sibling pages, all titles sourced from front-matter not filesystem names
 * - PWA packaging: add a web app manifest (manifest.json) and minimal service
 *   worker to make Tessel VS installable as a Progressive Web App in Chrome/Edge;
 *   once installed it gets its own window, taskbar/dock icon, launches offline, and
 *   registerProtocolHandler becomes available for the tessel:// edit-in-place badge
 *   feature on exported HTML; the service worker caches the single HTML file so the
 *   app works fully offline after first load; File System Access API native save
 *   dialogs work without any additional changes; this is the lowest-friction path
 *   to a native-feeling desktop experience with no packaging infrastructure, no
 *   code signing requirement, and no distribution overhead; Tauri is deferred as a
 *   later option if OS-level protocol registration, code-signed installers, or
 *   per-type save path control beyond what the browser permits become necessary
 * - Filename suggestion toggle: a preference controlling whether the save dialog
 *   pre-populates the filename automatically from the state variable compositor
 *   (deriving the name from front-matter title, date, document ID, or other
 *   metadata fields via a template e.g. "{{title}}-{{date}}") or leaves the
 *   filename blank and requires the user to name the file manually every time;
 *   when auto-suggestion is on, the compositor result is editable before confirm
 *   so it serves as a smart default rather than a forced name; the compositor
 *   template itself is configurable per file type (the .md draft may want a
 *   different naming convention than the .zip package or exported .html);
 *   lives in Options > Preferences > Export
 * - Customizable default save path: a preference setting for the directory that
 *   silent-download saves target, overriding the browser's default download folder;
 *   in the browser context this is advisory only (browsers restrict programmatic
 *   path control) but in an Electron wrapper it becomes fully functional via
 *   app.getPath / dialog.showSaveDialog with a remembered last-used directory;
 *   the setting lives in Options > Preferences > Export alongside the existing
 *   file-picker vs. silent-download toggle; per-file-type path overrides (e.g.
 *   .zip packages always go to a project folder, .md drafts go elsewhere) are a
 *   natural extension of this setting
 * - Field type audit: methodical per-type review of all field types (text, area,
 *   date, datetime, number, email, phone, url, select, radio, check, credential,
 *   totp, filename, dir, parse, image, richtext, computed, signature, attachment)
 *   covering: canvas preview fidelity vs. compiled HTML output, available
 *   properties and whether any are missing per type, label/placeholder/description
 *   consistency, validation options and their serialization, masking behavior for
 *   credential and totp, expression syntax and evaluation for computed, options
 *   management UX for radio/check/select, stub completeness for signature, and
 *   whether each type round-trips correctly through serialize → parse → render;
 *   also establish a per-field `description` / hint text property (secondary line
 *   below the label, visible in both canvas and compiled output) as a standard
 *   property across all field types
 * - Multi-column / multiple blocks per line: allow blocks to be placed side by
 *   side on the same row rather than strictly stacking vertically; authored via a
 *   row container block type that holds a set of child blocks laid out in a CSS
 *   grid or flexbox row; each child block retains its own independent properties,
 *   selection, and formatting; column widths are settable per child (fixed px,
 *   fractional fr units, or auto); row containers participate in multi-block
 *   selection, branch dimming, and section completion like any other block;
 *   in compiled HTML output the row renders as a responsive grid that collapses
 *   to single-column at narrow viewport widths; the block insertion UI gains an
 *   "add column" affordance when the cursor is inside a row container
 * - Text alignment controls: horizontal (left/center/right/justify) and vertical
 *   (top/center/bottom) alignment per block; both axes are set simultaneously via
 *   a 3×3 grid widget in the right pane — nine clickable cells representing every
 *   combination of vertical × horizontal alignment, with the active combination
 *   highlighted; clicking a cell sets both axes at once without requiring two
 *   separate controls; horizontal alignment maps to CSS text-align on the block
 *   content; vertical alignment maps to flexbox align-items on the block container;
 *   both properties are included in multi-block selection and apply to all eligible
 *   blocks in the set; the 3×3 grid is also a natural candidate for the multi-select
 *   pane since it communicates mixed state clearly (no cell highlighted = mixed)
 * - Multi-block selection in the canvas editor: shift+click selects a contiguous
 *   range of blocks, ctrl/cmd+click toggles individual blocks into or out of the
 *   selection set; selected blocks each show a distinct selection ring distinct from
 *   the single active-block highlight; the right pane reflects the union of all
 *   selected blocks — controls that apply to at least one block in the selection are
 *   shown normally and apply only to the eligible subset when fired; controls that
 *   apply to none of the selected block types are dimmed (not hidden) so the pane
 *   layout stays stable and the user understands what would be available on a
 *   different selection; controls with mixed values across the selection show an
 *   indeterminate state (dimmed or "—") and writing a new value snaps all eligible
 *   blocks to that value simultaneously; properties that cleanly apply across block
 *   types include indentation, alignment, width, styling class/theme variant,
 *   visibility, and conditional branch membership; inline text formatting (bold,
 *   italic, etc.) applies only to the eligible text/paragraph blocks in the set and
 *   no-ops silently on incompatible types; destructive type changes are not available
 *   in multi-select; the Delete key or toolbar delete action in multi-select triggers
 *   a mass delete of all selected blocks with a single undo entry covering the full
 *   set — this is a first-class workflow for quickly clearing large sections of
 *   content without clicking block by block
 * - Section completion state: when all required inputs within a section or major
 *   partition are satisfied with at least the minimum valid input (one checkbox
 *   checked from a set, a radio option selected, a text field passing its type
 *   validation — e.g. valid IP address, non-empty required text, date in range),
 *   the section header gains a green dashed border and a ✓ badge in its upper-right
 *   corner; this is the positive complement to branch dimming and uses the same
 *   design language — dashed border + corner badge — so the two states form a
 *   coherent visual vocabulary: green/✓ = satisfied and complete, grey/⊘ = ruled
 *   out by a prior decision; together they give the user a spatial map of process
 *   progress without requiring them to scroll to verify; completion state is
 *   recomputed live as inputs change and reverts if a previously valid field is
 *   cleared or invalidated
 * - Conditional branch dimming: when a form user makes a decision that renders
 *   a branch of the walkbook inapplicable, the transition is immediate and overt
 *   at the point of decision — the affected blocks animate-collapse to their
 *   topmost section heading, dim to reduced opacity, gain a dashed border, and
 *   display a "not applicable" watermark (⊘ symbol + text overlay) centered over
 *   the collapsed region; the intentional visibility of the contraction is the UX
 *   signal — the user sees the document responding to their input and understands
 *   why content disappeared and that the remaining content is what applies to them;
 *   collapsed branches are not deleted — they remain in the document model and
 *   restore if the decision is reversed; branch conditions are authored as a
 *   block-level property linking a block group to a specific field block's value
 *   or option selection
 */
import { uid, esc, slugify } from './lib/utils.js';
import { FIELD_TYPES } from './lib/metadata.js';
import { serializeBlocks, serializeBlock, astToBlocks, nodeToBlock } from './lib/blocks.js';
import { initUndo, pushUndo, inputPushUndo, undo, redo, updateUndoButtons,
         clearUndoHistory, saveUndoHistory, loadUndoHistory, trimUndoStack, cancelUndoDebounce,
         getUndoDepth, getUndoGranularity, getUndoTimeWindow } from './lib/undo.js';
import { FloatingPane, clampToViewport } from './lib/FloatingPane.js';
import { makeDockablePane, sidePanelArrowSync, sidePanelOpenFn } from './lib/PaneFactory.js';
import './lib/ThemeManager.js';
import { initExport, openZip, exportZip, exportMd, exportHtml, collectAttachments, serializeBlocksForExport } from './lib/ExportManager.js';
import { initDateUtils, DATE_FMT_DEFAULTS, getTzList, TZ_SHORTCODES, getDefaultTimezone, saveDefaultTimezone,
         getDateFmtPresets, saveDateFmtPresets, buildDateFmtSection, formatDatePattern } from './lib/DateUtils.js';
import './lib/EditorDatePicker.js';
import { initCustomFonts } from './lib/CustomFonts.js';
import { initPaneDragReorder } from './lib/PaneDragReorder.js';
import { parseMd as TesselParseMd, blocksToHtml, buildPage as TesselBuildPage } from './lib/TesselCompiler.js';
import { icon, makeSeparator, makeTextInput, makeToggle } from './tessel-ui/index.js';

(function() {
'use strict';

var blocks = [];
var selectedBlockId = null;
var lastFocusedTextBlockId = null;
var _unsaved = false;

initUndo({
  getBlocks: function() { return blocks; },
  setBlocks: function(v) { blocks = v; },
  setSelectedBlockId: function(v) { selectedBlockId = v; },
  renderCanvas: renderCanvas,
  renderProps: renderProps,
  setStatus: setStatus,
});
initDateUtils({ renderProps: renderProps });
initExport({
  getBlocks:         function() { return blocks; },
  setBlocks:         function(v) { blocks = v; },
  getFilename:       function() { return _filename; },
  setFilename:       function(v) { _filename = v; },
  setSelectedBlockId: function(v) { selectedBlockId = v; },
  setUnsaved:        function(v) { _unsaved = v; },
  setStatus:         setStatus,
  saveFile:          saveFile,
  renderCanvas:      renderCanvas,
  renderProps:       renderProps,
  saveDraft:         saveDraft,
  getCompiledHtml:   getCompiledHtml,
});
var _filename = 'document';

// Undo/Redo


var INSERT_MENU_ITEMS = [
  { group: 'Text Content' },
  { label: 'Heading 1', icon: 'H1', action: function(aid) { insertBlock({ type:'heading', level:1, text:'Heading', id:uid() }, aid); } },
  { label: 'Heading 2', icon: 'H2', action: function(aid) { insertBlock({ type:'heading', level:2, text:'Heading', id:uid() }, aid); } },
  { label: 'Heading 3', icon: 'H3', action: function(aid) { insertBlock({ type:'heading', level:3, text:'Heading', id:uid() }, aid); } },
  { label: 'Paragraph', icon: '¶',  action: function(aid) { insertBlock({ type:'paragraph', text:'', id:uid() }, aid); } },
  { label: 'Divider',       icon: '—',  action: function(aid) { insertBlock({ type:'hr', id:uid() }, aid); } },
  { label: 'Bulleted List', icon: '•',  action: function(aid) { insertBlock({ type:'list', ordered:false, items:[''], id:uid() }, aid); } },
  { label: 'Ordered List',  icon: '1.', action: function(aid) { insertBlock({ type:'list', ordered:true,  items:[''], id:uid() }, aid); } },
  { group: 'Structure' },
  { label: 'Collapsible Section', icon: '▶',  action: function(aid) { insertBlock({ type:'section', title:'Section Title', children:[], id:uid() }, aid); } },
  { label: 'Code Block',          icon: '</>',action: function(aid) { insertBlock({ type:'codeblock', lang:'bash', code:'', id:uid() }, aid); } },
  { label: 'Attachment (author)', icon: '📎', action: function(aid) { insertBlock({ type:'attachment', files:[], id:uid() }, aid); } },
];

function insertField(ft, afterId) {
  var b = { type:'field', fieldType:ft, label:'Label', options:[], meta:{}, id:uid() };
  b.meta.id = slugify(b.label);
  insertBlock(b, afterId);
}

function insertBlock(block, afterId) {
  pushUndo();
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
  renderCanvas();
  markUnsaved();
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

function insertBlockInSections(block, afterId, arr) {
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

function deleteBlock(id) {
  pushUndo();
  var idx = blocks.findIndex(function(b){ return b.id === id; });
  if (idx >= 0) { blocks.splice(idx, 1); }
  else { deleteBlockFromSections(id, blocks); }
  if (selectedBlockId === id) { selectedBlockId = null; renderProps(); }
  renderCanvas();
  markUnsaved();
}

function deleteBlockFromSections(id, arr) {
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

function getBlock(id) {
  function search(arr) {
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].id === id) return arr[i];
      if (arr[i].type === 'section' && arr[i].children) { var r = search(arr[i].children); if (r) return r; }
    }
    return null;
  }
  return search(blocks);
}

function selectAll(el) {
  var range = document.createRange();
  range.selectNodeContents(el);
  var sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

function renderCanvas() {
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

function createBlockEl(b, arr) {
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

function createHeadingEl(b) {
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
      lastFocusedTextBlockId = nb.id;
    }
    if (e.key === 'Backspace' && el.textContent === '') { e.preventDefault(); deleteBlock(b.id); }
  });
  el.addEventListener('focus', function() { lastFocusedTextBlockId = b.id; updateToolbarState(b); });
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

function createParaEl(b) {
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
      var flat = flatBlockList(blocks);
      var idx = flat.findIndex(function(x){ return x.id === b.id; });
      deleteBlock(b.id);
      if (idx > 0 && flat[idx-1]) {
        var prevEl = document.querySelector('[data-block-id="' + flat[idx-1].id + '"] [contenteditable]');
        if (prevEl) prevEl.focus();
      }
    }
  });
  el.addEventListener('focus', function() { lastFocusedTextBlockId = b.id; updateToolbarState(b); });
  return el;
}

function createHrEl(b) {
  var wrap = document.createElement('div');
  wrap.className = 'block-hr-wrap';
  var hr = document.createElement('hr');
  wrap.appendChild(hr);
  wrap.title = 'Divider';
  return wrap;
}

function placeCursorAtEnd(el) {
  var range = document.createRange();
  var sel = window.getSelection();
  range.selectNodeContents(el);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}

function createListEl(b) {
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
    li.addEventListener('focus', function() { lastFocusedTextBlockId = b.id; updateToolbarState(b); });
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

function createFieldEl(b) {
  var def = FIELD_TYPES[b.fieldType] || { icon:'?', badge:'Field', hasOptions:false };
  var card = document.createElement('div');
  card.className = 'field-card' + (selectedBlockId === b.id ? ' selected' : '');
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
    if (selectedBlockId === b.id) renderProps();
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

function createSectionEl(b) {
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
  titleEl.addEventListener('focus', function() { lastFocusedTextBlockId = b.id; updateToolbarState(b); });
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

function createCodeEl(b) {
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
  codeEl.addEventListener('focus', function() { lastFocusedTextBlockId = b.id; updateToolbarState(b); });
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

function fileIcon(name) {
  var ext = (name.split('.').pop() || '').toLowerCase();
  var map = {
    pdf:'📄', doc:'📝', docx:'📝', xls:'📊', xlsx:'📊', ppt:'📊', pptx:'📊',
    jpg:'🖼', jpeg:'🖼', png:'🖼', gif:'🖼', svg:'🖼', webp:'🖼',
    mp3:'🎵', wav:'🎵', ogg:'🎵', mp4:'🎬', mov:'🎬', zip:'📦', gz:'📦',
    txt:'📃', csv:'📃', json:'📋', xml:'📋', html:'🌐', js:'⚙', ts:'⚙', py:'⚙',
  };
  return map[ext] || '📎';
}

function createAttachmentEl(b) {
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

var dragSrcId = null;

function setupDragDrop(wrap, b, arr) {
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

function reorderBlock(srcId, targetId, insertBefore, arr) {
  pushUndo();
  var srcIdx = arr.findIndex(function(b){ return b.id === srcId; });
  if (srcIdx < 0) return;
  var src = arr.splice(srcIdx, 1)[0];
  var tgtIdx = arr.findIndex(function(b){ return b.id === targetId; });
  if (tgtIdx < 0) arr.push(src);
  else arr.splice(insertBefore ? tgtIdx : tgtIdx + 1, 0, src);
  renderCanvas();
  markUnsaved();
}

function selectBlock(id) {
  selectedBlockId = id;
  document.querySelectorAll('.field-card').forEach(function(el) { el.classList.remove('selected'); });
  if (id) {
    var card = document.querySelector('[data-block-id="' + id + '"] .field-card');
    if (card) card.classList.add('selected');
  }
  renderProps();
}

function renderProps() {
  var body = document.getElementById('props-body');
  var empty = document.getElementById('props-empty');
  if (!selectedBlockId) { body.innerHTML = ''; body.appendChild(empty); return; }
  var b = getBlock(selectedBlockId);
  if (!b || b.type !== 'field') { body.innerHTML = ''; body.appendChild(empty); return; }

  body.innerHTML = '';
  var def = FIELD_TYPES[b.fieldType] || {};

  var typeRow = mkPropRow('Type');
  var typeSel = document.createElement('select');
  typeSel.className = 'prop-input';
  Object.keys(FIELD_TYPES).forEach(function(ft) {
    var opt = document.createElement('option');
    opt.value = ft; opt.textContent = FIELD_TYPES[ft].badge;
    if (ft === b.fieldType) opt.selected = true;
    typeSel.appendChild(opt);
  });
  typeSel.addEventListener('change', function() {
    b.fieldType = typeSel.value;
    if (!FIELD_TYPES[b.fieldType].hasOptions) b.options = [];
    renderCanvas(); renderProps(); markUnsaved();
  });
  typeRow.appendChild(typeSel);
  body.appendChild(typeRow);

  var labelRow = mkPropRow('Label');
  labelRow.appendChild(mkInput(b.label || '', function(v) {
    b.label = v;
    if (!b.meta._idManuallySet) b.meta.id = slugify(v);
    renderCanvas(); markUnsaved();
  }));
  body.appendChild(labelRow);

  var idRow = mkPropRow('Field ID');
  idRow.appendChild(mkInput(b.meta.id || '', function(v) { b.meta.id = v; b.meta._idManuallySet = true; markUnsaved(); }));
  body.appendChild(idRow);

  body.appendChild(mkCheckRow('Required', b.meta.required, function(v) { b.meta.required = v; renderCanvas(); markUnsaved(); }));

  var reqIfRow = mkPropRow('Required if');
  reqIfRow.appendChild(mkInput(b.meta.required_if || '', function(v) { b.meta.required_if = v||undefined; markUnsaved(); }));
  body.appendChild(reqIfRow);

  var visIfRow = mkPropRow('Visible if');
  visIfRow.appendChild(mkInput(b.meta.visible_if || '', function(v) { b.meta.visible_if = v||undefined; markUnsaved(); }));
  body.appendChild(visIfRow);

  var valRow = mkPropRow('Validate (regex)');
  valRow.appendChild(mkInput(b.meta.validate || '', function(v) { b.meta.validate = v||undefined; markUnsaved(); }));
  body.appendChild(valRow);

  var warnRow = mkPropRow('Warning message');
  warnRow.appendChild(mkInput(b.meta.warning_message || '', function(v) { b.meta.warning_message = v||undefined; markUnsaved(); }));
  body.appendChild(warnRow);

  // Image-specific: Source URL
  if (b.fieldType === 'image') {
    var srcRow = mkPropRow('Source URL');
    srcRow.appendChild(mkInput(b.meta.src || '', function(v) { b.meta.src = v||undefined; renderCanvas(); markUnsaved(); }));
    body.appendChild(srcRow);
  }

  // Computed-specific: Expression
  if (b.fieldType === 'computed') {
    var exprRow = mkPropRow('Expression');
    exprRow.appendChild(mkInput(b.meta.expr || '', function(v) { b.meta.expr = v||undefined; renderCanvas(); markUnsaved(); }));
    body.appendChild(exprRow);
  }

  // Date/datetime-specific: Format
  if (b.fieldType === 'date' || b.fieldType === 'datetime') {
    var DATE_FMT_PRESETS = getDateFmtPresets(b.fieldType);
    var dfmtDefault = DATE_FMT_PRESETS[0];
    var curFmt = b.meta.dateFormat || dfmtDefault;
    var isPreset = DATE_FMT_PRESETS.indexOf(curFmt) !== -1;

    var fmtTitle = document.createElement('div');
    fmtTitle.className = 'prop-section-title'; fmtTitle.textContent = 'FORMAT';
    body.appendChild(fmtTitle);

    var fmtPresetRow = mkPropRow('Preset');
    var fmtSel = document.createElement('select'); fmtSel.className = 'prop-input';
    var customOpt = document.createElement('option'); customOpt.value = '__custom__'; customOpt.textContent = 'Custom…';
    if (!isPreset) customOpt.selected = true;
    fmtSel.appendChild(customOpt);
    DATE_FMT_PRESETS.forEach(function(fmt) {
      var o = document.createElement('option'); o.value = fmt; o.textContent = fmt;
      if (fmt === curFmt) o.selected = true;
      fmtSel.appendChild(o);
    });
    fmtPresetRow.appendChild(fmtSel); body.appendChild(fmtPresetRow);

    var fmtPatRow = mkPropRow('Pattern');
    var fmtInp = mkInput(curFmt, function(v) {
      b.meta.dateFormat = v || dfmtDefault;
      fmtSel.value = DATE_FMT_PRESETS.indexOf(b.meta.dateFormat) !== -1 ? b.meta.dateFormat : '__custom__';
      updateFmtPreview(); renderCanvas(); markUnsaved();
    });
    function lockFmtInp() {
      fmtInp.readOnly = true; fmtInp.tabIndex = -1;
      fmtInp.style.pointerEvents = 'none'; fmtInp.style.color = 'var(--muted)';
      fmtInp.style.cursor = 'default';
    }
    function unlockFmtInp() {
      fmtInp.readOnly = false; fmtInp.tabIndex = 0;
      fmtInp.style.pointerEvents = ''; fmtInp.style.color = '';
      fmtInp.style.cursor = '';
    }
    if (isPreset) lockFmtInp(); else unlockFmtInp();
    fmtPatRow.appendChild(fmtInp); body.appendChild(fmtPatRow);

    var fmtPrevRow = mkPropRow('Preview');
    var fmtPrevEl = document.createElement('div');
    fmtPrevEl.className = 'prop-input';
    fmtPrevEl.style.cssText = 'color:var(--text);background:var(--bg);cursor:default;pointer-events:none;border-color:var(--border);';
    fmtPrevRow.appendChild(fmtPrevEl); body.appendChild(fmtPrevRow);

    function updateFmtPreview() {
      fmtPrevEl.textContent = formatDatePattern(new Date(), b.meta.dateFormat || dfmtDefault);
    }
    updateFmtPreview();

    fmtSel.addEventListener('change', function() {
      if (fmtSel.value !== '__custom__') {
        b.meta.dateFormat = fmtSel.value;
        fmtInp.value = fmtSel.value;
        lockFmtInp();
        updateFmtPreview(); renderCanvas(); markUnsaved();
      } else {
        unlockFmtInp();
        fmtInp.focus();
      }
    });

    body.appendChild(mkCheckRow('Require valid date', b.meta.requireValidDate, function(v) {
      b.meta.requireValidDate = v || undefined; markUnsaved();
    }));

    var tzRow = mkPropRow('Timezone');
    // Ensure shared datalists exist (built in buildDateFmtSection; create fallbacks if not yet built)
    var propTzMode = (function() { try { return localStorage.getItem('tvs:tzPickerMode') || 'iana'; } catch(e) { return 'iana'; } })();
    var propTzListId = propTzMode === 'short' ? 'tz-short-datalist' : 'tz-iana-datalist';
    if (!document.getElementById('tz-iana-datalist')) {
      var _dl = document.createElement('datalist'); _dl.id = 'tz-iana-datalist';
      var _tzs = getTzList();
      for (var _ti = 0; _ti < _tzs.length; _ti++) { var _o = document.createElement('option'); _o.value = _tzs[_ti]; _dl.appendChild(_o); }
      document.body.appendChild(_dl);
    }
    if (!document.getElementById('tz-short-datalist')) {
      var _sdl = document.createElement('datalist'); _sdl.id = 'tz-short-datalist';
      for (var _si = 0; _si < TZ_SHORTCODES.length; _si++) { var _so = document.createElement('option'); _so.value = TZ_SHORTCODES[_si]; _sdl.appendChild(_so); }
      document.body.appendChild(_sdl);
    }
    var tzInp2 = document.createElement('input');
    tzInp2.type = 'text';
    tzInp2.className = 'prop-input';
    tzInp2.setAttribute('list', propTzListId);
    tzInp2.placeholder = getDefaultTimezone() || (propTzMode === 'short' ? 'e.g. MST' : 'e.g. America/New_York');
    tzInp2.value = b.meta.timezone || '';
    tzInp2.addEventListener('input', function() {
      b.meta.timezone = tzInp2.value.trim() || undefined;
      renderCanvas(); markUnsaved();
    });
    tzRow.appendChild(tzInp2);
    body.appendChild(tzRow);
  }

  if (def.hasOptions) {
    var secTitle = document.createElement('div');
    secTitle.className = 'prop-section-title';
    secTitle.textContent = 'OPTIONS';
    body.appendChild(secTitle);

    var optList = document.createElement('div');
    optList.className = 'opt-list';
    b.options = b.options || [];

    var renderOptList = function renderOptList() {
      optList.innerHTML = '';
      b.options.forEach(function(opt, i) {
        var row = document.createElement('div'); row.className = 'opt-item';
        var inp = document.createElement('input'); inp.type = 'text'; inp.value = opt;
        inp.addEventListener('input', function() { b.options[i] = inp.value; renderCanvas(); markUnsaved(); });
        var del = document.createElement('button'); del.className = 'opt-del'; del.textContent = '✕';
        del.addEventListener('click', function() { b.options.splice(i,1); renderOptList(); renderCanvas(); markUnsaved(); });
        row.appendChild(inp); row.appendChild(del); optList.appendChild(row);
      });
    }
    renderOptList();
    body.appendChild(optList);

    var addOpt = document.createElement('button');
    addOpt.className = 'opt-add'; addOpt.textContent = '+ Add option';
    addOpt.addEventListener('click', function() {
      b.options.push('Option ' + (b.options.length + 1));
      renderOptList(); renderCanvas(); markUnsaved();
    });
    body.appendChild(addOpt);
  }
}

function mkPropRow(label) {
  var row = document.createElement('div'); row.className = 'prop-row';
  var lbl = document.createElement('div'); lbl.className = 'prop-label'; lbl.textContent = label;
  row.appendChild(lbl);
  return row;
}

function mkInput(val, onChange) {
  var wrap = makeTextInput({ value: val, onChange: onChange });
  wrap.input.className += ' prop-input';
  Object.defineProperty(wrap, 'value', {
    get: function() { return wrap.input.value; },
    set: function(v) { wrap.input.value = v; }
  });
  Object.defineProperty(wrap, 'readOnly', {
    get: function() { return wrap.input.readOnly; },
    set: function(v) { wrap.input.readOnly = v; }
  });
  Object.defineProperty(wrap, 'tabIndex', {
    get: function() { return wrap.input.tabIndex; },
    set: function(v) { wrap.input.tabIndex = v; }
  });
  wrap.focus = function() { wrap.input.focus(); };
  return wrap;
}

function mkCheckRow(label, checked, onChange) {
  var row = document.createElement('div'); row.className = 'prop-check-row';
  row.appendChild(makeToggle({ label: label, checked: !!checked, onChange: onChange }));
  return row;
}

function updateOutline() {
  var list = document.getElementById('outline-list');
  list.innerHTML = '';
  var headings = [];
  function collectH(arr) {
    arr.forEach(function(b) {
      if (b.type === 'heading') headings.push(b);
      if (b.type === 'section' && b.children) collectH(b.children);
    });
  }
  collectH(blocks);
  if (!headings.length) {
    list.innerHTML = '<div style="padding:10px;font-size:11px;color:var(--muted)">No headings yet</div>';
    return;
  }
  headings.forEach(function(b) {
    var item = document.createElement('div');
    item.className = 'outline-item h' + b.level;
    item.textContent = b.text || '(untitled)';
    item.title = b.text;
    item.addEventListener('click', function() {
      var el = document.querySelector('[data-block-id="' + b.id + '"]');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    list.appendChild(item);
  });
}

var insertFloatAfter = null;

function buildInsertMenuContent(container, getAfterId) {
  container.innerHTML = '';
  INSERT_MENU_ITEMS.forEach(function(item) {
    if (item.group) {
      var g = document.createElement('div'); g.className = 'dm-group'; g.textContent = item.group;
      container.appendChild(g);
    } else {
      var d = document.createElement('div'); d.className = 'dm-item';
      d.innerHTML = '<span class="dm-icon">' + esc(item.icon) + '</span>' + esc(item.label);
      d.addEventListener('click', function() {
        closeAllDropdowns();
        item.action(getAfterId ? getAfterId() : null);
      });
      container.appendChild(d);
    }
  });
}

function buildInsertMenuHTML() {
  buildInsertMenuContent(document.getElementById('dm-insert'), function() { return null; });
}

function showInsertFloat(afterId, anchorEl) {
  insertFloatAfter = afterId;
  var fl = document.getElementById('insert-float');
  buildInsertMenuContent(fl, function() { return insertFloatAfter; });
  var rect = anchorEl.getBoundingClientRect();
  fl.style.top = (rect.bottom + 4) + 'px';
  fl.style.left = rect.left + 'px';
  fl.classList.add('show');
}

function updateToolbarState(b) {
  var activeType  = b ? b.type  : null;
  var activeLevel = b ? b.level : null;
  var map = { 'btn-h1': ['heading',1], 'btn-h2': ['heading',2], 'btn-h3': ['heading',3], 'btn-para': ['paragraph',null] };
  Object.keys(map).forEach(function(id) {
    var t = map[id][0], l = map[id][1];
    var matches = activeType === t && (l === null || activeLevel === l);
    document.getElementById(id).classList.toggle('active', matches);
  });
}

// Normalise a computed font-family string to one of our known keys, or 'default'
var FONT_MAP = [
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

// Walk every text node within a Range and collect their computed styles
function collectRangeStyles(range) {
  var bold = false, italic = false, underline = false;
  var fonts = {};

  // Grab the nearest contenteditable ancestor to constrain the walk
  var root = range.commonAncestorContainer;
  if (root.nodeType === 3) root = root.parentNode;
  while (root && !root.isContentEditable) root = root.parentNode;
  if (!root) return null;

  // Iterate over every text node that overlaps the range
  var iter = document.createNodeIterator(root, NodeFilter.SHOW_TEXT);
  var node;
  while ((node = iter.nextNode())) {
    // Skip nodes completely outside the range
    if (range.comparePoint(node, 0) > 0) continue;        // starts after range
    if (range.comparePoint(node, node.length) < 0) continue; // ends before range
    var el = node.parentNode;
    var cs = window.getComputedStyle(el);
    if (parseInt(cs.fontWeight, 10) >= 700 || cs.fontWeight === 'bold' || cs.fontWeight === 'bolder') bold = true;
    if (cs.fontStyle === 'italic' || cs.fontStyle === 'oblique') italic = true;
    if (cs.textDecorationLine && cs.textDecorationLine.indexOf('underline') !== -1) underline = true;
    fonts[normFont(cs.fontFamily)] = true;
  }

  return { bold: bold, italic: italic, underline: underline, fonts: fonts };
}

function updateInlineFormatState() {
  var sel = window.getSelection();
  var empty = !sel || sel.rangeCount === 0 || sel.isCollapsed;

  var bold = false, italic = false, underline = false;
  var fonts = {};

  if (!empty) {
    var range = sel.getRangeAt(0);
    var styles = collectRangeStyles(range);
    if (styles) {
      bold = styles.bold; italic = styles.italic; underline = styles.underline;
      fonts = styles.fonts;
    }
  } else {
    // Collapsed cursor — use execCommand query state for bold/italic/underline
    try {
      bold      = document.queryCommandState('bold');
      italic    = document.queryCommandState('italic');
      underline = document.queryCommandState('underline');
    } catch(e) {}
    // Font at cursor: walk up from the anchor node
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

  // Highlight link button if cursor/selection is inside an anchor
  var inLink = false;
  if (sel && sel.anchorNode) {
    var ln = sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentNode : sel.anchorNode;
    inLink = !!(ln && ln.closest && ln.closest('a'));
  }
  document.getElementById('btn-link').classList.toggle('active', inLink);

  // Built-in font buttons
  var builtInFontBtnMap = {
    'default':  'btn-font-default',
    'georgia':  'btn-font-georgia',
    'franklin': 'btn-font-franklin',
    'verdana':  'btn-font-verdana',
  };
  Object.keys(builtInFontBtnMap).forEach(function(key) {
    var el = document.getElementById(builtInFontBtnMap[key]);
    if (el) el.classList.toggle('active', !!fonts[key]);
  });
  // Custom font buttons — their FONT_MAP key equals their btnId
  FONT_MAP.forEach(function(entry) {
    if (builtInFontBtnMap[entry.key] !== undefined) return; // skip built-ins
    if (entry.key === 'default') return;
    var el = document.getElementById(entry.key);
    if (el) el.classList.toggle('active', !!fonts[entry.key]);
  });
}

document.addEventListener('selectionchange', function() {
  // Only update if the selection is inside a canvas contenteditable
  var sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) { updateInlineFormatState(); return; }
  var node = sel.anchorNode;
  if (node && node.nodeType === 3) node = node.parentNode;
  if (node && node.closest && node.closest('#canvas [contenteditable]')) {
    updateInlineFormatState();
  }
});

function markUnsaved() { _unsaved = true; setStatus('Unsaved changes'); }

function isPersistUndo() {
  try { return localStorage.getItem('tvs:opts:persist-undo') === '1'; } catch(e) { return false; }
}

function saveDraft() {
  try {
    var payload = { blocks: blocks };
    if (isPersistUndo()) { var _uh = saveUndoHistory(); payload.undoStack = _uh.undoStack; payload.redoStack = _uh.redoStack; }
    localStorage.setItem('tvs:draft', JSON.stringify(payload));
  } catch(e) {}
  _unsaved = false;
  setStatus('Draft saved');
}

function loadDraft() {
  try {
    var raw = localStorage.getItem('tvs:draft');
    if (!raw) return;
    var payload = JSON.parse(raw);
    // Support both old format (plain array) and new format (object with blocks key)
    if (Array.isArray(payload)) {
      blocks = payload;
    } else {
      blocks = payload.blocks || [];
      if (payload.undoStack) { loadUndoHistory(payload.undoStack, payload.redoStack); }
    }
    renderCanvas();
    updateUndoButtons();
    setStatus('Draft restored');
  } catch(e) {}
  try { var fn = localStorage.getItem('tvs:filename'); if (fn) _filename = fn; } catch(e) {}
}

function flatBlockList(arr) {
  var result = [];
  arr.forEach(function(b) {
    result.push(b);
    if (b.type === 'section' && b.children) result = result.concat(flatBlockList(b.children));
  });
  return result;
}

var _statusTimer = null;
function setStatus(msg) {
  document.getElementById('status-bar').textContent = msg;
  if (_statusTimer) clearTimeout(_statusTimer);
  _statusTimer = setTimeout(function() { document.getElementById('status-bar').textContent = 'Ready'; }, 4000);
}

function openMd(file) {
  _filename = file.name.replace(/\.md$/i, '');
  try { localStorage.setItem('tvs:filename', _filename); } catch(e) {}
  var rd = new FileReader();
  rd.onload = function(e) {
    try {
      blocks = TesselParseMd(e.target.result);
      selectedBlockId = null;
      renderCanvas(); renderProps();
      _unsaved = false;
      saveDraft();
      setStatus('Opened ' + file.name);
    } catch(ex) { setStatus('Error parsing file: ' + ex.message); }
  };
  rd.readAsText(file);
}

function openHtml(file) {
  _filename = file.name.replace(/\.html?$/i, '');
  try { localStorage.setItem('tvs:filename', _filename); } catch(e) {}
  var rd = new FileReader();
  rd.onload = function(ev) {
    var html = ev.target.result;
    var m = html.match(/<script[^>]+type="text\/tessel-source"[^>]*data-encoding="base64"[^>]*>([\s\S]*?)<\/script>/i)
           || html.match(/<script[^>]+data-encoding="base64"[^>]+type="text\/tessel-source"[^>]*>([\s\S]*?)<\/script>/i);
    if (!m) { setStatus('No tessel source found in this HTML file.'); return; }
    try {
      var raw = decodeURIComponent(escape(atob(m[1].trim())));
      var parsed = JSON.parse(raw);
      // New format: JSON array of blocks
      if (Array.isArray(parsed)) {
        blocks = parsed.map(function(b) { b.id = b.id || uid(); return b; });
      } else {
        // Legacy format: markdown string — parse with TesselCompiler
        blocks = TesselParseMd(raw);
      }
      selectedBlockId = null;
      renderCanvas(); renderProps();
      _unsaved = false;
      saveDraft();
      setStatus('Opened ' + file.name);
    } catch(ex) { setStatus('Error: ' + ex.message); }
  };
  rd.readAsText(file);
}

function getCustomFontFaceCSS() {
  var css = '';
  var prefix = 'tvs:font:';
  try {
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf(prefix) === 0) {
        var d = JSON.parse(localStorage.getItem(k));
        css += '@font-face { font-family: "' + d.family + '"; src: url("' + d.dataUrl + '") format("' + d.format + '"); }\n';
      }
    }
  } catch(e) {}
  return css;
}

// ---------------------------------------------------------------------------
function getCompiledHtml() {
  var bodyHtml = blocksToHtml(blocks);
  var srcB64 = '';
  try { srcB64 = btoa(unescape(encodeURIComponent(JSON.stringify(blocks)))); } catch(e) {}
  var extraCss = '';
  try {
    if (localStorage.getItem('tvs:opts:embed-fonts') === '1') {
      var fc = getCustomFontFaceCSS();
      if (fc) extraCss = fc;
    }
  } catch(e) {}
  return TesselBuildPage(bodyHtml, { title: _filename, extraCss: extraCss, sourceB64: srcB64 });
}


// Shared save helper: file picker with fallback to silent download
function saveFile(fname, content, mimeType, lsKey) {
  var mode = (function(){ try { return localStorage.getItem(lsKey) || 'picker'; } catch(e) { return 'picker'; } })();
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


function showPreview() {
  try {
    var html = getCompiledHtml();
    document.getElementById('preview-frame').srcdoc = html;
    document.getElementById('preview-modal').classList.add('show');
    document.getElementById('btn-preview').classList.add('active');
  } catch(ex) { setStatus('Preview error: ' + ex.message); }
}


function closeAllDropdowns() {
  document.querySelectorAll('.dropdown-menu').forEach(function(m){ m.classList.remove('show'); });
  document.getElementById('insert-float').classList.remove('show');
}

document.addEventListener('click', function(e) {
  if (!e.target.closest('.dropdown') && !e.target.closest('#insert-float') && !e.target.closest('.block-add-btn')) {
    closeAllDropdowns();
  }
});

function setupDropdown(btnId, menuId) {
  document.getElementById(btnId).addEventListener('click', function(e) {
    e.stopPropagation();
    var menu = document.getElementById(menuId);
    var was = menu.classList.contains('show');
    closeAllDropdowns();
    if (!was) menu.classList.add('show');
  });
}

setupDropdown('btn-file-dd', 'dm-file');

// ── Dockable pane factory ────────────────────────────────────────────────────
makeDockablePane({ paneId: 'format-pane', badgeId: 'badge-format', lsKey: 'tvs:format-pane-state' });
makeDockablePane({ paneId: 'text-pane',   badgeId: 'badge-text',   lsKey: 'tvs:text-pane-state' });
makeDockablePane({ paneId: 'form-pane',   badgeId: 'badge-form',   lsKey: 'tvs:form-pane-state' });

var FORMAT_PANE_ITEMS = [
  { group: 'Block Type', labelId: 'fmt-group-blocktype' },
  { label: 'Heading 1',  btnId: 'btn-h1' },
  { label: 'Heading 2',  btnId: 'btn-h2' },
  { label: 'Heading 3',  btnId: 'btn-h3' },
  { label: 'Paragraph',  btnId: 'btn-para' },
  { group: 'Indent', labelId: 'fmt-group-indent' },
  { label: 'Indent',  btnId: 'btn-indent-more' },
  { label: 'Outdent', btnId: 'btn-indent-less' },
  { group: 'Inline Style', labelId: 'fmt-group-inline' },
  { label: 'Bold',       btnId: 'btn-bold' },
  { label: 'Italic',     btnId: 'btn-italic' },
  { label: 'Underline',  btnId: 'btn-underline' },
  { label: 'Link',       btnId: 'btn-link' },
  { group: 'Font', labelId: 'fmt-group-font' },
  { label: 'Default',         btnId: 'btn-font-default' },
  { label: 'Georgia',         btnId: 'btn-font-georgia' },
  { label: 'Franklin Gothic', btnId: 'btn-font-franklin' },
  { label: 'Verdana',         btnId: 'btn-font-verdana' },
];

function getHiddenItems(pane) {
  try { var v = localStorage.getItem('tvs:hidden:' + pane); return new Set(v ? JSON.parse(v) : []); } catch(e) { return new Set(); }
}
function setItemHidden(pane, label, hidden) {
  var set = getHiddenItems(pane);
  if (hidden) set.add(label); else set.delete(label);
  try { localStorage.setItem('tvs:hidden:' + pane, JSON.stringify(Array.from(set))); } catch(e) {}
  if (pane === 'text') buildTextPaneButtons();
  if (pane === 'format') applyFormatPaneVisibility();
}

function applyFormatPaneVisibility() {
  var hidden = getHiddenItems('format');
  var groupLabelId = null;
  var groupHasVisible = false;
  FORMAT_PANE_ITEMS.forEach(function(item) {
    if (item.group) {
      if (groupLabelId) document.getElementById(groupLabelId).style.display = groupHasVisible ? '' : 'none';
      groupLabelId = item.labelId;
      groupHasVisible = false;
    } else {
      var isHidden = hidden.has(item.label);
      document.getElementById(item.btnId).style.display = isHidden ? 'none' : '';
      if (!isHidden) groupHasVisible = true;
    }
  });
  if (groupLabelId) document.getElementById(groupLabelId).style.display = groupHasVisible ? '' : 'none';
}

function buildTextPaneButtons() {
  var body = document.getElementById('text-pane-body');
  if (!body) return;
  body.innerHTML = '';
  var hidden = getHiddenItems('text');
  var pendingGroupName = null;
  var currentWrapper = null;
  INSERT_MENU_ITEMS.forEach(function(item) {
    if (item.group) {
      pendingGroupName = item.group;
      currentWrapper = null;
    } else {
      if (hidden.has(item.label)) return;
      if (pendingGroupName !== null) {
        var key = 'tvs:grp:text:' + pendingGroupName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        var saved; try { saved = localStorage.getItem(key); } catch(e) {}
        var isOpen = saved !== '0'; // default open
        var lbl = document.createElement('div');
        lbl.className = 'ctrl-group-label ctrl-group-collapsible';
        var arw = document.createElement('span'); arw.className = 'ctrl-group-arrow';
        arw.innerHTML = isOpen ? '&#9660;' : '&#9654;';
        lbl.appendChild(arw); lbl.appendChild(document.createTextNode(pendingGroupName));
        var wrapper = document.createElement('div');
        wrapper.className = 'ctrl-group-body';
        wrapper.style.display = isOpen ? '' : 'none';
        (function(l, w, k, open) {
          l.addEventListener('click', function() {
            open = !open;
            l.querySelector('.ctrl-group-arrow').innerHTML = open ? '&#9660;' : '&#9654;';
            w.style.display = open ? '' : 'none';
            try { localStorage.setItem(k, open ? '1' : '0'); } catch(e) {}
          });
        })(lbl, wrapper, key, isOpen);
        body.appendChild(lbl); body.appendChild(wrapper);
        currentWrapper = wrapper; pendingGroupName = null;
      }
      if (!currentWrapper) return;
      var btn = document.createElement('button');
      btn.className = 'ctrl-btn';
      btn.innerHTML = '<span class="ctrl-btn-icon">' + esc(item.icon) + '</span>' + esc(item.label);
      btn.addEventListener('click', function() { item.action(lastFocusedTextBlockId || null); });
      currentWrapper.appendChild(btn);
    }
  });
}
// Inject an expand/collapse-all button into the pane header (always visible, non-scrolling).
// Must be called after groups are in the DOM (post-initCollapsibleGroups / buildTextPaneButtons).
function wireExpandAllBtn(bodyEl) {
  var groups = Array.from(bodyEl.querySelectorAll('.ctrl-group-collapsible'));
  if (groups.length < 2) return;

  var content = bodyEl.closest('.ctrl-pane-content');
  if (!content) return;
  content.style.position = 'relative';

  // Remove any existing button (e.g. on rebuild)
  var existing = content.querySelector('.pane-expand-all-btn');
  if (existing) existing.remove();

  var btn = document.createElement('button');
  btn.className = 'pane-expand-all-btn';

  function allOpen() {
    return groups.every(function(lbl) {
      var body = lbl.nextElementSibling;
      return body && body.classList.contains('ctrl-group-body') && body.style.display !== 'none';
    });
  }
  function syncBtn() {
    if (allOpen()) {
      btn.title = 'Collapse all groups';
      btn.textContent = '▾▾';
    } else {
      btn.title = 'Expand all groups';
      btn.textContent = '▸▸';
    }
  }
  syncBtn();

  btn.addEventListener('click', function(e) {
    e.stopPropagation();
    var expand = !allOpen();
    groups.forEach(function(lbl) {
      var body = lbl.nextElementSibling;
      if (!body || !body.classList.contains('ctrl-group-body')) return;
      var isOpen = body.style.display !== 'none';
      if (expand !== isOpen) lbl.click(); // reuse existing toggle logic
    });
    syncBtn();
  });

  // Keep button state in sync when individual groups are toggled
  groups.forEach(function(lbl) {
    lbl.addEventListener('click', function() {
      setTimeout(syncBtn, 0); // after the click handler updates display
    });
  });

  content.appendChild(btn);
}

function initCollapsibleGroups(bodyEl, lsPrefix) {
  var children = Array.from(bodyEl.children);
  var groups = [], current = null;
  children.forEach(function(el) {
    if (el.classList.contains('ctrl-group-label')) {
      if (current) groups.push(current);
      current = { label: el, items: [] };
    } else if (current) {
      current.items.push(el);
    }
  });
  if (current) groups.push(current);
  groups.forEach(function(group) {
    var labelEl = group.label;
    var groupName = labelEl.textContent.trim();
    var key = lsPrefix + ':' + groupName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    var saved; try { saved = localStorage.getItem(key); } catch(e) {}
    var isOpen = saved !== '0'; // default open
    var wrapper = document.createElement('div');
    wrapper.className = 'ctrl-group-body';
    wrapper.style.display = isOpen ? '' : 'none';
    labelEl.insertAdjacentElement('afterend', wrapper);
    group.items.forEach(function(el) { wrapper.appendChild(el); });
    labelEl.classList.add('ctrl-group-collapsible');
    var arw = document.createElement('span'); arw.className = 'ctrl-group-arrow';
    arw.innerHTML = isOpen ? '&#9660;' : '&#9654;';
    labelEl.insertBefore(arw, labelEl.firstChild);
    (function(l, w, k, open) {
      l.addEventListener('click', function() {
        open = !open;
        l.querySelector('.ctrl-group-arrow').innerHTML = open ? '&#9660;' : '&#9654;';
        w.style.display = open ? '' : 'none';
        try { localStorage.setItem(k, open ? '1' : '0'); } catch(e) {}
      });
    })(labelEl, wrapper, key, isOpen);
  });
}

buildTextPaneButtons();
applyFormatPaneVisibility();
initCollapsibleGroups(document.querySelector('#format-pane .ctrl-pane-body'), 'tvs:grp:format');
initCollapsibleGroups(document.querySelector('#form-pane .ctrl-pane-body'), 'tvs:grp:form');
wireExpandAllBtn(document.querySelector('#text-pane .ctrl-pane-body'));
wireExpandAllBtn(document.querySelector('#format-pane .ctrl-pane-body'));
wireExpandAllBtn(document.querySelector('#form-pane .ctrl-pane-body'));

// Form pane field-insert buttons
document.querySelectorAll('#form-pane .ctrl-btn[data-insert-field]').forEach(function(btn) {
  btn.addEventListener('click', function() {
    insertField(btn.dataset.insertField, lastFocusedTextBlockId || null);
  });
});


// ── 2.4 Toolbar UI upgrade ─────────────────────────────────────────────────
(function initToolbarUI() {
  // Upgrade undo/redo to icon-only tui-btn--icon
  var undoBtn = document.getElementById('btn-undo');
  var redoBtn = document.getElementById('btn-redo');
  undoBtn.innerHTML = ''; undoBtn.className = 'tui-btn tui-btn--icon';
  redoBtn.innerHTML = ''; redoBtn.className = 'tui-btn tui-btn--icon';
  undoBtn.appendChild(icon('undo', 15));
  redoBtn.appendChild(icon('redo', 15));

  // Upgrade preview button
  var previewBtn = document.getElementById('btn-preview');
  if (previewBtn) {
    previewBtn.innerHTML = '';
    previewBtn.className = 'tui-btn tui-btn--ghost';
    previewBtn.appendChild(icon('eye', 14));
    var lbl = document.createElement('span');
    lbl.className = 'tui-btn__label';
    lbl.textContent = 'Preview';
    previewBtn.appendChild(lbl);
  }

  // Upgrade file-dropdown button
  var fileBtn = document.getElementById('btn-file-dd');
  if (fileBtn) {
    fileBtn.innerHTML = '';
    fileBtn.className = 'tui-btn tui-btn--ghost';
    fileBtn.appendChild(icon('file-text', 14));
    var lbl2 = document.createElement('span');
    lbl2.className = 'tui-btn__label';
    lbl2.textContent = 'File';
    fileBtn.appendChild(lbl2);
    fileBtn.appendChild(icon('chevron-down', 11));
  }

  // Upgrade badge buttons to tui-btn--badge
  ['badge-format','badge-text','badge-form','badge-outline','badge-props'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.classList.add('tui-btn', 'tui-btn--badge');
  });

  // Replace .tb-sep divs with tui-separator spans
  document.querySelectorAll('#toolbar .tb-sep').forEach(function(sep) {
    var replacement = makeSeparator('vertical');
    sep.parentNode.replaceChild(replacement, sep);
  });
})();

document.getElementById('btn-undo').addEventListener('click', undo);
document.getElementById('btn-redo').addEventListener('click', redo);

document.getElementById('btn-new').addEventListener('click', function() {
  closeAllDropdowns();
  if (_unsaved && !confirm('Discard unsaved changes?')) return;
  blocks = []; selectedBlockId = null;
  clearUndoHistory();
  updateUndoButtons();
  renderCanvas(); renderProps();
  _filename = 'document';
  try { localStorage.removeItem('tvs:filename'); } catch(e) {}
  setStatus('New document');
  _unsaved = false;
});

document.getElementById('open-md-item').addEventListener('click', function() { closeAllDropdowns(); document.getElementById('pick-md').click(); });
document.getElementById('open-html-item').addEventListener('click', function() { closeAllDropdowns(); document.getElementById('pick-html').click(); });
document.getElementById('open-zip-item').addEventListener('click', function() { closeAllDropdowns(); document.getElementById('pick-zip').click(); });
document.getElementById('pick-md').addEventListener('change', function() { var f = this.files && this.files[0]; if (!f) return; this.value=''; openMd(f); });
document.getElementById('pick-html').addEventListener('change', function() { var f = this.files && this.files[0]; if (!f) return; this.value=''; openHtml(f); });
document.getElementById('pick-zip').addEventListener('change', function() { var f = this.files && this.files[0]; if (!f) return; this.value=''; openZip(f); });
document.getElementById('btn-export-zip').addEventListener('click', function() { closeAllDropdowns(); exportZip(); });
document.getElementById('btn-save').addEventListener('click', function() { closeAllDropdowns(); saveDraft(); });
document.getElementById('btn-export-md').addEventListener('click', function() { closeAllDropdowns(); exportMd(); });
document.getElementById('btn-export').addEventListener('click', function() { closeAllDropdowns(); exportHtml(); });

document.getElementById('btn-h1').addEventListener('click', function() { convertFocusedBlock('heading', 1); });
document.getElementById('btn-h2').addEventListener('click', function() { convertFocusedBlock('heading', 2); });
document.getElementById('btn-h3').addEventListener('click', function() { convertFocusedBlock('heading', 3); });
document.getElementById('btn-para').addEventListener('click', function() { convertFocusedBlock('paragraph'); });

// Prevent format pane buttons from stealing focus/selection from the canvas
document.querySelector('#format-pane .ctrl-pane-body').addEventListener('mousedown', function(e) {
  if (e.target.closest('.ctrl-btn')) e.preventDefault();
});

document.getElementById('btn-indent-more').addEventListener('click', function() {
  if (!lastFocusedTextBlockId) return;
  var b = getBlock(lastFocusedTextBlockId);
  if (!b) return;
  b.indent = Math.min((b.indent || 0) + 1, 8);
  var wrap = document.querySelector('[data-block-id="' + b.id + '"] .block-inner');
  if (wrap) wrap.style.paddingLeft = (b.indent * 24) + 'px';
  markUnsaved();
});
document.getElementById('btn-indent-less').addEventListener('click', function() {
  if (!lastFocusedTextBlockId) return;
  var b = getBlock(lastFocusedTextBlockId);
  if (!b) return;
  b.indent = Math.max((b.indent || 0) - 1, 0);
  var wrap = document.querySelector('[data-block-id="' + b.id + '"] .block-inner');
  if (wrap) wrap.style.paddingLeft = b.indent ? (b.indent * 24) + 'px' : '';
  markUnsaved();
});
function isBlockLevelFormatting() {
  try { return localStorage.getItem('tvs:opts:block-fmt') === '1'; } catch(e) { return false; }
}

// If block-level formatting is on, expand the selection to cover the whole
// contenteditable of the focused block before the caller applies a format.
function maybeExpandSelToBlock() {
  if (!isBlockLevelFormatting()) return;
  var ce = null;
  if (lastFocusedTextBlockId) {
    var wrap = document.querySelector('[data-block-id="' + lastFocusedTextBlockId + '"]');
    if (wrap) ce = wrap.querySelector('[contenteditable]');
  }
  if (!ce) {
    // Fall back: find the contenteditable that contains the current selection
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

document.getElementById('btn-bold').addEventListener('click', function() { maybeExpandSelToBlock(); document.execCommand('bold'); updateInlineFormatState(); });
document.getElementById('btn-italic').addEventListener('click', function() { maybeExpandSelToBlock(); document.execCommand('italic'); updateInlineFormatState(); });
document.getElementById('btn-underline').addEventListener('click', function() { maybeExpandSelToBlock(); document.execCommand('underline'); updateInlineFormatState(); });

document.getElementById('btn-link').addEventListener('click', function() {
  var sel = window.getSelection();
  var existingLink = null;
  if (sel && sel.rangeCount) {
    var node = sel.anchorNode;
    if (node && node.nodeType === 3) node = node.parentNode;
    existingLink = node ? node.closest('a') : null;
  }
  if (existingLink) {
    // Toggle off: unwrap the anchor
    var parent = existingLink.parentNode;
    while (existingLink.firstChild) parent.insertBefore(existingLink.firstChild, existingLink);
    parent.removeChild(existingLink);
    updateInlineFormatState();
    return;
  }
  if (!sel || sel.isCollapsed) { setStatus('Select text first to add a link'); return; }
  var url = window.prompt('Enter URL:', 'https://');
  if (!url || !url.trim()) return;
  document.execCommand('createLink', false, url.trim());
  // Make link open in new tab
  var range = sel.getRangeAt(0);
  var anchor = range.commonAncestorContainer;
  if (anchor.nodeType === 3) anchor = anchor.parentNode;
  var a = anchor.closest ? anchor.closest('a') : null;
  if (!a) a = anchor.querySelector ? anchor.querySelector('a') : null;
  if (a) { a.target = '_blank'; a.rel = 'noopener'; }
  updateInlineFormatState();
});

function applyFontFamily(family) {
  maybeExpandSelToBlock();
  var sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
  var range = sel.getRangeAt(0);
  var frag = range.extractContents();
  var span = document.createElement('span');
  span.style.fontFamily = family;
  span.appendChild(frag);
  range.insertNode(span);
  // Restore selection over the newly inserted span
  var newRange = document.createRange();
  newRange.selectNodeContents(span);
  sel.removeAllRanges();
  sel.addRange(newRange);
  var blockWrap = span.closest('[data-block-id]');
  if (blockWrap) {
    var b = getBlock(blockWrap.dataset.blockId);
    if (b && (b.type === 'paragraph' || b.type === 'list')) {
      var ce = blockWrap.querySelector('[contenteditable]');
      if (ce) { b.text = ce.innerHTML; markUnsaved(); }
    }
  }
}

document.getElementById('btn-font-default').addEventListener('click', function() { applyFontFamily('inherit'); updateInlineFormatState(); });
document.getElementById('btn-font-georgia').addEventListener('click', function() { applyFontFamily('Georgia, serif'); updateInlineFormatState(); });
document.getElementById('btn-font-franklin').addEventListener('click', function() { applyFontFamily("'Franklin Gothic Book', sans-serif"); updateInlineFormatState(); });
document.getElementById('btn-font-verdana').addEventListener('click', function() { applyFontFamily('Verdana, sans-serif'); updateInlineFormatState(); });

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

function convertFocusedBlock(newType, level) {
  if (!lastFocusedTextBlockId) return;
  var b = getBlock(lastFocusedTextBlockId);
  if (!b) return;

  // Heading level change — purely in-place, no DOM replacement
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
    markUnsaved();
    return;
  }

  // Type conversion — swap inner element, preserve selection via char offsets
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
      if (b.type === 'heading') inner.appendChild(createHeadingEl(b));
      else inner.appendChild(createParaEl(b));
    }
  }

  updateToolbarState(b);
  markUnsaved();

  var newCe = document.querySelector('[data-block-id="' + b.id + '"] [contenteditable]');
  if (newCe) { newCe.focus(); if (savedSel) restoreSelCharOffsets(newCe, savedSel); }
}

document.getElementById('btn-preview').addEventListener('click', function() {
  if (document.getElementById('preview-modal').classList.contains('show')) {
    closePreview();
  } else {
    showPreview();
  }
});
function closePreview() {
  document.getElementById('preview-modal').classList.remove('show');
  document.getElementById('btn-preview').classList.remove('active');
}
document.getElementById('preview-close').addEventListener('click', closePreview);

document.addEventListener('keydown', function(e) {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') { e.preventDefault(); exportMd(); }
  else if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveDraft(); }
  if ((e.ctrlKey || e.metaKey) && e.key === 'e') { e.preventDefault(); exportHtml(); }
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); exportHtml(); }
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') { e.preventDefault(); undo(); }
  if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') { e.preventDefault(); redo(); }
  if (e.key === 'Escape') {
    closeAllDropdowns();
    closePreview();
  }
});

loadDraft();
renderProps();
updateToolbarState(null);
updateUndoButtons();

// ── Side panel factory (outline + props) ────────────────────────────────────
// States: open (full) | collapsed (tab strip) | off (fully hidden, badge only)
makeDockablePane({
  paneId: 'outline-panel', tabId: 'outline-tab', collapseId: 'btn-outline-collapse',
  badgeId: 'badge-outline', lsKey: 'tvs:outline-state',
});
makeDockablePane({
  paneId: 'props-panel', tabId: 'props-tab', collapseId: 'btn-props-collapse',
  badgeId: 'badge-props', lsKey: 'tvs:props-state',
});

// Forward declaration — assigned by the float IIFE below
var floatPanel;

// ── Dock panel system ────────────────────────────────────────────────────────
// Moves a panel element into the specified dock zone and applies CSS classes.
// zone: 'left' | 'right' | 'top' | 'bottom'
function dockPanel(panelId, zone) {
  var panel = document.getElementById(panelId);
  var zoneEl = document.getElementById('dock-' + zone);
  if (!panel || !zoneEl) return;

  // Clean up float styles if the panel was floating
  if (panel.classList.contains('dock-float')) {
    panel.style.left = panel.style.top = panel.style.width = panel.style.height = panel.style.zIndex = '';
    var fb = document.querySelector('[data-pane-float-btn="' + panelId + '"]');
    if (fb) { fb.innerHTML = '&#8599;'; fb.title = 'Undock to float'; }
  }

  zoneEl.appendChild(panel);
  panel.classList.remove('dock-left', 'dock-right', 'dock-top', 'dock-bottom', 'dock-float', 'pane-h');
  panel.classList.add('dock-' + zone);
  if (zone === 'top' || zone === 'bottom') {
    panel.classList.add('pane-h');
    // Collapsed in horizontal mode is invisible — auto-open if pane is on
    if (panel.classList.contains('collapsed') && !panel.classList.contains('off')) {
      if (sidePanelOpenFn[panelId]) sidePanelOpenFn[panelId]();
    }
  }
  if (sidePanelArrowSync[panelId]) sidePanelArrowSync[panelId]();

  // Sync Options dialog dock buttons
  document.querySelectorAll('.opts-dock-btns[data-dock-panel="' + panelId + '"] .opts-dock-btn').forEach(function(b) {
    b.classList.toggle('active', b.dataset.zone === zone);
  });

  try { localStorage.setItem('tvs:dock:' + panelId, zone); } catch(e) {}
}

// ── Floating panel system ────────────────────────────────────────────────────
(function() {
  var FLOAT_W = 260, FLOAT_H = 380, MIN_W = 160, MIN_H = 120;
  var PANE_IDS = ['format-pane','text-pane','form-pane','outline-panel','props-panel'];
  var PANE_DEF = {'format-pane':'left','text-pane':'left','form-pane':'left','outline-panel':'left','props-panel':'right'};
  var lastZone = {};
  var zCounter = 201;

  function loadState(id) { try { return JSON.parse(localStorage.getItem('tvs:float:'+id))||null; } catch(e) { return null; } }
  function saveState(id,x,y,w,h) { try { localStorage.setItem('tvs:float:'+id, JSON.stringify({x:x,y:y,w:w,h:h})); } catch(e) {} }

  function clampFloatPanel(panel) {
    if (!panel || !panel.classList.contains('dock-float')) return;
    var pos = clampToViewport(panel, {
      w: parseFloat(panel.style.width)  || FLOAT_W,
      h: parseFloat(panel.style.height) || FLOAT_H,
      x: parseFloat(panel.style.left)   || 0,
      y: parseFloat(panel.style.top)    || 0,
      margin: 60,
    });
    panel.style.left = pos.x + 'px';
    panel.style.top  = pos.y + 'px';
  }

  window._clampFloatPanel = clampFloatPanel;

  function curZoneOf(panel) {
    if (panel.classList.contains('dock-left'))   return 'left';
    if (panel.classList.contains('dock-right'))  return 'right';
    if (panel.classList.contains('dock-top'))    return 'top';
    if (panel.classList.contains('dock-bottom')) return 'bottom';
    return null;
  }

  floatPanel = function(panelId) {
    var panel = document.getElementById(panelId);
    var fc    = document.getElementById('dock-float');
    if (!panel || !fc) return;
    var z = curZoneOf(panel);
    if (z) lastZone[panelId] = z;
    panel.classList.remove('collapsed');
    fc.appendChild(panel);
    panel.classList.remove('dock-left','dock-right','dock-top','dock-bottom','pane-h');
    panel.classList.add('dock-float');
    var s = loadState(panelId);
    var w = (s&&s.w)||FLOAT_W, h = (s&&s.h)||FLOAT_H;
    var x = (s&&s.x!=null) ? s.x : Math.round((window.innerWidth-w)/2);
    var y = (s&&s.y!=null) ? s.y : Math.round((window.innerHeight-h)/4);
    x = Math.max(0, Math.min(window.innerWidth-w,  x));
    y = Math.max(0, Math.min(window.innerHeight-h, y));
    panel.style.left=x+'px'; panel.style.top=y+'px';
    panel.style.width=w+'px'; panel.style.height=h+'px';
    panel.style.zIndex=String(zCounter++);
    document.querySelectorAll('.opts-dock-btns[data-dock-panel="'+panelId+'"] .opts-dock-btn').forEach(function(b){
      b.classList.toggle('active', b.dataset.zone==='float');
    });
    var fb = document.querySelector('[data-pane-float-btn="'+panelId+'"]');
    if (fb) { fb.innerHTML='&#8601;'; fb.title='Dock panel'; }
    panel.classList.remove('off');
    var bdg = document.querySelector('[data-badge-pane="'+panelId+'"]') || document.getElementById('badge-'+panelId.replace(/-pane$/,'').replace(/-panel$/,''));
    if (bdg) bdg.classList.add('active');
    try { localStorage.setItem('tvs:dock:'+panelId,'float'); } catch(e) {}
  };

  function dockBack(panelId) {
    var panel = document.getElementById(panelId);
    if (!panel||!panel.classList.contains('dock-float')) return;
    saveState(panelId,
      parseFloat(panel.style.left)||0, parseFloat(panel.style.top)||0,
      parseFloat(panel.style.width)||FLOAT_W, parseFloat(panel.style.height)||FLOAT_H);
    panel.style.left=panel.style.top=panel.style.width=panel.style.height=panel.style.zIndex='';
    panel.classList.remove('off');
    dockPanel(panelId, lastZone[panelId]||PANE_DEF[panelId]||'left');
  }

  // Add float button to each pane header
  PANE_IDS.forEach(function(panelId) {
    var panel = document.getElementById(panelId); if (!panel) return;
    var hdr = panel.querySelector('.ctrl-pane-header') ||
              panel.querySelector('#outline-content h3') ||
              panel.querySelector('#props-content h3') ||
              panel.querySelector('h3');
    if (!hdr) return;
    var btn = document.createElement('button');
    btn.className = 'ctrl-pane-float-btn';
    btn.setAttribute('data-pane-float-btn', panelId);
    btn.innerHTML = '&#8599;'; btn.title = 'Undock to float';
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      if (panel.classList.contains('dock-float')) dockBack(panelId);
      else floatPanel(panelId);
    });
    hdr.appendChild(btn);
  });

  // Add resize handles to all panels
  var DIRS = ['n','ne','e','se','s','sw','w','nw'];
  PANE_IDS.forEach(function(panelId) {
    var panel = document.getElementById(panelId); if (!panel) return;
    DIRS.forEach(function(dir) {
      var el = document.createElement('div');
      el.className = 'pane-resize-handle pane-resize-handle-'+dir;
      el.setAttribute('data-resize-dir', dir);
      panel.appendChild(el);
    });
  });

  // Float panel drag (by header)
  var fd=null, fdSX=0, fdSY=0, fdPX=0, fdPY=0;
  document.getElementById('dock-float').addEventListener('mousedown', function(e) {
    if (e.button!==0||e.target.tagName==='BUTTON') return;
    if (e.target.classList.contains('pane-resize-handle')) return;
    var hdr = e.target.closest('.ctrl-pane-header, #outline-content h3, #props-content h3');
    if (!hdr) return;
    var p = hdr;
    while (p && p.parentElement && p.parentElement.id !== 'dock-float') p = p.parentElement;
    if (!p||!p.classList.contains('dock-float')) return;
    fd=p; fdSX=e.clientX; fdSY=e.clientY;
    fdPX=parseFloat(p.style.left)||0; fdPY=parseFloat(p.style.top)||0;
    p.style.zIndex=String(zCounter++);
    e.preventDefault();
  });

  // Resize drag
  var rd=null, rdDir='', rdSX=0, rdSY=0, rdPX=0, rdPY=0, rdPW=0, rdPH=0;
  document.addEventListener('mousedown', function(e) {
    if (e.button!==0||!e.target.classList.contains('pane-resize-handle')) return;
    var p=e.target.parentElement;
    if (!p||!p.classList.contains('dock-float')) return;
    rd=p; rdDir=e.target.getAttribute('data-resize-dir');
    rdSX=e.clientX; rdSY=e.clientY;
    rdPX=parseFloat(p.style.left)||0; rdPY=parseFloat(p.style.top)||0;
    rdPW=parseFloat(p.style.width)||FLOAT_W; rdPH=parseFloat(p.style.height)||FLOAT_H;
    p.style.zIndex=String(zCounter++);
    e.preventDefault(); e.stopPropagation();
  }, true);

  document.addEventListener('mousemove', function(e) {
    if (fd) {
      var pos = clampToViewport(fd, {
        w: parseFloat(fd.style.width) || FLOAT_W,
        h: parseFloat(fd.style.height) || FLOAT_H,
        x: fdPX + (e.clientX - fdSX),
        y: fdPY + (e.clientY - fdSY),
      });
      fd.style.left = pos.x + 'px';
      fd.style.top  = pos.y + 'px';
    }
    if (rd) {
      var dx=e.clientX-rdSX, dy=e.clientY-rdSY, dir=rdDir;
      var x=rdPX,y=rdPY,w=rdPW,h=rdPH;
      if (dir.indexOf('e')>=0) w=Math.max(MIN_W,rdPW+dx);
      if (dir.indexOf('s')>=0) h=Math.max(MIN_H,rdPH+dy);
      if (dir.indexOf('w')>=0) { var nw=Math.max(MIN_W,rdPW-dx); x=rdPX+(rdPW-nw); w=nw; }
      if (dir.indexOf('n')>=0) { var nh=Math.max(MIN_H,rdPH-dy); y=rdPY+(rdPH-nh); h=nh; }
      rd.style.left=x+'px'; rd.style.top=y+'px'; rd.style.width=w+'px'; rd.style.height=h+'px';
    }
  });

  document.addEventListener('mouseup', function() {
    if (fd) { saveState(fd.id,parseFloat(fd.style.left)||0,parseFloat(fd.style.top)||0,parseFloat(fd.style.width)||FLOAT_W,parseFloat(fd.style.height)||FLOAT_H); fd=null; }
    if (rd) { saveState(rd.id,parseFloat(rd.style.left)||0,parseFloat(rd.style.top)||0,parseFloat(rd.style.width)||FLOAT_W,parseFloat(rd.style.height)||FLOAT_H); rd=null; rdDir=''; }
  });

  // Clamp all floating panels on window resize
  window.addEventListener('resize', function() {
    PANE_IDS.forEach(function(panelId) {
      var panel = document.getElementById(panelId);
      if (panel && panel.classList.contains('dock-float') && !panel.classList.contains('off')) {
        clampFloatPanel(panel);
      }
    });
  });

  // Restore floating panels on load
  PANE_IDS.forEach(function(panelId) {
    var s; try { s=localStorage.getItem('tvs:dock:'+panelId); } catch(e) {}
    if (s==='float') floatPanel(panelId);
  });
})();

// ── Vertical pane width resize ───────────────────────────────────────────────
(function() {
  var PANE_IDS = ['format-pane','text-pane','form-pane','outline-panel','props-panel'];
  var MIN_W = 100; // enough to show icons; labels can be clipped
  var LS_PREFIX = 'tvs:pane-w:';

  function lsKey(id) { return LS_PREFIX + id; }
  function saveW(id, w) { try { localStorage.setItem(lsKey(id), w); } catch(e) {} }
  function loadW(id) { try { var v = localStorage.getItem(lsKey(id)); return v ? parseInt(v, 10) : null; } catch(e) { return null; } }

  function isVertical(pane) {
    return !pane.classList.contains('pane-h') &&
           !pane.classList.contains('dock-float') &&
           !pane.classList.contains('collapsed') &&
           !pane.classList.contains('off');
  }

  PANE_IDS.forEach(function(id) {
    var pane = document.getElementById(id);
    if (!pane) return;

    // Restore saved width only when pane is in vertical open state
    var saved = loadW(id);
    if (saved && isVertical(pane)) pane.style.width = saved + 'px';

    // Create handle
    var handle = document.createElement('div');
    handle.className = 'pane-width-handle';
    pane.appendChild(handle);

    handle.addEventListener('mousedown', function(e) {
      if (!isVertical(pane)) return;
      e.preventDefault();
      var startX = e.clientX;
      var startW = pane.offsetWidth;
      var onRight = pane.classList.contains('dock-right');
      handle.classList.add('dragging');
      pane.classList.add('pane-resizing');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      function onMove(e) {
        var dx = e.clientX - startX;
        // Right-docked: dragging left increases width
        var newW = onRight ? Math.max(MIN_W, startW - dx) : Math.max(MIN_W, startW + dx);
        pane.style.width = newW + 'px';
      }
      function onUp() {
        handle.classList.remove('dragging');
        pane.classList.remove('pane-resizing');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        saveW(id, pane.offsetWidth);
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  });
})();

// ── Horizontal pane row-snap resize ─────────────────────────────────────────
(function() {
  var ROW_H    = 44;
  var MAX_ROWS = 4;
  var PANE_IDS = ['format-pane', 'text-pane', 'form-pane'];
  var LS_PREFIX = 'tvs:pane-rows:';

  // Ghost container: one tick line per possible row boundary
  var ghostCtr = document.createElement('div');
  ghostCtr.id = 'pane-h-ghost-ctr';
  document.body.appendChild(ghostCtr);
  var ticks = [];
  for (var ti = 0; ti < MAX_ROWS; ti++) {
    var tick = document.createElement('div');
    tick.className = 'pane-h-row-tick';
    tick.style.top = ((ti + 1) * ROW_H - 1) + 'px';
    ghostCtr.appendChild(tick);
    ticks.push(tick);
  }

  function showGhost(paneRect, snapRow) {
    ghostCtr.style.left   = paneRect.left + 'px';
    ghostCtr.style.width  = (paneRect.right - paneRect.left) + 'px';
    ghostCtr.style.top    = paneRect.top + 'px';
    ghostCtr.style.height = (MAX_ROWS * ROW_H) + 'px';
    ghostCtr.classList.add('show');
    for (var i = 0; i < MAX_ROWS; i++) {
      ticks[i].classList.toggle('snap-active', (i + 1) === snapRow);
    }
  }

  function hideGhost() { ghostCtr.classList.remove('show'); }

  function lsKey(id) { return LS_PREFIX + id; }
  function saveRows(id, n) { try { localStorage.setItem(lsKey(id), n); } catch(e) {} }
  function loadRows(id) { try { var v = localStorage.getItem(lsKey(id)); return v ? Math.max(1, Math.min(MAX_ROWS, parseInt(v, 10))) : 1; } catch(e) { return 1; } }

  function updateIndicator(pane) {
    var body    = pane.querySelector('.ctrl-pane-body');
    var header  = pane.querySelector('.ctrl-pane-header');
    var indFwd  = pane.querySelector('.pane-h-overflow-ind');
    var indBack = pane.querySelector('.pane-h-back-ind');
    if (!body) return;
    if (indBack) {
      indBack.style.left = (header ? header.offsetWidth : 0) + 'px';
      indBack.classList.toggle('show', body.scrollTop > 2);
    }
    if (indFwd)  indFwd.classList.toggle('show',  body.scrollHeight > body.scrollTop + body.clientHeight + 2);
  }

  function applyRows(pane, rows) {
    var h = rows * ROW_H;
    pane.style.height    = h + 'px';
    pane.style.maxHeight = h + 'px';
    var content = pane.querySelector('.ctrl-pane-content');
    var header  = pane.querySelector('.ctrl-pane-header');
    var body    = pane.querySelector('.ctrl-pane-body');
    if (content) content.style.height = h + 'px';
    if (header)  header.style.height  = h + 'px';
    if (body) {
      body.style.height = h + 'px';
      if (rows > 1) {
        body.style.flexWrap     = 'wrap';
        body.style.overflowX    = 'hidden';
        body.style.overflowY    = 'auto';      // scrollable; scrollbar hidden via CSS
        body.style.alignContent = 'flex-start';
      } else {
        body.style.flexWrap     = '';
        body.style.overflowX    = '';
        body.style.overflowY    = '';
        body.style.alignContent = '';
      }
    }
    setTimeout(function() { updateIndicator(pane); }, 0);
  }

  function clearPaneHStyles(pane) {
    pane.style.height    = '';
    pane.style.maxHeight = '';
    var content = pane.querySelector('.ctrl-pane-content');
    var header  = pane.querySelector('.ctrl-pane-header');
    var body    = pane.querySelector('.ctrl-pane-body');
    if (content) content.style.height = '';
    if (header)  header.style.height  = '';
    if (body) {
      body.style.height       = '';
      body.style.flexWrap     = '';
      body.style.overflowX    = '';
      body.style.overflowY    = '';
      body.style.alignContent = '';
    }
    var ind = pane.querySelector('.pane-h-overflow-ind');
    if (ind) ind.classList.remove('show');
    var indB = pane.querySelector('.pane-h-back-ind');
    if (indB) indB.classList.remove('show');
  }

  PANE_IDS.forEach(function(id) {
    var pane = document.getElementById(id);
    if (!pane) return;

    // Left-side back indicator
    var indBack = document.createElement('div');
    indBack.className = 'pane-h-back-ind';
    pane.appendChild(indBack);
    indBack.addEventListener('click', function() {
      var b = pane.querySelector('.ctrl-pane-body');
      if (!b) return;
      b.scrollTo({ top: Math.max(0, b.scrollTop - Math.round(ROW_H / 2)), behavior: 'smooth' });
    });

    // Right-side forward indicator
    var ind = document.createElement('div');
    ind.className = 'pane-h-overflow-ind';
    pane.appendChild(ind);
    ind.addEventListener('click', function() {
      var b = pane.querySelector('.ctrl-pane-body');
      if (!b) return;
      b.scrollTo({ top: b.scrollTop + Math.round(ROW_H / 2), behavior: 'smooth' });
    });

    // Resize handle
    var handle = document.createElement('div');
    handle.className = 'pane-h-resize-handle';
    pane.appendChild(handle);

    // Update indicator on body scroll
    var body = pane.querySelector('.ctrl-pane-body');
    if (body) {
      body.addEventListener('scroll', function() { updateIndicator(pane); });
    }

    // Intercept wheel in multi-row mode to scroll body vertically
    pane.addEventListener('wheel', function(e) {
      var b = pane.querySelector('.ctrl-pane-body');
      if (!b || !pane.classList.contains('pane-h')) return;
      if (loadRows(id) <= 1) return;
      e.preventDefault();
      var delta = e.deltaY !== 0 ? e.deltaY : e.deltaX;
      var step = Math.sign(delta) * Math.min(Math.abs(delta) * 0.3, ROW_H);
      b.scrollBy({ top: step, behavior: 'smooth' });
      updateIndicator(pane);
    }, { passive: false });

    // React to dock-mode class changes
    var observer = new MutationObserver(function() {
      var isPaneH  = pane.classList.contains('pane-h');
      var isActive = isPaneH && !pane.classList.contains('collapsed') && !pane.classList.contains('off');
      if (isActive) {
        var rows = loadRows(id);
        if (rows > 1) applyRows(pane, rows);
        else updateIndicator(pane);
      } else if (!isPaneH) {
        clearPaneHStyles(pane);
      }
    });
    observer.observe(pane, { attributes: true, attributeFilter: ['class'] });

    // Apply on initial load if already in horizontal mode
    if (pane.classList.contains('pane-h')) {
      var rows = loadRows(id);
      if (rows > 1) applyRows(pane, rows);
    }

    handle.addEventListener('mousedown', function(e) {
      if (!pane.classList.contains('pane-h')) return;
      e.preventDefault();
      var paneRect = pane.getBoundingClientRect();
      var snapRow  = loadRows(id);
      handle.classList.add('dragging');
      document.body.style.cursor     = 'row-resize';
      document.body.style.userSelect = 'none';
      showGhost(paneRect, snapRow);

      function onMove(ev) {
        var relY = ev.clientY - paneRect.top;
        snapRow  = Math.max(1, Math.min(MAX_ROWS, Math.round(relY / ROW_H)));
        showGhost(paneRect, snapRow);
      }
      function onUp(ev) {
        handle.classList.remove('dragging');
        document.body.style.cursor     = '';
        document.body.style.userSelect = '';
        hideGhost();
        var relY = ev.clientY - paneRect.top;
        snapRow  = Math.max(1, Math.min(MAX_ROWS, Math.round(relY / ROW_H)));
        applyRows(pane, snapRow);
        saveRows(id, snapRow);
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  });
})();

// ── Options dialog ──────────────────────────────────────────────────────────
(function() {
  var dialog  = document.getElementById('options-dialog');
  var btnOpen = document.getElementById('btn-options');
  var btnClose= document.getElementById('options-dialog-close');

  var optsPane = new FloatingPane(dialog, {
    header:    document.getElementById('options-dialog-header'),
    closeBtn:  btnClose,
    posKey:    'tvs:opts:pos',
    openKey:   'tvs:opts:open',
    sizeEl:    document.getElementById('options-dialog-main'),
    sizeKey:   'tvs:opts:size',
    resizeEl:  document.getElementById('options-dialog-resize'),
    minW: 480, minH: 280,
    showClass: 'show',
  });
  optsPane.restoreSize();

  function openDialog() {
    closeAllDropdowns();
    optsPane.open();
  }

  // Dock picker buttons
  document.querySelectorAll('.opts-dock-btns').forEach(function(group) {
    var panelId = group.dataset.dockPanel;
    group.querySelectorAll('.opts-dock-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        if (btn.dataset.zone === 'float') { if (typeof floatPanel === 'function') floatPanel(panelId); }
        else dockPanel(panelId, btn.dataset.zone);
      });
    });
  });

  // Restore saved dock positions
  (function() {
    var defaults = { 'format-pane': 'left', 'text-pane': 'left', 'form-pane': 'left', 'outline-panel': 'left', 'props-panel': 'right' };
    ['format-pane', 'text-pane', 'form-pane', 'outline-panel', 'props-panel'].forEach(function(id) {
      var saved;
      try { saved = localStorage.getItem('tvs:dock:' + id); } catch(e) {}
      if (saved === 'float') return; // float IIFE handles restore
      var zone = (saved === 'left' || saved === 'right' || saved === 'top' || saved === 'bottom') ? saved : defaults[id];
      if (zone !== defaults[id]) dockPanel(id, zone);
      else {
        // apply dock class without moving (already in correct zone from HTML)
        var panel = document.getElementById(id);
        if (panel) {
          panel.classList.remove('dock-left', 'dock-right', 'dock-top', 'dock-bottom', 'pane-h');
          panel.classList.add('dock-' + zone);
          if (zone === 'top' || zone === 'bottom') {
            panel.classList.add('pane-h');
            if (panel.classList.contains('collapsed') && !panel.classList.contains('off')) {
              if (sidePanelOpenFn[id]) sidePanelOpenFn[id]();
            }
          }
          if (sidePanelArrowSync[id]) sidePanelArrowSync[id]();
        }
      }
    });
  })();

  // ── Transitions toggle ────────────────────────────────────────────────────
  var transBtn = document.getElementById('opts-transitions-toggle');
  function applyTransitions(on) {
    document.body.classList.toggle('no-transitions', !on);
    transBtn.classList.toggle('on', on);
    try { localStorage.setItem('tvs:transitions', on ? '1' : '0'); } catch(e) {}
  }
  transBtn.addEventListener('click', function() {
    applyTransitions(document.body.classList.contains('no-transitions'));
  });
  (function() {
    var saved = (function(){ try { return localStorage.getItem('tvs:transitions'); } catch(e) { return null; } })();
    if (saved === '0') applyTransitions(false);
  })();

  // ── Float panel opacity ────────────────────────────────────────────────────
  var floatOpacitySlider = document.getElementById('opts-float-opacity');
  var floatOpacityVal    = document.getElementById('opts-float-opacity-val');
  function applyFloatOpacity(val) {
    val = Math.max(0, Math.min(100, isNaN(val) ? 70 : val));
    document.documentElement.style.setProperty('--float-panel-opacity', val + '%');
    if (floatOpacityVal)    floatOpacityVal.textContent    = val + '%';
    if (floatOpacitySlider) floatOpacitySlider.value       = val;
    try { localStorage.setItem('tvs:opts:float-opacity', val); } catch(e) {}
  }
  if (floatOpacitySlider) {
    floatOpacitySlider.addEventListener('input', function() {
      applyFloatOpacity(parseInt(floatOpacitySlider.value, 10));
    });
  }
  (function() {
    var saved; try { saved = parseInt(localStorage.getItem('tvs:opts:float-opacity'), 10); } catch(e) {}
    applyFloatOpacity(isNaN(saved) || saved === null ? 70 : saved);
  })();

  var floatBlurSlider = document.getElementById('opts-float-blur');
  var floatBlurVal    = document.getElementById('opts-float-blur-val');
  function applyFloatBlur(val) {
    val = Math.max(0, Math.min(20, val || 0));
    document.documentElement.style.setProperty('--float-panel-blur', val + 'px');
    if (floatBlurVal)    floatBlurVal.textContent    = val + 'px';
    if (floatBlurSlider) floatBlurSlider.value       = val;
    try { localStorage.setItem('tvs:opts:float-blur', val); } catch(e) {}
  }
  if (floatBlurSlider) {
    floatBlurSlider.addEventListener('input', function() {
      applyFloatBlur(parseInt(floatBlurSlider.value, 10));
    });
  }
  (function() {
    var saved; try { saved = parseInt(localStorage.getItem('tvs:opts:float-blur'), 10); } catch(e) {}
    applyFloatBlur(isNaN(saved) ? 0 : saved);
  })();

  // Left nav section switching
  var navBtns = document.querySelectorAll('#opts-nav .opts-nav-btn');
  navBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      navBtns.forEach(function(b) { b.classList.remove('active'); });
      document.querySelectorAll('#opts-content .opts-section').forEach(function(s) { s.classList.remove('active'); });
      btn.classList.add('active');
      var sec = document.getElementById('opts-section-' + btn.dataset.optsSection);
      if (sec) sec.classList.add('active');
      try { localStorage.setItem('tvs:opts:section', btn.dataset.optsSection); } catch(e) {}
      // Build menu-items browser lazily on first visit
      if (btn.dataset.optsSection === 'menu-items' && !dialog._mibBuilt) {
        buildMenuItemsBrowser();
        dialog._mibBuilt = true;
      }
      // Build date format presets editor lazily on first visit
      if (btn.dataset.optsSection === 'date-formats' && !dialog._dfBuilt) {
        buildDateFmtSection();
        dialog._dfBuilt = true;
      }
    });
  });


  // Collapsible toggle helper — still used by other opts sections
  function collToggle(btn, body, lsKey) {
    var saved; try { saved = localStorage.getItem(lsKey); } catch(e) {}
    var open = saved === '1';
    if (open) { btn.classList.add('open'); body.classList.add('open'); }
    btn.addEventListener('click', function() {
      var nowOpen = body.classList.toggle('open');
      btn.classList.toggle('open', nowOpen);
      try { localStorage.setItem(lsKey, nowOpen ? '1' : '0'); } catch(e) {}
    });
  }

  // ── 3-column Menu Items browser ──────────────────────────────────────────
  var MIB_PANES = [
    { label: 'Text Pane',   key: 'text',   items: INSERT_MENU_ITEMS },
    { label: 'Format Pane', key: 'format', items: FORMAT_PANE_ITEMS },
  ];

  function mibGetGroups(items) {
    var groups = [], cur = null;
    items.forEach(function(item) {
      if (item.group) { cur = { label: item.group, items: [] }; groups.push(cur); }
      else if (cur) cur.items.push(item);
    });
    return groups;
  }

  function buildMenuItemsBrowser() {
    var panesCol  = document.getElementById('mib-col-panes');
    var groupsCol = document.getElementById('mib-col-groups');
    var itemsCol  = document.getElementById('mib-col-items');
    if (!panesCol) return;

    // Render the right column: all groups + their items for the pane.
    // Returns a map of groupLabel → divider element for scroll-jumping.
    function renderAllItems(pane) {
      itemsCol.innerHTML = '';
      var hidden  = getHiddenItems(pane.key);
      var groups  = mibGetGroups(pane.items);
      var scrollTargets = {};
      var uidBase = pane.key + '-' + Date.now();
      var uidIdx  = 0;

      if (!groups.length) {
        itemsCol.innerHTML = '<div class="mib-empty">No items in this pane.</div>';
        return scrollTargets;
      }

      groups.forEach(function(group) {
        var divider = document.createElement('div');
        divider.className = 'mib-group-divider';
        divider.textContent = group.label;
        itemsCol.appendChild(divider);

        group.items.forEach(function(item) {
          var id  = 'mib-cb-' + uidBase + '-' + (uidIdx++);
          var row = document.createElement('div');
          row.className = 'mib-item-row';
          var cb  = document.createElement('input');
          cb.type = 'checkbox'; cb.id = id;
          cb.checked = !hidden.has(item.label);
          cb.addEventListener('change', function() { setItemHidden(pane.key, item.label, !cb.checked); });
          var lbl = document.createElement('label');
          lbl.htmlFor = id; lbl.textContent = item.label;
          row.appendChild(cb); row.appendChild(lbl);
          itemsCol.appendChild(row);
        });
      });

      // Read offsetTop synchronously (itemsCol has position:relative so it's offsetParent).
      // padding-bottom:300px on itemsCol guarantees every divider's offsetTop is
      // reachable as scrollTop without any JS spacer measurement.
      var dividerEls = itemsCol.querySelectorAll('.mib-group-divider');
      dividerEls.forEach(function(el, i) {
        scrollTargets[groups[i].label] = el.offsetTop;
      });

      return scrollTargets;
    }

    function renderGroups(paneIdx) {
      var pane    = MIB_PANES[paneIdx];
      var groups  = mibGetGroups(pane.items);
      groupsCol.innerHTML = '';
      var scrollTargets = renderAllItems(pane);

      groups.forEach(function(group, gi) {
        var btn = document.createElement('button');
        btn.className = 'mib-btn' + (gi === 0 ? ' active' : '');
        btn.textContent = group.label;
        btn.title = group.label;
        btn.addEventListener('click', function() {
          groupsCol.querySelectorAll('.mib-btn').forEach(function(b) { b.classList.remove('active'); });
          btn.classList.add('active');
          var target = scrollTargets[group.label];
          if (target !== undefined) itemsCol.scrollTop = target;
        });
        groupsCol.appendChild(btn);
      });
    }

    MIB_PANES.forEach(function(pane, pi) {
      var btn = document.createElement('button');
      btn.className = 'mib-btn' + (pi === 0 ? ' active' : '');
      btn.textContent = pane.label;
      btn.title = pane.label;
      btn.addEventListener('click', function() {
        panesCol.querySelectorAll('.mib-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        renderGroups(pi);
      });
      panesCol.appendChild(btn);
    });

    renderGroups(0);
  }

  btnOpen.addEventListener('click', function(e) { e.stopPropagation(); openDialog(); });
  // close handled by optsPane constructor

  // ── Editing section ──────────────────────────────────────────────────────────
  var autoSaveTimer = null;

  function getAutoSaveFreq() {
    try { var v = parseInt(localStorage.getItem('tvs:opts:autosave-freq'), 10); if (!isNaN(v)) return v; } catch(e) {}
    return 60; // default 1 minute
  }

  function restartAutoSave() {
    if (autoSaveTimer) { clearInterval(autoSaveTimer); autoSaveTimer = null; }
    var freq = getAutoSaveFreq();
    if (freq > 0) { autoSaveTimer = setInterval(function() { if (_unsaved) saveDraft(); }, freq * 1000); }
  }

  var freqSel      = document.getElementById('opts-autosave-freq');
  var depthNum     = document.getElementById('opts-undo-depth-num');
  var depthPreset  = document.getElementById('opts-undo-depth-preset');
  var depthDec     = document.getElementById('opts-undo-depth-dec');
  var depthInc     = document.getElementById('opts-undo-depth-inc');
  var persistBtn   = document.getElementById('opts-persist-undo');
  var blockFmtBtn  = document.getElementById('opts-block-fmt');

  function applyUndoDepth(depth) {
    depth = Math.max(1, Math.min(10000, depth));
    try { localStorage.setItem('tvs:opts:undo-depth', depth); } catch(e) {}
    trimUndoStack(depth);
    updateUndoButtons();
  }

  // Restore saved values
  (function() {
    var freq = getAutoSaveFreq();
    for (var i = 0; i < freqSel.options.length; i++) {
      if (parseInt(freqSel.options[i].value, 10) === freq) { freqSel.selectedIndex = i; break; }
    }
    depthNum.value = getUndoDepth();
    var persist = isPersistUndo();
    persistBtn.classList.toggle('on', persist);
    blockFmtBtn.classList.toggle('on', isBlockLevelFormatting());
  })();

  freqSel.addEventListener('change', function() {
    try { localStorage.setItem('tvs:opts:autosave-freq', freqSel.value); } catch(e) {}
    restartAutoSave();
  });

  if (depthDec) depthDec.addEventListener('click', function() {
    var v = Math.max(1, (parseInt(depthNum.value, 10) || 100) - 10);
    depthNum.value = v; depthPreset.value = ''; applyUndoDepth(v);
  });
  if (depthInc) depthInc.addEventListener('click', function() {
    var v = Math.min(10000, (parseInt(depthNum.value, 10) || 100) + 10);
    depthNum.value = v; depthPreset.value = ''; applyUndoDepth(v);
  });

  // Number input: apply on blur or Enter; clamp to [1, 10000]
  depthNum.addEventListener('change', function() {
    var v = parseInt(depthNum.value, 10);
    if (isNaN(v) || v < 1) v = 1;
    if (v > 10000) v = 10000;
    depthNum.value = v;
    depthPreset.value = ''; // clear preset highlight if custom value
    applyUndoDepth(v);
  });
  depthNum.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') depthNum.blur();
  });

  // Preset dropdown: sets the number input and applies immediately
  depthPreset.addEventListener('change', function() {
    if (!depthPreset.value) return;
    var v = parseInt(depthPreset.value, 10);
    depthNum.value = v;
    depthPreset.value = ''; // reset to "Presets…" so it acts as a one-shot picker
    applyUndoDepth(v);
  });

  persistBtn.addEventListener('click', function() {
    var nowOn = !persistBtn.classList.contains('on');
    persistBtn.classList.toggle('on', nowOn);
    try { localStorage.setItem('tvs:opts:persist-undo', nowOn ? '1' : '0'); } catch(e) {}
  });

  var granPill    = document.getElementById('opts-undo-granularity-pill');
  var granSlider  = document.getElementById('opts-gran-slider');
  var granRadios  = granPill ? granPill.querySelectorAll('input[type="radio"]') : [];
  var windowNum   = document.getElementById('opts-undo-time-window-num');
  var windowDec   = document.getElementById('opts-undo-window-dec');
  var windowInc   = document.getElementById('opts-undo-window-inc');
  var windowRow   = document.getElementById('opts-undo-window-row');

  function getGranPillValue() {
    for (var i = 0; i < granRadios.length; i++) {
      if (granRadios[i].checked) return granRadios[i].value;
    }
    return 'action';
  }
  function syncWindowRowActive() {}
  function syncGranSlider() {
    for (var i = 0; i < granRadios.length; i++) {
      if (granRadios[i].checked) {
        var lbl = granPill.querySelectorAll('label')[i];
        granSlider.style.left  = lbl.offsetLeft + 'px';
        granSlider.style.width = lbl.offsetWidth + 'px';
        break;
      }
    }
  }
  (function() {
    var cur = getUndoGranularity();
    for (var i = 0; i < granRadios.length; i++) {
      granRadios[i].checked = (granRadios[i].value === cur);
    }
    var tw = getUndoTimeWindow();
    if (windowNum) windowNum.value = tw;
    syncWindowRowActive();
    setTimeout(syncGranSlider, 0); // after layout
  })();
  for (var _gi = 0; _gi < granRadios.length; _gi++) {
    granRadios[_gi].addEventListener('change', function() {
      try { localStorage.setItem('tvs:opts:undo-granularity', getGranPillValue()); } catch(e) {}
      cancelUndoDebounce();
      syncWindowRowActive();
      syncGranSlider();
    });
  }

  // Universal pill click handler: clicking anywhere outside a label toggles to the inactive option
  document.addEventListener('click', function(e) {
    var pill = e.target.closest ? e.target.closest('.opts-pill-group') : null;
    if (!pill) return;
    // If the click was on a label or the radio input itself, native for= binding handled it
    if (e.target.closest('label')) return;
    if (e.target.tagName === 'INPUT') return;
    var radios = pill.querySelectorAll('input[type="radio"]');
    if (!radios.length) return;
    var inactive = null;
    for (var _pi = 0; _pi < radios.length; _pi++) {
      if (!radios[_pi].checked) { inactive = radios[_pi]; break; }
    }
    if (inactive) {
      inactive.checked = true;
      inactive.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  var windowPreset = document.getElementById('opts-undo-window-preset');
  function applyTimeWindow(ms) {
    ms = Math.max(100, Math.min(60000, ms));
    if (windowNum) windowNum.value = ms;
    if (windowPreset) windowPreset.value = '';
    try { localStorage.setItem('tvs:opts:undo-time-window', ms); } catch(e) {}
  }
  if (windowPreset) windowPreset.addEventListener('change', function() {
    var v = parseInt(windowPreset.value, 10);
    if (!isNaN(v) && v > 0) { windowNum.value = v; applyTimeWindow(v); }
    windowPreset.value = '';
  });
  if (windowNum) windowNum.addEventListener('change', function() {
    var v = parseInt(windowNum.value, 10);
    if (isNaN(v) || v < 100) v = 100;
    if (v > 60000) v = 60000;
    applyTimeWindow(v);
  });
  if (windowDec) windowDec.addEventListener('click', function() {
    var v = parseInt(windowNum.value, 10) || 1000;
    applyTimeWindow(v <= 500 ? Math.max(100, v - 100) : v <= 5000 ? v - 500 : v - 1000);
  });
  if (windowInc) windowInc.addEventListener('click', function() {
    var v = parseInt(windowNum.value, 10) || 1000;
    applyTimeWindow(v < 500 ? v + 100 : v < 5000 ? v + 500 : Math.min(60000, v + 1000));
  });

  blockFmtBtn.addEventListener('click', function() {
    var nowOn = !blockFmtBtn.classList.contains('on');
    blockFmtBtn.classList.toggle('on', nowOn);
    try { localStorage.setItem('tvs:opts:block-fmt', nowOn ? '1' : '0'); } catch(e) {}
  });

  restartAutoSave();

  // ── Preferences import / export ──────────────────────────────────────────────
  var PREFS_PREFIX = 'tvs:';

  function collectPrefs() {
    var prefs = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(PREFS_PREFIX) === 0) prefs[k] = localStorage.getItem(k);
      }
    } catch(e) {}
    return prefs;
  }

  document.getElementById('opts-export-prefs').addEventListener('click', function() {
    var prefs = collectPrefs();
    saveFile('tessel-preferences.json', JSON.stringify(prefs, null, 2), 'application/json', 'tvs:opts:export-mode-prefs');
  });

  var importFileInput = document.getElementById('opts-import-prefs-file');
  var importStatus    = document.getElementById('opts-import-status');

  document.getElementById('opts-import-prefs').addEventListener('click', function() {
    importFileInput.value = ''; importStatus.textContent = ''; importFileInput.click();
  });

  importFileInput.addEventListener('change', function() {
    var file = importFileInput.files[0];
    if (!file) return;
    var rd = new FileReader();
    rd.onload = function(e) {
      try {
        var prefs = JSON.parse(e.target.result);
        if (typeof prefs !== 'object' || Array.isArray(prefs)) throw new Error('Invalid format');
        var count = 0;
        Object.keys(prefs).forEach(function(k) {
          if (k.indexOf(PREFS_PREFIX) === 0) {
            // Skip the draft document data itself — only import UI/settings keys
            if (k === 'tvs:draft') return;
            try { localStorage.setItem(k, prefs[k]); count++; } catch(ex) {}
          }
        });
        importStatus.style.color = 'var(--accent)';
        importStatus.textContent = count + ' preference' + (count !== 1 ? 's' : '') + ' imported. Reload the page to apply all changes.';
        setStatus('Preferences imported');
      } catch(ex) {
        importStatus.style.color = 'var(--red)';
        importStatus.textContent = 'Error: ' + ex.message;
      }
    };
    rd.readAsText(file);
  });

  // Restore active section and open state — runs last so MIB_PANES and all
  // event listeners are fully initialized before we touch the dialog.
  (function() {
    var savedSection; try { savedSection = localStorage.getItem('tvs:opts:section'); } catch(e) {}
    if (savedSection) {
      var targetBtn = document.querySelector('#opts-nav .opts-nav-btn[data-opts-section="' + savedSection + '"]');
      if (targetBtn) {
        navBtns.forEach(function(b) { b.classList.remove('active'); });
        document.querySelectorAll('#opts-content .opts-section').forEach(function(s) { s.classList.remove('active'); });
        targetBtn.classList.add('active');
        var sec = document.getElementById('opts-section-' + savedSection);
        if (sec) sec.classList.add('active');
        if (savedSection === 'menu-items' && !dialog._mibBuilt) { buildMenuItemsBrowser(); dialog._mibBuilt = true; }
      }
    }
    var wasOpen; try { wasOpen = localStorage.getItem('tvs:opts:open'); } catch(e) {}
    if (wasOpen === '1') openDialog();
  })();
})();

initCustomFonts({
  fontMap: FONT_MAP,
  setStatus: setStatus,
  applyFontFamily: applyFontFamily,
  updateInlineFormatState: updateInlineFormatState,
});
initPaneDragReorder({ dockPanel: dockPanel });

})();
