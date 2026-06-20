
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
(function() {
'use strict';

function uid() { return Math.random().toString(36).slice(2, 8); }
function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function slugify(s) { return (s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48)||'field'; }
var DATE_FMT_DEFAULTS = {
  date:     ['YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY', 'DD MMM YYYY', 'MMM DD, YYYY', 'MMMM DD, YYYY'],
  datetime: ['YYYY-MM-DD HH:mm', 'YYYY-MM-DD HH:mm:ss', 'MM/DD/YYYY h:mm A', 'MM/DD/YYYY HH:mm', 'DD/MM/YYYY HH:mm', 'MMM DD, YYYY h:mm A', 'MMMM DD, YYYY h:mm A']
};
function getTzList() {
  try { var tzs = Intl.supportedValuesOf('timeZone'); if (tzs && tzs.length) return tzs; } catch(e) {}
  return ['UTC','America/New_York','America/Chicago','America/Denver','America/Los_Angeles','America/Phoenix','America/Anchorage','Pacific/Honolulu','Europe/London','Europe/Paris','Europe/Berlin','Europe/Moscow','Asia/Dubai','Asia/Kolkata','Asia/Singapore','Asia/Tokyo','Asia/Shanghai','Australia/Sydney','Pacific/Auckland'];
}
var TZ_SHORTCODES = [
  'UTC','GMT',
  'EST','EDT','CST','CDT','MST','MDT','PST','PDT','AKST','AKDT','HST',
  'AST','NST','NDT',
  'WET','CET','CEST','EET','EEST','MSK',
  'IST','PKT','BST','ICT','WIB','CST','JST','KST','AEST','AEDT','ACST','ACDT','AWST',
  'NZST','NZDT','SST','CHST'
];
function getDefaultTimezone() {
  try { var v = localStorage.getItem('tvs:defaultTimezone'); if (v) return v; } catch(e) {}
  return '';
}
function saveDefaultTimezone(tz) {
  try { localStorage.setItem('tvs:defaultTimezone', tz); } catch(e) {}
}
function getDateFmtPresets(type) {
  try {
    var raw = localStorage.getItem('tvs:dateFormatPresets:' + type);
    if (raw) { var arr = JSON.parse(raw); if (Array.isArray(arr) && arr.length) return arr; }
  } catch(e) {}
  return DATE_FMT_DEFAULTS[type].slice();
}
function saveDateFmtPresets(type, arr) {
  try { localStorage.setItem('tvs:dateFormatPresets:' + type, JSON.stringify(arr)); } catch(e) {}
}
function buildDateFmtSection() {
  function buildGroup(containerId, type, label) {
    var wrap = document.getElementById(containerId);
    if (!wrap) return;
    wrap.innerHTML = '';
    var hdr = document.createElement('div');
    hdr.style.cssText = 'display:flex;align-items:center;margin-bottom:8px;';
    var lbl = document.createElement('div'); lbl.className = 'opts-section-label'; lbl.style.margin = '0'; lbl.textContent = label + ' Presets';
    var rst = document.createElement('button'); rst.className = 'datefmt-reset-btn'; rst.textContent = 'Reset defaults';
    rst.addEventListener('click', function() {
      saveDateFmtPresets(type, DATE_FMT_DEFAULTS[type].slice());
      buildGroup(containerId, type, label);
    });
    hdr.appendChild(lbl); hdr.appendChild(rst); wrap.appendChild(hdr);

    var list = document.createElement('div');
    wrap.appendChild(list);

    function rebuildList() {
      var presets = getDateFmtPresets(type);
      list.innerHTML = '';
      presets.forEach(function(pat, idx) {
        var row = document.createElement('div'); row.className = 'datefmt-preset-row';
        var inp = document.createElement('input'); inp.type = 'text'; inp.value = pat;
        inp.addEventListener('change', function() {
          var cur = getDateFmtPresets(type);
          cur[idx] = inp.value.trim() || cur[idx];
          saveDateFmtPresets(type, cur);
          rebuildList();
        });
        var del = document.createElement('button'); del.className = 'opt-del'; del.innerHTML = '&times;'; del.title = 'Remove';
        del.addEventListener('click', function() {
          var cur = getDateFmtPresets(type);
          cur.splice(idx, 1);
          saveDateFmtPresets(type, cur);
          rebuildList();
        });
        row.appendChild(inp); row.appendChild(del); list.appendChild(row);
      });
    }
    rebuildList();

    var addBtn = document.createElement('button'); addBtn.className = 'datefmt-add-btn'; addBtn.textContent = '+ Add preset';
    addBtn.addEventListener('click', function() {
      var cur = getDateFmtPresets(type);
      cur.push(''); saveDateFmtPresets(type, cur);
      rebuildList();
      var rows = list.querySelectorAll('.datefmt-preset-row');
      if (rows.length) rows[rows.length - 1].querySelector('input').focus();
    });
    wrap.appendChild(addBtn);
  }
  buildGroup('opts-datefmt-date-wrap', 'date', 'Date');
  buildGroup('opts-datefmt-datetime-wrap', 'datetime', 'Date-Time');
  var tzWrap = document.getElementById('opts-datefmt-tz-wrap');
  if (tzWrap) {
    tzWrap.innerHTML = '';

    // Mode pill: IANA (city) vs Shortcode
    var tzModeKey = 'tvs:tzPickerMode';
    function getTzMode() { try { return localStorage.getItem(tzModeKey) || 'iana'; } catch(e) { return 'iana'; } }
    function saveTzMode(m) { try { localStorage.setItem(tzModeKey, m); } catch(e) {} }

    var pillWrap = document.createElement('div');
    pillWrap.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:8px;';
    var pillLbl = document.createElement('span');
    pillLbl.textContent = 'Format';
    pillLbl.style.cssText = 'font-size:11px;color:var(--muted);';
    var pill = document.createElement('div');
    pill.className = 'opts-pill-group';
    pill.id = 'opts-tz-mode-pill';
    pill.innerHTML = '<div class="opts-pill-slider" id="opts-tz-mode-slider"></div>'
      + '<input type="radio" name="tz-mode" id="opts-tz-mode-iana" value="iana">'
      + '<label for="opts-tz-mode-iana">Region/City</label>'
      + '<input type="radio" name="tz-mode" id="opts-tz-mode-short" value="short">'
      + '<label for="opts-tz-mode-short">Shortcode</label>';
    pillWrap.appendChild(pillLbl);
    pillWrap.appendChild(pill);
    tzWrap.appendChild(pillWrap);

    // Datalists
    var ianaListId = 'tz-iana-datalist';
    var shortListId = 'tz-short-datalist';
    var ianaDl = document.getElementById(ianaListId);
    if (!ianaDl) {
      ianaDl = document.createElement('datalist');
      ianaDl.id = ianaListId;
      var tzs = getTzList();
      for (var ti = 0; ti < tzs.length; ti++) {
        var o = document.createElement('option'); o.value = tzs[ti]; ianaDl.appendChild(o);
      }
      document.body.appendChild(ianaDl);
    }
    var shortDl = document.getElementById(shortListId);
    if (!shortDl) {
      shortDl = document.createElement('datalist');
      shortDl.id = shortListId;
      for (var si = 0; si < TZ_SHORTCODES.length; si++) {
        var so = document.createElement('option'); so.value = TZ_SHORTCODES[si]; shortDl.appendChild(so);
      }
      document.body.appendChild(shortDl);
    }

    // Input + Clear row
    var inputRow = document.createElement('div');
    inputRow.style.cssText = 'display:flex;align-items:center;gap:6px;';
    var tzInput = document.createElement('input');
    tzInput.type = 'text';
    tzInput.className = 'opts-text-input';
    tzInput.style.cssText = 'flex:1;min-width:0;';
    var defTz = getDefaultTimezone();
    if (defTz) tzInput.value = defTz;
    var tzClearBtn = document.createElement('button');
    tzClearBtn.type = 'button';
    tzClearBtn.className = 'opts-num-step-btn';
    tzClearBtn.style.cssText = 'font-size:11px;padding:5px 8px;';
    tzClearBtn.textContent = 'Clear';
    inputRow.appendChild(tzInput);
    inputRow.appendChild(tzClearBtn);
    tzWrap.appendChild(inputRow);

    function applyTzMode(mode) {
      tzInput.setAttribute('list', mode === 'short' ? shortListId : ianaListId);
      tzInput.placeholder = mode === 'short' ? 'e.g. MST, EDT, UTC' : 'e.g. America/New_York';
      // sync pill radios
      var radios = pill.querySelectorAll('input[type="radio"]');
      for (var ri = 0; ri < radios.length; ri++) radios[ri].checked = (radios[ri].value === mode);
      // sync slider
      setTimeout(function() {
        var slider = document.getElementById('opts-tz-mode-slider');
        var labels = pill.querySelectorAll('label');
        for (var li = 0; li < labels.length; li++) {
          var r = pill.querySelectorAll('input[type="radio"]')[li];
          if (r && r.checked) {
            slider.style.left = labels[li].offsetLeft + 'px';
            slider.style.width = labels[li].offsetWidth + 'px';
            break;
          }
        }
      }, 0);
    }

    var modeRadios = pill.querySelectorAll('input[type="radio"]');
    for (var mri = 0; mri < modeRadios.length; mri++) {
      modeRadios[mri].addEventListener('change', function() {
        var m = this.value;
        saveTzMode(m);
        applyTzMode(m);
        // Re-render props panel so the per-field tz picker uses the same mode
        if (typeof renderProps === 'function') renderProps();
      });
    }

    tzInput.addEventListener('change', function() { saveDefaultTimezone(tzInput.value.trim()); });
    tzClearBtn.addEventListener('click', function() { tzInput.value = ''; saveDefaultTimezone(''); });

    applyTzMode(getTzMode());
  }
}
function formatDatePattern(date, pattern) {
  var ML = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var MS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var Y = date.getFullYear(), Mo = date.getMonth(), D = date.getDate();
  var H = date.getHours(), min = date.getMinutes(), sec = date.getSeconds();
  var h = H % 12 || 12, ampm = H < 12 ? 'AM' : 'PM';
  var pad = function(n) { return n < 10 ? '0'+n : ''+n; };
  var tk = { 'YYYY':Y, 'YY':String(Y).slice(-2), 'MMMM':ML[Mo], 'MMM':MS[Mo],
             'MM':pad(Mo+1), 'M':Mo+1, 'DD':pad(D), 'D':D,
             'HH':pad(H), 'H':H, 'hh':pad(h), 'h':h, 'mm':pad(min), 'ss':pad(sec), 'A':ampm, 'a':ampm.toLowerCase() };
  return pattern.replace(/YYYY|YY|MMMM|MMM|MM|M|DD|D|HH|H|hh|h|mm|ss|A|a/g, function(t) { return tk[t] !== undefined ? tk[t] : t; });
}

var blocks = [];
var selectedBlockId = null;
var lastFocusedTextBlockId = null;
var _unsaved = false;
var _filename = 'document';

// Undo/Redo
var undoStack = [], redoStack = [];

function getUndoDepth() {
  try { var v = parseInt(localStorage.getItem('tvs:opts:undo-depth'), 10); if (v > 0) return v; } catch(e) {}
  return 100;
}
function getUndoGranularity() {
  try { return localStorage.getItem('tvs:opts:undo-granularity') || 'action'; } catch(e) { return 'action'; }
}
function getUndoTimeWindow() {
  try { var v = parseInt(localStorage.getItem('tvs:opts:undo-time-window'), 10); if (v > 0) return v; } catch(e) {}
  return 1000;
}

var _undoDebounceTimer = null;
var _undoPendingSnapshot = null;
// Called BEFORE the mutation so blocks still holds the pre-change state.
// Action mode: push immediately. Time mode: snapshot now, push after the quiet window.
function inputPushUndo() {
  if (getUndoGranularity() === 'action') {
    pushUndo();
  } else {
    if (_undoDebounceTimer === null) {
      // First keystroke of this burst — capture pre-burst state now
      _undoPendingSnapshot = JSON.stringify(blocks);
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

function pushUndo() {
  undoStack.push(JSON.stringify(blocks));
  var depth = getUndoDepth();
  while (undoStack.length > depth) undoStack.shift();
  redoStack = [];
  updateUndoButtons();
}

function undo() {
  if (!undoStack.length) return;
  redoStack.push(JSON.stringify(blocks));
  blocks = JSON.parse(undoStack.pop());
  selectedBlockId = null;
  renderCanvas();
  renderProps();
  updateUndoButtons();
  setStatus('Undo');
}

function redo() {
  if (!redoStack.length) return;
  undoStack.push(JSON.stringify(blocks));
  blocks = JSON.parse(redoStack.pop());
  selectedBlockId = null;
  renderCanvas();
  renderProps();
  updateUndoButtons();
  setStatus('Redo');
}

function updateUndoButtons() {
  document.getElementById('btn-undo').disabled = undoStack.length === 0;
  document.getElementById('btn-redo').disabled = redoStack.length === 0;
}

var FIELD_TYPES = {
  text:       { icon: 'T',   badge: 'Text Field',    hasOptions: false },
  area:       { icon: '📄',  badge: 'Text Area',     hasOptions: false },
  date:       { icon: '📅',  badge: 'Date',          hasOptions: false },
  radio:      { icon: '⊙',  badge: 'Radio Buttons',  hasOptions: true  },
  check:      { icon: '☑',  badge: 'Checkboxes',     hasOptions: true  },
  select:     { icon: '▾',   badge: 'Dropdown',      hasOptions: true  },
  credential: { icon: '🔑',  badge: 'Credential',    hasOptions: false },
  totp:       { icon: '🔐',  badge: 'TOTP Code',     hasOptions: false },
  filename:   { icon: '📂',  badge: 'Filename',      hasOptions: false },
  dir:        { icon: '🗂',  badge: 'Directory',     hasOptions: false },
  parse:      { icon: '🔍',  badge: 'Parse',         hasOptions: false },
  number:     { icon: '#',   badge: 'Number',        hasOptions: false },
  email:      { icon: '@',   badge: 'Email',         hasOptions: false },
  phone:      { icon: '☎',  badge: 'Phone',          hasOptions: false },
  url:        { icon: '🔗', badge: 'URL',             hasOptions: false },
  datetime:   { icon: '🕐', badge: 'DateTime',       hasOptions: false },
  image:      { icon: '🖼', badge: 'Image',           hasOptions: false, hasSrc: true },
  richtext:   { icon: '✍',  badge: 'Rich Text',      hasOptions: false },
  computed:   { icon: '⚡', badge: 'Computed',       hasOptions: false, hasExpr: true },
  signature:  { icon: '✒',  badge: 'Signature',      hasOptions: false },
  attachment: { icon: '📎', badge: 'Attachment',     hasOptions: false },
};

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

function serializeBlocks(blks) {
  return blks.map(serializeBlock).filter(function(s){ return s !== null && s !== undefined && s !== ''; }).join('\n\n');
}

function serializeBlock(b) {
  if (b.type === 'heading') return '#'.repeat(b.level) + ' ' + (b.text||'');
  if (b.type === 'paragraph') return (b.text||'').replace(/<br\s*\/?>/gi,'\n').replace(/<[^>]+>/g,'');
  if (b.type === 'hr') return '---';
  if (b.type === 'list') return (b.items || ['']).map(function(item, i) {
    var text = item.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');
    return (b.ordered ? (i + 1) + '. ' : '- ') + text;
  }).join('\n');
  if (b.type === 'codeblock') return '```' + (b.lang||'') + '\n' + (b.code||'') + '\n```';
  if (b.type === 'section') return '@section ' + (b.title||'Section') + '\n\n' + serializeBlocks(b.children||[]) + '\n\n@endsection';
  if (b.type === 'field') {
    var lines = [];
    var ft = b.fieldType;
    var hasOptions = FIELD_TYPES[ft] && FIELD_TYPES[ft].hasOptions;
    if (hasOptions && b.options && b.options.length) {
      lines.push('@' + ft + ' ' + (b.label||'Label') + ': ' + b.options.join(', '));
    } else {
      lines.push('@' + ft + ' ' + (b.label||'Label'));
    }
    var metaLines = [];
    if (b.meta.id) metaLines.push('  id = ' + b.meta.id);
    if (b.meta.required) metaLines.push('  required = true');
    if (b.meta.required_if) metaLines.push('  required_if = ' + b.meta.required_if);
    if (b.meta.visible_if) metaLines.push('  visible_if = ' + b.meta.visible_if);
    if (b.meta.validate) metaLines.push('  validate = ' + b.meta.validate);
    if (b.meta.warning_message) metaLines.push('  warning_message = ' + b.meta.warning_message);
    if (ft === 'image' && b.meta.src) metaLines.push('  src = ' + b.meta.src);
    if (ft === 'computed' && b.meta.expr) metaLines.push('  expr = ' + b.meta.expr);
    if (metaLines.length) { lines.push('{'); metaLines.forEach(function(m){ lines.push(m); }); lines.push('}'); }
    return lines.join('\n');
  }
  return '';
}

function astToBlocks(ast) {
  return (ast.blocks || ast.body || []).map(nodeToBlock).filter(Boolean);
}

function nodeToBlock(n) {
  if (!n) return null;
  if (n.type === 'heading') return { type:'heading', level:n.level, text:n.text||'', id:uid() };
  if (n.type === 'paragraph') return { type:'paragraph', text:(n.html||n.text||''), id:uid() };
  if (n.type === 'hr') return { type:'hr', id:uid() };
  if (n.type === 'code_block') return { type:'codeblock', lang:n.lang||'', code:n.content||n.code||'', id:uid() };
  if (n.type === 'section' || n.type === 'subsection') {
    return { type:'section', title:n.title||'', children:(n.blocks||[]).map(nodeToBlock).filter(Boolean), id:uid() };
  }
  var fieldMap = {
    text_field:'text', area_field:'area', date_field:'date',
    radio_field:'radio', check_field:'check', select_field:'select',
    credential_field:'credential', totp_field:'totp',
    filename_field:'filename', dir_field:'dir', parse_field:'parse',
    number_field:'number', email_field:'email', phone_field:'phone',
    url_field:'url', datetime_field:'datetime', image_field:'image',
    richtext_field:'richtext', computed_field:'computed', signature_field:'signature'
  };
  if (fieldMap[n.type]) {
    var opts = (n.options||[]).map(function(o){ return typeof o === 'string' ? o : (o.label||''); });
    var m = n.meta || {};
    return { type:'field', fieldType:fieldMap[n.type], label:n.label||'', options:opts,
      meta:{ id:m.id||n.id, required:m.required, required_if:m.required_if,
             visible_if:m.visible_if, validate:m.validate, warning_message:m.warning_message,
             src:m.src, expr:m.expr }, id:uid() };
  }
  return null;
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
  var inp = document.createElement('input');
  inp.type = 'text'; inp.className = 'prop-input'; inp.value = val;
  inp.addEventListener('input', function() { onChange(inp.value); });
  return inp;
}

function mkCheckRow(label, checked, onChange) {
  var row = document.createElement('div'); row.className = 'prop-check-row';
  var lbl = document.createElement('label'); lbl.style.fontSize = '11px'; lbl.style.color = 'var(--text)';
  var cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = !!checked; cb.style.marginRight = '6px';
  cb.addEventListener('change', function() { onChange(cb.checked); });
  lbl.appendChild(cb);
  lbl.appendChild(document.createTextNode(label));
  row.appendChild(lbl);
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
    if (isPersistUndo()) { payload.undoStack = undoStack; payload.redoStack = redoStack; }
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
      if (payload.undoStack) { undoStack = payload.undoStack; redoStack = payload.redoStack || []; }
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
      blocks = TesselCompiler.parseMd(e.target.result);
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
        blocks = TesselCompiler.parseMd(raw);
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
// TesselCompiler — self-contained block→HTML pipeline (no external deps)
// ---------------------------------------------------------------------------
var TesselCompiler = (function() {
  'use strict';

  // ── Helpers ────────────────────────────────────────────────────────────────
  function e(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function slug(s) { return (s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }

  // Inline markdown: **bold**, `code`, [text](url)
  function inlineMd(s) {
    s = String(s||'');
    // escape HTML first (content should be treated as text with markdown on top)
    s = s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    s = s.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
    s = s.replace(/`([^`]+)`/g,'<code>$1</code>');
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>');
    return s;
  }

  // ── Block renderers ─────────────────────────────────────────────────────────
  function renderHeading(b, ctx) {
    var lvl = Math.min(6, Math.max(1, b.level||1));
    var txt = b.text || '';
    var id  = 'h-' + slug(txt);
    ctx.headings.push({ lvl: lvl, text: txt, id: id });
    return '<h' + lvl + ' id="' + e(id) + '">' + inlineMd(txt) + '</h' + lvl + '>';
  }

  function renderParagraph(b) {
    // b.text may already contain inline HTML from the editor
    var t = (b.text||'').replace(/<br\s*\/?>/gi,'\n').trim();
    if (!t) return '';
    // Split on newlines to preserve line breaks; treat as paragraph
    return '<p>' + t.replace(/\n/g,'<br>') + '</p>';
  }

  function renderList(b) {
    var tag = b.ordered ? 'ol' : 'ul';
    var items = (b.items||['']).map(function(item) {
      var txt = (item||'').replace(/<br\s*\/?>/gi,'\n').replace(/<[^>]+>/g,'');
      return '<li>' + inlineMd(txt) + '</li>';
    }).join('\n');
    return '<' + tag + '>\n' + items + '\n</' + tag + '>';
  }

  function renderCodeblock(b) {
    var lang = e(b.lang||'');
    var code = e(b.code||'');
    var copyable = /^(bash|sh|shell|console|cmd|powershell|ps1|zsh|fish)$/i.test(b.lang||'');
    return '<div class="tc-codewrap">' +
      (copyable ? '<button class="tc-copy-btn" onclick="tcCopy(this)">Copy</button>' : '') +
      (lang ? '<span class="tc-code-lang">' + lang + '</span>' : '') +
      '<pre><code' + (lang ? ' class="lang-' + lang + '"' : '') + '>' + code + '</code></pre>' +
      '</div>';
  }

  function renderHr() { return '<hr>'; }

  function renderSection(b, ctx, depth) {
    var title = b.title || 'Section';
    var id = 'sec-' + slug(title) + '-' + Math.random().toString(36).slice(2,5);
    var inner = renderBlocks(b.children||[], ctx, depth+1);
    return '<details class="tc-section" open>\n' +
      '<summary class="tc-section-summary"><span class="tc-section-title">' + e(title) + '</span></summary>\n' +
      '<div class="tc-section-body">' + inner + '</div>\n' +
      '</details>';
  }

  function renderField(b) {
    var ft = b.fieldType || 'text';
    var label = b.label || 'Field';
    var nid = b.meta && b.meta.id ? b.meta.id : slug(label);
    var req = b.meta && b.meta.required;
    var reqAttr = req ? ' data-required="1"' : '';
    var requireIso = b.meta && b.meta.requireValidDate;
    var requireIsoAttr = requireIso ? ' data-require-iso="1"' : '';
    var labelHtml = '<label class="tc-field-label" for="tcf-' + e(nid) + '">' + e(label) + (req ? ' <span class="tc-req">*</span>' : '') + '</label>';

    var input = '';
    if (ft === 'area' || ft === 'richtext') {
      input = '<textarea id="tcf-' + e(nid) + '" class="tc-field-input tc-area" data-note="' + e(nid) + '"' + reqAttr + ' rows="4" placeholder="' + e(label) + '"></textarea>';
    } else if (ft === 'select') {
      var opts = (b.options||[]).map(function(o){ return '<option value="' + e(o) + '">' + e(o) + '</option>'; }).join('');
      input = '<select id="tcf-' + e(nid) + '" class="tc-field-input tc-select" data-note="' + e(nid) + '"' + reqAttr + '>' + opts + '</select>';
    } else if (ft === 'radio') {
      input = '<div class="tc-radio-group">' + (b.options||[]).map(function(o, i) {
        return '<label class="tc-radio-label"><input type="radio" name="' + e(nid) + '" value="' + e(o) + '" data-note="' + e(nid) + '"' + reqAttr + '> ' + e(o) + '</label>';
      }).join('') + '</div>';
    } else if (ft === 'check') {
      input = '<div class="tc-check-group">' + (b.options||[]).map(function(o) {
        return '<label class="tc-check-label"><input type="checkbox" data-note="' + e(nid) + '-' + e(slug(o)) + '"' + reqAttr + '> ' + e(o) + '</label>';
      }).join('') + '</div>';
    } else if (ft === 'credential' || ft === 'totp') {
      input = '<input type="password" id="tcf-' + e(nid) + '" class="tc-field-input" data-note="' + e(nid) + '"' + reqAttr + ' placeholder="' + e(label) + '" autocomplete="off">';
    } else if (ft === 'date') {
      var dfmt = (b.meta && b.meta.dateFormat) || 'YYYY-MM-DD';
      var dateTz = (b.meta && b.meta.timezone) || getDefaultTimezone();
      var calIcon = '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><rect x="1" y="3" width="14" height="12" rx="1.5"/><path d="M1 7h14M5 1v4M11 1v4"/></svg>';
      input = '<div class="tc-date-wrap">'
            + '<input type="text" id="tcf-' + e(nid) + '" class="tc-field-input tc-date-text" data-note="' + e(nid) + '" data-field-type="date"' + reqAttr + requireIsoAttr + ' data-date-format="' + e(dfmt) + '" data-timezone="' + e(dateTz) + '" placeholder="' + e(dfmt) + '" maxlength="' + dfmt.length + '" autocomplete="off" spellcheck="false">'
            + '<span class="tc-date-shortcuts">'
            + '<button type="button" class="tc-date-now-btn tc-date-clear-btn" onclick="tcClearDate(this)">Clear</button>'
            + '<button type="button" class="tc-date-now-btn" onclick="tcSetNow(this,\'date\')">Today</button>'
            + '</span>'
            + '<button type="button" class="tc-date-cal-btn" onclick="tcOpenPicker(this)" title="Open calendar">' + calIcon + '</button>'
            + '</div>'
            + '<div class="tc-date-format-hint">' + e(dfmt) + '</div>';
    } else if (ft === 'datetime') {
      var dtfmt = (b.meta && b.meta.dateFormat) || 'YYYY-MM-DD HH:mm';
      var datetimeTz = (b.meta && b.meta.timezone) || getDefaultTimezone();
      var calIcon = '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><rect x="1" y="3" width="14" height="12" rx="1.5"/><path d="M1 7h14M5 1v4M11 1v4"/></svg>';
      input = '<div class="tc-date-wrap">'
            + '<input type="text" id="tcf-' + e(nid) + '" class="tc-field-input tc-date-text" data-note="' + e(nid) + '" data-field-type="datetime"' + reqAttr + requireIsoAttr + ' data-date-format="' + e(dtfmt) + '" data-timezone="' + e(datetimeTz) + '" placeholder="' + e(dtfmt) + '" maxlength="' + dtfmt.length + '" autocomplete="off" spellcheck="false">'
            + '<span class="tc-date-shortcuts">'
            + '<button type="button" class="tc-date-now-btn tc-date-clear-btn" onclick="tcClearDate(this)">Clear</button>'
            + '<button type="button" class="tc-date-now-btn" onclick="tcSetNow(this,\'date-only\')">Today</button>'
            + '<button type="button" class="tc-date-now-btn tc-date-now-primary" onclick="tcSetNow(this,\'datetime\')">Right Now</button>'
            + '</span>'
            + '<button type="button" class="tc-date-cal-btn" onclick="tcOpenPicker(this)" title="Open calendar">' + calIcon + '</button>'
            + '</div>'
            + '<div class="tc-date-format-hint">' + e(dtfmt) + '</div>';
    } else if (ft === 'number') {
      input = '<input type="number" id="tcf-' + e(nid) + '" class="tc-field-input" data-note="' + e(nid) + '"' + reqAttr + ' placeholder="' + e(label) + '">';
    } else if (ft === 'email') {
      input = '<input type="email" id="tcf-' + e(nid) + '" class="tc-field-input" data-note="' + e(nid) + '"' + reqAttr + ' placeholder="' + e(label) + '">';
    } else if (ft === 'url') {
      input = '<input type="url" id="tcf-' + e(nid) + '" class="tc-field-input" data-note="' + e(nid) + '"' + reqAttr + ' placeholder="https://">';
    } else if (ft === 'image') {
      var src = b.meta && b.meta.src ? b.meta.src : '';
      input = src ? '<img src="' + e(src) + '" class="tc-image" alt="' + e(label) + '">' : '<div class="tc-image-placeholder">' + e(label) + '</div>';
    } else {
      // text, dir, filename, phone, parse, computed, signature, attachment, etc.
      input = '<input type="text" id="tcf-' + e(nid) + '" class="tc-field-input" data-note="' + e(nid) + '"' + reqAttr + ' placeholder="' + e(label) + '">';
    }

    return '<div class="tc-field" data-field-type="' + e(ft) + '">' + labelHtml + input + '</div>';
  }

  function renderBlocks(blks, ctx, depth) {
    depth = depth || 0;
    return (blks||[]).map(function(b) {
      if (!b) return '';
      switch (b.type) {
        case 'heading':    return renderHeading(b, ctx);
        case 'paragraph':  return renderParagraph(b);
        case 'hr':         return renderHr();
        case 'list':       return renderList(b);
        case 'codeblock':  return renderCodeblock(b);
        case 'section':    return renderSection(b, ctx, depth);
        case 'field':      return renderField(b);
        default:           return '';
      }
    }).filter(Boolean).join('\n');
  }

  // ── TOC ────────────────────────────────────────────────────────────────────
  function buildToc(headings) {
    if (headings.length < 3) return '';
    var items = headings.map(function(h) {
      var indent = h.lvl > 1 ? ' style="margin-left:' + ((h.lvl-1)*14) + 'px"' : '';
      return '<li' + indent + '><a href="#' + e(h.id) + '">' + e(h.text) + '</a></li>';
    }).join('\n');
    return '<details class="tc-toc" open>\n<summary><strong>Contents</strong></summary>\n<ul class="tc-toc-list">\n' + items + '\n</ul>\n</details>\n';
  }

  // ── Embedded output CSS ────────────────────────────────────────────────────
  var OUTPUT_CSS = [
    ':root{--bg:#1a1d23;--surface:#21252e;--text:#cdd6f4;--muted:#7f8498;--accent:#89b4fa;--border:#313244;--code-bg:#181b21;--green:#a6e3a1;--red:#f38ba8;--yellow:#f9e2af;--radius:6px}',
    'body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:15px;line-height:1.65;background:var(--bg);color:var(--text);padding:0}',
    'body.light{--bg:#eff1f5;--surface:#e6e9ef;--text:#4c4f69;--muted:#9399b2;--accent:#1e66f5;--border:#ccd0da;--code-bg:#dce0e8;--green:#40a02b;--red:#d20f39;--yellow:#df8e1d}',
    '#tc-wrap{max-width:860px;margin:0 auto;padding:24px 28px 80px}',
    '#tc-toolbar{position:sticky;top:0;z-index:100;background:var(--surface);border-bottom:1px solid var(--border);padding:6px 14px;display:flex;align-items:center;gap:10px;font-size:13px}',
    '#tc-toolbar button{background:transparent;border:1px solid var(--border);color:var(--text);padding:3px 10px;border-radius:var(--radius);cursor:pointer;font-size:12px}',
    '#tc-toolbar button:hover{background:var(--border)}',
    '#tc-doc-title{font-size:13px;font-weight:600;color:var(--muted);margin-left:4px;flex:1}',
    'h1,h2,h3,h4,h5,h6{color:var(--accent);margin:1.4em 0 .4em;line-height:1.25;font-weight:700}',
    'h1{font-size:2em;border-bottom:1px solid var(--border);padding-bottom:.3em}',
    'h2{font-size:1.45em}h3{font-size:1.2em}h4{font-size:1.05em}',
    'p{margin:.6em 0 1em}',
    'a{color:var(--accent);text-decoration:none}a:hover{text-decoration:underline}',
    'strong{color:var(--text);font-weight:700}',
    'code{background:var(--code-bg);color:var(--green);padding:2px 5px;border-radius:3px;font-size:.88em;font-family:"Fira Mono","Cascadia Code","Consolas",monospace}',
    'pre{background:var(--code-bg);border:1px solid var(--border);border-radius:var(--radius);padding:14px 16px;overflow-x:auto;margin:1em 0}',
    'pre code{background:none;padding:0;font-size:.85em;line-height:1.55}',
    'ul,ol{margin:.4em 0 1em;padding-left:1.8em}li{margin:.2em 0}',
    'hr{border:none;border-top:1px solid var(--border);margin:1.8em 0}',
    'table{width:100%;border-collapse:collapse;font-size:.9em;margin:1em 0}',
    'th{background:var(--surface);color:var(--accent);text-align:left;padding:8px 12px;border:1px solid var(--border)}',
    'td{padding:7px 12px;border:1px solid var(--border)}',
    'blockquote{border-left:3px solid var(--accent);margin:1em 0;padding:.4em 1em;color:var(--muted);background:var(--surface);border-radius:0 var(--radius) var(--radius) 0}',
    // Code wrap / copy button
    '.tc-codewrap{position:relative;margin:1em 0}',
    '.tc-codewrap:hover .tc-copy-btn{opacity:1}',
    '.tc-copy-btn{position:absolute;top:8px;right:8px;opacity:0;transition:opacity .15s;background:var(--surface);border:1px solid var(--border);color:var(--muted);padding:2px 9px;border-radius:4px;font-size:11px;cursor:pointer}',
    '.tc-copy-btn:hover{color:var(--text)}',
    '.tc-copy-btn.copied{color:var(--green);border-color:var(--green)}',
    '.tc-code-lang{position:absolute;top:8px;right:8px;font-size:10px;color:var(--muted);font-family:monospace;pointer-events:none}',
    '.tc-codewrap:hover .tc-code-lang{opacity:0}',
    // Sections
    '.tc-section{border:1px solid var(--border);border-radius:var(--radius);margin:1.2em 0;overflow:hidden}',
    '.tc-section-summary{list-style:none;cursor:pointer;background:var(--surface);padding:10px 14px;display:flex;align-items:center;gap:8px;user-select:none}',
    '.tc-section-summary::-webkit-details-marker{display:none}',
    '.tc-section-summary::before{content:"▶";font-size:10px;color:var(--muted);transition:transform .15s;display:inline-block}',
    '.tc-section[open] .tc-section-summary::before{transform:rotate(90deg)}',
    '.tc-section-title{font-weight:600;color:var(--text)}',
    '.tc-section-body{padding:14px 18px}',
    // TOC
    '.tc-toc{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);margin:0 0 1.6em;padding:10px 16px}',
    '.tc-toc summary{cursor:pointer;font-size:.9em;color:var(--muted);user-select:none;list-style:none}',
    '.tc-toc summary::-webkit-details-marker{display:none}',
    '.tc-toc-list{list-style:none;padding:0;margin:.6em 0 0}',
    '.tc-toc-list li{margin:.3em 0}',
    '.tc-toc-list a{font-size:.88em;color:var(--accent)}',
    // Fields
    '.tc-field{margin:1em 0;display:flex;flex-direction:column;gap:5px}',
    '.tc-field-label{font-size:.85em;font-weight:600;color:var(--muted)}',
    '.tc-req{color:var(--red)}',
    '.tc-field-input{background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:var(--radius);padding:7px 10px;font-size:.9em;font-family:inherit;width:100%;box-sizing:border-box;transition:border-color .15s}',
    '.tc-field-input:focus{outline:none;border-color:var(--accent)}',
    '.tc-field-input.tc-invalid{border-color:var(--red);box-shadow:0 0 0 2px rgba(220,60,60,.18)}',
    '.tc-field-input.tc-valid{border-color:#3dba6e;box-shadow:0 0 0 2px rgba(61,186,110,.15)}',
    '.tc-field.tc-field-valid::after{content:"✓";position:absolute;left:calc(100% + 6px);top:50%;transform:translateY(-50%);color:#3dba6e;font-size:.95em;pointer-events:none;white-space:nowrap}',
    '.tc-field.tc-field-invalid::after{content:"!";position:absolute;left:calc(100% + 6px);top:50%;transform:translateY(-50%);color:#fff;background:var(--red);font-size:.7em;font-weight:700;width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center;pointer-events:none;line-height:16px;text-align:center}',
    '.tc-field{position:relative}',
    '.tc-date-format-hint{font-size:.75em;color:var(--muted);font-family:monospace;margin-top:1px}',
    '.tc-date-wrap{display:flex;align-items:center;position:relative;gap:4px;padding-right:4px;}',
    '.tc-date-wrap .tc-field-input{flex:1;min-width:0;}',
    '.tc-date-cal-btn{display:flex;align-items:center;flex-shrink:0;height:24px;padding:0 5px;background:none;border:1px solid var(--border);border-radius:4px;cursor:pointer;color:var(--text);opacity:.7;line-height:1;}',
    '.tc-date-cal-btn:hover{opacity:1;color:var(--accent);border-color:var(--accent);}',
    '.tc-date-shortcuts{display:flex;align-items:center;gap:4px;flex-shrink:0;}',
    '.tc-date-now-btn{font-size:.7em;padding:2px 7px;height:24px;display:inline-flex;align-items:center;background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:4px;cursor:pointer;line-height:1.4;white-space:nowrap;opacity:.75;}',
    '.tc-date-now-btn:hover{border-color:var(--accent);color:var(--accent);opacity:1;}',
    '.tc-date-now-primary{font-weight:600;}',
    '.tc-date-now-primary:hover{border-color:var(--accent);color:var(--accent);opacity:1;background:rgba(137,180,250,.1);}',
    '.tc-date-clear-btn:hover{border-color:var(--red);color:var(--red);opacity:1;}',
    '.tc-picker{position:fixed;z-index:99999;background:var(--surface);border:1px solid var(--border);border-radius:8px;box-shadow:0 8px 32px rgba(0,0,0,.32);padding:0;min-width:280px;font-size:13px;color:var(--text);user-select:none;}',
    '.tc-picker-header{display:flex;align-items:center;gap:4px;padding:8px 10px;border-bottom:1px solid var(--border);}',
    '.tc-picker-nav{background:none;border:1px solid var(--border);border-radius:4px;cursor:pointer;color:var(--muted);font-size:16px;line-height:1;padding:2px 8px;display:flex;align-items:center;}',
    '.tc-picker-nav:hover{border-color:var(--accent);color:var(--accent);}',
    '.tc-picker-title{flex:1;background:none;border:1px solid var(--border);border-radius:4px;cursor:pointer;color:var(--text);font-weight:600;font-size:12px;padding:4px 8px;text-align:center;}',
    '.tc-picker-title:hover{border-color:var(--accent);color:var(--accent);}',
    '.tc-picker-mo-sel{flex:1;background:var(--surface2);border:1px solid var(--border);border-radius:4px;color:var(--text);font-size:12px;font-weight:600;padding:4px 6px;}',
    '.tc-picker-yr-inp{width:65px;background:var(--surface2);border:1px solid var(--border);border-radius:4px;color:var(--text);font-size:12px;font-weight:600;padding:4px 6px;}',
    '.tc-picker-yr-inp::-webkit-inner-spin-button,.tc-picker-yr-inp::-webkit-outer-spin-button{-webkit-appearance:none;margin:0;}',
    '.tc-picker-close-btn{background:none;border:1px solid var(--border);border-radius:4px;cursor:pointer;color:var(--muted);font-size:16px;line-height:1;padding:2px 7px;display:flex;align-items:center;}',
    '.tc-picker-close-btn:hover{border-color:var(--red,#e06c75);color:var(--red,#e06c75);}',
    '.tc-picker-cal{padding:8px 10px;}',
    '.tc-picker-weekdays{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:4px;}',
    '.tc-picker-wd{text-align:center;font-size:10px;font-weight:600;color:var(--muted);padding:2px 0;}',
    '.tc-picker-days{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;height:182px;align-content:start;}',
    '.tc-picker-day{text-align:center;padding:5px 2px;border-radius:4px;cursor:pointer;font-size:12px;border:1px solid transparent;}',
    '.tc-picker-day:hover{border-color:var(--accent);color:var(--accent);}',
    '.tc-picker-day.tc-picker-day-other{color:var(--muted);opacity:.45;}',
    '.tc-picker-day.tc-picker-day-today{font-weight:700;color:var(--accent);}',
    '.tc-picker-day.tc-picker-day-sel{background:var(--accent);color:#fff;border-color:var(--accent);}',
    '.tc-picker-day.tc-picker-day-sel:hover{background:var(--accent);color:#fff;}',
    '.tc-picker-day.tc-picker-day-empty{cursor:default;}',
    '.tc-picker-time{display:none;border-top:1px solid var(--border);flex-direction:row;align-items:stretch;}',
    '.tc-picker-time-lbl{writing-mode:vertical-rl;transform:rotate(180deg);font-size:11px;color:var(--muted);padding:10px 6px;border-right:1px solid var(--border);display:flex;align-items:center;justify-content:center;letter-spacing:.04em;}',
    '.tc-picker-time-inner{flex:1;display:flex;align-items:center;justify-content:center;padding:10px;gap:8px;}',
    '.tc-picker-time-cols{display:flex;flex-direction:column;gap:3px;flex:1;}',
    '.tc-picker-pill{position:relative;width:80px;border:1px solid var(--border);border-radius:5px;cursor:pointer;overflow:hidden;display:flex;align-self:stretch;}',
    '.tc-picker-pill-thumb{position:absolute;top:2px;left:2px;width:calc(50% - 2px);height:calc(100% - 4px);border-radius:3px;background:var(--accent);transition:transform 0.18s ease;z-index:0;will-change:transform;}',
    '.tc-picker-pill-lbl{flex:1;position:relative;z-index:1;font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center;pointer-events:none;}',
    '.tc-picker-step-row{display:flex;align-items:center;gap:4px;}',
    '.tc-picker-step-spc{width:14px;flex-shrink:0;}',
    '.tc-picker-step{width:100%;box-sizing:border-box;background:none;border:1px solid var(--border);border-radius:4px;cursor:pointer;color:var(--muted);font-size:12px;line-height:1;padding:3px 0;text-align:center;display:block;}',
    '.tc-picker-step:hover{border-color:var(--accent);color:var(--accent);}',
    '.tc-picker-time-row{display:flex;align-items:center;gap:0;margin:3px 0;}',
    '.tc-picker-time-inp{width:100%;box-sizing:border-box;text-align:center;background:var(--surface2);border:1px solid var(--border);border-radius:4px;color:var(--text);font-size:14px;padding:5px 0;-moz-appearance:textfield;outline:none;display:block;}',
    '.tc-picker-time-inp::-webkit-inner-spin-button,.tc-picker-time-inp::-webkit-outer-spin-button{-webkit-appearance:none!important;margin:0;}',
    '.tc-picker-time-inp:focus{border-color:var(--accent);}',
    '.tc-picker-time-sep{font-weight:700;font-size:16px;color:var(--muted);width:22px;display:flex;align-items:center;justify-content:center;align-self:stretch;}',
    '.tc-picker-ampm{display:none;}',
    '.tc-picker-footer{display:flex;align-items:stretch;border-top:1px solid var(--border);padding:8px 10px;gap:0;}',
    '.tc-picker-foot-btn{background:var(--surface2);border:1px solid var(--border);border-radius:4px;cursor:pointer;color:var(--text);font-size:11px;padding:4px 10px;line-height:1.4;}',
    '.tc-picker-foot-btn:hover{border-color:var(--accent);color:var(--accent);}',
    '.tc-picker-today-btn:hover{border-color:var(--accent);background:rgba(137,180,250,.08);}',
    '.tc-picker-clear-btn:hover{border-color:var(--red,#e06c75);color:var(--red,#e06c75);}',
    '.tc-picker-done-btn{font-weight:600;}',
    '.tc-picker-done-btn:hover{border-color:var(--accent);background:rgba(137,180,250,.12);color:var(--accent);}',
    '.tc-date-text{font-family:"Fira Mono","Cascadia Code","Consolas",monospace;font-size:.88em;letter-spacing:.04em;}',
    '.tc-area{resize:vertical;min-height:80px}',
    '.tc-select{cursor:pointer}',
    '.tc-radio-group,.tc-check-group{display:flex;flex-direction:column;gap:6px;padding:4px 0}',
    '.tc-radio-label,.tc-check-label{display:flex;align-items:center;gap:8px;font-size:.9em;cursor:pointer}',
    '.tc-image{max-width:100%;border-radius:var(--radius)}',
    '.tc-image-placeholder{background:var(--surface);border:1px dashed var(--border);padding:24px;text-align:center;color:var(--muted);border-radius:var(--radius);font-size:.85em}',
    // Print
    '@media print{#tc-toolbar{display:none}.tc-copy-btn{display:none}.tc-section{border:none}.tc-section-summary{background:none}}',
  ].join('\n');

  // ── Embedded output JS ─────────────────────────────────────────────────────
  var OUTPUT_JS = [
    '(function(){',
    // Theme
    'var root=document.documentElement;',
    'var saved=localStorage.getItem("tc:theme");',
    'if(saved==="light")document.body.classList.add("light");',
    'document.getElementById("tc-theme-btn").addEventListener("click",function(){',
    '  var l=document.body.classList.toggle("light");',
    '  localStorage.setItem("tc:theme",l?"light":"dark");',
    '  this.textContent=l?"☾":"☀";',
    '});',
    // Expand/collapse all sections
    'document.getElementById("tc-expand-all").addEventListener("click",function(){',
    '  document.querySelectorAll(".tc-section").forEach(function(d){d.open=true});',
    '});',
    'document.getElementById("tc-collapse-all").addEventListener("click",function(){',
    '  document.querySelectorAll(".tc-section").forEach(function(d){d.open=false});',
    '});',
    // Copy button
    'function tcCopy(btn){',
    '  var code=btn.closest(".tc-codewrap").querySelector("code").innerText;',
    '  navigator.clipboard.writeText(code).then(function(){',
    '    btn.textContent="Copied!";btn.classList.add("copied");',
    '    setTimeout(function(){btn.textContent="Copy";btn.classList.remove("copied");},1800);',
    '  }).catch(function(){btn.textContent="Error";setTimeout(function(){btn.textContent="Copy";},1500);});',
    '}',
    'window.tcCopy=tcCopy;',
    // Field persistence
    'var docSlug=document.body.dataset.doc||"default";',
    'var prefix="tc:f:"+docSlug+":";',
    'function saveField(k,v){try{localStorage.setItem(prefix+k,v);}catch(e){}}',
    'function loadFields(){',
    '  document.querySelectorAll("[data-note]").forEach(function(el){',
    '    var v=localStorage.getItem(prefix+el.dataset.note);',
    '    if(v===null)return;',
    '    if(el.type==="checkbox")el.checked=(v==="1");',
    '    else if(el.type==="radio"){if(el.value===v)el.checked=true;}',
    '    else el.value=v;',
    '  });',
    '}',
    'document.addEventListener("input",function(e){',
    '  var el=e.target;if(!el.dataset.note)return;',
    '  if(el.type==="checkbox")saveField(el.dataset.note,el.checked?"1":"0");',
    '  else if(el.type==="radio"){if(el.checked)saveField(el.dataset.note,el.value);}',
    '  else saveField(el.dataset.note,el.value);',
    '  if(el.dataset.required)validateField(el);',
    '});',
    'function validateField(el){',
    '  var empty=false,malformed=false;',
    '  if(el.type==="checkbox"){empty=!el.checked;}',
    '  else if(el.type==="radio"){',
    '    var grp=document.querySelectorAll("input[type=radio][name=\\""+el.name+"\\"]");',
    '    empty=!Array.prototype.some.call(grp,function(r){return r.checked;});',
    '  } else{',
    '    empty=!el.value.trim();',
    '    if(!empty&&el.dataset.requireIso){',
    '      malformed=!el.getAttribute("data-iso-value");',
    '    }',
    '  }',
    '  var invalid=empty||malformed;',
    '  el.classList.toggle("tc-invalid",invalid);',
    '  el.classList.toggle("tc-valid",!invalid);',
    '  var field=el.closest(".tc-field");',
    '  if(field){field.classList.toggle("tc-field-valid",!invalid);field.classList.toggle("tc-field-invalid",invalid);}',
    '}',
    'function validateAll(){',
    '  document.querySelectorAll("[data-required]").forEach(validateField);',
    '}',
    'loadFields();',
    'validateAll();',
    'function tcGetTzParts(date,tz){',
    '  try{',
    '    var fmt=new Intl.DateTimeFormat("en-US",{timeZone:tz,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false});',
    '    var parts=fmt.formatToParts(date);',
    '    var p={};',
    '    for(var i=0;i<parts.length;i++){p[parts[i].type]=parts[i].value;}',
    '    return{year:parseInt(p.year,10),month:parseInt(p.month,10),day:parseInt(p.day,10),hour:parseInt(p.hour,10)%24,minute:parseInt(p.minute,10),second:parseInt(p.second,10)};',
    '  }catch(e){return null;}',
    '}',
    'function tcGetISOWithTz(date,tz){',
    '  if(!tz)return date.toISOString();',
    '  var p=tcGetTzParts(date,tz);',
    '  if(!p)return date.toISOString();',
    '  var pad=function(n){return n<10?"0"+n:""+n;};',
    '  return p.year+"-"+pad(p.month)+"-"+pad(p.day)+"T"+pad(p.hour)+":"+pad(p.minute)+":"+pad(p.second);',
    '}',
    'function tcFmtDate(date,pattern,tz){',
    '  var ML=["January","February","March","April","May","June","July","August","September","October","November","December"];',
    '  var MS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];',
    '  var Y,Mo,D,H,mn,sc;',
    '  if(tz){var tzp=tcGetTzParts(date,tz);if(tzp){Y=tzp.year;Mo=tzp.month-1;D=tzp.day;H=tzp.hour;mn=tzp.minute;sc=tzp.second;}else{Y=date.getFullYear();Mo=date.getMonth();D=date.getDate();H=date.getHours();mn=date.getMinutes();sc=date.getSeconds();}}else{Y=date.getFullYear();Mo=date.getMonth();D=date.getDate();H=date.getHours();mn=date.getMinutes();sc=date.getSeconds();}',
    '  var h=H%12||12,ap=H<12?"AM":"PM";',
    '  var pad=function(n){return n<10?"0"+n:""+n;};',
    '  var tk={YYYY:Y,YY:String(Y).slice(-2),MMMM:ML[Mo],MMM:MS[Mo],MM:pad(Mo+1),M:Mo+1,DD:pad(D),D:D,HH:pad(H),H:H,hh:pad(h),h:h,mm:pad(mn),ss:pad(sc),A:ap,a:ap.toLowerCase()};',
    '  return pattern.replace(/YYYY|YY|MMMM|MMM|MM|M|DD|D|HH|H|hh|h|mm|ss|A|a/g,function(t){return tk[t]!==undefined?tk[t]:t;});',
    '}',
    'function tcSetNow(btn,type){',
    '  var inp=btn.closest(".tc-date-wrap").querySelector(".tc-field-input");',
    '  if(!inp)return;',
    '  var fmt=inp.getAttribute("data-date-format")||"YYYY-MM-DD";',
    '  var tz=inp.getAttribute("data-timezone")||"";',
    '  var now=new Date();',
    '  var pad=function(n){return n<10?"0"+n:""+n;};',
    '  inp.value=tcFmtDate(now,fmt,tz||undefined);',
    '  var hasTime=/HH|H|hh|h/.test(fmt);',
    '  if(tz){',
    '    var tzp=tcGetTzParts(now,tz);',
    '    if(tzp){',
    '      var isoDate=tzp.year+"-"+pad(tzp.month)+"-"+pad(tzp.day);',
    '      inp.setAttribute("data-iso-value",hasTime?isoDate+"T"+pad(tzp.hour)+":"+pad(tzp.minute):isoDate);',
    '    }else{inp.setAttribute("data-iso-value",tcGetISOWithTz(now,""));}',
    '  }else{',
    '    var isoDate2=now.getFullYear()+"-"+pad(now.getMonth()+1)+"-"+pad(now.getDate());',
    '    inp.setAttribute("data-iso-value",hasTime?isoDate2+"T"+pad(now.getHours())+":"+pad(now.getMinutes()):isoDate2);',
    '  }',
    '  inp.dispatchEvent(new Event("input",{bubbles:true}));',
    '}',
    'window.tcSetNow=tcSetNow;',
    'function tcClearDate(btn){',
    '  var inp=btn.closest(".tc-date-wrap").querySelector(".tc-field-input");',
    '  if(!inp)return;',
    '  inp.value="";inp.removeAttribute("data-iso-value");',
    '  inp.dispatchEvent(new Event("input",{bubbles:true}));',
    '}',
    'window.tcClearDate=tcClearDate;',
    // Parse typed text against format pattern → ISO string for export
    'function tcToISO(text,fmt){',
    '  if(!text||!text.trim())return"";',
    '  var pad=function(n){return n<10?"0"+n:""+n;};',
    '  var MS=["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];',
    '  var tokens=[],regStr="^",i=0,fmtRe=/^(YYYY|YY|MMMM|MMM|MM|M|DD|D|HH|H|hh|h|mm|ss|A|a)/;',
    '  while(i<fmt.length){',
    '    var chunk=fmt.slice(i),tm=fmtRe.exec(chunk);',
    '    if(tm){',
    '      tokens.push(tm[1]);i+=tm[1].length;',
    '      if(tm[1]==="YYYY")regStr+="(\\\\d{4})";',
    '      else if(tm[1]==="YY")regStr+="(\\\\d{2})";',
    '      else if(tm[1]==="MMMM"||tm[1]==="MMM")regStr+="([A-Za-z]+)";',
    '      else if(tm[1]==="A"||tm[1]==="a")regStr+="(AM|PM|am|pm)";',
    '      else regStr+="(\\\\d{1,2})";',
    '    } else{regStr+=fmt[i].replace(/[.*+?^${}()|[\\]\\\\]/g,"\\\\$&");i++;}',
    '  }',
    '  var m=new RegExp(regStr,"i").exec(text.trim());',
    '  if(!m)return"";',
    '  var p={};tokens.forEach(function(t,idx){p[t]=m[idx+1];});',
    '  var Y=parseInt(p.YYYY||(p.YY?(parseInt(p.YY,10)<50?2000:1900)+parseInt(p.YY,10):0),10);',
    '  var Mo=0;',
    '  if(p.MM||p.M)Mo=parseInt(p.MM||p.M,10)-1;',
    '  else if(p.MMM||p.MMMM)Mo=MS.indexOf((p.MMM||p.MMMM).slice(0,3).toLowerCase());',
    '  var D=parseInt(p.DD||p.D||1,10);',
    '  var H=parseInt(p.HH||p.H||p.hh||p.h||0,10);',
    '  var ap=p.A||p.a||"";',
    '  if(ap.toLowerCase()==="pm"&&H<12)H+=12;else if(ap.toLowerCase()==="am"&&H===12)H=0;',
    '  var mn=parseInt(p.mm||0,10),sc=parseInt(p.ss||0,10);',
    '  if(!Y||Mo<0||Mo>11||D<1||D>31)return"";',
    '  var hasTime=/HH|H|hh|h/.test(fmt);',
    '  if(hasTime)return Y+"-"+pad(Mo+1)+"-"+pad(D)+"T"+pad(H)+":"+pad(mn)+(sc?":"+pad(sc):"");',
    '  return Y+"-"+pad(Mo+1)+"-"+pad(D);',
    '}',
    // Blur: normalize and store ISO value for export
    'document.addEventListener("input",function(e){',
    '  if(!e.target||!e.target.classList||!e.target.classList.contains("tc-date-text"))return;',
    '  var el=e.target;',
    '  var iso=tcToISO(el.value,el.getAttribute("data-date-format")||"");',
    '  el.setAttribute("data-iso-value",iso||"");',
    '  var field=el.closest?el.closest("[data-field-id]"):null;',
    '  if(field)validateField(field);',
    '},true);',
    'document.addEventListener("blur",function(e){',
    '  var el=e.target;if(!el.classList.contains("tc-date-text"))return;',
    '  var iso=tcToISO(el.value.trim(),el.getAttribute("data-date-format")||"");',
    '  if(iso)el.setAttribute("data-iso-value",iso);else el.removeAttribute("data-iso-value");',
    '  if(el.dataset.requireIso||el.dataset.required)validateField(el);',
    '},true);',
    // Custom calendar picker singleton
    '(function(){',
    'var _pInited=false,_pInp=null,_pFmt=null,_pTz=null,_pIsDatetime=false;',
    'var _pYear=0,_pMonth=0,_pSelDate=null;',
    'var _pHr=12,_pMn=0;',
    'var _p12=false;try{_p12=localStorage.getItem("tc:picker12hr")==="1";}catch(e){}',
    'function _pad(n){return n<10?"0"+n:""+n;}',
    'function _pHrDisp(h){if(!_p12)return _pad(h);var d=h%12;return _pad(d===0?12:d);}',
    'function _pHrFrom12(v,isPm){v=parseInt(v,10);if(isNaN(v))return 0;v=Math.max(1,Math.min(12,v));return isPm?(v===12?12:v+12):(v===12?0:v);}',
    'var _PA="background:var(--accent);border:none;cursor:pointer;font-size:11px;font-weight:600;padding:0 10px;color:#fff;height:100%;";',
    'var _PI="background:var(--surface2);border:none;cursor:pointer;font-size:11px;font-weight:600;padding:0 10px;color:var(--muted);height:100%;";',
    'function _pSyncTime(){',
    '  var hi=document.getElementById("tc-pcr-hr");',
    '  var aw=document.getElementById("tc-pcr-ampm-wrap");',
    '  var at=document.getElementById("tc-pcr-ampm-thumb");',
    '  var am=document.getElementById("tc-pcr-am");',
    '  var pm=document.getElementById("tc-pcr-pm");',
    '  var ft=document.getElementById("tc-pcr-hrfmt-thumb");',
    '  var f12=document.getElementById("tc-pcr-fmt12");',
    '  var f24=document.getElementById("tc-pcr-fmt24");',
    '  if(hi){hi.value=_pHrDisp(_pHr);hi.setAttribute("max",_p12?"12":"23");hi.setAttribute("min",_p12?"1":"0");}',
    '  if(aw){aw.style.opacity=_p12?"1":"0.3";aw.style.pointerEvents=_p12?"":"none";}',
    '  var ia=_pHr<12;',
    '  if(at)at.style.transform=ia?"translateX(0)":"translateX(100%)";',
    '  if(am)am.style.color=ia?"#fff":"var(--muted)";',
    '  if(pm)pm.style.color=ia?"var(--muted)":"#fff";',
    '  if(ft)ft.style.transform=_p12?"translateX(0)":"translateX(100%)";',
    '  if(f12)f12.style.color=_p12?"#fff":"var(--muted)";',
    '  if(f24)f24.style.color=_p12?"var(--muted)":"#fff";',
    '}',
    'function _createPicker(){',
    '  if(document.getElementById("tc-picker"))return;',
    '  var p=document.createElement("div");',
    '  p.id="tc-picker";p.className="tc-picker";p.style.display="none";',
    '  p.innerHTML=',
    '    \'<div class="tc-picker-header">\'',
    '    +\'<button class="tc-picker-nav" id="tc-pcr-prev">&#8249;</button>\'',
    '    +\'<select class="tc-picker-mo-sel" id="tc-pcr-month"><option value="0">January</option><option value="1">February</option><option value="2">March</option><option value="3">April</option><option value="4">May</option><option value="5">June</option><option value="6">July</option><option value="7">August</option><option value="8">September</option><option value="9">October</option><option value="10">November</option><option value="11">December</option></select>\'',
    '    +\'<input class="tc-picker-yr-inp" id="tc-pcr-year" type="number" min="1900" max="2200">\'',
    '    +\'<button class="tc-picker-nav" id="tc-pcr-next">&#8250;</button>\'',
    '    +\'<button class="tc-picker-close-btn" id="tc-pcr-close">&#215;</button>\'',
    '    +\'</div>\'',
    '    +\'<div class="tc-picker-cal">\'',
    '    +\'<div class="tc-picker-weekdays"></div>\'',
    '    +\'<div class="tc-picker-days" id="tc-pcr-days"></div>\'',
    '    +\'</div>\'',
    '    +\'<div class="tc-picker-time" id="tc-pcr-time">\'',
    '    +\'<div class="tc-picker-time-lbl" id="tc-pcr-time-lbl">Time</div>\'',
    '    +\'<div class="tc-picker-time-inner">\'',
    // Grid: [hr col] [sep col] [mn col]
    '    +\'<div style="display:grid;grid-template-columns:1fr auto 1fr;gap:3px 0;flex:1;">\'',
    '    +\'<button class="tc-picker-step" id="tc-pcr-hr-up" style="margin-right:4px;">&#43;</button>\'',
    '    +\'<span style="display:block;width:22px;"></span>\'',
    '    +\'<button class="tc-picker-step" id="tc-pcr-mn-up" style="margin-left:4px;">&#43;</button>\'',
    '    +\'<input class="tc-picker-time-inp" id="tc-pcr-hr" type="number" min="0" max="23" value="12" style="margin-right:4px;">\'',
    '    +\'<span class="tc-picker-time-sep">:</span>\'',
    '    +\'<input class="tc-picker-time-inp" id="tc-pcr-mn" type="number" min="0" max="59" value="0" style="margin-left:4px;">\'',
    '    +\'<button class="tc-picker-step" id="tc-pcr-hr-dn" style="margin-right:4px;">&#8722;</button>\'',
    '    +\'<span style="display:block;width:22px;"></span>\'',
    '    +\'<button class="tc-picker-step" id="tc-pcr-mn-dn" style="margin-left:4px;">&#8722;</button>\'',
    '    +\'</div>\'',
    // AM/PM sliding pill — always in DOM; dimmed in 24h mode via _pSyncTime
    '    +\'<div class="tc-picker-pill" id="tc-pcr-ampm-wrap">\'',
    '    +\'<div class="tc-picker-pill-thumb" id="tc-pcr-ampm-thumb"></div>\'',
    '    +\'<span class="tc-picker-pill-lbl" id="tc-pcr-am" style="color:#fff;">AM</span>\'',
    '    +\'<span class="tc-picker-pill-lbl" id="tc-pcr-pm" style="color:var(--muted);">PM</span>\'',
    '    +\'</div></div>\'',
    '    +\'</div>\'',
    // Footer mirrors time grid: [Done+Clear:1fr] [22px] [Now:1fr] [gap] [12h/24h pill]
    '    +\'<div class="tc-picker-footer tc-picker-footer-dt" id="tc-pcr-footer">\'',
    '    +\'<div id="tc-pcr-lbl-spc" style="display:none;border-right:1px solid transparent;flex-shrink:0;"></div>\'',
    '    +\'<div style="flex:1;display:flex;align-items:center;gap:8px;padding:8px 10px;">\'',
    '    +\'<div style="flex:1;display:grid;grid-template-columns:1fr auto 1fr;">\'',
    '    +\'<div style="margin-right:4px;display:flex;align-items:stretch;">\'',
    '    +\'<button class="tc-picker-foot-btn tc-picker-done-btn" id="tc-pcr-done" style="flex:1;margin-right:3px;">Done</button>\'',
    '    +\'<button class="tc-picker-foot-btn tc-picker-clear-btn" id="tc-pcr-clear" style="flex:1;">Clear</button>\'',
    '    +\'</div>\'',
    '    +\'<span style="width:22px;flex-shrink:0;display:block;"></span>\'',
    '    +\'<div style="margin-left:4px;">\'',
    '    +\'<button class="tc-picker-foot-btn tc-picker-today-btn" id="tc-pcr-today" style="width:100%;">Now</button>\'',
    '    +\'</div></div>\'',
    '    +\'<div class="tc-picker-pill" id="tc-pcr-hrfmt-wrap" style="display:none;">\'',
    '    +\'<div class="tc-picker-pill-thumb" id="tc-pcr-hrfmt-thumb" style="transform:translateX(100%);"></div>\'',
    '    +\'<span class="tc-picker-pill-lbl" id="tc-pcr-fmt12" style="color:var(--muted);">12h</span>\'',
    '    +\'<span class="tc-picker-pill-lbl" id="tc-pcr-fmt24" style="color:#fff;">24h</span>\'',
    '    +\'</div></div>\'',
    '    +\'</div>\';',
    '  var wds=p.querySelector(".tc-picker-weekdays");',
    '  ["Su","Mo","Tu","We","Th","Fr","Sa"].forEach(function(d){',
    '    var s=document.createElement("div");s.className="tc-picker-wd";s.textContent=d;wds.appendChild(s);',
    '  });',
    '  document.body.appendChild(p);',
    '  (function(){',
    '    var sv=p.style.visibility,sd=p.style.display;',
    '    var ts=document.getElementById("tc-picker-time");',
    '    if(!ts)return;',
    '    var stsd=ts.style.display;',
    '    p.style.visibility="hidden";p.style.display="block";',
    '    ts.style.display="flex";',
    '    var tl=document.getElementById("tc-pcr-time-lbl");',
    '    var sp=document.getElementById("tc-pcr-lbl-spc");',
    '    if(tl&&sp)sp.style.width=tl.offsetWidth+"px";',
    '    ts.style.display=stsd;',
    '    p.style.display=sd;p.style.visibility=sv;',
    '  }());',
    '  document.getElementById("tc-pcr-prev").addEventListener("click",function(){_pMonth--;if(_pMonth<0){_pMonth=11;_pYear--;}_renderCal();});',
    '  document.getElementById("tc-pcr-next").addEventListener("click",function(){_pMonth++;if(_pMonth>11){_pMonth=0;_pYear++;}_renderCal();});',
    '  document.getElementById("tc-pcr-close").addEventListener("click",_closePicker);',
    '  document.getElementById("tc-pcr-today").addEventListener("click",function(){var n=new Date();if(_pIsDatetime){_pHr=n.getHours();_pMn=n.getMinutes();_pSyncTime();document.getElementById("tc-pcr-mn").value=_pad(_pMn);}',
    '    _pSelDate=new Date(n.getFullYear(),n.getMonth(),n.getDate());_pYear=_pSelDate.getFullYear();_pMonth=_pSelDate.getMonth();_renderCal();if(!_pIsDatetime)_commitAndClose();});',
    '  document.getElementById("tc-pcr-clear").addEventListener("click",function(){_pSelDate=null;_pHr=0;_pMn=0;_pSyncTime();var m=document.getElementById("tc-pcr-mn");if(m)m.value=_pad(0);_renderCal();});',
    '  document.getElementById("tc-pcr-done").addEventListener("click",_commitAndClose);',
    '  document.getElementById("tc-pcr-hr-dn").addEventListener("click",function(){_pHr=(_pHr-1+24)%24;_pSyncTime();});',
    '  document.getElementById("tc-pcr-hr-up").addEventListener("click",function(){_pHr=(_pHr+1)%24;_pSyncTime();});',
    '  document.getElementById("tc-pcr-mn-dn").addEventListener("click",function(){_pMn=(_pMn-5+60)%60;document.getElementById("tc-pcr-mn").value=_pad(_pMn);});',
    '  document.getElementById("tc-pcr-mn-up").addEventListener("click",function(){_pMn=(_pMn+5)%60;document.getElementById("tc-pcr-mn").value=_pad(_pMn);});',
    '  document.getElementById("tc-pcr-hr").addEventListener("change",function(){',
    '    if(_p12){_pHr=_pHrFrom12(this.value,_pHr>=12);}else{var v=parseInt(this.value,10);_pHr=isNaN(v)?0:Math.max(0,Math.min(23,v));}_pSyncTime();});',
    '  document.getElementById("tc-pcr-mn").addEventListener("change",function(){var v=parseInt(this.value,10);if(isNaN(v))v=0;_pMn=Math.max(0,Math.min(59,v));this.value=_pad(_pMn);});',
    '  function _pToggleAmPm(){_pHr=(_pHr+12)%24;_pSyncTime();}',
    '  document.getElementById("tc-pcr-ampm-wrap").addEventListener("click",_pToggleAmPm);',
    '  function _pToggleFmt(){_p12=!_p12;try{localStorage.setItem("tc:picker12hr",_p12?"1":"0");}catch(e){}_pSyncTime();}',
    '  document.getElementById("tc-pcr-hrfmt-wrap").addEventListener("click",_pToggleFmt);',
    '  var pcrMoSel=document.getElementById("tc-pcr-month");',
    '  if(pcrMoSel)pcrMoSel.addEventListener("change",function(){_pMonth=parseInt(this.value,10);_renderCal();});',
    '  var pcrYrInp=document.getElementById("tc-pcr-year");',
    '  if(pcrYrInp)pcrYrInp.addEventListener("change",function(){var y=parseInt(this.value,10);if(!isNaN(y)&&y>0){_pYear=y;_renderCal();}});',
    '  document.addEventListener("mousedown",function(e){',
    '    var pk=document.getElementById("tc-picker");',
    '    if(pk&&pk.style.display!=="none"&&!pk.contains(e.target)){',
    '      var btn=_pInp&&_pInp.closest(".tc-date-wrap")&&_pInp.closest(".tc-date-wrap").querySelector(".tc-date-cal-btn");',
    '      if(btn&&btn.contains(e.target))return;',
    '      _closePicker();',
    '    }',
    '  },true);',
    '}',
    'function _renderCal(){',
    '  var MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];',
    '  var pcrMoSel=document.getElementById("tc-pcr-month");',
    '  var pcrYrInp=document.getElementById("tc-pcr-year");',
    '  if(pcrMoSel)pcrMoSel.value=String(_pMonth);',
    '  if(pcrYrInp)pcrYrInp.value=String(_pYear);',
    '  var days=document.getElementById("tc-pcr-days");',
    '  if(!days)return;',
    '  days.innerHTML="";',
    '  var firstDay=new Date(_pYear,_pMonth,1).getDay();',
    '  var daysInMonth=new Date(_pYear,_pMonth+1,0).getDate();',
    '  var daysInPrev=new Date(_pYear,_pMonth,0).getDate();',
    '  var today=new Date();today=new Date(today.getFullYear(),today.getMonth(),today.getDate());',
    '  for(var i=0;i<firstDay;i++){',
    '    var d=document.createElement("div");',
    '    d.className="tc-picker-day tc-picker-day-other";',
    '    d.textContent=daysInPrev-firstDay+1+i;',
    '    days.appendChild(d);',
    '  }',
    '  for(var d2=1;d2<=daysInMonth;d2++){',
    '    var cell=document.createElement("div");',
    '    cell.className="tc-picker-day";',
    '    var cellDate=new Date(_pYear,_pMonth,d2);',
    '    if(cellDate.getTime()===today.getTime())cell.className+=" tc-picker-day-today";',
    '    if(_pSelDate&&cellDate.getTime()===_pSelDate.getTime())cell.className+=" tc-picker-day-sel";',
    '    cell.textContent=d2;',
    '    (function(yr,mo,dy){',
    '      cell.addEventListener("click",function(){',
    '        _pSelDate=new Date(yr,mo,dy);',
    '        _renderCal();',
    '        if(!_pIsDatetime)_commitAndClose();',
    '      });',
    '    })(_pYear,_pMonth,d2);',
    '    days.appendChild(cell);',
    '  }',
    '  var trail=42-firstDay-daysInMonth;',
    '  for(var t=1;t<=trail;t++){',
    '    var td=document.createElement("div");',
    '    td.className="tc-picker-day tc-picker-day-other";',
    '    td.textContent=t;',
    '    days.appendChild(td);',
    '  }',
    '}',
    'function _commitAndClose(){',
    '  if(!_pInp||!_pSelDate)return;',
    '  var hr=_pIsDatetime?_pHr:0;',
    '  var mn=_pIsDatetime?_pMn:0;',
    '  var d=new Date(_pSelDate.getFullYear(),_pSelDate.getMonth(),_pSelDate.getDate(),hr,mn,0);',
    '  _pInp.value=tcFmtDate(d,_pFmt,_pTz||undefined);',
    '  _pInp.setAttribute("data-iso-value",_pTz?tcGetISOWithTz(d,_pTz):d.toISOString());',
    '  _pInp.dispatchEvent(new Event("input",{bubbles:true}));',
    '  _closePicker();',
    '}',
    'function _closePicker(){',
    '  var pk=document.getElementById("tc-picker");',
    '  if(pk)pk.style.display="none";',
    '  _pInp=null;',
    '}',
    'function _positionPicker(btn){',
    '  var pk=document.getElementById("tc-picker");',
    '  if(!pk)return;',
    '  pk.style.display="";',
    '  var r=btn.getBoundingClientRect();',
    '  var pw=pk.offsetWidth||260;',
    '  var ph=pk.offsetHeight||300;',
    '  var left=r.left;',
    '  var top=r.bottom+6;',
    '  if(left+pw>window.innerWidth-8)left=window.innerWidth-pw-8;',
    '  if(left<8)left=8;',
    '  if(top+ph>window.innerHeight-8)top=r.top-ph-6;',
    '  if(top<8)top=8;',
    '  pk.style.left=left+"px";',
    '  pk.style.top=top+"px";',
    '}',
    'function tcOpenPicker(btn){',
    '  _createPicker();',
    '  var wrap=btn.closest(".tc-date-wrap");',
    '  var inp=wrap?wrap.querySelector(".tc-field-input"):null;',
    '  if(!inp)return;',
    '  _pInp=inp;',
    '  _pFmt=inp.getAttribute("data-date-format")||"YYYY-MM-DD";',
    '  _pTz=inp.getAttribute("data-timezone")||"";',
    '  _pIsDatetime=inp.getAttribute("data-field-type")==="datetime";',
    '  var iso=tcToISO(inp.value.trim(),_pFmt);',
    '  var now=new Date();',
    '  var initDate=iso?new Date(iso.length<=10?iso+"T00:00":iso):now;',
    '  if(isNaN(initDate.getTime()))initDate=now;',
    '  _pSelDate=new Date(initDate.getFullYear(),initDate.getMonth(),initDate.getDate());',
    '  _pYear=_pSelDate.getFullYear();',
    '  _pMonth=_pSelDate.getMonth();',
    '  _pHr=initDate.getHours();',
    '  _pMn=initDate.getMinutes();',
    '  var timeRow=document.getElementById("tc-pcr-time");',
    '  if(timeRow)timeRow.style.display=_pIsDatetime?"flex":"none";',
    '  var fmtWrap=document.getElementById("tc-pcr-hrfmt-wrap");',
    '  var lblSpc=document.getElementById("tc-pcr-lbl-spc");',
    '  if(fmtWrap)fmtWrap.style.display=_pIsDatetime?"flex":"none";',
    '  if(lblSpc)lblSpc.style.display=_pIsDatetime?"":"none";',
    '  var mnInp=document.getElementById("tc-pcr-mn");',
    '  if(mnInp)mnInp.value=_pad(_pMn);',
    '  _pSyncTime();',
    '  var todayBtn=document.getElementById("tc-pcr-today");',
    '  if(todayBtn)todayBtn.textContent=_pIsDatetime?"Now":"Today";',
    '  _renderCal();',
    '  _positionPicker(btn);',
    '}',
    'window.tcOpenPicker=tcOpenPicker;',
    '})();',
  ].join('\n');

  // ── parseMd — lightweight markdown → blocks ────────────────────────────────
  function parseMd(text) {
    var lines = (text||'').split('\n');
    var blks = [];
    var i = 0;

    function uid2() { return Math.random().toString(36).slice(2,8); }

    while (i < lines.length) {
      var line = lines[i];

      // Blank line — skip
      if (!line.trim()) { i++; continue; }

      // Heading
      var hm = line.match(/^(#{1,6})\s+(.*)/);
      if (hm) {
        blks.push({ type:'heading', level:hm[1].length, text:hm[2].trim(), id:uid2() });
        i++; continue;
      }

      // HR
      if (/^(\-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
        blks.push({ type:'hr', id:uid2() });
        i++; continue;
      }

      // Fenced code block
      if (/^```/.test(line)) {
        var lang = line.replace(/^```/, '').trim();
        var codeLines = [];
        i++;
        while (i < lines.length && !/^```/.test(lines[i])) { codeLines.push(lines[i]); i++; }
        i++; // closing ```
        blks.push({ type:'codeblock', lang:lang, code:codeLines.join('\n'), id:uid2() });
        continue;
      }

      // @section ... @endsection
      var secm = line.match(/^@section\s+(.*)/i);
      if (secm) {
        var secTitle = secm[1].trim();
        var secLines = [];
        i++;
        while (i < lines.length && !/^@endsection/i.test(lines[i])) { secLines.push(lines[i]); i++; }
        i++; // @endsection
        var children = parseMd(secLines.join('\n'));
        blks.push({ type:'section', title:secTitle, children:children, id:uid2() });
        continue;
      }

      // Field directives: @fieldtype [label] [: opt1, opt2]  (label optional for e.g. @attachment)
      var fm = line.match(/^@(\w+)(?:\s+(.*))?$/);
      if (fm) {
        var ft = fm[1].toLowerCase();
        var validFt = /^(text|area|date|radio|check|select|credential|totp|filename|dir|parse|number|email|phone|url|datetime|image|richtext|computed|signature|attachment)$/;
        if (validFt.test(ft)) {
          var rest = fm[2] ? fm[2] : '';
          var opts = [];
          var lbl = rest;
          var colonIdx = rest.indexOf(':');
          if (colonIdx !== -1) {
            lbl = rest.slice(0, colonIdx).trim();
            opts = rest.slice(colonIdx+1).split(',').map(function(s){ return s.trim(); }).filter(Boolean);
          }
          // Consume optional meta block { ... }; repeated keys become arrays
          var meta = {};
          i++;
          if (i < lines.length && lines[i].trim() === '{') {
            i++;
            while (i < lines.length && lines[i].trim() !== '}') {
              var mp = lines[i].match(/^\s*(\w+)\s*=\s*(.*)/);
              if (mp) {
                var mk = mp[1].trim(), mv = mp[2].trim() === 'true' ? true : mp[2].trim();
                if (meta[mk] !== undefined) {
                  if (!Array.isArray(meta[mk])) meta[mk] = [meta[mk]];
                  meta[mk].push(mv);
                } else { meta[mk] = mv; }
              }
              i++;
            }
            i++; // closing }
          }
          // Attachment blocks are not field cards — restore as proper attachment block
          if (ft === 'attachment') {
            var paths = meta.file ? (Array.isArray(meta.file) ? meta.file : [meta.file]) : [];
            blks.push({ type:'attachment', files: paths.map(function(p){ return { name: p.split('/').pop(), data: null, _path: p }; }), id:uid2() });
          } else {
            blks.push({ type:'field', fieldType:ft, label:lbl, options:opts, meta:meta, id:uid2() });
          }
          continue;
        }
      }

      // Unordered list
      if (/^[\-\*\+] /.test(line)) {
        var items = [];
        while (i < lines.length && /^[\-\*\+] /.test(lines[i])) {
          items.push(lines[i].replace(/^[\-\*\+] /,'').trim());
          i++;
        }
        blks.push({ type:'list', ordered:false, items:items, id:uid2() });
        continue;
      }

      // Ordered list
      if (/^\d+\. /.test(line)) {
        var oit = [];
        while (i < lines.length && /^\d+\. /.test(lines[i])) {
          oit.push(lines[i].replace(/^\d+\. /,'').trim());
          i++;
        }
        blks.push({ type:'list', ordered:true, items:oit, id:uid2() });
        continue;
      }

      // Paragraph — accumulate until blank line
      var paraLines = [];
      while (i < lines.length && lines[i].trim() !== '') {
        // stop if next line looks like a block-level element
        if (/^#{1,6} /.test(lines[i]) || /^```/.test(lines[i]) || /^@\w+\s/.test(lines[i]) || /^(\-{3,}|\*{3,}|_{3,})\s*$/.test(lines[i])) break;
        paraLines.push(lines[i]);
        i++;
      }
      if (paraLines.length) {
        blks.push({ type:'paragraph', text:paraLines.join('<br>'), id:uid2() });
      }
    }
    return blks;
  }

  // ── buildPage — wrap body HTML in full document ────────────────────────────
  function buildPage(bodyHtml, opts) {
    opts = opts || {};
    var title = opts.title || 'Document';
    var docSlug = slug(title) || 'document';
    var extraCss = opts.extraCss || '';
    var sourceB64 = opts.sourceB64 || '';

    return '<!DOCTYPE html>\n<html lang="en">\n<head>\n' +
      '<meta charset="UTF-8">\n' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">\n' +
      '<title>' + e(title) + '</title>\n' +
      '<style>\n' + OUTPUT_CSS + (extraCss ? '\n' + extraCss : '') + '\n</style>\n' +
      '</head>\n' +
      '<body data-doc="' + e(docSlug) + '">\n' +
      '<div id="tc-toolbar">\n' +
      '  <span id="tc-doc-title">' + e(title) + '</span>\n' +
      '  <button id="tc-theme-btn" title="Toggle theme">☀</button>\n' +
      '  <button id="tc-expand-all" title="Expand all sections">Expand all</button>\n' +
      '  <button id="tc-collapse-all" title="Collapse all sections">Collapse all</button>\n' +
      '</div>\n' +
      '<div id="tc-wrap">\n' + bodyHtml + '\n</div>\n' +
      (sourceB64 ? '<script type="text/tessel-source" data-encoding="base64">' + sourceB64 + '<\/script>\n' : '') +
      '<script>\n' + OUTPUT_JS + '\n<\/script>\n' +
      '</body>\n</html>';
  }

  // ── blocksToHtml — top-level entry point ────────────────────────────────────
  function blocksToHtml(blks) {
    var ctx = { headings: [] };
    var body = renderBlocks(blks, ctx, 0);
    var toc = buildToc(ctx.headings);
    return toc + body;
  }

  return { blocksToHtml: blocksToHtml, buildPage: buildPage, parseMd: parseMd };
})();
// ---------------------------------------------------------------------------

function getCompiledHtml() {
  var bodyHtml = TesselCompiler.blocksToHtml(blocks);
  var srcB64 = '';
  try { srcB64 = btoa(unescape(encodeURIComponent(JSON.stringify(blocks)))); } catch(e) {}
  var extraCss = '';
  try {
    if (localStorage.getItem('tvs:opts:embed-fonts') === '1') {
      var fc = getCustomFontFaceCSS();
      if (fc) extraCss = fc;
    }
  } catch(e) {}
  return TesselCompiler.buildPage(bodyHtml, { title: _filename, extraCss: extraCss, sourceB64: srcB64 });
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

// ── MiniZip — minimal STORE-method ZIP writer (no external deps) ─────────────
var MiniZip = (function() {
  var enc = new TextEncoder();

  function crc32(buf) {
    if (!MiniZip._t) {
      MiniZip._t = new Int32Array(256);
      for (var n = 0; n < 256; n++) {
        var c = n;
        for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        MiniZip._t[n] = c;
      }
    }
    var crc = -1;
    for (var i = 0; i < buf.length; i++) crc = (MiniZip._t[(crc ^ buf[i]) & 0xFF]) ^ (crc >>> 8);
    return (crc ^ -1) >>> 0;
  }

  function u16(v) { return [(v) & 0xFF, (v >> 8) & 0xFF]; }
  function u32(v) { return [(v) & 0xFF, (v >> 8) & 0xFF, (v >> 16) & 0xFF, (v >>> 24) & 0xFF]; }

  function concat(arrays) {
    var total = 0;
    for (var i = 0; i < arrays.length; i++) total += arrays[i].length;
    var out = new Uint8Array(total), off = 0;
    for (var j = 0; j < arrays.length; j++) { out.set(arrays[j], off); off += arrays[j].length; }
    return out;
  }

  function dataUrlToBytes(dataUrl) {
    var b64 = dataUrl.indexOf(',') !== -1 ? dataUrl.split(',')[1] : dataUrl;
    var bin = atob(b64);
    var out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function toBytes(data) {
    if (typeof data === 'string') return /^data:/.test(data) ? dataUrlToBytes(data) : enc.encode(data);
    return data;
  }

  // files: [{name: string, data: string|Uint8Array}]
  function create(files) {
    var now = new Date();
    var dtime = ((now.getHours() & 0x1F) << 11) | ((now.getMinutes() & 0x3F) << 5) | ((now.getSeconds() >> 1) & 0x1F);
    var ddate = (((now.getFullYear() - 1980) & 0x7F) << 9) | (((now.getMonth() + 1) & 0xF) << 5) | (now.getDate() & 0x1F);
    var locals = [], centrals = [], offsets = [], offset = 0;

    files.forEach(function(f) {
      offsets.push(offset);
      var nameB = enc.encode(f.name);
      var data  = toBytes(f.data);
      var crc   = crc32(data);
      var sz    = data.length;
      var lh    = new Uint8Array([].concat(
        [0x50,0x4B,0x03,0x04], u16(20), u16(0), u16(0),
        u16(dtime), u16(ddate), u32(crc), u32(sz), u32(sz),
        u16(nameB.length), u16(0)
      ));
      locals.push(lh, nameB, data);
      offset += lh.length + nameB.length + sz;

      var cd = new Uint8Array([].concat(
        [0x50,0x4B,0x01,0x02], u16(20), u16(20), u16(0), u16(0),
        u16(dtime), u16(ddate), u32(crc), u32(sz), u32(sz),
        u16(nameB.length), u16(0), u16(0), u16(0), u16(0), u32(0),
        u32(offsets[offsets.length - 1])
      ));
      centrals.push(cd, nameB);
    });

    var cdSize   = centrals.reduce(function(s, p) { return s + p.length; }, 0);
    var eocd     = new Uint8Array([].concat(
      [0x50,0x4B,0x05,0x06], u16(0), u16(0),
      u16(files.length), u16(files.length),
      u32(cdSize), u32(offset), u16(0)
    ));
    return concat(locals.concat(centrals).concat([eocd]));
  }

  return { create: create, dataUrlToBytes: dataUrlToBytes, toBytes: toBytes };
})();

// ── MiniZipReader — read ZIP files, STORE + DEFLATE (DecompressionStream) ────
var MiniZipReader = (function() {
  function r16(b, o) { return (b[o] | (b[o+1] << 8)) >>> 0; }
  function r32(b, o) { return (b[o] | (b[o+1] << 8) | (b[o+2] << 16) | (b[o+3] << 24)) >>> 0; }
  var dec = new TextDecoder('utf-8');

  function findEOCD(buf) {
    for (var i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
      if (buf[i]===0x50 && buf[i+1]===0x4B && buf[i+2]===0x05 && buf[i+3]===0x06) return i;
    }
    return -1;
  }

  function entries(buf) {
    var eocd = findEOCD(buf);
    if (eocd < 0) throw new Error('Not a valid ZIP file');
    var count    = r16(buf, eocd + 10);
    var cdOffset = r32(buf, eocd + 16);
    var list = [];
    var off = cdOffset;
    for (var i = 0; i < count; i++) {
      if (buf[off]!==0x50||buf[off+1]!==0x4B||buf[off+2]!==0x01||buf[off+3]!==0x02) break;
      var compression = r16(buf, off + 10);
      var compSz      = r32(buf, off + 20);
      var uncompSz    = r32(buf, off + 24);
      var nameLen     = r16(buf, off + 28);
      var extraLen    = r16(buf, off + 30);
      var commentLen  = r16(buf, off + 32);
      var localOff    = r32(buf, off + 42);
      var name        = dec.decode(buf.subarray(off + 46, off + 46 + nameLen));
      off += 46 + nameLen + extraLen + commentLen;

      // Locate actual data via local file header
      var lNameLen  = r16(buf, localOff + 26);
      var lExtraLen = r16(buf, localOff + 28);
      var dataOff   = localOff + 30 + lNameLen + lExtraLen;
      list.push({ name: name, compression: compression, compData: buf.subarray(dataOff, dataOff + compSz), uncompSz: uncompSz });
    }
    return list;
  }

  function decompress(entry) {
    if (entry.compression === 0) return Promise.resolve(entry.compData);
    if (entry.compression === 8 && typeof DecompressionStream !== 'undefined') {
      var ds = new DecompressionStream('deflate-raw');
      var w  = ds.writable.getWriter();
      var r  = ds.readable.getReader();
      w.write(entry.compData); w.close();
      var chunks = [];
      var pump = function pump() {
        return r.read().then(function(res) {
          if (res.done) {
            var total = 0;
            for (var j = 0; j < chunks.length; j++) total += chunks[j].length;
            var out = new Uint8Array(total), off = 0;
            for (var k = 0; k < chunks.length; k++) { out.set(chunks[k], off); off += chunks[k].length; }
            return out;
          }
          chunks.push(res.value); return pump();
        });
      }
      return pump();
    }
    return Promise.reject(new Error('Unsupported compression method ' + entry.compression + ' (need STORE or DEFLATE)'));
  }

  // Returns Promise<Object> — map of { 'path/in/zip': Uint8Array }
  function readAll(zipBytes) {
    var buf   = zipBytes instanceof Uint8Array ? zipBytes : new Uint8Array(zipBytes);
    var list  = entries(buf);
    var map   = {};
    return list.reduce(function(p, e) {
      return p.then(function() {
        if (e.name.slice(-1) === '/') return; // skip directory entries
        return decompress(e).then(function(data) { map[e.name] = data; });
      });
    }, Promise.resolve()).then(function() { return map; });
  }

  return { readAll: readAll };
})();

// ── openZip — restore editor state from a .zip md package ─────────────────────
function openZip(file) {
  _filename = file.name.replace(/\.zip$/i, '');
  try { localStorage.setItem('tvs:filename', _filename); } catch(e) {}
  var rd = new FileReader();
  rd.onload = function(ev) {
    MiniZipReader.readAll(ev.target.result).then(function(fileMap) {
      // Find root-level .md (any .md not inside a subdirectory — or the first .md found)
      var mdEntry = null;
      Object.keys(fileMap).forEach(function(name) {
        if (/\.md$/i.test(name) && (!mdEntry || name.split('/').length < mdEntry.split('/').length))
          mdEntry = name;
      });
      if (!mdEntry) { setStatus('No .md file found in ZIP'); return; }

      var mdText = new TextDecoder('utf-8').decode(fileMap[mdEntry]);
      var parsed = TesselCompiler.parseMd(mdText);

      // Convert Uint8Array to data URL
      function toDataUrl(bytes, mimeType) {
        var binary = '';
        var chunkSize = 8192;
        for (var i = 0; i < bytes.length; i += chunkSize) {
          binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + chunkSize, bytes.length)));
        }
        return 'data:' + mimeType + ';base64,' + btoa(binary);
      }

      function mimeFor(name) {
        var ext = (name.split('.').pop() || '').toLowerCase();
        return { png:'image/png', jpg:'image/jpeg', jpeg:'image/jpeg', gif:'image/gif',
                 webp:'image/webp', svg:'image/svg+xml', pdf:'application/pdf',
                 txt:'text/plain', json:'application/json' }[ext] || 'application/octet-stream';
      }

      function resolveAssets(blks) {
        blks.forEach(function(b) {
          if (b.type === 'attachment') {
            b.files = (b.files || []).map(function(f) {
              var path = f._path || f.name;
              // Try exact path, then just the filename within any directory
              var data = fileMap[path];
              if (!data) {
                var base = path.split('/').pop();
                var key = Object.keys(fileMap).find(function(k) { return k.split('/').pop() === base; });
                if (key) data = fileMap[key];
              }
              if (!data) return f; // leave as placeholder if not found
              var mime = mimeFor(f.name);
              return { name: f.name, type: mime, data: toDataUrl(data, mime) };
            });
          }
          if (b.type === 'field' && b.fieldType === 'image' && b.meta && b.meta.src && !/^data:/.test(b.meta.src)) {
            var data = fileMap[b.meta.src];
            if (!data) {
              var base = b.meta.src.split('/').pop();
              var key = Object.keys(fileMap).find(function(k) { return k.split('/').pop() === base; });
              if (key) data = fileMap[key];
            }
            if (data) {
              var mime = mimeFor(b.meta.src);
              b.meta.src = toDataUrl(data, mime);
            }
          }
          if (b.type === 'section') resolveAssets(b.children || []);
        });
      }

      resolveAssets(parsed);
      blocks = parsed;
      selectedBlockId = null;
      renderCanvas(); renderProps();
      _unsaved = false;
      saveDraft();
      setStatus('Opened ' + file.name);
    }).catch(function(ex) { setStatus('ZIP error: ' + ex.message); });
  };
  rd.readAsArrayBuffer(file);
}

// ── exportZip — save .zip package; respects tvs:opts:export-mode-zip ─────────
function exportZip() {
  try {
  var attachments = collectAttachments(blocks);
  var assetDir = _filename;
  var md = serializeBlocksForExport(blocks, assetDir);
  var zipFiles = [{ name: _filename + '.md', data: md }];
  attachments.forEach(function(a) { zipFiles.push({ name: assetDir + '/' + a.name, data: a.data }); });

  // Optionally bundle custom fonts into fonts/ subdirectory
  try {
    if (localStorage.getItem('tvs:opts:embed-fonts-zip') === '1') {
      var prefix = 'tvs:font:';
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(prefix) === 0) {
          var fd = JSON.parse(localStorage.getItem(k));
          // Strip the data URL header to get raw bytes
          var bytes = MiniZip.dataUrlToBytes(fd.dataUrl);
          var ext = fd.format === 'truetype' ? 'ttf' : fd.format === 'opentype' ? 'otf' : fd.format;
          zipFiles.push({ name: 'fonts/' + fd.family + '.' + ext, data: bytes });
        }
      }
    }
  } catch(e) {}

  var zipBytes = MiniZip.create(zipFiles);
  saveFile(_filename + '.zip', zipBytes, 'application/zip', 'tvs:opts:export-mode-zip');
  setStatus('Saved ' + _filename + '.zip');
  } catch(ex) { setStatus('ZIP export error: ' + ex.message); }
}


// ── Attachment helpers ────────────────────────────────────────────────────────

// Walk block tree and collect all binary assets (attachment files + image data-URLs)
function collectAttachments(blks, list) {
  list = list || [];
  (blks || []).forEach(function(b) {
    if (b.type === 'attachment') {
      (b.files || []).forEach(function(f) {
        if (f.data && !list.find(function(x) { return x.name === f.name; }))
          list.push({ name: f.name, data: f.data, mimeType: f.type });
      });
    }
    if (b.type === 'field' && b.fieldType === 'attachment' && b.meta) {
      (b.meta.files || []).forEach(function(f) {
        if (f.data && !list.find(function(x) { return x.name === f.name; }))
          list.push({ name: f.name, data: f.data, mimeType: f.type });
      });
    }
    if (b.type === 'field' && b.fieldType === 'image' && b.meta && /^data:/.test(b.meta.src || '')) {
      var extM = b.meta.src.match(/^data:image\/(\w+);/);
      var fname = slugify(b.label || 'image') + '.' + (extM ? extM[1] : 'png');
      if (!list.find(function(x) { return x.name === fname; }))
        list.push({ name: fname, data: b.meta.src, mimeType: 'image/' + (extM ? extM[1] : 'png') });
    }
    if (b.type === 'section') collectAttachments(b.children, list);
  });
  return list;
}

// Serialize block tree to .md, replacing data-URL blobs with relative paths
function serializeBlockForExport(b, assetDir) {
  if (b.type === 'attachment') {
    if (!b.files || !b.files.length) return '';
    var lines = ['@attachment', '{'];
    b.files.forEach(function(f) { lines.push('  file = ' + assetDir + '/' + f.name); });
    lines.push('}');
    return lines.join('\n');
  }
  if (b.type === 'field' && b.fieldType === 'attachment' && b.meta) {
    var attFiles = (b.meta.files || []).filter(function(f) { return f.data; });
    if (!attFiles.length) return serializeBlock(b);
    var lines = ['@attachment ' + (b.label || 'Attachment'), '{'];
    if (b.meta.id) lines.push('  id = ' + b.meta.id);
    if (b.meta.required) lines.push('  required = true');
    attFiles.forEach(function(f) { lines.push('  file = ' + assetDir + '/' + f.name); });
    lines.push('}');
    return lines.join('\n');
  }
  if (b.type === 'field' && b.fieldType === 'image' && b.meta && /^data:/.test(b.meta.src || '')) {
    var extM = b.meta.src.match(/^data:image\/(\w+);/);
    var fname = slugify(b.label || 'image') + '.' + (extM ? extM[1] : 'png');
    var lines = ['@image ' + (b.label || 'Label'), '{'];
    if (b.meta.id) lines.push('  id = ' + b.meta.id);
    if (b.meta.required) lines.push('  required = true');
    lines.push('  src = ' + assetDir + '/' + fname);
    lines.push('}');
    return lines.join('\n');
  }
  if (b.type === 'section') {
    var inner = (b.children || []).map(function(c) { return serializeBlockForExport(c, assetDir); })
      .filter(Boolean).join('\n\n');
    return '@section ' + (b.title || 'Section') + '\n\n' + inner + '\n\n@endsection';
  }
  return serializeBlock(b);
}

function serializeBlocksForExport(blks, assetDir) {
  return blks.map(function(b) { return serializeBlockForExport(b, assetDir); })
    .filter(function(s) { return s !== null && s !== undefined && s !== ''; })
    .join('\n\n');
}

// ── exportMd — save .md; when assets exist, write a sibling directory ─────────
function exportMd() {
  var attachments = collectAttachments(blocks);
  var fname   = _filename + '.md';
  var assetDir = _filename; // sibling directory name (no extension)
  var md = attachments.length
    ? serializeBlocksForExport(blocks, assetDir)
    : serializeBlocks(blocks);
  var mode = (function() { try { return localStorage.getItem('tvs:opts:export-mode-md') || 'picker'; } catch(e) { return 'picker'; } })();

  if (!attachments.length) {
    // Simple case — no assets, behave as before
    saveFile(fname, md, 'text/markdown', 'tvs:opts:export-mode-md');
    return;
  }

  // Assets present — need to write a sibling directory
  if (mode === 'picker' && window.showDirectoryPicker) {
    window.showDirectoryPicker({ mode: 'readwrite' }).then(function(dirHandle) {
      // Write the .md file
      return dirHandle.getFileHandle(fname, { create: true }).then(function(fh) {
        return fh.createWritable().then(function(w) {
          return w.write(md).then(function() { return w.close(); });
        });
      }).then(function() {
        // Create asset subdirectory
        return dirHandle.getDirectoryHandle(assetDir, { create: true });
      }).then(function(assetHandle) {
        // Write each asset file
        return attachments.reduce(function(p, asset) {
          return p.then(function() {
            return assetHandle.getFileHandle(asset.name, { create: true }).then(function(fh) {
              return fh.createWritable().then(function(w) {
                var bytes = MiniZip.toBytes(asset.data);
                return w.write(bytes).then(function() { return w.close(); });
              });
            });
          });
        }, Promise.resolve());
      }).then(function() {
        setStatus('Saved ' + fname + ' + ' + attachments.length + ' asset' + (attachments.length !== 1 ? 's' : '') + ' in ' + assetDir + '/');
      });
    }).catch(function(ex) {
      if (ex.name !== 'AbortError') setStatus('Save error: ' + ex.message);
    });
  } else {
    // Silent download — bundle as a ZIP
    var zipFiles = [{ name: fname, data: md }];
    attachments.forEach(function(a) { zipFiles.push({ name: assetDir + '/' + a.name, data: a.data }); });
    var zipBytes = MiniZip.create(zipFiles);
    var blob = new Blob([zipBytes], { type: 'application/zip' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href = url; a.download = _filename + '.zip';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function() { URL.revokeObjectURL(url); }, 1200);
    setStatus('Exported ' + _filename + '.zip (' + attachments.length + ' asset' + (attachments.length !== 1 ? 's' : '') + ')');
  }
}

function exportHtml() {
  try {
    saveFile(_filename + '.html', getCompiledHtml(), 'text/html', 'tvs:opts:export-mode');
  } catch(ex) { setStatus('Export error: ' + ex.message); }
}

function showPreview() {
  try {
    var html = getCompiledHtml();
    document.getElementById('preview-frame').srcdoc = html;
    document.getElementById('preview-modal').classList.add('show');
    document.getElementById('btn-preview').classList.add('active');
  } catch(ex) { setStatus('Preview error: ' + ex.message); }
}

// Theme System
var THEMES = [
  {
    id: 'dark', name: 'Dark', preset: true,
    vars: {
      '--bg': '#1a1b1e', '--surface': '#24262b', '--border': '#3a3c42', '--text': '#d4d4d4',
      '--muted': '#7a7d87', '--accent': '#5b8af0', '--surface2': '#2d2f35',
      '--canvas-bg': '#24262b', '--canvas-shadow': '0 2px 16px rgba(0,0,0,0.25)',
      '--canvas-text': '#d4d4d4', '--canvas-muted': '#5a5d6b',
      '--para-border-focus': 'rgba(255,255,255,0.08)',
      '--field-bg': '#252a42', '--field-border': '#3d5299'
    }
  },
  {
    id: 'light', name: 'Light', preset: true,
    vars: {
      '--bg': '#f0f0f2', '--surface': '#fff', '--border': '#d0d2d8', '--text': '#1a1b1e',
      '--muted': '#6b7280', '--accent': '#5b8af0', '--surface2': '#e8e9ec',
      '--canvas-bg': '#ffffff', '--canvas-shadow': '0 2px 16px rgba(0,0,0,0.10)',
      '--canvas-text': '#1a1b1e', '--canvas-muted': '#6b7280',
      '--para-border-focus': '#e0e0e0',
      '--field-bg': '#eef2ff', '--field-border': '#c7d2fe'
    }
  },
  {
    id: 'nord', name: 'Nord', preset: true,
    vars: {
      '--bg': '#2e3440', '--surface': '#3b4252', '--border': '#4c566a', '--text': '#eceff4',
      '--muted': '#7b88a1', '--accent': '#88c0d0', '--surface2': '#434c5e',
      '--canvas-bg': '#3b4252', '--canvas-shadow': '0 2px 16px rgba(0,0,0,0.3)',
      '--canvas-text': '#eceff4', '--canvas-muted': '#7b88a1',
      '--para-border-focus': 'rgba(255,255,255,0.08)',
      '--field-bg': '#3b4f6b', '--field-border': '#5e81ac'
    }
  },
  {
    id: 'solarized-dark', name: 'Solarized Dark', preset: true,
    vars: {
      '--bg': '#002b36', '--surface': '#073642', '--border': '#094652', '--text': '#839496',
      '--muted': '#586e75', '--accent': '#268bd2', '--surface2': '#073642',
      '--canvas-bg': '#073642', '--canvas-shadow': '0 2px 16px rgba(0,0,0,0.4)',
      '--canvas-text': '#839496', '--canvas-muted': '#586e75',
      '--para-border-focus': 'rgba(255,255,255,0.06)',
      '--field-bg': '#00323f', '--field-border': '#1a6a8a'
    }
  },
  {
    id: 'warm-light', name: 'Warm Light', preset: true,
    vars: {
      '--bg': '#faf8f3', '--surface': '#fffefb', '--border': '#ddd8cc', '--text': '#2c2416',
      '--muted': '#8a7d68', '--accent': '#c07c3a', '--surface2': '#f0ece3',
      '--canvas-bg': '#fffefb', '--canvas-shadow': '0 2px 16px rgba(0,0,0,0.08)',
      '--canvas-text': '#2c2416', '--canvas-muted': '#8a7d68',
      '--para-border-focus': '#e8e2d8',
      '--field-bg': '#fef3e2', '--field-border': '#e0c090'
    }
  },
  {
    id: 'high-contrast', name: 'High Contrast', preset: true,
    vars: {
      '--bg': '#000000', '--surface': '#0d0d0d', '--border': '#777777', '--text': '#ffffff',
      '--muted': '#cccccc', '--accent': '#ffff00', '--accent-text': '#000000', '--surface2': '#1a1a1a',
      '--canvas-bg': '#0d0d0d', '--canvas-shadow': '0 2px 16px rgba(0,0,0,0.8)',
      '--canvas-text': '#ffffff', '--canvas-muted': '#cccccc',
      '--para-border-focus': 'rgba(255,255,255,0.3)',
      '--field-bg': '#001a33', '--field-border': '#4499ff'
    }
  }
];

function getCustomThemes() {
  try { return JSON.parse(localStorage.getItem('tvs:custom-themes') || '[]'); } catch(e) { return []; }
}

function saveCustomThemes(arr) {
  localStorage.setItem('tvs:custom-themes', JSON.stringify(arr));
}

function getThemeOrder() {
  try { return JSON.parse(localStorage.getItem('tvs:theme-order') || 'null'); } catch(e) { return null; }
}
function saveThemeOrder(ids) {
  localStorage.setItem('tvs:theme-order', JSON.stringify(ids));
}
function getAllThemes() {
  var all = THEMES.concat(getCustomThemes());
  var order = getThemeOrder();
  if (!order) return all;
  var map = {};
  for (var i = 0; i < all.length; i++) map[all[i].id] = all[i];
  var result = [];
  for (var j = 0; j < order.length; j++) {
    if (map[order[j]]) { result.push(map[order[j]]); delete map[order[j]]; }
  }
  for (var k = 0; k < all.length; k++) { if (map[all[k].id]) result.push(all[k]); }
  return result;
}

var _draggedThemeId = null; // tracks what theme is currently being dragged
var _dragFromList = false;  // true when drag originated from theme list (not a slot)
var _dragMode = 'slot';     // 'slot' = dragging to A/B slot; 'reorder' = reordering theme list

function getThemeById(id) {
  var all = getAllThemes();
  for (var i = 0; i < all.length; i++) { if (all[i].id === id) return all[i]; }
  return null;
}

function isLightColor(hex) {
  if (!hex || hex[0] !== '#') return false;
  var h = hex.slice(1);
  if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  var r = parseInt(h.slice(0,2),16)/255;
  var g = parseInt(h.slice(2,4),16)/255;
  var b = parseInt(h.slice(4,6),16)/255;
  var lum = 0.2126*r + 0.7152*g + 0.0722*b;
  return lum > 0.35;
}

function applyTheme(themeId) {
  var theme = getThemeById(themeId);
  if (!theme) return;
  var vars = theme.vars;
  var css = ':root {\n' + Object.keys(vars).map(function(k){ return '  ' + k + ': ' + vars[k] + ';'; }).join('\n') + '\n}';
  var el = document.getElementById('tvs-theme-style');
  if (!el) { el = document.createElement('style'); el.id = 'tvs-theme-style'; document.head.appendChild(el); }
  el.textContent = css;
  document.body.classList.remove('light');
  if (isLightColor(vars['--bg'])) document.body.classList.add('light');
  localStorage.setItem('tvs:active-theme', themeId);
  updateThemeBtn();
}

function updateThemeBtn() {
  var btnA = document.getElementById('theme-pill-a');
  var btnB = document.getElementById('theme-pill-b');
  if (!btnA || !btnB) return;
  var themeA = localStorage.getItem('tvs:theme-a') || 'dark';
  var themeB = localStorage.getItem('tvs:theme-b') || 'light';
  var activeId = localStorage.getItem('tvs:active-theme') || 'dark';

  function themeIcon(themeId) {
    if (themeId === 'dark') {
      return '<span style="font-size:13px;line-height:1;">☾</span>';
    } else if (themeId === 'light') {
      return '<svg width="13" height="13" viewBox="0 0 13 13"><circle cx="6.5" cy="6.5" r="2.8" fill="currentColor"/><g stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><line x1="6.5" y1="0.5" x2="6.5" y2="2"/><line x1="6.5" y1="11" x2="6.5" y2="12.5"/><line x1="0.5" y1="6.5" x2="2" y2="6.5"/><line x1="11" y1="6.5" x2="12.5" y2="6.5"/><line x1="2.4" y1="2.4" x2="3.4" y2="3.4"/><line x1="9.6" y1="9.6" x2="10.6" y2="10.6"/><line x1="10.6" y1="2.4" x2="9.6" y2="3.4"/><line x1="3.4" y1="9.6" x2="2.4" y2="10.6"/></g></svg>';
    } else {
      var t = getThemeById(themeId);
      var bgColor = t ? (t.vars['--bg'] || '#222') : '#222';
      var accentColor = t ? (t.vars['--accent'] || '#5b8af0') : '#5b8af0';
      return '<svg width="13" height="13" viewBox="0 0 13 13"><circle cx="6.5" cy="6.5" r="5.5" fill="'+bgColor+'"/><path d="M6.5 1A5.5 5.5 0 0 1 6.5 12z" fill="'+accentColor+'"/></svg>';
    }
  }

  var activeSlot = localStorage.getItem('tvs:active-slot') || 'a';
  var previewing = !!localStorage.getItem('tvs:previewing');
  btnA.innerHTML = themeIcon(themeA);
  btnB.innerHTML = themeIcon(themeB);
  btnA.classList.toggle('active', !previewing && activeSlot === 'a');
  btnB.classList.toggle('active', !previewing && activeSlot === 'b');
  var slider = document.getElementById('theme-pill-slider');
  if (slider) {
    if (previewing) {
      slider.style.opacity = '0';
    } else {
      var activeBtn = activeSlot === 'a' ? btnA : btnB;
      slider.style.left  = activeBtn.offsetLeft + 'px';
      slider.style.width = activeBtn.offsetWidth + 'px';
      slider.style.opacity = '1';
    }
  }
}

function restoreSlotCard(slot) {
  if (!slot) return;
  var slotName = slot.getAttribute('data-slot');
  var themeId = localStorage.getItem('tvs:theme-' + slotName) || (slotName === 'a' ? 'dark' : 'light');
  var t = getThemeById(themeId);
  var nameEl = document.getElementById('opts-slot-' + slotName + '-name');
  var swEl = document.getElementById('opts-slot-' + slotName + '-swatches');
  if (nameEl) nameEl.textContent = t ? t.name : '—';
  if (swEl) swEl.innerHTML = t
    ? '<div class="theme-swatch" style="background:'+t.vars['--bg']+';width:14px;height:14px;" title="bg"></div>'
      + '<div class="theme-swatch" style="background:'+t.vars['--accent']+';width:14px;height:14px;" title="accent"></div>'
    : '';
}

function renderThemeSlots() {
  var themeA = localStorage.getItem('tvs:theme-a') || 'dark';
  var themeB = localStorage.getItem('tvs:theme-b') || 'light';
  var activeSlot = localStorage.getItem('tvs:active-slot') || 'a';
  var previewing = !!localStorage.getItem('tvs:previewing');

  function fillSlot(slotId, nameId, swatchesId, themeId, slotName) {
    var slot = document.getElementById(slotId);
    var nameEl = document.getElementById(nameId);
    var swatchesEl = document.getElementById(swatchesId);
    if (!slot || !nameEl || !swatchesEl) return;
    var t = getThemeById(themeId);
    nameEl.textContent = t ? t.name : '—';
    swatchesEl.innerHTML = t
      ? '<div class="theme-swatch" style="background:'+t.vars['--bg']+';width:14px;height:14px;" title="bg"></div>'
        + '<div class="theme-swatch" style="background:'+t.vars['--accent']+';width:14px;height:14px;" title="accent"></div>'
      : '';
    var previewingTheme = localStorage.getItem('tvs:previewing-theme');
    slot.classList.toggle('active-slot',
      (!previewing && activeSlot === slotName) ||
      (previewing && !!previewingTheme && previewingTheme === themeId)
    );
  }

  fillSlot('opts-slot-a', 'opts-slot-a-name', 'opts-slot-a-swatches', themeA, 'a');
  fillSlot('opts-slot-b', 'opts-slot-b-name', 'opts-slot-b-swatches', themeB, 'b');

  var slotA = document.getElementById('opts-slot-a');
  var slotB = document.getElementById('opts-slot-b');

  // Hide the dragged slot while drag is active so it isn't a confusing on-page copy
  function setupSlotDrag(slot, themeVal) {
    slot.draggable = true;
    slot.ondragstart = function(e) {
      _dragFromList = false;
      _draggedThemeId = themeVal;
      e.dataTransfer.setData('text/plain', themeVal);
      // Defer hiding until after browser captures drag image
      setTimeout(function() { slot.classList.add('dragging-source'); }, 0);
    };
    slot.ondragend = function() {
      // Suppress border transition before revealing so mid-flight accent fade isn't visible
      slot.style.transition = 'none';
      slot.classList.remove('dragging-source');
      void slot.offsetWidth;
      slot.style.transition = '';
      resetSlotDragClasses(true);
    };
  }
  if (slotA) setupSlotDrag(slotA, themeA);
  if (slotB) setupSlotDrag(slotB, themeB);

  function resetSlotDragClasses(instant) {
    [slotA, slotB].forEach(function(s) {
      if (!s) return;
      s.classList.remove('drag-over', 'drop-target', 'drag-over-list');
      var sc = s.querySelector('.opts-theme-slot-card');
      if (sc) sc.removeAttribute('data-preview-id');
      restoreSlotCard(s);
      var card = s.querySelector('.opts-theme-slot-card');
      if (card) {
        if (instant) card.style.transition = 'none';
        card.style.transform = '';
        card.style.opacity = '';
        if (instant) { void card.offsetWidth; card.style.transition = ''; }
      }
    });
  }

  function wireSlotClick(slot, getThemeId) {
    if (!slot) return;
    slot.onclick = function() {
      localStorage.removeItem('tvs:previewing');
      localStorage.removeItem('tvs:previewing-theme');
      localStorage.setItem('tvs:active-slot', slot.getAttribute('data-slot'));
      applyTheme(getThemeId());
      renderThemeSlots();
      renderThemeList();
      updateThemeBtn();
    };
    slot.ondragover = function(e) {
      if (_dragMode === 'reorder') return; // reorder drag doesn't target slots
      e.preventDefault();
      var targetName = slot.getAttribute('data-slot');
      var curA = localStorage.getItem('tvs:theme-a') || 'dark';
      var curB = localStorage.getItem('tvs:theme-b') || 'light';
      var isSwap = !_dragFromList && (
        (targetName === 'a' && _draggedThemeId === curB) ||
        (targetName === 'b' && _draggedThemeId === curA)
      );
      if (_dragFromList) {
        // Dragging from theme list: dashed card border + live theme preview in card
        if (!slot.classList.contains('drag-over-list')) {
          slot.classList.remove('drag-over', 'drop-target', 'drag-over-list');
          slot.classList.add('drag-over-list');
        }
        // Preview dragged theme in the card content (idempotent via data attr guard)
        var card = slot.querySelector('.opts-theme-slot-card');
        if (card && card.getAttribute('data-preview-id') !== _draggedThemeId) {
          card.setAttribute('data-preview-id', _draggedThemeId);
          var pt = getThemeById(_draggedThemeId);
          var nameEl = document.getElementById('opts-slot-' + targetName + '-name');
          var swEl = document.getElementById('opts-slot-' + targetName + '-swatches');
          if (nameEl && pt) nameEl.textContent = pt.name;
          if (swEl && pt) swEl.innerHTML =
            '<div class="theme-swatch" style="background:'+pt.vars['--bg']+';width:14px;height:14px;" title="bg"></div>'
            + '<div class="theme-swatch" style="background:'+pt.vars['--accent']+';width:14px;height:14px;" title="accent"></div>';
        }
        return;
      }
      // Only update when state changes — avoids restarting transitions on every event
      var wantClass = isSwap ? 'drop-target' : 'drag-over';
      if (!slot.classList.contains(wantClass)) {
        slot.classList.remove('drag-over', 'drop-target');
        slot.classList.add(wantClass);
        var card = slot.querySelector('.opts-theme-slot-card');
        if (card) {
          card.style.transform = '';
          if (isSwap) {
            // Preview incoming card content dimmed in the drop zone
            var pt = getThemeById(_draggedThemeId);
            var nameEl2 = document.getElementById('opts-slot-' + targetName + '-name');
            var swEl2 = document.getElementById('opts-slot-' + targetName + '-swatches');
            if (nameEl2 && pt) nameEl2.textContent = pt.name;
            if (swEl2 && pt) swEl2.innerHTML =
              '<div class="theme-swatch" style="background:'+pt.vars['--bg']+';width:14px;height:14px;" title="bg"></div>'
              + '<div class="theme-swatch" style="background:'+pt.vars['--accent']+';width:14px;height:14px;" title="accent"></div>';
            card.setAttribute('data-preview-id', _draggedThemeId);
            card.style.opacity = '0.35';
          } else {
            card.style.opacity = '';
          }
        }
      }
    };
    slot.ondragleave = function(e) {
      var rel = e.relatedTarget;
      if (rel && (rel === slot || slot.contains(rel))) return;
      slot.classList.remove('drag-over', 'drop-target', 'drag-over-list');
      var card = slot.querySelector('.opts-theme-slot-card');
      if (card) {
        card.style.transform = '';
        card.style.opacity = '';
        card.removeAttribute('data-preview-id');
      }
      restoreSlotCard(slot);
    };
    slot.ondrop = function(e) {
      e.preventDefault();
      slot.classList.remove('drag-over-list');
      var dropCard = slot.querySelector('.opts-theme-slot-card');
      if (dropCard) dropCard.removeAttribute('data-preview-id');
      resetSlotDragClasses(true); // instant — no snap animation on drop
      var droppedId = e.dataTransfer.getData('text/plain');
      if (!droppedId) return;
      var targetName = slot.getAttribute('data-slot');
      var curA = localStorage.getItem('tvs:theme-a') || 'dark';
      var curB = localStorage.getItem('tvs:theme-b') || 'light';
      if (targetName === 'a' && droppedId === curB) {
        localStorage.setItem('tvs:theme-a', curB);
        localStorage.setItem('tvs:theme-b', curA);
      } else if (targetName === 'b' && droppedId === curA) {
        localStorage.setItem('tvs:theme-b', curA);
        localStorage.setItem('tvs:theme-a', curB);
      } else {
        localStorage.setItem(targetName === 'a' ? 'tvs:theme-a' : 'tvs:theme-b', droppedId);
      }
      // Apply whichever theme is now in the active slot
      localStorage.removeItem('tvs:previewing');
      localStorage.removeItem('tvs:previewing-theme');
      var activeSlot = localStorage.getItem('tvs:active-slot') || 'a';
      var activeTheme = localStorage.getItem('tvs:theme-' + activeSlot) || 'dark';
      applyTheme(activeTheme);
      renderThemeSlots();
      renderThemeList();
      updateThemeBtn();
      // The slot NOT under the mouse can get a stale :hover after drop due to DOM
      // re-render. Suppress it on just the other slot until the mouse actually moves.
      var sA = document.getElementById('opts-slot-a');
      var sB = document.getElementById('opts-slot-b');
      var otherSlot = (targetName === 'a') ? sB : sA;
      if (otherSlot) otherSlot.classList.add('no-hover');
      function clearNoHover() {
        if (otherSlot) otherSlot.classList.remove('no-hover');
        document.removeEventListener('mousemove', clearNoHover);
      }
      document.addEventListener('mousemove', clearNoHover);
    };
  }

  wireSlotClick(slotA, function() { return localStorage.getItem('tvs:theme-a') || 'dark'; });
  wireSlotClick(slotB, function() { return localStorage.getItem('tvs:theme-b') || 'light'; });
}

function renderThemeList() {
  var container = document.getElementById('opts-themes-list');
  if (!container) return;
  var activeId = localStorage.getItem('tvs:active-theme') || 'dark';
  var themeA = localStorage.getItem('tvs:theme-a') || 'dark';
  var themeB = localStorage.getItem('tvs:theme-b') || 'light';
  var listPreviewing = !!localStorage.getItem('tvs:previewing');
  var all = getAllThemes();
  var html = '';
  for (var i = 0; i < all.length; i++) {
    var t = all[i];
    var badges = '';
    if (t.id === themeA) badges += '<span class="theme-badge">A</span>';
    if (t.id === themeB) badges += '<span class="theme-badge">B</span>';
    var isActive = (listPreviewing && t.id === activeId) ? ' style="outline:2px solid var(--accent);"' : '';
    var actions = '<button class="theme-card-btn" data-theme-preview="'+t.id+'">Preview</button>';
    actions += '<button class="theme-card-btn" data-theme-dup="'+t.id+'">Duplicate</button>';
    if (!t.preset) {
      actions += '<button class="theme-card-btn" data-theme-edit="'+t.id+'">Edit</button>';
      actions += '<button class="theme-card-btn danger" data-theme-del="'+t.id+'">Delete</button>';
    }
    html += '<div class="theme-card" draggable="true" data-theme-id="'+t.id+'"'+isActive+'>';
    html += '<span class="theme-drag-handle" draggable="true" data-handle-for="'+t.id+'">⠿</span>';
    html += '<div class="theme-card-swatches">';
    html += '<div class="theme-swatch" style="background:'+t.vars['--bg']+';" title="bg"></div>';
    html += '<div class="theme-swatch" style="background:'+t.vars['--accent']+';" title="accent"></div>';
    html += '</div>';
    html += '<div class="theme-card-name">'+t.name+'</div>';
    html += '<div class="theme-card-badges">'+badges+'</div>';
    html += '<div class="theme-card-actions">'+actions+'</div>';
    html += '</div>';
  }
  container.innerHTML = html;
  // wire buttons
  container.querySelectorAll('[data-theme-preview]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var previewId = this.getAttribute('data-theme-preview');
      localStorage.setItem('tvs:previewing', '1');
      localStorage.setItem('tvs:previewing-theme', previewId);
      applyTheme(previewId);
      renderThemeList(); renderThemeSlots(); updateThemeBtn();
    });
  });
  container.querySelectorAll('.theme-card[data-theme-id]').forEach(function(card) {
    card.addEventListener('dragstart', function(e) {
      var tid = card.getAttribute('data-theme-id');
      _draggedThemeId = tid;
      _dragFromList = true;
      e.dataTransfer.setData('text/plain', tid);
    });
    card.addEventListener('dragend', function() {
      _dragFromList = false;
      _dragMode = 'slot';
    });
  });

  // Handle drag — initiates reorder mode with live placeholder
  var _placeholder = null; // the dashed placeholder div that follows the cursor

  function removePlaceholder() {
    if (_placeholder && _placeholder.parentNode) _placeholder.parentNode.removeChild(_placeholder);
    _placeholder = null;
  }

  function getInsertionPoint(e) {
    // offsetTop is transform-unaffected (stable during FLIP animation) but is relative
    // to offsetParent, not the viewport. Convert mouse Y to the same space by subtracting
    // offsetParent's getBoundingClientRect().top.
    var cards = container.querySelectorAll('.theme-card[data-theme-id]:not(.reorder-dragging)');
    if (!cards.length) return { ref: null, before: false };
    var offsetParent = cards[0].offsetParent;
    var parentTop = offsetParent ? offsetParent.getBoundingClientRect().top : 0;
    var mouseY = e.clientY - parentTop;
    for (var i = 0; i < cards.length; i++) {
      var top = cards[i].offsetTop, h = cards[i].offsetHeight;
      if (mouseY < top + h / 2) return { ref: cards[i], before: true };
      if (mouseY < top + h)     return { ref: cards[i], before: false };
    }
    return { ref: null, before: false }; // append at end
  }

  container.querySelectorAll('.theme-drag-handle[data-handle-for]').forEach(function(handle) {
    handle.addEventListener('mousedown', function(e) {
      e.stopPropagation();
    });
    handle.addEventListener('dragstart', function(e) {
      var tid = handle.getAttribute('data-handle-for');
      _dragMode = 'reorder';
      _dragFromList = false;
      _draggedThemeId = tid;
      e.dataTransfer.setData('text/plain', tid);
      e.dataTransfer.effectAllowed = 'move';
      var sourceCard = container.querySelector('.theme-card[data-theme-id="'+tid+'"]');
      // Create placeholder with a dimmed clone of the source card inside
      _placeholder = document.createElement('div');
      _placeholder.className = 'theme-list-placeholder';
      if (sourceCard) {
        var clone = sourceCard.cloneNode(true);
        clone.removeAttribute('draggable');
        _placeholder.appendChild(clone);
      }
      setTimeout(function() {
        // Defer so browser captures drag image before we hide the card
        if (sourceCard) sourceCard.classList.add('reorder-dragging');
        if (sourceCard && sourceCard.parentNode) {
          sourceCard.parentNode.insertBefore(_placeholder, sourceCard.nextSibling);
        }
      }, 0);
    });
    handle.addEventListener('dragend', function() {
      _dragMode = 'slot';
      removePlaceholder();
      container.querySelectorAll('.theme-card').forEach(function(c) {
        c.style.transition = '';
        c.style.transform = '';
        c.classList.remove('reorder-dragging');
      });
    });
  });

  // List container — accept reorder drops, moving placeholder live with FLIP animation
  container.ondragover = function(e) {
    if (_dragMode !== 'reorder') return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!_placeholder) return;
    var ins = getInsertionPoint(e);
    var newNext = ins.ref ? (ins.before ? ins.ref : ins.ref.nextSibling) : null;
    // Skip if placeholder is already in the right spot
    if (_placeholder.nextSibling === newNext) return;
    // FLIP: snapshot positions before move
    var cards = Array.prototype.slice.call(
      container.querySelectorAll('.theme-card[data-theme-id]:not(.reorder-dragging)')
    );
    var beforeTops = {};
    cards.forEach(function(c) { beforeTops[c.getAttribute('data-theme-id')] = c.offsetTop; });
    // Move placeholder
    if (ins.ref) {
      container.insertBefore(_placeholder, ins.before ? ins.ref : ins.ref.nextSibling);
    } else {
      container.appendChild(_placeholder);
    }
    // FLIP: animate each card from its old natural position to its new natural position
    cards.forEach(function(c) {
      var id = c.getAttribute('data-theme-id');
      var delta = beforeTops[id] - c.offsetTop;
      if (Math.abs(delta) < 1) return;
      c.style.transition = 'none';
      c.style.transform = 'translateY(' + delta + 'px)';
      void c.offsetWidth; // force reflow so transition fires
      c.style.transition = 'transform 0.14s ease';
      c.style.transform = '';
    });
  };
  container.ondragleave = function(e) {
    if (_dragMode !== 'reorder') return;
    var rel = e.relatedTarget;
    if (rel && container.contains(rel)) return;
    removePlaceholder();
  };
  container.ondrop = function(e) {
    if (_dragMode !== 'reorder') return;
    e.preventDefault();
    var draggedId = e.dataTransfer.getData('text/plain');
    // Determine insertion position from placeholder's current DOM position
    var insertBeforeEl = _placeholder ? _placeholder.nextElementSibling : null;
    var targetId = insertBeforeEl ? insertBeforeEl.getAttribute('data-theme-id') : null;
    var insertBefore = !!targetId;
    // If placeholder is last, insert after the element before it
    if (!insertBefore && _placeholder && _placeholder.previousElementSibling) {
      targetId = _placeholder.previousElementSibling.getAttribute('data-theme-id');
    }
    removePlaceholder();
    container.querySelectorAll('.theme-card').forEach(function(c) {
      c.style.transition = '';
      c.style.transform = '';
      c.classList.remove('reorder-dragging');
    });
    if (!draggedId || !targetId || draggedId === targetId) { _dragMode = 'slot'; return; }
    var all = getAllThemes();
    var ids = all.map(function(t) { return t.id; });
    ids.splice(ids.indexOf(draggedId), 1);
    var tIdx = ids.indexOf(targetId);
    ids.splice(insertBefore ? tIdx : tIdx + 1, 0, draggedId);
    saveThemeOrder(ids);
    _dragMode = 'slot';
    renderThemeList();
  };

  container.querySelectorAll('[data-theme-dup]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var src = getThemeById(this.getAttribute('data-theme-dup'));
      if (!src) return;
      var customs = getCustomThemes();
      var newId = 'custom-' + Date.now();
      customs.push({ id: newId, name: src.name + ' Copy', preset: false, vars: JSON.parse(JSON.stringify(src.vars)) });
      saveCustomThemes(customs);
      renderThemeList(); renderThemeSlots();
    });
  });
  container.querySelectorAll('[data-theme-edit]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      showThemeEditor(this.getAttribute('data-theme-edit'));
    });
  });
  container.querySelectorAll('[data-theme-del]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var id = this.getAttribute('data-theme-del');
      var customs = getCustomThemes().filter(function(t){ return t.id !== id; });
      saveCustomThemes(customs);
      renderThemeList(); renderThemeSlots();
    });
  });
}

