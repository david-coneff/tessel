
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
import { dockPanel, floatPanel, initDockSystem } from './lib/DockSystem.js';
import { initOptionsDialog } from './lib/OptionsDialog.js';
import { FORMAT_PANE_ITEMS, getHiddenItems, setItemHidden, initPaneBuilder } from './lib/PaneBuilder.js';
import { updateToolbarState, FONT_MAP, updateInlineFormatState, isBlockLevelFormatting,
         applyFontFamily, convertFocusedBlock, closePreview, initInlineFormat } from './lib/InlineFormat.js';
import { initFileOps, initFileOpsListeners, setStatus, markUnsaved, isPersistUndo,
         saveDraft, loadDraft, openMd, openHtml, getCompiledHtml, saveFile,
         closeAllDropdowns, showPreview, flatBlockList } from './lib/FileOps.js';
import { initToolbarWiring } from './lib/ToolbarWiring.js';
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
initFileOps({
  setUnsaved:        function(v) { _unsaved = v; },
  getBlocks:         function() { return blocks; },
  setBlocks:         function(v) { blocks = v; },
  setSelectedBlockId: function(v) { selectedBlockId = v; },
  getFilename:       function() { return _filename; },
  setFilename:       function(v) { _filename = v; },
  renderCanvas:      renderCanvas,
  renderProps:       renderProps,
});
initFileOpsListeners();
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



makeDockablePane({ paneId: 'format-pane', badgeId: 'badge-format', lsKey: 'tvs:format-pane-state' });
makeDockablePane({ paneId: 'text-pane',   badgeId: 'badge-text',   lsKey: 'tvs:text-pane-state' });
makeDockablePane({ paneId: 'form-pane',   badgeId: 'badge-form',   lsKey: 'tvs:form-pane-state' });

initInlineFormat({
  getLastFocusedTextBlockId: function() { return lastFocusedTextBlockId; },
  getBlock:        getBlock,
  markUnsaved:     markUnsaved,
  createHeadingEl: createHeadingEl,
  createParaEl:    createParaEl,
});

initPaneBuilder({
  insertMenuItems:            INSERT_MENU_ITEMS,
  getLastFocusedTextBlockId:  function() { return lastFocusedTextBlockId; },
  insertField:                insertField,
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

initDockSystem();

initOptionsDialog({
  closeAllDropdowns:    closeAllDropdowns,
  insertMenuItems:      INSERT_MENU_ITEMS,
  formatPaneItems:      FORMAT_PANE_ITEMS,
  getHiddenItems:       getHiddenItems,
  setItemHidden:        setItemHidden,
  isPersistUndo:        isPersistUndo,
  isBlockLevelFormatting: isBlockLevelFormatting,
  getUnsaved:           function() { return _unsaved; },
  saveDraft:            saveDraft,
  saveFile:             saveFile,
  setStatus:            setStatus,
});

initCustomFonts({
  fontMap: FONT_MAP,
  setStatus: setStatus,
  applyFontFamily: applyFontFamily,
  updateInlineFormatState: updateInlineFormatState,
});
initPaneDragReorder({ dockPanel: dockPanel });
initToolbarWiring({
  getUnsaved:                function() { return _unsaved; },
  setBlocks:                 function(v) { blocks = v; },
  setSelectedBlockId:        function(v) { selectedBlockId = v; },
  renderCanvas:              renderCanvas,
  renderProps:               renderProps,
  setFilename:               function(v) { _filename = v; },
  setUnsaved:                function(v) { _unsaved = v; },
  getLastFocusedTextBlockId: function() { return lastFocusedTextBlockId; },
  getBlock:                  getBlock,
  markUnsaved:               markUnsaved,
});

})();
