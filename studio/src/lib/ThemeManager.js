import * as StorageEngine from './StorageEngine.js';
var THEMES = [
  {
    id: 'dark', name: 'Dark', preset: true,
    vars: {
      '--bg': '#1a1b1e', '--surface': '#24262b', '--border': '#3a3c42', '--text': '#d4d4d4',
      '--muted': '#7a7d87', '--accent': '#5b8af0', '--surface2': '#2d2f35',
      '--canvas-bg': '#24262b', '--canvas-shadow': '0 2px 16px rgba(0,0,0,0.25)',
      '--canvas-text': '#d4d4d4', '--canvas-muted': '#5a5d6b',
      '--para-border-focus': 'rgba(255,255,255,0.08)',
      '--field-bg': '#252a42', '--field-border': '#3d5299'
    }
  },
  {
    id: 'light', name: 'Light', preset: true,
    vars: {
      '--bg': '#f0f0f2', '--surface': '#fff', '--border': '#d0d2d8', '--text': '#1a1b1e',
      '--muted': '#6b7280', '--accent': '#5b8af0', '--surface2': '#e8e9ec',
      '--canvas-bg': '#ffffff', '--canvas-shadow': '0 2px 16px rgba(0,0,0,0.10)',
      '--canvas-text': '#1a1b1e', '--canvas-muted': '#6b7280',
      '--para-border-focus': '#e0e0e0',
      '--field-bg': '#eef2ff', '--field-border': '#c7d2fe'
    }
  },
  {
    id: 'nord', name: 'Nord', preset: true,
    vars: {
      '--bg': '#2e3440', '--surface': '#3b4252', '--border': '#4c566a', '--text': '#eceff4',
      '--muted': '#7b88a1', '--accent': '#88c0d0', '--surface2': '#434c5e',
      '--canvas-bg': '#3b4252', '--canvas-shadow': '0 2px 16px rgba(0,0,0,0.3)',
      '--canvas-text': '#eceff4', '--canvas-muted': '#7b88a1',
      '--para-border-focus': 'rgba(255,255,255,0.08)',
      '--field-bg': '#3b4f6b', '--field-border': '#5e81ac'
    }
  },
  {
    id: 'solarized-dark', name: 'Solarized Dark', preset: true,
    vars: {
      '--bg': '#002b36', '--surface': '#073642', '--border': '#094652', '--text': '#839496',
      '--muted': '#586e75', '--accent': '#268bd2', '--surface2': '#073642',
      '--canvas-bg': '#073642', '--canvas-shadow': '0 2px 16px rgba(0,0,0,0.4)',
      '--canvas-text': '#839496', '--canvas-muted': '#586e75',
      '--para-border-focus': 'rgba(255,255,255,0.06)',
      '--field-bg': '#00323f', '--field-border': '#1a6a8a'
    }
  },
  {
    id: 'warm-light', name: 'Warm Light', preset: true,
    vars: {
      '--bg': '#faf8f3', '--surface': '#fffefb', '--border': '#ddd8cc', '--text': '#2c2416',
      '--muted': '#8a7d68', '--accent': '#c07c3a', '--surface2': '#f0ece3',
      '--canvas-bg': '#fffefb', '--canvas-shadow': '0 2px 16px rgba(0,0,0,0.08)',
      '--canvas-text': '#2c2416', '--canvas-muted': '#8a7d68',
      '--para-border-focus': '#e8e2d8',
      '--field-bg': '#fef3e2', '--field-border': '#e0c090'
    }
  },
  {
    id: 'high-contrast', name: 'High Contrast', preset: true,
    vars: {
      '--bg': '#000000', '--surface': '#0d0d0d', '--border': '#777777', '--text': '#ffffff',
      '--muted': '#cccccc', '--accent': '#ffff00', '--accent-text': '#000000', '--surface2': '#1a1a1a',
      '--canvas-bg': '#0d0d0d', '--canvas-shadow': '0 2px 16px rgba(0,0,0,0.8)',
      '--canvas-text': '#ffffff', '--canvas-muted': '#cccccc',
      '--para-border-focus': 'rgba(255,255,255,0.3)',
      '--field-bg': '#001a33', '--field-border': '#4499ff'
    }
  }
];

function getCustomThemes() {
  try { return JSON.parse(StorageEngine.getItem('tvs:custom-themes') || '[]'); } catch(e) { return []; }
}

function saveCustomThemes(arr) {
  StorageEngine.setItem('tvs:custom-themes', JSON.stringify(arr));
}

