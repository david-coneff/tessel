# Tessel UI Modularization Plan

**Base branch:** `claude/confident-fermat-1cqfr3`  
**Work branch:** `claude/focused-johnson-qbhnmb`

---

## Codebase Snapshot (as of plan date)

`studio/tessel-vs.html` is the primary application — a single-file monolith of ~8,450 lines:
- **CSS:** ~1,175 lines (embedded `<style>`)
- **HTML:** ~700 lines (layout shell)
- **JS:** ~6,600 lines (single IIFE, ~100 functions, procedural)
- **No build pipeline, no module system, no external UI libraries** (only `tessel.bundle.js`)
- Pane/dock/floating/dialog code is inline and non-uniform
- Form controls are native HTML or one-off custom implementations
- All state lives in IIFE-scoped variables

Each phase below is scoped to be completable within a single session window. Phases must be done in order — each one is a prerequisite for the next.

---

## Phase 0 — Build Scaffold

**Goal:** Establish a minimal build pipeline so subsequent phases can produce separate source files that compile back to the single-file output the browser consumes. Keeps the working app intact throughout.

### Tasks

0.1 **Audit existing build tooling**  
Check `compiler/`, `tools/`, `package.json` (if any) for any existing bundler/build scripts. Document what exists.

0.2 **Add `package.json` + Vite (or esbuild) dev setup**  
- `npm init` + install Vite (lightweight, zero-config, fast HMR)
- Configure single entry point: `studio/src/main.js`
- Configure output to write `studio/dist/tessel-vs.html` (inlined script+style, matching current format)
- Verify existing `tessel-vs.html` still works unmodified as a baseline

0.3 **Create `studio/src/` scaffold**  
```
studio/src/
  index.html          ← shell (just the HTML skeleton)
  main.js             ← entry point, imports all modules
  styles/
    variables.css     ← CSS custom properties + theme vars
    base.css          ← reset, layout, typography
    themes.css        ← dark/light + theme editor overrides
  lib/
    utils.js          ← uid(), slugify(), esc(), debounce()
    metadata.js       ← FIELD_TYPES, INSERT_MENU_ITEMS (data only)
```

0.4 **Migrate CSS to separate files (no logic change)**  
Cut the 1,175-line embedded `<style>` block verbatim into the three CSS files above. Verify visual output is identical.

0.5 **Migrate JS into `main.js` (no logic change)**  
Cut the 6,600-line IIFE verbatim into `main.js`. Build should produce identical output. This is purely a file-move; zero logic changes.

**Exit criteria:** `npm run build` produces a `tessel-vs.html` that passes a visual diff against the original.

---

## Phase 1 — Extract Utility & Metadata Modules

**Goal:** Pull the stateless, side-effect-free code out of `main.js` into importable modules. Zero behavior change.

### Tasks

1.1 **`lib/utils.js`**  
Move: `uid()`, `slugify()`, `esc()`, `debounce()`, `decodeB64Utf8()`, `getTessel()`  
Export each. Update call sites in `main.js` to import.

1.2 **`lib/metadata.js`**  
Move: `FIELD_TYPES` object, `INSERT_MENU_ITEMS` array  
Export both. Update all references.

1.3 **`lib/blocks.js`**  
Move: pure block-tree functions: `getBlock()`, `findBlockInTree()`, `insertBlock()`, `deleteBlock()`, `reorderBlock()`, `serializeBlock()`, `serializeBlocks()`, `astToBlocks()`, `nodeToBlock()`  
These take `blocks` as a parameter (no DOM side effects) — extract them as pure functions.  
Export all. Wire up in `main.js`.

1.4 **`lib/undo.js`**  
Move: `pushUndo()`, `undo()`, `redo()`, `updateUndoButtons()` + undo/redo stack state  
Expose as a small module with its own internal state (closure or class).

**Exit criteria:** `main.js` sheds ~300 lines. No visible behavior change.

---

## Phase 2 — Modular Form Controls (`tessel-ui`)

**Goal:** Create `studio/src/tessel-ui/` — a small component library of theme-aware form controls. Every instance of a control type across the app references the same factory/class. Updating the component updates all instances.

**Icon strategy:** Lucide icons first (tree-shakeable SVG). Fallback: emoji-to-SVG conversion helper.

### Tasks

2.1 **Install Lucide**  
`npm install lucide` (or `lucide-static` for SVGs). Wire a helper `icon(name)` that returns an SVG element. Fallback: `emojiToSvg(char)` for any icon not in Lucide.

2.2 **Define `tessel-ui` component contract**  
Create `studio/src/tessel-ui/index.js` as the public API. Every control exports a factory function `make<Control>(options) → HTMLElement`. Controls auto-inherit current CSS variables; no inline style overrides.

