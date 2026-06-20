import { uid } from './utils.js';
import { FIELD_TYPES } from './metadata.js';

export function serializeBlocks(blks) {
  return blks.map(serializeBlock).filter(function(s){ return s !== null && s !== undefined && s !== ''; }).join('\n\n');
}

export function serializeBlock(b) {
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

export function astToBlocks(ast) {
  return (ast.blocks || ast.body || []).map(nodeToBlock).filter(Boolean);
}

export function nodeToBlock(n) {
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
