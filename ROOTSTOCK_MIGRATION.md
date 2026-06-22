# Tessel → Rootstock Web Components Migration Guide

This document outlines the migration from tessel's custom UI components to rootstock's framework-agnostic web components.

## Overview

Tessel currently has:
- Custom `tessel-ui/` components (Button, TextInput, Select, Toggle, etc.)
- Custom layout/docking logic in `lib/`
- Custom theming system

Rootstock provides:
- Web components (`<rs-splitter>`, `<rs-dialog>`, `<rs-pane>`, `<rs-zone>`, etc.)
- Unified theming via CSS custom properties
- Docking system (`rootstock.docking`)
- Cross-platform service abstraction

## Migration Path

### Phase 1: ✅ Complete (rootstock refactored)
- [x] Rootstock components created and tested
- [x] Penpot workflow documentation ready
- [x] Web component APIs stable

### Phase 2: Tessel Integration (in progress)

#### Step 1: Update rootstock dependency
- Change version pin from `v0.1.0` to `claude/lucid-fermat-o15qlt` (or merge to main and pin release)
- Import and test web components in tessel

#### Step 2: Replace layout components
- [ ] Replace custom pane management with `<rs-pane>` + `<rs-zone>`
- [ ] Update docking system to use rootstock's `rootstock.docking` service
- [ ] Verify dragging/resizing works

#### Step 3: Replace dialog/menu components
- [ ] Replace custom dialogs with `<rs-dialog>`
- [ ] Replace custom menus with `<rs-menubar>` + `<rs-menu>`
- [ ] Test all dialog/menu interactions

#### Step 4: Replace form controls
- [ ] Migrate from tessel-ui components to Material Design or Shoelace
- [ ] Remove tessel-ui/ directory once complete

#### Step 5: Update theming
- [ ] Merge tessel theme variables into rootstock CSS custom properties
- [ ] Test light/dark mode switching
- [ ] Verify all theme colors apply

#### Step 6: Test & Documentation
- [ ] Run full test suite
- [ ] Update storybook/examples
- [ ] Document new component usage

## Current Tessel Structure

```
studio/src/
├─ tessel-ui/          ← Custom form controls (to be replaced)
│  ├─ Button.js
│  ├─ TextInput.js
│  ├─ Select.js
│  ├─ Toggle.js
│  ├─ Slider.js
│  ├─ Separator.js
│  └─ icon.js
├─ lib/
│  ├─ rootstock.js     ← Rootstock integration (to be expanded)
│  ├─ PaneDragReorder.js ← Layout logic (replace with <rs-pane>)
│  ├─ ThemeManager.js  ← Theming (integrate with rootstock theme)
│  ├─ AppInit.js
│  └─ ...
└─ styles/
   ├─ base.css
   ├─ variables.css    ← Migrate to rootstock CSS custom properties
   └─ themes.css       ← Merge with rootstock/styles.css
```

## Integration Points

### 1. Layout Structure

**Before (tessel custom):**
```html
<div class="dock-left">
  <!-- custom pane management -->
</div>
<div class="dock-center">
  <!-- custom editor logic -->
</div>
<div class="dock-right">
  <!-- custom inspector logic -->
</div>
```

**After (rootstock web components):**
```html
<rs-zone name="left"></rs-zone>
<rs-zone name="center"></rs-zone>
<rs-zone name="right"></rs-zone>

<rs-pane id="file-tree" data-zone="left">
  <div data-pane-header>Files</div>
  <div data-pane-content><!-- content --></div>
  <div data-pane-grip></div>
</rs-pane>

<rs-pane id="inspector" data-zone="right">
  <div data-pane-header>Inspector</div>
  <div data-pane-content><!-- content --></div>
  <div data-pane-grip></div>
</rs-pane>
```

### 2. Docking API

**Before (tessel custom):**
```javascript
// Custom pane management
paneManager.float('inspector', { x: 100, y: 100 });
paneManager.dock('inspector', 'right');
```

**After (rootstock service):**
```javascript
const pane = document.getElementById('inspector');
pane.float(100, 100);
pane.dock('right');

// Or via rootstock service:
rootstock.docking.float('inspector', { x: 100, y: 100 });
rootstock.docking.dock('inspector', 'right');
```

### 3. Dialogs

**Before (tessel custom):**
```javascript
// Custom dialog implementation
showDialog('Delete?', { okLabel: 'Delete', danger: true });
```

**After (rootstock web component):**
```javascript
const dialog = document.createElement('rs-dialog');
dialog.setAttribute('title', 'Delete?');
dialog.setAttribute('kind', 'confirm');
dialog.setAttribute('danger', 'true');
dialog.textContent = 'Are you sure?';
const result = await dialog.show();
```

### 4. Theming

**Before (tessel variables):**
```css
:root {
  --color-primary: #2f6feb;
  --color-surface: #ffffff;
  --font-size-small: 12px;
}
```

**After (rootstock CSS custom properties):**
```css
:root {
  --rs-primary: #2f6feb;
  --rs-surface: #ffffff;
  --rs-surface-elevated: #f7f7f8;
  --rs-text: #1c1c1e;
  --rs-border: #d8d8dc;
}
```

Map tessel variables to rootstock equivalents in your theme CSS.

## Form Controls Strategy

Tessel's `tessel-ui/` components are custom. Two options:

### Option A: Migrate to Material Design
- Use `@material/web` components
- More polished, maintained
- Better Penpot integration
- Larger bundle (check trade-offs)

### Option B: Migrate to Shoelace
- Use Shoelace components
- Lighter weight, more customizable
- Good Penpot support
- Web components native

### Option C: Keep tessel-ui, convert to web components
- Minimal external deps
- Full control over styling
- More work to convert

**Recommendation:** Start with Shoelace for inputs/forms (lighter weight), Material Design or custom buttons.

## Implementation Checklist

- [ ] Pin rootstock to lucid-fermat branch (or released version)
- [ ] Run `npm install` to fetch latest rootstock
- [ ] Import `rootstock/styles.css` in main CSS
- [ ] Create zones in main HTML layout
- [ ] Create panes for file tree, editor, inspector
- [ ] Wire up pane drag/resize events
- [ ] Test floating panes
- [ ] Replace custom dialogs with `<rs-dialog>`
- [ ] Replace custom menus with `<rs-menubar>`
- [ ] Replace form controls with Material/Shoelace
- [ ] Integrate rootstock theming
- [ ] Test light/dark theme switching
- [ ] Verify layout looks correct in Penpot mockups
- [ ] Full test suite passes

## Testing Strategy

1. **Visual regression:** Compare before/after with Penpot mockups
2. **Interaction:** Verify all dragging, resizing, floating works
3. **Themes:** Test light, dark, and any custom themes
4. **Responsive:** Test on mobile and desktop viewports
5. **Cross-platform:** Test web, PWA, and Tauri builds

## Next Steps

1. **Create feature branch:** `git checkout -b refactor/rootstock-web-components`
2. **Update rootstock dependency** in `package.json`
3. **Start Phase 2, Step 1:** Integration and testing
4. **Design in Penpot** the new layout using rootstock components
5. **Iterate** on design and implementation in parallel

See `rootstock/docs/COMPONENTS.md` for full web component API reference.
See `rootstock/docs/PENPOT_WORKFLOW.md` for Penpot design workflow.
