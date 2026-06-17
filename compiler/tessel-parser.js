/**
 * tessel-parser.js — Tessel document parser
 *
 * Parses a Tessel Markdown document into an AST conforming to tessel-schema.json.
 *
 * Exports: TesselParser
 *
 * Supported input:
 *   - YAML front-matter (--- ... ---)
 *   - Standard markdown: h1-h6, paragraphs, code fences, blockquotes, lists, --- hr, tables
 *   - @field directives: @text, @area, @date, @credential, @totp, @radio, @check/@checkbox,
 *                        @select, @table, @parse, @filename, @dir,
 *                        @image, @richtext, @computed, @signature
 *   - @section / @endsection / @subsection / @endsubsection (collapsible wrapper directives)
 *   - @if / @endif (conditional blocks)
 *   - @param (template parameter declaration)
 *   - Metadata blocks: {key=value, ...} on the line immediately after a directive
 *   - {{VAR}} substitution markers (preserved as TplSpan references in AST)
 */

/**
 * Normative slug algorithm (SPEC §4.2).
 * label.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,48)||"note"
 */
function slugify(label) {
  return (label || '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'note';
}

/**
 * Parse a YAML-like front-matter block.
 * Supports: string scalars, booleans, bare arrays (- item), nested keys.
 * This is intentionally simple (no full YAML spec) — enough for Tessel front-matter.
 */
function parseFrontMatter(text) {
  var result = { title: '', is_walkthrough: false, collapsible: false, params: [], tags: [], doc_id: '' };
  if (!text || !text.trim()) return result;
  var lines = text.split('\n');
  var i = 0;
  var currentKey = null;
  var inArray = false;
  while (i < lines.length) {
    var line = lines[i++];
    var stripped = line.trimEnd();
    if (!stripped) continue;
    var arrMatch = stripped.match(/^(\s*)- (.*)$/);
    if (arrMatch && inArray && currentKey) {
      if (!result[currentKey]) result[currentKey] = [];
      result[currentKey].push(arrMatch[2].trim());
      continue;
    }
    var kvMatch = stripped.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)$/);
    if (kvMatch) {
      inArray = false;
      currentKey = kvMatch[1];
      var val = kvMatch[2].trim();
      if (val === '') { inArray = true; result[currentKey] = []; continue; }
      if (val === 'true') result[currentKey] = true;
      else if (val === 'false') result[currentKey] = false;
      else if (/^\d+$/.test(val)) result[currentKey] = parseInt(val, 10);
      else result[currentKey] = val.replace(/^['"]/g, '').replace(/['"]$/g, '');
      continue;
    }
  }
  return result;
}

/**
 * Parse a metadata block: {key=value, key2=value2, ...}
 * Also handles multi-line: {key=value,\n  key2=value2}
 * Returns an object.
 */
function parseMetaBlock(text) {
  // strip outer braces
  var inner = text.replace(/^\{|\}$/g, '').trim();
  var meta = {};
  // Split on commas that are not inside quotes
  var parts = [];
  var cur = '', inQ = false, qc = '';
  for (var i = 0; i < inner.length; i++) {
    var c = inner[i];
    if (!inQ && (c === '"' || c === "'")) { inQ = true; qc = c; cur += c; }
    else if (inQ && c === qc) { inQ = false; cur += c; }
    else if (!inQ && c === ',') { parts.push(cur.trim()); cur = ''; }
    else { cur += c; }
  }
  if (cur.trim()) parts.push(cur.trim());
  parts.forEach(function(part) {
    var eq = part.indexOf('=');
    if (eq < 0) return;
    var k = part.slice(0, eq).trim();
    var v = part.slice(eq + 1).trim().replace(/^['"]/g, '').replace(/['"]$/g, '');
    meta[k] = v;
  });
  return meta;
}

/**
 * Tokenise a line of markdown text, preserving {{VAR}} spans.
 * Returns the raw line string (AST consumers handle substitution at render time).
 */
function parseLine(line) {
  return line;
}

/**
 * Parse a @directive line.
 * Returns { directive, label, options } or null if not a directive.
 *
 * Forms:
 *   @text Label text
 *   @radio Group Label: opt1, opt2, opt3
 *   @select Label: opt1 | opt2 | opt3
 *   @table Label: Col1, Col2, Col3
 *   @param name: Description  (or @param name=default: Description)
 *   @if expression
 *   @section Title
 *   @subsection Title
 */
function parseDirectiveLine(line) {
  var m = line.match(/^@([a-zA-Z_][a-zA-Z0-9_]*)\s*(.*)?$/);
  if (!m) return null;
  var directive = m[1].toLowerCase();
  var rest = (m[2] || '').trim();
  return { directive: directive, rest: rest };
}

/**
 * Parse table columns from "@table Label: Col1, Col2, Col3"
 */
function parseTableSpec(rest) {
  var colonIdx = rest.indexOf(':');
  if (colonIdx < 0) return { label: rest, columns: [] };
  var label = rest.slice(0, colonIdx).trim();
  var cols = rest.slice(colonIdx + 1).trim().split(',').map(function(c) { return c.trim(); }).filter(Boolean);
  return { label: label, columns: cols };
}

/**
 * Parse option lists from "@radio Label: opt1, opt2" or "@select Label: opt1 | opt2"
 */
function parseOptionSpec(rest, sep) {
  sep = sep || ',';
  var colonIdx = rest.indexOf(':');
  if (colonIdx < 0) return { label: rest, options: [] };
  var label = rest.slice(0, colonIdx).trim();
  var opts = rest.slice(colonIdx + 1).trim().split(sep).map(function(o) {
    var t = o.trim();
    // Support "Label (value)" syntax
    var vm = t.match(/^(.*)\s+\(([^)]+)\)$/);
    if (vm) return { label: vm[1].trim(), value: vm[2].trim() };
    return { label: t, value: slugify(t) };
  }).filter(function(o) { return o.label; });
  return { label: label, options: opts };
}

/**
 * Apply metadata block to a partially-built AST node.
 * Recognized keys: id, required, required_if, visible_if, validate, warning_message,
 *                  placeholder, default, hint, multiline, min, max, format,
 *                  rows, preset_rows, schema, bits, regex, target, template, depends_on
 */
function applyMeta(node, meta) {
  if (!meta) return node;
  var fieldMeta = node.meta || (node.meta = {});
  // normalize keys
  if (meta.id) fieldMeta.id = meta.id;
  if (meta.required !== undefined) fieldMeta.required = meta.required === 'true' || meta.required === true;
  if (meta.required_if) fieldMeta.required_if = meta.required_if;
  if (meta.visible_if) fieldMeta.visible_if = meta.visible_if;
  if (meta.validate) fieldMeta.validate = meta.validate;
  if (meta.warning_message) fieldMeta.warning_message = meta.warning_message;
  if (meta.placeholder) fieldMeta.placeholder = meta.placeholder;
  if (meta.default !== undefined) fieldMeta.default_value = meta.default;
  if (meta.hint) fieldMeta.hint = meta.hint;
  if (meta.multiline !== undefined) fieldMeta.multiline = meta.multiline === 'true' || meta.multiline === true;
  if (meta.min !== undefined) fieldMeta.min = meta.min;
  if (meta.max !== undefined) fieldMeta.max = meta.max;
  if (meta.format) fieldMeta.format = meta.format;
  if (meta.rows !== undefined) fieldMeta.rows = parseInt(meta.rows, 10) || 4;
  if (meta.preset_rows) fieldMeta.preset_rows = meta.preset_rows.split('|').map(function(s) { return s.trim(); }).filter(Boolean);
  if (meta.schema) fieldMeta.schema = meta.schema;
  if (meta.bits) fieldMeta.bits = parseInt(meta.bits, 10) || 160;
  if (meta.regex) fieldMeta.regex = meta.regex;
  if (meta.target) fieldMeta.target = meta.target;
  if (meta.template) fieldMeta.template = meta.template;
  if (meta.depends_on) fieldMeta.depends_on = meta.depends_on.split(',').map(function(s) { return s.trim(); }).filter(Boolean);
  // if id not set, derive from node label
  if (!fieldMeta.id && node.label) fieldMeta.id = slugify(node.label);
  return node;
}

/**
 * Build a FieldMetadata base from a parsed directive.
 */
function baseField(type, label, meta) {
  var id = (meta && meta.id) ? meta.id : slugify(label);
  return { type: type, label: label, id: id, meta: {} };
}

/**
 * Parse a markdown table line into headers/rows.
 */
function parseMdTable(lines, startIdx) {
  // lines[startIdx] = | H1 | H2 |
  // lines[startIdx+1] = |---|---|
  // lines[startIdx+2..] = | data | data |
  function parseCells(line) {
    return line.replace(/^\||\|$/g, '').split('|').map(function(c) { return c.trim(); });
  }
  var headers = parseCells(lines[startIdx]);
  var rows = [];
  var i = startIdx + 2; // skip separator
  while (i < lines.length && lines[i].trim().startsWith('|')) {
    rows.push(parseCells(lines[i]));
    i++;
  }
  return { headers: headers, rows: rows, endIdx: i };
}

/**
 * Build a TOC from heading blocks.
 */
function buildToc(blocks) {
  var toc = [];
  var stack = []; // [{level, entry}]
  blocks.forEach(function(b) {
    if (b.type !== 'heading') return;
    var entry = { id: b.id, title: b.text, level: b.level, children: [] };
    // find parent
    while (stack.length && stack[stack.length - 1].level >= b.level) stack.pop();
    if (stack.length) {
      stack[stack.length - 1].entry.children.push(entry);
    } else {
      toc.push(entry);
    }
    stack.push({ level: b.level, entry: entry });
  });
  return toc;
}

/**
 * Main parser class.
 */
function TesselParser() {}

TesselParser.prototype.parse = function(source) {
  var lines = source.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  var i = 0;

  // ---- front-matter ----
  var frontMatterText = '';
  var frontMatter = {};
  if (lines[0] && lines[0].trim() === '---') {
    i = 1;
    var fmLines = [];
    while (i < lines.length && lines[i].trim() !== '---') { fmLines.push(lines[i]); i++; }
    i++; // skip closing ---
    frontMatterText = fmLines.join('\n');
    frontMatter = parseFrontMatter(frontMatterText);
  }

  var blocks = [];
  var templateParams = [];
  var headingCounters = {}; // for unique ids

  function uniqueId(base) {
    headingCounters[base] = (headingCounters[base] || 0) + 1;
    return headingCounters[base] === 1 ? base : base + '-' + headingCounters[base];
  }

  // ---- check if next non-empty line is a metadata block ----
  function peekMeta(idx) {
    var j = idx;
    while (j < lines.length && !lines[j].trim()) j++;
    if (j < lines.length && lines[j].trim().startsWith('{')) {
      // collect until closing }
      var metaStr = '';
      var depth = 0;
      var start = j;
      while (j < lines.length) {
        var seg = lines[j];
        for (var c = 0; c < seg.length; c++) {
          if (seg[c] === '{') depth++;
          else if (seg[c] === '}') depth--;
        }
        metaStr += (j > start ? '\n' : '') + seg;
        j++;
        if (depth <= 0) break;
      }
      return { meta: parseMetaBlock(metaStr), nextIdx: j };
    }
    return null;
  }

  // section/subsection stack for @section/@subsection
  var sectionStack = []; // [{type:'section'|'subsection', node}]

  function currentContainer() {
    if (sectionStack.length === 0) return blocks;
    var top = sectionStack[sectionStack.length - 1];
    return top.node.blocks;
  }

  function pushBlock(block) {
    currentContainer().push(block);
  }

  // @if/@endif stack
  var ifStack = []; // [{node}] — nodes with .type='conditional'

  function conditionalContainer() {
    if (ifStack.length > 0) return ifStack[ifStack.length - 1].node.blocks;
    return null;
  }

  function pushAnyBlock(block) {
    var cc = conditionalContainer();
    if (cc) cc.push(block);
    else pushBlock(block);
  }

  // ---- main parse loop ----
  while (i < lines.length) {
    var line = lines[i];
    var stripped = line.trimEnd();

    // blank line
    if (!stripped.trim()) { i++; continue; }

    // ---- @directives ----
    if (stripped.trimStart().startsWith('@')) {
      var dirParsed = parseDirectiveLine(stripped.trimStart());
      if (dirParsed) {
        var dir = dirParsed.directive;
        var rest = dirParsed.rest;
        i++;

        // @param
        if (dir === 'param') {
          // @param name=default: Description
          // @param name: Description
          var pm = rest.match(/^([a-zA-Z_][a-zA-Z0-9_]*)(?:=([^:]*))?\s*(?::\s*(.*))?$/);
          if (pm) {
            var pname = pm[1], pdef = pm[2] ? pm[2].trim() : '', pdesc = pm[3] ? pm[3].trim() : '';
            templateParams.push({ name: pname, label: pdesc || pname, default_value: pdef });
          }
          continue;
        }

        // @section / @endsection
        if (dir === 'section') {
          var secNode = { type: 'section', title: rest, blocks: [] };
          pushAnyBlock(secNode);
          sectionStack.push({ type: 'section', node: secNode });
          continue;
        }
        if (dir === 'endsection') {
          if (sectionStack.length && sectionStack[sectionStack.length - 1].type === 'section')
            sectionStack.pop();
          continue;
        }

        // @subsection / @endsubsection
        if (dir === 'subsection') {
          var subNode = { type: 'subsection', title: rest, blocks: [] };
          pushAnyBlock(subNode);
          sectionStack.push({ type: 'subsection', node: subNode });
          continue;
        }
        if (dir === 'endsubsection') {
          if (sectionStack.length && sectionStack[sectionStack.length - 1].type === 'subsection')
            sectionStack.pop();
          continue;
        }

        // @if / @endif
        if (dir === 'if') {
          var ifNode = { type: 'conditional', expr: rest, blocks: [] };
          // push to parent container first, then track for nesting
          var parentCC = conditionalContainer();
          if (parentCC) parentCC.push(ifNode);
          else pushBlock(ifNode);
          ifStack.push({ node: ifNode });
          continue;
        }
        if (dir === 'endif') {
          if (ifStack.length) ifStack.pop();
          continue;
        }

        // ---- field directives ----
        var metaResult = peekMeta(i);
        var meta = metaResult ? metaResult.meta : null;
        if (metaResult) i = metaResult.nextIdx;

        var fieldNode = null;

        if (dir === 'text') {
          fieldNode = { type: 'text_field', label: rest };
          applyMeta(fieldNode, meta);
        }
        else if (dir === 'area') {
          fieldNode = { type: 'area_field', label: rest };
          applyMeta(fieldNode, meta);
        }
        else if (dir === 'date') {
          fieldNode = { type: 'date_field', label: rest };
          applyMeta(fieldNode, meta);
        }
        else if (dir === 'credential' || dir === 'cred') {
          fieldNode = { type: 'credential_field', label: rest };
          applyMeta(fieldNode, meta);
        }
        else if (dir === 'totp') {
          fieldNode = { type: 'totp_field', label: rest };
          applyMeta(fieldNode, meta);
        }
        else if (dir === 'radio') {
          var rSpec = parseOptionSpec(rest, ',');
          fieldNode = { type: 'radio_field', label: rSpec.label, options: rSpec.options };
          applyMeta(fieldNode, meta);
        }
        else if (dir === 'check' || dir === 'checkbox') {
          var cSpec = parseOptionSpec(rest, ',');
          fieldNode = { type: 'check_field', label: cSpec.label, options: cSpec.options };
          applyMeta(fieldNode, meta);
        }
        else if (dir === 'select') {
          var sSpec = parseOptionSpec(rest, '|');
          fieldNode = { type: 'select_field', label: sSpec.label, options: sSpec.options };
          applyMeta(fieldNode, meta);
        }
        else if (dir === 'table') {
          var tSpec = parseTableSpec(rest);
          var cols = tSpec.columns.map(function(c) { return { name: c, type: 'text' }; });
          fieldNode = { type: 'table_field', label: tSpec.label, columns: cols };
          applyMeta(fieldNode, meta);
        }
        else if (dir === 'parse') {
          // @parse Label: /regex/
          var colonIdx2 = rest.indexOf(':');
          var parseLabel = colonIdx2 >= 0 ? rest.slice(0, colonIdx2).trim() : rest;
          var parseRegex = colonIdx2 >= 0 ? rest.slice(colonIdx2 + 1).trim().replace(/^\/|\/[gimu]*$/g, '') : '';
          fieldNode = { type: 'parse_field', label: parseLabel, regex: parseRegex };
          applyMeta(fieldNode, meta);
        }
        else if (dir === 'filename') {
          // @filename Label: {{PARAM}}_{{STAMP}}.txt
          var colonIdx3 = rest.indexOf(':');
          var fnLabel = colonIdx3 >= 0 ? rest.slice(0, colonIdx3).trim() : rest;
          var fnTemplate = colonIdx3 >= 0 ? rest.slice(colonIdx3 + 1).trim() : '';
          fieldNode = { type: 'filename_field', label: fnLabel, template: fnTemplate };
          applyMeta(fieldNode, meta);
        }
        else if (dir === 'dir') {
          fieldNode = { type: 'dir_field', label: rest };
          applyMeta(fieldNode, meta);
        }
        else if (dir === 'image') {
          fieldNode = { type: 'image_field', label: rest };
          applyMeta(fieldNode, meta);
        }
        else if (dir === 'richtext' || dir === 'rt') {
          fieldNode = { type: 'richtext_field', label: rest };
          applyMeta(fieldNode, meta);
        }
        else if (dir === 'computed') {
          // @computed Label: ${field_id} expression
          var colonIdx4 = rest.indexOf(':');
          var compLabel = colonIdx4 >= 0 ? rest.slice(0, colonIdx4).trim() : rest;
          var compExpr  = colonIdx4 >= 0 ? rest.slice(colonIdx4 + 1).trim() : '';
          fieldNode = { type: 'computed_field', label: compLabel, expr: compExpr };
          applyMeta(fieldNode, meta);
        }
        else if (dir === 'signature' || dir === 'sig') {
          fieldNode = { type: 'signature_field', label: rest };
          applyMeta(fieldNode, meta);
        }
        else {
          // unknown directive — treat as paragraph comment
          pushAnyBlock({ type: 'paragraph', html: '<em>@' + dir + ' ' + rest + '</em>' });
          continue;
        }

        if (fieldNode) {
          // ensure id derived if not set
          if (!fieldNode.id) fieldNode.id = slugify(fieldNode.label || dir);
          if (!fieldNode.meta) fieldNode.meta = {};
          if (!fieldNode.meta.id) fieldNode.meta.id = fieldNode.id;
          pushAnyBlock(fieldNode);
        }
        continue;
      }
    }

    // ---- headings ----
    var hm = stripped.match(/^(#{1,6})\s+(.+)$/);
    if (hm) {
      var level = hm[1].length;
      var hText = hm[2].trim();
      var hId = uniqueId(slugify(hText));
      pushAnyBlock({ type: 'heading', level: level, text: hText, id: hId });
      i++; continue;
    }

    // ---- horizontal rule ----
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(stripped.trim())) {
      pushAnyBlock({ type: 'hr' });
      i++; continue;
    }

    // ---- code fence ----
    var fenceMatch = stripped.match(/^(```|~~~)(\S*)\s*(.*)$/);
    if (fenceMatch) {
      var fence = fenceMatch[1], lang = fenceMatch[2] || '', meta2 = fenceMatch[3] || '';
      i++;
      var codeLines = [];
      while (i < lines.length && !lines[i].trimEnd().startsWith(fence)) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      // parse copyable flag from meta
      var copyable = /copy(able)?/i.test(meta2) ||
        ['bash','sh','shell','console','cmd','powershell','ps1','zsh','fish'].indexOf(lang.toLowerCase()) >= 0;
      pushAnyBlock({ type: 'code_block', lang: lang, content: codeLines.join('\n'), copyable: copyable });
      continue;
    }

    // ---- blockquote ----
    if (stripped.trimStart().startsWith('>')) {
      var bqLines = [];
      while (i < lines.length && lines[i].trimStart().startsWith('>')) {
        bqLines.push(lines[i].replace(/^(\s*>)+\s?/, ''));
        i++;
      }
      pushAnyBlock({ type: 'blockquote', content: bqLines.join('\n') });
      continue;
    }

    // ---- markdown table ----
    if (stripped.includes('|') && stripped.trim().startsWith('|')) {
      // peek at next line for separator row
      var next = lines[i + 1] ? lines[i + 1].trim() : '';
      if (/^\|[\s\-|:]+\|$/.test(next)) {
        var tResult = parseMdTable(lines, i);
        pushAnyBlock({ type: 'markdown_table', headers: tResult.headers, rows: tResult.rows });
        i = tResult.endIdx;
        continue;
      }
    }

    // ---- unordered / ordered list ----
    if (/^\s*[-*+]\s/.test(stripped) || /^\s*\d+\.\s/.test(stripped)) {
      var ordered = /^\s*\d+\.\s/.test(stripped);
      var listItems = [];
      while (i < lines.length && (/^\s*[-*+]\s/.test(lines[i]) || /^\s*\d+\.\s/.test(lines[i]))) {
        var itemText = lines[i].replace(/^\s*(?:[-*+]|\d+\.)\s+/, '');
        listItems.push(itemText);
        i++;
      }
      pushAnyBlock({ type: 'list', ordered: ordered, items: listItems });
      continue;
    }

    // ---- paragraph (collect until blank line or next block-level element) ----
    var paraLines = [];
    while (i < lines.length) {
      var pl = lines[i].trimEnd();
      if (!pl.trim()) break;
      if (pl.trimStart().startsWith('@') && parseDirectiveLine(pl.trimStart())) break;
      if (/^#{1,6}\s/.test(pl)) break;
      if (/^(```|~~~)/.test(pl)) break;
      if (/^(-{3,}|\*{3,}|_{3,})$/.test(pl.trim())) break;
      if (/^\s*[-*+]\s/.test(pl) || /^\s*\d+\.\s/.test(pl)) break;
      if (pl.trim().startsWith('>')) break;
      if (pl.includes('|') && pl.trim().startsWith('|') &&
          lines[i + 1] && /^\|[\s\-|:]+\|$/.test(lines[i + 1].trim())) break;
      paraLines.push(pl);
      i++;
    }
    if (paraLines.length) {
      var paraText = paraLines.join('\n');
      // Convert inline markdown (bold, code, links) to HTML
      var paraHtml = inlineToHtml(paraText);
      pushAnyBlock({ type: 'paragraph', html: paraHtml });
    }
  }

  // Build TOC from all heading blocks (recursive traversal)
  function collectHeadings(blks) {
    var headings = [];
    blks.forEach(function(b) {
      if (b.type === 'heading') headings.push(b);
      if (b.blocks) headings = headings.concat(collectHeadings(b.blocks));
    });
    return headings;
  }
  var allHeadings = collectHeadings(blocks);
  var toc = buildToc(allHeadings);

  // Derive doc title from front-matter or first h1
  var title = frontMatter.title || '';
  if (!title) {
    for (var hi = 0; hi < blocks.length; hi++) {
      if (blocks[hi].type === 'heading' && blocks[hi].level === 1) {
        title = blocks[hi].text; break;
      }
    }
  }

  return {
    title: title,
    doc_id: frontMatter.doc_id || slugify(title) || 'doc',
    is_walkthrough: frontMatter.is_walkthrough || false,
    collapsible: frontMatter.collapsible || false,
    template_params: templateParams,
    toc: toc,
    blocks: blocks,
    source_md: source
  };
};

/**
 * Minimal inline markdown → HTML converter.
 * Handles: **bold**, `code`, [text](url), {{VAR}} spans.
 * Italic (*text* and _text_) is intentionally NOT converted.
 * Multi-line input: line breaks become <br>.
 */
function inlineToHtml(text) {
  // escape HTML entities first
  function esc(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  var lines = text.split('\n');
  var parts = lines.map(function(line) {
    var s = esc(line);
    // inline code (before bold to protect content)
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    // {{VAR}} → template span
    s = s.replace(/\{\{([A-Za-z_][A-Za-z0-9_]*)\}\}/g, '<span class="tpl" data-var="$1">$1</span>');
    // bold
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    // links
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    return s;
  });
  return parts.join('<br>\n');
}

TesselParser.slugify = slugify;
TesselParser.parseMetaBlock = parseMetaBlock;
TesselParser.inlineToHtml = inlineToHtml;

if (typeof module !== 'undefined') module.exports = TesselParser;
