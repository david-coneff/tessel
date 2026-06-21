import * as StorageEngine from './StorageEngine.js';
import { FloatingPane } from './FloatingPane.js';
import { formatDatePattern } from './DateUtils.js';

// ── Editor Custom Date/Time Picker ────────────────────────────────────────
// openEditorPicker(anchorEl, currentDate, isDatetime, onSelect)
(function() {
  var _epInp = null, _epIsDatetime = false, _epCb = null;
  var _epYear = 0, _epMonth = 0, _epSelDate = null, _epHr = 0, _epMn = 0;
  // _epHr is always 0-23 internally; display adapts to _ep12
  var _ep12 = false;
  try { _ep12 = StorageEngine.getItem('tvs:picker12hr') === '1'; } catch(e) {}

  function _epPad(n) { return n < 10 ? '0' + n : '' + n; }

  // Convert internal 0-23 hour to display value in current mode
  function _epHrDisplay(h24) {
    if (!_ep12) return _epPad(h24);
    var h = h24 % 12; return _epPad(h === 0 ? 12 : h);
  }
  // Parse typed hour back to 0-23; needs current AM/PM to resolve
  function _epHrFrom12(dispVal, isPm) {
    var v = parseInt(dispVal, 10);
    if (isNaN(v)) return 0;
    v = Math.max(1, Math.min(12, v));
    if (isPm) return v === 12 ? 12 : v + 12;
    return v === 12 ? 0 : v;
  }

  // Pill button styles
  var _EP_PILL_BASE   = 'background:var(--surface2);border:none;cursor:pointer;font-size:11px;font-weight:600;padding:3px 9px;color:var(--muted);transition:background 0.18s ease,color 0.18s ease;';
  var _EP_PILL_ACTIVE = 'background:var(--accent);border:none;cursor:pointer;font-size:11px;font-weight:600;padding:3px 9px;color:#fff;transition:background 0.18s ease,color 0.18s ease;';
  // Shared styles — no fixed width; grid handles column sizing
  var _EP_INP_STYLE  = 'width:100%;box-sizing:border-box;text-align:center;background:var(--surface2);border:1px solid var(--border);border-radius:4px;color:var(--text);font-size:14px;padding:5px 0;-moz-appearance:textfield;outline:none;';
  var _EP_STEP_STYLE = 'width:100%;box-sizing:border-box;background:none;border:1px solid var(--border);border-radius:4px;cursor:pointer;color:var(--muted);font-size:12px;line-height:1;padding:3px 0;text-align:center;';

  function _epSyncTimeUi() {
    var hrInp    = document.getElementById('ep-hr');
    var amWrap   = document.getElementById('ep-ampm-wrap');
    var amThumb  = document.getElementById('ep-ampm-thumb');
    var amLbl    = document.getElementById('ep-am');
    var pmLbl    = document.getElementById('ep-pm');
    var fmtThumb = document.getElementById('ep-hrfmt-thumb');
    var fmt12Lbl = document.getElementById('ep-fmt-12');
    var fmt24Lbl = document.getElementById('ep-fmt-24');
    if (hrInp) {
      hrInp.value = _epHrDisplay(_epHr);
      hrInp.setAttribute('max', _ep12 ? '12' : '23');
      hrInp.setAttribute('min', _ep12 ? '1' : '0');
    }
    if (amWrap) {
      amWrap.style.opacity = _ep12 ? '1' : '0.3';
      amWrap.style.pointerEvents = _ep12 ? '' : 'none';
    }
    var isAm = _epHr < 12;
    if (amThumb)  amThumb.style.transform  = isAm ? 'translateX(0)' : 'translateX(100%)';
    if (amLbl)    amLbl.style.color        = isAm ? '#fff' : 'var(--muted)';
    if (pmLbl)    pmLbl.style.color        = isAm ? 'var(--muted)' : '#fff';
    if (fmtThumb) fmtThumb.style.transform = _ep12 ? 'translateX(0)' : 'translateX(100%)';
    if (fmt12Lbl) fmt12Lbl.style.color     = _ep12 ? '#fff' : 'var(--muted)';
    if (fmt24Lbl) fmt24Lbl.style.color     = _ep12 ? 'var(--muted)' : '#fff';
  }

  function _epCreate() {
    if (document.getElementById('ed-picker')) return;
    var p = document.createElement('div');
    p.id = 'ed-picker';
    p.style.cssText = 'display:none;position:fixed;z-index:99999;background:var(--surface);border:1px solid var(--border);border-radius:8px;box-shadow:0 8px 32px rgba(0,0,0,.32);min-width:280px;font-size:13px;color:var(--text);user-select:none;';
    p.innerHTML =
      '<div style="display:flex;align-items:center;gap:4px;padding:8px 10px;border-bottom:1px solid var(--border);">'
      + '<button id="ep-prev" style="background:none;border:1px solid var(--border);border-radius:4px;cursor:pointer;color:var(--muted);font-size:16px;line-height:1;padding:2px 8px;">&#8249;</button>'
      + '<select id="ep-month" style="flex:1;background:var(--surface2);border:1px solid var(--border);border-radius:4px;color:var(--text);font-size:12px;font-weight:600;padding:4px 6px;"><option value="0">January</option><option value="1">February</option><option value="2">March</option><option value="3">April</option><option value="4">May</option><option value="5">June</option><option value="6">July</option><option value="7">August</option><option value="8">September</option><option value="9">October</option><option value="10">November</option><option value="11">December</option></select>'
      + '<input id="ep-year" type="number" min="1900" max="2200" style="width:65px;background:var(--surface2);border:1px solid var(--border);border-radius:4px;color:var(--text);font-size:12px;font-weight:600;padding:4px 6px;">'
      + '<button id="ep-next" style="background:none;border:1px solid var(--border);border-radius:4px;cursor:pointer;color:var(--muted);font-size:16px;line-height:1;padding:2px 8px;">&#8250;</button>'
      + '<button id="ep-close" style="background:none;border:1px solid var(--border);border-radius:4px;cursor:pointer;color:var(--muted);font-size:16px;line-height:1;padding:2px 7px;">&#215;</button>'
      + '</div>'
      + '<div style="padding:8px 10px;">'
      + '<div id="ep-wds" style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:4px;"></div>'
      + '<div id="ep-days" style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;height:182px;align-content:start;"></div>'
      + '</div>'
      // ── Time section ──────────────────────────────────────────
      // Outer flex: vertical "Time" label left, controls fill remainder
      + '<div id="ep-time" style="display:none;border-top:1px solid var(--border);align-items:stretch;">'
      +   '<div id="ep-time-lbl" style="writing-mode:vertical-rl;transform:rotate(180deg);font-size:11px;color:var(--muted);padding:10px 6px;border-right:1px solid var(--border);display:flex;align-items:center;justify-content:center;letter-spacing:.04em;">Time</div>'
      +   '<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:10px;gap:8px;">'
      //     CSS grid: columns [hr] [colon] [mn] — guarantees +/- match input widths exactly
      +     '<div style="display:grid;grid-template-columns:1fr auto 1fr;gap:3px 0;flex:1;">'
      +       '<button id="ep-hr-up" style="' + _EP_STEP_STYLE + 'margin-right:4px;">&#43;</button>'
      +       '<span style="display:block;width:22px;"></span>'
      +       '<button id="ep-mn-up" style="' + _EP_STEP_STYLE + 'margin-left:4px;">&#43;</button>'
      +       '<input id="ep-hr" type="number" min="0" max="23" style="' + _EP_INP_STYLE + 'margin-right:4px;">'
      +       '<span style="font-weight:700;font-size:16px;color:var(--muted);width:22px;display:flex;align-items:center;justify-content:center;align-self:stretch;">:</span>'
      +       '<input id="ep-mn" type="number" min="0" max="59" style="' + _EP_INP_STYLE + 'margin-left:4px;">'
      +       '<button id="ep-hr-dn" style="' + _EP_STEP_STYLE + 'margin-right:4px;">&#8722;</button>'
      +       '<span style="display:block;width:22px;"></span>'
      +       '<button id="ep-mn-dn" style="' + _EP_STEP_STYLE + 'margin-left:4px;">&#8722;</button>'
      +     '</div>'
      //     AM/PM sliding pill — always in DOM; thumb slides; dimmed in 24h mode
      +     '<div id="ep-ampm-wrap" style="position:relative;width:80px;align-self:stretch;border:1px solid var(--border);border-radius:5px;cursor:pointer;overflow:hidden;display:flex;">'
      +       '<div id="ep-ampm-thumb" style="position:absolute;top:2px;left:2px;width:calc(50% - 2px);height:calc(100% - 4px);border-radius:3px;background:var(--accent);transition:transform 0.18s ease;z-index:0;will-change:transform;"></div>'
      +       '<span id="ep-am" style="flex:1;position:relative;z-index:1;font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center;pointer-events:none;color:#fff;">AM</span>'
      +       '<span id="ep-pm" style="flex:1;position:relative;z-index:1;font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center;pointer-events:none;color:var(--muted);">PM</span>'
      +     '</div>'
      +   '</div>'
      + '</div>'
      // ── Footer mirrors time grid: [Done+Clear : 1fr] [22px gap] [Now : 1fr] [8px] [12h/24h pill]
      // Wrapped in same left-offset as time-inner to align columns
      + '<div id="ep-footer" style="display:flex;align-items:stretch;border-top:1px solid var(--border);">'
      // Transparent spacer matching the "Time" label column width
      +   '<div id="ep-lbl-spc" style="display:none;border-right:1px solid transparent;flex-shrink:0;"></div>'
      +   '<div style="flex:1;display:flex;align-items:center;gap:8px;padding:8px 10px;">'
      //     Main grid: mirrors time section 1fr/auto/1fr structure for pixel-perfect column alignment
      +     '<div style="flex:1;display:grid;grid-template-columns:1fr auto 1fr;">'
      //       1fr cell under HH: Done+Clear as a single bordered group
      +       '<div style="margin-right:4px;display:flex;align-items:stretch;">'
      +         '<button id="ep-done" style="flex:1;background:var(--surface2);border:1px solid var(--border);border-radius:4px;cursor:pointer;color:var(--text);font-size:11px;padding:4px 6px;font-weight:600;margin-right:3px;">Done</button>'
      +         '<button id="ep-clear" style="flex:1;background:var(--surface2);border:1px solid var(--border);border-radius:4px;cursor:pointer;color:var(--text);font-size:11px;padding:4px 6px;">Clear</button>'
      +       '</div>'
      //       22px spacer under colon
      +       '<span style="width:22px;flex-shrink:0;display:block;"></span>'
      //       1fr cell under MM: Now button constrained to same width as MM input
      +       '<div style="margin-left:4px;">'
      +         '<button id="ep-today" style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:4px;cursor:pointer;color:var(--text);font-size:11px;padding:4px 6px;">Now</button>'
      +       '</div>'
      +     '</div>'
      //     Gap (from gap:8px on parent) + 12h/24h sliding pill (same slot as AM/PM pill)
      +     '<div id="ep-hrfmt-wrap" style="display:none;position:relative;width:80px;align-self:stretch;border:1px solid var(--border);border-radius:5px;cursor:pointer;overflow:hidden;">'
      +       '<div id="ep-hrfmt-thumb" style="position:absolute;top:2px;left:2px;width:calc(50% - 2px);height:calc(100% - 4px);border-radius:3px;background:var(--accent);transition:transform 0.18s ease;z-index:0;will-change:transform;"></div>'
      +       '<span id="ep-fmt-12" style="flex:1;position:relative;z-index:1;font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center;pointer-events:none;color:var(--muted);">12h</span>'
      +       '<span id="ep-fmt-24" style="flex:1;position:relative;z-index:1;font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center;pointer-events:none;color:#fff;">24h</span>'
      +     '</div>'
      +   '</div>'
      + '</div>';

    // Weekday headers
    var wds = p.querySelector('#ep-wds');
    ['Su','Mo','Tu','We','Th','Fr','Sa'].forEach(function(d) {
      var s = document.createElement('div');
      s.style.cssText = 'text-align:center;font-size:10px;font-weight:600;color:var(--muted);padding:2px 0;';
      s.textContent = d;
      wds.appendChild(s);
    });

    // Hover on nav/step/footer buttons only (pill buttons manage their own styling)
    var _EP_PILL_IDS = {};
    p.addEventListener('mouseover', function(e) {
      var btn = e.target.closest('button');
      if (!btn || !p.contains(btn) || _EP_PILL_IDS[btn.id]) return;
      btn.style.borderColor = 'var(--accent)';
      btn.style.color = 'var(--accent)';
    });
    p.addEventListener('mouseout', function(e) {
      var btn = e.target.closest('button');
      if (!btn || !p.contains(btn) || _EP_PILL_IDS[btn.id]) return;
      btn.style.borderColor = '';
      btn.style.color = '';
    });

    // Kill webkit number-input spinners (can't be done with inline styles)
    var _epStyle = document.createElement('style');
    _epStyle.textContent = '#ep-hr::-webkit-inner-spin-button,#ep-hr::-webkit-outer-spin-button,'
      + '#ep-mn::-webkit-inner-spin-button,#ep-mn::-webkit-outer-spin-button,'
      + '#ep-year::-webkit-inner-spin-button,#ep-year::-webkit-outer-spin-button'
      + '{-webkit-appearance:none;margin:0;}'
      + '#ep-done:hover{border-color:var(--accent);background:rgba(137,180,250,.12);color:var(--accent);}'
      + '#ep-clear:hover{border-color:var(--red,#e06c75);color:var(--red,#e06c75);}'
      + '#ep-today:hover{border-color:var(--accent);color:var(--accent);}';
    document.head.appendChild(_epStyle);

    document.body.appendChild(p);

    // Measure Time label width once and sync footer spacer for perfect column alignment
    (function() {
      var savedVis = p.style.visibility;
      var savedDisp = p.style.display;
      var timeSec = document.getElementById('ep-time');
      var savedTimeDisp = timeSec.style.display;
      p.style.visibility = 'hidden'; p.style.display = 'block';
      timeSec.style.display = 'flex';
      var timeLbl = document.getElementById('ep-time-lbl');
      var spc = document.getElementById('ep-lbl-spc');
      if (timeLbl && spc) spc.style.width = timeLbl.offsetWidth + 'px';
      timeSec.style.display = savedTimeDisp;
      p.style.display = savedDisp; p.style.visibility = savedVis;
    }());

    document.getElementById('ep-prev').addEventListener('click', function() { _epMonth--; if (_epMonth < 0) { _epMonth = 11; _epYear--; } _epRender(); });
    document.getElementById('ep-next').addEventListener('click', function() { _epMonth++; if (_epMonth > 11) { _epMonth = 0; _epYear++; } _epRender(); });
    document.getElementById('ep-close').addEventListener('click', _epClose);
    document.getElementById('ep-today').addEventListener('click', function() {
      var n = new Date();
      if (_epIsDatetime) { _epHr = n.getHours(); _epMn = n.getMinutes(); _epSyncTimeUi(); document.getElementById('ep-mn').value = _epPad(_epMn); }
      _epSelDate = new Date(n.getFullYear(), n.getMonth(), n.getDate());
      _epYear = _epSelDate.getFullYear(); _epMonth = _epSelDate.getMonth();
      _epRender(); if (!_epIsDatetime) _epCommit();
    });
    document.getElementById('ep-clear').addEventListener('click', function() {
      _epSelDate = null;
      if (_epIsDatetime) { _epHr = 0; _epMn = 0; var m = document.getElementById('ep-mn'); if (m) m.value = _epPad(0); _epSyncTimeUi(); }
      _epRender();
    });
    document.getElementById('ep-done').addEventListener('click', _epCommit);

    document.getElementById('ep-hr-dn').addEventListener('click', function() { _epHr = (_epHr - 1 + 24) % 24; _epSyncTimeUi(); });
    document.getElementById('ep-hr-up').addEventListener('click', function() { _epHr = (_epHr + 1) % 24; _epSyncTimeUi(); });
    document.getElementById('ep-mn-dn').addEventListener('click', function() { _epMn = (_epMn - 5 + 60) % 60; document.getElementById('ep-mn').value = _epPad(_epMn); });
    document.getElementById('ep-mn-up').addEventListener('click', function() { _epMn = (_epMn + 5) % 60; document.getElementById('ep-mn').value = _epPad(_epMn); });

    document.getElementById('ep-hr').addEventListener('change', function() {
      if (_ep12) {
        _epHr = _epHrFrom12(this.value, _epHr >= 12);
      } else {
        var v = parseInt(this.value, 10);
        _epHr = isNaN(v) ? 0 : Math.max(0, Math.min(23, v));
      }
      _epSyncTimeUi();
    });
    document.getElementById('ep-mn').addEventListener('change', function() { var v = parseInt(this.value, 10); _epMn = isNaN(v) ? 0 : Math.max(0, Math.min(59, v)); this.value = _epPad(_epMn); });

    function _epToggleAmPm() { _epHr = (_epHr + 12) % 24; _epSyncTimeUi(); }
    document.getElementById('ep-ampm-wrap').addEventListener('click', _epToggleAmPm);

    function _epToggleFmt() {
      _ep12 = !_ep12; try { StorageEngine.setItem('tvs:picker12hr', _ep12 ? '1' : '0'); } catch(e) {} _epSyncTimeUi();
    }
    document.getElementById('ep-hrfmt-wrap').addEventListener('click', _epToggleFmt);

    var epMoSel = document.getElementById('ep-month');
    if (epMoSel) epMoSel.addEventListener('change', function() {
      _epMonth = parseInt(this.value, 10);
      _epRender();
    });
    var epYrInp = document.getElementById('ep-year');
    if (epYrInp) epYrInp.addEventListener('change', function() {
      var y = parseInt(this.value, 10);
      if (!isNaN(y) && y > 0) { _epYear = y; _epRender(); }
    });

    document.addEventListener('mousedown', function(e) {
      var pk = document.getElementById('ed-picker');
      if (pk && pk.style.display !== 'none' && !pk.contains(e.target) && e.target !== _epInp) _epClose();
    }, true);
  }

  function _epRender() {
    var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    var epMoSel = document.getElementById('ep-month');
    var epYrInp = document.getElementById('ep-year');
    if (epMoSel) epMoSel.value = String(_epMonth);
    if (epYrInp) epYrInp.value = String(_epYear);
    var days = document.getElementById('ep-days');
    if (!days) return;
    days.innerHTML = '';
    var firstDay = new Date(_epYear, _epMonth, 1).getDay();
    var daysInMonth = new Date(_epYear, _epMonth + 1, 0).getDate();
    var daysInPrev = new Date(_epYear, _epMonth, 0).getDate();
    var today = new Date(); today = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    for (var i = 0; i < firstDay; i++) {
      var blank = document.createElement('div');
      blank.style.cssText = 'text-align:center;padding:5px 2px;font-size:12px;color:var(--muted);opacity:.4;';
      blank.textContent = daysInPrev - firstDay + 1 + i;
      days.appendChild(blank);
    }
    for (var d = 1; d <= daysInMonth; d++) {
      var cell = document.createElement('div');
      var cellDate = new Date(_epYear, _epMonth, d);
      var isSel = _epSelDate && cellDate.getTime() === _epSelDate.getTime();
      var isToday = cellDate.getTime() === today.getTime();
      cell.style.cssText = 'text-align:center;padding:5px 2px;border-radius:4px;cursor:pointer;font-size:12px;border:1px solid transparent;'
        + (isSel ? 'background:var(--accent);color:#fff;border-color:var(--accent);' : '')
        + (!isSel && isToday ? 'font-weight:700;color:var(--accent);' : '');
      cell.textContent = d;
      if (!isSel) {
        cell.addEventListener('mouseover', function() { this.style.borderColor = 'var(--accent)'; this.style.color = 'var(--accent)'; });
        cell.addEventListener('mouseout', function() { this.style.borderColor = 'transparent'; this.style.color = ''; });
      }
      (function(yr, mo, dy) {
        cell.addEventListener('click', function() {
          _epSelDate = new Date(yr, mo, dy); _epRender();
          if (!_epIsDatetime) _epCommit();
        });
      }(_epYear, _epMonth, d));
      days.appendChild(cell);
    }
    var trail = 42 - firstDay - daysInMonth;
    for (var t = 1; t <= trail; t++) {
      var tb = document.createElement('div');
      tb.style.cssText = 'text-align:center;padding:5px 2px;font-size:12px;color:var(--muted);opacity:.4;';
      tb.textContent = t; days.appendChild(tb);
    }
  }

  function _epCommit() {
    if (!_epSelDate) return;
    var d = new Date(_epSelDate.getFullYear(), _epSelDate.getMonth(), _epSelDate.getDate(), _epIsDatetime ? _epHr : 0, _epIsDatetime ? _epMn : 0, 0);
    var cb = _epCb;
    _epClose();
    if (cb) cb(d);
  }

  function _epClose() {
    var pk = document.getElementById('ed-picker');
    if (pk) pk.style.display = 'none';
    _epCb = null; _epInp = null;
  }

  window.openEditorPicker = function(anchorEl, currentDate, isDatetime, onSelect) {
    _epCreate();
    _epCb = onSelect;
    _epInp = anchorEl;
    _epIsDatetime = !!isDatetime;
    var init = (currentDate && !isNaN(currentDate.getTime())) ? currentDate : new Date();
    _epSelDate = new Date(init.getFullYear(), init.getMonth(), init.getDate());
    _epYear = _epSelDate.getFullYear(); _epMonth = _epSelDate.getMonth();
    _epHr = init.getHours(); _epMn = init.getMinutes();
    var timeRow = document.getElementById('ep-time');
    if (timeRow) timeRow.style.display = isDatetime ? 'flex' : 'none';
    var fmtWrap = document.getElementById('ep-hrfmt-wrap');
    if (fmtWrap) fmtWrap.style.display = isDatetime ? 'flex' : 'none';
    var lblSpc = document.getElementById('ep-lbl-spc');
    if (lblSpc) lblSpc.style.display = isDatetime ? '' : 'none';
    var mnInp = document.getElementById('ep-mn');
    if (mnInp) mnInp.value = _epPad(_epMn);
    _epSyncTimeUi();
    var todayBtn = document.getElementById('ep-today');
    if (todayBtn) todayBtn.textContent = isDatetime ? 'Now' : 'Today';
    _epRender();
    var pk = document.getElementById('ed-picker');
    pk.style.display = '';
    var r = anchorEl.getBoundingClientRect();
    var pw = pk.offsetWidth || 264; var ph = pk.offsetHeight || 320;
    var left = r.left; var top = r.bottom + 6;
    if (left + pw > window.innerWidth - 8) left = window.innerWidth - pw - 8;
    if (left < 8) left = 8;
    if (top + ph > window.innerHeight - 8) top = r.top - ph - 6;
    if (top < 8) top = 8;
    pk.style.left = left + 'px'; pk.style.top = top + 'px';
  };
})();