function getThemeOrder() {
  try { return JSON.parse(StorageEngine.getItem('tvs:theme-order') || 'null'); } catch(e) { return null; }
}
function saveThemeOrder(ids) {
  StorageEngine.setItem('tvs:theme-order', JSON.stringify(ids));
}
function getAllThemes() {
  var all = THEMES.concat(getCustomThemes());
  var order = getThemeOrder();
  if (!order) return all;
  var map = {};
  for (var i = 0; i < all.length; i++) map[all[i].id] = all[i];
  var result = [];
  for (var j = 0; j < order.length; j++) {
    if (map[order[j]]) { result.push(map[order[j]]); delete map[order[j]]; }
  }
  for (var k = 0; k < all.length; k++) { if (map[all[k].id]) result.push(all[k]); }
  return result;
}

var _draggedThemeId = null;
var _dragFromList = false;
var _dragMode = 'slot';

function getThemeById(id) {
  var all = getAllThemes();
  for (var i = 0; i < all.length; i++) { if (all[i].id === id) return all[i]; }
  return null;
}

function isLightColor(hex) {
  if (!hex || hex[0] !== '#') return false;
  var h = hex.slice(1);
  if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  var r = parseInt(h.slice(0,2),16)/255;
  var g = parseInt(h.slice(2,4),16)/255;
  var b = parseInt(h.slice(4,6),16)/255;
  var lum = 0.2126*r + 0.7152*g + 0.0722*b;
  return lum > 0.35;
}

var _themeChangeCallbacks = [];
export function onThemeChange(cb) { _themeChangeCallbacks.push(cb); }

export function applyTheme(themeId) {
  var theme = getThemeById(themeId);
  if (!theme) {
    if (themeId !== 'dark') applyTheme('dark');
    return;
  }
  var vars = theme.vars;
  var css = ':root {\n' + Object.keys(vars).map(function(k){ return '  ' + k + ': ' + vars[k] + ';'; }).join('\n') + '\n}';
  var el = document.getElementById('tvs-theme-style');
  if (!el) { el = document.createElement('style'); el.id = 'tvs-theme-style'; document.head.appendChild(el); }
  el.textContent = css;
  document.body.classList.remove('light');
  if (isLightColor(vars['--bg'])) document.body.classList.add('light');
  StorageEngine.setItem('tvs:active-theme', themeId);
  updateThemeBtn();
  _themeChangeCallbacks.forEach(function(cb) { try { cb(themeId); } catch(e) {} });
}

function updateThemeBtn() {
  var btnA = document.getElementById('theme-pill-a');
  var btnB = document.getElementById('theme-pill-b');
  if (!btnA || !btnB) return;
  var themeA = StorageEngine.getItem('tvs:theme-a') || 'dark';
  var themeB = StorageEngine.getItem('tvs:theme-b') || 'light';
  var activeId = StorageEngine.getItem('tvs:active-theme') || 'dark';

  function themeIcon(themeId) {
    if (themeId === 'dark') {
      return '<span style="font-size:13px;line-height:1;">☾</span>';
    } else if (themeId === 'light') {
      return '<svg width="13" height="13" viewBox="0 0 13 13"><circle cx="6.5" cy="6.5" r="2.8" fill="currentColor"/><g stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><line x1="6.5" y1="0.5" x2="6.5" y2="2"/><line x1="6.5" y1="11" x2="6.5" y2="12.5"/><line x1="0.5" y1="6.5" x2="2" y2="6.5"/><line x1="11" y1="6.5" x2="12.5" y2="6.5"/><line x1="2.4" y1="2.4" x2="3.4" y2="3.4"/><line x1="9.6" y1="9.6" x2="10.6" y2="10.6"/><line x1="10.6" y1="2.4" x2="9.6" y2="3.4"/><line x1="3.4" y1="9.6" x2="2.4" y2="10.6"/></g></svg>';
    } else {
      var t = getThemeById(themeId);
      var bgColor = t ? (t.vars['--bg'] || '#222') : '#222';
      var accentColor = t ? (t.vars['--accent'] || '#5b8af0') : '#5b8af0';
      return '<svg width="13" height="13" viewBox="0 0 13 13"><circle cx="6.5" cy="6.5" r="5.5" fill="'+bgColor+'"/><path d="M6.5 1A5.5 5.5 0 0 1 6.5 12z" fill="'+accentColor+'"/></svg>';
    }
  }

  var activeSlot = StorageEngine.getItem('tvs:active-slot') || 'a';
  var previewing = !!StorageEngine.getItem('tvs:previewing');
  btnA.innerHTML = themeIcon(themeA);
  btnB.innerHTML = themeIcon(themeB);
  btnA.classList.toggle('active', !previewing && activeSlot === 'a');
  btnB.classList.toggle('active', !previewing && activeSlot === 'b');
  var slider = document.getElementById('theme-pill-slider');
  if (slider) {
    if (previewing) {
      slider.style.opacity = '0';
    } else {
      var activeBtn = activeSlot === 'a' ? btnA : btnB;
      slider.style.left  = activeBtn.offsetLeft + 'px';
      slider.style.width = activeBtn.offsetWidth + 'px';
      slider.style.opacity = '1';
    }
  }
}

