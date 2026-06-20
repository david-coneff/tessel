export function makeSeparator(orientation = 'vertical') {
  const sep = document.createElement('span');
  sep.className = 'tui-separator tui-separator--' + orientation;
  sep.setAttribute('aria-hidden', 'true');
  return sep;
}
