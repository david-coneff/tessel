# Tessel VS — Editor UX/UI Design Patterns

Qualitative patterns established through iterative correction during studio
development sessions. These represent the authoritative UX intent for
`studio/tessel-vs.html`. Future features should conform to these patterns
unless there is explicit reason to depart.

Each pattern includes a `schema:` block with machine-readable rules an AI
agent can apply directly when implementing or reviewing changes.

Established: 2026-06-19  
Last updated: 2026-06-19

---

## Panel / Pane System

### P-001 — Collapsed tab strip is dead space when the pane is expanded

The vertical collapsed-state tab strip must not be rendered alongside an
expanded pane. It serves one purpose: giving the user a click target to
re-expand. When expanded, the pane body is the visual anchor and the strip
is wasted real estate.

```yaml
schema:
  id: P-001
  scope: [.ctrl-pane-tab, "#outline-tab", "#props-tab"]
  rules:
    - selector: ".ctrl-pane-tab, #outline-tab, #props-tab"
      default_display: none
      active_condition: parent has class "collapsed"
      active_display: flex
    - do_not: render tab strip alongside expanded pane content
  css_pattern: |
    .ctrl-pane-tab { display: none; }
    .ctrl-pane.collapsed .ctrl-pane-tab { display: flex; }
    #outline-tab { display: none; }
    #outline-panel.collapsed #outline-tab { display: flex; }
    #props-tab { display: none; }
    #props-panel.collapsed #props-tab { display: flex; }
```

---

### P-002 — Collapse/expand carrot direction is zone-aware

The carrot (‹ / ›) must point *inward toward the edge the pane collapses to*.

```yaml
schema:
  id: P-002
  scope: [.ctrl-pane-collapse-btn, .panel-tab-arrow, "#btn-outline-collapse", "#btn-props-collapse"]
  rules:
    - dock_zone: left
      state_open:      "‹"   # points toward left edge (collapse destination)
      state_collapsed: "›"   # points toward document (invite expand)
    - dock_zone: right
      state_open:      "›"
      state_collapsed: "‹"
    - dock_zone: [top, bottom]
      note: carrot hidden entirely — see P-003
    - dock_zone: float
      note: carrot hidden entirely — see P-004
  sync_hook: _sidePanelArrowSync[panelId]()
  when_to_call_sync:
    - after dockPanel() moves panel to new zone
    - in default-zone restore path (inline, without calling dockPanel)
  do_not: hardcode arrow chars; always derive from current dock-zone class
  detection: |
    panel.classList.contains('dock-right')
      ? (isOpen ? '›' : '‹')
      : (isOpen ? '‹' : '›')
```

---

### P-003 — Horizontal dock mode (top/bottom) has no collapsed state

In top/bottom zones the pane renders as a horizontal toolbar strip.
Collapsed = `height: 0` = invisible with no affordance to recover.

```yaml
schema:
  id: P-003
  scope: [.ctrl-pane.pane-h, "#outline-panel.pane-h", "#props-panel.pane-h"]
  rules:
    - hide_elements_in_pane_h:
        - .ctrl-pane-collapse-btn
        - "#outline-content h3 .panel-tab-arrow"
        - "#props-content h3 .panel-tab-arrow"
      css: "display: none"
    - on_dock_to_top_or_bottom:
        if: panel.classList.contains('collapsed') && !panel.classList.contains('off')
        then: call _sidePanelOpenFn[panelId]()
    - badge_button: only on/off control available in horizontal mode
    - no_scrollbar_in_pane_h:
        rule: scrollbar must never appear on any element in the pane-h stack
        approach:
          - set overflow:hidden on .ctrl-pane.pane-h and .ctrl-pane-content (outer wrappers)
          - set overflow-x:auto ONLY on .ctrl-pane-body (innermost scrollable layer)
          - set scrollbar-width:none and ::-webkit-scrollbar {display:none} on .ctrl-pane-body
          - set width:auto !important on all three pane-h rules to override inline style.width
            set by the vertical resize feature
          - set scrollbar-gutter:auto on .ctrl-pane-body in pane-h mode to cancel
            the stable gutter reservation that applies in vertical mode
        do_not:
          - set overflow-x:auto on the pane or content wrapper (only body scrolls)
          - set scrollbar-gutter:stable on any element visible in pane-h mode
  css_pattern: |
    .ctrl-pane.pane-h {
      width: auto !important; overflow: hidden;
    }
    .ctrl-pane.pane-h .ctrl-pane-content {
      overflow: hidden;
    }
    .ctrl-pane.pane-h .ctrl-pane-body {
      overflow-x: auto; overflow-y: hidden;
      scrollbar-gutter: auto;
      scrollbar-width: none;
    }
    .ctrl-pane.pane-h .ctrl-pane-body::-webkit-scrollbar { display: none; }
    #outline-panel.pane-h { width: auto !important; }
    #props-panel.pane-h   { width: auto !important; }
```