var THEME_VAR_GROUPS = [
  { label: 'UI Colors', vars: [
    { key: '--bg', label: 'Background', type: 'color' },
    { key: '--surface', label: 'Surface', type: 'color' },
    { key: '--surface2', label: 'Surface 2', type: 'color' },
    { key: '--border', label: 'Border', type: 'color' },
    { key: '--text', label: 'Text', type: 'color' },
    { key: '--muted', label: 'Muted', type: 'color' },
    { key: '--accent', label: 'Accent', type: 'color' }
  ]},
  { label: 'Canvas Colors', vars: [
    { key: '--canvas-bg', label: 'Canvas BG', type: 'color' },
    { key: '--canvas-text', label: 'Canvas Text', type: 'color' },
    { key: '--canvas-muted', label: 'Canvas Muted', type: 'color' },
    { key: '--canvas-shadow', label: 'Canvas Shadow', type: 'text' },
    { key: '--para-border-focus', label: 'Para Border Focus', type: 'text' }
  ]},
  { label: 'Field Colors', vars: [
    { key: '--field-bg', label: 'Field BG', type: 'color' },
    { key: '--field-border', label: 'Field Border', type: 'color' }
  ]}
];

function showThemeEditor(themeId) {
  var edContainer = document.getElementById('theme-editor-container');
  if (!edContainer) return;
  var theme = getThemeById(themeId);
  if (!theme) return;
  var editVars = JSON.parse(JSON.stringify(theme.vars));
  var editName = theme.name;

  var html = '<div class="theme-editor">';
  html += '<input class="theme-editor-name" id="theme-ed-name" type="text" value="'+editName.replace(/"/g,'&quot;')+'" placeholder="Theme name">';
  THEME_VAR_GROUPS.forEach(function(group) {
    html += '<div class="opts-section-label" style="margin:8px 0 4px;">'+group.label+'</div>';
    group.vars.forEach(function(v) {
      html += '<div class="theme-color-row">';
      html += '<span class="theme-color-label">'+v.label+'</span>';
      if (v.type === 'color') {
        var val = editVars[v.key] || '#000000';
        html += '<input type="color" class="theme-color-input" data-var="'+v.key+'" value="'+val+'">';
        html += '<input type="text" class="theme-color-hex" data-hex-var="'+v.key+'" value="'+val+'">';
      } else {
        var tval = (editVars[v.key] || '').replace(/"/g, '&quot;');
        html += '<input type="text" class="theme-text-input" data-text-var="'+v.key+'" value="'+tval+'">';
      }
      html += '</div>';
    });
  });
  html += '<div class="theme-editor-actions">';
  html += '<button class="opts-action-btn" id="theme-ed-save">Save</button>';
  html += '<button class="opts-action-btn" id="theme-ed-cancel">Cancel</button>';
  html += '</div>';
  html += '</div>';
  edContainer.innerHTML = html;
  edContainer.style.display = '';

  // sync color picker <-> hex input
  edContainer.querySelectorAll('input[data-var]').forEach(function(inp) {
    inp.addEventListener('input', function() {
      var key = this.getAttribute('data-var');
      editVars[key] = this.value;
      var hexInp = edContainer.querySelector('[data-hex-var="'+key+'"]');
      if (hexInp) hexInp.value = this.value;
    });
  });
  edContainer.querySelectorAll('input[data-hex-var]').forEach(function(inp) {
    inp.addEventListener('input', function() {
      var key = this.getAttribute('data-hex-var');
      editVars[key] = this.value;
      var colorInp = edContainer.querySelector('[data-var="'+key+'"]');
      if (colorInp && /^#[0-9a-fA-F]{6}$/.test(this.value)) colorInp.value = this.value;
    });
  });
  edContainer.querySelectorAll('input[data-text-var]').forEach(function(inp) {
    inp.addEventListener('input', function() {
      editVars[this.getAttribute('data-text-var')] = this.value;
    });
  });

  document.getElementById('theme-ed-save').addEventListener('click', function() {
    var nameVal = document.getElementById('theme-ed-name').value.trim() || 'Custom';
    var customs = getCustomThemes();
    var found = false;
    for (var i = 0; i < customs.length; i++) {
      if (customs[i].id === themeId) {
        customs[i].name = nameVal;
        customs[i].vars = editVars;
        found = true; break;
      }
    }
    if (!found) {
      customs.push({ id: themeId, name: nameVal, preset: false, vars: editVars });
    }
    saveCustomThemes(customs);
    edContainer.style.display = 'none';
    edContainer.innerHTML = '';
    renderThemeList(); renderThemeSlots();
  });
  document.getElementById('theme-ed-cancel').addEventListener('click', function() {
    edContainer.style.display = 'none';
    edContainer.innerHTML = '';
  });
}

function showNewThemeEditor() {
  var newId = 'custom-' + Date.now();
  var activeId = localStorage.getItem('tvs:active-theme') || 'dark';
  var src = getThemeById(activeId) || getThemeById('dark');
  var customs = getCustomThemes();
  customs.push({ id: newId, name: 'Custom Theme', preset: false, vars: JSON.parse(JSON.stringify(src.vars)) });
  saveCustomThemes(customs);
  renderThemeList(); renderThemeSlots();
  showThemeEditor(newId);
}

// Init theme system
(function() {
  var activeId = localStorage.getItem('tvs:active-theme') || 'dark';
  if (!localStorage.getItem('tvs:theme-a')) localStorage.setItem('tvs:theme-a', 'dark');
  if (!localStorage.getItem('tvs:theme-b')) localStorage.setItem('tvs:theme-b', 'light');
  // Migrate: derive active-slot from active-theme if not yet stored
  if (!localStorage.getItem('tvs:active-slot')) {
    var themeA = localStorage.getItem('tvs:theme-a') || 'dark';
    localStorage.setItem('tvs:active-slot', activeId === themeA ? 'a' : 'b');
  }
  applyTheme(activeId);

  var pillA = document.getElementById('theme-pill-a');
  var pillB = document.getElementById('theme-pill-b');
  function toggleThemePill() {
    localStorage.removeItem('tvs:previewing');
    localStorage.removeItem('tvs:previewing-theme');
    var curSlot = localStorage.getItem('tvs:active-slot') || 'a';
    var nextSlot = curSlot === 'a' ? 'b' : 'a';
    var nextTheme = localStorage.getItem('tvs:theme-' + nextSlot) || (nextSlot === 'a' ? 'dark' : 'light');
    localStorage.setItem('tvs:active-slot', nextSlot);
    applyTheme(nextTheme);
    renderThemeList(); renderThemeSlots(); updateThemeBtn();
  }
  if (pillA) pillA.addEventListener('click', toggleThemePill);
  if (pillB) pillB.addEventListener('click', toggleThemePill);

  var newBtn = document.getElementById('btn-new-theme');
  if (newBtn) {
    newBtn.addEventListener('click', showNewThemeEditor);
  }

  // render themes list when opts section becomes visible
  var optsThemesSection = document.getElementById('opts-section-themes');
  if (optsThemesSection) {
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(m) {
        if (m.type === 'attributes' && m.attributeName === 'class') {
          if (optsThemesSection.classList.contains('active')) {
            renderThemeList(); renderThemeSlots();
          }
        }
      });
    });
    observer.observe(optsThemesSection, { attributes: true });
  }
})();

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

