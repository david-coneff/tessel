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

// ---- TOC HTML ----
TesselCompiler.prototype._renderTocEntry = function(entry, depth) {
  var children = '';
  if (entry.children && entry.children.length) {
    children = '\n<details class="bf-toc-section" open>\n<summary></summary>\n<ul>\n' +
      entry.children.map(function(c) { return this._renderTocEntry(c, depth + 1); }, this).join('\n') +
      '\n</ul>\n</details>';
  }
  return '<li><a href="#' + esc(entry.id) + '">' + esc(entry.title) + '</a>' + children + '</li>';
};

TesselCompiler.prototype._renderToc = function(toc) {
  if (!toc || !toc.length) return '';
  var entries = toc.map(function(e) { return this._renderTocEntry(e, 0); }, this).join('\n');
  return [
    '<div id="bf-toc">',
    '  <div class="toc-header">',
    '    <span>Contents</span>',
    '    <button id="bf-toc-section-toggle" title="Collapse all sections">&#x2212;</button>',
    '  </div>',
    '  <nav><ul>' + entries + '</ul></nav>',
    '</div>'
  ].join('\n');
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
    return '<p id="bf-doc-body">' + block.html + '</p>';
  }

  if (type === 'hr') {
    return '<hr>';
  }

  if (type === 'blockquote') {
    var bqLines = block.content.split('\n').map(function(l) { return '<p>' + esc(l) + '</p>'; }).join('');
    return '<blockquote>' + bqLines + '</blockquote>';
  }

  if (type === 'list') {
    var tag2 = block.ordered ? 'ol' : 'ul';
    var items = block.items.map(function(item) { return '<li>' + esc(item) + '</li>'; }).join('');
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
  var fieldTypes = ['text_field','area_field','date_field','credential_field','totp_field',
    'radio_field','check_field','select_field','table_field','parse_field','filename_field','dir_field'];
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
    // Render with hidden attribute; runtime sets visibility based on expr evaluation
    return [
      '<div class="tessel-if" data-tv-expr="' + expr + '" hidden>',
      condInner,
      '</div>'
    ].join('\n');
  }

  return '<!-- unknown block type: ' + esc(type) + ' -->';
};

// ---- toolbar ----
TesselCompiler.prototype._renderToolbar = function(ast, docSlug) {
  var hasToc = ast.toc && ast.toc.length > 0;
  return [
    '<div id="bf-toolbar">',
    '  <div class="bf-toolbar-left">',
    '    <span class="bf-title">' + esc(ast.title) + '</span>',
    (hasToc ? '    <button id="bf-toc-toggle" title="Table of Contents">☰ Contents</button>' : ''),
    '  </div>',
    '  <div class="bf-toolbar-right">',
    '    <button id="bf-theme-btn" title="Toggle theme">☀ Light</button>',
    '    <button id="bf-expand-all" title="Expand all sections">⊞ Expand</button>',
    '    <button id="bf-collapse-all" title="Collapse all sections">⊟ Collapse</button>',
    '    <span id="bf-section-count" class="bf-section-count"></span>',
    '    <button id="bf-attach-btn" title="Attachments">📎 Attach <span id="bf-attach-count"></span></button>',
    '    <button id="bf-import-btn" title="Import session ZIP">↑ Import</button>',
    '    <button id="bf-export-btn" title="Export session ZIP">↓ Export</button>',
    '    <button id="bf-clear-fields-btn" title="Clear all fields">⊘ Clear</button>',
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
    '      <button type="button">✦ Generate</button>',
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