function restoreSlotCard(slot) {
  if (!slot) return;
  var slotName = slot.getAttribute('data-slot');
  var themeId = StorageEngine.getItem('tvs:theme-' + slotName) || (slotName === 'a' ? 'dark' : 'light');
  var t = getThemeById(themeId);
  var nameEl = document.getElementById('opts-slot-' + slotName + '-name');
  var swEl = document.getElementById('opts-slot-' + slotName + '-swatches');
  if (nameEl) nameEl.textContent = t ? t.name : '—';
  if (swEl) swEl.innerHTML = t
    ? '<div class="theme-swatch" style="background:'+t.vars['--bg']+';width:14px;height:14px;" title="bg"></div>'
      + '<div class="theme-swatch" style="background:'+t.vars['--accent']+';width:14px;height:14px;" title="accent"></div>'
    : '';
}

function renderThemeSlots() {
  var themeA = StorageEngine.getItem('tvs:theme-a') || 'dark';
  var themeB = StorageEngine.getItem('tvs:theme-b') || 'light';
  var activeSlot = StorageEngine.getItem('tvs:active-slot') || 'a';
  var previewing = !!StorageEngine.getItem('tvs:previewing');

  function fillSlot(slotId, nameId, swatchesId, themeId, slotName) {
    var slot = document.getElementById(slotId);
    var nameEl = document.getElementById(nameId);
    var swatchesEl = document.getElementById(swatchesId);
    if (!slot || !nameEl || !swatchesEl) return;
    var t = getThemeById(themeId);
    nameEl.textContent = t ? t.name : '—';
    swatchesEl.innerHTML = t
      ? '<div class="theme-swatch" style="background:'+t.vars['--bg']+';width:14px;height:14px;" title="bg"></div>'
        + '<div class="theme-swatch" style="background:'+t.vars['--accent']+';width:14px;height:14px;" title="accent"></div>'
      : '';
    var previewingTheme = StorageEngine.getItem('tvs:previewing-theme');
    slot.classList.toggle('active-slot',
      (!previewing && activeSlot === slotName) ||
      (previewing && !!previewingTheme && previewingTheme === themeId)
    );
  }

  fillSlot('opts-slot-a', 'opts-slot-a-name', 'opts-slot-a-swatches', themeA, 'a');
  fillSlot('opts-slot-b', 'opts-slot-b-name', 'opts-slot-b-swatches', themeB, 'b');

  var slotA = document.getElementById('opts-slot-a');
  var slotB = document.getElementById('opts-slot-b');

  function setupSlotDrag(slot, themeVal) {
    slot.draggable = true;
    slot.ondragstart = function(e) {
      _dragFromList = false;
      _draggedThemeId = themeVal;
      e.dataTransfer.setData('text/plain', themeVal);
      setTimeout(function() { slot.classList.add('dragging-source'); }, 0);
    };
    slot.ondragend = function() {
      slot.style.transition = 'none';
      slot.classList.remove('dragging-source');
      void slot.offsetWidth;
      slot.style.transition = '';
      resetSlotDragClasses(true);
    };
  }
  if (slotA) setupSlotDrag(slotA, themeA);
  if (slotB) setupSlotDrag(slotB, themeB);

  function resetSlotDragClasses(instant) {
    [slotA, slotB].forEach(function(s) {
      if (!s) return;
      s.classList.remove('drag-over', 'drop-target', 'drag-over-list');
      var sc = s.querySelector('.opts-theme-slot-card');
      if (sc) sc.removeAttribute('data-preview-id');
      restoreSlotCard(s);
      var card = s.querySelector('.opts-theme-slot-card');
      if (card) {
        if (instant) card.style.transition = 'none';
        card.style.transform = '';
        card.style.opacity = '';
        if (instant) { void card.offsetWidth; card.style.transition = ''; }
      }
    });
  }

  function wireSlotClick(slot, getThemeId) {
    if (!slot) return;
    slot.onclick = function() {
      StorageEngine.removeItem('tvs:previewing');
      StorageEngine.removeItem('tvs:previewing-theme');
      StorageEngine.setItem('tvs:active-slot', slot.getAttribute('data-slot'));
      applyTheme(getThemeId());
      renderThemeSlots();
      renderThemeList();
      updateThemeBtn();
    };
    slot.ondragover = function(e) {
      if (_dragMode === 'reorder') return;
      e.preventDefault();
      var targetName = slot.getAttribute('data-slot');
      var curA = StorageEngine.getItem('tvs:theme-a') || 'dark';
      var curB = StorageEngine.getItem('tvs:theme-b') || 'light';
      var isSwap = !_dragFromList && (
        (targetName === 'a' && _draggedThemeId === curB) ||
        (targetName === 'b' && _draggedThemeId === curA)
      );
      if (_dragFromList) {
        if (!slot.classList.contains('drag-over-list')) {
          slot.classList.remove('drag-over', 'drop-target', 'drag-over-list');
          slot.classList.add('drag-over-list');
        }
        var card = slot.querySelector('.opts-theme-slot-card');
        if (card && card.getAttribute('data-preview-id') !== _draggedThemeId) {
          card.setAttribute('data-preview-id', _draggedThemeId);
          var pt = getThemeById(_draggedThemeId);
          var nameEl = document.getElementById('opts-slot-' + targetName + '-name');
          var swEl = document.getElementById('opts-slot-' + targetName + '-swatches');
          if (nameEl && pt) nameEl.textContent = pt.name;
          if (swEl && pt) swEl.innerHTML =
            '<div class="theme-swatch" style="background:'+pt.vars['--bg']+';width:14px;height:14px;" title="bg"></div>'
            + '<div class="theme-swatch" style="background:'+pt.vars['--accent']+';width:14px;height:14px;" title="accent"></div>';
        }
        return;
      }
      var wantClass = isSwap ? 'drop-target' : 'drag-over';
      if (!slot.classList.contains(wantClass)) {
        slot.classList.remove('drag-over', 'drop-target');
        slot.classList.add(wantClass);
        var card = slot.querySelector('.opts-theme-slot-card');
        if (card) {
          card.style.transform = '';
          if (isSwap) {
            var pt = getThemeById(_draggedThemeId);
            var nameEl2 = document.getElementById('opts-slot-' + targetName + '-name');
            var swEl2 = document.getElementById('opts-slot-' + targetName + '-swatches');
            if (nameEl2 && pt) nameEl2.textContent = pt.name;
            if (swEl2 && pt) swEl2.innerHTML =
              '<div class="theme-swatch" style="background:'+pt.vars['--bg']+';width:14px;height:14px;" title="bg"></div>'
              + '<div class="theme-swatch" style="background:'+pt.vars['--accent']+';width:14px;height:14px;" title="accent"></div>';
            card.setAttribute('data-preview-id', _draggedThemeId);
            card.style.opacity = '0.35';
          } else {
            card.style.opacity = '';
          }
        }
      }
    };
    slot.ondragleave = function(e) {
      var rel = e.relatedTarget;
      if (rel && (rel === slot || slot.contains(rel))) return;
      slot.classList.remove('drag-over', 'drop-target', 'drag-over-list');
      var card = slot.querySelector('.opts-theme-slot-card');
      if (card) {
        card.style.transform = '';
        card.style.opacity = '';
        card.removeAttribute('data-preview-id');
      }
      restoreSlotCard(slot);
    };
    slot.ondrop = function(e) {
      e.preventDefault();
      slot.classList.remove('drag-over-list');
      var dropCard = slot.querySelector('.opts-theme-slot-card');
      if (dropCard) dropCard.removeAttribute('data-preview-id');
      resetSlotDragClasses(true);
      var droppedId = e.dataTransfer.getData('text/plain');
      if (!droppedId) return;
      var targetName = slot.getAttribute('data-slot');
      var curA = StorageEngine.getItem('tvs:theme-a') || 'dark';
      var curB = StorageEngine.getItem('tvs:theme-b') || 'light';
      if (targetName === 'a' && droppedId === curB) {
        StorageEngine.setItem('tvs:theme-a', curB);
        StorageEngine.setItem('tvs:theme-b', curA);
      } else if (targetName === 'b' && droppedId === curA) {
        StorageEngine.setItem('tvs:theme-b', curA);
        StorageEngine.setItem('tvs:theme-a', curB);
      } else {
        StorageEngine.setItem(targetName === 'a' ? 'tvs:theme-a' : 'tvs:theme-b', droppedId);
      }
      StorageEngine.removeItem('tvs:previewing');
      StorageEngine.removeItem('tvs:previewing-theme');
      var activeSlot = StorageEngine.getItem('tvs:active-slot') || 'a';
      var activeTheme = StorageEngine.getItem('tvs:theme-' + activeSlot) || 'dark';
      applyTheme(activeTheme);
      renderThemeSlots();
      renderThemeList();
      updateThemeBtn();
      var sA = document.getElementById('opts-slot-a');
      var sB = document.getElementById('opts-slot-b');
      var otherSlot = (targetName === 'a') ? sB : sA;
      if (otherSlot) otherSlot.classList.add('no-hover');
      function clearNoHover() {
        if (otherSlot) otherSlot.classList.remove('no-hover');
        document.removeEventListener('mousemove', clearNoHover);
      }
      document.addEventListener('mousemove', clearNoHover);
    };
  }

  wireSlotClick(slotA, function() { return StorageEngine.getItem('tvs:theme-a') || 'dark'; });
  wireSlotClick(slotB, function() { return StorageEngine.getItem('tvs:theme-b') || 'light'; });
}

