import { uid, slugify, esc } from './utils.js';
import { insertBlock } from './BlockOps.js';
import { closeAllDropdowns } from './FileOps.js';

export var INSERT_MENU_ITEMS = [
  { group: 'Text Content' },
  { label: 'Heading 1', icon: 'H1', action: function(aid) { insertBlock({ type:'heading', level:1, text:'Heading', id:uid() }, aid); } },
  { label: 'Heading 2', icon: 'H2', action: function(aid) { insertBlock({ type:'heading', level:2, text:'Heading', id:uid() }, aid); } },
  { label: 'Heading 3', icon: 'H3', action: function(aid) { insertBlock({ type:'heading', level:3, text:'Heading', id:uid() }, aid); } },
  { label: 'Paragraph', icon: '¶',  action: function(aid) { insertBlock({ type:'paragraph', text:'', id:uid() }, aid); } },
  { label: 'Divider',       icon: '—',  action: function(aid) { insertBlock({ type:'hr', id:uid() }, aid); } },
  { label: 'Bulleted List', icon: '•',  action: function(aid) { insertBlock({ type:'list', ordered:false, items:[''], id:uid() }, aid); } },
  { label: 'Ordered List',  icon: '1.', action: function(aid) { insertBlock({ type:'list', ordered:true,  items:[''], id:uid() }, aid); } },
  { group: 'Structure' },
  { label: 'Collapsible Section', icon: '▶',  action: function(aid) { insertBlock({ type:'section', title:'Section Title', children:[], id:uid() }, aid); } },
  { label: 'Code Block',          icon: '</>',action: function(aid) { insertBlock({ type:'codeblock', lang:'bash', code:'', id:uid() }, aid); } },
  { label: 'Attachment (author)', icon: '📎', action: function(aid) { insertBlock({ type:'attachment', files:[], id:uid() }, aid); } },
];

export function insertField(ft, afterId) {
  var b = { type:'field', fieldType:ft, label:'Label', options:[], meta:{}, id:uid() };
  b.meta.id = slugify(b.label);
  insertBlock(b, afterId);
}

export var insertFloatAfter = null;

export function buildInsertMenuContent(container, getAfterId) {
  container.innerHTML = '';
  INSERT_MENU_ITEMS.forEach(function(item) {
    if (item.group) {
      var g = document.createElement('div'); g.className = 'dm-group'; g.textContent = item.group;
      container.appendChild(g);
    } else {
      var d = document.createElement('div'); d.className = 'dm-item';
      d.innerHTML = '<span class="dm-icon">' + esc(item.icon) + '</span>' + esc(item.label);
      d.addEventListener('click', function() {
        closeAllDropdowns();
        item.action(getAfterId ? getAfterId() : null);
      });
      container.appendChild(d);
    }
  });
}

export function buildInsertMenuHTML() {
  buildInsertMenuContent(document.getElementById('dm-insert'), function() { return null; });
}

export function showInsertFloat(afterId, anchorEl) {
  insertFloatAfter = afterId;
  var fl = document.getElementById('insert-float');
  buildInsertMenuContent(fl, function() { return insertFloatAfter; });
  var rect = anchorEl.getBoundingClientRect();
  fl.style.top = (rect.bottom + 4) + 'px';
  fl.style.left = rect.left + 'px';
  fl.classList.add('show');
}