---

### P-004 — Floating window mode has no collapsed state

Float is only reachable from an expanded pane. Collapse carrot is meaningless
in float mode and must be hidden.

```yaml
schema:
  id: P-004
  scope: [.dock-float]
  rules:
    - hide_in_float:
        - .ctrl-pane-collapse-btn
        - "#outline-content h3 .panel-tab-arrow"
        - "#props-content h3 .panel-tab-arrow"
      css: "display: none"
    - on_off_control: badge button only
  css_pattern: |
    .dock-float .ctrl-pane-collapse-btn { display: none; }
    .dock-float #outline-content h3 .panel-tab-arrow { display: none; }
    .dock-float #props-content h3   .panel-tab-arrow { display: none; }
```

---

### P-005 — Badge button restores the last active state, not always "open"

Turning a pane back on via badge should return it to the state it was in
before it was turned off.

```yaml
schema:
  id: P-005
  scope: [makeCtrlPane, makeSidePanel]
  state_variable: _lastActiveState   # local var inside each factory closure
  valid_values: [open, collapsed]
  update_on: [open(), collapse()]
  do_not: update on hide()           # hide() is "off", not an active state
  badge_click_logic: |
    if badge active  → hide()
    if badge inactive:
      if _lastActiveState === 'collapsed' → collapse()
      else                               → open()
  init: |
    var _lastActiveState = 'open';
    var state = ls(cfg.lsKey);
    if (state === 'collapsed') { _lastActiveState = 'collapsed'; collapse(); }
    else if (state === 'off')  { hide(); }
    else                       { open(); }
```

---

### P-006 — Pane order is preserved on expand/collapse

`open()` must never reorder the panel within its dock zone.

```yaml
schema:
  id: P-006
  scope: [makeCtrlPane.open, makeSidePanel.open]
  rules:
    - do_not: call parentElement.appendChild(panel) inside open()
    - reason: appendChild moves the element to last-child, destroying dock order
    - dom_order_is_visual_order: true
```

---

### P-007 — Expand-all / collapse-all lives in the pane body, not the title bar

```yaml
schema:
  id: P-007
  scope: [.pane-expand-all-btn]
  position:
    container: .ctrl-pane-body
    placement: absolute, top-right corner
    top: 6px
    right: 6px
  visibility: opacity 0 at rest, opacity 1 on .ctrl-pane-body:hover
  do_not: place in .ctrl-pane-header (title bar)
  reason: title bar controls = pane-level; body controls = content-level
  hidden_in: [.pane-h]   # no meaning in horizontal mode
  css_pattern: |
    .pane-expand-all-btn { position: absolute; top: 6px; right: 6px; opacity: 0; }
    .ctrl-pane-body:hover .pane-expand-all-btn { opacity: 1; }
    .pane-h .pane-expand-all-btn { display: none; }
```

---

### P-008 — Floating panes must clamp to viewport on badge toggle and window resize

A floating pane can drift off-screen if the window is resized after the pane
was positioned. Badge toggle-on and window resize must clamp it back.

```yaml
schema:
  id: P-008
  scope: [floatPanel, badge click handler, window resize]
  clamp_function: clampFloatPanel(panel)
  margin: 60px   # minimum px of pane that must remain visible on each axis
  clamp_x:
    min: MARGIN - panelWidth    # allows partial off-left
    max: window.innerWidth - MARGIN
  clamp_y:
    min: 0
    max: window.innerHeight - MARGIN
  call_on:
    - badge click when removing .off class from a dock-float panel
    - window resize event (for all visible dock-float panels)
    - floatPanel() already clamps on initial position (min/max within viewport)
  do_not: clamp during drag (user is actively repositioning)
  css_note: "dock-float panels with .off class are display:none — skip them in resize handler"
```

---

### P-009 — Vertical panes are user-resizable by dragging the inner border edge

Users can drag the innermost edge of a vertically-docked pane to adjust its
width. The handle is invisible at rest, appears as an accent-colored bar on
hover, and is suppressed in all non-vertical modes.

