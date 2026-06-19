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
      state_open:      "‹"
      state_collapsed: "›"
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
  detection: |
    var onRight = pane.classList.contains('dock-right');
    if (onRight) return isOpen ? '›' : '‹';
    return isOpen ? '‹' : '›';
```

---

### P-003 — Horizontal dock mode (top/bottom) has no collapsed state

In top/bottom zones the pane renders as a horizontal toolbar strip.
Collapsed = height: 0 = invisible with no affordance to recover.

```yaml
schema:
  id: P-003
  scope: [.ctrl-pane.pane-h, "#outline-panel.pane-h", "#props-panel.pane-h"]
  rules:
    - hide_in_pane_h: [.ctrl-pane-collapse-btn, "#outline-content h3 .panel-tab-arrow", "#props-content h3 .panel-tab-arrow"]
    - auto_open_if_collapsed_on_dock_to_horizontal: true
    - no_scrollbar_in_pane_h:
        overflow_hidden_on: [.ctrl-pane.pane-h, .ctrl-pane-content.pane-h]
        overflow_x_auto_only_on: .ctrl-pane-body
        scrollbar_hidden: "scrollbar-width:none; ::-webkit-scrollbar {display:none}"
        scrollbar_gutter: auto (cancel stable gutter in pane-h)
        width_auto_important: true (beats inline style.width from resize JS)
  css_pattern: |
    .ctrl-pane.pane-h { width: auto !important; overflow: hidden; }
    .ctrl-pane.pane-h .ctrl-pane-content { overflow: hidden; }
    .ctrl-pane.pane-h .ctrl-pane-body {
      overflow-x: auto; overflow-y: hidden;
      scrollbar-gutter: auto; scrollbar-width: none;
    }
    .ctrl-pane.pane-h .ctrl-pane-body::-webkit-scrollbar { display: none; }
    #outline-panel.pane-h, #props-panel.pane-h { width: auto !important; }
```

---

### P-004 — Floating window mode has no collapsed state

```yaml
schema:
  id: P-004
  scope: [.dock-float]
  rules:
    - hide: [.ctrl-pane-collapse-btn, "#outline-content h3 .panel-tab-arrow", "#props-content h3 .panel-tab-arrow"]
  css_pattern: |
    .dock-float .ctrl-pane-collapse-btn { display: none; }
    .dock-float #outline-content h3 .panel-tab-arrow { display: none; }
    .dock-float #props-content h3   .panel-tab-arrow { display: none; }
```

---

### P-005 — Badge button restores the last active state, not always "open"

```yaml
schema:
  id: P-005
  scope: [makeCtrlPane, makeSidePanel]
  state_variable: _lastActiveState
  valid_values: [open, collapsed]
  update_on: [open(), collapse()]
  do_not_update_on: hide()
  badge_click_logic: |
    if active → hide()
    if inactive:
      if _lastActiveState === 'collapsed' → collapse()
      else → open()
  init: |
    var _lastActiveState = 'open';
    var state = ls(cfg.lsKey);
    if (state === 'collapsed') { _lastActiveState = 'collapsed'; collapse(); }
    else if (state === 'off')  { hide(); }
    else                       { open(); }
```

---

### P-006 — Pane order is preserved on expand/collapse

```yaml
schema:
  id: P-006
  scope: [makeCtrlPane.open, makeSidePanel.open]
  rules:
    - do_not: call parentElement.appendChild(panel) inside open()
    - reason: appendChild moves element to last-child, destroying dock order
    - dom_order_is_visual_order: true
```

---

### P-007 — Expand-all / collapse-all lives in the pane body, not the title bar

```yaml
schema:
  id: P-007
  scope: [.pane-expand-all-btn]
  position: absolute, top-right of .ctrl-pane-body (top:6px; right:6px)
  visibility: opacity 0 at rest, opacity 1 on .ctrl-pane-body:hover
  hidden_in: [.pane-h]
  css_pattern: |
    .pane-expand-all-btn { position: absolute; top: 6px; right: 6px; opacity: 0; }
    .ctrl-pane-body:hover .pane-expand-all-btn { opacity: 1; }
    .pane-h .pane-expand-all-btn { display: none; }
```

---

### P-008 — Floating panes clamp to viewport on badge toggle and window resize

```yaml
schema:
  id: P-008
  clamp_function: clampFloatPanel(panel)
  margin: 60px
  clamp_x:
    min: MARGIN - panelWidth
    max: window.innerWidth - MARGIN
  clamp_y:
    min: 0
    max: window.innerHeight - MARGIN
  call_on: [badge click removing .off from dock-float, window resize]
  do_not: clamp during active drag
```

---

### P-009 — Vertical panes are user-resizable by dragging the inner border edge

```yaml
schema:
  id: P-009
  handle_element: .pane-width-handle
  handle_position:
    dock_left:  right: 0
    dock_right: left: 0
  handle_css: |
    width: 5px; position: absolute; top: 0; bottom: 0;
    cursor: col-resize; opacity: 0;
  handle_hover: opacity 1, background: var(--accent)
  hidden_in: [.pane-h, .dock-float, .collapsed, .off]
  min_width: 100px
  drag_behavior:
    dock_left:  newW = startW + (e.clientX - startX)
    dock_right: newW = startW - (e.clientX - startX)
  persistence_key: "tvs:pane-w:{panelId}"
  during_drag:
    class: .pane-resizing → transition: none !important
    body_cursor: col-resize
    body_user_select: none