// ── Date Pattern Help Floater ─────────────────────────────────────────────
(function() {
  var helpDialog = document.getElementById('datefmt-help-dialog');
  var helpHeader  = document.getElementById('datefmt-help-header');
  var helpClose   = document.getElementById('datefmt-help-close');
  var helpBtn     = document.getElementById('opts-datefmt-help-btn');
  var helpPattern = document.getElementById('datefmt-help-pattern');
  var helpDtDisplay = document.getElementById('datefmt-help-dt-display');
  var helpCalBtn    = document.getElementById('datefmt-help-cal-btn');
  var helpPreview   = document.getElementById('datefmt-help-preview');
  var helpTbody     = document.getElementById('datefmt-help-tbody');
  if (!helpDialog) return;

  // Token reference table data
  var TOKEN_ROWS = [
    ['YYYY', 'Full year (4 digits)', '2025'],
    ['YY',   'Short year (2 digits)', '25'],
    ['MMMM', 'Full month name', 'January'],
    ['MMM',  'Abbreviated month', 'Jan'],
    ['MM',   'Month number, zero-padded', '01'],
    ['M',    'Month number, no padding', '1'],
    ['DD',   'Day of month, zero-padded', '05'],
    ['D',    'Day of month, no padding', '5'],
    ['HH',   '24-hour hour, zero-padded', '14'],
    ['H',    '24-hour hour, no padding', '14'],
    ['hh',   '12-hour hour, zero-padded', '02'],
    ['h',    '12-hour hour, no padding', '2'],
    ['mm',   'Minutes, zero-padded', '30'],
    ['ss',   'Seconds, zero-padded', '07'],
    ['A',    'AM / PM (uppercase)', 'PM'],
    ['a',    'am / pm (lowercase)', 'pm']
  ];

  // Build table
  var refDate = new Date(2025, 0, 5, 14, 30, 7); // Jan 5 2025 14:30:07
  TOKEN_ROWS.forEach(function(row) {
    var tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid var(--border)';
    [row[0], row[1], row[2]].forEach(function(cell, ci) {
      var td = document.createElement('td');
      td.style.cssText = 'padding:4px 8px;vertical-align:top;';
      if (ci === 0) {
        td.style.fontFamily = 'monospace';
        td.style.fontWeight = '600';
        td.style.color = 'var(--accent)';
        td.style.whiteSpace = 'nowrap';
      }
      if (ci === 2) { td.style.fontFamily = 'monospace'; td.style.color = 'var(--muted)'; }
      td.textContent = cell;
      tr.appendChild(td);
    });
    helpTbody.appendChild(tr);
  });

  // Current selected date (tracks what the hidden picker holds)
  var _helpDate = new Date();

  function padZ(n) { return n < 10 ? '0' + n : '' + n; }
  function nowLocalISO() {
    var n = new Date();
    return n.getFullYear() + '-' + padZ(n.getMonth()+1) + '-' + padZ(n.getDate()) + 'T' + padZ(n.getHours()) + ':' + padZ(n.getMinutes());
  }

  function syncDisplay(date) {
    if (!date || isNaN(date.getTime())) { helpDtDisplay.textContent = ''; return; }
    var pat = (helpPattern.value || '').trim();
    // Show in a neutral readable form in the display box
    var displayFmt = 'YYYY-MM-DD HH:mm';
    helpDtDisplay.textContent = (typeof formatDatePattern === 'function')
      ? formatDatePattern(date, displayFmt) : nowLocalISO().replace('T', ' ');
  }

  function updatePreview() {
    var pat = (helpPattern.value || '').trim();
    if (!pat) { helpPreview.textContent = ''; return; }
    var date = _helpDate;
    if (!date || isNaN(date.getTime())) { helpPreview.textContent = ''; return; }
    if (typeof formatDatePattern === 'function') {
      helpPreview.textContent = formatDatePattern(date, pat);
    } else {
      helpPreview.textContent = '(formatter not available)';
    }
  }

  // Calendar button — opens editor custom picker
  if (helpCalBtn) {
    helpCalBtn.addEventListener('mouseenter', function() { helpCalBtn.style.opacity = '1'; helpCalBtn.style.borderColor = 'var(--accent)'; helpCalBtn.style.color = 'var(--accent)'; });
    helpCalBtn.addEventListener('mouseleave', function() { helpCalBtn.style.opacity = '.7'; helpCalBtn.style.borderColor = 'var(--border)'; helpCalBtn.style.color = 'var(--text)'; });
    helpCalBtn.addEventListener('click', function() {
      openEditorPicker(helpCalBtn, _helpDate, true, function(date) {
        _helpDate = date;
        syncDisplay(_helpDate);
        updatePreview();
      });
    });
  }

  helpPattern.addEventListener('input', function() { syncDisplay(_helpDate); updatePreview(); });

  var helpPane = new FloatingPane(helpDialog, {
    header:   helpHeader,
    closeBtn: helpClose,
    posKey:   'tvs:datefmtHelpPos',
    openKey:  'tvs:datefmtHelpOpen',
  });

  function openHelp() {
    helpPane.open();
    _helpDate = new Date();
    syncDisplay(_helpDate);
    updatePreview();
  }

  // Restore open state on load
  try { if (StorageEngine.getItem('tvs:datefmtHelpOpen') === '1') openHelp(); } catch(e) {}

  if (helpBtn) helpBtn.addEventListener('click', openHelp);
  // close handled by helpPane constructor
})();