```yaml
schema:
  id: P-009
  scope: [.ctrl-pane, "#outline-panel", "#props-panel"]
  handle_element: .pane-width-handle
  handle_position:
    dock_left:  right edge of pane (right: 0)
    dock_right: left edge of pane  (left: 0)
  handle_css:
    width: 5px
    position: absolute
    top: 0; bottom: 0
    cursor: col-resize
    default_opacity: 0
    hover_opacity: 1
    hover_background: var(--accent)
    dragging_class: dragging
  hidden_in: [.pane-h, .dock-float, .collapsed, .off]
  min_width: 100px   # icons remain visible; text labels may be clipped
  parent_requires: position:relative
  drag_behavior:
    dock_left:  newW = startW + (e.clientX - startX)
    dock_right: newW = startW - (e.clientX - startX)   # inverted: drag left = wider
  during_drag:
    suppress_transition: add class .pane-resizing → transition: none !important
    set_body_cursor: col-resize
    set_body_user_select: none
  persistence:
    key: "tvs:pane-w:{panelId}"
    save_on: mouseup
    restore_on: page load (before handle is appended)
  inline_width_override:
    problem: inline style.width set by resize JS beats CSS width:auto in pane-h mode
    fix: use width:auto !important on all pane-h rules
```

---

## Controls & Affordances

### C-001 — Small icon buttons: quiet at rest, bordered box on hover

Pane control buttons (collapse carrot, float ↗, redock) are invisible at rest
and reveal a rounded-square border on hover.

```yaml
schema:
  id: C-001
  applies_to:
    - .ctrl-pane-collapse-btn
    - .panel-tab-arrow
    - .ctrl-pane-float-btn
  rest_state:
    background: none
    border: "1px solid transparent"
  hover_state:
    background: var(--surface2)
    border: "1px solid var(--border)"
    border_radius: 5px
    color: var(--text)
  font_sizes:
    collapse_carrot: 16px
    float_redock: 14px
  padding: "2px 5px"
  rationale: visible affordance without resting visual noise
  css_pattern: |
    .ctrl-pane-collapse-btn {
      border: 1px solid transparent; font-size: 16px;
      padding: 2px 5px; border-radius: 5px;
    }
    .ctrl-pane-collapse-btn:hover {
      background: var(--surface2); border-color: var(--border);
    }
```

---

### C-002 — State-bearing toolbar buttons reflect their active state dynamically

Buttons that represent whether something is currently open/active must use the
`.active` class toggled programmatically. A permanent `class="primary"` is
incorrect for a button whose state can change.

```yaml
schema:
  id: C-002
  pattern:
    active_class: active        # CSS: background: var(--accent); color: var(--accent-text)
    primary_class: primary      # same visual treatment — permanent, not toggled
  rule:
    use_primary: false          # only for permanently-styled CTAs with no off state
    use_active: true            # toggled on open/show, removed on close/hide
  examples:
    correct:
      - element: "#btn-preview"
        on_open:  classList.add('active')
        on_close: classList.remove('active')
    incorrect:
      - element: "<button class='primary'>Preview</button>"
        problem: "always appears active even when preview modal is closed"
  escape_key: must also trigger close + remove active
```

---

### C-003 — Segmented pill-box for binary or small-N option toggles

When offering a choice between two or more mutually-exclusive options that the
user will switch between regularly (not just set-and-forget), prefer a
pill-box segmented control over a `<select>` dropdown.

```yaml
schema:
  id: C-003
  use_when:
    - 2–4 mutually exclusive options
    - user switches between them with some frequency
    - options have short labels or can be represented by icons
  do_not_use_when:
    - more than 4 options (use select)
    - label is long prose (use radio buttons)
  structure: |
    <div class="opts-pill-group" id="my-pill">
      <div class="opts-pill-slider" id="my-slider"></div>
      <input type="radio" name="my-group" id="my-opt-a" value="a">
      <label for="my-opt-a">Option A</label>
      <input type="radio" name="my-group" id="my-opt-b" value="b">
      <label for="my-opt-b">Option B</label>
    </div>
  slider_sync: |
    function syncSlider() {
      var labels = pill.querySelectorAll('label');
      var radios = pill.querySelectorAll('input[type="radio"]');
      for (var i = 0; i < radios.length; i++) {
        if (radios[i].checked) {
          slider.style.left  = labels[i].offsetLeft + 'px';
          slider.style.width = labels[i].offsetWidth + 'px';
          break;
        }
      }
    }
  slider_timing: call syncSlider() immediately on change; also setTimeout(syncSlider, 0) on init after layout
  css_key_properties:
    pill_group: "position:relative; border-radius:20px; overflow:hidden; display:inline-flex"
    slider: "position:absolute; top:0; bottom:0; border-radius:20px; background:var(--accent); opacity:0.25; pointer-events:none; transition:left 0.18s, width 0.18s"
    label: "position:relative; z-index:1; cursor:pointer"
    checked_label: "font-weight:600; color:var(--text)"
```

