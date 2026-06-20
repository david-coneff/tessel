export function makeSelect({ label, options = [], value, onChange, id } = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'tui-select';

  if (label) {
    const lbl = document.createElement('label');
    lbl.className = 'tui-select__label';
    lbl.textContent = label;
    if (id) lbl.htmlFor = id;
    wrap.appendChild(lbl);
  }

  const select = document.createElement('select');
  select.className = 'tui-select__field';
  if (id) select.id = id;

  for (const opt of options) {
    const o = document.createElement('option');
    if (typeof opt === 'string') {
      o.value = opt;
      o.textContent = opt;
    } else {
      o.value = opt.value;
      o.textContent = opt.label;
      if (opt.disabled) o.disabled = true;
    }
    select.appendChild(o);
  }
  if (value !== undefined) select.value = value;
  if (onChange) select.addEventListener('change', function() { onChange(select.value); });

  wrap.appendChild(select);
  wrap.select = select;
  wrap.getValue = function() { return select.value; };
  wrap.setValue = function(v) { select.value = v; };
  return wrap;
}
