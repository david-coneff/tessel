import { initUndo, updateUndoButtons } from './undo.js';
import { initDateUtils } from './DateUtils.js';
import { initExport } from './ExportManager.js';
import { initFileOps, initFileOpsListeners, setStatus, markUnsaved,
         isPersistUndo, saveDraft, loadDraft, getCompiledHtml,
         saveFile, closeAllDropdowns } from './FileOps.js';
import { initBlockOps, getBlock } from './BlockOps.js';
import { initPropsPanel, renderProps, updateOutline } from './PropsPanel.js';
import { initCanvasRenderer, renderCanvas, createHeadingEl, createParaEl } from './CanvasRenderer.js';
import { INSERT_MENU_ITEMS, insertField, buildInsertMenuHTML } from './InsertMenu.js';
import { makeDockablePane } from './PaneFactory.js';
import { updateToolbarState, FONT_MAP, updateInlineFormatState,
         isBlockLevelFormatting, applyFontFamily, initInlineFormat } from './InlineFormat.js';
import { FORMAT_PANE_ITEMS, getHiddenItems, setItemHidden, initPaneBuilder } from './PaneBuilder.js';
import { dockPanel, initDockSystem, makePipHeaderControls } from './DockSystem.js';
import { initOptionsDialog } from './OptionsDialog.js';
import { initCustomFonts } from './CustomFonts.js';
import { initPaneDragReorder } from './PaneDragReorder.js';
import { initToolbarWiring } from './ToolbarWiring.js';
import { isSatellite, getSatellitePaneId,
         initMainChannel, broadcastState,
         initSatelliteChannel, broadcastUpdate } from './SatelliteChannel.js';