2.3 **Implement base controls**  
Each control in its own file under `tessel-ui/`:

| File | Controls |
|------|----------|
| `Button.js` | `makeButton({ label, icon, variant, onClick })` — variants: primary, ghost, icon-only, badge |
| `Toggle.js` | `makeToggle({ label, checked, onChange })` — styled checkbox/switch |
| `TextInput.js` | `makeTextInput({ label, placeholder, value, onChange })` |
| `Select.js` | `makeSelect({ label, options, value, onChange })` |
| `Slider.js` | `makeSlider({ label, min, max, value, onChange })` |
| `ColorPill.js` | `makeColorPill({ color, active, onClick })` — theme color swatch |
| `Separator.js` | `makeSeparator()` — toolbar divider |

2.4 **Replace one-off toolbar controls**  
Audit `#toolbar` button markup and inline creation in `main.js`. Replace with `makeButton()` / `makeSeparator()` calls. Verify visual parity.

2.5 **Replace one-off properties-panel controls**  
The `renderProps()` function builds ad-hoc inputs via `mkInput()`, `mkCheckRow()`, `mkPropRow()`. Replace these with `tessel-ui` controls. `mkInput` → `makeTextInput`, `mkCheckRow` → `makeToggle`, etc.

2.6 **Replace options dialog controls**  
Sliders (`#opts-float-opacity`, `#opts-float-blur`) → `makeSlider()`.  
Color pills in theme editor → `makeColorPill()`.  
All option toggles → `makeToggle()`.

**Exit criteria:** Zero inline `document.createElement('input')` / `createElement('button')` calls outside of `tessel-ui/`. Visual parity confirmed.

---

## Phase 3 — Floating Pane Module

**Goal:** Extract a reusable `FloatingPane` class that encodes all floating-window behaviors (positioning, clamping to viewport, drag, resize, opacity/blur, z-order). Every dialog/floater becomes an instance of this class. Changing clamping logic changes it everywhere.

### Current floating elements (all to be unified):
- `#options-dialog` (resizable, draggable options modal)
- `#datefmt-help-dialog` (date format helper floater)
- `#insert-float` (context menu near cursor)
- `#preview-modal` (full-screen overlay — special case, not a floater)

### Tasks

3.1 **Define `FloatingPane` class** → `studio/src/components/FloatingPane.js`

```js
class FloatingPane {
  constructor({ id, title, content, resizable, width, height })
  show(anchorX, anchorY)   // position near anchor, then clamp
  hide()
  clamp()                  // keep within viewport + below menu bar
  setOpacity(v)
  setBlur(v)
  bringToFront()           // z-order management
  // internal: drag header to move, clamp on resize/scroll
}
```

Clamping rules (formalize from current ad-hoc code):
- Never overlap the main menu bar (respect `--toolbar-h` CSS var)
- Never go outside viewport edges
- On window resize, re-clamp all open floaters
- Z-order pool: floaters share a base z-index, clicking brings to front

3.2 **Refactor `#options-dialog` → `FloatingPane` instance**  
Replace inline `options-dialog` resize/drag code with `FloatingPane`. Keep all option section contents unchanged.

3.3 **Refactor `#datefmt-help-dialog` → `FloatingPane` instance**  
Same approach — wrap existing date-picker HTML in `FloatingPane`.

3.4 **Refactor `#insert-float` → `FloatingPane` instance**  
`insert-float` is a context menu variant: no title bar, no resize, positioned near cursor. Add `variant: 'context-menu'` option to `FloatingPane` to suppress those chrome elements while reusing clamping.

3.5 **`#preview-modal` — exclude from FloatingPane**  
This is a full-screen overlay (not a floater). Keep it as-is but give it its own `PreviewModal` class for clarity.

3.6 **Global window-resize handler**  
Register one `window.resize` listener that calls `clamp()` on all open `FloatingPane` instances. Remove any per-dialog resize listeners.

**Exit criteria:** Drag a floater to a corner, resize the window — all floaters snap inside viewport + below menu bar. Behavior is identical across all floating elements.

---

## Phase 4 — Docked Pane Module

**Goal:** Extract a `DockedPane` class that standardizes all docked-pane behavior. A pane's title and body content are injected; all chrome (collapse caret, undock button, scroll, orientation-responsive behavior) is provided by the class.

### Current docked panes (all to become instances):
- `#format-pane`
- `#text-pane`
- `#form-pane`
- `#outline-panel`
- `#props-panel`