```

---

### P-010 — Horizontal pane scroll indicators: back/forward chevrons

When a pane is in horizontal (pane-h) mode and has more content than fits,
back (‹) and forward (›) scroll indicators appear at the edges. The back
indicator's left position is dynamically set to sit flush against the right
edge of the pane's fixed header area.

```yaml
schema:
  id: P-010
  elements:
    back_indicator:  .pane-h-back-ind
    forward_indicator: .pane-h-overflow-ind
  css: |
    .pane-h-overflow-ind,
    .pane-h-back-ind {
      display: none; position: absolute;
      top: 0; bottom: 0; width: 36px;
      align-items: center; justify-content: center;
      cursor: pointer; z-index: 10;
      transition: border-color .12s, color .12s, background .12s;
    }
    .pane-h-overflow-ind { right: 0; }
    .pane-h-overflow-ind::after { content: '›'; }
    .pane-h-back-ind { left: 0; }
    .pane-h-back-ind::after { content: '‹'; }
    .pane-h-overflow-ind.show,
    .pane-h-back-ind.show { display: flex; }
    /* gradient fade behind chevron */
    .pane-h-overflow-ind { background: linear-gradient(to right, transparent, var(--surface) 70%); }
    .pane-h-back-ind     { background: linear-gradient(to left,  transparent, var(--surface) 70%); }

  back_indicator_position:
    rule: |
      indBack.style.left = (header ? header.offsetWidth : 0) + 'px';
    reason: |
      The pane header (title/grip area) is a fixed-width non-scrolling zone.
      The back indicator must not cover it; its left edge must begin at the
      header's right edge. This is computed at render time via offsetWidth,
      not hardcoded, so it adapts to different header widths.

  visibility_logic: |
    function updateIndicator(b, indFwd, indBack, header) {
      indFwd.classList.toggle('show', b.scrollWidth > b.clientWidth && b.scrollLeft < b.scrollWidth - b.clientWidth - 2);
      indBack.classList.toggle('show', b.scrollTop > 2);  // scrollTop threshold: 2px to avoid false show on tiny rounding
      indBack.style.left = (header ? header.offsetWidth : 0) + 'px';
    }

  update_triggers:
    - setTimeout(0) after row application (layout not yet settled at call time)
    - on every scroll event of the pane body
    - on every wheel event of the pane body
```

---

### P-011 — Horizontal pane scroll step sizes and wheel damping

Click on the back/forward indicator scrolls by half a row. The mouse wheel
is intercepted and damped so the fast native scroll delta doesn't overshoot
the narrow row height.

```yaml
schema:
  id: P-011
  constants:
    ROW_H: 44   # px, height of one dock row
  click_scroll:
    step: Math.round(ROW_H / 2)   # 22px
    direction:
      forward: scrollTop + step
      back:    Math.max(0, scrollTop - step)
    behavior: smooth
    code: |
      indFwd.addEventListener('click', function() {
        body.scrollTo({ top: body.scrollTop + Math.round(ROW_H / 2), behavior: 'smooth' });
      });
      indBack.addEventListener('click', function() {
        body.scrollTo({ top: Math.max(0, body.scrollTop - Math.round(ROW_H / 2)), behavior: 'smooth' });
      });

  wheel_scroll:
    active_when: multi-row mode (loadRows(id) > 1)
    passive: false   # required for preventDefault()
    damping_factor: 0.3
    cap: ROW_H
    formula: |
      var step = Math.sign(delta) * Math.min(Math.abs(delta) * 0.3, ROW_H);
      body.scrollBy({ top: step, behavior: 'smooth' });
    rationale: |
      Native wheel delta can be 100+ px per tick. Without damping, a single
      scroll moves multiple rows. 0.3x with ROW_H cap means one fast tick
      moves at most one row height, keeping navigation predictable.
    code: |
      body.addEventListener('wheel', function(e) {
        if (loadRows(id) <= 1) return;
        e.preventDefault();
        var delta = e.deltaY || e.deltaX;
        var step = Math.sign(delta) * Math.min(Math.abs(delta) * 0.3, ROW_H);
        body.scrollBy({ top: step, behavior: 'smooth' });
        updateIndicator(body, indFwd, indBack, header);
      }, { passive: false });
```

---

## Controls & Affordances

### C-001 — Small icon buttons: quiet at rest, bordered box on hover

```yaml
schema:
  id: C-001
  applies_to: [.ctrl-pane-collapse-btn, .panel-tab-arrow, .ctrl-pane-float-btn]
  rest_state: { background: none, border: "1px solid transparent" }
  hover_state: { background: var(--surface2), border: "1px solid var(--border)", border_radius: 5px }
  font_sizes: { collapse_carrot: 16px, float_redock: 14px }
  padding: "2px 5px"
```

---

### C-002 — State-bearing toolbar buttons reflect their active state dynamically

```yaml
schema:
  id: C-002
  rule:
    use_primary: false   # only for permanent CTAs
    use_active: true     # toggled programmatically
  active_css: "background: var(--accent); color: var(--accent-text);"
  escape_key: must trigger close + remove active
```

---

### C-003 — Segmented pill-box for binary or small-N option toggles

```yaml
schema:
  id: C-003
  use_when: [2-4 mutually exclusive options, user switches frequently, short labels or icons]
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
  slider_timing: call immediately on change; also setTimeout(syncSlider, 0) on init
  css_key_properties:
    pill_group: "position:relative; border-radius:20px; overflow:hidden; display:inline-flex"
    slider: "position:absolute; top:0; bottom:0; background:var(--accent); pointer-events:none; transition:left .18s, width .18s"
```

---

### C-004 — Icon-driven controls must not use text labels for brevity

```yaml
schema:
  id: C-004
  rule: { prefer: SVG or Unicode glyph only, avoid: text labels in toolbar pill-boxes }
  icon_selection:
    dark_theme:  "☾ (U+263E)"
    light_theme: "☀ (U+2600)"
    custom_theme: |
      <svg viewBox="0 0 13 13">
        <circle cx="6.5" cy="6.5" r="5.5" fill="BG_COLOR"/>
        <path d="M6.5 1A5.5 5.5 0 0 1 6.5 12z" fill="ACCENT_COLOR"/>
      </svg>
```

---

## Theme System

### T-001 — Theme variables use --accent-text to guarantee contrast on accent backgrounds

```yaml
schema:
  id: T-001
  css_variable: --accent-text
  root_default: "#fff"
  usage: |
    Every element with background: var(--accent) must use color: var(--accent-text)
  per_theme_override: |
    Themes with light accents define --accent-text: '#000000'
  do_not: hardcode color:#fff on any accent-background element
```

---

### T-002 — Theme A/B toggle is a pill-box; icons reflect slot contents

```yaml
schema:
  id: T-002
  element: "#theme-pill"
  click_behavior: |
    BOTH buttons call the same toggleThemePill().
    toggleThemePill() switches to whichever of A/B is not currently active.
    do_not: make left button activate A, right button activate B
  update_trigger: [applyTheme(), renderThemeSlots(), pill click]
  no_text_labels: true