export function initApp() {
  'use strict';

  var satellite    = isSatellite();
  var satelliteId  = satellite ? getSatellitePaneId() : null;

  var blocks = [];
  var selectedBlockId = null;
  var lastFocusedTextBlockId = null;
  var _unsaved = false;
  var _filename = 'document';

  // In main mode: set after channel init so broadcasts go out on every render.
  // In satellite mode: always null — satellite only receives, never broadcasts canvas state.
  var _broadcastFn = null;

  var broadcastingRenderCanvas = function() {
    renderCanvas();
    if (_broadcastFn) _broadcastFn();
  };

  var broadcastingSetSelectedBlockId = function(v) {
    selectedBlockId = v;
    if (_broadcastFn) _broadcastFn();
  };

  // In satellite mode, markUnsaved sends the updated blocks back to main instead
  // of touching localStorage / unsaved state / title bar.
  var _markUnsaved = satellite
    ? function() { broadcastUpdate(blocks); }
    : markUnsaved;

  initUndo({
    getBlocks:          function() { return blocks; },
    setBlocks:          function(v) { blocks = v; },
    setSelectedBlockId: broadcastingSetSelectedBlockId,
    renderCanvas:       broadcastingRenderCanvas,
    renderProps:        renderProps,
    setStatus:          setStatus,
  });
  initDateUtils({ renderProps: renderProps });
  initExport({
    getBlocks:          function() { return blocks; },
    setBlocks:          function(v) { blocks = v; },
    getFilename:        function() { return _filename; },
    setFilename:        function(v) { _filename = v; },
    setSelectedBlockId: broadcastingSetSelectedBlockId,
    setUnsaved:         function(v) { _unsaved = v; },
    setStatus:          setStatus,
    saveFile:           saveFile,
    renderCanvas:       broadcastingRenderCanvas,
    renderProps:        renderProps,
    saveDraft:          saveDraft,
    getCompiledHtml:    getCompiledHtml,
  });
  initFileOps({
    setUnsaved:         function(v) { _unsaved = v; },
    getBlocks:          function() { return blocks; },
    setBlocks:          function(v) { blocks = v; },
    setSelectedBlockId: broadcastingSetSelectedBlockId,
    getFilename:        function() { return _filename; },
    setFilename:        function(v) { _filename = v; },
    renderCanvas:       broadcastingRenderCanvas,
    renderProps:        renderProps,
  });
  initBlockOps({
    getBlocks:          function() { return blocks; },
    getSelectedBlockId: function() { return selectedBlockId; },
    setSelectedBlockId: broadcastingSetSelectedBlockId,
    renderCanvas:       broadcastingRenderCanvas,
    renderProps:        renderProps,
    markUnsaved:        _markUnsaved,
  });
  initPropsPanel({
    getBlocks:          function() { return blocks; },
    getSelectedBlockId: function() { return selectedBlockId; },
    getBlock:           getBlock,
    renderCanvas:       broadcastingRenderCanvas,
    markUnsaved:        _markUnsaved,
  });
  initCanvasRenderer({
    getBlocks:                 function() { return blocks; },
    getSelectedBlockId:        function() { return selectedBlockId; },
    setLastFocusedTextBlockId: function(v) { lastFocusedTextBlockId = v; },
    renderProps:               renderProps,
  });

  if (satellite) {
    // ── Satellite window mode ───────────────────────────────────────────────
    // Hide all main-window chrome; show only the requested pane full-screen.
    document.body.classList.add('satellite-mode');
    ['toolbar','canvas-wrap','dock-left','dock-right','dock-top','dock-bottom',
     'dock-float','insert-float'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    var pane = document.getElementById(satelliteId);
    if (pane) {
      pane.classList.remove('collapsed','off','dock-left','dock-right',
                            'dock-top','dock-bottom','dock-float','pane-h');
      pane.classList.add('satellite-pane');
      document.body.appendChild(pane);
    }
    if (pane) makePipHeaderControls(pane, function() { window.close(); });
    initSatelliteChannel({
      setBlocks:          function(v) { blocks = v; },
      setSelectedBlockId: function(v) { selectedBlockId = v; },
      renderProps:        renderProps,
      updateOutline:      updateOutline,
    });
  } else {
    // ── Main window mode ────────────────────────────────────────────────────
    initFileOpsListeners();

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
      insertMenuItems:           INSERT_MENU_ITEMS,
      getLastFocusedTextBlockId: function() { return lastFocusedTextBlockId; },
      insertField:               insertField,
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
      closeAllDropdowns:      closeAllDropdowns,
      insertMenuItems:        INSERT_MENU_ITEMS,
      formatPaneItems:        FORMAT_PANE_ITEMS,
      getHiddenItems:         getHiddenItems,
      setItemHidden:          setItemHidden,
      isPersistUndo:          isPersistUndo,
      isBlockLevelFormatting: isBlockLevelFormatting,
      getUnsaved:             function() { return _unsaved; },
      saveDraft:              saveDraft,
      saveFile:               saveFile,
      setStatus:              setStatus,
    });

    initCustomFonts({
      fontMap:                 FONT_MAP,
      setStatus:               setStatus,
      applyFontFamily:         applyFontFamily,
      updateInlineFormatState: updateInlineFormatState,
    });
    initPaneDragReorder({ dockPanel: dockPanel });
    initToolbarWiring({
      getUnsaved:                function() { return _unsaved; },
      setBlocks:                 function(v) { blocks = v; },
      setSelectedBlockId:        broadcastingSetSelectedBlockId,
      renderCanvas:              broadcastingRenderCanvas,
      renderProps:               renderProps,
      setFilename:               function(v) { _filename = v; },
      setUnsaved:                function(v) { _unsaved = v; },
      getLastFocusedTextBlockId: function() { return lastFocusedTextBlockId; },
      getBlock:                  getBlock,
      markUnsaved:               markUnsaved,
    });

    initMainChannel({
      getBlocks:       function() { return blocks; },
      getSelectedBlockId: function() { return selectedBlockId; },
      setBlocks:       function(v) { blocks = v; },
      renderCanvas:    renderCanvas,
      markUnsaved:     markUnsaved,
    });
    _broadcastFn = function() { broadcastState(blocks, selectedBlockId); };
  }
}
