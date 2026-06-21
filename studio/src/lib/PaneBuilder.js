import * as StorageEngine from './StorageEngine.js';
import { esc } from './utils.js';

export var FORMAT_PANE_ITEMS = [
  { group: 'Block Type', labelId: 'fmt-group-blocktype' },
  { label: 'Heading 1',  btnId: 'btn-h1' },
  { label: 'Heading 2',  btnId: 'btn-h2' },
  { label: 'Heading 3',  btnId: 'btn-h3' },
  { label: 'Paragraph',  btnId: 'btn-para' },
  { group: 'Indent', labelId: 'fmt-group-indent' },
  { label: 'Indent',  btnId: 'btn-indent-more' },
  { label: 'Outdent', btnId: 'btn-indent-less' },
  { group: 'Inline Style', labelId: 'fmt-group-inline' },
  { label: 'Bold',       btnId: 'btn-bold' },
  { label: 'Italic',     btnId: 'btn-italic' },
  { label: 'Underline',  btnId: 'btn-underline' },
  { label: 'Link',       btnId: 'btn-link' },
  { group: 'Font', labelId: 'fmt-group-font' },
  { label: 'Default',         btnId: 'btn-font-default' },
  { label: 'Georgia',         btnId: 'btn-font-georgia' },
  { label: 'Franklin Gothic', btnId: 'btn-font-franklin' },
  { label: 'Verdana',         btnId: 'btn-font-verdana' },
];

export function getHiddenItems(pane) {
  try { var v = StorageEngine.getItem('tvs:hidden:' + pane); return new Set(v ? JSON.parse(v) : []); } catch(e) { return new Set(); }
}
export function setItemHidden(pane, label, hidden) {
  var set = getHiddenItems(pane);
  if (hidden) set.add(label); else set.delete(label);
  try { StorageEngine.setItem('tvs:hidden:' + pane, JSON.stringify(Array.from(set))); } catch(e) {}
  if (pane === 'text') buildTextPaneButtons();
  if (pane === 'format') applyFormatPaneVisibility();
}

function applyFormatPaneVisibility() {
  var hidden = getHiddenItems('format');
  var groupLabelId = null;
  var groupHasVisible = false;
  FORMAT_PANE_ITEMS.forEach(function(item) {
    if (item.group) {
      if (groupLabelId) document.getElementById(groupLabelId).style.display = groupHasVisible ? '' : 'none';
      groupLabelId = item.labelId;
      groupHasVisible = false;
    } else {
      var isHidden = hidden.has(item.label);
      document.getElementById(item.btnId).style.display = isHidden ? 'none' : '';
      if (!isHidden) groupHasVisible = true;
    }
  });
  if (groupLabelId) document.getElementById(groupLabelId).style.display = groupHasVisible ? '' : 'none';
}

var _insertMenuItems = null;
var _getLastFocused = null;
var _insertField = null;

function buildTextPaneButtons() {
  var body = document.getElementById('text-pane-body');
  if (!body) return;
  body.innerHTML = '';
  var hidden = getHiddenItems('text');
  var pendingGroupName = null;
  var currentWrapper = null;
  _insertMenuItems.forEach(function(item) {
    if (item.group) {
      pendingGroupName = item.group;
      currentWrapper = null;
    } else {
      if (hidden.has(item.label)) return;
      if (pendingGroupName !== null) {
        var key = 'tvs:grp:text:' + pendingGroupName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        var saved; try { saved = StorageEngine.getItem(key); } catch(e) {}
        var isOpen = saved !== '0';
        var lbl = document.createElement('div');
        lbl.className = 'ctrl-group-label ctrl-group-collapsible';
        var arw = document.createElement('span'); arw.className = 'ctrl-group-arrow';
        arw.innerHTML = isOpen ? '&#9660;' : '&#9654;';
        lbl.appendChild(arw); lbl.appendChild(document.createTextNode(pendingGroupName));
        var wrapper = document.createElement('div');
        wrapper.className = 'ctrl-group-body';
        wrapper.style.display = isOpen ? '' : 'none';
        (function(l, w, k, open) {
          l.addEventListener('click', function() {
            open = !open;
            l.querySelector('.ctrl-group-arrow').innerHTML = open ? '&#9660;' : '&#9654;';
            w.style.display = open ? '' : 'none';
            try { StorageEngine.setItem(k, open ? '1' : '0'); } catch(e) {}
          });
        })(lbl, wrapper, key, isOpen);
        body.appendChild(lbl); body.appendChild(wrapper);
        currentWrapper = wrapper; pendingGroupName = null;
      }
      if (!currentWrapper) return;
      var btn = document.createElement('button');
      btn.className = 'ctrl-btn';
      btn.innerHTML = '<span class="ctrl-btn-icon">' + esc(item.icon) + '</span>' + esc(item.label);
      btn.addEventListener('click', function() { item.action(_getLastFocused() || null); });
      currentWrapper.appendChild(btn);
    }
  });
}

