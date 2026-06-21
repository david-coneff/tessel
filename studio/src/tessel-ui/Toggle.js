export function makeToggle({ label, checked = false, onChange, id } = {}) {
  const wrap = document.createElement('label');
  wrap.className = 'tui-toggle';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.className = 'tui-toggle__input';
  input.checked = checked;
  if (id) input.id = id;
  if (onChange) input.addEventListener('change', function() { onChange(input.checked); });

  const track = document.createElement('span');
  track.className = 'tui-toggle__track';

  wrap.appendChild(input);
  wrap.appendChild(track);

  if (label) {
    const span = document.createElement('span');
    span.className = 'tui-toggle__label';
    span.textContent = label;
    wrap.appendChild(span);
  }

  wrap.setChecked = function(v) { input.checked = v; };
  wrap.getChecked = function() { return input.checked; };
  return wrap;
}