### Required behaviors to standardize:
- **Collapse to side caret** (vertical mode) — single toggle
- **Expand/collapse subcategory carets** inside pane body
- **Undock button** → moves pane to `FloatingPane` (calls Phase 3 system)
- **Vertical mode** vs **horizontal mode** behaviors:
  - Vertical: normal top-to-bottom scroll, scrollbar space reserved
  - Horizontal: items wrap to 2+ rows when space is tight; shift+scroll for horizontal scroll; left/right click carets when items overflow
- **Zone awareness**: pane knows which dock zone it is in (`left`, `right`, `top`, `bottom`, `float`) and re-styles accordingly

### Tasks

4.1 **Define `DockedPane` class** → `studio/src/components/DockedPane.js`

```js
class DockedPane {
  constructor({ id, title, content, zone })
  setZone(zone)           // 'left'|'right'|'top'|'bottom'|'float'
  collapse()
  expand()
  undock()                // convert to FloatingPane
  addSubcategory({ title, content, collapsed })  // expandable section inside pane
  // internal: scroll handling, caret rendering, resize observation
}
```

4.2 **Migrate `#format-pane`** to `DockedPane` instance  
Content (format controls) injected unchanged; chrome replaced by `DockedPane`.

4.3 **Migrate `#text-pane`, `#form-pane`** to `DockedPane` instances  
Same approach.

4.4 **Migrate `#outline-panel`, `#props-panel`** to `DockedPane` instances  
These have simple contents — straightforward migration.

4.5 **Horizontal mode scroll & caret behavior**  
Implement inside `DockedPane`: when zone is `top` or `bottom`, enable horizontal mode — `shift+scroll` for horizontal scroll, show left/right click carets when content overflows.

4.6 **Undock wiring**  
Connect `DockedPane.undock()` to Phase 3 `FloatingPane` — undocked pane becomes a floater. Re-docking a floater back to a zone calls `setZone()` on its `DockedPane`.

**Exit criteria:** All five panes have consistent chrome. Undock any pane → it becomes a `FloatingPane`. Re-dock → returns to `DockedPane`. Horizontal zone panes support shift+scroll and overflow carets.

---

## Phase 5 — Main Menu Module

**Goal:** Formalize the main menu (`#toolbar`) as a first-class `MainMenu` object with documented properties that make it a "unicorn" — highest z-order, anchor for viewport clamping of all floaters and docked panes.

### Special properties to formalize:
- **Z-order supremacy:** `MainMenu` always renders above everything (fixed `z-index` ceiling)
- **Clamping anchor:** `FloatingPane.clamp()` and `DockedPane` layout both read `MainMenu.bottomEdge` to know the exclusion zone
- **File menu integration:** New, Open, Save, Export actions wired as menu items
- **Pane toggle buttons:** Badge buttons that toggle `DockedPane` visibility
- **Orientation toggle:** Switch between vertical (side docks) and horizontal (top/bottom docks) layout modes

### Tasks

5.1 **Define `MainMenu` class** → `studio/src/components/MainMenu.js`

```js
class MainMenu {
  constructor({ el, onFileAction, panes })
  get bottomEdge()       // px from top — FloatingPane reads this
  addButton({ icon, label, action, group })
  addPaneToggle(dockedPane)    // adds badge button for a DockedPane
  addSeparator()
  setOrientation('vertical'|'horizontal')
  // internal: manages button groups, overflow, keyboard shortcuts
}
```

5.2 **Migrate existing `#toolbar` to `MainMenu`**  
All badge buttons, action buttons, separators created via `MainMenu.addButton()` / `addPaneToggle()`. Button icon uses `tessel-ui` `makeButton()` from Phase 2.

5.3 **Wire `MainMenu.bottomEdge` into `FloatingPane.clamp()`**  
FloatingPane reads `mainMenu.bottomEdge` instead of hard-coded offset.

5.4 **Wire `MainMenu.bottomEdge` into dock layout CSS**  
Set a CSS custom property `--menu-bottom` from `MainMenu.bottomEdge`. Dock zone CSS uses this var for top offset.

5.5 **Orientation mode**  
Connect orientation toggle in options dialog to `MainMenu.setOrientation()`, which updates `DockedPane` zone assignments.

**Exit criteria:** `MainMenu` is a self-contained object. Moving or resizing the menu bar automatically updates clamping for all floaters and dock zones. Adding a new badge button for a new pane is a single `addPaneToggle()` call.

---

## Phase 6 — Shoelace Integration

**Goal:** Add Shoelace as a second-tier component library. Tessel-ui controls take precedence; Shoelace fills gaps for controls without a tessel-ui override.

### Tasks

6.1 **Install Shoelace**  
`npm install @shoelace-style/shoelace`. Configure Vite to bundle required components only (tree-shaking). Import Shoelace base theme CSS.

6.2 **Map tessel-ui controls to Shoelace equivalents**  

