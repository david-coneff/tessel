# Failure Paths: Tauri Window Management

**Feature area**: `DockSystem.js` (`openSatellite`, `pipPanels`, `satellite-hidden`),
`TauriBridge.js` (`closeCurrentWindow`), `AppInit.js` satellite close wiring,
`src-tauri/capabilities/default.json`.  
**Related state doc**: [tauri-pwa-multiplatform-deployment.md](../tauri-pwa-multiplatform-deployment.md) §4, §9 Failure 6  
**Index**: [lessons-learned-synthesis.md](../lessons-learned-synthesis.md)

---

## F-WIN-01 — Document Picture-in-Picture Silently Rejected in Tauri WebView2

**Feature scope**: `DockSystem.js` — the first pop-out implementation used the
Document Picture-in-Picture API (`window.documentPictureInPicture.requestWindow()`).

**Root cause**: Tauri's WebView2 renderer exposes `window.documentPictureInPicture`
as a defined object, so the browser-capability check (`'documentPictureInPicture' in window`)
returns `true`. However, `requestWindow()` is silently rejected: the promise never
resolves or rejects, and no error is thrown. The pop-out button appeared to do nothing.

This was a false positive: the API is present but not functional in the WebView2
sandbox context that Tauri uses.

**Fix**: Guard the Document PiP path with `&& !isTauri`:
```js
if ('documentPictureInPicture' in window && !isTauri) {
  // use Document PiP
} else {
  // use window.open / Tauri satellite
}
```
Then implement the Tauri path using `WebviewWindow` from `@tauri-apps/api/webviewWindow`.

**Confirmation status**: **Confirmed**. The guard prevents the silent-reject path.
Tauri satellite windows work correctly with `WebviewWindow`.

**Extracted lesson**: The presence of a Web API in the host environment does not
guarantee it functions as specified. In Tauri's WebView2, `window.documentPictureInPicture`
is defined but non-functional. Always gate Tauri-incompatible APIs with `&& !isTauri`.
Use `!!window.__TAURI_INTERNALS__` for reliable Tauri detection.

---

## F-WIN-02 — satellite-hidden Applied in Async Callback, Not Synchronously

**Feature scope**: `DockSystem.js` — `openSatellite()` function. The
`satellite-hidden` CSS class (`display: none !important`) hides the panel in the
main window while it lives in a satellite.

**Root cause**: The initial implementation applied `satellite-hidden` inside the
`.then()` callback of `openTauriSatellite()`. There is a visible microtask gap
between the button click (synchronous) and the async callback (after the IPC round
trip to create the Tauri window). During this gap, the panel remained visible in
the main window while the satellite was opening.

User observation: "the tauri build for windows is able to pop out a window now,
but it retains the floating panel in the main window."

**Fix**: Apply `satellite-hidden` synchronously on the first line of `openSatellite()`,
before the async call. Remove it in the failure/close paths:
```js
function openSatellite(panelId) {
  var panel = document.getElementById(panelId);
  if (!panel) return;
  if (pipPanels[panelId]) return;
  // Apply immediately — do not wait for async satellite creation.
  panel.classList.add('satellite-hidden');

  function _onWindowReady(winRef) {
    if (!winRef) {
      panel.classList.remove('satellite-hidden');  // creation failed
      return;
    }
    // ...register pipPanels entry, set up close polling
  }

  openTauriSatellite(panelId, url, w, h)
    .then(_onWindowReady)
    .catch(function() { panel.classList.remove('satellite-hidden'); });
}
```

**Confirmation status**: **Hypothetical**. Fix committed `fceb246`, merged to main
`d0d2d33`. User has not yet confirmed the panel is hidden immediately on click in
Windows Tauri.

**Extracted lesson**: Any UI state change that must be visible to the user
immediately on interaction (button click, drag start) must be applied synchronously
in the event handler — never inside an async `.then()`. Async callbacks run after
the current task, and there is always a visible frame gap in the UI between click
and callback execution.

---

## F-WIN-03 — pipPanels Entry Deleted Before Close-Path Polling Could Read panel

**Feature scope**: `DockSystem.js` — the close/return button handler in the pip
header controls. When the user clicks the return (↩) button in a satellite window,
the main window's button handler must remove `satellite-hidden` from the panel.

**Root cause**: The close path in the pip button handler was:
```js
try { pipPanels[pid].pipWin.close(); } catch(ex) {}
if (pipPanels[pid].isSatellite) {
  panel.classList.remove('satellite-hidden');
  delete pipPanels[pid];   // ← deleted here
  pipBtn.classList.remove('pip-active');
}
```
But the `setInterval` polling loop (which also fires on satellite close) ran
concurrently:
```js
var iv = setInterval(function() {
  if (winRef.closed) {
    clearInterval(iv);
    panel.classList.remove('satellite-hidden');   // reads pipPanels[panelId]
    delete pipPanels[panelId];
    // ...
  }
}, 500);
```
Both paths raced to call `delete pipPanels[pid]`. If the polling interval fired
first, the button handler found `pipPanels[pid]` already deleted, and `panel` was
undefined by the time the button handler ran.

**Fix**: Capture the entry into a local variable before the delete:
```js
if (pipPanels[pid]) {
  var _entry = pipPanels[pid];
  try { _entry.pipWin.close(); } catch(ex) {}
  if (_entry.isSatellite) {
    if (_entry.panel) _entry.panel.classList.remove('satellite-hidden');
    delete pipPanels[pid];
    pipBtn.classList.remove('pip-active');
  }
}
```

**Confirmation status**: **Hypothetical**. Fix committed `fceb246`, merged to main
`d0d2d33`. User has not yet confirmed the return button restores the panel correctly.

**Extracted lesson**: When a mutable map entry (`pipPanels[pid]`) is read across
an async boundary or a polling interval, capture the value in a local variable
before the first mutation. `delete map[key]` followed by `map[key].field` is a
null-dereference. The local captures the reference before the delete, not after.

---

## F-WIN-04 — window.close() Blanks WebView but Leaves OS Frame in Tauri

**Feature scope**: `TauriBridge.js` — the satellite window's return (↩) and
close (✕) buttons in `AppInit.js`. The buttons call the "close current window"
function.

**Root cause**: `window.close()` is the standard Web API for closing a window.
In a browser, it closes the OS frame. In Tauri, calling `window.close()` on a
`WebviewWindow` navigates the WebView to `about:blank` (emptying the content)
but leaves the OS window frame open. The result: a persistent empty white frame
the user cannot dismiss without using the OS title bar close button.

User observation: "the pop out window would become empty (white contents), but
the frame did not disappear."

**Fix**: Export a unified `closeCurrentWindow()` from `TauriBridge.js` that uses
the Tauri API when in Tauri context:
```js
export function closeCurrentWindow() {
  if (!isTauri) { window.close(); return; }
  try { getCurrentWindow().close(); } catch(e) { window.close(); }
}
```
`getCurrentWindow()` is imported from `@tauri-apps/api/window`. Its `.close()`
method sends an IPC message to the Tauri runtime, which closes the OS frame.

**Confirmation status**: **Hypothetical**. Fix committed `6b1b2f0`, merged to main
`d0d2d33`. User has not yet confirmed the satellite frame closes correctly in
Windows Tauri.

**Extracted lesson**: In Tauri, `window.close()` ≠ close the OS window. Always
route window close operations through the Tauri API (`getCurrentWindow().close()`)
when running in Tauri context. Provide a unified wrapper (`closeCurrentWindow()`)
in TauriBridge so callers do not need to branch. Never call `window.close()`
directly in code that runs in Tauri satellite windows.
