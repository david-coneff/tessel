// TauriBridge — Tauri 2.x runtime detection and window management helpers.
// All exports are safe no-ops when not running inside a Tauri wrapper.

import { getCurrentWindow } from '@tauri-apps/api/window';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';

export var isTauri = typeof window !== 'undefined' && !!window.__TAURI_INTERNALS__;

// Open a satellite pane as a Tauri WebviewWindow.
// Returns a promise resolving to a handle with .close() and a .closed property,
// shaped to match the window.open() API used by the rest of DockSystem.
export async function openTauriSatellite(panelId, url, w, h) {
  if (!isTauri) return null;
  var label = 'satellite-' + panelId.replace(/[^a-zA-Z0-9_-]/g, '-');
  try {
    var webview = new WebviewWindow(label, {
      url: url,
      title: panelId.replace(/-pane$||-panel$/, '').replace(/-/g, ' '),
      width: w,
      height: h,
      resizable: true,
      decorations: true,
    });
    // WebviewWindow doesn't expose .closed; wrap it
    var handle = { closed: false, _win: webview };
    handle.close = function() { webview.close(); };
    webview.once('tauri://destroyed', function() { handle.closed = true; });
    return handle;
  } catch(e) { return null; }
}

// Close the current window via the Tauri API. window.close() only blanks the
// WebView content in Tauri; getCurrentWindow().close() closes the OS frame.
export function closeCurrentWindow() {
  if (!isTauri) { window.close(); return; }
  try { getCurrentWindow().close(); } catch(e) { window.close(); }
}

// Register minimize/restore sync: when the main window minimizes, minimize all
// open satellite windows. Restored when main restores. Call once after dock init.
// getSatelliteHandles() should return the pipPanels map from DockSystem.
export function initTauriWindowSync(getSatelliteHandles) {
  if (!isTauri) return;
  try {
    var mainWin = getCurrentWindow();
    mainWin.onWindowEvent(function(event) {
      var type = event.payload;
      var handles = getSatelliteHandles();
      Object.keys(handles).forEach(function(id) {
        var entry = handles[id];
        if (!entry || !entry.isTauri || !entry.pipWin || entry.pipWin.closed) return;
        try {
          if (type === 'Minimized') entry.pipWin._win.minimize();
          else if (type === 'Restored' || type === 'Focused') entry.pipWin._win.unminimize();
        } catch(ex) {}
      });
    });
  } catch(e) {}
}
