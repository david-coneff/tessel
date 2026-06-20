import { initUndo, updateUndoButtons } from './undo.js';
import { initDateUtils } from './DateUtils.js';
import { initExport } from './ExportManager.js';
import { initFileOps, initFileOpsListeners, setStatus, markUnsaved,
         isPersistUndo, saveDraft, loadDraft, getCompiledHtml,
         saveFile, closeAllDropdowns } from './FileOps.js';
import { initBlockOps, getBlock } from './BlockOps.js';
import { initPropsPanel, renderProps } from './PropsPanel.js';
import { initCanvasRenderer, renderCanvas, createHeadingEl, createParaEl } from './CanvasRenderer.js';
import { INSERT_MENU_ITEMS, insertField, buildInsertMenuHTML } from './InsertMenu.js';
import { makeDockablePane } from './PaneFactory.js';
import { updateToolbarState, FONT_MAP, updateInlineFormatState,
         isBlockLevelFormatting, applyFontFamily, initInlineFormat } from './InlineFormat.js';
import { FORMAT_PANE_ITEMS, getHiddenItems, setItemHidden, initPaneBuilder } from './PaneBuilder.js';
import { dockPanel, initDockSystem } from './DockSystem.js';
import { initOptionsDialog } from './OptionsDialog.js';
import { initCustomFonts } from './CustomFonts.js';
import { initPaneDragReorder } from './PaneDragReorder.js';
import { initToolbarWiring } from './ToolbarWiring.js';

export function initApp() {
  'use strict';

  var blocks = [];
  var selectedBlockId = null;
  var lastFocusedTextBlockId = null;
  var _unsaved = false;
  var _filename = 'document';

  initUndo({
    getBlocks: function() { return blocks; },
    setBlocks: function(v) { blocks = v; },
    setSelectedBlockId: function(v) { selectedBlockId = v; },
    renderCanvas: renderCanvas,
    renderProps: renderProps,
    setStatus: setStatus,
  });
  initDateUtils({ renderProps: renderProps });
  initExport({
    getBlocks:         function() { return blocks; },
    setBlocks:         function(v) { blocks = v; },
    getFilename:       function() { return _filename; },
    setFilename:       function(v) { _filename = v; },
    setSelectedBlockId: function(v) { selectedBlockId = v; },
    setUnsaved:        function(v) { _unsaved = v; },
    setStatus:         setStatus,
    saveFile:          saveFile,
    renderCanvas:      renderCanvas,
    renderProps:       renderProps,
    saveDraft:         saveDraft,
    getCompiledHtml:   getCompiledHtml,
  });
  initFileOps({
    setUnsaved:        function(v) { _unsaved = v; },
    getBlocks:         function() { return blocks; },
    setBlocks:         function(v) { blocks = v; },
    setSelectedBlockId: function(v) { selectedBlockId = v; },
    getFilename:       function() { return _filename; },
    setFilename:       function(v) { _filename = v; },
    renderCanvas:      renderCanvas,
    renderProps:       renderProps,
  });
  initFileOpsListeners();
  initBlockOps({
    getBlocks:           function() { return blocks; },
    getSelectedBlockId:  function() { return selectedBlockId; },
    setSelectedBlockId:  function(v) { selectedBlockId = v; },
    renderCanvas:        renderCanvas,
    renderProps:         renderProps,
    markUnsaved:         markUnsaved,
  });
  initPropsPanel({
    getBlocks:          function() { return blocks; },
    getSelectedBlockId: function() { return selectedBlockId; },
    getBlock:           getBlock,
    renderCanvas:       renderCanvas,
    markUnsaved:        markUnsaved,
  });
  initCanvasRenderer({
    getBlocks:                  function() { return blocks; },
    getSelectedBlockId:         function() { return selectedBlockId; },
    setLastFocusedTextBlockId:  function(v) { lastFocusedTextBlockId = v; },
    renderProps:                renderProps,
  });

  buildInsertMenuHTML();

  makeDockablePane({ paneId: 'format-pane', badgeId: 'badge-format', lsKey: 'tvs:format-pane-state' });
  makeDockablePane({ paneId: 'text-pane',   badgeId: 'badge-text',   lsKey: 'tvs:text-pane-state' });
  makeDockablePane({ paneId: 'form-pane',   badgeId: 'badge-form',   lsKey: 'tvs:form-pane-state' });

  initInlineFormat({
    getLastFocusedTextBlockId: function() { return lastFocusedTextBlockId; },
    getBlock:        getBlock,
    markUnsaved:     markUnsaved,
    createHeadingEl: createHeadingEl,
    createParaEl:    createParaEl,
  });

  initPaneBuilder({
    insertMenuItems:            INSERT_MENU_ITEMS,
    getLastFocusedTextBlockId:  function() { return lastFocusedTextBlockId; },
    insertField:                insertField,
  });

  loadDraft();
  renderProps();
  updateToolbarState(null);
  updateUndoButtons();

  makeDockablePane({
    paneId: 'outline-panel', tabId: 'outline-tab', collapseId: 'btn-outline-collapse',
    badgeId: 'badge-outline', lsKey: 'tvs:outline-state',
  });
  makeDockablePane({
    paneId: 'props-panel', tabId: 'props-tab', collapseId: 'btn-props-collapse',
    badgeId: 'badge-props', lsKey: 'tvs:props-state',
  });

  initDockSystem();

  initOptionsDialog({
    closeAllDropdowns:    closeAllDropdowns,
    insertMenuItems:      INSERT_MENU_ITEMS,
    formatPaneItems:      FORMAT_PANE_ITEMS,
    getHiddenItems:       getHiddenItems,
    setItemHidden:        setItemHidden,
    isPersistUndo:        isPersistUndo,
    isBlockLevelFormatting: isBlockLevelFormatting,
    getUnsaved:           function() { return _unsaved; },
    saveDraft:            saveDraft,
    saveFile:             saveFile,
    setStatus:            setStatus,
  });

  initCustomFonts({
    fontMap: FONT_MAP,
    setStatus: setStatus,
    applyFontFamily: applyFontFamily,
    updateInlineFormatState: updateInlineFormatState,
  });
  initPaneDragReorder({ dockPanel: dockPanel });
  initToolbarWiring({
    getUnsaved:                function() { return _unsaved; },
    setBlocks:                 function(v) { blocks = v; },
    setSelectedBlockId:        function(v) { selectedBlockId = v; },
    renderCanvas:              renderCanvas,
    renderProps:               renderProps,
    setFilename:               function(v) { _filename = v; },
    setUnsaved:                function(v) { _unsaved = v; },
    getLastFocusedTextBlockId: function() { return lastFocusedTextBlockId; },
    getBlock:                  getBlock,
    markUnsaved:               markUnsaved,
  });
}