function renderThemeList() {
  var container = document.getElementById('opts-themes-list');
  if (!container) return;
  var activeId = StorageEngine.getItem('tvs:active-theme') || 'dark';
  var themeA = StorageEngine.getItem('tvs:theme-a') || 'dark';
  var themeB = StorageEngine.getItem('tvs:theme-b') || 'light';
  var listPreviewing = !!StorageEngine.getItem('tvs:previewing');
  var all = getAllThemes();
  var html = '';
  for (var i = 0; i < all.length; i++) {
    var t = all[i];
    var badges = '';
    if (t.id === themeA) badges += '<span class="theme-badge">A</span>';
    if (t.id === themeB) badges += '<span class="theme-badge">B</span>';
    var isActive = (listPreviewing && t.id === activeId) ? ' style="outline:2px solid var(--accent);"' : '';
    var actions = '<button class="theme-card-btn" data-theme-preview="'+t.id+'">Preview</button>';
    actions += '<button class="theme-card-btn" data-theme-dup="'+t.id+'">Duplicate</button>';
    if (!t.preset) {
      actions += '<button class="theme-card-btn" data-theme-edit="'+t.id+'">Edit</button>';
      actions += '<button class="theme-card-btn danger" data-theme-del="'+t.id+'">Delete</button>';
    }
    html += '<div class="theme-card" draggable="true" data-theme-id="'+t.id+'"'+isActive+'>';
    html += '<span class="theme-drag-handle" draggable="true" data-handle-for="'+t.id+'">⠿</span>';
    html += '<div class="theme-card-swatches">';
    html += '<div class="theme-swatch" style="background:'+t.vars['--bg']+';" title="bg"></div>';
    html += '<div class="theme-swatch" style="background:'+t.vars['--accent']+';" title="accent"></div>';
    html += '</div>';
    html += '<div class="theme-card-name">'+t.name+'</div>';
    html += '<div class="theme-card-badges">'+badges+'</div>';
    html += '<div class="theme-card-actions">'+actions+'</div>';
    html += '</div>';
  }
  container.innerHTML = html;
  container.querySelectorAll('[data-theme-preview]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var previewId = this.getAttribute('data-theme-preview');
      StorageEngine.setItem('tvs:previewing', '1');
      StorageEngine.setItem('tvs:previewing-theme', previewId);
      applyTheme(previewId);
      renderThemeList(); renderThemeSlots(); updateThemeBtn();
    });
  });
  container.querySelectorAll('.theme-card[data-theme-id]').forEach(function(card) {
    card.addEventListener('dragstart', function(e) {
      var tid = card.getAttribute('data-theme-id');
      _draggedThemeId = tid;
      _dragFromList = true;
      e.dataTransfer.setData('text/plain', tid);
    });
    card.addEventListener('dragend', function() {
      _dragFromList = false;
      _dragMode = 'slot';
    });
  });

  var _placeholder = null;

  function removePlaceholder() {
    if (_placeholder && _placeholder.parentNode) _placeholder.parentNode.removeChild(_placeholder);
    _placeholder = null;
  }

  function getInsertionPoint(e) {
    var cards = container.querySelectorAll('.theme-card[data-theme-id]:not(.reorder-dragging)');
    if (!cards.length) return { ref: null, before: false };
    var offsetParent = cards[0].offsetParent;
    var parentTop = offsetParent ? offsetParent.getBoundingClientRect().top : 0;
    var mouseY = e.clientY - parentTop;
    for (var i = 0; i < cards.length; i++) {
      var top = cards[i].offsetTop, h = cards[i].offsetHeight;
      if (mouseY < top + h / 2) return { ref: cards[i], before: true };
      if (mouseY < top + h)     return { ref: cards[i], before: false };
    }
    return { ref: null, before: false };
  }

  container.querySelectorAll('.theme-drag-handle[data-handle-for]').forEach(function(handle) {
    handle.addEventListener('mousedown', function(e) {
      e.stopPropagation();
    });
    handle.addEventListener('dragstart', function(e) {
      var tid = handle.getAttribute('data-handle-for');
      _dragMode = 'reorder';
      _dragFromList = false;
      _draggedThemeId = tid;
      e.dataTransfer.setData('text/plain', tid);
      e.dataTransfer.effectAllowed = 'move';
      var sourceCard = container.querySelector('.theme-card[data-theme-id="'+tid+'"]');
      _placeholder = document.createElement('div');
      _placeholder.className = 'theme-list-placeholder';
      if (sourceCard) {
        var clone = sourceCard.cloneNode(true);
        clone.removeAttribute('draggable');
        _placeholder.appendChild(clone);
      }
      setTimeout(function() {
        if (sourceCard) sourceCard.classList.add('reorder-dragging');
        if (sourceCard && sourceCard.parentNode) {
          sourceCard.parentNode.insertBefore(_placeholder, sourceCard.nextSibling);
        }
      }, 0);
    });
    handle.addEventListener('dragend', function() {
      _dragMode = 'slot';
      removePlaceholder();
      container.querySelectorAll('.theme-card').forEach(function(c) {
        c.style.transition = '';
        c.style.transform = '';
        c.classList.remove('reorder-dragging');
      });
    });
  });

  container.ondragover = function(e) {
    if (_dragMode !== 'reorder') return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!_placeholder) return;
    var ins = getInsertionPoint(e);
    var newNext = ins.ref ? (ins.before ? ins.ref : ins.ref.nextSibling) : null;
    if (_placeholder.nextSibling === newNext) return;
    var cards = Array.prototype.slice.call(
      container.querySelectorAll('.theme-card[data-theme-id]:not(.reorder-dragging)')
    );
    var beforeTops = {};
    cards.forEach(function(c) { beforeTops[c.getAttribute('data-theme-id')] = c.offsetTop; });
    if (ins.ref) {
      container.insertBefore(_placeholder, ins.before ? ins.ref : ins.ref.nextSibling);
    } else {
      container.appendChild(_placeholder);
    }
    cards.forEach(function(c) {
      var id = c.getAttribute('data-theme-id');
      var delta = beforeTops[id] - c.offsetTop;
      if (Math.abs(delta) < 1) return;
      c.style.transition = 'none';
      c.style.transform = 'translateY(' + delta + 'px)';
      void c.offsetWidth;
      c.style.transition = 'transform 0.14s ease';
      c.style.transform = '';
    });
  };
  container.ondragleave = function(e) {
    if (_dragMode !== 'reorder') return;
    var rel = e.relatedTarget;
    if (rel && container.contains(rel)) return;
    removePlaceholder();
  };
  container.ondrop = function(e) {
    if (_dragMode !== 'reorder') return;
    e.preventDefault();
    var draggedId = e.dataTransfer.getData('text/plain');
    var insertBeforeEl = _placeholder ? _placeholder.nextElementSibling : null;
    var targetId = insertBeforeEl ? insertBeforeEl.getAttribute('data-theme-id') : null;
    var insertBefore = !!targetId;
    if (!insertBefore && _placeholder && _placeholder.previousElementSibling) {
      targetId = _placeholder.previousElementSibling.getAttribute('data-theme-id');
    }
    removePlaceholder();
    container.querySelectorAll('.theme-card').forEach(function(c) {
      c.style.transition = '';
      c.style.transform = '';
      c.classList.remove('reorder-dragging');
    });
    if (!draggedId || !targetId || draggedId === targetId) { _dragMode = 'slot'; return; }
    var all = getAllThemes();
    var ids = all.map(function(t) { return t.id; });
    ids.splice(ids.indexOf(draggedId), 1);
    var tIdx = ids.indexOf(targetId);
    ids.splice(insertBefore ? tIdx : tIdx + 1, 0, draggedId);
    saveThemeOrder(ids);
    _dragMode = 'slot';
    renderThemeList();
  };

  container.querySelectorAll('[data-theme-dup]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var src = getThemeById(this.getAttribute('data-theme-dup'));
      if (!src) return;
      var customs = getCustomThemes();
      var newId = 'custom-' + Date.now();
      customs.push({ id: newId, name: src.name + ' Copy', preset: false, vars: JSON.parse(JSON.stringify(src.vars)) });
      saveCustomThemes(customs);
      renderThemeList(); renderThemeSlots();
    });
  });
  container.querySelectorAll('[data-theme-edit]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      showThemeEditor(this.getAttribute('data-theme-edit'));
    });
  });
  container.querySelectorAll('[data-theme-del]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var id = this.getAttribute('data-theme-del');
      var customs = getCustomThemes().filter(function(t){ return t.id !== id; });
      saveCustomThemes(customs);
      renderThemeList(); renderThemeSlots();
    });
  });
}