| tessel-ui | Shoelace fallback |
|-----------|------------------|
| `makeButton()` | `<sl-button>` |
| `makeToggle()` | `<sl-switch>` |
| `makeTextInput()` | `<sl-input>` |
| `makeSelect()` | `<sl-select>` |
| `makeSlider()` | `<sl-range>` |
| `ColorPill` | (no equivalent — tessel-ui only) |
| *(date picker)* | `<sl-input type="date">` + custom overlay |

6.3 **Update `tessel-ui/index.js` fallback resolution**  
Each factory checks: does a tessel-ui implementation exist for this control? If yes, use it. If no, instantiate and return the Shoelace web component. This means `makeSelect()` can be a thin wrapper that returns `<sl-select>` until a custom version is written.

6.4 **Theme bridge**  
Map Shoelace CSS custom properties (`--sl-color-primary-*`) to tessel CSS variables. Create `styles/shoelace-bridge.css` that re-maps Shoelace tokens to tessel tokens so Shoelace components respect the active theme.

6.5 **Replace native selects and inputs in options dialog**  
Options dialog has several native `<select>` and `<input>` elements. Replace with `makeSelect()` / `makeTextInput()` calls (which now fall through to Shoelace where no tessel-ui version exists).

**Exit criteria:** App uses no naked `<input>`, `<select>`, or `<button>` HTML outside of `tessel-ui` factory calls. Shoelace fills the gaps. Theme switching changes Shoelace component colors.

---

## Phase 7 — Tessel-UI Customization Layer

**Goal:** Make the abstraction explicit and reusable as a pattern. Any tessel-ui control can be customized without touching Shoelace. The resolution order is: **tessel-ui override → Shoelace → native HTML fallback**.

### Tasks

7.1 **Formalize the resolver**  
Create `tessel-ui/resolver.js`:
```js
// Resolution order: tessel-ui → shoelace → native
export function resolve(controlName) {
  return TESSEL_OVERRIDES[controlName]
    ?? SHOELACE_MAP[controlName]
    ?? NATIVE_MAP[controlName];
}
```
Every `make<Control>()` factory calls `resolve()` internally.

7.2 **Document the override pattern**  
Comment in `tessel-ui/index.js` explaining how to add a tessel-ui override:
1. Create `tessel-ui/overrides/<ControlName>.js` exporting a factory function matching the Shoelace component's API signature
2. Add entry to `TESSEL_OVERRIDES` in resolver
3. Done — all call sites automatically use the new version

7.3 **Implement first tessel-ui override: `Button`**  
Tessel's existing button style (ghost, icon-only, badge variants) differs from Shoelace's defaults. Write `tessel-ui/overrides/Button.js` implementing tessel's button design. Shoelace `<sl-button>` never appears in tessel-vs output; tessel-ui `Button` does.

7.4 **Implement second override: `ColorPill`**  
No Shoelace equivalent exists. `tessel-ui/overrides/ColorPill.js` is purely tessel-native.

7.5 **Smoke-test the full stack**  
Verify: removing a tessel-ui override falls back to Shoelace. Removing the Shoelace map entry falls back to native. Theme switch updates all control layers.

**Exit criteria:** Adding a new customized control anywhere in the app requires only: (1) write the override file, (2) register it in the resolver. Zero changes to call sites.

---

## Execution Order Summary

```
Phase 0 — Build scaffold           (prerequisite for everything)
Phase 1 — Utils & metadata modules (low risk, high leverage)
Phase 2 — tessel-ui controls       (enables Phases 3–5 chrome)
Phase 3 — FloatingPane module      (standardizes all floaters)
Phase 4 — DockedPane module        (standardizes all docked panes)
Phase 5 — MainMenu module          (ties floaters + docks together)
Phase 6 — Shoelace integration     (requires Phase 2 resolver)
Phase 7 — Tessel-UI override layer (completes the abstraction)
```

Phases 3, 4, and 5 can be done in any order relative to each other once Phase 2 is complete, but all three must complete before Phase 5's clamping wiring makes full sense.

---

## Session Window Sizing Guide

Each numbered task (e.g., `3.2`, `4.5`) is designed to be completable in one session. Sub-tasks within a phase that share no dependencies can be parallelized across agents. Phases 0 and 1 are purely mechanical (file splits, no logic changes) and are the safest starting points.

**Rough effort estimates:**

| Phase | Sessions | Risk |
|-------|----------|------|
| 0 | 1–2 | Low |
| 1 | 1 | Low |
| 2 | 2–3 | Medium |
| 3 | 2 | Medium |
| 4 | 2–3 | Medium |
| 5 | 1–2 | Medium |
| 6 | 1–2 | Low-Medium |
| 7 | 1 | Low |
