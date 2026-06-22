import * as StorageEngine from './StorageEngine.js';
import { icon, makeSeparator } from '../tessel-ui/index.js';
import { undo, redo, clearUndoHistory, updateUndoButtons } from './undo.js';
import { openZip, exportZip, exportMd, exportHtml } from './ExportManager.js';
import { convertFocusedBlock, closePreview } from './InlineFormat.js';
import { closeAllDropdowns, saveDraft, showPreview, openMd, openHtml, setStatus } from './FileOps.js';
import { rootstock } from './rootstock.js';

export function initToolbarWiring(deps) {
  // ── Toolbar icon upgrade ──────────────────────────────────────────────────
  (function() {
    var undoBtn = document.getElementById('btn-undo');
    var redoBtn = document.getElementById('btn-redo');
    undoBtn.innerHTML = ''; undoBtn.className = 'tui-btn tui-btn--icon';
    redoBtn.innerHTML = ''; redoBtn.className = 'tui-btn tui-btn--icon';
    undoBtn.appendChild(icon('undo', 15));
    redoBtn.appendChild(icon('redo', 15));

    var previewBtn = document.getElementById('btn-preview');
    if (previewBtn) {
      previewBtn.innerHTML = '';
      previewBtn.className = 'tui-btn tui-btn--ghost';
      previewBtn.appendChild(icon('eye', 14));
      var lbl = document.createElement('span');
      lbl.className = 'tui-btn__label';
      lbl.textContent = 'Preview';
      previewBtn.appendChild(lbl);
    }

    var fileBtn = document.getElementById('btn-file-dd');
    if (fileBtn) {
      fileBtn.innerHTML = '';
      fileBtn.className = 'tui-btn tui-btn--ghost';
      fileBtn.appendChild(icon('file-text', 14));
      var lbl2 = document.createElement('span');
      lbl2.className = 'tui-btn__label';
      lbl2.textContent = 'File';
      fileBtn.appendChild(lbl2);
      fileBtn.appendChild(icon('chevron-down', 11));
    }

    ['badge-format','badge-text','badge-form','badge-outline','badge-props'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.classList.add('tui-btn', 'tui-btn--badge');
    });

    document.querySelectorAll('#toolbar .tb-sep').forEach(function(sep) {
      var replacement = makeSeparator('vertical');
      sep.parentNode.replaceChild(replacement, sep);
    });
  })();

  // ── Button event listeners ────────────────────────────────────────────────
  document.getElementById('btn-undo').addEventListener('click', undo);
  document.getElementById('btn-redo').addEventListener('click', redo);

  document.getElementById('btn-new').addEventListener('click', async function() {
    closeAllDropdowns();
    if (deps.getUnsaved()) {
      var discard = await rootstock.dialog.confirm('Discard unsaved changes?', {
        title: 'New document', okLabel: 'Discard', danger: true,
      });
      if (!discard) return;
    }
    deps.setBlocks([]);
    deps.setSelectedBlockId(null);
    clearUndoHistory();
    updateUndoButtons();
    deps.renderCanvas(); deps.renderProps();
    deps.setFilename('document');
    try { StorageEngine.removeItem('tvs:filename'); } catch(e) {}
    setStatus('New document');
    deps.setUnsaved(false);
    rootstock.notify.show({ body: 'New document created', level: 'success', timeoutMs: 2500 });
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

  document.querySelector('#format-pane .ctrl-pane-body').addEventListener('mousedown', function(e) {
    if (e.target.closest('.ctrl-btn')) e.preventDefault();
  });

  document.getElementById('btn-indent-more').addEventListener('click', function() {
    var id = deps.getLastFocusedTextBlockId();
    if (!id) return;
    var b = deps.getBlock(id);
    if (!b) return;
    b.indent = Math.min((b.indent || 0) + 1, 8);
    var wrap = document.querySelector('[data-block-id="' + b.id + '"] .block-inner');
    if (wrap) wrap.style.paddingLeft = (b.indent * 24) + 'px';
    deps.markUnsaved();
  });
  document.getElementById('btn-indent-less').addEventListener('click', function() {
    var id = deps.getLastFocusedTextBlockId();
    if (!id) return;
    var b = deps.getBlock(id);
    if (!b) return;
    b.indent = Math.max((b.indent || 0) - 1, 0);
    var wrap = document.querySelector('[data-block-id="' + b.id + '"] .block-inner');
    if (wrap) wrap.style.paddingLeft = b.indent ? (b.indent * 24) + 'px' : '';
    deps.markUnsaved();
  });

  document.getElementById('btn-preview').addEventListener('click', function() {
    if (document.getElementById('preview-modal').classList.contains('show')) {
      closePreview();
    } else {
      showPreview();
    }
  });
  document.getElementById('preview-close').addEventListener('click', closePreview);

  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') { e.preventDefault(); exportMd(); }
    else if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveDraft(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') { e.preventDefault(); exportHtml(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); exportHtml(); }
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') { e.preventDefault(); undo(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') { e.preventDefault(); redo(); }
    if (e.key === 'Escape') { closeAllDropdowns(); closePreview(); }
  });
}