// ── Ctrl pane factory (text-pane, form-pane) ────────────────────────────────
// Each pane has 3 states: open | collapsed (tab strip) | off (hidden)
// cfg: { paneId, badgeId, lsKey }
var _sidePanelArrowSync = {};
var _sidePanelOpenFn   = {};
function makeCtrlPane(cfg) {
  var pane        = document.getElementById(cfg.paneId);
  var badge       = document.getElementById(cfg.badgeId);
  var collapseBtn = pane.querySelector('.ctrl-pane-collapse-btn');
  var tabEl       = pane.querySelector('.ctrl-pane-tab');
  var tabArrow    = pane.querySelector('.panel-tab-arrow');

  function ls(k)   { try { return localStorage.getItem(k); } catch(e) { return null; } }
  function lss(k,v){ try { localStorage.setItem(k, v); } catch(e) {} }

  function arrowDir(isOpen) {
    var onRight = pane.classList.contains('dock-right');
    if (onRight) return isOpen ? '›' : '‹';
    return isOpen ? '‹' : '›';
  }
  function syncArrow() {
    var isOpen = !pane.classList.contains('collapsed') && !pane.classList.contains('off');
    var ch = arrowDir(isOpen);
    collapseBtn.textContent = ch;
    tabArrow.innerHTML = ch;
  }
  _sidePanelArrowSync[cfg.paneId] = syncArrow;
  _sidePanelOpenFn[cfg.paneId]   = function() { open(); };

  function _restorePaneW() {
    try { var w = localStorage.getItem('tvs:pane-w:' + cfg.paneId); if (w) pane.style.width = parseInt(w, 10) + 'px'; } catch(e) {}
  }
  function open() {
    pane.classList.remove('collapsed', 'off');
    _restorePaneW();
    var ch = arrowDir(true);
    collapseBtn.textContent = ch;
    tabArrow.innerHTML = ch;
    badge.classList.add('active');
    lss(cfg.lsKey, 'open');
    _lastActiveState = 'open';
  }
  function collapse() {
    pane.classList.remove('off');
    pane.style.width = '';
    pane.classList.add('collapsed');
    var ch = arrowDir(false);
    collapseBtn.textContent = ch;
    tabArrow.innerHTML = ch;
    badge.classList.add('active');
    lss(cfg.lsKey, 'collapsed');
    _lastActiveState = 'collapsed';
  }
  function hide() {
    pane.classList.remove('collapsed');
    pane.style.width = '';
    pane.classList.add('off');
    badge.classList.remove('active');
    lss(cfg.lsKey, 'off');
  }
  function toggle() {
    if (pane.classList.contains('collapsed')) { open(); } else { collapse(); }
  }

  collapseBtn.addEventListener('click', toggle);
  tabEl.addEventListener('click', toggle);
  badge.addEventListener('click', function(e) {
    e.stopPropagation();
    if (pane.classList.contains('dock-float')) {
      if (pane.classList.contains('off')) {
        pane.classList.remove('off'); badge.classList.add('active');
        if (window._clampFloatPanel) window._clampFloatPanel(pane);
      } else { pane.classList.add('off'); badge.classList.remove('active'); }
    } else {
      if (badge.classList.contains('active')) { hide(); }
      else { if (_lastActiveState === 'collapsed') collapse(); else open(); }
    }
  });

  var _lastActiveState = 'open';
  var state = ls(cfg.lsKey);
  if (state === 'off')            { hide(); }
  else if (state === 'collapsed') { _lastActiveState = 'collapsed'; collapse(); }
  else                            { open(); }
}

