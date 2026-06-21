# Tessel Studio — UI/UX Design Reference

Qualitative descriptions of the studio UI/UX features established in `studio/tessel-vs.html`.
For machine-readable implementation details see `studio-ui-schema.yaml`.

---

## 1. Panel System

The studio has five control panels (Format, Text, Form, Outline, Properties). Each panel
can exist in one of five dock zones: left, right, top, bottom, or float.

**Left/right docked** panels are vertical strips at the edges of the canvas. They can be
collapsed to a tab strip via the `‹` button in the panel header, then re-expanded by
clicking the tab. This is the default and primary mode.

**Top/bottom docked** panels lay out horizontally across the full width. In this mode
the collapse arrow is intentionally absent — horizontal panels are on/off only, controlled
exclusively by the toolbar badge button. The collapse arrow was removed because it put the
panel into a visually disappeared state that the badge button didn't reflect, creating a
confusing mismatch between the button's "active" state and the panel's actual visibility.

**Floating panels** are undocked from the dock zones into free-floating, independently
draggable and resizable windows. The ↗ button in any panel's header undocks it; the ↙
button re-docks it to its previous zone. Floating panels persist their position and size
across page refreshes via localStorage.

---

## 2. Floating Panel Appearance

Floating panels support two visual effects adjustable in File > Options > Layout > Floating Panels:

**Transparency** (0–100%, default 70%): Makes the panel background see-through to the
content behind it. Implemented via `color-mix()` on the panel background rather than CSS
`opacity` — this is a deliberate choice. CSS `opacity` on a container cannot be overridden
by children, making per-item hover impossible. Using background transparency instead means
the panel's frame and border stay fully opaque, and individual items can restore a solid
background on mouse hover without fighting opacity inheritance.

**Blur** (0–20px, default 0): Applies `backdrop-filter: blur()` to the panel content area,
creating a frosted-glass effect. Blur has no visible effect unless transparency is also
reduced — the two settings work together.

The panel **header** (title + controls) is always rendered with a fully opaque background
regardless of the transparency setting, so the panel is always identifiable and its
drag/close controls are always accessible.

On **hover**, individual items within the panel body (format controls, outline entries,
property rows) restore a solid opaque background so the hovered item is fully readable
while the surrounding panel remains transparent.

---

## 3. Z-Index Stacking Contract

The studio maintains a deliberate z-index hierarchy to ensure the right elements are
always accessible:

- **Floating panels** (z-index 200+): panels sit above the canvas and docked UI but
  below all chrome controls.
- **Toolbar** (z-index 300): the toolbar and its File dropdown always render above floating
  panels. This required adding `position: relative` to the toolbar so that its `z-index`
  actually creates a stacking context — without a positioning context, z-index has no effect.
- **Options dialog** (z-index 900): the settings dialog sits above everything except toasts.

The key invariant: the File menu dropdown is always reachable no matter how many panels
are floating or how many times the user has focused them (each focus increments the panel's
z-index). This is enforced by the toolbar's stacking context at 300, which caps the
effective z-index of everything below it.

---

## 4. Options Dialog Persistence

The Options dialog remembers three things across page refreshes:

- **Whether it was open** — if the dialog was open when the page was last closed, it
  reopens automatically on the next load.
- **Which section was active** — the left-nav section (Layout, Animations, Menu Items,
  etc.) last visited is restored.
- **Its position** — if the user dragged the dialog, its pixel position is saved and
  restored. The position is clamped to the current viewport on restore in case the
  window size changed between sessions.

This persistence was implemented carefully to avoid an initialization order bug: the
restore logic calls `buildMenuItemsBrowser()` when the Menu Items section was last active,
but that function depends on `MIB_PANES` which is initialized later in the same IIFE.
The restore block therefore runs at the very end of the Options IIFE, after all variables
and event listeners are in place.

---

## 5. Menu Items Browser Scroll Fix

The three-column Menu Items browser (Options > Menu Items) allows scrolling the right
column to a subcategory divider when a category is selected in the middle column. For the
last subcategory, this scroll target would fail because the browser clamps `scrollTop` to
`scrollHeight - clientHeight` — without content below the last item, there isn't enough
scrollable range to bring the divider to the top.

The fix is a single CSS rule: `padding-bottom: 300px` on the items column container.
This guarantees sufficient scroll range for any divider's `offsetTop` to be reachable as
`scrollTop` regardless of how much content follows it. No JavaScript measurement, no
spacer elements, no timing races.

---

## 6. Design Decisions Summary

| Decision | Rationale |
|---|---|
| Background transparency over opacity for floating panels | opacity cannot be overridden by children; background allows per-item hover restore |
| Outer panel wrapper must be transparent | `.ctrl-pane` has `background: var(--surface)`; must be overridden to transparent so color-mix() on content container shows through |
| Toolbar needs `position: relative` | Without a positioning context, `z-index` on the toolbar has no effect and the File menu could be obscured by floating panels |
| Collapse button hidden for horizontal panes | On/off via badge button only; the arrow created an invisible-but-"active" state the badge didn't track |
| Options restore IIFE runs last | `MIB_PANES` var is initialized mid-IIFE; running restore before it caused a TypeError that silently prevented `btnOpen.addEventListener` from being registered |
| `padding-bottom` CSS fix for scroll targets | Sidesteps all JS measurement and timing issues; pure CSS guarantee |
