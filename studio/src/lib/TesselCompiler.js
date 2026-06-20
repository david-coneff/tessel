import { getDefaultTimezone } from './DateUtils.js';

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

export { blocksToHtml, buildPage, parseMd };
