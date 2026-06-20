import { slugify } from './utils.js';
import { serializeBlocks, serializeBlock } from './blocks.js';

var _deps = {
  getBlocks: null, setBlocks: null,
  getFilename: null, setFilename: null,
  setSelectedBlockId: null, setUnsaved: null,
  setStatus: null, saveFile: null,
  renderCanvas: null, renderProps: null, saveDraft: null, getCompiledHtml: null,
};

export function initExport(deps) {
  _deps = deps;
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

  function readAll(zipBytes) {
    var buf   = zipBytes instanceof Uint8Array ? zipBytes : new Uint8Array(zipBytes);
    var list  = entries(buf);
    var map   = {};
    return list.reduce(function(p, e) {
      return p.then(function() {
        if (e.name.slice(-1) === '/') return;
        return decompress(e).then(function(data) { map[e.name] = data; });
      });
    }, Promise.resolve()).then(function() { return map; });
  }

  return { readAll: readAll };
})();

// ── openZip — restore editor state from a .zip md package ─────────────────────
export function openZip(file) {
  var _filename = _deps.getFilename();
  _deps.setFilename(file.name.replace(/\.zip$/i, ''));
  try { localStorage.setItem('tvs:filename', file.name.replace(/\.zip$/i, '')); } catch(e) {}
  var rd = new FileReader();
  rd.onload = function(ev) {
    MiniZipReader.readAll(ev.target.result).then(function(fileMap) {
      var mdEntry = null;
      Object.keys(fileMap).forEach(function(name) {
        if (/\.md$/i.test(name) && (!mdEntry || name.split('/').length < mdEntry.split('/').length))
          mdEntry = name;
      });
      if (!mdEntry) { _deps.setStatus('No .md file found in ZIP'); return; }

      var mdText = new TextDecoder('utf-8').decode(fileMap[mdEntry]);
      var parsed = TesselCompiler.parseMd(mdText);

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
              var data = fileMap[path];
              if (!data) {
                var base = path.split('/').pop();
                var key = Object.keys(fileMap).find(function(k) { return k.split('/').pop() === base; });
                if (key) data = fileMap[key];
              }
              if (!data) return f;
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
      _deps.setBlocks(parsed);
      _deps.setSelectedBlockId(null);
      _deps.renderCanvas(); _deps.renderProps();
      _deps.setUnsaved(false);
      _deps.saveDraft();
      _deps.setStatus('Opened ' + file.name);
    }).catch(function(ex) { _deps.setStatus('ZIP error: ' + ex.message); });
  };
  rd.readAsArrayBuffer(file);
}

// ── exportZip — save .zip package; respects tvs:opts:export-mode-zip ─────────
export function exportZip() {
  try {
    var blocks = _deps.getBlocks();
    var _filename = _deps.getFilename();
    var attachments = collectAttachments(blocks);
    var assetDir = _filename;
    var md = serializeBlocksForExport(blocks, assetDir);
    var zipFiles = [{ name: _filename + '.md', data: md }];
    attachments.forEach(function(a) { zipFiles.push({ name: assetDir + '/' + a.name, data: a.data }); });

    try {
      if (localStorage.getItem('tvs:opts:embed-fonts-zip') === '1') {
        var prefix = 'tvs:font:';
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && k.indexOf(prefix) === 0) {
            var fd = JSON.parse(localStorage.getItem(k));
            var bytes = MiniZip.dataUrlToBytes(fd.dataUrl);
            var ext = fd.format === 'truetype' ? 'ttf' : fd.format === 'opentype' ? 'otf' : fd.format;
            zipFiles.push({ name: 'fonts/' + fd.family + '.' + ext, data: bytes });
          }
        }
      }
    } catch(e) {}

    var zipBytes = MiniZip.create(zipFiles);
    _deps.saveFile(_filename + '.zip', zipBytes, 'application/zip', 'tvs:opts:export-mode-zip');
    _deps.setStatus('Saved ' + _filename + '.zip');
  } catch(ex) { _deps.setStatus('ZIP export error: ' + ex.message); }
}

// ── Attachment helpers ────────────────────────────────────────────────────────

export function collectAttachments(blks, list) {
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

export function serializeBlocksForExport(blks, assetDir) {
  return blks.map(function(b) { return serializeBlockForExport(b, assetDir); })
    .filter(function(s) { return s !== null && s !== undefined && s !== ''; })
    .join('\n\n');
}

// ── exportMd — save .md; when assets exist, write a sibling directory ─────────
export function exportMd() {
  var blocks = _deps.getBlocks();
  var _filename = _deps.getFilename();
  var attachments = collectAttachments(blocks);
  var fname   = _filename + '.md';
  var assetDir = _filename;
  var md = attachments.length
    ? serializeBlocksForExport(blocks, assetDir)
    : serializeBlocks(blocks);
  var mode = (function() { try { return localStorage.getItem('tvs:opts:export-mode-md') || 'picker'; } catch(e) { return 'picker'; } })();

  if (!attachments.length) {
    _deps.saveFile(fname, md, 'text/markdown', 'tvs:opts:export-mode-md');
    return;
  }

  if (mode === 'picker' && window.showDirectoryPicker) {
    window.showDirectoryPicker({ mode: 'readwrite' }).then(function(dirHandle) {
      return dirHandle.getFileHandle(fname, { create: true }).then(function(fh) {
        return fh.createWritable().then(function(w) {
          return w.write(md).then(function() { return w.close(); });
        });
      }).then(function() {
        return dirHandle.getDirectoryHandle(assetDir, { create: true });
      }).then(function(assetHandle) {
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
        _deps.setStatus('Saved ' + fname + ' + ' + attachments.length + ' asset' + (attachments.length !== 1 ? 's' : '') + ' in ' + assetDir + '/');
      });
    }).catch(function(ex) {
      if (ex.name !== 'AbortError') _deps.setStatus('Save error: ' + ex.message);
    });
  } else {
    var zipFiles = [{ name: fname, data: md }];
    attachments.forEach(function(a) { zipFiles.push({ name: assetDir + '/' + a.name, data: a.data }); });
    var zipBytes = MiniZip.create(zipFiles);
    var blob = new Blob([zipBytes], { type: 'application/zip' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href = url; a.download = _filename + '.zip';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function() { URL.revokeObjectURL(url); }, 1200);
    _deps.setStatus('Exported ' + _filename + '.zip (' + attachments.length + ' asset' + (attachments.length !== 1 ? 's' : '') + ')');
  }
}

export function exportHtml() {
  try {
    var _filename = _deps.getFilename();
    _deps.saveFile(_filename + '.html', _deps.getCompiledHtml(), 'text/html', 'tvs:opts:export-mode');
  } catch(ex) { _deps.setStatus('Export error: ' + ex.message); }
}
