/**
 * tessel-compiler.js — Tessel HTML assembler
 *
 * Exports: TesselCompiler
 *
 * Takes an AST (from TesselParser) and emits a self-contained HTML document with:
 *   - Inline CSS  (TESSEL_CSS)
 *   - Inline JS   (TESSEL_RUNTIME_JS)
 *   - Base64-encoded source .md embedded in <script type="text/tessel-source">
 *   - Full interactive document structure (toolbar, split pane, TOC, notes panel)
 *
 * Depends on: TESSEL_CSS, TESSEL_RUNTIME_JS, TesselFields (all must be loaded first)
 *
 * Browser usage:  all four files script-tagged; window.TesselCompiler available.
 * Node usage:     require() each module; pass as constructor args.
 */

function TesselCompiler(opts) {
  opts = opts || {};
  this._css     = opts.css     || (typeof TESSEL_CSS     !== 'undefined' ? TESSEL_CSS     : '');
  this._runtime = opts.runtime || (typeof TESSEL_RUNTIME_JS !== 'undefined' ? TESSEL_RUNTIME_JS : '');
  this._fields  = opts.fields  || (typeof TesselFields   !== 'undefined' ? TesselFields   : null);
}

// ---- helpers ----
function esc(s) {
  return (s == null ? '' : String(s))
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function b64Encode(str) {
  if (typeof btoa !== 'undefined') {
    // Browser: encode to UTF-8 bytes first
    var bytes = new TextEncoder().encode(str);
    var binary = '';
    for (var i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }
  // Node
  return Buffer.from(str, 'utf8').toString('base64');
}

// Normative slug for doc persistence namespace
function docSlugify(title) {
  return (title || 'doc').toLowerCase()
    .replace(/\.md\b/gi, '').replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '').replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'doc';
}

var CFC_DEFAULT_VERSION = 'cfc-v_2026-06-16_20-02_00_49b99195';

// Minimal inline markdown -> HTML for compiler use
function _inlineToHtml(text) {
  function escInner(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  var lines = text.split('\n');
  var parts = lines.map(function(line) {
    var s = escInner(line);
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    s = s.replace(/\{\{([A-Za-z_][A-Za-z0-9_]*)\}\}/g, '<span class="tpl" data-var="$1">$1</span>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    return s;
  });
  return parts.join('<br>\n');
}

// ---- TOC HTML ----
TesselCompiler.prototype._renderH4Li = function(entry) {
  var lnk = '<a href="#' + esc(entry.id) + '" data-bf-toc="1">' +
    '<span class="bf-toc-num">' + esc(entry.num) + '</span> ' + esc(entry.title) + '</a>';
  return '<li>' + lnk + '</li>';
};

TesselCompiler.prototype._renderH3Li = function(entry) {
  var lnk = '<a href="#' + esc(entry.id) + '" data-bf-toc="1">' +
    '<span class="bf-toc-num">' + esc(entry.num) + '</span> ' + esc(entry.title) + '</a>';
  var h4s = entry.children || [];
  if (h4s.length) {
    var inner = h4s.map(function(c) { return this._renderH4Li(c); }, this).join('');
    if (h4s.length >= 3) {
      return '<li><details class="bf-toc-section" open>' +
        '<summary>' + lnk + '</summary>' +
        '<ul class="bf-toc-l3">' + inner + '</ul></details></li>';
    }
    return '<li>' + lnk + '<ul class="bf-toc-l3">' + inner + '</ul></li>';
  }
  return '<li>' + lnk + '</li>';
};

TesselCompiler.prototype._renderH2Li = function(entry) {
  var lnk = '<a href="#' + esc(entry.id) + '" data-bf-toc="1">' +
    '<span class="bf-toc-num">' + esc(entry.num) + '</span> ' + esc(entry.title) + '</a>';
  var h3s = entry.children || [];
  if (h3s.length) {
    var inner = h3s.map(function(c) { return this._renderH3Li(c); }, this).join('');
    return '<li><details class="bf-toc-section" open>' +
      '<summary>' + lnk + '</summary>' +
      '<ul class="bf-toc-l2">' + inner + '</ul></details></li>';
  }
  return '<li>' + lnk + '</li>';
};

TesselCompiler.prototype._renderToc = function(toc) {
  if (!toc || toc.length < 3) return '';
  var items = toc.map(function(e) { return this._renderH2Li(e); }, this).join('');
  return '<details id="bf-toc" open>' +
    '<summary>' +
    '<span class="bf-toc-title">Contents</span>' +
    '<span class="bf-toc-controls">' +
    '<button type="button" id="bf-toc-section-toggle" title="Collapse all sections">&#x2212;</button>' +
    '</span>' +
    '</summary>' +
    '<nav><ul class="bf-toc-l1">' + items + '</ul></nav>' +
    '</details>';
};

// ---- block renderers ----
TesselCompiler.prototype._renderBlock = function(block, docSlug) {
  var self = this;
  var type = block.type;

  if (type === 'heading') {
    var tag = 'h' + block.level;
    return '<' + tag + ' id="' + esc(block.id) + '">' + esc(block.text) + '</' + tag + '>';
  }

  if (type === 'paragraph') {
    return '<p>' + block.html + '</p>';
  }

  if (type === 'hr') {
    return '<hr>';
  }

  if (type === 'blockquote') {
    var bqLines = block.content.split('\n').map(function(l) { return '<p>' + _inlineToHtml(l) + '</p>'; }).join('');
    return '<blockquote>' + bqLines + '</blockquote>';
  }

  if (type === 'list') {
    var tag2 = block.ordered ? 'ol' : 'ul';
    var items = block.items.map(function(item) { return '<li>' + _inlineToHtml(item) + '</li>'; }).join('');
    return '<' + tag2 + '>' + items + '</' + tag2 + '>';
  }

  if (type === 'code_block') {
    var lang = esc(block.lang || '');
    var code = esc(block.content || '');
    if (block.copyable) {
      return [
        '<div class="codewrap">',
        '  <div class="code-meta"><span class="lang-tag">' + lang + '</span>',
        '    <button type="button" class="copy-btn" title="Copy to clipboard">Copy</button>',
        '  </div>',
        '  <pre><code class="language-' + lang + '">' + code + '</code></pre>',
        '</div>'
      ].join('\n');
    }
    return '<pre><code class="language-' + lang + '">' + code + '</code></pre>';
  }

  if (type === 'markdown_table') {
    var headers = block.headers || [];
    var rows = block.rows || [];
    var thead = '<thead><tr>' + headers.map(function(h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead>';
    var tbody = '<tbody>' + rows.map(function(row) {
      return '<tr>' + row.map(function(cell) { return '<td>' + esc(cell) + '</td>'; }).join('') + '</tr>';
    }).join('') + '</tbody>';
    return '<div class="md-table-wrap"><table class="md-table">' + thead + tbody + '</table></div>';
  }

  // field types
  var fieldTypes = ['text_field','area_field','date_field','datetime_field','number_field',
    'email_field','phone_field','url_field','credential_field','totp_field',
    'radio_field','check_field','select_field','table_field','parse_field','filename_field','dir_field',
    'image_field','richtext_field','computed_field','signature_field'];
  if (fieldTypes.indexOf(type) >= 0) {
    if (self._fields) return self._fields.render(block, docSlug);
    return '<!-- fields renderer not available -->';
  }

  // section / subsection (collapsible wrapper)
  if (type === 'section' || type === 'subsection') {
    var cls = type === 'section' ? 'section' : 'subsection';
    var bodyCls = type === 'section' ? 'sec-body' : 'sub-body';
    var secTitle = esc(block.title || '');
    var inner = (block.blocks || []).map(function(b) { return self._renderBlock(b, docSlug); }).join('\n');
    return [
      '<details class="' + cls + '" open>',
      '  <summary><span class="sec-title">' + secTitle + '</span></summary>',
      '  <div class="' + bodyCls + '">',
      inner,
      '  </div>',
      '</details>'
    ].join('\n');
  }

  // conditional block (@if/@endif)
  if (type === 'conditional') {
    var expr = esc(block.expr || 'true');
    var condInner = (block.blocks || []).map(function(b) { return self._renderBlock(b, docSlug); }).join('\n');
    return [
      '<div class="tessel-if" data-tv-expr="' + expr + '" hidden>',
      condInner,
      '</div>'
    ].join('\n');
  }

  return '<!-- unknown block type: ' + esc(type) + ' -->';
};

// ---- SVG icon helper ----
TesselCompiler.prototype._svgIcon = function(name) {
  var icons = {
    sun: '<svg class="btn-svg-icon" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg"><circle cx="7" cy="7" r="2.5"/><line x1="7" y1="0.5" x2="7" y2="2.5"/><line x1="7" y1="11.5" x2="7" y2="13.5"/><line x1="0.5" y1="7" x2="2.5" y2="7"/><line x1="11.5" y1="7" x2="13.5" y2="7"/><line x1="2.44" y1="2.44" x2="3.87" y2="3.87"/><line x1="10.13" y1="10.13" x2="11.56" y2="11.56"/><line x1="11.56" y1="2.44" x2="10.13" y2="3.87"/><line x1="3.87" y1="10.13" x2="2.44" y2="11.56"/></svg>',
    moon: '<svg class="btn-svg-icon" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg"><path d="M11 7.5A4.5 4.5 0 0 1 6.5 3a4.5 4.5 0 1 0 4.5 4.5z"/></svg>',
    menu: '<svg class="btn-svg-icon" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg"><line x1="1" y1="3.5" x2="13" y2="3.5"/><line x1="1" y1="7" x2="13" y2="7"/><line x1="1" y1="10.5" x2="13" y2="10.5"/></svg>',
    expand: '<svg class="btn-svg-icon" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg"><polyline points="4,1 1,1 1,4"/><polyline points="10,1 13,1 13,4"/><polyline points="4,13 1,13 1,10"/><polyline points="10,13 13,13 13,10"/></svg>',
    collapse: '<svg class="btn-svg-icon" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg"><polyline points="2,5 7,1 12,5"/><polyline points="2,9 7,13 12,9"/></svg>',
    attach: '<svg class="btn-svg-icon" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg"><path d="M12 6.5L6.5 12A3.5 3.5 0 0 1 1.5 7L7 1.5A2.5 2.5 0 0 1 11 5L5.5 10.5A1.5 1.5 0 0 1 3 8L8 3"/></svg>',
    import: '<svg class="btn-svg-icon" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg"><polyline points="3.5,5.5 7,9 10.5,5.5"/><line x1="7" y1="1" x2="7" y2="9"/><line x1="1.5" y1="12.5" x2="12.5" y2="12.5"/></svg>',
    export: '<svg class="btn-svg-icon" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg"><polyline points="3.5,8.5 7,5 10.5,8.5"/><line x1="7" y1="13" x2="7" y2="5"/><line x1="1.5" y1="1.5" x2="12.5" y2="1.5"/></svg>',
    clear: '<svg class="btn-svg-icon" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg"><circle cx="7" cy="7" r="5.5"/><line x1="4.5" y1="4.5" x2="9.5" y2="9.5"/><line x1="9.5" y1="4.5" x2="4.5" y2="9.5"/></svg>'
  };
  return icons[name] || '';
};

// ---- toolbar ----
TesselCompiler.prototype._renderToolbar = function(ast, docSlug) {
  var self = this;
  var hasToc = ast.toc && ast.toc.length > 0;
  return [
    '<div id="bf-toolbar">',
    '  <div class="bf-toolbar-left">',
    '    <span class="bf-title">' + esc(ast.title) + '</span>',
    (hasToc ? '    <button id="bf-toc-toggle" title="Table of Contents">' + self._svgIcon('menu') + '<span class="btn-label">Contents</span></button>' : ''),
    '  </div>',
    '  <div class="bf-toolbar-right">',
    '    <button id="bf-theme-btn" title="Toggle theme">' + self._svgIcon('sun') + '<span class="btn-label">Light</span></button>',
    '    <button id="bf-expand-all" title="Expand all sections">' + self._svgIcon('expand') + '<span class="btn-label">Expand</span></button>',
    '    <button id="bf-collapse-all" title="Collapse all sections">' + self._svgIcon('collapse') + '<span class="btn-label">Collapse</span></button>',
    '    <span id="bf-section-count" class="bf-section-count"></span>',
    '    <button id="bf-attach-btn" title="Attachments">' + self._svgIcon('attach') + '<span class="btn-label">Attach</span><span id="bf-attach-count"></span></button>',
    '    <button id="bf-import-btn" title="Import session ZIP">' + self._svgIcon('import') + '<span class="btn-label">Import</span></button>',
    '    <button id="bf-export-btn" title="Export session ZIP">' + self._svgIcon('export') + '<span class="btn-label">Export</span></button>',
    '    <button id="bf-clear-fields-btn" title="Clear all fields">' + self._svgIcon('clear') + '<span class="btn-label">Clear</span></button>',
    '    <span id="bf-integrity-badge" class="bf-integrity-badge" title="Integrity pending…">…</span>',
    '  </div>',
    '</div>',
    '<div id="bf-toc-panel"></div>'
  ].filter(Boolean).join('\n');
};

// ---- attachment panel ----
TesselCompiler.prototype._renderAttachPanel = function() {
  return [
    '<div id="bf-attach-panel">',
    '  <div id="bf-attach-zone">Drop files here</div>',
    '  <button type="button" id="bf-attach-pick">Browse…</button>',
    '  <ul id="bf-attach-list"></ul>',
    '</div>'
  ].join('\n');
};

// ---- encryption modal ----
TesselCompiler.prototype._renderEncModal = function() {
  return [
    '<div id="bf-enc-modal">',
    '  <div class="enc-modal-inner">',
    '    <h3>Export Options</h3>',
    '    <p>This session contains credentials. Encrypt the export package?</p>',
    '    <div class="enc-phrase-row">',
    '      <label>Passphrase:</label>',
    '      <input type="text" placeholder="Enter or generate a passphrase" autocomplete="off">',
    '      <button type="button">✶ Generate</button>',
    '    </div>',
    '    <div class="enc-modal-btns">',
    '      <button type="button" id="bf-enc-confirm">🔒 Export Encrypted</button>',
    '      <button type="button" id="bf-enc-plain">Export Plain (no credentials)</button>',
    '      <button type="button" id="bf-enc-cancel">Cancel</button>',
    '    </div>',
    '  </div>',
    '</div>'
  ].join('\n');
};

// ---- notes panel ----
TesselCompiler.prototype._renderNotesPanel = function(docSlug) {
  return [
    '<div id="bf-notes-pane">',
    '  <div id="bf-notes-header">',
    '    <span>Session Notes</span>',
    '    <div class="notes-panel-controls">',
    '      <span class="notes-opacity-ctrl">',
    '        <button type="button" id="bf-notes-opacity-down" title="Less opaque">◑</button>',
    '        <span id="bf-notes-opacity-val">95%</span>',
    '        <button type="button" id="bf-notes-opacity-up" title="More opaque">●</button>',
    '      </span>',
    '      <span class="notes-blur-ctrl">',
    '        <button type="button" id="bf-notes-blur-down" title="Less blur">◌</button>',
    '        <span id="bf-notes-blur-val">0px</span>',
    '        <button type="button" id="bf-notes-blur-up" title="More blur">◉</button>',
    '      </span>',
    '      <button type="button" id="bf-notes-float-btn" title="Pop out notes panel">⊞</button>',
    '      <button type="button" id="bf-notes-toggle" title="Hide notes panel">◄</button>',
    '    </div>',
    '  </div>',
    '  <div id="bf-notes-body">',
    '    <textarea id="bf-session-notes" rows="4" placeholder="Quick notes…"></textarea>',
    '    <div id="bf-notes-tree"></div>',
    '    <button type="button" id="bf-notes-add-root">+ Add section</button>',
    '  </div>',
    '  <div id="bf-notes-footer">',
    '    <button type="button" id="bf-notes-export-md" title="Export notes as Markdown">↓ MD</button>',
    '    <button type="button" id="bf-notes-clear" title="Clear all notes">⊘ Clear notes</button>',
    '  </div>',
    '</div>'
  ].join('\n');
};

// ---- walkthrough hint ----
TesselCompiler.prototype._renderWalkthroughHint = function(params) {
  if (!params || !params.length) return '';
  var list = params.map(function(p) {
    return '<span class="param-hint-item"><strong>' + esc(p.name) + '</strong>' +
      (p.label && p.label !== p.name ? ': ' + esc(p.label) : '') + '</span>';
  }).join(' ');
  return [
    '<div id="bf-walkthrough-hint" class="params-hint">',
    '  <strong>Parameters:</strong> ' + list,
    '</div>'
  ].join('\n');
};

// ---- param inputs (top of doc, if any params defined) ----
TesselCompiler.prototype._renderParams = function(params) {
  if (!params || !params.length) return '';
  var rows = params.map(function(p) {
    return [
      '<div class="param-row">',
      '  <label for="param-' + esc(p.name) + '">' + esc(p.label || p.name) + '</label>',
      '  <input type="text" id="param-' + esc(p.name) + '" class="param-input"',
      '    data-var="' + esc(p.name) + '"',
      '    value="' + esc(p.default_value || '') + '"',
      '    placeholder="' + esc(p.label || p.name) + '">',
      '</div>'
    ].join('\n');
  }).join('\n');
  return '<div class="params-panel">' + rows + '</div>';
};

// ---- main compile method ----
TesselCompiler.prototype.compile = function(ast) {
  var self = this;
  var docSlug = docSlugify(ast.title);

  // Render all blocks
  var bodyBlocks = (ast.blocks || []).map(function(block) {
    return self._renderBlock(block, docSlug);
  }).join('\n\n');

  // Source embed (base64)
  var sourceB64 = '';
  try { sourceB64 = b64Encode(ast.source_md || ''); } catch(e) {}

  // TOC sidebar
  var tocHtml = this._renderToc(ast.toc);

  var html = [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '  <meta charset="UTF-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1">',
    '  <meta name="tessel-cfc-version" content="' + CFC_DEFAULT_VERSION + '">',
    '  <title>' + esc(ast.title) + '</title>',
    '  <style>',
    this._css,
    '  </style>',
    '</head>',
    '<body data-doc="' + esc(docSlug) + '"' + (ast.is_walkthrough ? ' data-walkthrough="true"' : '') + '>',

    // toolbar
    this._renderToolbar(ast, docSlug),

    // attachment panel (overlay)
    this._renderAttachPanel(),

    // encryption modal (overlay)
    this._renderEncModal(),

    // main split layout
    '<div id="bf-layout">',

    // TOC pane (left sidebar, hidden until content)
    tocHtml ? '<div id="bf-toc-pane">' + tocHtml + '</div>' : '',

    // drag handle
    '<div id="bf-drag" title="Drag to resize"></div>',

    // document content area
    '<main id="bf-main">',
    '<div id="bf-doc-body">',

    // walkthrough / params
    this._renderWalkthroughHint(ast.template_params),
    this._renderParams(ast.template_params),

    // body
    bodyBlocks,

    '</div>', // #bf-doc-body
    '</main>',

    // notes panel (right)
    this._renderNotesPanel(docSlug),

    '</div>', // #bf-layout

    // source embed
    '<script type="text/tessel-source" data-encoding="base64">',
    sourceB64,
    '</script>',

    // runtime
    '<script>',
    this._runtime,
    '</script>',

    '</body>',
    '</html>'
  ].filter(function(s) { return s !== ''; }).join('\n');

  return html;
};

if (typeof module !== 'undefined') module.exports = TesselCompiler;