makeCtrlPane({ paneId: 'format-pane', badgeId: 'badge-format', lsKey: 'tvs:format-pane-state' });
makeCtrlPane({ paneId: 'text-pane',   badgeId: 'badge-text',   lsKey: 'tvs:text-pane-state' });
makeCtrlPane({ paneId: 'form-pane',   badgeId: 'badge-form',   lsKey: 'tvs:form-pane-state' });

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


document.getElementById('btn-undo').addEventListener('click', undo);
document.getElementById('btn-redo').addEventListener('click', redo);

document.getElementById('btn-new').addEventListener('click', function() {
  closeAllDropdowns();
  if (_unsaved && !confirm('Discard unsaved changes?')) return;
  blocks = []; selectedBlockId = null;
  undoStack = []; redoStack = [];
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
function makeSidePanel(cfg) {
  // cfg: { panelId, tabId, arrowId, badgeId, lsKey }
  var panel    = document.getElementById(cfg.panelId);
  var tab      = document.getElementById(cfg.tabId);
  var arrow    = document.getElementById(cfg.arrowId);
  var badge    = document.getElementById(cfg.badgeId);
  var tabArrow = tab ? tab.querySelector('.panel-tab-arrow') : null;

  function ls(v)  { try { return localStorage.getItem(v); } catch(e) { return null; } }
  function lss(k,v){ try { localStorage.setItem(k, v); } catch(e) {} }

  function arrowDir(isOpen) {
    var onRight = panel.classList.contains('dock-right');
    if (onRight) return isOpen ? '&#8250;' : '&#8249;';
    return isOpen ? '&#8249;' : '&#8250;';
  }
  function setArrows(isOpen) {
    var ch = arrowDir(isOpen);
    if (arrow)    arrow.innerHTML    = ch;
    if (tabArrow) tabArrow.innerHTML = ch;
  }
  function syncArrow() {
    var isOpen = !panel.classList.contains('collapsed') && !panel.classList.contains('off');
    setArrows(isOpen);
  }
  _sidePanelArrowSync[cfg.panelId] = syncArrow;
  _sidePanelOpenFn[cfg.panelId]   = function() { open(); };

  function _restorePanelW() {
    try { var w = localStorage.getItem('tvs:pane-w:' + cfg.panelId); if (w) panel.style.width = parseInt(w, 10) + 'px'; } catch(e) {}
  }
  function open() {
    panel.classList.remove('collapsed', 'off');
    _restorePanelW();
    setArrows(true);
    badge.classList.add('active');
    lss(cfg.lsKey, 'open');
    _lastActiveState = 'open';
  }
  function collapse() {
    panel.classList.remove('off');
    panel.style.width = '';
    panel.classList.add('collapsed');
    setArrows(false);
    badge.classList.add('active'); // badge stays on when collapsed
    lss(cfg.lsKey, 'collapsed');
    _lastActiveState = 'collapsed';
  }
  function hide() {
    panel.classList.remove('collapsed');
    panel.style.width = '';
    panel.classList.add('off');
    badge.classList.remove('active');
    lss(cfg.lsKey, 'off');
  }

  // Tab strip and content arrow both toggle open ↔ collapsed
  function toggleOpenCollapse() {
    if (panel.classList.contains('collapsed')) { open(); } else { collapse(); }
  }
  tab.addEventListener('click', toggleOpenCollapse);
  if (arrow) arrow.addEventListener('click', function(e) { e.stopPropagation(); toggleOpenCollapse(); });

  // Badge: off→on restores last active state; on→off hides completely
  badge.addEventListener('click', function(e) {
    e.stopPropagation();
    if (panel.classList.contains('dock-float')) {
      if (panel.classList.contains('off')) {
        panel.classList.remove('off'); badge.classList.add('active');
        if (window._clampFloatPanel) window._clampFloatPanel(panel);
      } else { panel.classList.add('off'); badge.classList.remove('active'); }
    } else {
      if (badge.classList.contains('active')) { hide(); }
      else { if (_lastActiveState === 'collapsed') collapse(); else open(); }
    }
  });

  var _lastActiveState = 'open';
  // Restore
  var state = ls(cfg.lsKey);
  if (state === 'off')            { hide(); }
  else if (state === 'collapsed') { _lastActiveState = 'collapsed'; collapse(); }
  else                            { open(); }
}

makeSidePanel({
  panelId: 'outline-panel', tabId: 'outline-tab', arrowId: 'btn-outline-collapse',
  badgeId: 'badge-outline',
  lsKey: 'tvs:outline-state'
});

makeSidePanel({
  panelId: 'props-panel', tabId: 'props-tab', arrowId: 'btn-props-collapse',
  badgeId: 'badge-props',
  lsKey: 'tvs:props-state'
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
      if (_sidePanelOpenFn[panelId]) _sidePanelOpenFn[panelId]();
    }
  }
  if (_sidePanelArrowSync[panelId]) _sidePanelArrowSync[panelId]();

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
    var w = parseFloat(panel.style.width)  || FLOAT_W;
    var h = parseFloat(panel.style.height) || FLOAT_H;
    var x = parseFloat(panel.style.left)   || 0;
    var y = parseFloat(panel.style.top)    || 0;
    // Keep at least 60px of panel visible on each axis; never slide above toolbar
    var MARGIN = 60;
    var tb = document.getElementById('toolbar');
    var tbBottom = tb ? tb.getBoundingClientRect().bottom : 0;
    x = Math.max(MARGIN - w, Math.min(window.innerWidth  - MARGIN, x));
    y = Math.max(tbBottom,   Math.min(window.innerHeight - MARGIN, y));
    panel.style.left = x + 'px';
    panel.style.top  = y + 'px';
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
      var w=parseFloat(fd.style.width)||FLOAT_W, h=parseFloat(fd.style.height)||FLOAT_H;
      var tb=document.getElementById('toolbar');
      var tbBottom=tb?tb.getBoundingClientRect().bottom:0;
      fd.style.left=Math.max(0,Math.min(window.innerWidth-w,  fdPX+(e.clientX-fdSX)))+'px';
      fd.style.top =Math.max(tbBottom,Math.min(window.innerHeight-h, fdPY+(e.clientY-fdSY)))+'px';
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

  function openDialog() {
    closeAllDropdowns();
    dialog.classList.add('show');
    if (!dialog._dragged) {
      var savedPos; try { savedPos = JSON.parse(localStorage.getItem('tvs:opts:pos')); } catch(e) {}
      if (savedPos && savedPos.left && savedPos.top) {
        var dlgW = dialog.offsetWidth, dlgH = dialog.offsetHeight;
        var tbH2 = (function(){ var t = document.getElementById('toolbar'); return t ? t.getBoundingClientRect().bottom : 0; })();
        var rx = Math.max(0, Math.min(window.innerWidth  - dlgW,  parseFloat(savedPos.left)));
        var ry = Math.max(tbH2, Math.min(window.innerHeight - dlgH, parseFloat(savedPos.top)));
        dialog.style.left = rx + 'px';
        dialog.style.top  = ry + 'px';
        dialog.style.transform = 'none';
        dialog._dragged = true;
      } else {
        dialog.style.left = Math.round((window.innerWidth - dialog.offsetWidth) / 2) + 'px';
        dialog.style.top  = '80px';
        dialog.style.transform = 'none';
      }
    }
    try { localStorage.setItem('tvs:opts:open', '1'); } catch(e) {}
  }
  function closeDialog() {
    dialog.classList.remove('show');
    try { localStorage.setItem('tvs:opts:open', '0'); } catch(e) {}
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
              if (_sidePanelOpenFn[id]) _sidePanelOpenFn[id]();
            }
          }
          if (_sidePanelArrowSync[id]) _sidePanelArrowSync[id]();
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
  btnClose.addEventListener('click', closeDialog);

  // Drag with viewport clamping
  var header = document.getElementById('options-dialog-header');
  header.addEventListener('mousedown', function(e) {
    if (e.target === btnClose) return;
    var rect = dialog.getBoundingClientRect();
    var startX = e.clientX - rect.left;
    var startY = e.clientY - rect.top;
    dialog.style.transform = 'none';
    dialog._dragged = true;
    function onMove(e) {
      var dlgW = dialog.offsetWidth, dlgH = dialog.offsetHeight;
      var tb = document.getElementById('toolbar');
      var tbH = tb ? tb.getBoundingClientRect().bottom : 0;
      var x = e.clientX - startX;
      var y = e.clientY - startY;
      x = Math.max(0, Math.min(window.innerWidth  - dlgW,  x));
      y = Math.max(tbH, Math.min(window.innerHeight - dlgH, y));
      dialog.style.left = x + 'px';
      dialog.style.top  = y + 'px';
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      try { localStorage.setItem('tvs:opts:pos', JSON.stringify({left: dialog.style.left, top: dialog.style.top})); } catch(e) {}
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    e.preventDefault();
  });

  // Resize from bottom-right corner
  var resizeGrip = document.getElementById('options-dialog-resize');
  resizeGrip.addEventListener('mousedown', function(e) {
    e.preventDefault();
    e.stopPropagation();
    var startX = e.clientX, startY = e.clientY;
    var startW = dialog.offsetWidth, startH = document.getElementById('options-dialog-main').offsetHeight;
    var MIN_W = 480, MIN_H = 280;
    function onResizeMove(e) {
      var newW = Math.max(MIN_W, startW + (e.clientX - startX));
      var newH = Math.max(MIN_H, startH + (e.clientY - startY));
      dialog.style.width = newW + 'px';
      document.getElementById('options-dialog-main').style.height = newH + 'px';
    }
    function onResizeUp() {
      document.removeEventListener('mousemove', onResizeMove);
      document.removeEventListener('mouseup', onResizeUp);
      try { localStorage.setItem('tvs:opts:size', JSON.stringify({w: dialog.offsetWidth, h: document.getElementById('options-dialog-main').offsetHeight})); } catch(e) {}
    }
    document.addEventListener('mousemove', onResizeMove);
    document.addEventListener('mouseup', onResizeUp);
  });

  // Restore saved size
  (function() {
    var s; try { s = JSON.parse(localStorage.getItem('tvs:opts:size')); } catch(e) {}
    if (s && s.w) dialog.style.width = s.w + 'px';
    if (s && s.h) document.getElementById('options-dialog-main').style.height = s.h + 'px';
  })();

  // Close only via the X button (no outside-click dismiss)

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
    while (undoStack.length > depth) undoStack.shift();
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
      clearTimeout(_undoDebounceTimer);
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

// ── Custom fonts ──────────────────────────────────────────────────────────────
(function() {
  var FONT_PREFIX = 'tvs:font:';
  var fontStyleEl = document.createElement('style');
  fontStyleEl.id = 'custom-font-styles';
  document.head.appendChild(fontStyleEl);

  function guessFormat(filename) {
    var ext = (filename.split('.').pop() || '').toLowerCase();
    return { ttf:'truetype', otf:'opentype', woff:'woff', woff2:'woff2' }[ext] || 'truetype';
  }

  function injectFontFace(family, dataUrl, format) {
    var existing = fontStyleEl.textContent;
    if (existing.indexOf('"' + family + '"') !== -1) return;
    fontStyleEl.textContent += '@font-face { font-family: "' + family + '"; src: url("' + dataUrl + '") format("' + format + '"); }\n';
  }

  function addFontButton(family) {
    var formatContent = document.querySelector('#format-pane .ctrl-pane-content');
    if (!formatContent) return;
    var btnId = 'btn-font-custom-' + family.replace(/\s+/g, '-').toLowerCase();
    if (document.getElementById(btnId)) return;
    var btn = document.createElement('button');
    btn.className = 'ctrl-btn';
    btn.id = btnId;
    btn.innerHTML = '<span class="ctrl-btn-icon" style="font-family:\'' + family + '\'">Ff</span>' + family;
    btn.addEventListener('click', function() {
      applyFontFamily('"' + family + '", sans-serif');
      updateInlineFormatState();
    });
    // Append after the last font button
    var verdanaBtn = document.getElementById('btn-font-verdana');
    if (verdanaBtn && verdanaBtn.parentNode) {
      verdanaBtn.parentNode.insertBefore(btn, verdanaBtn.nextSibling);
    } else {
      formatContent.appendChild(btn);
    }
    // Register in FONT_MAP for active-state detection
    var re = new RegExp(family.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
    FONT_MAP.push({ key: btnId, re: re });
  }


  function renderFontList() {
    var list = document.getElementById('opts-font-list');
    if (!list) return;
    list.innerHTML = '';
    var keys = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(FONT_PREFIX) === 0) keys.push(k);
      }
    } catch(e) {}
    if (!keys.length) {
      list.innerHTML = '<p style="font-size:11px;color:var(--muted);margin:0">No custom fonts imported yet.</p>';
      return;
    }
    keys.forEach(function(k) {
      try {
        var data = JSON.parse(localStorage.getItem(k));
        var item = document.createElement('div');
        item.className = 'opts-font-item';
        var preview = document.createElement('span');
        preview.className = 'opts-font-item-preview';
        preview.style.fontFamily = '"' + data.family + '"';
        preview.textContent = data.family + '  —  AaBbCc';
        var delBtn = document.createElement('button');
        delBtn.className = 'opts-font-item-del';
        delBtn.title = 'Remove font';
        delBtn.textContent = '×';
        delBtn.addEventListener('click', function() {
          try { localStorage.removeItem(k); } catch(e) {}
          var btn = document.getElementById('btn-font-custom-' + data.family.replace(/\s+/g, '-').toLowerCase());
          if (btn) btn.parentNode.removeChild(btn);
          // Remove from FONT_MAP
          for (var i = FONT_MAP.length - 1; i >= 0; i--) {
            if (FONT_MAP[i].key === 'btn-font-custom-' + data.family.replace(/\s+/g, '-').toLowerCase()) {
              FONT_MAP.splice(i, 1); break;
            }
          }
          // Remove @font-face from style element
          fontStyleEl.textContent = fontStyleEl.textContent.replace(
            new RegExp('@font-face \\{ font-family: "' + data.family.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"[^}]*\\}\\n?', 'g'), ''
          );
          renderFontList();
        });
        item.appendChild(preview);
        item.appendChild(delBtn);
        list.appendChild(item);
      } catch(e) {}
    });
  }

  function loadAllCustomFonts() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(FONT_PREFIX) === 0) {
          var data = JSON.parse(localStorage.getItem(k));
          injectFontFace(data.family, data.dataUrl, data.format);
          addFontButton(data.family);
        }
      }
    } catch(e) {}
  }

  loadAllCustomFonts();

  document.getElementById('opts-import-font').addEventListener('click', function() {
    document.getElementById('opts-font-file-input').value = '';
    document.getElementById('opts-font-file-input').click();
  });

  document.getElementById('opts-font-file-input').addEventListener('change', function() {
    var file = this.files[0];
    if (!file) return;
    var family = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();
    var format = guessFormat(file.name);
    var rd = new FileReader();
    rd.onload = function(ev) {
      var dataUrl = ev.target.result;
      var storageKey = FONT_PREFIX + family.replace(/\s+/g, '-').toLowerCase();
      try {
        localStorage.setItem(storageKey, JSON.stringify({ family: family, dataUrl: dataUrl, format: format }));
      } catch(e) {
        setStatus('Font too large to store locally');
        return;
      }
      injectFontFace(family, dataUrl, format);
      addFontButton(family);
      renderFontList();
      setStatus('Font "' + family + '" imported');
    };
    rd.readAsDataURL(file);
  });

  // Embed fonts toggle
  var embedBtn = document.getElementById('opts-embed-fonts');
  function isEmbedFonts() {
    try { return localStorage.getItem('tvs:opts:embed-fonts') === '1'; } catch(e) { return false; }
  }
  function syncEmbedBtn() {
    var on = isEmbedFonts();
    embedBtn.classList.toggle('on', on);
  }
  embedBtn.addEventListener('click', function() {
    try { localStorage.setItem('tvs:opts:embed-fonts', isEmbedFonts() ? '0' : '1'); } catch(e) {}
    syncEmbedBtn();
  });
  syncEmbedBtn();

  var embedZipBtn = document.getElementById('opts-embed-fonts-zip');
  function isEmbedFontsZip() {
    try { return localStorage.getItem('tvs:opts:embed-fonts-zip') === '1'; } catch(e) { return false; }
  }
  function syncEmbedZipBtn() { embedZipBtn.classList.toggle('on', isEmbedFontsZip()); }
  embedZipBtn.addEventListener('click', function() {
    try { localStorage.setItem('tvs:opts:embed-fonts-zip', isEmbedFontsZip() ? '0' : '1'); } catch(e) {}
    syncEmbedZipBtn();
  });
  syncEmbedZipBtn();

  // Export mode selects
  function bindExportModeSel(id, lsKey) {
    var sel = document.getElementById(id);
    if (!sel) return;
    try { sel.value = localStorage.getItem(lsKey) || 'picker'; } catch(e) {}
    sel.addEventListener('change', function() {
      try { localStorage.setItem(lsKey, sel.value); } catch(e) {}
    });
  }
  bindExportModeSel('opts-export-mode',       'tvs:opts:export-mode');
  bindExportModeSel('opts-export-mode-md',    'tvs:opts:export-mode-md');
  bindExportModeSel('opts-export-mode-zip',   'tvs:opts:export-mode-zip');
  bindExportModeSel('opts-export-mode-prefs', 'tvs:opts:export-mode-prefs');

  // Render font list when Fonts section becomes visible
  document.querySelector('[data-opts-section="fonts"]').addEventListener('click', renderFontList);
})();

