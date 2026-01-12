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

// function lineBreakMatcher() {
//   const Delta = Quill.import('delta');
//   const newDelta = new Delta();
//   newDelta.insert({ break: '' });
//   return newDelta;
// }

// function handleLinebreak(range, context) {
//   const { quill } = this;
//   const currentLeaf = quill.getLeaf(range.index)[0];
//   const nextLeaf = quill.getLeaf(range.index + 1)[0];
//   // @ts-ignore
//   const sources = Quill.sources || {};

//   quill.insertEmbed(range.index, 'break', true, sources.USER);

//   if (nextLeaf === null || currentLeaf.parent !== nextLeaf.parent) {
//     quill.insertEmbed(range.index, 'break', true, sources.USER);
//   }
//   quill.setSelection(range.index + 1, sources.SILENT);

//   Object.keys(context.format).forEach((name) => {
//     if (Parchment.query(name, Parchment.Scope.BLOCK)) return;
//     if (Array.isArray(context.format[name])) return;
//     if (name === 'link') return;
//     quill.format(name, context.format[name], sources.USER);
//   });
// }

// function handleEnter(range, context) {
//   const { quill } = this;
//   // @ts-ignore
//   const sources = Quill.sources || {};

//   if (range.length > 0) {
//     quill.scroll.deleteAt(range.index, range.length);
//   }
//   const lineFormats = Object.keys(context.format).reduce((acc, format) => {
//     if (Parchment.query(format, Parchment.Scope.BLOCK) && !Array.isArray(context.format[format])) {
//       acc[format] = context.format[format];
//     }
//     return acc;
//   }, {});

//   const previousChar = quill.getText(range.index - 1, 1);

//   quill.insertText(range.index, '\n', lineFormats, sources.USER);

//   if (previousChar == '' || (previousChar == '\n' && !(context.offset > 0 && context.prefix.length === 0))) {
//     quill.setSelection(range.index + 2, sources.SILENT);
//   } else {
//     quill.setSelection(range.index + 1, sources.SILENT);
//   }
//   Object.keys(context.format).forEach((name) => {
//     if (lineFormats[name] != null) return;
//     if (Array.isArray(context.format[name])) return;
//     if (name === 'link') return;
//     quill.format(name, context.format[name], sources.USER);
//   });
// }
