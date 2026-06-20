import {
  Undo2, Redo2, Plus, Save, FilePlus2, FileDown, FileCode2, Archive, Download,
  Bold, Italic, Underline, Strikethrough, Link, Link2Off,
  Eye, EyeOff, Settings2, Trash2, X, Check,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  GripVertical, IndentIncrease, IndentDecrease,
  Heading1, Heading2, Heading3, Pilcrow,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Code2, Image, Paperclip,
  PanelLeft, PanelRight, PanelBottom, PanelTop,
  Moon, Sun, Palette, Layers, LayoutList,
  SlidersHorizontal, Type, Minus, MoreHorizontal,
  FileText, FolderOpen, RotateCcw, RotateCw,
} from 'lucide';

const SVG_NS = 'http://www.w3.org/2000/svg';

const REGISTRY = {
  'undo': Undo2, 'redo': Redo2,
  'plus': Plus, 'minus': Minus,
  'save': Save, 'file-plus': FilePlus2,
  'file-down': FileDown, 'file-code': FileCode2,
  'archive': Archive, 'download': Download,
  'bold': Bold, 'italic': Italic, 'underline': Underline, 'strikethrough': Strikethrough,
  'link': Link, 'link-off': Link2Off,
  'eye': Eye, 'eye-off': EyeOff,
  'settings': Settings2,
  'trash': Trash2, 'x': X, 'check': Check,
  'chevron-down': ChevronDown, 'chevron-up': ChevronUp,
  'chevron-left': ChevronLeft, 'chevron-right': ChevronRight,
  'grip': GripVertical,
  'indent': IndentIncrease, 'outdent': IndentDecrease,
  'h1': Heading1, 'h2': Heading2, 'h3': Heading3,
  'paragraph': Pilcrow,
  'align-left': AlignLeft, 'align-center': AlignCenter,
  'align-right': AlignRight, 'align-justify': AlignJustify,
  'list': List, 'list-ordered': ListOrdered,
  'code': Code2, 'image': Image, 'paperclip': Paperclip,
  'panel-left': PanelLeft, 'panel-right': PanelRight,
  'panel-bottom': PanelBottom, 'panel-top': PanelTop,
  'moon': Moon, 'sun': Sun, 'palette': Palette,
  'layers': Layers, 'layout-list': LayoutList,
  'sliders': SlidersHorizontal, 'type': Type,
  'more': MoreHorizontal, 'file-text': FileText,
  'folder': FolderOpen, 'rotate-ccw': RotateCcw, 'rotate-cw': RotateCw,
};

function buildSvg(iconData, size) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('xmlns', SVG_NS);
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  for (const [tag, attrs] of iconData) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
    svg.appendChild(el);
  }
  return svg;
}

export function icon(name, size = 16) {
  const data = REGISTRY[name];
  if (data) return buildSvg(data, size);
  return emojiToSvg(name, size);
}

export function emojiToSvg(char, size = 16) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const text = document.createElementNS(SVG_NS, 'text');
  text.setAttribute('x', '12');
  text.setAttribute('y', '16');
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('font-size', '14');
  text.setAttribute('fill', 'currentColor');
  text.textContent = char;
  svg.appendChild(text);
  return svg;
}