```

---

### T-003 — Theme A/B slot assignment uses drag-and-drop, not Set A/Set B buttons

```yaml
schema:
  id: T-003
  drop_logic: |
    var targetSlot = slot.getAttribute('data-slot');
    var curA = localStorage.getItem('tvs:theme-a');
    var curB = localStorage.getItem('tvs:theme-b');
    if (targetSlot === 'a' && droppedId === curB) {
      localStorage.setItem('tvs:theme-a', curB);
      localStorage.setItem('tvs:theme-b', curA);
    } else if (targetSlot === 'b' && droppedId === curA) {
      localStorage.setItem('tvs:theme-b', curA);
      localStorage.setItem('tvs:theme-a', curB);
    } else {
      localStorage.setItem(targetSlot === 'a' ? 'tvs:theme-a' : 'tvs:theme-b', droppedId);
    }
  after_drop: [renderThemeSlots(), renderThemeList(), updateThemeBtn()]
```

---

### T-004 — Theme slot visual state semantics: active, hover, drag, rest

Two-layer DOM model: outer `.opts-theme-slot` (fixed, border = slot-level state) +
inner `.opts-theme-slot-card` (slides during swap, border = interactive affordance).

| State | Outer slot border | Inner card border | Card opacity |
|---|---|---|---|
| Rest (inactive) | transparent | 1.5px solid var(--border) | 1 |
| Active | 2px solid var(--accent) | unchanged | 1 |
| Hover (inactive only) | transparent | 1.5px dashed var(--accent) | 1 |
| Dragging source | unchanged | — | 0 |
| Drop target (swap preview) | 2px dashed via ::before | 1.5px dashed ghost | slides |
| Preview mode | transparent | unchanged | 1 |

```yaml
schema:
  id: T-004
  qualitative_principles:
    - Slot border = slot-level state; never travels with the card
    - Card border = interactive affordance; travels with the card
    - Active state = slot POSITION (A/B), never theme ID — swap doesn't move indicator
    - Hover dashed suppressed on active slot (meaningless to invite activating active slot)
    - Drag hides only the card (opacity 0), not the outer slot or its border

  dom_structure: |
    <div class="opts-theme-slot-wrapper">
      <div class="opts-theme-slot-label">A</div>
      <div class="opts-theme-slot" id="opts-slot-a" data-slot="a">
        <div class="opts-theme-slot-card">
          <div class="opts-theme-slot-name" id="opts-slot-a-name">—</div>
          <div class="opts-theme-slot-swatches" id="opts-slot-a-swatches"></div>
        </div>
      </div>
    </div>

  full_css: |
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
    .opts-theme-slot.drag-over { border-color: var(--accent); background: rgba(91,138,240,.08); border-style: solid; }
    .opts-theme-slot.drag-over-list .opts-theme-slot-card { border-color: var(--accent); border-style: dashed; }
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
        Label placed in wrapper ABOVE slot so it doesn't appear to rename
        when card slides to the other slot during swap preview.
    - source_slot_background_transparent: |
        background:transparent !important on .dragging-source lets the incoming
        card slide in from the other slot be visible through the source area.
    - z_index_on_drop_target: |
        z-index:2 on drop-target slot makes its card (translated outside slot bounds)
        paint above the source slot (first in DOM order).
```

---

### T-005 — Pill-box active indicator uses a sliding span

```yaml
schema:
  id: T-005
  structure: |
    <div id="theme-pill" title="Toggle theme A/B">
      <span id="theme-pill-slider"></span>
      <button id="theme-pill-a" class="theme-pill-btn"></button>
      <button id="theme-pill-b" class="theme-pill-btn"></button>
    </div>
  css: |
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
    slider.style.left    = activeBtn.offsetLeft + 'px';
    slider.style.width   = activeBtn.offsetWidth + 'px';
    slider.style.opacity = previewing ? '0' : '1';
  do_not:
    - set background on .theme-pill-btn.active (slider provides it)
    - animate with JS setInterval
  preview_mode: opacity 0 when tvs:previewing is set
```

---

### T-006 — Card swap drag interaction: source hides, other card slides, ghost drop zone appears

```yaml
schema:
  id: T-006
  drag_start:
    code: |
      slot.ondragstart = function(e) {
        _dragFromList = false;
        _draggedThemeId = themeVal;
        e.dataTransfer.setData('text/plain', themeVal);
        setTimeout(function() { slot.classList.add('dragging-source'); }, 0);
      };
    why_setTimeout: |
      Deferring class addition ensures browser captures drag image before
      the card is hidden. Without defer, drag image is also invisible.

  drag_over:
    swap_detection: |
      var isSwap = !_dragFromList && (
        (targetName === 'a' && _draggedThemeId === curB) ||
        (targetName === 'b' && _draggedThemeId === curA)
      );
    idempotency: |
      Guard all class changes: if (!slot.classList.contains(wantClass)) { ... }
      ondragover fires ~60/s — re-adding classes restarts CSS transitions.
    slide_preview: |
      card.style.transform = 'translateX(' + (sourceSlot.offsetLeft - slot.offsetLeft) + 'px)';
      // transition: transform .22s cubic-bezier(.4,0,.2,1) on .opts-theme-slot-card

  drag_leave:
    false_trigger_guard: |
      slot.ondragleave = function(e) {
        var rel = e.relatedTarget;
        if (rel && (rel === slot || slot.contains(rel))) return;
        // genuine leave — reset classes
      };

  drag_end:
    transition_suppression: |
      slot.ondragend = function() {
        slot.style.transition = 'none';
        slot.classList.remove('dragging-source');
        void slot.offsetWidth;   // force reflow to commit no-transition state
        slot.style.transition = '';
        resetSlotDragClasses(true);
      };
    why: |
      Without suppression, a border-color transition that started while the
      slot was hidden becomes visible as a flicker when dragging-source is removed.

  drop:
    code: |
      slot.ondrop = function(e) {
        e.preventDefault();
        slot.classList.remove('drag-over-list');
        var dropCard = slot.querySelector('.opts-theme-slot-card');
        if (dropCard) dropCard.removeAttribute('data-preview-id');
        resetSlotDragClasses(true);
        // ... swap logic ...
        var activeSlot = localStorage.getItem('tvs:active-slot') || 'a';
        var activeTheme = localStorage.getItem('tvs:theme-' + activeSlot) || 'dark';
        applyTheme(activeTheme);
        renderThemeSlots(); renderThemeList(); updateThemeBtn();
        // no-hover suppression (see T-012)
      };

  reset_function: |
    function resetSlotDragClasses(instant) {
      [slotA, slotB].forEach(function(s) {
        if (!s) return;
        s.classList.remove('drag-over', 'drop-target', 'drag-over-list');
        var sc = s.querySelector('.opts-theme-slot-card');
        if (sc) sc.removeAttribute('data-preview-id');
        restoreSlotCard(s);
        var card = s.querySelector('.opts-theme-slot-card');
        if (card) {
          if (instant) card.style.transition = 'none';
          card.style.transform = '';
          if (instant) { void card.offsetWidth; card.style.transition = ''; }
        }
      });
    }