---

### C-004 — Icon-driven controls must not use text labels for brevity

Controls that are permanently visible in the toolbar should communicate
through icons alone when the icon is unambiguous. Letter labels alongside
icons add noise without aiding comprehension.

```yaml
schema:
  id: C-004
  applies_to: ["#theme-pill", any toolbar icon control]
  rule:
    prefer: SVG or Unicode glyph icon only
    avoid: text labels alongside icons in toolbar pill-boxes
  exception: |
    When two adjacent icons are ambiguous without context (e.g., two
    custom duo-tone theme swatches that look similar), a minimal label
    (single letter A/B) may be added. Remove it once the icons are
    sufficiently distinct on their own.
  icon_selection:
    dark_theme:  "☾ (U+263E LAST QUARTER MOON)"
    light_theme: "☀ (U+2600 BLACK SUN WITH RAYS)"
    custom_theme: |
      SVG duo-tone circle: left half = --bg color, right half = --accent color
      <svg viewBox="0 0 13 13">
        <circle cx="6.5" cy="6.5" r="5.5" fill="BG_COLOR"/>
        <path d="M6.5 1A5.5 5.5 0 0 1 6.5 12z" fill="ACCENT_COLOR"/>
      </svg>
```

---

## Theme System

### T-001 — Theme variables use --accent-text to guarantee contrast on accent backgrounds

Hardcoding `color: #fff` on accent-colored backgrounds breaks WCAG contrast
when the accent is a light colour (e.g. yellow in High Contrast theme).

```yaml
schema:
  id: T-001
  css_variable: --accent-text
  root_default: "#fff"
  usage: |
    Every element whose background is var(--accent) must use
    color: var(--accent-text) instead of color: #fff
  affected_selectors:
    - button.active, button.primary
    - .badge-btn.active
    - .hl-btn.active
    - .mib-btn.active
    - .block-add-btn:hover
    - .field-badge
    - .theme-badge
  per_theme_override: |
    Themes with light accent colors must define --accent-text: #000000
    Example (High Contrast): --accent-text: '#000000'
  wcag_target: AA (4.5:1 for normal text), AAA (7:1) preferred for HC theme
  do_not: hardcode color:#fff on any element with background:var(--accent)
```

---

### T-002 — Theme A/B toggle is a pill-box; icons reflect slot contents, not active state label

