// rootstock runtime for tessel.
//
// tessel ships as a single studio bundle that runs in both the browser and the
// Tauri webview. The capabilities wired here (dialog, notify) are DOM-based and
// behave identically in either, so the `web` entry is the correct seam for this
// first adoption. Native, target-specific capabilities (filesystem, window
// management) will move to a per-target entry (`@david-coneff/rootstock/tauri`)
// in a later pass.
import { createWebRootstock } from '@david-coneff/rootstock/web';
import '@david-coneff/rootstock/styles.css';

export const rootstock = createWebRootstock({ settingsPrefix: 'tvs:' });
