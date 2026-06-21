import * as StorageEngine from './StorageEngine.js';
/**
 * PaneFactory — unified open/collapse/hide state machine for dockable panels
 *
 * Replaces the separate makeCtrlPane / makeSidePanel functions.
 * cfg options:
 *   paneId      — element ID of the panel (required)
 *   badgeId     — toolbar badge button ID (required)
 *   lsKey       — localStorage state key (required)
 *   tabId       — tab strip element ID (side panels: via id, ctrl panes: via querySelector)
 *   collapseId  — collapse/arrow button ID (side panels: via id, ctrl panes: via querySelector)
 *
 * Exports sidePanelArrowSync and sidePanelOpenFn registries so the
 * dock/float system can call back into pane state without circular imports.
 */

export var sidePanelArrowSync = {};
export var sidePanelOpenFn    = {};

export function makeDockablePane(cfg) {
  var pane  = document.getElementById(cfg.paneId);
  var badge = document.getElementById(cfg.badgeId);

  // Collapse/toggle button: by explicit ID or by class query
  var collapseEl = cfg.collapseId
    ? document.getElementById(cfg.collapseId)
    : pane.querySelector('.ctrl-pane-collapse-btn');

  // Tab strip element: by explicit ID or by class query
  var tabEl = cfg.tabId
    ? document.getElementById(cfg.tabId)
    : pane.querySelector('.ctrl-pane-tab');

  // Arrow character element inside the tab strip
  var tabArrow = tabEl ? tabEl.querySelector('.panel-tab-arrow') : null;

  function ls(k)    { try { return StorageEngine.getItem(k);    } catch(e) { return null; } }
  function lss(k,v) { try { StorageEngine.setItem(k, v);        } catch(e) {} }

  function arrowDir(isOpen) {
    var onRight = pane.classList.contains('dock-right');
    return onRight ? (isOpen ? '›' : '‹') : (isOpen ? '‹' : '›');
  }
  function setArrows(isOpen) {
    var ch = arrowDir(isOpen);
    if (collapseEl) collapseEl.innerHTML = ch;
    if (tabArrow)   tabArrow.innerHTML   = ch;
  }
  function syncArrow() {
    setArrows(!pane.classList.contains('collapsed') && !pane.classList.contains('off'));
  }

  sidePanelArrowSync[cfg.paneId] = syncArrow;
  sidePanelOpenFn[cfg.paneId]    = function() { open(); };

  function _restoreWidth() {
    try {
      var w = StorageEngine.getItem('tvs:pane-w:' + cfg.paneId);
      if (w) pane.style.width = parseInt(w, 10) + 'px';
    } catch(e) {}
  }

  function open() {
    pane.classList.remove('collapsed', 'off');
    _restoreWidth();
    setArrows(true);
    badge.classList.add('active');
    lss(cfg.lsKey, 'open');
    _lastActiveState = 'open';
  }
  function collapse() {
    pane.classList.remove('off');
    pane.style.width = '';
    pane.classList.add('collapsed');
    setArrows(false);
    badge.classList.add('active');
    lss(cfg.lsKey, 'collapsed');
    _lastActiveState = 'collapsed';
  }
  function hide() {
    pane.classList.remove('collapsed');
    pane.style.width = '';
    pane.classList.add('off');
    badge.classList.remove('active');
    lss(cfg.lsKey, 'off');
  }
  function toggle() {
    if (pane.classList.contains('collapsed')) open(); else collapse();
  }

  if (collapseEl) collapseEl.addEventListener('click', toggle);
  if (tabEl)      tabEl.addEventListener('click', toggle);

  badge.addEventListener('click', function(e) {
    e.stopPropagation();
    if (pane.classList.contains('dock-float')) {
      if (pane.classList.contains('off')) {
        pane.classList.remove('off');
        badge.classList.add('active');
        if (window._clampFloatPanel) window._clampFloatPanel(pane);
      } else {
        pane.classList.add('off');
        badge.classList.remove('active');
      }
    } else {
      if (badge.classList.contains('active')) hide();
      else if (_lastActiveState === 'collapsed') collapse(); else open();
    }
  });

  var _lastActiveState = 'open';
  var state = ls(cfg.lsKey);
  if (state === 'off')            { hide(); }
  else if (state === 'collapsed') { _lastActiveState = 'collapsed'; collapse(); }
  else                            { open(); }
}