```

---

### T-007 — Active slot tracks slot position (A or B), not theme ID

```yaml
schema:
  id: T-007
  storage_key: "tvs:active-slot"
  values: ["a", "b"]
  set_when:
    - user clicks slot card → set to that slot's data-slot attribute
    - user clicks pill toggle → set to other position
    - card swap drop → do NOT change (position stays, theme changes)
  apply_theme_on_swap: |
    applyTheme(localStorage.getItem('tvs:theme-' + activeSlot))
  migration: |
    if (!localStorage.getItem('tvs:active-slot')) {
      var themeA = localStorage.getItem('tvs:theme-a') || 'dark';
      var activeId = localStorage.getItem('tvs:active-theme') || 'dark';
      localStorage.setItem('tvs:active-slot', activeId === themeA ? 'a' : 'b');
    }
  render_rule: |
    slot.classList.toggle('active-slot',
      (!previewing && activeSlot === slotName) ||
      (previewing && !!previewingTheme && previewingTheme === themeId)
    );
```

---

### T-008 — Preview mode suppresses active indicators without changing slot assignment

```yaml
schema:
  id: T-008
  storage_key: "tvs:previewing"
  values: ["1", null]
  set_when: user clicks [data-theme-preview] button
  clear_when: [slot onclick, toggleThemePill, card swap ondrop]
  clear_code: |
    localStorage.removeItem('tvs:previewing');
    localStorage.removeItem('tvs:previewing-theme');
  visual_effect:
    slot_active_border: suppressed
    pill_slider_opacity: 0
    pill_button_active_class: removed
  render_pattern: |
    var previewing = !!localStorage.getItem('tvs:previewing');
    slot.classList.toggle('active-slot', !previewing && activeSlot === slotName);
    slider.style.opacity = previewing ? '0' : '1';
    btnA.classList.toggle('active', !previewing && activeSlot === 'a');
    btnB.classList.toggle('active', !previewing && activeSlot === 'b');
  do_not: |
    Skip renderThemeList() in slot onclick — it must be called explicitly
    to clear the previewed-theme outline from the list card.
```

---

### T-009 — List-to-slot drag: card border only, live theme preview during hover

```yaml
schema:
  id: T-009
  drag_source_flag:
    variable: _dragFromList
    set_true_in:  ".theme-card[data-theme-id] dragstart"
    set_false_in: ".theme-card dragend AND slot ondragstart"
  css: |
    .opts-theme-slot.drag-over-list .opts-theme-slot-card {
      border-color: var(--accent); border-style: dashed;
    }
  slot_ondragover: |
    if (_dragFromList) {
      if (!slot.classList.contains('drag-over-list')) {
        slot.classList.remove('drag-over', 'drop-target', 'drag-over-list');
        slot.classList.add('drag-over-list');
      }
      var card = slot.querySelector('.opts-theme-slot-card');
      if (card && card.getAttribute('data-preview-id') !== _draggedThemeId) {
        card.setAttribute('data-preview-id', _draggedThemeId);
        var pt = getThemeById(_draggedThemeId);
        var nameEl = document.getElementById('opts-slot-' + targetName + '-name');
        var swEl   = document.getElementById('opts-slot-' + targetName + '-swatches');
        if (nameEl && pt) nameEl.textContent = pt.name;
        if (swEl && pt) swEl.innerHTML =
          '<div class="theme-swatch" style="background:'+pt.vars['--bg']+';width:14px;height:14px;"></div>'
          + '<div class="theme-swatch" style="background:'+pt.vars['--accent']+';width:14px;height:14px;"></div>';
      }
      return;
    }
  data_preview_id_guard: |
    Guard live-preview DOM writes with data-preview-id attribute to avoid
    DOM thrash on every 60fps ondragover event when hovering in place.
    Remove attribute on leave, drop, and resetSlotDragClasses.
  restore_helper: |
    function restoreSlotCard(slot) {
      if (!slot) return;
      var slotName = slot.getAttribute('data-slot');
      var themeId = localStorage.getItem('tvs:theme-' + slotName) || (slotName === 'a' ? 'dark' : 'light');
      var t = getThemeById(themeId);
      var nameEl = document.getElementById('opts-slot-' + slotName + '-name');
      var swEl   = document.getElementById('opts-slot-' + slotName + '-swatches');
      if (nameEl) nameEl.textContent = t ? t.name : '—';
      if (swEl) swEl.innerHTML = t
        ? '<div class="theme-swatch" style="background:'+t.vars['--bg']+';width:14px;height:14px;"></div>'
          + '<div class="theme-swatch" style="background:'+t.vars['--accent']+';width:14px;height:14px;"></div>'
        : '';
    }
  call_restoreSlotCard_on: [ondragleave, ondrop, resetSlotDragClasses]
```

---

### T-010 — Preview active-slot border when previewing a slot theme; list outline only on Preview

```yaml
schema:
  id: T-010
  storage_key: "tvs:previewing-theme"
  set_when: user clicks [data-theme-preview] (alongside tvs:previewing)
  clear_when: same as tvs:previewing
  slot_active_border_rule: |
    var previewingTheme = localStorage.getItem('tvs:previewing-theme');
    slot.classList.toggle('active-slot',
      (!previewing && activeSlot === slotName) ||
      (previewing && !!previewingTheme && previewingTheme === themeId)
    );
  theme_list_outline_rule: |
    var listPreviewing = !!localStorage.getItem('tvs:previewing');
    var isActive = (listPreviewing && t.id === activeId)
      ? ' style="outline:2px solid var(--accent);"' : '';
    // Outline ONLY shown in preview mode, not on slot/pill selection.
  rationale: |
    List outline answers "what am I previewing?" (preview-mode only).
    Slot active border answers "which slot is selected?" (normal mode) and
    "is this slot's theme being previewed?" (preview mode).
