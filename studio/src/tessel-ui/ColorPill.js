export function makeColorPill({ color, active = false, onClick, title } = {}) {
  const pill = document.createElement('button');
  pill.type = 'button';
  pill.className = 'tui-color-pill' + (active ? ' tui-color-pill--active' : '');
  pill.style.setProperty('--tui-pill-color', color);
  if (title) pill.title = title;
  if (onClick) pill.addEventListener('click', onClick);

  pill.setActive = function(v) {
    pill.classList.toggle('tui-color-pill--active', v);
  };
  return pill;
}
