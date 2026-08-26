/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const registerSmartBreak = (Quill) => {
  class SmartBreak extends Quill.import('blots/break') {
    length() {
      return 1;
    }
    value() {
      return '\n';
    }
    insertInto(parent, ref) {
      Quill.import('blots/embed').prototype.insertInto.call(this, parent, ref);
    }
  }
  SmartBreak.blotName = 'break';
  SmartBreak.tagName = 'BR';
  Quill.register(SmartBreak, true);
};

export function lineBreakMatcher(node, delta) {
  const Quill = (window as any).Quill;
  if (!Quill) return delta;
  const Delta = Quill.import('delta');
  const newDelta = new Delta();
  newDelta.insert({ break: '' });
  return newDelta;
}

export function handleLinebreak(range, context) {
  const { quill } = this;
  const Quill = quill.constructor;
  const Parchment = Quill.import('parchment');
  const currentLeaf = quill.getLeaf(range.index)[0];
  const nextLeaf = quill.getLeaf(range.index + 1)[0];
  quill.insertEmbed(range.index, 'break', true, 'user');

  if (nextLeaf === null || currentLeaf.parent !== nextLeaf.parent) {
    quill.insertEmbed(range.index, 'break', true, 'user');
  }
  quill.setSelection(range.index + 1, 'silent');

  Object.keys(context.format).forEach((name) => {
    if (Parchment.query(name, Parchment.Scope.BLOCK)) return;
    if (Array.isArray(context.format[name])) return;
    if (name === 'link') return;
    quill.format(name, context.format[name], 'user');
  });
  return false;
}

export function handleEnter(range, context) {
  const { quill } = this;
  const Quill = quill.constructor;
  const Parchment = Quill.import('parchment');

  if (range.length > 0) {
    quill.scroll.deleteAt(range.index, range.length);
  }
  const lineFormats = Object.keys(context.format).reduce((acc, format) => {
    if (Parchment.query(format, Parchment.Scope.BLOCK) && !Array.isArray(context.format[format])) {
      acc[format] = context.format[format];
    }
    return acc;
  }, {});

  const previousChar = quill.getText(range.index - 1, 1);

  quill.insertText(range.index, '\n', lineFormats, 'user');

  if (previousChar == '' || (previousChar == '\n' && !(context.offset > 0 && context.prefix.length === 0))) {
    quill.setSelection(range.index + 2, 'silent');
  } else {
    quill.setSelection(range.index + 1, 'silent');
  }
  Object.keys(context.format).forEach((name) => {
    if (lineFormats[name] != null) return;
    if (Array.isArray(context.format[name])) return;
    if (name === 'link') return;
    quill.format(name, context.format[name], 'user');
  });

  return false;
}
