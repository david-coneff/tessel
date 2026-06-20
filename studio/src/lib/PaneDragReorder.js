export function initPaneDragReorder(deps) {
  var dockPanel = deps.dockPanel;

(function() {
  var paneDragId  = null;   // id of pane currently being dragged
  var dragStarted = false;  // true once mouse moved past threshold
  var startX = 0, startY = 0;
  var DRAG_THRESHOLD = 5;   // px before drag activates
  var ZONES    = ['left', 'right', 'top', 'bottom'];
  var PANE_IDS = ['format-pane', 'text-pane', 'form-pane', 'outline-panel', 'props-panel'];

  function getZoneOf(panelId) {
    var panel = document.getElementById(panelId);
    if (panel && panel.classList.contains('dock-float')) return 'float';
    for (var i = 0; i < ZONES.length; i++) {
      var z = document.getElementById('dock-' + ZONES[i]);
      if (z && z.contains(panel)) return ZONES[i];
    }
    return null;
  }

  function isHzone(zone) { return zone === 'top' || zone === 'bottom'; }

  function clearInsertIndicators() {
    document.querySelectorAll('.pane-drop-before,.pane-drop-after').forEach(function(el) {
      el.classList.remove('pane-drop-before', 'pane-drop-after');
    });
  }

  function savePaneOrder(zone) {
    var z = document.getElementById('dock-' + zone);
    if (!z) return;
    var order = Array.from(z.children).map(function(c) { return c.id; }).filter(Boolean);
    try { localStorage.setItem('tvs:dock-order:' + zone, JSON.stringify(order)); } catch(e) {}
  }

  function restorePaneOrder() {
    ZONES.forEach(function(zone) {
      try {
        var saved = JSON.parse(localStorage.getItem('tvs:dock-order:' + zone) || 'null');
        if (!Array.isArray(saved)) return;
        var zoneEl = document.getElementById('dock-' + zone);
        saved.forEach(function(id) {
          var el = document.getElementById(id);
          if (el && el.parentElement === zoneEl) zoneEl.appendChild(el);
        });
      } catch(e) {}
    });
  }

  // Build 4 edge drop-zone overlays (purely visual, hit-tested manually)
  var edgeTargets = {};
  ZONES.forEach(function(zone) {
    var el = document.createElement('div');
    el.className = 'dock-edge-target dock-edge-' + zone;
    el.innerHTML = '<span>' + zone + '</span>';
    document.body.appendChild(el);
    edgeTargets[zone] = el;
  });

  // ── Mouse-based drag state ────────────────────────────────────────────────
  var _hoveredZone  = null;  // edge zone being hovered
  var _hoveredPane  = null;  // pane id being hovered (same-zone reorder)
  var _hoverBefore  = false; // insert before (true) or after (false)

  function activateDrag(id) {
    paneDragId  = id;
    dragStarted = true;
    document.body.classList.add('pane-dragging-active');
    var panel = document.getElementById(id);
    if (panel) { panel.classList.add('pane-dragging'); panel.style.pointerEvents = 'none'; }
    var myZone = getZoneOf(id);
    ZONES.forEach(function(z) {
      edgeTargets[z].style.opacity = (z === myZone) ? '0.3' : '1';
    });
  }

  function clearDrag() {
    if (paneDragId) {
      var panel = document.getElementById(paneDragId);
      if (panel) { panel.classList.remove('pane-dragging'); panel.style.pointerEvents = ''; }
    }
    paneDragId = null; dragStarted = false;
    document.body.classList.remove('pane-dragging-active');
    clearInsertIndicators();
    ZONES.forEach(function(z) {
      edgeTargets[z].classList.remove('active');
      edgeTargets[z].style.opacity = '';
    });
    _hoveredZone = null; _hoveredPane = null;
  }

  function updateHover(clientX, clientY) {
    clearInsertIndicators();
    ZONES.forEach(function(z) { edgeTargets[z].classList.remove('active'); });
    _hoveredZone = null; _hoveredPane = null;

    var dragZone = getZoneOf(paneDragId);

    // Check edge targets first
    for (var zi = 0; zi < ZONES.length; zi++) {
      var z = ZONES[zi];
      if (z === dragZone) continue; // skip own zone edge target
      var er = edgeTargets[z].getBoundingClientRect();
      if (clientX >= er.left && clientX <= er.right && clientY >= er.top && clientY <= er.bottom) {
        edgeTargets[z].classList.add('active');
        _hoveredZone = z;
        return;
      }
    }

    // Check sibling panes (same or different zone)
    for (var pi = 0; pi < PANE_IDS.length; pi++) {
      var pid = PANE_IDS[pi];
      if (pid === paneDragId) continue;
      var pel = document.getElementById(pid);
      if (!pel) continue;
      var pr = pel.getBoundingClientRect();
      if (clientX >= pr.left && clientX <= pr.right && clientY >= pr.top && clientY <= pr.bottom) {
        var myZone = getZoneOf(pid);
        if (myZone === 'float') continue;
        if (myZone !== dragZone) {
          // Cross-zone: highlight that zone's edge target
          if (edgeTargets[myZone]) edgeTargets[myZone].classList.add('active');
          _hoveredZone = myZone;
          _hoveredPane = pid;
        } else {
          // Same zone: show insertion line
          var before;
          if (isHzone(myZone)) {
            before = myZone === 'bottom'
              ? (clientY > pr.top + pr.height / 2)
              : (clientY < pr.top + pr.height / 2);
          } else {
            before = myZone === 'right'
              ? (clientX > pr.left + pr.width / 2)
              : (clientX < pr.left + pr.width / 2);
          }
          pel.classList.add(before ? 'pane-drop-before' : 'pane-drop-after');
          _hoveredPane  = pid;
          _hoverBefore  = before;
        }
        return;
      }
    }
  }

  function commitDrop() {
    if (!paneDragId) return;
    var draggedEl = document.getElementById(paneDragId);
    if (!draggedEl) return;
    var dragZone  = getZoneOf(paneDragId);

    if (_hoveredZone && !_hoveredPane) {
      // Dropped onto empty edge zone target
      var fromZone = dragZone;
      dockPanel(paneDragId, _hoveredZone);
      if (fromZone && fromZone !== _hoveredZone) savePaneOrder(fromZone);
      savePaneOrder(_hoveredZone);
    } else if (_hoveredPane) {
      var targetEl = document.getElementById(_hoveredPane);
      if (!targetEl) return;
      var targetZone = getZoneOf(_hoveredPane);
      if (targetZone !== dragZone) {
        // Cross-zone: move to target's zone and insert before the target
        var fromZone2 = dragZone;
        dockPanel(paneDragId, targetZone);
        var zoneEl = document.getElementById('dock-' + targetZone);
        if (zoneEl && draggedEl.parentElement === zoneEl) {
          zoneEl.insertBefore(draggedEl, targetEl);
        }
        if (fromZone2) savePaneOrder(fromZone2);
        savePaneOrder(targetZone);
      } else {
        // Same zone reorder
        if (_hoverBefore) {
          targetEl.parentElement.insertBefore(draggedEl, targetEl);
        } else {
          targetEl.insertAdjacentElement('afterend', draggedEl);
        }
        savePaneOrder(targetZone);
      }
    }
  }

  // ── Per-pane handle setup ─────────────────────────────────────────────────
  PANE_IDS.forEach(function(panelId) {
    var panel = document.getElementById(panelId);
    if (!panel) return;

    var handles = [];
    panel.querySelectorAll('.ctrl-pane-header, .ctrl-pane-tab').forEach(function(h) { handles.push(h); });
    panel.querySelectorAll('h3').forEach(function(h) { handles.push(h); });
    var tabEl = panel.querySelector('[id$="-tab"]:not(.ctrl-pane-tab)');
    if (tabEl && handles.indexOf(tabEl) === -1) handles.push(tabEl);
    if (!handles.length) handles.push(panel);

    handles.forEach(function(handle) {
      handle.addEventListener('mousedown', function(e) {
        if (e.button !== 0) return;
        if (e.target.tagName === 'BUTTON') return;
        var p = document.getElementById(panelId);
        if (p && p.classList.contains('dock-float')) return;
        e.preventDefault();
        paneDragId  = panelId;
        dragStarted = false;
        startX = e.clientX;
        startY = e.clientY;
      });
    });
  });

  // ── Global mouse move / up ────────────────────────────────────────────────
  document.addEventListener('mousemove', function(e) {
    if (!paneDragId) return;
    if (!dragStarted) {
      var dx = e.clientX - startX, dy = e.clientY - startY;
      if (Math.sqrt(dx*dx + dy*dy) < DRAG_THRESHOLD) return;
      activateDrag(paneDragId);
    }
    updateHover(e.clientX, e.clientY);
  });

  document.addEventListener('mouseup', function(e) {
    if (!paneDragId) return;
    if (dragStarted) commitDrop();
    clearDrag();
  });

  restorePaneOrder();
})();
}