The toolbar theme control is an icon-only pill-box. Each half shows the icon
for whichever theme is assigned to that slot. Clicking either half toggles
to the other theme (not necessarily the clicked side's theme).

```yaml
schema:
  id: T-002
  element: "#theme-pill"
  structure: |
    <div id="theme-pill">
      <button id="theme-pill-a" class="theme-pill-btn"></button>
      <button id="theme-pill-b" class="theme-pill-btn"></button>
    </div>
  icon_rules:
    id_equals_dark:   "☾ (crescent moon Unicode glyph in a <span>)"
    id_equals_light:  "☀ (sun Unicode glyph in a <span>)"
    any_other_id:     "duo-tone SVG circle using --bg and --accent from that theme's vars"
  active_indicator: ".theme-pill-btn.active { background: var(--accent); color: var(--accent-text); }"
  click_behavior: |
    BOTH buttons call the same toggleThemePill() function.
    toggleThemePill() always switches to whichever of A/B is not currently active.
    do_not: make left button activate A, right button activate B
    reason: pill is a toggle, not a selector; clicking either side flips state
  update_trigger:
    - applyTheme() always calls updateThemeBtn() at end
    - renderThemeSlots() calls updateThemeBtn() after slot assignment
    - pill click calls updateThemeBtn() via applyTheme()
  no_text_labels: true   # see C-004
```

---

### T-003 — Theme A/B slot assignment uses drag-and-drop, not Set A/Set B buttons

The Options > Themes section provides two large drop-target rectangles for
the A and B slots. Theme cards in the list below are draggable onto these
targets. Swapping is atomic when the dropped theme already occupies the
other slot.

```yaml
schema:
  id: T-003
  elements:
    slot_a: "#opts-slot-a[data-slot='a']"
    slot_b: "#opts-slot-b[data-slot='b']"
    theme_card: ".theme-card[draggable='true'][data-theme-id]"
  slot_visual:
    border: "2px dashed var(--border)"
    border_radius: 10px
    min_height: 80px
    active_slot_border: "2px solid var(--accent)"
    drag_over_style: "border-style:solid; background:rgba(91,138,240,.08)"
    cursor: grab
  slot_draggable: true   # slots themselves are draggable for slot-to-slot swap
  drop_logic: |
    var targetSlot = slot.getAttribute('data-slot');  // 'a' or 'b'
    var curA = localStorage.getItem('tvs:theme-a');
    var curB = localStorage.getItem('tvs:theme-b');
    if (targetSlot === 'a' && droppedId === curB) {
      // swap: dropped theme was in B → swap both
      localStorage.setItem('tvs:theme-a', droppedId);
      localStorage.setItem('tvs:theme-b', curA);
    } else if (targetSlot === 'b' && droppedId === curA) {
      // swap: dropped theme was in A → swap both
      localStorage.setItem('tvs:theme-b', droppedId);
      localStorage.setItem('tvs:theme-a', curB);
    } else {
      localStorage.setItem(targetSlot === 'a' ? 'tvs:theme-a' : 'tvs:theme-b', droppedId);
    }
  do_not: add "Set A" / "Set B" buttons to theme card action rows
  after_drop: call renderThemeSlots(), renderThemeList(), updateThemeBtn()
```

---

### T-004 — Theme slot visual state semantics: active, hover, drag, rest

The A/B slot area uses a two-layer visual model: an outer **slot** (the drop
zone, with a fixed position border) and an inner **card** (the theme identity
that can slide). Each interaction state has a precise visual meaning:

| State | Outer slot border | Inner card border | Card opacity |
|---|---|---|---|
| Rest (inactive) | transparent | `1.5px solid var(--border)` | 1 |
| Active (selected theme) | `2px solid var(--accent)` | unchanged | 1 |
| Hover (inactive slot only) | transparent | `1.5px dashed var(--accent)` | 1 |
| Dragging source (card in hand) | unchanged (active border stays if active) | — | 0 (card hidden) |
| Drop target (swap preview) | `2px dashed var(--accent)` on slot | `1.5px dashed var(--accent)` on ghost `::before` | card slides to source position |
| Preview mode (theme list preview) | transparent on all slots | unchanged | 1 |

```yaml
schema:
  id: T-004
  qualitative_principles:
    - The slot border communicates slot-level state (active, drop zone).
      It never travels with the card.
    - The card border communicates card-level interactivity (hover invitation,
      drop confirmation). It travels with the card.
    - Active state belongs to a slot POSITION (A or B), not a theme ID.
      Swapping cards does not move the active indicator.
    - The hover dashed border is suppressed on the active slot — dashed means
      "click to activate", which is meaningless on the already-active slot.
    - During drag, only the inner card becomes invisible (opacity 0).
      The outer slot and its border remain visible so the active indicator
      does not disappear when the user picks up a card from the active slot.

  dom_structure: |
    <div class="opts-theme-slot-wrapper">       <!-- flex column, flex:1 -->
      <div class="opts-theme-slot-label">A</div> <!-- fixed label above slot -->
      <div class="opts-theme-slot" id="opts-slot-a" data-slot="a">
        <div class="opts-theme-slot-card">       <!-- slides during drag preview -->
          <div class="opts-theme-slot-name" id="opts-slot-a-name">—</div>
          <div class="opts-theme-slot-swatches" id="opts-slot-a-swatches"></div>
        </div>
      </div>
    </div>

  css_pattern: |
    .opts-theme-slot-wrapper {
      flex: 1; display: flex; flex-direction: column;
      gap: 6px; align-items: center;
    }
    .opts-theme-slot-label {
      font-size: 15px; font-weight: 800; color: var(--text);
      line-height: 1; text-align: center;
    }
    .opts-theme-slot {
      border: 2px solid transparent; border-radius: 10px;
      padding: 10px 8px; display: flex; align-items: center;
      justify-content: center; min-height: 80px; cursor: grab;
      width: 100%; box-sizing: border-box; position: relative;
      transition: border-color .15s, background .15s;
    }
    .opts-theme-slot-card {
      display: flex; flex-direction: column; align-items: center;
      gap: 6px; width: 100%; pointer-events: none;
      border: 1.5px solid var(--border); border-radius: 7px;
      padding: 8px 6px; background: var(--surface2);
      transition: transform .22s cubic-bezier(.4,0,.2,1);
    }
    .opts-theme-slot.active-slot { border-color: var(--accent); border-style: solid; }
    .opts-theme-slot:not(.active-slot):hover { background: var(--surface2); }
    .opts-theme-slot:not(.active-slot):not(.no-hover):hover .opts-theme-slot-card {
      border-color: var(--accent); border-style: dashed;
    }
    .opts-theme-slot.dragging-source { pointer-events: none; background: transparent !important; }
    .opts-theme-slot.dragging-source .opts-theme-slot-card { opacity: 0; }
    .opts-theme-slot.drop-target { background: rgba(91,138,240,.08); z-index: 2; }
    .opts-theme-slot.drop-target::before {
      content: ''; position: absolute; inset: 10px 8px;
      border: 1.5px dashed var(--accent); border-radius: 7px;
      pointer-events: none;
    }

  key_implementation_decisions:
    - label_above_card: |
        The A/B label is placed in the wrapper ABOVE the slot element,
        not inside the card. This prevents the label from appearing to
        rename itself when the card slides to the other slot during a
        swap preview.
    - two_layer_border_model: |
        Outer slot border = slot-position state (active, drop-zone).
        Inner card border = interactive affordance (hover, drag feedback).
        Separating these into two DOM elements was necessary to let
        the card animate independently of the slot indicator.
    - source_slot_background_transparent: |
        When dragging, setting background:transparent !important on the
        dragging-source slot is required so the card sliding in from the
        other slot is visible as it translates over the source area.
    - z_index_on_drop_target: |
        The drop-target slot needs z-index:2 so its sliding card paints
        on top of the source slot element (first in DOM order).
```

---

### T-005 — Pill-box active indicator uses a sliding span, not background on the button

```yaml
schema:
  id: T-005
  element: "#theme-pill"
  approach: absolute-positioned sliding span behind the buttons
  structure: |
    <div id="theme-pill" title="Toggle theme A/B">
      <span id="theme-pill-slider"></span>
      <button id="theme-pill-a" class="theme-pill-btn"></button>
      <button id="theme-pill-b" class="theme-pill-btn"></button>
    </div>
  css_pattern: |
    #theme-pill { position: relative; overflow: hidden; }
    #theme-pill-slider {
      position: absolute; top: 2px; bottom: 2px; border-radius: 16px;
      background: var(--accent); pointer-events: none; z-index: 0;
      transition: left .18s cubic-bezier(.4,0,.2,1), width .18s cubic-bezier(.4,0,.2,1);
    }
    .theme-pill-btn { position: relative; z-index: 1; background: none; }
    .theme-pill-btn.active { color: var(--accent-text); }
  js_sync: |
    var activeBtn = activeSlot === 'a' ? btnA : btnB;
    slider.style.left  = activeBtn.offsetLeft + 'px';
    slider.style.width = activeBtn.offsetWidth + 'px';
    slider.style.opacity = previewing ? '0' : '1';
  do_not:
    - set background on .theme-pill-btn.active
    - animate with JS setInterval
  preview_mode: set slider opacity to 0 when previewing
```

---

### T-006 — Card swap drag interaction: source hides, other card slides, ghost drop zone appears

```yaml
schema:
  id: T-006
  drag_start:
    defer_hide: use setTimeout(0) so browser captures drag image before card is hidden
  drag_over:
    idempotency: guard class changes with classList.contains() — ondragover fires 60/s
    slide_preview: translateX(sourceSlot.offsetLeft - slot.offsetLeft) on hovered card
  drag_leave:
    false_trigger_guard: "if (rel && (rel === slot || slot.contains(rel))) return;"
  drag_end:
    transition_suppression: |
      slot.style.transition = 'none'; slot.classList.remove('dragging-source');
      void slot.offsetWidth; slot.style.transition = '';
  drop:
    instant_reset: resetSlotDragClasses(true) before re-render
    apply_active_slot_theme: applyTheme(localStorage['tvs:theme-' + activeSlot])
```

---

### T-007 — Active slot tracks slot position (A or B), not theme ID

```yaml
schema:
  id: T-007
  storage_key: "tvs:active-slot"
  values: ["a", "b"]
  set_when:
    - user clicks slot card
    - user clicks pill toggle
    - NOT on card swap (position stays, theme changes)
  render_rule: "slot.classList.toggle('active-slot', !previewing && activeSlot === slotName)"
  migration: derive from tvs:active-theme on first load if tvs:active-slot absent
```

---

### T-008 — Preview mode suppresses active indicators without changing slot assignment

```yaml
schema:
  id: T-008
  storage_key: "tvs:previewing"
  set_when: user clicks [data-theme-preview]
  clear_when: [slot click, pill toggle, card swap drop]
  visual_effect: [active-slot border off, pill slider opacity 0, pill .active removed]
  do_not: skip renderThemeList() in slot onclick — needed to clear list outline
```

---

### T-009 — List-to-slot drag: card border only, live theme preview during hover

When a theme card is dragged from the theme list (not from an A/B slot) and
hovered over a slot, only the inner card border goes dashed — the outer slot
border does not change. The card content updates live to preview the dragged
theme before the drop is confirmed.

```yaml
schema:
  id: T-009
  drag_source_flag:
    variable: _dragFromList
    set_true_in:  theme-card dragstart
    set_false_in: theme-card dragend AND slot ondragstart
  css_pattern: |
    .opts-theme-slot.drag-over-list .opts-theme-slot-card {
      border-color: var(--accent); border-style: dashed;
    }
  slot_ondragover_logic: |
    if (_dragFromList) {
      if (!slot.classList.contains('drag-over-list')) {
        slot.classList.remove('drag-over', 'drop-target', 'drag-over-list');
        slot.classList.add('drag-over-list');
      }
      var card = slot.querySelector('.opts-theme-slot-card');
      if (card && card.getAttribute('data-preview-id') !== _draggedThemeId) {
        card.setAttribute('data-preview-id', _draggedThemeId);
        // update name + swatches to show dragged theme
      }
      return;
    }
  data_preview_id_guard: |
    Guard live-preview DOM writes with data-preview-id attribute check to avoid
    DOM thrash on every 60fps ondragover event when hovering in place.
  restore_helper: |
    function restoreSlotCard(slot) { /* repopulate from localStorage tvs:theme-{slot} */ }
    // Call on: ondragleave, ondrop, resetSlotDragClasses
```

---

### T-010 — Preview active-slot border when previewing a slot theme; list outline only on Preview

```yaml
schema:
  id: T-010
  storage_key: "tvs:previewing-theme"
  set_when: user clicks [data-theme-preview]
  clear_when: same as tvs:previewing
  slot_active_border_rule: |
    var previewingTheme = localStorage.getItem('tvs:previewing-theme');
    slot.classList.toggle('active-slot',
      (!previewing && activeSlot === slotName) ||
      (previewing && !!previewingTheme && previewingTheme === themeId)
    );
  theme_list_outline_rule: |
    var isActive = (listPreviewing && t.id === activeId)
      ? ' style="outline:2px solid var(--accent);"' : '';
    // Outline ONLY in preview mode — not on slot/pill selection.
  rationale: |
    List outline answers "what am I previewing?" (preview-mode only).
    Slot border answers "which slot is selected?" (always).
    The slot can additionally answer "is my theme being previewed?" in preview mode.
```

---

### T-011 — Theme list reorder via drag handle with live FLIP animation

Theme cards can be reordered by dragging a grip handle (⠿) on the left side.
The drag shows a live placeholder with a dimmed card preview. Surrounding
cards animate smoothly to their new positions using the FLIP technique.

```yaml
schema:
  id: T-011

  persistence:
    storage_key: "tvs:theme-order"
    format: JSON array of theme IDs
    getAllThemes_logic: |
      Apply stored order to THEMES+customs map; append unknown themes at end.

  drag_mode_flag:
    variable: _dragMode   # 'slot' | 'reorder'
    set_reorder: handle dragstart
    set_slot:    handle dragend + container ondrop
    purpose: slot ondragover early-returns when _dragMode === 'reorder'

  handle:
    html: '<span class="theme-drag-handle" draggable="true" data-handle-for="{id}">⠿</span>'
    placement: first child of .theme-card
    mousedown: e.stopPropagation() to prevent card's own dragstart

  placeholder:
    class: theme-list-placeholder
    content: cloneNode(true) of source card at 45% opacity
    insert: setTimeout(0) after dragstart so browser captures drag image first
    source_card_hiding: display:none (not visibility:hidden — must collapse from flow)
    css: |
      .theme-list-placeholder {
        border: 1.5px dashed var(--accent); border-radius: 9px;
        padding: 4px; background: rgba(91,138,240,.05);
        pointer-events: none;
      }
      .theme-list-placeholder .theme-card { opacity: 0.45; pointer-events: none; }
      .theme-card.reorder-dragging { display: none; }
    rationale_display_none: |
      visibility:hidden keeps card in flow — creates double-gap alongside placeholder.
      display:none collapses it so placeholder occupies exactly one card's space.

  insertion_point:
    function: getInsertionPoint(e)
    coordinate_fix: |
      offsetTop is relative to offsetParent, NOT the viewport.
      Convert: mouseY = e.clientY - cards[0].offsetParent.getBoundingClientRect().top
      Do NOT use container.getBoundingClientRect().top — container may not be offsetParent,
      causing all drops to register at the wrong position (typically always top of list).
    stability: |
      offsetTop is unaffected by CSS transforms, so insertion point is stable
      during FLIP animations (no feedback loop).

  flip_animation:
    trigger: each time placeholder moves to a new DOM position
    guard: skip if placeholder.nextSibling === newNext (no position change)
    code: |
      // Snapshot natural positions (offsetTop, transform-unaffected)
      cards.forEach(c => beforeTops[id] = c.offsetTop);
      // Move placeholder
      container.insertBefore(_placeholder, ...);
      // Animate each card
      cards.forEach(c => {
        var delta = beforeTops[id] - c.offsetTop;  // same offsetParent → correct delta
        if (Math.abs(delta) < 1) return;
        c.style.transition = 'none';
        c.style.transform  = 'translateY(' + delta + 'px)';
        void c.offsetWidth;  // force reflow
        c.style.transition = 'transform 0.14s ease';
        c.style.transform  = '';
      });
    feedback_loop_prevention: |
      Using getBoundingClientRect() for both insertion point and FLIP snapshots
      causes a feedback loop: mid-animation positions shift the computed midpoint,
      toggling the insertion point, triggering more animations.
      Fix: use offsetTop throughout (transform-unaffected).

  drop_commit:
    source: placeholder DOM position (nextElementSibling / previousElementSibling)
    action: rebuild id order array, splice dragged id to new position, saveThemeOrder(ids)
```

---

### T-012 — Suppress stale hover border on non-drop-target slot after card swap

```yaml
schema:
  id: T-012
  symptom: |
    After a slot-to-slot drag-drop swap, the slot NOT receiving the drop
    briefly shows a dashed card hover border even though the mouse is not over it.
  root_cause: |
    Browser retains stale :hover on the non-targeted slot after DOM re-render
    triggered by ondrop → renderThemeSlots().
  fix:
    css: |
      .opts-theme-slot:not(.active-slot):not(.no-hover):hover .opts-theme-slot-card {
        border-color: var(--accent); border-style: dashed;
      }
    js: |
      var otherSlot = (targetName === 'a') ? sB : sA;
      if (otherSlot) otherSlot.classList.add('no-hover');
      function clearNoHover() {
        if (otherSlot) otherSlot.classList.remove('no-hover');
        document.removeEventListener('mousemove', clearNoHover);
      }
      document.addEventListener('mousemove', clearNoHover);
  scoping_rule: |
    Apply no-hover ONLY to the OTHER slot (not the drop target).
    Drop target is where mouse is — should express hover normally.
```

---

## Dialog / Overlay Positioning

### D-001 — Draggable dialogs clamp above the toolbar

```yaml
schema:
  id: D-001
  applies_to: ["#options-dialog", any future draggable overlay]
  clamp:
    min_y: document.getElementById('toolbar').getBoundingClientRect().bottom
    max_y: window.innerHeight - dialog.offsetHeight
    min_x: 0
    max_x: window.innerWidth - dialog.offsetWidth
  clamp_applies_to: [drag onMove handler, position restore on open]
```

---

### D-002 — Resizable dialogs use a corner grip; size is persisted

```yaml
schema:
  id: D-002
  applies_to: ["#options-dialog"]
  grip: "#options-dialog-resize"
  resize_target:
    width: dialog element
    height: "#options-dialog-main" (content area only)
  min_width: 480px
  min_height: 280px
  persistence_key: "tvs:opts:size"
  do_not: resize entire dialog height (header stays fixed)
```

---

## Dock Zone Behaviour

### Z-001 — dockPanel() is the single point of truth for zone transitions

```yaml
schema:
  id: Z-001
  function: dockPanel(panelId, zone)
  responsibilities:
    - dom_move, class_update, float_cleanup, arrow_sync
    - auto_open_if_horizontal, options_dock_button_sync, localStorage
  default_zone_restore_path:
    note: skips dockPanel to avoid DOM move; must manually replicate all steps
```