```

---

### T-011 — Theme list reorder via drag handle with live FLIP animation

```yaml
schema:
  id: T-011
  persistence:
    storage_key: "tvs:theme-order"
    format: JSON array of theme IDs
    getAllThemes_implementation: |
      function getAllThemes() {
        var all = THEMES.concat(getCustomThemes());
        var order = getThemeOrder();
        if (!order) return all;
        var map = {};
        for (var i = 0; i < all.length; i++) map[all[i].id] = all[i];
        var result = [];
        for (var j = 0; j < order.length; j++) {
          if (map[order[j]]) { result.push(map[order[j]]); delete map[order[j]]; }
        }
        for (var k = 0; k < all.length; k++) { if (map[all[k].id]) result.push(all[k]); }
        return result;
      }
    note: New themes not yet in order array are appended at end.

  drag_mode_flag:
    variable: _dragMode   # 'slot' | 'reorder'
    set_reorder: handle dragstart
    set_slot:    handle dragend, container ondrop
    slot_ondragover_guard: |
      slot.ondragover = function(e) {
        if (_dragMode === 'reorder') return;  // reorder never targets A/B slots
        ...
      };

  handle:
    html: '<span class="theme-drag-handle" draggable="true" data-handle-for="{themeId}">⠿</span>'
    placement: first child of .theme-card, before swatches
    mousedown: |
      handle.addEventListener('mousedown', function(e) { e.stopPropagation(); });
      // Prevents card's own dragstart from firing when handle is grabbed
    css: |
      .theme-drag-handle {
        cursor: grab; color: var(--muted); font-size: 15px;
        padding: 0 4px 0 0; flex-shrink: 0; user-select: none; line-height: 1;
      }
      .theme-drag-handle:active { cursor: grabbing; }

  placeholder:
    description: |
      div.theme-list-placeholder wrapping a cloned, dimmed copy of the source card.
      Represents the insertion point and moves live during drag.
    css: |
      .theme-list-placeholder {
        border: 1.5px dashed var(--accent); border-radius: 9px;
        padding: 4px; background: rgba(91,138,240,.05);
        pointer-events: none; flex-shrink: 0; box-sizing: border-box;
      }
      .theme-list-placeholder .theme-card {
        opacity: 0.45; pointer-events: none; outline: none !important; margin: 0;
      }
      .theme-card.reorder-dragging { display: none; }
    creation_code: |
      _placeholder = document.createElement('div');
      _placeholder.className = 'theme-list-placeholder';
      var clone = sourceCard.cloneNode(true);
      clone.removeAttribute('draggable');
      _placeholder.appendChild(clone);
      setTimeout(function() {
        sourceCard.classList.add('reorder-dragging');  // display:none removes from flow
        sourceCard.parentNode.insertBefore(_placeholder, sourceCard.nextSibling);
      }, 0);
    why_setTimeout: Browser captures drag image synchronously at dragstart.
      Deferring the hide ensures the drag image shows the card, not nothing.
    why_display_none: |
      visibility:hidden keeps card in flow → double-gap alongside placeholder.
      display:none collapses it → placeholder occupies exactly one card's space.

  insertion_point:
    function: getInsertionPoint(e)
    returns: "{ ref: Element | null, before: boolean }"
    coordinate_fix: |
      offsetTop is relative to offsetParent, NOT the viewport.
      WRONG: var mouseY = e.clientY - container.getBoundingClientRect().top;
             (container may not be offsetParent → all drops land at top of list)
      CORRECT:
        var offsetParent = cards[0].offsetParent;
        var parentTop = offsetParent ? offsetParent.getBoundingClientRect().top : 0;
        var mouseY = e.clientY - parentTop;
    stability: |
      offsetTop is unaffected by CSS transforms. Using it avoids a feedback loop
      where mid-animation getBoundingClientRect() shifts the computed midpoint,
      toggles the insertion point, triggers another animation — endless stutter.
    full_code: |
      function getInsertionPoint(e) {
        var cards = container.querySelectorAll('.theme-card[data-theme-id]:not(.reorder-dragging)');
        if (!cards.length) return { ref: null, before: false };
        var offsetParent = cards[0].offsetParent;
        var parentTop = offsetParent ? offsetParent.getBoundingClientRect().top : 0;
        var mouseY = e.clientY - parentTop;
        for (var i = 0; i < cards.length; i++) {
          var top = cards[i].offsetTop, h = cards[i].offsetHeight;
          if (mouseY < top + h / 2) return { ref: cards[i], before: true };
          if (mouseY < top + h)     return { ref: cards[i], before: false };
        }
        return { ref: null, before: false };
      }

  flip_animation:
    purpose: Cards slide smoothly to new positions as placeholder moves through list.
    technique: FLIP (First-Last-Invert-Play)
    trigger: each time placeholder moves to a new DOM position in ondragover
    optimization: |
      var newNext = ins.ref ? (ins.before ? ins.ref : ins.ref.nextSibling) : null;
      if (_placeholder.nextSibling === newNext) return;  // skip if no position change
    full_code: |
      // First: snapshot natural positions (transform-unaffected)
      var cards = Array.prototype.slice.call(
        container.querySelectorAll('.theme-card[data-theme-id]:not(.reorder-dragging)')
      );
      var beforeTops = {};
      cards.forEach(function(c) { beforeTops[c.getAttribute('data-theme-id')] = c.offsetTop; });
      // Last: move placeholder
      if (ins.ref) container.insertBefore(_placeholder, ins.before ? ins.ref : ins.ref.nextSibling);
      else         container.appendChild(_placeholder);
      // Invert + Play
      cards.forEach(function(c) {
        var id    = c.getAttribute('data-theme-id');
        var delta = beforeTops[id] - c.offsetTop;  // same offsetParent → delta is correct
        if (Math.abs(delta) < 1) return;
        c.style.transition = 'none';
        c.style.transform  = 'translateY(' + delta + 'px)';
        void c.offsetWidth;                          // force reflow before enabling transition
        c.style.transition = 'transform 0.14s ease';
        c.style.transform  = '';
      });
    cleanup: |
      container.querySelectorAll('.theme-card').forEach(function(c) {
        c.style.transition = '';
        c.style.transform  = '';
        c.classList.remove('reorder-dragging');
      });

  drop_commit:
    source: placeholder's DOM siblings
    code: |
      var insertBeforeEl = _placeholder ? _placeholder.nextElementSibling : null;
      var targetId = insertBeforeEl ? insertBeforeEl.getAttribute('data-theme-id') : null;
      var insertBefore = !!targetId;
      if (!insertBefore && _placeholder && _placeholder.previousElementSibling) {
        targetId = _placeholder.previousElementSibling.getAttribute('data-theme-id');
      }
      removePlaceholder();
      container.querySelectorAll('.theme-card').forEach(function(c) {
        c.style.transition = ''; c.style.transform = ''; c.classList.remove('reorder-dragging');
      });
      if (!draggedId || !targetId || draggedId === targetId) { _dragMode = 'slot'; return; }
      var ids = getAllThemes().map(function(t) { return t.id; });
      ids.splice(ids.indexOf(draggedId), 1);
      var tIdx = ids.indexOf(targetId);
      ids.splice(insertBefore ? tIdx : tIdx + 1, 0, draggedId);
      saveThemeOrder(ids);
      _dragMode = 'slot';
      renderThemeList();