// ── Pane drag-to-reorder (mouse-event implementation) ─────────────────────────
// HTML5 drag API is unreliable for text-containing headers in Chrome.
// We use mousedown/mousemove/mouseup instead.
(function() {
  var paneDragId  = null;   // id of pane currently being dragged
  var dragStarted = false;  // true once mouse moved past threshold
  var startX = 0, startY = 0;
  var DRAG_THRESHOLD = 5;   // px before drag activates
  var ZONES    = ['left', 'right', 'top', 'bottom'];
  var PANE_IDS = ['format-pane', 'text-pane', 'form-pane', 'outline-panel', 'props-panel'];

  function getZoneOf(panelId) {
    var panel = document.getElementById(panelId);
    if (panel && panel.classList.contains('dock-float')) return 'float';
    for (var i = 0; i < ZONES.length; i++) {
      var z = document.getElementById('dock-' + ZONES[i]);
      if (z && z.contains(panel)) return ZONES[i];
    }
    return null;
  }

  function isHzone(zone) { return zone === 'top' || zone === 'bottom'; }

  function clearInsertIndicators() {
    document.querySelectorAll('.pane-drop-before,.pane-drop-after').forEach(function(el) {
      el.classList.remove('pane-drop-before', 'pane-drop-after');
    });
  }

  function savePaneOrder(zone) {
    var z = document.getElementById('dock-' + zone);
    if (!z) return;
    var order = Array.from(z.children).map(function(c) { return c.id; }).filter(Boolean);
    try { localStorage.setItem('tvs:dock-order:' + zone, JSON.stringify(order)); } catch(e) {}
  }

  function restorePaneOrder() {
    ZONES.forEach(function(zone) {
      try {
        var saved = JSON.parse(localStorage.getItem('tvs:dock-order:' + zone) || 'null');
        if (!Array.isArray(saved)) return;
        var zoneEl = document.getElementById('dock-' + zone);
        saved.forEach(function(id) {
          var el = document.getElementById(id);
          if (el && el.parentElement === zoneEl) zoneEl.appendChild(el);
        });
      } catch(e) {}
    });
  }

  // Build 4 edge drop-zone overlays (purely visual, hit-tested manually)
  var edgeTargets = {};
  ZONES.forEach(function(zone) {
    var el = document.createElement('div');
    el.className = 'dock-edge-target dock-edge-' + zone;
    el.innerHTML = '<span>' + zone + '</span>';
    document.body.appendChild(el);
    edgeTargets[zone] = el;
  });

  // ── Mouse-based drag state ────────────────────────────────────────────────
  var _hoveredZone  = null;  // edge zone being hovered
  var _hoveredPane  = null;  // pane id being hovered (same-zone reorder)
  var _hoverBefore  = false; // insert before (true) or after (false)

  function activateDrag(id) {
    paneDragId  = id;
    dragStarted = true;
    document.body.classList.add('pane-dragging-active');
    var panel = document.getElementById(id);
    if (panel) { panel.classList.add('pane-dragging'); panel.style.pointerEvents = 'none'; }
    var myZone = getZoneOf(id);
    ZONES.forEach(function(z) {
      edgeTargets[z].style.opacity = (z === myZone) ? '0.3' : '1';
    });
  }

  function clearDrag() {
    if (paneDragId) {
      var panel = document.getElementById(paneDragId);
      if (panel) { panel.classList.remove('pane-dragging'); panel.style.pointerEvents = ''; }
    }
    paneDragId = null; dragStarted = false;
    document.body.classList.remove('pane-dragging-active');
    clearInsertIndicators();
    ZONES.forEach(function(z) {
      edgeTargets[z].classList.remove('active');
      edgeTargets[z].style.opacity = '';
    });
    _hoveredZone = null; _hoveredPane = null;
  }

  function updateHover(clientX, clientY) {
    clearInsertIndicators();
    ZONES.forEach(function(z) { edgeTargets[z].classList.remove('active'); });
    _hoveredZone = null; _hoveredPane = null;

    var dragZone = getZoneOf(paneDragId);

    // Check edge targets first
    for (var zi = 0; zi < ZONES.length; zi++) {
      var z = ZONES[zi];
      if (z === dragZone) continue; // skip own zone edge target
      var er = edgeTargets[z].getBoundingClientRect();
      if (clientX >= er.left && clientX <= er.right && clientY >= er.top && clientY <= er.bottom) {
        edgeTargets[z].classList.add('active');
        _hoveredZone = z;
        return;
      }
    }

    // Check sibling panes (same or different zone)
    for (var pi = 0; pi < PANE_IDS.length; pi++) {
      var pid = PANE_IDS[pi];
      if (pid === paneDragId) continue;
      var pel = document.getElementById(pid);
      if (!pel) continue;
      var pr = pel.getBoundingClientRect();
      if (clientX >= pr.left && clientX <= pr.right && clientY >= pr.top && clientY <= pr.bottom) {
        var myZone = getZoneOf(pid);
        if (myZone === 'float') continue;
        if (myZone !== dragZone) {
          // Cross-zone: highlight that zone's edge target
          if (edgeTargets[myZone]) edgeTargets[myZone].classList.add('active');
          _hoveredZone = myZone;
          _hoveredPane = pid;
        } else {
          // Same zone: show insertion line
          var before;
          if (isHzone(myZone)) {
            before = myZone === 'bottom'
              ? (clientY > pr.top + pr.height / 2)
              : (clientY < pr.top + pr.height / 2);
          } else {
            before = myZone === 'right'
              ? (clientX > pr.left + pr.width / 2)
              : (clientX < pr.left + pr.width / 2);
          }
          pel.classList.add(before ? 'pane-drop-before' : 'pane-drop-after');
          _hoveredPane  = pid;
          _hoverBefore  = before;
        }
        return;
      }
    }
  }

  function commitDrop() {
    if (!paneDragId) return;
    var draggedEl = document.getElementById(paneDragId);
    if (!draggedEl) return;
    var dragZone  = getZoneOf(paneDragId);

    if (_hoveredZone && !_hoveredPane) {
      // Dropped onto empty edge zone target
      var fromZone = dragZone;
      dockPanel(paneDragId, _hoveredZone);
      if (fromZone && fromZone !== _hoveredZone) savePaneOrder(fromZone);
      savePaneOrder(_hoveredZone);
    } else if (_hoveredPane) {
      var targetEl = document.getElementById(_hoveredPane);
      if (!targetEl) return;
      var targetZone = getZoneOf(_hoveredPane);
      if (targetZone !== dragZone) {
        // Cross-zone: move to target's zone and insert before the target
        var fromZone2 = dragZone;
        dockPanel(paneDragId, targetZone);
        var zoneEl = document.getElementById('dock-' + targetZone);
        if (zoneEl && draggedEl.parentElement === zoneEl) {
          zoneEl.insertBefore(draggedEl, targetEl);
        }
        if (fromZone2) savePaneOrder(fromZone2);
        savePaneOrder(targetZone);
      } else {
        // Same zone reorder
        if (_hoverBefore) {
          targetEl.parentElement.insertBefore(draggedEl, targetEl);
        } else {
          targetEl.insertAdjacentElement('afterend', draggedEl);
        }
        savePaneOrder(targetZone);
      }
    }
  }

  // ── Per-pane handle setup ─────────────────────────────────────────────────
  PANE_IDS.forEach(function(panelId) {
    var panel = document.getElementById(panelId);
    if (!panel) return;

    var handles = [];
    panel.querySelectorAll('.ctrl-pane-header, .ctrl-pane-tab').forEach(function(h) { handles.push(h); });
    panel.querySelectorAll('h3').forEach(function(h) { handles.push(h); });
    var tabEl = panel.querySelector('[id$="-tab"]:not(.ctrl-pane-tab)');
    if (tabEl && handles.indexOf(tabEl) === -1) handles.push(tabEl);
    if (!handles.length) handles.push(panel);

    handles.forEach(function(handle) {
      handle.addEventListener('mousedown', function(e) {
        if (e.button !== 0) return;
        if (e.target.tagName === 'BUTTON') return;
        var p = document.getElementById(panelId);
        if (p && p.classList.contains('dock-float')) return;
        e.preventDefault();
        paneDragId  = panelId;
        dragStarted = false;
        startX = e.clientX;
        startY = e.clientY;
      });
    });
  });

  // ── Global mouse move / up ────────────────────────────────────────────────
  document.addEventListener('mousemove', function(e) {
    if (!paneDragId) return;
    if (!dragStarted) {
      var dx = e.clientX - startX, dy = e.clientY - startY;
      if (Math.sqrt(dx*dx + dy*dy) < DRAG_THRESHOLD) return;
      activateDrag(paneDragId);
    }
    updateHover(e.clientX, e.clientY);
  });

  document.addEventListener('mouseup', function(e) {
    if (!paneDragId) return;
    if (dragStarted) commitDrop();
    clearDrag();
  });

  restorePaneOrder();
})();

