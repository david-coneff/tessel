import { FloatingPane } from './FloatingPane.js';
import { floatPanel, dockPanel } from './DockSystem.js';
import { sidePanelOpenFn, sidePanelArrowSync } from './PaneFactory.js';
import { buildDateFmtSection } from './DateUtils.js';
import { trimUndoStack, updateUndoButtons, getUndoDepth, getUndoGranularity,
         getUndoTimeWindow, cancelUndoDebounce } from './undo.js';

export function initOptionsDialog(deps) {
  var dialog  = document.getElementById('options-dialog');
  var btnOpen = document.getElementById('btn-options');
  var btnClose= document.getElementById('options-dialog-close');

  var optsPane = new FloatingPane(dialog, {
    header:    document.getElementById('options-dialog-header'),
    closeBtn:  btnClose,
    posKey:    'tvs:opts:pos',
    openKey:   'tvs:opts:open',
    sizeEl:    document.getElementById('options-dialog-main'),
    sizeKey:   'tvs:opts:size',
    resizeEl:  document.getElementById('options-dialog-resize'),
    minW: 480, minH: 280,
    showClass: 'show',
  });
  optsPane.restoreSize();

  function openDialog() {
    deps.closeAllDropdowns();
    optsPane.open();
  }

  // Dock picker buttons
  document.querySelectorAll('.opts-dock-btns').forEach(function(group) {
    var panelId = group.dataset.dockPanel;
    group.querySelectorAll('.opts-dock-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        if (btn.dataset.zone === 'float') { if (typeof floatPanel === 'function') floatPanel(panelId); }
        else dockPanel(panelId, btn.dataset.zone);
      });
    });
  });

  // Restore saved dock positions
  (function() {
    var defaults = { 'format-pane': 'left', 'text-pane': 'left', 'form-pane': 'left', 'outline-panel': 'left', 'props-panel': 'right' };
    ['format-pane', 'text-pane', 'form-pane', 'outline-panel', 'props-panel'].forEach(function(id) {
      var saved;
      try { saved = localStorage.getItem('tvs:dock:' + id); } catch(e) {}
      if (saved === 'float') return; // float IIFE handles restore
      var zone = (saved === 'left' || saved === 'right' || saved === 'top' || saved === 'bottom') ? saved : defaults[id];
      if (zone !== defaults[id]) dockPanel(id, zone);
      else {
        var panel = document.getElementById(id);
        if (panel) {
          panel.classList.remove('dock-left', 'dock-right', 'dock-top', 'dock-bottom', 'pane-h');
          panel.classList.add('dock-' + zone);
          if (zone === 'top' || zone === 'bottom') {
            panel.classList.add('pane-h');
            if (panel.classList.contains('collapsed') && !panel.classList.contains('off')) {
              if (sidePanelOpenFn[id]) sidePanelOpenFn[id]();
            }
          }
          if (sidePanelArrowSync[id]) sidePanelArrowSync[id]();
        }
      }
    });
  })();

  // ── Transitions toggle ────────────────────────────────────────────────────
  var transBtn = document.getElementById('opts-transitions-toggle');
  function applyTransitions(on) {
    document.body.classList.toggle('no-transitions', !on);
    transBtn.classList.toggle('on', on);
    try { localStorage.setItem('tvs:transitions', on ? '1' : '0'); } catch(e) {}
  }
  transBtn.addEventListener('click', function() {
    applyTransitions(document.body.classList.contains('no-transitions'));
  });
  (function() {
    var saved = (function(){ try { return localStorage.getItem('tvs:transitions'); } catch(e) { return null; } })();
    if (saved === '0') applyTransitions(false);
  })();

  // ── Float panel opacity ────────────────────────────────────────────────────
  var floatOpacitySlider = document.getElementById('opts-float-opacity');
  var floatOpacityVal    = document.getElementById('opts-float-opacity-val');
  function applyFloatOpacity(val) {
    val = Math.max(0, Math.min(100, isNaN(val) ? 70 : val));
    document.documentElement.style.setProperty('--float-panel-opacity', val + '%');
    if (floatOpacityVal)    floatOpacityVal.textContent    = val + '%';
    if (floatOpacitySlider) floatOpacitySlider.value       = val;
    try { localStorage.setItem('tvs:opts:float-opacity', val); } catch(e) {}
  }
  if (floatOpacitySlider) {
    floatOpacitySlider.addEventListener('input', function() {
      applyFloatOpacity(parseInt(floatOpacitySlider.value, 10));
    });
  }
  (function() {
    var saved; try { saved = parseInt(localStorage.getItem('tvs:opts:float-opacity'), 10); } catch(e) {}
    applyFloatOpacity(isNaN(saved) || saved === null ? 70 : saved);
  })();

  var floatBlurSlider = document.getElementById('opts-float-blur');
  var floatBlurVal    = document.getElementById('opts-float-blur-val');
  function applyFloatBlur(val) {
    val = Math.max(0, Math.min(20, val || 0));
    document.documentElement.style.setProperty('--float-panel-blur', val + 'px');
    if (floatBlurVal)    floatBlurVal.textContent    = val + 'px';
    if (floatBlurSlider) floatBlurSlider.value       = val;
    try { localStorage.setItem('tvs:opts:float-blur', val); } catch(e) {}
  }
  if (floatBlurSlider) {
    floatBlurSlider.addEventListener('input', function() {
      applyFloatBlur(parseInt(floatBlurSlider.value, 10));
    });
  }
  (function() {
    var saved; try { saved = parseInt(localStorage.getItem('tvs:opts:float-blur'), 10); } catch(e) {}
    applyFloatBlur(isNaN(saved) ? 0 : saved);
  })();

  // Left nav section switching
  var navBtns = document.querySelectorAll('#opts-nav .opts-nav-btn');
  navBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      navBtns.forEach(function(b) { b.classList.remove('active'); });
      document.querySelectorAll('#opts-content .opts-section').forEach(function(s) { s.classList.remove('active'); });
      btn.classList.add('active');
      var sec = document.getElementById('opts-section-' + btn.dataset.optsSection);
      if (sec) sec.classList.add('active');
      try { localStorage.setItem('tvs:opts:section', btn.dataset.optsSection); } catch(e) {}
      if (btn.dataset.optsSection === 'menu-items' && !dialog._mibBuilt) {
        buildMenuItemsBrowser();
        dialog._mibBuilt = true;
      }
      if (btn.dataset.optsSection === 'date-formats' && !dialog._dfBuilt) {
        buildDateFmtSection();
        dialog._dfBuilt = true;
      }
    });
  });

  function collToggle(btn, body, lsKey) {
    var saved; try { saved = localStorage.getItem(lsKey); } catch(e) {}
    var open = saved === '1';
    if (open) { btn.classList.add('open'); body.classList.add('open'); }
    btn.addEventListener('click', function() {
      var nowOpen = body.classList.toggle('open');
      btn.classList.toggle('open', nowOpen);
      try { localStorage.setItem(lsKey, nowOpen ? '1' : '0'); } catch(e) {}
    });
  }

  // ── 3-column Menu Items browser ──────────────────────────────────────────
  var MIB_PANES = [
    { label: 'Text Pane',   key: 'text',   items: deps.insertMenuItems },
    { label: 'Format Pane', key: 'format', items: deps.formatPaneItems },
  ];

  function mibGetGroups(items) {
    var groups = [], cur = null;
    items.forEach(function(item) {
      if (item.group) { cur = { label: item.group, items: [] }; groups.push(cur); }
      else if (cur) cur.items.push(item);
    });
    return groups;
  }

  function buildMenuItemsBrowser() {
    var panesCol  = document.getElementById('mib-col-panes');
    var groupsCol = document.getElementById('mib-col-groups');
    var itemsCol  = document.getElementById('mib-col-items');
    if (!panesCol) return;

    function renderAllItems(pane) {
      itemsCol.innerHTML = '';
      var hidden  = deps.getHiddenItems(pane.key);
      var groups  = mibGetGroups(pane.items);
      var scrollTargets = {};
      var uidBase = pane.key + '-' + Date.now();
      var uidIdx  = 0;

      if (!groups.length) {
        itemsCol.innerHTML = '<div class="mib-empty">No items in this pane.</div>';
        return scrollTargets;
      }

      groups.forEach(function(group) {
        var divider = document.createElement('div');
        divider.className = 'mib-group-divider';
        divider.textContent = group.label;
        itemsCol.appendChild(divider);

        group.items.forEach(function(item) {
          var id  = 'mib-cb-' + uidBase + '-' + (uidIdx++);
          var row = document.createElement('div');
          row.className = 'mib-item-row';
          var cb  = document.createElement('input');
          cb.type = 'checkbox'; cb.id = id;
          cb.checked = !hidden.has(item.label);
          cb.addEventListener('change', function() { deps.setItemHidden(pane.key, item.label, !cb.checked); });
          var lbl = document.createElement('label');
          lbl.htmlFor = id; lbl.textContent = item.label;
          row.appendChild(cb); row.appendChild(lbl);
          itemsCol.appendChild(row);
        });
      });

      var dividerEls = itemsCol.querySelectorAll('.mib-group-divider');
      dividerEls.forEach(function(el, i) {
        scrollTargets[groups[i].label] = el.offsetTop;
      });

      return scrollTargets;
    }

    function renderGroups(paneIdx) {
      var pane    = MIB_PANES[paneIdx];
      var groups  = mibGetGroups(pane.items);
      groupsCol.innerHTML = '';
      var scrollTargets = renderAllItems(pane);

      groups.forEach(function(group, gi) {
        var btn = document.createElement('button');
        btn.className = 'mib-btn' + (gi === 0 ? ' active' : '');
        btn.textContent = group.label;
        btn.title = group.label;
        btn.addEventListener('click', function() {
          groupsCol.querySelectorAll('.mib-btn').forEach(function(b) { b.classList.remove('active'); });
          btn.classList.add('active');
          var target = scrollTargets[group.label];
          if (target !== undefined) itemsCol.scrollTop = target;
        });
        groupsCol.appendChild(btn);
      });
    }

    MIB_PANES.forEach(function(pane, pi) {
      var btn = document.createElement('button');
      btn.className = 'mib-btn' + (pi === 0 ? ' active' : '');
      btn.textContent = pane.label;
      btn.title = pane.label;
      btn.addEventListener('click', function() {
        panesCol.querySelectorAll('.mib-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        renderGroups(pi);
      });
      panesCol.appendChild(btn);
    });

    renderGroups(0);
  }

  btnOpen.addEventListener('click', function(e) { e.stopPropagation(); openDialog(); });

  // ── Editing section ──────────────────────────────────────────────────────────
  var autoSaveTimer = null;

  function getAutoSaveFreq() {
    try { var v = parseInt(localStorage.getItem('tvs:opts:autosave-freq'), 10); if (!isNaN(v)) return v; } catch(e) {}
    return 60;
  }

  function restartAutoSave() {
    if (autoSaveTimer) { clearInterval(autoSaveTimer); autoSaveTimer = null; }
    var freq = getAutoSaveFreq();
    if (freq > 0) { autoSaveTimer = setInterval(function() { if (deps.getUnsaved()) deps.saveDraft(); }, freq * 1000); }
  }

  var freqSel      = document.getElementById('opts-autosave-freq');
  var depthNum     = document.getElementById('opts-undo-depth-num');
  var depthPreset  = document.getElementById('opts-undo-depth-preset');
  var depthDec     = document.getElementById('opts-undo-depth-dec');
  var depthInc     = document.getElementById('opts-undo-depth-inc');
  var persistBtn   = document.getElementById('opts-persist-undo');
  var blockFmtBtn  = document.getElementById('opts-block-fmt');

  function applyUndoDepth(depth) {
    depth = Math.max(1, Math.min(10000, depth));
    try { localStorage.setItem('tvs:opts:undo-depth', depth); } catch(e) {}
    trimUndoStack(depth);
    updateUndoButtons();
  }

  (function() {
    var freq = getAutoSaveFreq();
    for (var i = 0; i < freqSel.options.length; i++) {
      if (parseInt(freqSel.options[i].value, 10) === freq) { freqSel.selectedIndex = i; break; }
    }
    depthNum.value = getUndoDepth();
    var persist = deps.isPersistUndo();
    persistBtn.classList.toggle('on', persist);
    blockFmtBtn.classList.toggle('on', deps.isBlockLevelFormatting());
  })();

  freqSel.addEventListener('change', function() {
    try { localStorage.setItem('tvs:opts:autosave-freq', freqSel.value); } catch(e) {}
    restartAutoSave();
  });

  if (depthDec) depthDec.addEventListener('click', function() {
    var v = Math.max(1, (parseInt(depthNum.value, 10) || 100) - 10);
    depthNum.value = v; depthPreset.value = ''; applyUndoDepth(v);
  });
  if (depthInc) depthInc.addEventListener('click', function() {
    var v = Math.min(10000, (parseInt(depthNum.value, 10) || 100) + 10);
    depthNum.value = v; depthPreset.value = ''; applyUndoDepth(v);
  });

  depthNum.addEventListener('change', function() {
    var v = parseInt(depthNum.value, 10);
    if (isNaN(v) || v < 1) v = 1;
    if (v > 10000) v = 10000;
    depthNum.value = v;
    depthPreset.value = '';
    applyUndoDepth(v);
  });
  depthNum.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') depthNum.blur();
  });

  depthPreset.addEventListener('change', function() {
    if (!depthPreset.value) return;
    var v = parseInt(depthPreset.value, 10);
    depthNum.value = v;
    depthPreset.value = '';
    applyUndoDepth(v);
  });

  persistBtn.addEventListener('click', function() {
    var nowOn = !persistBtn.classList.contains('on');
    persistBtn.classList.toggle('on', nowOn);
    try { localStorage.setItem('tvs:opts:persist-undo', nowOn ? '1' : '0'); } catch(e) {}
  });

  var granPill    = document.getElementById('opts-undo-granularity-pill');
  var granSlider  = document.getElementById('opts-gran-slider');
  var granRadios  = granPill ? granPill.querySelectorAll('input[type="radio"]') : [];
  var windowNum   = document.getElementById('opts-undo-time-window-num');
  var windowDec   = document.getElementById('opts-undo-window-dec');
  var windowInc   = document.getElementById('opts-undo-window-inc');
  var windowRow   = document.getElementById('opts-undo-window-row');

  function getGranPillValue() {
    for (var i = 0; i < granRadios.length; i++) {
      if (granRadios[i].checked) return granRadios[i].value;
    }
    return 'action';
  }
  function syncWindowRowActive() {}
  function syncGranSlider() {
    for (var i = 0; i < granRadios.length; i++) {
      if (granRadios[i].checked) {
        var lbl = granPill.querySelectorAll('label')[i];
        granSlider.style.left  = lbl.offsetLeft + 'px';
        granSlider.style.width = lbl.offsetWidth + 'px';
        break;
      }
    }
  }
  (function() {
    var cur = getUndoGranularity();
    for (var i = 0; i < granRadios.length; i++) {
      granRadios[i].checked = (granRadios[i].value === cur);
    }
    var tw = getUndoTimeWindow();
    if (windowNum) windowNum.value = tw;
    syncWindowRowActive();
    setTimeout(syncGranSlider, 0);
  })();
  for (var _gi = 0; _gi < granRadios.length; _gi++) {
    granRadios[_gi].addEventListener('change', function() {
      try { localStorage.setItem('tvs:opts:undo-granularity', getGranPillValue()); } catch(e) {}
      cancelUndoDebounce();
      syncWindowRowActive();
      syncGranSlider();
    });
  }

  document.addEventListener('click', function(e) {
    var pill = e.target.closest ? e.target.closest('.opts-pill-group') : null;
    if (!pill) return;
    if (e.target.closest('label')) return;
    if (e.target.tagName === 'INPUT') return;
    var radios = pill.querySelectorAll('input[type="radio"]');
    if (!radios.length) return;
    var inactive = null;
    for (var _pi = 0; _pi < radios.length; _pi++) {
      if (!radios[_pi].checked) { inactive = radios[_pi]; break; }
    }
    if (inactive) {
      inactive.checked = true;
      inactive.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  var windowPreset = document.getElementById('opts-undo-window-preset');
  function applyTimeWindow(ms) {
    ms = Math.max(100, Math.min(60000, ms));
    if (windowNum) windowNum.value = ms;
    if (windowPreset) windowPreset.value = '';
    try { localStorage.setItem('tvs:opts:undo-time-window', ms); } catch(e) {}
  }
  if (windowPreset) windowPreset.addEventListener('change', function() {
    var v = parseInt(windowPreset.value, 10);
    if (!isNaN(v) && v > 0) { windowNum.value = v; applyTimeWindow(v); }
    windowPreset.value = '';
  });
  if (windowNum) windowNum.addEventListener('change', function() {
    var v = parseInt(windowNum.value, 10);
    if (isNaN(v) || v < 100) v = 100;
    if (v > 60000) v = 60000;
    applyTimeWindow(v);
  });
  if (windowDec) windowDec.addEventListener('click', function() {
    var v = parseInt(windowNum.value, 10) || 1000;
    applyTimeWindow(v <= 500 ? Math.max(100, v - 100) : v <= 5000 ? v - 500 : v - 1000);
  });
  if (windowInc) windowInc.addEventListener('click', function() {
    var v = parseInt(windowNum.value, 10) || 1000;
    applyTimeWindow(v < 500 ? v + 100 : v < 5000 ? v + 500 : Math.min(60000, v + 1000));
  });

  blockFmtBtn.addEventListener('click', function() {
    var nowOn = !blockFmtBtn.classList.contains('on');
    blockFmtBtn.classList.toggle('on', nowOn);
    try { localStorage.setItem('tvs:opts:block-fmt', nowOn ? '1' : '0'); } catch(e) {}
  });

  restartAutoSave();

  // ── Preferences import / export ──────────────────────────────────────────────
  var PREFS_PREFIX = 'tvs:';

  function collectPrefs() {
    var prefs = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(PREFS_PREFIX) === 0) prefs[k] = localStorage.getItem(k);
      }
    } catch(e) {}
    return prefs;
  }

  document.getElementById('opts-export-prefs').addEventListener('click', function() {
    var prefs = collectPrefs();
    deps.saveFile('tessel-preferences.json', JSON.stringify(prefs, null, 2), 'application/json', 'tvs:opts:export-mode-prefs');
  });

  var importFileInput = document.getElementById('opts-import-prefs-file');
  var importStatus    = document.getElementById('opts-import-status');

  document.getElementById('opts-import-prefs').addEventListener('click', function() {
    importFileInput.value = ''; importStatus.textContent = ''; importFileInput.click();
  });

  importFileInput.addEventListener('change', function() {
    var file = importFileInput.files[0];
    if (!file) return;
    var rd = new FileReader();
    rd.onload = function(e) {
      try {
        var prefs = JSON.parse(e.target.result);
        if (typeof prefs !== 'object' || Array.isArray(prefs)) throw new Error('Invalid format');
        var count = 0;
        Object.keys(prefs).forEach(function(k) {
          if (k.indexOf(PREFS_PREFIX) === 0) {
            if (k === 'tvs:draft') return;
            try { localStorage.setItem(k, prefs[k]); count++; } catch(ex) {}
          }
        });
        importStatus.style.color = 'var(--accent)';
        importStatus.textContent = count + ' preference' + (count !== 1 ? 's' : '') + ' imported. Reload the page to apply all changes.';
        deps.setStatus('Preferences imported');
      } catch(ex) {
        importStatus.style.color = 'var(--red)';
        importStatus.textContent = 'Error: ' + ex.message;
      }
    };
    rd.readAsText(file);
  });

  // Restore active section and open state
  (function() {
    var savedSection; try { savedSection = localStorage.getItem('tvs:opts:section'); } catch(e) {}
    if (savedSection) {
      var targetBtn = document.querySelector('#opts-nav .opts-nav-btn[data-opts-section="' + savedSection + '"]');
      if (targetBtn) {
        navBtns.forEach(function(b) { b.classList.remove('active'); });
        document.querySelectorAll('#opts-content .opts-section').forEach(function(s) { s.classList.remove('active'); });
        targetBtn.classList.add('active');
        var sec = document.getElementById('opts-section-' + savedSection);
        if (sec) sec.classList.add('active');
        if (savedSection === 'menu-items' && !dialog._mibBuilt) { buildMenuItemsBrowser(); dialog._mibBuilt = true; }
      }
    }
    var wasOpen; try { wasOpen = localStorage.getItem('tvs:opts:open'); } catch(e) {}
    if (wasOpen === '1') openDialog();
  })();
}
