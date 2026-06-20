var _renderProps = null;
export function initDateUtils(deps) { _renderProps = deps.renderProps; }

export var DATE_FMT_DEFAULTS = {
  date:     ['YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY', 'DD MMM YYYY', 'MMM DD, YYYY', 'MMMM DD, YYYY'],
  datetime: ['YYYY-MM-DD HH:mm', 'YYYY-MM-DD HH:mm:ss', 'MM/DD/YYYY h:mm A', 'MM/DD/YYYY HH:mm', 'DD/MM/YYYY HH:mm', 'MMM DD, YYYY h:mm A', 'MMMM DD, YYYY h:mm A']
};

export function getTzList() {
  try { var tzs = Intl.supportedValuesOf('timeZone'); if (tzs && tzs.length) return tzs; } catch(e) {}
  return ['UTC','America/New_York','America/Chicago','America/Denver','America/Los_Angeles','America/Phoenix','America/Anchorage','Pacific/Honolulu','Europe/London','Europe/Paris','Europe/Berlin','Europe/Moscow','Asia/Dubai','Asia/Kolkata','Asia/Singapore','Asia/Tokyo','Asia/Shanghai','Australia/Sydney','Pacific/Auckland'];
}

export var TZ_SHORTCODES = [
  'UTC','GMT',
  'EST','EDT','CST','CDT','MST','MDT','PST','PDT','AKST','AKDT','HST',
  'AST','NST','NDT',
  'WET','CET','CEST','EET','EEST','MSK',
  'IST','PKT','BST','ICT','WIB','CST','JST','KST','AEST','AEDT','ACST','ACDT','AWST',
  'NZST','NZDT','SST','CHST'
];

export function getDefaultTimezone() {
  try { var v = localStorage.getItem('tvs:defaultTimezone'); if (v) return v; } catch(e) {}
  return '';
}
export function saveDefaultTimezone(tz) {
  try { localStorage.setItem('tvs:defaultTimezone', tz); } catch(e) {}
}
export function getDateFmtPresets(type) {
  try {
    var raw = localStorage.getItem('tvs:dateFormatPresets:' + type);
    if (raw) { var arr = JSON.parse(raw); if (Array.isArray(arr) && arr.length) return arr; }
  } catch(e) {}
  return DATE_FMT_DEFAULTS[type].slice();
}
export function saveDateFmtPresets(type, arr) {
  try { localStorage.setItem('tvs:dateFormatPresets:' + type, JSON.stringify(arr)); } catch(e) {}
}

