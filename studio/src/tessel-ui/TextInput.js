export function makeTextInput({ label, placeholder, value = '', onChange, id, type = 'text' } = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'tui-text-input';

  if (label) {
    const lbl = document.createElement('label');
    lbl.className = 'tui-text-input__label';
    lbl.textContent = label;
    if (id) lbl.htmlFor = id;
    wrap.appendChild(lbl);
  }

  const input = document.createElement('input');
  input.type = type;
  input.className = 'tui-text-input__field';
  input.value = value;
  if (placeholder) input.placeholder = placeholder;
  if (id) input.id = id;
  if (onChange) input.addEventListener('input', function() { onChange(input.value); });

  wrap.appendChild(input);
  wrap.input = input;
  wrap.getValue = function() { return input.value; };
  wrap.setValue = function(v) { input.value = v; };
  return wrap;
}