var THEME_VAR_GROUPS = [
  { label: 'UI Colors', vars: [
    { key: '--bg', label: 'Background', type: 'color' },
    { key: '--surface', label: 'Surface', type: 'color' },
    { key: '--surface2', label: 'Surface 2', type: 'color' },
    { key: '--border', label: 'Border', type: 'color' },
    { key: '--text', label: 'Text', type: 'color' },
    { key: '--muted', label: 'Muted', type: 'color' },
    { key: '--accent', label: 'Accent', type: 'color' }
  ]},
  { label: 'Canvas Colors', vars: [
    { key: '--canvas-bg', label: 'Canvas BG', type: 'color' },
    { key: '--canvas-text', label: 'Canvas Text', type: 'color' },
    { key: '--canvas-muted', label: 'Canvas Muted', type: 'color' },
    { key: '--canvas-shadow', label: 'Canvas Shadow', type: 'text' },
    { key: '--para-border-focus', label: 'Para Border Focus', type: 'text' }
  ]},
  { label: 'Field Colors', vars: [
    { key: '--field-bg', label: 'Field BG', type: 'color' },
    { key: '--field-border', label: 'Field Border', type: 'color' }
  ]}
];

function showThemeEditor(themeId) {
  var edContainer = document.getElementById('theme-editor-container');
  if (!edContainer) return;
  var theme = getThemeById(themeId);
  if (!theme) return;
  var editVars = JSON.parse(JSON.stringify(theme.vars));
  var editName = theme.name;

  var html = '<div class="theme-editor">';
  html += '<input class="theme-editor-name" id="theme-ed-name" type="text" value="'+editName.replace(/"/g,'&quot;')+'" placeholder="Theme name">';
  THEME_VAR_GROUPS.forEach(function(group) {
    html += '<div class="opts-section-label" style="margin:8px 0 4px;">'+group.label+'</div>';
    group.vars.forEach(function(v) {
      html += '<div class="theme-color-row">';
      html += '<span class="theme-color-label">'+v.label+'</span>';
      if (v.type === 'color') {
        var val = editVars[v.key] || '#000000';
        html += '<input type="color" class="theme-color-input" data-var="'+v.key+'" value="'+val+'">';
        html += '<input type="text" class="theme-color-hex" data-hex-var="'+v.key+'" value="'+val+'">';
      } else {
        var tval = (editVars[v.key] || '').replace(/"/g, '&quot;');
        html += '<input type="text" class="theme-text-input" data-text-var="'+v.key+'" value="'+tval+'">';
      }
      html += '</div>';
    });
  });
  html += '<div class="theme-editor-actions">';
  html += '<button class="opts-action-btn" id="theme-ed-save">Save</button>';
  html += '<button class="opts-action-btn" id="theme-ed-cancel">Cancel</button>';
  html += '</div>';
  html += '</div>';
  edContainer.innerHTML = html;
  edContainer.style.display = '';

  edContainer.querySelectorAll('input[data-var]').forEach(function(inp) {
    inp.addEventListener('input', function() {
      var key = this.getAttribute('data-var');
      editVars[key] = this.value;
      var hexInp = edContainer.querySelector('[data-hex-var="'+key+'"]');
      if (hexInp) hexInp.value = this.value;
    });
  });
  edContainer.querySelectorAll('input[data-hex-var]').forEach(function(inp) {
    inp.addEventListener('input', function() {
      var key = this.getAttribute('data-hex-var');
      editVars[key] = this.value;
      var colorInp = edContainer.querySelector('[data-var="'+key+'"]');
      if (colorInp && /^#[0-9a-fA-F]{6}$/.test(this.value)) colorInp.value = this.value;
    });
  });
  edContainer.querySelectorAll('input[data-text-var]').forEach(function(inp) {
    inp.addEventListener('input', function() {
      editVars[this.getAttribute('data-text-var')] = this.value;
    });
  });

  document.getElementById('theme-ed-save').addEventListener('click', function() {
    var nameVal = document.getElementById('theme-ed-name').value.trim() || 'Custom';
    var customs = getCustomThemes();
    var found = false;
    for (var i = 0; i < customs.length; i++) {
      if (customs[i].id === themeId) {
        customs[i].name = nameVal;
        customs[i].vars = editVars;
        found = true; break;
      }
    }
    if (!found) {
      customs.push({ id: themeId, name: nameVal, preset: false, vars: editVars });
    }
    saveCustomThemes(customs);
    edContainer.style.display = 'none';
    edContainer.innerHTML = '';
    renderThemeList(); renderThemeSlots();
  });
  document.getElementById('theme-ed-cancel').addEventListener('click', function() {
    edContainer.style.display = 'none';
    edContainer.innerHTML = '';
  });
}

function showNewThemeEditor() {
  var newId = 'custom-' + Date.now();
  var activeId = StorageEngine.getItem('tvs:active-theme') || 'dark';
  var src = getThemeById(activeId) || getThemeById('dark');
  var customs = getCustomThemes();
  customs.push({ id: newId, name: 'Custom Theme', preset: false, vars: JSON.parse(JSON.stringify(src.vars)) });
  saveCustomThemes(customs);
  renderThemeList(); renderThemeSlots();
  showThemeEditor(newId);
}

// Init
(function() {
  var activeId = StorageEngine.getItem('tvs:active-theme') || 'dark';
  if (!getThemeById(activeId)) { activeId = 'dark'; StorageEngine.setItem('tvs:active-theme', 'dark'); }
  if (!StorageEngine.getItem('tvs:theme-a')) StorageEngine.setItem('tvs:theme-a', 'dark');
  if (!StorageEngine.getItem('tvs:theme-b')) StorageEngine.setItem('tvs:theme-b', 'light');
  if (!StorageEngine.getItem('tvs:active-slot')) {
    var themeA = StorageEngine.getItem('tvs:theme-a') || 'dark';
    StorageEngine.setItem('tvs:active-slot', activeId === themeA ? 'a' : 'b');
  }
  applyTheme(activeId);

  var pillA = document.getElementById('theme-pill-a');
  var pillB = document.getElementById('theme-pill-b');
  function toggleThemePill() {
    StorageEngine.removeItem('tvs:previewing');
    StorageEngine.removeItem('tvs:previewing-theme');
    var curSlot = StorageEngine.getItem('tvs:active-slot') || 'a';
    var nextSlot = curSlot === 'a' ? 'b' : 'a';
    var nextTheme = StorageEngine.getItem('tvs:theme-' + nextSlot) || (nextSlot === 'a' ? 'dark' : 'light');
    StorageEngine.setItem('tvs:active-slot', nextSlot);
    applyTheme(nextTheme);
    renderThemeList(); renderThemeSlots(); updateThemeBtn();
  }
  if (pillA) pillA.addEventListener('click', toggleThemePill);
  if (pillB) pillB.addEventListener('click', toggleThemePill);

  var newBtn = document.getElementById('btn-new-theme');
  if (newBtn) {
    newBtn.addEventListener('click', showNewThemeEditor);
  }

  var optsThemesSection = document.getElementById('opts-section-themes');
  if (optsThemesSection) {
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(m) {
        if (m.type === 'attributes' && m.attributeName === 'class') {
          if (optsThemesSection.classList.contains('active')) {
            renderThemeList(); renderThemeSlots();
          }
        }
      });
    });
    observer.observe(optsThemesSection, { attributes: true });
  }
})();
