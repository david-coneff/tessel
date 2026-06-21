/**
 * tessel-ui — theme-aware form control library
 *
 * Resolution order: tessel-ui override → Shoelace (Phase 6) → native HTML fallback
 *
 * Every control is a factory function: make<Control>(options) → HTMLElement
 * Controls inherit CSS custom properties from the active theme automatically.
 *
 * To add a tessel-ui override (Phase 7):
 *   1. Create tessel-ui/overrides/<ControlName>.js exporting a factory matching
 *      the same options signature.
 *   2. Import and add it to TESSEL_OVERRIDES below.
 *   3. All call sites automatically use the new version.
 */

export { icon, emojiToSvg } from './icon.js';
export { makeButton } from './Button.js';
export { makeToggle } from './Toggle.js';
export { makeTextInput } from './TextInput.js';
export { makeSelect } from './Select.js';
export { makeSlider } from './Slider.js';
export { makeColorPill } from './ColorPill.js';
export { makeSeparator } from './Separator.js';
