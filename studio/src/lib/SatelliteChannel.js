var CHANNEL_NAME = 'tvs-satellite';
var _ch = null;
var _deps = {};

export function isSatellite() {
  try { return new URLSearchParams(location.search).has('satellite'); } catch(e) { return false; }
}

export function getSatellitePaneId() {
  try { return new URLSearchParams(location.search).get('satellite') || null; } catch(e) { return null; }
}

export function initMainChannel(deps) {
  _deps = deps;
  _ch = new BroadcastChannel(CHANNEL_NAME);
  _ch.onmessage = function(e) {
    var msg = e.data;
    if (msg.type === 'update') {
      try {
        _deps.setBlocks(JSON.parse(msg.blocks));
        _deps.renderCanvas();
        _deps.markUnsaved();
      } catch(ex) {}
    } else if (msg.type === 'ready') {
      broadcastState(_deps.getBlocks(), _deps.getSelectedBlockId());
    }
  };
}

export function broadcastState(blocks, selectedBlockId) {
  if (!_ch) return;
  try { _ch.postMessage({ type: 'state', blocks: JSON.stringify(blocks), selectedBlockId: selectedBlockId || null }); } catch(e) {}
}

export function initSatelliteChannel(deps) {
  _deps = deps;
  _ch = new BroadcastChannel(CHANNEL_NAME);
  var _gotState = false;
  _ch.onmessage = function(e) {
    var msg = e.data;
    if (msg.type === 'state') {
      _gotState = true;
      try {
        _deps.setBlocks(JSON.parse(msg.blocks));
        _deps.setSelectedBlockId(msg.selectedBlockId || null);
        _deps.renderProps();
        _deps.updateOutline();
      } catch(ex) {}
    } else if (msg.type === 'theme') {
      if (_deps.applyTheme) try { _deps.applyTheme(msg.themeId); } catch(ex) {}
    }
  };
  // Request initial state, retry until received
  function requestState() {
    if (_gotState) return;
    try { _ch.postMessage({ type: 'ready' }); } catch(ex) {}
    setTimeout(function() { if (!_gotState) requestState(); }, 600);
  }
  requestState();
}

export function broadcastUpdate(blocks) {
  if (!_ch) return;
  try { _ch.postMessage({ type: 'update', blocks: JSON.stringify(blocks) }); } catch(e) {}
}

export function broadcastTheme(themeId) {
  if (!_ch) return;
  try { _ch.postMessage({ type: 'theme', themeId: themeId }); } catch(e) {}
}