// ── Editor Custom Date/Time Picker ────────────────────────────────────────
// openEditorPicker(anchorEl, currentDate, isDatetime, onSelect)
(function() {
  var _epInp = null, _epIsDatetime = false, _epCb = null;
  var _epYear = 0, _epMonth = 0, _epSelDate = null, _epHr = 0, _epMn = 0;
  // _epHr is always 0-23 internally; display adapts to _ep12
  var _ep12 = false;
  try { _ep12 = localStorage.getItem('tvs:picker12hr') === '1'; } catch(e) {}

  function _epPad(n) { return n < 10 ? '0' + n : '' + n; }

  // Convert internal 0-23 hour to display value in current mode
  function _epHrDisplay(h24) {
    if (!_ep12) return _epPad(h24);
    var h = h24 % 12; return _epPad(h === 0 ? 12 : h);
  }
  // Parse typed hour back to 0-23; needs current AM/PM to resolve
  function _epHrFrom12(dispVal, isPm) {
    var v = parseInt(dispVal, 10);
    if (isNaN(v)) return 0;
    v = Math.max(1, Math.min(12, v));
    if (isPm) return v === 12 ? 12 : v + 12;
    return v === 12 ? 0 : v;
  }

  // Pill button styles
  var _EP_PILL_BASE   = 'background:var(--surface2);border:none;cursor:pointer;font-size:11px;font-weight:600;padding:3px 9px;color:var(--muted);transition:background 0.18s ease,color 0.18s ease;';
  var _EP_PILL_ACTIVE = 'background:var(--accent);border:none;cursor:pointer;font-size:11px;font-weight:600;padding:3px 9px;color:#fff;transition:background 0.18s ease,color 0.18s ease;';
  // Shared styles — no fixed width; grid handles column sizing
  var _EP_INP_STYLE  = 'width:100%;box-sizing:border-box;text-align:center;background:var(--surface2);border:1px solid var(--border);border-radius:4px;color:var(--text);font-size:14px;padding:5px 0;-moz-appearance:textfield;outline:none;';
  var _EP_STEP_STYLE = 'width:100%;box-sizing:border-box;background:none;border:1px solid var(--border);border-radius:4px;cursor:pointer;color:var(--muted);font-size:12px;line-height:1;padding:3px 0;text-align:center;';

  function _epSyncTimeUi() {
    var hrInp    = document.getElementById('ep-hr');
    var amWrap   = document.getElementById('ep-ampm-wrap');
    var amThumb  = document.getElementById('ep-ampm-thumb');
    var amLbl    = document.getElementById('ep-am');
    var pmLbl    = document.getElementById('ep-pm');
    var fmtThumb = document.getElementById('ep-hrfmt-thumb');
    var fmt12Lbl = document.getElementById('ep-fmt-12');
    var fmt24Lbl = document.getElementById('ep-fmt-24');
    if (hrInp) {
      hrInp.value = _epHrDisplay(_epHr);
      hrInp.setAttribute('max', _ep12 ? '12' : '23');
      hrInp.setAttribute('min', _ep12 ? '1' : '0');
    }
    if (amWrap) {
      amWrap.style.opacity = _ep12 ? '1' : '0.3';
      amWrap.style.pointerEvents = _ep12 ? '' : 'none';
    }
    var isAm = _epHr < 12;
    if (amThumb)  amThumb.style.transform  = isAm ? 'translateX(0)' : 'translateX(100%)';
    if (amLbl)    amLbl.style.color        = isAm ? '#fff' : 'var(--muted)';
    if (pmLbl)    pmLbl.style.color        = isAm ? 'var(--muted)' : '#fff';
    if (fmtThumb) fmtThumb.style.transform = _ep12 ? 'translateX(0)' : 'translateX(100%)';
    if (fmt12Lbl) fmt12Lbl.style.color     = _ep12 ? '#fff' : 'var(--muted)';
    if (fmt24Lbl) fmt24Lbl.style.color     = _ep12 ? 'var(--muted)' : '#fff';
  }

  function _epCreate() {
    if (document.getElementById('ed-picker')) return;
    var p = document.createElement('div');
    p.id = 'ed-picker';
    p.style.cssText = 'display:none;position:fixed;z-index:99999;background:var(--surface);border:1px solid var(--border);border-radius:8px;box-shadow:0 8px 32px rgba(0,0,0,.32);min-width:280px;font-size:13px;color:var(--text);user-select:none;';
    p.innerHTML =
      '<div style="display:flex;align-items:center;gap:4px;padding:8px 10px;border-bottom:1px solid var(--border);">'
      + '<button id="ep-prev" style="background:none;border:1px solid var(--border);border-radius:4px;cursor:pointer;color:var(--muted);font-size:16px;line-height:1;padding:2px 8px;">&#8249;</button>'
      + '<select id="ep-month" style="flex:1;background:var(--surface2);border:1px solid var(--border);border-radius:4px;color:var(--text);font-size:12px;font-weight:600;padding:4px 6px;"><option value="0">January</option><option value="1">February</option><option value="2">March</option><option value="3">April</option><option value="4">May</option><option value="5">June</option><option value="6">July</option><option value="7">August</option><option value="8">September</option><option value="9">October</option><option value="10">November</option><option value="11">December</option></select>'
      + '<input id="ep-year" type="number" min="1900" max="2200" style="width:65px;background:var(--surface2);border:1px solid var(--border);border-radius:4px;color:var(--text);font-size:12px;font-weight:600;padding:4px 6px;">'
      + '<button id="ep-next" style="background:none;border:1px solid var(--border);border-radius:4px;cursor:pointer;color:var(--muted);font-size:16px;line-height:1;padding:2px 8px;">&#8250;</button>'
      + '<button id="ep-close" style="background:none;border:1px solid var(--border);border-radius:4px;cursor:pointer;color:var(--muted);font-size:16px;line-height:1;padding:2px 7px;">&#215;</button>'
      + '</div>'
      + '<div style="padding:8px 10px;">'
      + '<div id="ep-wds" style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:4px;"></div>'
      + '<div id="ep-days" style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;height:182px;align-content:start;"></div>'
      + '</div>'
      // ── Time section ──────────────────────────────────────────
      // Outer flex: vertical "Time" label left, controls fill remainder
      + '<div id="ep-time" style="display:none;border-top:1px solid var(--border);align-items:stretch;">'
      +   '<div id="ep-time-lbl" style="writing-mode:vertical-rl;transform:rotate(180deg);font-size:11px;color:var(--muted);padding:10px 6px;border-right:1px solid var(--border);display:flex;align-items:center;justify-content:center;letter-spacing:.04em;">Time</div>'
      +   '<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:10px;gap:8px;">'
      //     CSS grid: columns [hr] [colon] [mn] — guarantees +/- match input widths exactly
      +     '<div style="display:grid;grid-template-columns:1fr auto 1fr;gap:3px 0;flex:1;">'
      +       '<button id="ep-hr-up" style="' + _EP_STEP_STYLE + 'margin-right:4px;">&#43;</button>'
      +       '<span style="display:block;width:22px;"></span>'
      +       '<button id="ep-mn-up" style="' + _EP_STEP_STYLE + 'margin-left:4px;">&#43;</button>'
      +       '<input id="ep-hr" type="number" min="0" max="23" style="' + _EP_INP_STYLE + 'margin-right:4px;">'
      +       '<span style="font-weight:700;font-size:16px;color:var(--muted);width:22px;display:flex;align-items:center;justify-content:center;align-self:stretch;">:</span>'
      +       '<input id="ep-mn" type="number" min="0" max="59" style="' + _EP_INP_STYLE + 'margin-left:4px;">'
      +       '<button id="ep-hr-dn" style="' + _EP_STEP_STYLE + 'margin-right:4px;">&#8722;</button>'
      +       '<span style="display:block;width:22px;"></span>'
      +       '<button id="ep-mn-dn" style="' + _EP_STEP_STYLE + 'margin-left:4px;">&#8722;</button>'
      +     '</div>'
      //     AM/PM sliding pill — always in DOM; thumb slides; dimmed in 24h mode
      +     '<div id="ep-ampm-wrap" style="position:relative;width:80px;align-self:stretch;border:1px solid var(--border);border-radius:5px;cursor:pointer;overflow:hidden;display:flex;">'
      +       '<div id="ep-ampm-thumb" style="position:absolute;top:2px;left:2px;width:calc(50% - 2px);height:calc(100% - 4px);border-radius:3px;background:var(--accent);transition:transform 0.18s ease;z-index:0;will-change:transform;"></div>'
      +       '<span id="ep-am" style="flex:1;position:relative;z-index:1;font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center;pointer-events:none;color:#fff;">AM</span>'
      +       '<span id="ep-pm" style="flex:1;position:relative;z-index:1;font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center;pointer-events:none;color:var(--muted);">PM</span>'
      +     '</div>'
      +   '</div>'
      + '</div>'
      // ── Footer mirrors time grid: [Done+Clear : 1fr] [22px gap] [Now : 1fr] [8px] [12h/24h pill]
      // Wrapped in same left-offset as time-inner to align columns
      + '<div id="ep-footer" style="display:flex;align-items:stretch;border-top:1px solid var(--border);">'
      // Transparent spacer matching the "Time" label column width
      +   '<div id="ep-lbl-spc" style="display:none;border-right:1px solid transparent;flex-shrink:0;"></div>'
      +   '<div style="flex:1;display:flex;align-items:center;gap:8px;padding:8px 10px;">'
      //     Main grid: mirrors time section 1fr/auto/1fr structure for pixel-perfect column alignment
      +     '<div style="flex:1;display:grid;grid-template-columns:1fr auto 1fr;">'
      //       1fr cell under HH: Done+Clear as a single bordered group
      +       '<div style="margin-right:4px;display:flex;align-items:stretch;">'
      +         '<button id="ep-done" style="flex:1;background:var(--surface2);border:1px solid var(--border);border-radius:4px;cursor:pointer;color:var(--text);font-size:11px;padding:4px 6px;font-weight:600;margin-right:3px;">Done</button>'
      +         '<button id="ep-clear" style="flex:1;background:var(--surface2);border:1px solid var(--border);border-radius:4px;cursor:pointer;color:var(--text);font-size:11px;padding:4px 6px;">Clear</button>'
      +       '</div>'
      //       22px spacer under colon
      +       '<span style="width:22px;flex-shrink:0;display:block;"></span>'
      //       1fr cell under MM: Now button constrained to same width as MM input
      +       '<div style="margin-left:4px;">'
      +         '<button id="ep-today" style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:4px;cursor:pointer;color:var(--text);font-size:11px;padding:4px 6px;">Now</button>'
      +       '</div>'
      +     '</div>'
      //     Gap (from gap:8px on parent) + 12h/24h sliding pill (same slot as AM/PM pill)
      +     '<div id="ep-hrfmt-wrap" style="display:none;position:relative;width:80px;align-self:stretch;border:1px solid var(--border);border-radius:5px;cursor:pointer;overflow:hidden;">'
      +       '<div id="ep-hrfmt-thumb" style="position:absolute;top:2px;left:2px;width:calc(50% - 2px);height:calc(100% - 4px);border-radius:3px;background:var(--accent);transition:transform 0.18s ease;z-index:0;will-change:transform;"></div>'
      +       '<span id="ep-fmt-12" style="flex:1;position:relative;z-index:1;font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center;pointer-events:none;color:var(--muted);">12h</span>'
      +       '<span id="ep-fmt-24" style="flex:1;position:relative;z-index:1;font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center;pointer-events:none;color:#fff;">24h</span>'
      +     '</div>'
      +   '</div>'
      + '</div>';

    // Weekday headers
    var wds = p.querySelector('#ep-wds');
    ['Su','Mo','Tu','We','Th','Fr','Sa'].forEach(function(d) {
      var s = document.createElement('div');
      s.style.cssText = 'text-align:center;font-size:10px;font-weight:600;color:var(--muted);padding:2px 0;';
      s.textContent = d;
      wds.appendChild(s);
    });

    // Hover on nav/step/footer buttons only (pill buttons manage their own styling)
    var _EP_PILL_IDS = {};
    p.addEventListener('mouseover', function(e) {
      var btn = e.target.closest('button');
      if (!btn || !p.contains(btn) || _EP_PILL_IDS[btn.id]) return;
      btn.style.borderColor = 'var(--accent)';
      btn.style.color = 'var(--accent)';
    });
    p.addEventListener('mouseout', function(e) {
      var btn = e.target.closest('button');
      if (!btn || !p.contains(btn) || _EP_PILL_IDS[btn.id]) return;
      btn.style.borderColor = '';
      btn.style.color = '';
    });

    // Kill webkit number-input spinners (can't be done with inline styles)
    var _epStyle = document.createElement('style');
    _epStyle.textContent = '#ep-hr::-webkit-inner-spin-button,#ep-hr::-webkit-outer-spin-button,'
      + '#ep-mn::-webkit-inner-spin-button,#ep-mn::-webkit-outer-spin-button,'
      + '#ep-year::-webkit-inner-spin-button,#ep-year::-webkit-outer-spin-button'
      + '{-webkit-appearance:none;margin:0;}'
      + '#ep-done:hover{border-color:var(--accent);background:rgba(137,180,250,.12);color:var(--accent);}'
      + '#ep-clear:hover{border-color:var(--red,#e06c75);color:var(--red,#e06c75);}'
      + '#ep-today:hover{border-color:var(--accent);color:var(--accent);}';
    document.head.appendChild(_epStyle);

    document.body.appendChild(p);

    // Measure Time label width once and sync footer spacer for perfect column alignment
    (function() {
      var savedVis = p.style.visibility;
      var savedDisp = p.style.display;
      var timeSec = document.getElementById('ep-time');
      var savedTimeDisp = timeSec.style.display;
      p.style.visibility = 'hidden'; p.style.display = 'block';
      timeSec.style.display = 'flex';
      var timeLbl = document.getElementById('ep-time-lbl');
      var spc = document.getElementById('ep-lbl-spc');
      if (timeLbl && spc) spc.style.width = timeLbl.offsetWidth + 'px';
      timeSec.style.display = savedTimeDisp;
      p.style.display = savedDisp; p.style.visibility = savedVis;
    }());

    document.getElementById('ep-prev').addEventListener('click', function() { _epMonth--; if (_epMonth < 0) { _epMonth = 11; _epYear--; } _epRender(); });
    document.getElementById('ep-next').addEventListener('click', function() { _epMonth++; if (_epMonth > 11) { _epMonth = 0; _epYear++; } _epRender(); });
    document.getElementById('ep-close').addEventListener('click', _epClose);
    document.getElementById('ep-today').addEventListener('click', function() {
      var n = new Date();
      if (_epIsDatetime) { _epHr = n.getHours(); _epMn = n.getMinutes(); _epSyncTimeUi(); document.getElementById('ep-mn').value = _epPad(_epMn); }
      _epSelDate = new Date(n.getFullYear(), n.getMonth(), n.getDate());
      _epYear = _epSelDate.getFullYear(); _epMonth = _epSelDate.getMonth();
      _epRender(); if (!_epIsDatetime) _epCommit();
    });
    document.getElementById('ep-clear').addEventListener('click', function() {
      _epSelDate = null;
      if (_epIsDatetime) { _epHr = 0; _epMn = 0; var m = document.getElementById('ep-mn'); if (m) m.value = _epPad(0); _epSyncTimeUi(); }
      _epRender();
    });
    document.getElementById('ep-done').addEventListener('click', _epCommit);

    document.getElementById('ep-hr-dn').addEventListener('click', function() { _epHr = (_epHr - 1 + 24) % 24; _epSyncTimeUi(); });
    document.getElementById('ep-hr-up').addEventListener('click', function() { _epHr = (_epHr + 1) % 24; _epSyncTimeUi(); });
    document.getElementById('ep-mn-dn').addEventListener('click', function() { _epMn = (_epMn - 5 + 60) % 60; document.getElementById('ep-mn').value = _epPad(_epMn); });
    document.getElementById('ep-mn-up').addEventListener('click', function() { _epMn = (_epMn + 5) % 60; document.getElementById('ep-mn').value = _epPad(_epMn); });

    document.getElementById('ep-hr').addEventListener('change', function() {
      if (_ep12) {
        _epHr = _epHrFrom12(this.value, _epHr >= 12);
      } else {
        var v = parseInt(this.value, 10);
        _epHr = isNaN(v) ? 0 : Math.max(0, Math.min(23, v));
      }
      _epSyncTimeUi();
    });
    document.getElementById('ep-mn').addEventListener('change', function() { var v = parseInt(this.value, 10); _epMn = isNaN(v) ? 0 : Math.max(0, Math.min(59, v)); this.value = _epPad(_epMn); });

    function _epToggleAmPm() { _epHr = (_epHr + 12) % 24; _epSyncTimeUi(); }
    document.getElementById('ep-ampm-wrap').addEventListener('click', _epToggleAmPm);

    function _epToggleFmt() {
      _ep12 = !_ep12; try { localStorage.setItem('tvs:picker12hr', _ep12 ? '1' : '0'); } catch(e) {} _epSyncTimeUi();
    }
    document.getElementById('ep-hrfmt-wrap').addEventListener('click', _epToggleFmt);

    var epMoSel = document.getElementById('ep-month');
    if (epMoSel) epMoSel.addEventListener('change', function() {
      _epMonth = parseInt(this.value, 10);
      _epRender();
    });
    var epYrInp = document.getElementById('ep-year');
    if (epYrInp) epYrInp.addEventListener('change', function() {
      var y = parseInt(this.value, 10);
      if (!isNaN(y) && y > 0) { _epYear = y; _epRender(); }
    });

    document.addEventListener('mousedown', function(e) {
      var pk = document.getElementById('ed-picker');
      if (pk && pk.style.display !== 'none' && !pk.contains(e.target) && e.target !== _epInp) _epClose();
    }, true);
  }

  function _epRender() {
    var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    var epMoSel = document.getElementById('ep-month');
    var epYrInp = document.getElementById('ep-year');
    if (epMoSel) epMoSel.value = String(_epMonth);
    if (epYrInp) epYrInp.value = String(_epYear);
    var days = document.getElementById('ep-days');
    if (!days) return;
    days.innerHTML = '';
    var firstDay = new Date(_epYear, _epMonth, 1).getDay();
    var daysInMonth = new Date(_epYear, _epMonth + 1, 0).getDate();
    var daysInPrev = new Date(_epYear, _epMonth, 0).getDate();
    var today = new Date(); today = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    for (var i = 0; i < firstDay; i++) {
      var blank = document.createElement('div');
      blank.style.cssText = 'text-align:center;padding:5px 2px;font-size:12px;color:var(--muted);opacity:.4;';
      blank.textContent = daysInPrev - firstDay + 1 + i;
      days.appendChild(blank);
    }
    for (var d = 1; d <= daysInMonth; d++) {
      var cell = document.createElement('div');
      var cellDate = new Date(_epYear, _epMonth, d);
      var isSel = _epSelDate && cellDate.getTime() === _epSelDate.getTime();
      var isToday = cellDate.getTime() === today.getTime();
      cell.style.cssText = 'text-align:center;padding:5px 2px;border-radius:4px;cursor:pointer;font-size:12px;border:1px solid transparent;'
        + (isSel ? 'background:var(--accent);color:#fff;border-color:var(--accent);' : '')
        + (!isSel && isToday ? 'font-weight:700;color:var(--accent);' : '');
      cell.textContent = d;
      if (!isSel) {
        cell.addEventListener('mouseover', function() { this.style.borderColor = 'var(--accent)'; this.style.color = 'var(--accent)'; });
        cell.addEventListener('mouseout', function() { this.style.borderColor = 'transparent'; this.style.color = ''; });
      }
      (function(yr, mo, dy) {
        cell.addEventListener('click', function() {
          _epSelDate = new Date(yr, mo, dy); _epRender();
          if (!_epIsDatetime) _epCommit();
        });
      }(_epYear, _epMonth, d));
      days.appendChild(cell);
    }
    var trail = 42 - firstDay - daysInMonth;
    for (var t = 1; t <= trail; t++) {
      var tb = document.createElement('div');
      tb.style.cssText = 'text-align:center;padding:5px 2px;font-size:12px;color:var(--muted);opacity:.4;';
      tb.textContent = t; days.appendChild(tb);
    }
  }

  function _epCommit() {
    if (!_epSelDate) return;
    var d = new Date(_epSelDate.getFullYear(), _epSelDate.getMonth(), _epSelDate.getDate(), _epIsDatetime ? _epHr : 0, _epIsDatetime ? _epMn : 0, 0);
    var cb = _epCb;
    _epClose();
    if (cb) cb(d);
  }

  function _epClose() {
    var pk = document.getElementById('ed-picker');
    if (pk) pk.style.display = 'none';
    _epCb = null; _epInp = null;
  }

  window.openEditorPicker = function(anchorEl, currentDate, isDatetime, onSelect) {
    _epCreate();
    _epCb = onSelect;
    _epInp = anchorEl;
    _epIsDatetime = !!isDatetime;
    var init = (currentDate && !isNaN(currentDate.getTime())) ? currentDate : new Date();
    _epSelDate = new Date(init.getFullYear(), init.getMonth(), init.getDate());
    _epYear = _epSelDate.getFullYear(); _epMonth = _epSelDate.getMonth();
    _epHr = init.getHours(); _epMn = init.getMinutes();
    var timeRow = document.getElementById('ep-time');
    if (timeRow) timeRow.style.display = isDatetime ? 'flex' : 'none';
    var fmtWrap = document.getElementById('ep-hrfmt-wrap');
    if (fmtWrap) fmtWrap.style.display = isDatetime ? 'flex' : 'none';
    var lblSpc = document.getElementById('ep-lbl-spc');
    if (lblSpc) lblSpc.style.display = isDatetime ? '' : 'none';
    var mnInp = document.getElementById('ep-mn');
    if (mnInp) mnInp.value = _epPad(_epMn);
    _epSyncTimeUi();
    var todayBtn = document.getElementById('ep-today');
    if (todayBtn) todayBtn.textContent = isDatetime ? 'Now' : 'Today';
    _epRender();
    var pk = document.getElementById('ed-picker');
    pk.style.display = '';
    var r = anchorEl.getBoundingClientRect();
    var pw = pk.offsetWidth || 264; var ph = pk.offsetHeight || 320;
    var left = r.left; var top = r.bottom + 6;
    if (left + pw > window.innerWidth - 8) left = window.innerWidth - pw - 8;
    if (left < 8) left = 8;
    if (top + ph > window.innerHeight - 8) top = r.top - ph - 6;
    if (top < 8) top = 8;
    pk.style.left = left + 'px'; pk.style.top = top + 'px';
  };
})();

