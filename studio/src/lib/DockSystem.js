import { clampToViewport } from './FloatingPane.js';
import { sidePanelOpenFn, sidePanelArrowSync } from './PaneFactory.js';

export function dockPanel(panelId, zone) {
  var panel = document.getElementById(panelId);
  var zoneEl = document.getElementById('dock-' + zone);
  if (!panel || !zoneEl) return;

  if (panel.classList.contains('dock-float')) {
    panel.style.left = panel.style.top = panel.style.width = panel.style.height = panel.style.zIndex = '';
    var fb = document.querySelector('[data-pane-float-btn="' + panelId + '"]');
    if (fb) { fb.innerHTML = '&#8599;'; fb.title = 'Undock to float'; }
  }

  zoneEl.appendChild(panel);
  panel.classList.remove('dock-left', 'dock-right', 'dock-top', 'dock-bottom', 'dock-float', 'pane-h');
  panel.classList.add('dock-' + zone);
  if (zone === 'top' || zone === 'bottom') {
    panel.classList.add('pane-h');
    if (panel.classList.contains('collapsed') && !panel.classList.contains('off')) {
      if (sidePanelOpenFn[panelId]) sidePanelOpenFn[panelId]();
    }
  }
  if (sidePanelArrowSync[panelId]) sidePanelArrowSync[panelId]();

  document.querySelectorAll('.opts-dock-btns[data-dock-panel="' + panelId + '"] .opts-dock-btn').forEach(function(b) {
    b.classList.toggle('active', b.dataset.zone === zone);
  });

  try { localStorage.setItem('tvs:dock:' + panelId, zone); } catch(e) {}
}

export var floatPanel = null;

