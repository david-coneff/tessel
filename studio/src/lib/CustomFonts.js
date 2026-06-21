import * as StorageEngine from './StorageEngine.js';
export function initCustomFonts(deps) {
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
      deps.applyFontFamily('"' + family + '", sans-serif');
      deps.updateInlineFormatState();
    });
    var verdanaBtn = document.getElementById('btn-font-verdana');
    if (verdanaBtn && verdanaBtn.parentNode) {
      verdanaBtn.parentNode.insertBefore(btn, verdanaBtn.nextSibling);
    } else {
      formatContent.appendChild(btn);
    }
    var re = new RegExp(family.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
    deps.fontMap.push({ key: btnId, re: re });
  }

  function renderFontList() {
    var list = document.getElementById('opts-font-list');
    if (!list) return;
    list.innerHTML = '';
    var keys = [];
    try {
      keys = StorageEngine.getKeys(FONT_PREFIX);
    } catch(e) {}
    if (!keys.length) {
      list.innerHTML = '<p style="font-size:11px;color:var(--muted);margin:0">No custom fonts imported yet.</p>';
      return;
    }
    keys.forEach(function(k) {
      try {
        var data = JSON.parse(StorageEngine.getItem(k));
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
          try { StorageEngine.removeItem(k); } catch(e) {}
          var btn = document.getElementById('btn-font-custom-' + data.family.replace(/\s+/g, '-').toLowerCase());
          if (btn) btn.parentNode.removeChild(btn);
          for (var i = deps.fontMap.length - 1; i >= 0; i--) {
            if (deps.fontMap[i].key === 'btn-font-custom-' + data.family.replace(/\s+/g, '-').toLowerCase()) {
              deps.fontMap.splice(i, 1); break;
            }
          }
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
      StorageEngine.getKeys(FONT_PREFIX).forEach(function(k) {
        var data = JSON.parse(StorageEngine.getItem(k));
        injectFontFace(data.family, data.dataUrl, data.format);
        addFontButton(data.family);
      });
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
        StorageEngine.setItem(storageKey, JSON.stringify({ family: family, dataUrl: dataUrl, format: format }));
      } catch(e) {
        deps.setStatus('Font too large to store locally');
        return;
      }
      injectFontFace(family, dataUrl, format);
      addFontButton(family);
      renderFontList();
      deps.setStatus('Font "' + family + '" imported');
    };
    rd.readAsDataURL(file);
  });

  var embedBtn = document.getElementById('opts-embed-fonts');
  function isEmbedFonts() {
    try { return StorageEngine.getItem('tvs:opts:embed-fonts') === '1'; } catch(e) { return false; }
  }
  function syncEmbedBtn() {
    var on = isEmbedFonts();
    embedBtn.classList.toggle('on', on);
  }
  embedBtn.addEventListener('click', function() {
    try { StorageEngine.setItem('tvs:opts:embed-fonts', isEmbedFonts() ? '0' : '1'); } catch(e) {}
    syncEmbedBtn();
  });
  syncEmbedBtn();

  var embedZipBtn = document.getElementById('opts-embed-fonts-zip');
  function isEmbedFontsZip() {
    try { return StorageEngine.getItem('tvs:opts:embed-fonts-zip') === '1'; } catch(e) { return false; }
  }
  function syncEmbedZipBtn() { embedZipBtn.classList.toggle('on', isEmbedFontsZip()); }
  embedZipBtn.addEventListener('click', function() {
    try { StorageEngine.setItem('tvs:opts:embed-fonts-zip', isEmbedFontsZip() ? '0' : '1'); } catch(e) {}
    syncEmbedZipBtn();
  });
  syncEmbedZipBtn();

  function bindExportModeSel(id, lsKey) {
    var sel = document.getElementById(id);
    if (!sel) return;
    try { sel.value = StorageEngine.getItem(lsKey) || 'picker'; } catch(e) {}
    sel.addEventListener('change', function() {
      try { StorageEngine.setItem(lsKey, sel.value); } catch(e) {}
    });
  }
  bindExportModeSel('opts-export-mode',       'tvs:opts:export-mode');
  bindExportModeSel('opts-export-mode-md',    'tvs:opts:export-mode-md');
  bindExportModeSel('opts-export-mode-zip',   'tvs:opts:export-mode-zip');
  bindExportModeSel('opts-export-mode-prefs', 'tvs:opts:export-mode-prefs');

  document.querySelector('[data-opts-section="fonts"]').addEventListener('click', renderFontList);
}
