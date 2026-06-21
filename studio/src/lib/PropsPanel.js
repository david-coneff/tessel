import * as StorageEngine from './StorageEngine.js';
import { FIELD_TYPES } from './metadata.js';
import { slugify } from './utils.js';
import { makeTextInput, makeToggle } from '../tessel-ui/index.js';
import { getDateFmtPresets, getTzList, TZ_SHORTCODES, getDefaultTimezone, formatDatePattern } from './DateUtils.js';

var _deps = {};

export function initPropsPanel(deps) { _deps = deps; }

export function mkPropRow(label) {
  var row = document.createElement('div'); row.className = 'prop-row';
  var lbl = document.createElement('div'); lbl.className = 'prop-label'; lbl.textContent = label;
  row.appendChild(lbl);
  return row;
}

export function mkInput(val, onChange) {
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

export function mkCheckRow(label, checked, onChange) {
  var row = document.createElement('div'); row.className = 'prop-check-row';
  row.appendChild(makeToggle({ label: label, checked: !!checked, onChange: onChange }));
  return row;
}

export function updateOutline() {
  var list = document.getElementById('outline-list');
  list.innerHTML = '';
  var headings = [];
  function collectH(arr) {
    arr.forEach(function(b) {
      if (b.type === 'heading') headings.push(b);
      if (b.type === 'section' && b.children) collectH(b.children);
    });
  }
  collectH(_deps.getBlocks());
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

export function renderProps() {
  var body = document.getElementById('props-body');
  var empty = document.getElementById('props-empty');
  var selectedBlockId = _deps.getSelectedBlockId();
  if (!selectedBlockId) { body.innerHTML = ''; body.appendChild(empty); return; }
  var b = _deps.getBlock(selectedBlockId);
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
    _deps.renderCanvas(); renderProps(); _deps.markUnsaved();
  });
  typeRow.appendChild(typeSel);
  body.appendChild(typeRow);

  var labelRow = mkPropRow('Label');
  labelRow.appendChild(mkInput(b.label || '', function(v) {
    b.label = v;
    if (!b.meta._idManuallySet) b.meta.id = slugify(v);
    _deps.renderCanvas(); _deps.markUnsaved();
  }));
  body.appendChild(labelRow);

  var idRow = mkPropRow('Field ID');
  idRow.appendChild(mkInput(b.meta.id || '', function(v) { b.meta.id = v; b.meta._idManuallySet = true; _deps.markUnsaved(); }));
  body.appendChild(idRow);

  body.appendChild(mkCheckRow('Required', b.meta.required, function(v) { b.meta.required = v; _deps.renderCanvas(); _deps.markUnsaved(); }));

  var reqIfRow = mkPropRow('Required if');
  reqIfRow.appendChild(mkInput(b.meta.required_if || '', function(v) { b.meta.required_if = v||undefined; _deps.markUnsaved(); }));
  body.appendChild(reqIfRow);

  var visIfRow = mkPropRow('Visible if');
  visIfRow.appendChild(mkInput(b.meta.visible_if || '', function(v) { b.meta.visible_if = v||undefined; _deps.markUnsaved(); }));
  body.appendChild(visIfRow);

  var valRow = mkPropRow('Validate (regex)');
  valRow.appendChild(mkInput(b.meta.validate || '', function(v) { b.meta.validate = v||undefined; _deps.markUnsaved(); }));
  body.appendChild(valRow);

  var warnRow = mkPropRow('Warning message');
  warnRow.appendChild(mkInput(b.meta.warning_message || '', function(v) { b.meta.warning_message = v||undefined; _deps.markUnsaved(); }));
  body.appendChild(warnRow);

  if (b.fieldType === 'image') {
    var srcRow = mkPropRow('Source URL');
    srcRow.appendChild(mkInput(b.meta.src || '', function(v) { b.meta.src = v||undefined; _deps.renderCanvas(); _deps.markUnsaved(); }));
    body.appendChild(srcRow);
  }

  if (b.fieldType === 'computed') {
    var exprRow = mkPropRow('Expression');
    exprRow.appendChild(mkInput(b.meta.expr || '', function(v) { b.meta.expr = v||undefined; _deps.renderCanvas(); _deps.markUnsaved(); }));
    body.appendChild(exprRow);
  }

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
      updateFmtPreview(); _deps.renderCanvas(); _deps.markUnsaved();
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
        updateFmtPreview(); _deps.renderCanvas(); _deps.markUnsaved();
      } else {
        unlockFmtInp();
        fmtInp.focus();
      }
    });

    body.appendChild(mkCheckRow('Require valid date', b.meta.requireValidDate, function(v) {
      b.meta.requireValidDate = v || undefined; _deps.markUnsaved();
    }));

    var tzRow = mkPropRow('Timezone');
    var propTzMode = (function() { try { return StorageEngine.getItem('tvs:tzPickerMode') || 'iana'; } catch(e) { return 'iana'; } })();
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
      _deps.renderCanvas(); _deps.markUnsaved();
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
        inp.addEventListener('input', function() { b.options[i] = inp.value; _deps.renderCanvas(); _deps.markUnsaved(); });
        var del = document.createElement('button'); del.className = 'opt-del'; del.textContent = '✕';
        del.addEventListener('click', function() { b.options.splice(i,1); renderOptList(); _deps.renderCanvas(); _deps.markUnsaved(); });
        row.appendChild(inp); row.appendChild(del); optList.appendChild(row);
      });
    };
    renderOptList();
    body.appendChild(optList);

    var addOpt = document.createElement('button');
    addOpt.className = 'opt-add'; addOpt.textContent = '+ Add option';
    addOpt.addEventListener('click', function() {
      b.options.push('Option ' + (b.options.length + 1));
      renderOptList(); _deps.renderCanvas(); _deps.markUnsaved();
    });
    body.appendChild(addOpt);
  }
}