```

---

### T-012 — Suppress stale hover border on non-drop-target slot after card swap

```yaml
schema:
  id: T-012
  symptom: |
    After a slot-to-slot drag-drop swap, the slot NOT receiving the drop
    briefly shows a dashed card hover border even though mouse is not over it.
  root_cause: |
    Browser retains stale :hover on non-targeted slot after DOM re-render
    from ondrop → renderThemeSlots(). Consistently reproducible on Chrome.
  fix:
    css: |
      .opts-theme-slot:not(.active-slot):not(.no-hover):hover .opts-theme-slot-card {
        border-color: var(--accent); border-style: dashed;
      }
    js: |
      var sA = document.getElementById('opts-slot-a');
      var sB = document.getElementById('opts-slot-b');
      var otherSlot = (targetName === 'a') ? sB : sA;
      if (otherSlot) otherSlot.classList.add('no-hover');
      function clearNoHover() {
        if (otherSlot) otherSlot.classList.remove('no-hover');
        document.removeEventListener('mousemove', clearNoHover);
      }
      document.addEventListener('mousemove', clearNoHover);
  scoping_rule: |
    Apply no-hover ONLY to the OTHER slot. The drop target (where mouse is)
    should express hover normally — dashed if inactive, nothing if active.
```

---

### T-013 — Theme application: CSS injection and light color detection

Theme application writes a <style> tag directly into the document head
with all CSS custom properties. Light/dark body class is derived from
the background color luminance.

```yaml
schema:
  id: T-013
  function: applyTheme(themeId)
  style_element_id: "tvs-theme-style"
  mechanism: |
    function applyTheme(themeId) {
      var t = getThemeById(themeId) || getThemeById('dark');
      var vars = t.vars;
      var css = ':root {\n';
      for (var k in vars) css += '  ' + k + ': ' + vars[k] + ';\n';
      css += '}';
      var el = document.getElementById('tvs-theme-style');
      if (!el) { el = document.createElement('style'); el.id = 'tvs-theme-style'; document.head.appendChild(el); }
      el.textContent = css;
      document.body.classList.remove('light');
      if (isLightColor(vars['--bg'])) document.body.classList.add('light');
      localStorage.setItem('tvs:active-theme', themeId);
      updateThemeBtn();
    }
  light_detection: |
    function isLightColor(hex) {
      // Parses hex, computes relative luminance, returns true if > 0.5
      var r = parseInt(hex.slice(1,3),16)/255;
      var g = parseInt(hex.slice(3,5),16)/255;
      var b = parseInt(hex.slice(5,7),16)/255;
      return 0.2126*r + 0.7152*g + 0.0722*b > 0.5;
    }
  body_class_light: |
    document.body.classList contains 'light' when active theme has a light background.
    Used to adjust CSS that can't rely on CSS variables alone (e.g., scrollbar colors).
  always_calls: updateThemeBtn()
  storage_key: "tvs:active-theme"
```

---

### T-014 — Custom theme storage structure and editor

Custom themes are stored as a JSON array in localStorage. The editor provides
color picker + hex text input pairs for each CSS variable, organized by group.

```yaml
schema:
  id: T-014
  storage_key: "tvs:custom-themes"
  theme_object_shape: |
    {
      id: string,          // 'custom-' + Date.now() for new themes
      name: string,
      preset: false,       // always false for custom themes
      vars: {
        '--bg':       '#hex',
        '--surface':  '#hex',
        '--surface2': '#hex',
        '--border':   '#hex',
        '--text':     '#hex',
        '--muted':    '#hex',
        '--accent':   '#hex',
        '--accent-text': '#hex',
        '--red':      '#hex',
        // ... all THEME_VAR_GROUPS keys
      }
    }
  storage_functions: |
    function getCustomThemes() {
      try { return JSON.parse(localStorage.getItem('tvs:custom-themes') || '[]'); }
      catch(e) { return []; }
    }
    function saveCustomThemes(arr) {
      localStorage.setItem('tvs:custom-themes', JSON.stringify(arr));
    }
  theme_var_groups:
    description: Three groups organizing the CSS variables in the editor UI
    groups:
      - label: "UI Colors"
        vars: [--bg, --surface, --surface2, --border, --text, --muted, --accent, --accent-text, --red]
      - label: "Canvas Colors"
        vars: [...canvas-specific vars...]
      - label: "Field Colors"
        vars: [...field-specific vars...]
    each_entry: "{ key: '--varname', label: 'Display Label', type: 'color' | 'text' }"

  editor_container: "#theme-editor-container"
  editor_visibility: "display: none by default; cleared innerHTML to close"

  showThemeEditor_implementation: |
    function showThemeEditor(themeId) {
      var theme = getThemeById(themeId);
      if (!theme) return;
      var editVars = JSON.parse(JSON.stringify(theme.vars));  // deep clone
      var container = document.getElementById('theme-editor-container');
      // ... build HTML with inputs ...
      // Color + hex sync:
      container.querySelectorAll('[data-var]').forEach(function(colorInput) {
        var key = colorInput.getAttribute('data-var');
        var hexInput = container.querySelector('[data-hex-var="' + key + '"]');
        colorInput.addEventListener('input', function() {
          editVars[key] = colorInput.value;
          if (hexInput) hexInput.value = colorInput.value;
        });
        if (hexInput) {
          hexInput.addEventListener('input', function() {
            var v = hexInput.value.trim();
            if (/^#[0-9a-fA-F]{6}$/.test(v)) {
              editVars[key] = v;
              colorInput.value = v;
            }
          });
        }
      });
      // Save:
      container.querySelector('#theme-ed-save').addEventListener('click', function() {
        var customs = getCustomThemes();
        var found = false;
        for (var i = 0; i < customs.length; i++) {
          if (customs[i].id === themeId) { customs[i].vars = editVars; found = true; break; }
        }
        if (!found) customs.push({ id: themeId, name: nameVal, preset: false, vars: editVars });
        saveCustomThemes(customs);
        container.style.display = 'none';
        container.innerHTML = '';
        renderThemeList(); renderThemeSlots();
      });
    }

  new_theme_creation: |
    function showNewThemeEditor() {
      var newId = 'custom-' + Date.now();
      var activeId = localStorage.getItem('tvs:active-theme') || 'dark';
      var src = getThemeById(activeId) || getThemeById('dark');
      var customs = getCustomThemes();
      customs.push({ id: newId, name: 'Custom Theme', preset: false,
                     vars: JSON.parse(JSON.stringify(src.vars)) });
      saveCustomThemes(customs);
      renderThemeList(); renderThemeSlots();
      showThemeEditor(newId);
    }
  editor_css: |
    .theme-editor { border: 1px solid var(--border); padding: 12px; margin: 8px 0; border-radius: 7px; }
    .theme-editor-name { width: 100%; }
    .theme-color-row { display: flex; align-items: center; gap: 8px; }
    .theme-color-input { width: 36px; height: 22px; padding: 0; }
    .theme-color-hex { width: 80px; font-family: monospace; }
    .theme-text-input { flex: 1; font-family: monospace; }
