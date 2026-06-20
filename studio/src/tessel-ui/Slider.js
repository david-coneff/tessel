export function makeSlider({ label, min = 0, max = 100, step = 1, value = 50, onChange, id, showValue = true } = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'tui-slider';

  if (label) {
    const row = document.createElement('div');
    row.className = 'tui-slider__header';
    const lbl = document.createElement('span');
    lbl.className = 'tui-slider__label';
    lbl.textContent = label;
    row.appendChild(lbl);
    if (showValue) {
      const val = document.createElement('span');
      val.className = 'tui-slider__value';
      val.textContent = value;
      row.appendChild(val);
      wrap._valueEl = val;
    }
    wrap.appendChild(row);
  }

  const input = document.createElement('input');
  input.type = 'range';
  input.className = 'tui-slider__input';
  input.min = min;
  input.max = max;
  input.step = step;
  input.value = value;
  if (id) input.id = id;
  input.addEventListener('input', function() {
    if (wrap._valueEl) wrap._valueEl.textContent = input.value;
    if (onChange) onChange(Number(input.value));
  });

  wrap.appendChild(input);
  wrap.input = input;
  wrap.getValue = function() { return Number(input.value); };
  wrap.setValue = function(v) { input.value = v; if (wrap._valueEl) wrap._valueEl.textContent = v; };
  return wrap;
}
