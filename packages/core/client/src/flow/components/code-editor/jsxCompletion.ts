/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Completion, CompletionContext, CompletionResult } from '@codemirror/autocomplete';

const JSX_TAGS = [
  'div',
  'span',
  'p',
  'a',
  'img',
  'button',
  'input',
  'label',
  'select',
  'option',
  'textarea',
  'ul',
  'ol',
  'li',
  'table',
  'thead',
  'tbody',
  'tr',
  'td',
  'th',
  'form',
  'section',
  'article',
  'nav',
  'header',
  'footer',
  'main',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'canvas',
  'svg',
  'path',
  'g',
  'circle',
  'rect',
  'line',
  'polyline',
  'polygon',
];

const JSX_ATTRS = [
  'className',
  'id',
  'style',
  'title',
  'href',
  'src',
  'alt',
  'value',
  'defaultValue',
  'placeholder',
  'disabled',
  'checked',
  'readOnly',
  'name',
  'type',
  'width',
  'height',
  'min',
  'max',
  'step',
  'rows',
  'cols',
  'multiple',
  'accept',
  'download',
  'target',
  'rel',
  'role',
  'tabIndex',
  'draggable',
  'contentEditable',
  'hidden',
];

const JSX_EVENTS = [
  'onClick',
  'onChange',
  'onInput',
  'onSubmit',
  'onKeyDown',
  'onKeyUp',
  'onKeyPress',
  'onFocus',
  'onBlur',
  'onMouseEnter',
  'onMouseLeave',
  'onMouseDown',
  'onMouseUp',
  'onMouseMove',
  'onContextMenu',
  'onDragStart',
  'onDragOver',
  'onDrop',
  'onScroll',
  'onWheel',
  'onTouchStart',
  'onTouchMove',
  'onTouchEnd',
];

const CSS_PROPS = [
  'color',
  'background',
  'backgroundColor',
  'padding',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'border',
  'borderRadius',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'textAlign',
  'display',
  'flex',
  'flexDirection',
  'alignItems',
  'justifyContent',
  'gap',
  'width',
  'height',
  'minWidth',
  'minHeight',
  'maxWidth',
  'maxHeight',
  'opacity',
  'overflow',
  'position',
  'top',
  'left',
  'right',
  'bottom',
  'zIndex',
];

function isJsxTagContext(text: string, pos: number): { inTag: boolean; tagStart: number } {
  // Heuristic: inside an opening tag if there's a '<' after the last '>' and before current pos
  const searchFrom = Math.max(0, pos - 400);
  const slice = text.slice(searchFrom, pos);
  const lastLt = slice.lastIndexOf('<');
  const lastGt = slice.lastIndexOf('>');
  if (lastLt === -1) return { inTag: false, tagStart: -1 };
  if (lastGt > lastLt) return { inTag: false, tagStart: -1 };
  return { inTag: true, tagStart: searchFrom + lastLt };
}

function isTagNamePosition(text: string, tagStart: number, pos: number): boolean {
  const between = text.slice(tagStart + 1, pos);
  // If between contains whitespace, probably in attributes; otherwise in tag name
  return !/\s/.test(between);
}

function isStyleObjectKeyContext(text: string, tagStart: number, pos: number): boolean {
  // Roughly detect: within style={{ ... | }}
  const from = Math.max(tagStart, pos - 200);
  const frag = text.slice(from, pos);
  const styleOpen = frag.lastIndexOf('style={{');
  if (styleOpen === -1) return false;
  const close = frag.lastIndexOf('}}');
  return close < styleOpen; // not closed yet
}

function buildTagCompletions(): Completion[] {
  return JSX_TAGS.map((t) => ({ label: t, type: 'keyword', boost: 99 })) as Completion[];
}

function buildAttrCompletions(): Completion[] {
  const attrs = JSX_ATTRS.map((a) => ({ label: a, type: 'property', boost: 88 })) as Completion[];
  const events = JSX_EVENTS.map((e) => ({
    label: e,
    type: 'function',
    boost: 87,
    apply(view, _c, from, to) {
      const insert = `${e}={(e) => {}}`;
      view.dispatch({ changes: { from, to, insert }, selection: { anchor: from + insert.length - 3 } });
      view.focus();
    },
  })) as Completion[];
  return [...events, ...attrs];
}

function buildStyleKeyCompletions(): Completion[] {
  return CSS_PROPS.map((p) => ({ label: p, type: 'property', boost: 86 })) as Completion[];
}

export function createJsxCompletion() {
  const optionsTags = buildTagCompletions();
  const optionsAttrs = buildAttrCompletions();
  const optionsStyle = buildStyleKeyCompletions();
  return (context: CompletionContext): CompletionResult | null => {
    const { state, pos } = context;
    const doc = state.doc;
    const text = doc.toString();
    const { inTag, tagStart } = isJsxTagContext(text, pos);
    if (!inTag) return null;

    // tagName position
    if (isTagNamePosition(text, tagStart, pos)) {
      const word = context.matchBefore(/[A-Za-z][A-Za-z0-9-]*/);
      const from = word ? word.from : pos;
      const to = word ? word.to : pos;
      return { from, to, options: optionsTags };
    }

    // style object keys
    if (isStyleObjectKeyContext(text, tagStart, pos)) {
      const word = context.matchBefore(/[A-Za-z][A-Za-z0-9-]*/);
      const from = word ? word.from : pos;
      const to = word ? word.to : pos;
      return { from, to, options: optionsStyle };
    }

    // attribute names (including events)
    const word = context.matchBefore(/[A-Za-z][A-Za-z0-9-]*/);
    if (!word && !context.explicit) return null;
    const from = word ? word.from : pos;
    const to = word ? word.to : pos;
    return { from, to, options: optionsAttrs };
  };
}