export function initDockSystem() {
  // ── Floating panel system ──────────────────────────────────────────────────
  (function() {
    var FLOAT_W = 260, FLOAT_H = 380, MIN_W = 160, MIN_H = 120;
    var PANE_IDS = ['format-pane','text-pane','form-pane','outline-panel','props-panel'];
    var PANE_DEF = {'format-pane':'left','text-pane':'left','form-pane':'left','outline-panel':'left','props-panel':'right'};
    var lastZone = {};
    var zCounter = 201;
    var pipPanels = {};

    function loadState(id) { try { return JSON.parse(localStorage.getItem('tvs:float:'+id))||null; } catch(e) { return null; } }
    function saveState(id,x,y,w,h) { try { localStorage.setItem('tvs:float:'+id, JSON.stringify({x:x,y:y,w:w,h:h})); } catch(e) {} }

    function clampFloatPanel(panel) {
      if (!panel || !panel.classList.contains('dock-float')) return;
      var pos = clampToViewport(panel, {
        w: parseFloat(panel.style.width)  || FLOAT_W,
        h: parseFloat(panel.style.height) || FLOAT_H,
        x: parseFloat(panel.style.left)   || 0,
        y: parseFloat(panel.style.top)    || 0,
        margin: 60,
      });
      panel.style.left = pos.x + 'px';
      panel.style.top  = pos.y + 'px';
    }

    window._clampFloatPanel = clampFloatPanel;

    function copyStylesToPip(pipWin) {
      var css = '';
      for (var i = 0; i < document.styleSheets.length; i++) {
        try {
          var rules = document.styleSheets[i].cssRules;
          for (var j = 0; j < rules.length; j++) css += rules[j].cssText + '\n';
        } catch(e) {}
      }
      css += '\nbody{margin:0;overflow:hidden;background:var(--bg,#1e1e1e);}';
      var style = pipWin.document.createElement('style');
      style.textContent = css;
      pipWin.document.head.appendChild(style);
    }

    function returnFromPip(panelId) {
      var saved = pipPanels[panelId];
      if (!saved) return;
      var panel = saved.panel;
      delete pipPanels[panelId];
      panel.removeAttribute('data-pip-out');
      var pb = document.querySelector('[data-pane-pip-btn="' + panelId + '"]');
      if (pb) pb.classList.remove('pip-active');
      if (saved.wasFloat) {
        panel.style.left   = saved.left;
        panel.style.top    = saved.top;
        panel.style.width  = saved.width;
        panel.style.height = saved.height;
        panel.style.zIndex = saved.zIndex || String(zCounter++);
        var fc = document.getElementById('dock-float');
        if (fc) fc.appendChild(panel); // move back to main document first
        panel.classList.add('dock-float');
        clampFloatPanel(panel);
      } else {
        var zone = saved.zone || PANE_DEF[panelId] || 'left';
        // Move back to main document before dockPanel queries getElementById
        var zoneEl = document.getElementById('dock-' + zone) || document.body;
        zoneEl.appendChild(panel);
        dockPanel(panelId, zone);
      }
    }

    function popOutToPip(panelId) {
      if (!window.documentPictureInPicture) return;
      var panel = document.getElementById(panelId);
      if (!panel) return;
      if (pipPanels[panelId]) return;
      var wasFloat = panel.classList.contains('dock-float');
      var w = Math.round(wasFloat ? (parseFloat(panel.style.width)  || FLOAT_W) : panel.offsetWidth  || FLOAT_W);
      var h = Math.round(wasFloat ? (parseFloat(panel.style.height) || FLOAT_H) : panel.offsetHeight || FLOAT_H);
      window.documentPictureInPicture.requestWindow({ width: w, height: h }).then(function(pipWin) {
        copyStylesToPip(pipWin);
        pipPanels[panelId] = {
          panel: panel, pipWin: pipWin,
          wasFloat: wasFloat,
          zone: curZoneOf(panel),
          left: panel.style.left, top: panel.style.top,
          width: panel.style.width, height: panel.style.height,
          zIndex: panel.style.zIndex,
        };
        panel.classList.remove('dock-left','dock-right','dock-top','dock-bottom','dock-float','pane-h');
        panel.style.left = panel.style.top = panel.style.width = panel.style.height = panel.style.zIndex = '';
        panel.setAttribute('data-pip-out', '1');
        pipWin.document.body.appendChild(panel);
        var pb = document.querySelector('[data-pane-pip-btn="' + panelId + '"]');
        if (pb) pb.classList.add('pip-active');
        pipWin.addEventListener('pagehide', function() { returnFromPip(panelId); });
      }).catch(function() {});
    }

    function openSatellite(panelId) {
      var panel = document.getElementById(panelId);
      if (!panel) return;
      if (pipPanels[panelId]) return;
      var w = Math.round(parseFloat(panel.style.width)  || FLOAT_W);
      var h = Math.round(parseFloat(panel.style.height) || FLOAT_H);
      var url = location.href.split('?')[0] + '?satellite=' + encodeURIComponent(panelId);
      var winRef = window.open(url, '_blank', 'width='+w+',height='+h+',popup=1');
      if (!winRef) return;
      var pb = document.querySelector('[data-pane-pip-btn="'+panelId+'"]');
      if (pb) pb.classList.add('pip-active');
      pipPanels[panelId] = { pipWin: winRef, isSatellite: true };
      var iv = setInterval(function() {
        if (winRef.closed) {
          clearInterval(iv);
          delete pipPanels[panelId];
          var pb2 = document.querySelector('[data-pane-pip-btn="'+panelId+'"]');
          if (pb2) pb2.classList.remove('pip-active');
        }
      }, 500);
    }

    function curZoneOf(panel) {
      if (panel.classList.contains('dock-left'))   return 'left';
      if (panel.classList.contains('dock-right'))  return 'right';
      if (panel.classList.contains('dock-top'))    return 'top';
      if (panel.classList.contains('dock-bottom')) return 'bottom';
      return null;
    }

    floatPanel = function(panelId) {
      var panel = document.getElementById(panelId);
      var fc    = document.getElementById('dock-float');
      if (!panel || !fc) return;
      var z = curZoneOf(panel);
      if (z) lastZone[panelId] = z;
      panel.classList.remove('collapsed');
      fc.appendChild(panel);
      panel.classList.remove('dock-left','dock-right','dock-top','dock-bottom','pane-h');
      panel.classList.add('dock-float');
      var s = loadState(panelId);
      var w = (s&&s.w)||FLOAT_W, h = (s&&s.h)||FLOAT_H;
      var x = (s&&s.x!=null) ? s.x : Math.round((window.innerWidth-w)/2);
      var y = (s&&s.y!=null) ? s.y : Math.round((window.innerHeight-h)/4);
      x = Math.max(0, Math.min(window.innerWidth-w,  x));
      y = Math.max(0, Math.min(window.innerHeight-h, y));
      panel.style.left=x+'px'; panel.style.top=y+'px';
      panel.style.width=w+'px'; panel.style.height=h+'px';
      panel.style.zIndex=String(zCounter++);
      document.querySelectorAll('.opts-dock-btns[data-dock-panel="'+panelId+'"] .opts-dock-btn').forEach(function(b){
        b.classList.toggle('active', b.dataset.zone==='float');
      });
      var fb = document.querySelector('[data-pane-float-btn="'+panelId+'"]');
      if (fb) { fb.innerHTML='&#8601;'; fb.title='Dock panel'; }
      panel.classList.remove('off');
      var bdg = document.querySelector('[data-badge-pane="'+panelId+'"]') || document.getElementById('badge-'+panelId.replace(/-pane$/,'').replace(/-panel$/,''));
      if (bdg) bdg.classList.add('active');
      try { localStorage.setItem('tvs:dock:'+panelId,'float'); } catch(e) {}
    };

    function dockBack(panelId) {
      var panel = document.getElementById(panelId);
      if (!panel||!panel.classList.contains('dock-float')) return;
      saveState(panelId,
        parseFloat(panel.style.left)||0, parseFloat(panel.style.top)||0,
        parseFloat(panel.style.width)||FLOAT_W, parseFloat(panel.style.height)||FLOAT_H);
      panel.style.left=panel.style.top=panel.style.width=panel.style.height=panel.style.zIndex='';
      panel.classList.remove('off');
      dockPanel(panelId, lastZone[panelId]||PANE_DEF[panelId]||'left');
    }

    PANE_IDS.forEach(function(panelId) {
      var panel = document.getElementById(panelId); if (!panel) return;
      var hdr = panel.querySelector('.ctrl-pane-header') ||
                panel.querySelector('#outline-content h3') ||
                panel.querySelector('#props-content h3') ||
                panel.querySelector('h3');
      if (!hdr) return;
      var btn = document.createElement('button');
      btn.className = 'ctrl-pane-float-btn';
      btn.setAttribute('data-pane-float-btn', panelId);
      btn.innerHTML = '&#8599;'; btn.title = 'Undock to float';
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (panel.classList.contains('dock-float')) dockBack(panelId);
        else floatPanel(panelId);
      });
      hdr.appendChild(btn);

      (function(pid) {
        var pipBtn = document.createElement('button');
        pipBtn.className = 'ctrl-pane-pip-btn';
        pipBtn.setAttribute('data-pane-pip-btn', pid);
        pipBtn.innerHTML = '&#10697;';
        pipBtn.title = window.documentPictureInPicture
          ? 'Pop out to separate window'
          : 'Pop out to separate window (BroadcastChannel fallback)';
        pipBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          if (pipPanels[pid]) {
            try { pipPanels[pid].pipWin.close(); } catch(ex) {}
            if (pipPanels[pid].isSatellite) {
              delete pipPanels[pid];
              pipBtn.classList.remove('pip-active');
            }
          } else {
            if (window.documentPictureInPicture) popOutToPip(pid);
            else openSatellite(pid);
          }
        });
        hdr.appendChild(pipBtn);
      })(panelId);
    });

    var DIRS = ['n','ne','e','se','s','sw','w','nw'];
    PANE_IDS.forEach(function(panelId) {
      var panel = document.getElementById(panelId); if (!panel) return;
      DIRS.forEach(function(dir) {
        var el = document.createElement('div');
        el.className = 'pane-resize-handle pane-resize-handle-'+dir;
        el.setAttribute('data-resize-dir', dir);
        panel.appendChild(el);
      });
    });

    var fd=null, fdSX=0, fdSY=0, fdPX=0, fdPY=0;
    document.getElementById('dock-float').addEventListener('mousedown', function(e) {
      if (e.button!==0||e.target.tagName==='BUTTON') return;
      if (e.target.classList.contains('pane-resize-handle')) return;
      var hdr = e.target.closest('.ctrl-pane-header, #outline-content h3, #props-content h3');
      if (!hdr) return;
      var p = hdr;
      while (p && p.parentElement && p.parentElement.id !== 'dock-float') p = p.parentElement;
      if (!p||!p.classList.contains('dock-float')) return;
      fd=p; fdSX=e.clientX; fdSY=e.clientY;
      fdPX=parseFloat(p.style.left)||0; fdPY=parseFloat(p.style.top)||0;
      p.style.zIndex=String(zCounter++);
      e.preventDefault();
    });

    var rd=null, rdDir='', rdSX=0, rdSY=0, rdPX=0, rdPY=0, rdPW=0, rdPH=0;
    document.addEventListener('mousedown', function(e) {
      if (e.button!==0||!e.target.classList.contains('pane-resize-handle')) return;
      var p=e.target.parentElement;
      if (!p||!p.classList.contains('dock-float')) return;
      rd=p; rdDir=e.target.getAttribute('data-resize-dir');
      rdSX=e.clientX; rdSY=e.clientY;
      rdPX=parseFloat(p.style.left)||0; rdPY=parseFloat(p.style.top)||0;
      rdPW=parseFloat(p.style.width)||FLOAT_W; rdPH=parseFloat(p.style.height)||FLOAT_H;
      p.style.zIndex=String(zCounter++);
      e.preventDefault(); e.stopPropagation();
    }, true);

    document.addEventListener('mousemove', function(e) {
      if (fd) {
        var pos = clampToViewport(fd, {
          w: parseFloat(fd.style.width) || FLOAT_W,
          h: parseFloat(fd.style.height) || FLOAT_H,
          x: fdPX + (e.clientX - fdSX),
          y: fdPY + (e.clientY - fdSY),
        });
        fd.style.left = pos.x + 'px';
        fd.style.top  = pos.y + 'px';
      }
      if (rd) {
        var dx=e.clientX-rdSX, dy=e.clientY-rdSY, dir=rdDir;
        var x=rdPX,y=rdPY,w=rdPW,h=rdPH;
        if (dir.indexOf('e')>=0) w=Math.max(MIN_W,rdPW+dx);
        if (dir.indexOf('s')>=0) h=Math.max(MIN_H,rdPH+dy);
        if (dir.indexOf('w')>=0) { var nw=Math.max(MIN_W,rdPW-dx); x=rdPX+(rdPW-nw); w=nw; }
        if (dir.indexOf('n')>=0) { var nh=Math.max(MIN_H,rdPH-dy); y=rdPY+(rdPH-nh); h=nh; }
        rd.style.left=x+'px'; rd.style.top=y+'px'; rd.style.width=w+'px'; rd.style.height=h+'px';
      }
    });

    document.addEventListener('mouseup', function() {
      if (fd) { saveState(fd.id,parseFloat(fd.style.left)||0,parseFloat(fd.style.top)||0,parseFloat(fd.style.width)||FLOAT_W,parseFloat(fd.style.height)||FLOAT_H); fd=null; }
      if (rd) { saveState(rd.id,parseFloat(rd.style.left)||0,parseFloat(rd.style.top)||0,parseFloat(rd.style.width)||FLOAT_W,parseFloat(rd.style.height)||FLOAT_H); rd=null; rdDir=''; }
    });

    window.addEventListener('resize', function() {
      PANE_IDS.forEach(function(panelId) {
        var panel = document.getElementById(panelId);
        if (panel && panel.classList.contains('dock-float') && !panel.classList.contains('off')) {
          clampFloatPanel(panel);
        }
      });
    });

    PANE_IDS.forEach(function(panelId) {
      var s; try { s=localStorage.getItem('tvs:dock:'+panelId); } catch(e) {}
      if (s==='float') floatPanel(panelId);
    });
  })();

  // ── Vertical pane width resize ─────────────────────────────────────────────
  (function() {
    var PANE_IDS = ['format-pane','text-pane','form-pane','outline-panel','props-panel'];
    var MIN_W = 100;
    var LS_PREFIX = 'tvs:pane-w:';

    function lsKey(id) { return LS_PREFIX + id; }
    function saveW(id, w) { try { localStorage.setItem(lsKey(id), w); } catch(e) {} }
    function loadW(id) { try { var v = localStorage.getItem(lsKey(id)); return v ? parseInt(v, 10) : null; } catch(e) { return null; } }

    function isVertical(pane) {
      return !pane.classList.contains('pane-h') &&
             !pane.classList.contains('dock-float') &&
             !pane.classList.contains('collapsed') &&
             !pane.classList.contains('off');
    }

    PANE_IDS.forEach(function(id) {
      var pane = document.getElementById(id);
      if (!pane) return;

      var saved = loadW(id);
      if (saved && isVertical(pane)) pane.style.width = saved + 'px';

      var handle = document.createElement('div');
      handle.className = 'pane-width-handle';
      pane.appendChild(handle);

      handle.addEventListener('mousedown', function(e) {
        if (!isVertical(pane)) return;
        e.preventDefault();
        var startX = e.clientX;
        var startW = pane.offsetWidth;
        var onRight = pane.classList.contains('dock-right');
        handle.classList.add('dragging');
        pane.classList.add('pane-resizing');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        function onMove(e) {
          var dx = e.clientX - startX;
          var newW = onRight ? Math.max(MIN_W, startW - dx) : Math.max(MIN_W, startW + dx);
          pane.style.width = newW + 'px';
        }
        function onUp() {
          handle.classList.remove('dragging');
          pane.classList.remove('pane-resizing');
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
          saveW(id, pane.offsetWidth);
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    });
  })();

  // ── Horizontal pane row-snap resize ───────────────────────────────────────
  (function() {
    var ROW_H    = 44;
    var MAX_ROWS = 4;
    var PANE_IDS = ['format-pane', 'text-pane', 'form-pane'];
    var LS_PREFIX = 'tvs:pane-rows:';

    var ghostCtr = document.createElement('div');
    ghostCtr.id = 'pane-h-ghost-ctr';
    document.body.appendChild(ghostCtr);
    var ticks = [];
    for (var ti = 0; ti < MAX_ROWS; ti++) {
      var tick = document.createElement('div');
      tick.className = 'pane-h-row-tick';
      tick.style.top = ((ti + 1) * ROW_H - 1) + 'px';
      ghostCtr.appendChild(tick);
      ticks.push(tick);
    }

    function showGhost(paneRect, snapRow) {
      ghostCtr.style.left   = paneRect.left + 'px';
      ghostCtr.style.width  = (paneRect.right - paneRect.left) + 'px';
      ghostCtr.style.top    = paneRect.top + 'px';
      ghostCtr.style.height = (MAX_ROWS * ROW_H) + 'px';
      ghostCtr.classList.add('show');
      for (var i = 0; i < MAX_ROWS; i++) {
        ticks[i].classList.toggle('snap-active', (i + 1) === snapRow);
      }
    }

    function hideGhost() { ghostCtr.classList.remove('show'); }

    function lsKey(id) { return LS_PREFIX + id; }
    function saveRows(id, n) { try { localStorage.setItem(lsKey(id), n); } catch(e) {} }
    function loadRows(id) { try { var v = localStorage.getItem(lsKey(id)); return v ? Math.max(1, Math.min(MAX_ROWS, parseInt(v, 10))) : 1; } catch(e) { return 1; } }

    function updateIndicator(pane) {
      var body    = pane.querySelector('.ctrl-pane-body');
      var header  = pane.querySelector('.ctrl-pane-header');
      var indFwd  = pane.querySelector('.pane-h-overflow-ind');
      var indBack = pane.querySelector('.pane-h-back-ind');
      if (!body) return;
      if (indBack) {
        indBack.style.left = (header ? header.offsetWidth : 0) + 'px';
        indBack.classList.toggle('show', body.scrollTop > 2);
      }
      if (indFwd) indFwd.classList.toggle('show', body.scrollHeight > body.scrollTop + body.clientHeight + 2);
    }

    function applyRows(pane, rows) {
      var h = rows * ROW_H;
      pane.style.height    = h + 'px';
      pane.style.maxHeight = h + 'px';
      var content = pane.querySelector('.ctrl-pane-content');
      var header  = pane.querySelector('.ctrl-pane-header');
      var body    = pane.querySelector('.ctrl-pane-body');
      if (content) content.style.height = h + 'px';
      if (header)  header.style.height  = h + 'px';
      if (body) {
        body.style.height = h + 'px';
        if (rows > 1) {
          body.style.flexWrap     = 'wrap';
          body.style.overflowX    = 'hidden';
          body.style.overflowY    = 'auto';
          body.style.alignContent = 'flex-start';
        } else {
          body.style.flexWrap     = '';
          body.style.overflowX    = '';
          body.style.overflowY    = '';
          body.style.alignContent = '';
        }
      }
      setTimeout(function() { updateIndicator(pane); }, 0);
    }

    function clearPaneHStyles(pane) {
      pane.style.height    = '';
      pane.style.maxHeight = '';
      var content = pane.querySelector('.ctrl-pane-content');
      var header  = pane.querySelector('.ctrl-pane-header');
      var body    = pane.querySelector('.ctrl-pane-body');
      if (content) content.style.height = '';
      if (header)  header.style.height  = '';
      if (body) {
        body.style.height       = '';
        body.style.flexWrap     = '';
        body.style.overflowX    = '';
        body.style.overflowY    = '';
        body.style.alignContent = '';
      }
      var ind = pane.querySelector('.pane-h-overflow-ind');
      if (ind) ind.classList.remove('show');
      var indB = pane.querySelector('.pane-h-back-ind');
      if (indB) indB.classList.remove('show');
    }

    PANE_IDS.forEach(function(id) {
      var pane = document.getElementById(id);
      if (!pane) return;

      var indBack = document.createElement('div');
      indBack.className = 'pane-h-back-ind';
      pane.appendChild(indBack);
      indBack.addEventListener('click', function() {
        var b = pane.querySelector('.ctrl-pane-body');
        if (!b) return;
        b.scrollTo({ top: Math.max(0, b.scrollTop - Math.round(ROW_H / 2)), behavior: 'smooth' });
      });

      var ind = document.createElement('div');
      ind.className = 'pane-h-overflow-ind';
      pane.appendChild(ind);
      ind.addEventListener('click', function() {
        var b = pane.querySelector('.ctrl-pane-body');
        if (!b) return;
        b.scrollTo({ top: b.scrollTop + Math.round(ROW_H / 2), behavior: 'smooth' });
      });

      var handle = document.createElement('div');
      handle.className = 'pane-h-resize-handle';
      pane.appendChild(handle);

      var body = pane.querySelector('.ctrl-pane-body');
      if (body) {
        body.addEventListener('scroll', function() { updateIndicator(pane); });
      }

      pane.addEventListener('wheel', function(e) {
        var b = pane.querySelector('.ctrl-pane-body');
        if (!b || !pane.classList.contains('pane-h')) return;
        if (loadRows(id) <= 1) return;
        e.preventDefault();
        var delta = e.deltaY !== 0 ? e.deltaY : e.deltaX;
        var step = Math.sign(delta) * Math.min(Math.abs(delta) * 0.3, ROW_H);
        b.scrollBy({ top: step, behavior: 'smooth' });
        updateIndicator(pane);
      }, { passive: false });

      var observer = new MutationObserver(function() {
        var isPaneH  = pane.classList.contains('pane-h');
        var isActive = isPaneH && !pane.classList.contains('collapsed') && !pane.classList.contains('off');
        if (isActive) {
          var rows = loadRows(id);
          if (rows > 1) applyRows(pane, rows);
          else updateIndicator(pane);
        } else if (!isPaneH) {
          clearPaneHStyles(pane);
        }
      });
      observer.observe(pane, { attributes: true, attributeFilter: ['class'] });

      if (pane.classList.contains('pane-h')) {
        var rows = loadRows(id);
        if (rows > 1) applyRows(pane, rows);
      }

      handle.addEventListener('mousedown', function(e) {
        if (!pane.classList.contains('pane-h')) return;
        e.preventDefault();
        var paneRect = pane.getBoundingClientRect();
        var snapRow  = loadRows(id);
        handle.classList.add('dragging');
        document.body.style.cursor     = 'row-resize';
        document.body.style.userSelect = 'none';
        showGhost(paneRect, snapRow);

        function onMove(ev) {
          var relY = ev.clientY - paneRect.top;
          snapRow  = Math.max(1, Math.min(MAX_ROWS, Math.round(relY / ROW_H)));
          showGhost(paneRect, snapRow);
        }
        function onUp(ev) {
          handle.classList.remove('dragging');
          document.body.style.cursor     = '';
          document.body.style.userSelect = '';
          hideGhost();
          var relY = ev.clientY - paneRect.top;
          snapRow  = Math.max(1, Math.min(MAX_ROWS, Math.round(relY / ROW_H)));
          applyRows(pane, snapRow);
          saveRows(id, snapRow);
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    });
  })();
}