// ── Date Pattern Help Floater ─────────────────────────────────────────────
(function() {
  var helpDialog = document.getElementById('datefmt-help-dialog');
  var helpHeader  = document.getElementById('datefmt-help-header');
  var helpClose   = document.getElementById('datefmt-help-close');
  var helpBtn     = document.getElementById('opts-datefmt-help-btn');
  var helpPattern = document.getElementById('datefmt-help-pattern');
  var helpDtDisplay = document.getElementById('datefmt-help-dt-display');
  var helpCalBtn    = document.getElementById('datefmt-help-cal-btn');
  var helpPreview   = document.getElementById('datefmt-help-preview');
  var helpTbody     = document.getElementById('datefmt-help-tbody');
  if (!helpDialog) return;

  // Token reference table data
  var TOKEN_ROWS = [
    ['YYYY', 'Full year (4 digits)', '2025'],
    ['YY',   'Short year (2 digits)', '25'],
    ['MMMM', 'Full month name', 'January'],
    ['MMM',  'Abbreviated month', 'Jan'],
    ['MM',   'Month number, zero-padded', '01'],
    ['M',    'Month number, no padding', '1'],
    ['DD',   'Day of month, zero-padded', '05'],
    ['D',    'Day of month, no padding', '5'],
    ['HH',   '24-hour hour, zero-padded', '14'],
    ['H',    '24-hour hour, no padding', '14'],
    ['hh',   '12-hour hour, zero-padded', '02'],
    ['h',    '12-hour hour, no padding', '2'],
    ['mm',   'Minutes, zero-padded', '30'],
    ['ss',   'Seconds, zero-padded', '07'],
    ['A',    'AM / PM (uppercase)', 'PM'],
    ['a',    'am / pm (lowercase)', 'pm']
  ];

  // Build table
  var refDate = new Date(2025, 0, 5, 14, 30, 7); // Jan 5 2025 14:30:07
  TOKEN_ROWS.forEach(function(row) {
    var tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid var(--border)';
    [row[0], row[1], row[2]].forEach(function(cell, ci) {
      var td = document.createElement('td');
      td.style.cssText = 'padding:4px 8px;vertical-align:top;';
      if (ci === 0) {
        td.style.fontFamily = 'monospace';
        td.style.fontWeight = '600';
        td.style.color = 'var(--accent)';
        td.style.whiteSpace = 'nowrap';
      }
      if (ci === 2) { td.style.fontFamily = 'monospace'; td.style.color = 'var(--muted)'; }
      td.textContent = cell;
      tr.appendChild(td);
    });
    helpTbody.appendChild(tr);
  });

  // Current selected date (tracks what the hidden picker holds)
  var _helpDate = new Date();

  function padZ(n) { return n < 10 ? '0' + n : '' + n; }
  function nowLocalISO() {
    var n = new Date();
    return n.getFullYear() + '-' + padZ(n.getMonth()+1) + '-' + padZ(n.getDate()) + 'T' + padZ(n.getHours()) + ':' + padZ(n.getMinutes());
  }

  function syncDisplay(date) {
    if (!date || isNaN(date.getTime())) { helpDtDisplay.textContent = ''; return; }
    var pat = (helpPattern.value || '').trim();
    // Show in a neutral readable form in the display box
    var displayFmt = 'YYYY-MM-DD HH:mm';
    helpDtDisplay.textContent = (typeof formatDatePattern === 'function')
      ? formatDatePattern(date, displayFmt) : nowLocalISO().replace('T', ' ');
  }

  function updatePreview() {
    var pat = (helpPattern.value || '').trim();
    if (!pat) { helpPreview.textContent = ''; return; }
    var date = _helpDate;
    if (!date || isNaN(date.getTime())) { helpPreview.textContent = ''; return; }
    if (typeof formatDatePattern === 'function') {
      helpPreview.textContent = formatDatePattern(date, pat);
    } else {
      helpPreview.textContent = '(formatter not available)';
    }
  }

  // Calendar button — opens editor custom picker
  if (helpCalBtn) {
    helpCalBtn.addEventListener('mouseenter', function() { helpCalBtn.style.opacity = '1'; helpCalBtn.style.borderColor = 'var(--accent)'; helpCalBtn.style.color = 'var(--accent)'; });
    helpCalBtn.addEventListener('mouseleave', function() { helpCalBtn.style.opacity = '.7'; helpCalBtn.style.borderColor = 'var(--border)'; helpCalBtn.style.color = 'var(--text)'; });
    helpCalBtn.addEventListener('click', function() {
      openEditorPicker(helpCalBtn, _helpDate, true, function(date) {
        _helpDate = date;
        syncDisplay(_helpDate);
        updatePreview();
      });
    });
  }

  helpPattern.addEventListener('input', function() { syncDisplay(_helpDate); updatePreview(); });

  // Open
  var HELP_OPEN_KEY = 'tvs:datefmtHelpOpen';
  var HELP_POS_KEY  = 'tvs:datefmtHelpPos';

  function _clampHelpPos() {
    var tb = document.getElementById('toolbar');
    var tbH = tb ? tb.getBoundingClientRect().bottom : 0;
    var dlgW = helpDialog.offsetWidth;
    var dlgH = helpDialog.offsetHeight;
    if (helpDialog.style.transform !== 'none') {
      var r = helpDialog.getBoundingClientRect();
      helpDialog.style.left = r.left + 'px';
      helpDialog.style.top  = r.top  + 'px';
      helpDialog.style.transform = 'none';
    }
    var x = parseFloat(helpDialog.style.left) || 0;
    var y = parseFloat(helpDialog.style.top)  || 0;
    x = Math.max(0, Math.min(window.innerWidth  - dlgW, x));
    y = Math.max(tbH, Math.min(window.innerHeight - dlgH, y));
    helpDialog.style.left = x + 'px';
    helpDialog.style.top  = y + 'px';
  }

  function openHelp() {
    helpDialog.style.display = '';
    _clampHelpPos();
    _helpDate = new Date();
    syncDisplay(_helpDate);
    updatePreview();
    try { localStorage.setItem(HELP_OPEN_KEY, '1'); } catch(e) {}
  }

  function closeHelp() {
    helpDialog.style.display = 'none';
    try { localStorage.removeItem(HELP_OPEN_KEY); } catch(e) {}
  }

  // Restore open state on load
  (function() {
    try {
      if (localStorage.getItem(HELP_OPEN_KEY) === '1') {
        var pos = JSON.parse(localStorage.getItem(HELP_POS_KEY) || 'null');
        if (pos) {
          helpDialog.style.left      = pos.left;
          helpDialog.style.top       = pos.top;
          helpDialog.style.transform = 'none';
        }
        openHelp();
      }
    } catch(e) {}
  })();

  if (helpBtn) helpBtn.addEventListener('click', openHelp);
  if (helpClose) helpClose.addEventListener('click', closeHelp);

  // Drag to move
  var _dx = 0, _dy = 0, _dragging = false;
  helpHeader.addEventListener('mousedown', function(e) {
    if (e.target === helpClose) return;
    _dragging = true;
    var rect = helpDialog.getBoundingClientRect();
    // Switch from transform-centering to fixed coords on first drag
    helpDialog.style.left = rect.left + 'px';
    helpDialog.style.top  = rect.top  + 'px';
    helpDialog.style.transform = 'none';
    _dx = e.clientX - rect.left;
    _dy = e.clientY - rect.top;
    e.preventDefault();
  });
  document.addEventListener('mousemove', function(e) {
    if (!_dragging) return;
    var dlgW = helpDialog.offsetWidth, dlgH = helpDialog.offsetHeight;
    var tb = document.getElementById('toolbar');
    var tbH = tb ? tb.getBoundingClientRect().bottom : 0;
    var x = e.clientX - _dx;
    var y = e.clientY - _dy;
    x = Math.max(0, Math.min(window.innerWidth  - dlgW, x));
    y = Math.max(tbH, Math.min(window.innerHeight - dlgH, y));
    helpDialog.style.left = x + 'px';
    helpDialog.style.top  = y + 'px';
  });
  document.addEventListener('mouseup', function() {
    if (_dragging) {
      try { localStorage.setItem(HELP_POS_KEY, JSON.stringify({left: helpDialog.style.left, top: helpDialog.style.top})); } catch(e) {}
    }
    _dragging = false;
  });
})();

})();