```

---

### T-015 — Preset theme structure

Six built-in preset themes shipped with the application. Presets cannot be
edited or deleted; they can be duplicated to create a custom variant.

```yaml
schema:
  id: T-015
  preset_flag: "preset: true"
  preset_themes:
    - id: dark,            name: "Dark"
    - id: light,           name: "Light"
    - id: nord,            name: "Nord"
    - id: solarized-dark,  name: "Solarized Dark"
    - id: warm-light,      name: "Warm Light"
    - id: high-contrast,   name: "High Contrast"
  storage: |
    THEMES constant (module-level array). Not in localStorage.
    getCustomThemes() reads only tvs:custom-themes.
    getAllThemes() = THEMES.concat(getCustomThemes()) then apply tvs:theme-order.
  ui_rules:
    - preset themes show only: Preview, Duplicate
    - custom themes show: Preview, Duplicate, Edit, Delete
    - do_not: show Edit/Delete buttons when t.preset === true
  deletion_safety: |
    var customs = getCustomThemes().filter(function(t) { return t.id !== id; });
    saveCustomThemes(customs);
    // Only custom themes can be deleted — filter only affects getCustomThemes() array
```

---

## Dialog / Overlay Positioning

### D-001 — Draggable dialogs clamp above the toolbar

```yaml
schema:
  id: D-001
  applies_to: ["#options-dialog"]
  initial_position:
    css: "position: fixed; left: 50%; transform: translateX(-50%); top: 80px; z-index: 900;"
    note: JS overrides top/left from saved position; transform is reset once dragged
  drag_implementation: |
    header.addEventListener('mousedown', function(e) {
      if (e.target === btnClose) return;
      var rect = dialog.getBoundingClientRect();
      var startX = e.clientX - rect.left;
      var startY = e.clientY - rect.top;
      function onMove(e) {
        var tb = document.getElementById('toolbar');
        var tbH = tb ? tb.getBoundingClientRect().bottom : 0;
        var dlgW = dialog.offsetWidth, dlgH = dialog.offsetHeight;
        var x = Math.max(0, Math.min(window.innerWidth  - dlgW, e.clientX - startX));
        var y = Math.max(tbH, Math.min(window.innerHeight - dlgH, e.clientY - startY));
        dialog.style.left = x + 'px';
        dialog.style.top  = y + 'px';
        dialog.style.transform = 'none';
      }
      // ... mouseup saves to tvs:opts:pos ...
    });
  persistence_key: "tvs:opts:pos"
  persistence_format: "{left: px, top: px}"
  clamp_on_restore: |
    // Clamp restored position to current viewport/toolbar
    var tbH = toolbar ? toolbar.getBoundingClientRect().bottom : 0;
    var rx = Math.max(0, Math.min(window.innerWidth  - dlgW, parseFloat(savedPos.left)));
    var ry = Math.max(tbH, Math.min(window.innerHeight - dlgH, parseFloat(savedPos.top)));
```

---

### D-002 — Resizable dialogs use a corner grip; size is persisted

```yaml
schema:
  id: D-002
  applies_to: ["#options-dialog"]
  grip_element: "#options-dialog-resize"
  grip_css: |
    position: absolute; bottom: 0; right: 0;
    width: 18px; height: 18px; cursor: se-resize;
    border-bottom-right-radius: 8px; opacity: 0.6;
    background: linear-gradient(135deg, transparent 50%, var(--border) 50%);
  grip_hover: opacity 1
  resize_implementation: |
    grip.addEventListener('mousedown', function(e) {
      var startX = e.clientX, startY = e.clientY;
      var startW = dialog.offsetWidth;
      var startH = document.getElementById('options-dialog-main').offsetHeight;
      function onMove(e) {
        var w = Math.max(MIN_W, startW + (e.clientX - startX));
        var h = Math.max(MIN_H, startH + (e.clientY - startY));
        dialog.style.width = w + 'px';
        document.getElementById('options-dialog-main').style.height = h + 'px';
      }
      // ... mouseup saves to tvs:opts:size ...
    });
  min_width: 480px
  min_height: 280px
  resize_target:
    width: dialog element itself
    height: "#options-dialog-main" only (header stays fixed height)
  persistence_key: "tvs:opts:size"
  persistence_format: "{w: number, h: number}"

### D-003 — Options dialog navigation persists active section

