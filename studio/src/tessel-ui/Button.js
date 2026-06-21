import { icon } from './icon.js';

/**
 * variants: 'primary' | 'ghost' | 'icon' | 'badge'
 * size: 'sm' | 'md'
 */
export function makeButton({ label, iconName, variant = 'ghost', size = 'md', onClick, title, disabled = false } = {}) {
  const btn = document.createElement('button');
  btn.className = 'tui-btn tui-btn--' + variant + ' tui-btn--' + size;
  if (title) btn.title = title;
  if (disabled) btn.disabled = true;

  if (iconName) {
    const ic = icon(iconName, variant === 'icon' ? 16 : 14);
    ic.classList.add('tui-btn__icon');
    btn.appendChild(ic);
  }
  if (label) {
    const span = document.createElement('span');
    span.className = 'tui-btn__label';
    span.textContent = label;
    btn.appendChild(span);
  }
  if (onClick) btn.addEventListener('click', onClick);
  return btn;
}
