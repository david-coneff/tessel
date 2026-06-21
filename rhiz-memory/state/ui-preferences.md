# Tessel VS — UI Preferences & Objectives

**Scope**: `studio/tessel-vs.html` and any future UI surfaces in the Tessel project  
**Established**: 2026-06-18  
**Status**: Active — append new preferences as they are decided; do not silently revise existing ones

---

## 1. UI Objectives

These describe the intended form and function of the Tessel VS editor UI. They are
qualitative design goals, not implementation constraints. Implementation choices should
be evaluated against them.

### 1.1 Surface only what is needed, when it is needed

The UI defaults to a clean, low-noise state. Controls for a capability category (text
block operations, form field insertion) are grouped into a named pane that the user
opens intentionally via a badge button. The toolbar carries only the controls needed
for every session (file operations, panel toggles, undo/redo, preview, theme). Nothing
is surfaced by default that requires the user to dismiss or move it to reach their work.

### 1.2 Every panel is recoverably collapsible

Any panel that can be collapsed must leave a persistent, clickable handle at its
collapsed edge. A panel must never disappear entirely — the collapsed state is a
28 px tab strip showing the panel's name (rotated to read along the strip) and a
directional arrow pointing toward the canvas. The user can always re-expand a panel
without knowing which toolbar control originally opened it.

### 1.3 Layout adapts to working style, not screen size alone

The controls pane (Text / Form) supports two docking modes the user chooses
explicitly in Options:

- **Vertical** (default): 192 px left-side panel, expands/collapses horizontally
- **Horizontal**: 44 px bar directly below the toolbar, expands/collapses vertically

The choice is a preference, not an automatic breakpoint response. Both modes must
fully expose all controls with equivalent functionality.

### 1.4 Persistent menus stay open until explicitly dismissed

A menu or sub-menu that exists to let the user perform repeated insertions (e.g. the
Insert menu in the Text pane) must remain open after a selection. It closes only when
the user explicitly dismisses it (clicking outside, pressing Escape, or toggling the
pane closed). Standard dropdown menus used for single-choice operations (File menu,
Options) close on selection as normal.

### 1.5 No layout shift from scrollbars

When a scrollable container's content grows to require a scrollbar, the scrollbar
must occupy pre-reserved space rather than displacing surrounding content. This
applies to all pane scroll bodies. See §2 for the specific implementation preference.

### 1.6 Floating dialogs are bounded and draggable

Any dialog that floats over the canvas (e.g. Options) must:
- Open centered near the top of the viewport by default
- Be draggable by its header
- Be clamped to the viewport at all times — it cannot be dragged off-screen
- Close on click-outside or an explicit close button

### 1.7 State persists across page loads

All user choices that affect working context persist to `localStorage` under the
`tvs:` namespace and are restored on load. This includes: active panel, pane
open/collapsed state for all three side panels, controls layout mode (vertical /
horizontal), and theme (dark / light).

### 1.8 The canvas is always the dominant surface

The canvas area receives `flex: 1` and is never constrained by surrounding panels.
Panels shrink or collapse; the canvas does not. On any screen where panels would
crowd the canvas below a usable width, the user's recourse is to collapse panels —
the UI does not reflow panels automatically on top of or around the canvas.

---

## 2. Design Preferences (implementation-level)

Preferences are specific, decided implementation choices that apply universally across
all Tessel UI surfaces unless a future decision explicitly supersedes them.

---

### PREF-UI-001 — Scrollbar gutter reservation

| Field | Value |
|---|---|
| **Preference** | All scrollable pane containers use `scrollbar-gutter: stable` |
| **Applies to** | Every `overflow-y: auto` or `overflow-x: auto` container inside a side panel (controls body, outline list, properties body, and any future equivalents) |
| **Does not apply to** | The main canvas scroll area; absolutely-positioned dropdowns and floating menus |
| **Rationale** | When a scrollbar appears, it must occupy pre-reserved space rather than displacing surrounding content. Without this, inserting enough items to trigger a scrollbar shifts all button widths inward, causing visible layout jank. `scrollbar-gutter: stable` reserves the scrollbar track width permanently so the transition is invisible. |
| **Implementation** | `scrollbar-gutter: stable` on the container element. No JS required. |
| **Browser floor** | Chrome 94 / Firefox 97 / Edge 94 — acceptable for a local authoring tool |
| **Established** | 2026-06-18 |

---

### PREF-UI-002 — Panel collapse via tab strip, not header button alone

| Field | Value |
|---|---|
| **Preference** | Side panels (Controls, Outline, Properties) collapse to a 28 px tab strip — not to zero width |
| **Tab strip contents** | Rotated panel name (CSS `writing-mode: vertical-rl; transform: rotate(180deg)`) + directional arrow (`‹`/`›`) |
| **Arrow convention** | Points toward the canvas when collapsed (expand); points away from canvas when expanded (collapse) |
| **Click target** | The entire tab strip is clickable, not just the arrow button |
| **Rationale** | A panel collapsed to zero width is unrecoverable without knowing which toolbar control to press. The tab strip makes the panel's existence and its re-open affordance continuously visible. |
| **Established** | 2026-06-18 |

---

### PREF-UI-003 — Controls pane overflow clipped at body, not pane

| Field | Value |
|---|---|
| **Preference** | `overflow-x: hidden` and `min-width: 0` are set on `#ctrl-pane-body`, not on `#controls-pane` itself |
| **Rationale** | Setting `overflow: hidden` on the outer pane element collapses `#ctrl-pane-body`'s computed height to zero when the pane width transitions through zero during collapse animation. The height does not recover on re-open, making all controls invisible. Clipping at the body level avoids this while still preventing horizontal bleed. |
| **Established** | 2026-06-18 |