```yaml
schema:
  id: D-003
  applies_to: ["#options-dialog"]
  nav_element: "#opts-nav"
  nav_structure: |
    <nav id="opts-nav">
      <button data-opts-section="themes">Themes</button>
      <button data-opts-section="layout">Layout</button>
      ...
    </nav>
    <div id="opts-content">
      <div data-opts-panel="themes">...</div>
      <div data-opts-panel="layout">...</div>
    </div>
  navigation_logic: |
    container.querySelectorAll('[data-opts-section]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var section = this.getAttribute('data-opts-section');
        document.querySelectorAll('[data-opts-panel]').forEach(function(p) {
          p.style.display = p.getAttribute('data-opts-panel') === section ? '' : 'none';
        });
        document.querySelectorAll('[data-opts-section]').forEach(function(b) {
          b.classList.toggle('active', b === btn);
        });
        localStorage.setItem('tvs:opts:section', section);
      });
    });
  persistence_keys:
    section: "tvs:opts:section"
    open: "tvs:opts:open"
```

---

## Dock Zone Behaviour

### Z-001 — dockPanel() is the single point of truth for zone transitions

```yaml
schema:
  id: Z-001
  function: dockPanel(panelId, zone)
  zones: [left, right, top, bottom]
  implementation: |
    function dockPanel(panelId, zone) {
      var panel = document.getElementById(panelId);
      var zoneEl = document.getElementById('dock-' + zone);
      zoneEl.appendChild(panel);
      panel.classList.remove('dock-left','dock-right','dock-top','dock-bottom','dock-float','pane-h');
      panel.classList.add('dock-' + zone);
      if (zone === 'top' || zone === 'bottom') panel.classList.add('pane-h');
      // auto-open if moving collapsed pane to horizontal zone
      if ((zone === 'top' || zone === 'bottom') &&
          panel.classList.contains('collapsed') &&
          !panel.classList.contains('off')) {
        _sidePanelOpenFn[panelId]();
      }
      _sidePanelArrowSync[panelId]();
      // sync options dock buttons
      document.querySelectorAll('.opts-dock-btn[data-zone]').forEach(function(b) {
        b.classList.toggle('active', b.getAttribute('data-zone') === zone);
      });
      localStorage.setItem('tvs:dock:' + panelId, zone);
    }
  default_zone_restore_path:
    note: Skips dockPanel to avoid DOM move; must manually replicate all steps
    steps:
      - apply dock class
      - add pane-h if zone is top/bottom
      - call _sidePanelOpenFn if collapsed + horizontal
      - call _sidePanelArrowSync
  persistence_key: "tvs:dock:{panelId}"
```

---

### Z-002 — Float panel system: state, positioning, clamping, z-index

```yaml
schema:
  id: Z-002
  function: floatPanel(panelId)
  constants:
    FLOAT_W: 260px
    FLOAT_H: 380px
    MIN_W:   160px
    MIN_H:   120px
    CLAMP_MARGIN: 60px
  state_persistence:
    key: "tvs:float:{panelId}"
    format: "{x, y, w, h}"
  implementation: |
    function floatPanel(panelId) {
      var panel = document.getElementById(panelId);
      var lastZone = panel.className.match(/dock-(left|right|top|bottom)/);
      lastZone = lastZone ? lastZone[1] : 'left';
      panel.classList.remove('collapsed');
      document.getElementById('dock-float').appendChild(panel);
      panel.classList.remove('dock-left','dock-right','dock-top','dock-bottom','pane-h');
      panel.classList.add('dock-float');
      var state = loadFloatState(panelId);
      var x = state ? state.x : Math.max(0, (window.innerWidth - FLOAT_W) / 2);
      var y = state ? state.y : Math.max(0, (window.innerHeight - FLOAT_H) / 2);
      var w = state ? state.w : FLOAT_W;
      var h = state ? state.h : FLOAT_H;
      x = Math.max(0, Math.min(window.innerWidth  - w, x));
      y = Math.max(0, Math.min(window.innerHeight - h, y));
      panel.style.left = x + 'px'; panel.style.top = y + 'px';
      panel.style.width = w + 'px'; panel.style.height = h + 'px';
      // auto-increment z-index
      panel.style.zIndex = ++_floatZCounter;
    }
  clamp_function: |
    function clampFloatPanel(panel) {
      var MARGIN = 60;
      var w = panel.offsetWidth, h = panel.offsetHeight;
      var x = parseFloat(panel.style.left) || 0;
      var y = parseFloat(panel.style.top)  || 0;
      panel.style.left = Math.max(MARGIN - w, Math.min(window.innerWidth  - MARGIN, x)) + 'px';
      panel.style.top  = Math.max(0,          Math.min(window.innerHeight - MARGIN, y)) + 'px';
    }
  clamp_called_on: [window resize for all visible dock-float panels, badge toggle-on]
  opacity_blur_settings:
    description: Float panels can have background opacity and blur applied
    storage_keys:
      opacity: "tvs:opts:float-opacity"
      blur:    "tvs:opts:float-blur"
    defaults: { opacity: 70, blur: 0 }
    range: { opacity: "0-100", blur: "0-20" }
    css_application: |
      panel.style.opacity = (opacity / 100).toFixed(2);
      panel.style.backdropFilter = blur > 0 ? 'blur(' + blur + 'px)' : '';
```

---

## localStorage Key Reference

All keys used by tessel-vs.html:

```yaml
schema:
  id: LS-001
  keys:
    theme:
      "tvs:active-theme":    "ID of currently applied theme"
      "tvs:theme-a":         "Theme ID assigned to slot A"
      "tvs:theme-b":         "Theme ID assigned to slot B"
      "tvs:active-slot":     "'a' or 'b' — which slot position is active"
      "tvs:previewing":      "'1' when in preview mode, absent otherwise"
      "tvs:previewing-theme": "Theme ID being previewed (set with tvs:previewing)"
      "tvs:theme-order":     "JSON array of theme IDs — display order"
      "tvs:custom-themes":   "JSON array of custom theme objects"
    options_dialog:
      "tvs:opts:pos":     "{left, top} — dialog position"
      "tvs:opts:size":    "{w, h} — dialog size"
      "tvs:opts:section": "active nav section name"
      "tvs:opts:open":    "'1' if dialog was open on last close"
      "tvs:opts:float-opacity": "0-100, float panel background opacity"
      "tvs:opts:float-blur":    "0-20, float panel backdrop blur"
    panels:
      "tvs:dock:{panelId}":   "dock zone: left|right|top|bottom"
      "tvs:float:{panelId}":  "{x,y,w,h} float panel position+size"
      "tvs:pane-w:{panelId}": "px width of vertical pane"
      "tvs:{panelId}":        "panel open/collapsed/off state"
```
