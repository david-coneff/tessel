/**
 * tessel-fields.js — HTML renderers for all Tessel field types
 *
 * Exports: TesselFields (object with render methods)
 *
 * Each renderer takes (fieldNode, docSlug) and returns an HTML string.
 * fieldNode conforms to the AST types in tessel-schema.json.
 *
 * Generated HTML attributes:
 *   data-note="<id>"          — persistence key suffix
 *   data-tv-id="<id>"         — VisibilityEngine / ValidationEngine reference key
 *   data-tv-required           — ValidationEngine required flag
 *   data-tv-required-if        — ValidationEngine required_if expression
 *   data-tv-visible-if         — VisibilityEngine visible_if expression
 *   data-tv-validate           — ValidationEngine validate expression
 *   data-tv-warn-msg           — ValidationEngine warning_message
 */

var TesselFields = (function() {

  function esc(s) {
    return (s == null ? '' : String(s))
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /**
   * Build common data-tv-* attributes from field metadata.
   */
  function tvAttrs(meta) {
    if (!meta) return '';
    var parts = [];
    if (meta.id) parts.push('data-tv-id="' + esc(meta.id) + '"');
    if (meta.required === true) parts.push('data-tv-required="true"');
    if (meta.required_if) parts.push('data-tv-required-if="' + esc(meta.required_if) + '"');
    if (meta.visible_if) parts.push('data-tv-visible-if="' + esc(meta.visible_if) + '"');
    if (meta.validate) parts.push('data-tv-validate="' + esc(meta.validate) + '"');
    if (meta.warning_message) parts.push('data-tv-warn-msg="' + esc(meta.warning_message) + '"');
    return parts.join(' ');
  }

  /**
   * Render the required asterisk + hint text below a field.
   */
  function fieldFooter(meta) {
    var parts = [];
    if (meta && meta.hint) {
      parts.push('<span class="tv-help-text">' + esc(meta.hint) + '</span>');
    }
    return parts.join('');
  }

  /**
   * Render required mark in label if applicable.
   */
  function reqMark(meta) {
    if (!meta) return '';
    if (meta.required === true || meta.required_if) {
      return '<span class="tv-required-mark" title="Required">*</span>';
    }
    return '';
  }

  // ---- @text ----
  function renderText(node, docSlug) {
    var meta = node.meta || {};
    var id = esc(meta.id || node.id);
    var label = esc(node.label);
    var placeholder = esc(meta.placeholder || '');
    var defVal = esc(meta.default_value || '');
    var tv = tvAttrs(meta);
    var wrapStyle = meta.visible_if ? '' : '';
    return [
      '<div class="notefield" ' + (meta.visible_if ? 'data-tv-visible-if="' + esc(meta.visible_if) + '"' : '') + '>',
      '  <label>' + label + reqMark(meta) + '</label>',
      '  <input type="text" class="note-input" id="note-' + id + '"',
      '    data-note="' + id + '" ' + tv,
      '    placeholder="' + placeholder + '"',
      '    value="' + defVal + '">',
      fieldFooter(meta),
      '</div>'
    ].join('\n');
  }

  // ---- @area ----
  function renderArea(node, docSlug) {
    var meta = node.meta || {};
    var id = esc(meta.id || node.id);
    var label = esc(node.label);
    var placeholder = esc(meta.placeholder || '');
    var defVal = esc(meta.default_value || '');
    var rows = meta.rows || 4;
    var tv = tvAttrs(meta);
    return [
      '<div class="notefield" ' + (meta.visible_if ? 'data-tv-visible-if="' + esc(meta.visible_if) + '"' : '') + '>',
      '  <label>' + label + reqMark(meta) + '</label>',
      '  <textarea class="note-area" id="note-' + id + '"',
      '    data-note="' + id + '" ' + tv,
      '    rows="' + rows + '"',
      '    placeholder="' + placeholder + '">' + defVal + '</textarea>',
      fieldFooter(meta),
      '</div>'
    ].join('\n');
  }

  // ---- @date ----
  function renderDate(node, docSlug) {
    var meta = node.meta || {};
    var id = esc(meta.id || node.id);
    var label = esc(node.label);
    var minVal = esc(meta.min || '');
    var maxVal = esc(meta.max || '');
    var tv = tvAttrs(meta);
    return [
      '<div class="date-field notefield" ' + (meta.visible_if ? 'data-tv-visible-if="' + esc(meta.visible_if) + '"' : '') + '>',
      '  <label>' + label + reqMark(meta) + '</label>',
      '  <input type="date" id="note-' + id + '"',
      '    data-note="' + id + '" ' + tv,
      (minVal ? '    min="' + minVal + '"' : ''),
      (maxVal ? '    max="' + maxVal + '"' : ''),
      '  >',
      fieldFooter(meta),
      '</div>'
    ].filter(Boolean).join('\n');
  }

  // ---- @credential ----
  function renderCredential(node, docSlug) {
    var meta = node.meta || {};
    var id = esc(meta.id || node.id);
    var label = esc(node.label);
    var schema = meta.schema || '4word';
    var tv = tvAttrs(meta);
    return [
      '<div class="cred-field notefield" ' + (meta.visible_if ? 'data-tv-visible-if="' + esc(meta.visible_if) + '"' : '') + '>',
      '  <label>' + label + reqMark(meta) + '</label>',
      '  <div class="cred-row">',
      '    <div id="cred-pw-section-' + id + '" class="cred-section">',
      '      <input type="password" class="note-input cred-input" id="cred-' + id + '"',
      '        data-cred="' + id + '" data-note="' + id + '" ' + tv,
      '        placeholder="Password / passphrase" autocomplete="new-password">',
      '      <input type="password" class="note-input cred-confirm-input" id="cred-confirm-' + id + '"',
      '        data-for="' + id + '" placeholder="Confirm passphrase">',
      '      <span class="cred-match-indicator" id="cred-match-' + id + '"></span>',
      '      <div class="cred-btns">',
      '        <button type="button" class="cred-toggle" data-for="' + id + '" title="Show / hide">👁</button>',
      '        <button type="button" class="bf-suggest-btn" data-suggest="passphrase" data-for="' + id + '" title="Generate passphrase">✦ Generate</button>',
      '        <select class="bf-suggest-select" data-suggest-for="' + id + '">',
      '          <option value="4word">4-word phrase</option>',
      '          <option value="3word-n">3-word + number</option>',
      '          <option value="random">Random (base32)</option>',
      '        </select>',
      '      </div>',
      '    </div>',
      '  </div>',
      fieldFooter(meta),
      '</div>'
    ].join('\n');
  }

  // ---- @totp ----
  function renderTotp(node, docSlug) {
    var meta = node.meta || {};
    var id = esc(meta.id || node.id);
    var label = esc(node.label);
    var bits = meta.bits || 160;
    var tv = tvAttrs(meta);
    return [
      '<div class="cred-field totp-field notefield" ' + (meta.visible_if ? 'data-tv-visible-if="' + esc(meta.visible_if) + '"' : '') + '>',
      '  <label>' + label + reqMark(meta) + '</label>',
      '  <div id="cred-totp-section-' + id + '" class="cred-section">',
      '    <input type="password" class="note-input cred-totp-input" id="cred-totp-' + id + '"',
      '      data-cred="' + id + '" ' + tv,
      '      placeholder="TOTP secret (base32)" autocomplete="one-time-code">',
      '    <div class="cred-btns">',
      '      <button type="button" class="cred-toggle" data-for="' + id + '" title="Show / hide secret">👁</button>',
      '      <button type="button" class="bf-suggest-btn" data-suggest="totp-secret" data-for="' + id + '" title="Generate TOTP secret">✦ Generate</button>',
      '      <select class="bf-suggest-select" data-suggest-for="' + id + '">',
      '        <option value="totp-20">160-bit (SHA-1, common)</option>',
      '        <option value="totp-32" ' + (bits === 256 ? 'selected' : '') + '>256-bit (SHA-256)</option>',
      '      </select>',
      '    </div>',
      '  </div>',
      fieldFooter(meta),
      '</div>'
    ].join('\n');
  }

  // ---- @radio ----
  function renderRadio(node, docSlug) {
    var meta = node.meta || {};
    var id = esc(meta.id || node.id);
    var label = esc(node.label);
    var options = node.options || [];
    var tv = tvAttrs(meta);
    var opts = options.map(function(opt, idx) {
      var oid = id + '-' + idx;
      return [
        '<label class="choice-opt">',
        '  <input type="radio" name="radio-' + id + '" id="' + oid + '"',
        '    value="' + esc(opt.value) + '" data-slug="' + id + '">',
        '  ' + esc(opt.label),
        '</label>'
      ].join('\n');
    }).join('\n');
    return [
      '<div class="choice-field notefield" data-slug="' + id + '" data-choice-type="radio"',
      '  ' + (meta.visible_if ? 'data-tv-visible-if="' + esc(meta.visible_if) + '"' : '') + '>',
      '  <label class="choice-group-label">' + label + reqMark(meta) + '</label>',
      '  <div class="choice-opts">',
      opts,
      '  </div>',
      '  <input type="hidden" data-note="' + id + '" ' + tv + '>',
      fieldFooter(meta),
      '</div>'
    ].join('\n');
  }

  // ---- @check / @checkbox ----
  function renderCheck(node, docSlug) {
    var meta = node.meta || {};
    var id = esc(meta.id || node.id);
    var label = esc(node.label);
    var options = node.options || [];
    var tv = tvAttrs(meta);
    var opts = options.map(function(opt, idx) {
      var oid = id + '-cb-' + idx;
      return [
        '<label class="choice-opt">',
        '  <input type="checkbox" id="' + oid + '"',
        '    value="' + esc(opt.value) + '" data-slug="' + id + '">',
        '  ' + esc(opt.label),
        '</label>'
      ].join('\n');
    }).join('\n');
    return [
      '<div class="choice-field notefield" data-slug="' + id + '" data-choice-type="checkbox"',
      '  ' + (meta.visible_if ? 'data-tv-visible-if="' + esc(meta.visible_if) + '"' : '') + '>',
      '  <label class="choice-group-label">' + label + reqMark(meta) + '</label>',
      '  <div class="choice-opts">',
      opts,
      '  </div>',
      '  <input type="hidden" data-note="' + id + '" ' + tv + '>',
      fieldFooter(meta),
      '</div>'
    ].join('\n');
  }

  // ---- @select ----
  function renderSelect(node, docSlug) {
    var meta = node.meta || {};
    var id = esc(meta.id || node.id);
    var label = esc(node.label);
    var options = node.options || [];
    var tv = tvAttrs(meta);
    var opts = options.map(function(opt) {
      return '<option value="' + esc(opt.value) + '">' + esc(opt.label) + '</option>';
    }).join('\n');
    return [
      '<div class="notefield" ' + (meta.visible_if ? 'data-tv-visible-if="' + esc(meta.visible_if) + '"' : '') + '>',
      '  <label>' + label + reqMark(meta) + '</label>',
      '  <select class="note-input" id="note-' + id + '"',
      '    data-note="' + id + '" ' + tv + '>',
      '    <option value="">— select —</option>',
      opts,
      '  </select>',
      fieldFooter(meta),
      '</div>'
    ].join('\n');
  }

  // ---- @table ----
  function renderTable(node, docSlug) {
    var meta = node.meta || {};
    var id = esc(meta.id || node.id);
    var label = esc(node.label);
    var columns = node.columns || [];
    var presetRows = (meta.preset_rows || []).join('|');
    var tv = tvAttrs(meta);
    var headers = columns.map(function(col) {
      return '<th>' + esc(col.name) + '</th>';
    }).join('') + '<th></th>';
    return [
      '<div class="table-field notefield" data-slug="' + id + '"',
      '  ' + (meta.visible_if ? 'data-tv-visible-if="' + esc(meta.visible_if) + '"' : '') + '>',
      '  <label>' + label + reqMark(meta) + '</label>',
      '  <div class="input-table-wrap">',
      '    <table class="input-table">',
      '      <thead><tr>' + headers + '</tr></thead>',
      '      <tbody id="tbl-' + id + '"></tbody>',
      '    </table>',
      '    <button type="button" class="add-row-btn" title="Add row">+ Add row</button>',
      '  </div>',
      '  <input type="hidden" data-note="' + id + '" ' + tv,
      '    ' + (presetRows ? 'data-preset-rows="' + esc(JSON.stringify((meta.preset_rows||[]))) + '"' : '') + '>',
      fieldFooter(meta),
      '</div>'
    ].join('\n');
  }

  // ---- @parse ----
  function renderParse(node, docSlug) {
    var meta = node.meta || {};
    var id = esc(meta.id || node.id);
    var label = esc(node.label);
    var regex = esc(node.regex || meta.regex || '');
    var target = esc(meta.target || '');
    var tv = tvAttrs(meta);
    return [
      '<div class="parse-field notefield" data-parse-target="' + target + '" data-parse-regex="' + regex + '"',
      '  ' + (meta.visible_if ? 'data-tv-visible-if="' + esc(meta.visible_if) + '"' : '') + '>',
      '  <label>' + label + '</label>',
      '  <textarea class="parse-input" rows="4" placeholder="Paste text to extract from…"></textarea>',
      '  <button type="button" class="parse-btn">Extract</button>',
      '  <div class="parse-result" style="display:none">',
      '    <strong>Extracted:</strong> <span class="parse-value"></span>',
      '    <button type="button" class="parse-apply" style="display:none">Apply ↓</button>',
      '  </div>',
      '  <input type="hidden" data-note="' + id + '" ' + tv + '>',
      fieldFooter(meta),
      '</div>'
    ].join('\n');
  }

  // ---- @filename ----
  function renderFilename(node, docSlug) {
    var meta = node.meta || {};
    var id = esc(meta.id || node.id);
    var label = esc(node.label);
    var template = esc(node.template || meta.template || '');
    var tv = tvAttrs(meta);
    return [
      '<div class="filename-field notefield" data-slug="' + id + '" data-template="' + template + '"',
      '  ' + (meta.visible_if ? 'data-tv-visible-if="' + esc(meta.visible_if) + '"' : '') + '>',
      '  <label>' + label + reqMark(meta) + '</label>',
      '  <div class="filename-row">',
      '    <input type="text" class="note-input filename-input" id="note-' + id + '"',
      '      data-note="' + id + '" ' + tv + ' readonly>',
      '    <button type="button" class="filename-suggest-btn" title="Re-generate filename">↻</button>',
      '  </div>',
      '  <div class="filename-dep-warn" style="display:none">',
      '    <span class="dep-warn-text"></span>',
      '    <button type="button" class="dep-highlight-btn" title="Highlight missing fields">⚑ Highlight</button>',
      '  </div>',
      fieldFooter(meta),
      '</div>'
    ].join('\n');
  }

  // ---- @dir ----
  function renderDir(node, docSlug) {
    var meta = node.meta || {};
    var id = esc(meta.id || node.id);
    var label = esc(node.label);
    var placeholder = esc(meta.placeholder || '/path/to/directory/');
    var tv = tvAttrs(meta);
    return [
      '<div class="notefield dir-field" ' + (meta.visible_if ? 'data-tv-visible-if="' + esc(meta.visible_if) + '"' : '') + '>',
      '  <label>' + label + reqMark(meta) + '</label>',
      '  <input type="text" class="note-input dir-input" id="note-' + id + '"',
      '    data-note="' + id + '" ' + tv,
      '    placeholder="' + placeholder + '">',
      fieldFooter(meta),
      '</div>'
    ].join('\n');
  }

  // ---- dispatch ----
  function render(node, docSlug) {
    switch (node.type) {
      case 'text_field':       return renderText(node, docSlug);
      case 'area_field':       return renderArea(node, docSlug);
      case 'date_field':       return renderDate(node, docSlug);
      case 'credential_field': return renderCredential(node, docSlug);
      case 'totp_field':       return renderTotp(node, docSlug);
      case 'radio_field':      return renderRadio(node, docSlug);
      case 'check_field':      return renderCheck(node, docSlug);
      case 'select_field':     return renderSelect(node, docSlug);
      case 'table_field':      return renderTable(node, docSlug);
      case 'parse_field':      return renderParse(node, docSlug);
      case 'filename_field':   return renderFilename(node, docSlug);
      case 'dir_field':        return renderDir(node, docSlug);
      default:
        return '<!-- unknown field type: ' + esc(node.type) + ' -->';
    }
  }

  return {
    render: render,
    renderText: renderText,
    renderArea: renderArea,
    renderDate: renderDate,
    renderCredential: renderCredential,
    renderTotp: renderTotp,
    renderRadio: renderRadio,
    renderCheck: renderCheck,
    renderSelect: renderSelect,
    renderTable: renderTable,
    renderParse: renderParse,
    renderFilename: renderFilename,
    renderDir: renderDir
  };

})();

if (typeof module !== 'undefined') module.exports = TesselFields;