function wireExpandAllBtn(bodyEl) {
  var groups = Array.from(bodyEl.querySelectorAll('.ctrl-group-collapsible'));
  if (groups.length < 2) return;
  var content = bodyEl.closest('.ctrl-pane-content');
  if (!content) return;
  content.style.position = 'relative';
  var existing = content.querySelector('.pane-expand-all-btn');
  if (existing) existing.remove();
  var btn = document.createElement('button');
  btn.className = 'pane-expand-all-btn';
  function allOpen() {
    return groups.every(function(lbl) {
      var body = lbl.nextElementSibling;
      return body && body.classList.contains('ctrl-group-body') && body.style.display !== 'none';
    });
  }
  function syncBtn() {
    if (allOpen()) { btn.title = 'Collapse all groups'; btn.textContent = '▾▾'; }
    else { btn.title = 'Expand all groups'; btn.textContent = '▸▸'; }
  }
  syncBtn();
  btn.addEventListener('click', function(e) {
    e.stopPropagation();
    var expand = !allOpen();
    groups.forEach(function(lbl) {
      var body = lbl.nextElementSibling;
      if (!body || !body.classList.contains('ctrl-group-body')) return;
      var isOpen = body.style.display !== 'none';
      if (expand !== isOpen) lbl.click();
    });
    syncBtn();
  });
  groups.forEach(function(lbl) {
    lbl.addEventListener('click', function() { setTimeout(syncBtn, 0); });
  });
  content.appendChild(btn);
}

function initCollapsibleGroups(bodyEl, lsPrefix) {
  var children = Array.from(bodyEl.children);
  var groups = [], current = null;
  children.forEach(function(el) {
    if (el.classList.contains('ctrl-group-label')) {
      if (current) groups.push(current);
      current = { label: el, items: [] };
    } else if (current) {
      current.items.push(el);
    }
  });
  if (current) groups.push(current);
  groups.forEach(function(group) {
    var labelEl = group.label;
    var groupName = labelEl.textContent.trim();
    var key = lsPrefix + ':' + groupName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    var saved; try { saved = StorageEngine.getItem(key); } catch(e) {}
    var isOpen = saved !== '0';
    var wrapper = document.createElement('div');
    wrapper.className = 'ctrl-group-body';
    wrapper.style.display = isOpen ? '' : 'none';
    labelEl.insertAdjacentElement('afterend', wrapper);
    group.items.forEach(function(el) { wrapper.appendChild(el); });
    labelEl.classList.add('ctrl-group-collapsible');
    var arw = document.createElement('span'); arw.className = 'ctrl-group-arrow';
    arw.innerHTML = isOpen ? '&#9660;' : '&#9654;';
    labelEl.insertBefore(arw, labelEl.firstChild);
    (function(l, w, k, open) {
      l.addEventListener('click', function() {
        open = !open;
        l.querySelector('.ctrl-group-arrow').innerHTML = open ? '&#9660;' : '&#9654;';
        w.style.display = open ? '' : 'none';
        try { StorageEngine.setItem(k, open ? '1' : '0'); } catch(e) {}
      });
    })(labelEl, wrapper, key, isOpen);
  });
}

export function initPaneBuilder(deps) {
  _insertMenuItems = deps.insertMenuItems;
  _getLastFocused  = deps.getLastFocusedTextBlockId;
  _insertField     = deps.insertField;

  buildTextPaneButtons();
  applyFormatPaneVisibility();
  initCollapsibleGroups(document.querySelector('#format-pane .ctrl-pane-body'), 'tvs:grp:format');
  initCollapsibleGroups(document.querySelector('#form-pane .ctrl-pane-body'), 'tvs:grp:form');
  wireExpandAllBtn(document.querySelector('#text-pane .ctrl-pane-body'));
  wireExpandAllBtn(document.querySelector('#format-pane .ctrl-pane-body'));
  wireExpandAllBtn(document.querySelector('#form-pane .ctrl-pane-body'));

  document.querySelectorAll('#form-pane .ctrl-btn[data-insert-field]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      _insertField(btn.dataset.insertField, _getLastFocused() || null);
    });
  });
}
