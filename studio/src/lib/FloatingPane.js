/**
 * FloatingPane — draggable, resizable, position-persistent floating dialog
 *
 * Handles: drag-to-move, viewport clamping (respects toolbar),
 * localStorage position/size/open-state persistence, optional resize grip.
 *
 * Usage:
 *   var pane = new FloatingPane(el, {
 *     header, closeBtn,
 *     posKey, openKey,       // localStorage keys (omit to skip persistence)
 *     sizeEl, sizeKey,       // element whose height is persisted (e.g. dialog-main)
 *     resizeEl, minW, minH,  // resize grip config
 *     showClass,             // if set, use classList.add/remove(showClass) instead of style.display
 *   });
 *   pane.restoreSize();      // call once at init if sizeKey is set
 *   pane.open();             // show + restore/clamp position
 *   pane.close();            // hide + persist open state
 */

/**
 * Clamp an element to the viewport, staying below the toolbar.
 * margin=0 (default): element fully contained — no edge can exceed viewport.
 * margin=N: element allowed to slide N px off any edge (partial-visibility mode).
 * Returns {x, y} — does NOT mutate el.style; caller applies the result.
 */
export function clampToViewport(el, opts) {
  var margin = (opts && opts.margin) || 0;
  var w  = (opts && opts.w  != null) ? opts.w  : el.offsetWidth;
  var h  = (opts && opts.h  != null) ? opts.h  : el.offsetHeight;
  var x  = (opts && opts.x  != null) ? opts.x  : parseFloat(el.style.left) || 0;
  var y  = (opts && opts.y  != null) ? opts.y  : parseFloat(el.style.top)  || 0;
  var tb = document.getElementById('toolbar');
  var tbH = tb ? tb.getBoundingClientRect().bottom : 0;
  var xMin = margin ? margin - w : 0;
  var xMax = margin ? window.innerWidth  - margin : window.innerWidth  - w;
  var yMax = margin ? window.innerHeight - margin : window.innerHeight - h;
  return {
    x: Math.max(xMin, Math.min(xMax, x)),
    y: Math.max(tbH,  Math.min(yMax, y)),
  };
}

export class FloatingPane {
  constructor(el, opts) {
    opts = opts || {};
    this.el = typeof el === 'string' ? document.getElementById(el) : el;
    this.posKey   = opts.posKey   || null;
    this.openKey  = opts.openKey  || null;
    this.sizeEl   = opts.sizeEl   || null;
    this.sizeKey  = opts.sizeKey  || null;
    this.showClass = opts.showClass || null;

    if (opts.closeBtn) opts.closeBtn.addEventListener('click', this.close.bind(this));
    if (opts.header)   this._setupDrag(opts.header, opts.closeBtn || null);
    if (opts.resizeEl) this._setupResize(opts.resizeEl, opts.sizeEl || null, opts.minW || 0, opts.minH || 0);
  }

  open() {
    if (this.showClass) this.el.classList.add(this.showClass);
    else this.el.style.display = '';
    this._restorePos();
    if (this.openKey) { try { localStorage.setItem(this.openKey, '1'); } catch(e) {} }
  }

  close() {
    if (this.showClass) this.el.classList.remove(this.showClass);
    else this.el.style.display = 'none';
    if (this.openKey) { try { localStorage.setItem(this.openKey, '0'); } catch(e) {} }
  }

  clamp() {
    // Resolve CSS-transform-based centering to explicit coords before clamping
    if (this.el.style.transform && this.el.style.transform !== 'none') {
      var r = this.el.getBoundingClientRect();
      this.el.style.left = r.left + 'px';
      this.el.style.top  = r.top  + 'px';
      this.el.style.transform = 'none';
    }
    var pos = clampToViewport(this.el);
    this.el.style.left = pos.x + 'px';
    this.el.style.top  = pos.y + 'px';
  }

  restoreSize() {
    if (!this.sizeKey) return;
    try {
      var s = JSON.parse(localStorage.getItem(this.sizeKey));
      if (s && s.w) this.el.style.width = s.w + 'px';
      if (s && s.h && this.sizeEl) this.sizeEl.style.height = s.h + 'px';
    } catch(e) {}
  }

  _restorePos() {
    // If already manually positioned (dragged or restored), just re-clamp
    if (this.el._fpDragged) { this.clamp(); return; }
    if (this.posKey) {
      try {
        var v = JSON.parse(localStorage.getItem(this.posKey));
        if (v && v.left && v.top) {
          this.el.style.left      = v.left;
          this.el.style.top       = v.top;
          this.el.style.transform = 'none';
          this.el._fpDragged = true;
          this.clamp();
          return;
        }
      } catch(e) {}
    }
    this.clamp();
  }

  _setupDrag(header, closeBtn) {
    var self = this;
    header.addEventListener('mousedown', function(e) {
      if (closeBtn && e.target === closeBtn) return;
      var rect = self.el.getBoundingClientRect();
      var startX = e.clientX - rect.left;
      var startY = e.clientY - rect.top;
      self.el.style.transform = 'none';
      self.el._fpDragged = true;
      function onMove(ev) {
        var pos = clampToViewport(self.el, { x: ev.clientX - startX, y: ev.clientY - startY });
        self.el.style.left = pos.x + 'px';
        self.el.style.top  = pos.y + 'px';
      }
      function onUp() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        if (self.posKey) try { localStorage.setItem(self.posKey, JSON.stringify({ left: self.el.style.left, top: self.el.style.top })); } catch(e) {}
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      e.preventDefault();
    });
  }

  _setupResize(resizeEl, sizeEl, minW, minH) {
    var self = this;
    resizeEl.addEventListener('mousedown', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var startX = e.clientX, startY = e.clientY;
      var startW = self.el.offsetWidth;
      var startH = sizeEl ? sizeEl.offsetHeight : self.el.offsetHeight;
      function onMove(ev) {
        self.el.style.width = Math.max(minW, startW + (ev.clientX - startX)) + 'px';
        if (sizeEl) sizeEl.style.height = Math.max(minH, startH + (ev.clientY - startY)) + 'px';
      }
      function onUp() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        if (self.sizeKey) {
          try { localStorage.setItem(self.sizeKey, JSON.stringify({ w: self.el.offsetWidth, h: sizeEl ? sizeEl.offsetHeight : self.el.offsetHeight })); } catch(e) {}
        }
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }
}