export function buildDateFmtSection() {
  function buildGroup(containerId, type, label) {
    var wrap = document.getElementById(containerId);
    if (!wrap) return;
    wrap.innerHTML = '';
    var hdr = document.createElement('div');
    hdr.style.cssText = 'display:flex;align-items:center;margin-bottom:8px;';
    var lbl = document.createElement('div'); lbl.className = 'opts-section-label'; lbl.style.margin = '0'; lbl.textContent = label + ' Presets';
    var rst = document.createElement('button'); rst.className = 'datefmt-reset-btn'; rst.textContent = 'Reset defaults';
    rst.addEventListener('click', function() {
      saveDateFmtPresets(type, DATE_FMT_DEFAULTS[type].slice());
      buildGroup(containerId, type, label);
    });
    hdr.appendChild(lbl); hdr.appendChild(rst); wrap.appendChild(hdr);

    var list = document.createElement('div');
    wrap.appendChild(list);

    function rebuildList() {
      var presets = getDateFmtPresets(type);
      list.innerHTML = '';
      presets.forEach(function(pat, idx) {
        var row = document.createElement('div'); row.className = 'datefmt-preset-row';
        var inp = document.createElement('input'); inp.type = 'text'; inp.value = pat;
        inp.addEventListener('change', function() {
          var cur = getDateFmtPresets(type);
          cur[idx] = inp.value.trim() || cur[idx];
          saveDateFmtPresets(type, cur);
          rebuildList();
        });
        var del = document.createElement('button'); del.className = 'opt-del'; del.innerHTML = '&times;'; del.title = 'Remove';
        del.addEventListener('click', function() {
          var cur = getDateFmtPresets(type);
          cur.splice(idx, 1);
          saveDateFmtPresets(type, cur);
          rebuildList();
        });
        row.appendChild(inp); row.appendChild(del); list.appendChild(row);
      });
    }
    rebuildList();

    var addBtn = document.createElement('button'); addBtn.className = 'datefmt-add-btn'; addBtn.textContent = '+ Add preset';
    addBtn.addEventListener('click', function() {
      var cur = getDateFmtPresets(type);
      cur.push(''); saveDateFmtPresets(type, cur);
      rebuildList();
      var rows = list.querySelectorAll('.datefmt-preset-row');
      if (rows.length) rows[rows.length - 1].querySelector('input').focus();
    });
    wrap.appendChild(addBtn);
  }
  buildGroup('opts-datefmt-date-wrap', 'date', 'Date');
  buildGroup('opts-datefmt-datetime-wrap', 'datetime', 'Date-Time');
  var tzWrap = document.getElementById('opts-datefmt-tz-wrap');
  if (tzWrap) {
    tzWrap.innerHTML = '';

    var tzModeKey = 'tvs:tzPickerMode';
    function getTzMode() { try { return localStorage.getItem(tzModeKey) || 'iana'; } catch(e) { return 'iana'; } }
    function saveTzMode(m) { try { localStorage.setItem(tzModeKey, m); } catch(e) {} }

    var pillWrap = document.createElement('div');
    pillWrap.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:8px;';
    var pillLbl = document.createElement('span');
    pillLbl.textContent = 'Format';
    pillLbl.style.cssText = 'font-size:11px;color:var(--muted);';
    var pill = document.createElement('div');
    pill.className = 'opts-pill-group';
    pill.id = 'opts-tz-mode-pill';
    pill.innerHTML = '<div class="opts-pill-slider" id="opts-tz-mode-slider"></div>'
      + '<input type="radio" name="tz-mode" id="opts-tz-mode-iana" value="iana">'
      + '<label for="opts-tz-mode-iana">Region/City</label>'
      + '<input type="radio" name="tz-mode" id="opts-tz-mode-short" value="short">'
      + '<label for="opts-tz-mode-short">Shortcode</label>';
    pillWrap.appendChild(pillLbl);
    pillWrap.appendChild(pill);
    tzWrap.appendChild(pillWrap);

    var ianaListId = 'tz-iana-datalist';
    var shortListId = 'tz-short-datalist';
    var ianaDl = document.getElementById(ianaListId);
    if (!ianaDl) {
      ianaDl = document.createElement('datalist');
      ianaDl.id = ianaListId;
      var tzs = getTzList();
      for (var ti = 0; ti < tzs.length; ti++) {
        var o = document.createElement('option'); o.value = tzs[ti]; ianaDl.appendChild(o);
      }
      document.body.appendChild(ianaDl);
    }
    var shortDl = document.getElementById(shortListId);
    if (!shortDl) {
      shortDl = document.createElement('datalist');
      shortDl.id = shortListId;
      for (var si = 0; si < TZ_SHORTCODES.length; si++) {
        var so = document.createElement('option'); so.value = TZ_SHORTCODES[si]; shortDl.appendChild(so);
      }
      document.body.appendChild(shortDl);
    }

    var inputRow = document.createElement('div');
    inputRow.style.cssText = 'display:flex;align-items:center;gap:6px;';
    var tzInput = document.createElement('input');
    tzInput.type = 'text';
    tzInput.className = 'opts-text-input';
    tzInput.style.cssText = 'flex:1;min-width:0;';
    var defTz = getDefaultTimezone();
    if (defTz) tzInput.value = defTz;
    var tzClearBtn = document.createElement('button');
    tzClearBtn.type = 'button';
    tzClearBtn.className = 'opts-num-step-btn';
    tzClearBtn.style.cssText = 'font-size:11px;padding:5px 8px;';
    tzClearBtn.textContent = 'Clear';
    inputRow.appendChild(tzInput);
    inputRow.appendChild(tzClearBtn);
    tzWrap.appendChild(inputRow);

    function applyTzMode(mode) {
      tzInput.setAttribute('list', mode === 'short' ? shortListId : ianaListId);
      tzInput.placeholder = mode === 'short' ? 'e.g. MST, EDT, UTC' : 'e.g. America/New_York';
      var radios = pill.querySelectorAll('input[type="radio"]');
      for (var ri = 0; ri < radios.length; ri++) radios[ri].checked = (radios[ri].value === mode);
      setTimeout(function() {
        var slider = document.getElementById('opts-tz-mode-slider');
        var labels = pill.querySelectorAll('label');
        for (var li = 0; li < labels.length; li++) {
          var r = pill.querySelectorAll('input[type="radio"]')[li];
          if (r && r.checked) {
            slider.style.left = labels[li].offsetLeft + 'px';
            slider.style.width = labels[li].offsetWidth + 'px';
            break;
          }
        }
      }, 0);
    }

    var modeRadios = pill.querySelectorAll('input[type="radio"]');
    for (var mri = 0; mri < modeRadios.length; mri++) {
      modeRadios[mri].addEventListener('change', function() {
        var m = this.value;
        saveTzMode(m);
        applyTzMode(m);
        if (_renderProps) _renderProps();
      });
    }

    tzInput.addEventListener('change', function() { saveDefaultTimezone(tzInput.value.trim()); });
    tzClearBtn.addEventListener('click', function() { tzInput.value = ''; saveDefaultTimezone(''); });

    applyTzMode(getTzMode());
  }
}

export function formatDatePattern(date, pattern) {
  var ML = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var MS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var Y = date.getFullYear(), Mo = date.getMonth(), D = date.getDate();
  var H = date.getHours(), min = date.getMinutes(), sec = date.getSeconds();
  var h = H % 12 || 12, ampm = H < 12 ? 'AM' : 'PM';
  var pad = function(n) { return n < 10 ? '0'+n : ''+n; };
  var tk = { 'YYYY':Y, 'YY':String(Y).slice(-2), 'MMMM':ML[Mo], 'MMM':MS[Mo],
             'MM':pad(Mo+1), 'M':Mo+1, 'DD':pad(D), 'D':D,
             'HH':pad(H), 'H':H, 'hh':pad(h), 'h':h, 'mm':pad(min), 'ss':pad(sec), 'A':ampm, 'a':ampm.toLowerCase() };
  return pattern.replace(/YYYY|YY|MMMM|MMM|MM|M|DD|D|HH|H|hh|h|mm|ss|A|a/g, function(t) { return tk[t] !== undefined ? tk[t] : t; });
}
