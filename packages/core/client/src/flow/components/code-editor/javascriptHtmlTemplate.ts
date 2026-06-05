/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { html, htmlLanguage } from '@codemirror/lang-html';
import { LanguageSupport } from '@codemirror/language';
import type { LRLanguage } from '@codemirror/language';
import { javascript } from '@codemirror/lang-javascript';
import { parseMixed } from '@lezer/common';
import type { SyntaxNode } from '@lezer/common';

export interface TemplateHtmlRange {
  from: number;
  to: number;
}

export function getTemplateHtmlRanges(node: SyntaxNode): TemplateHtmlRange[] {
  const ranges: TemplateHtmlRange[] = [];
  const open = node.from + 1;
  const close = node.to - 1;
  let cursor = open;

  for (let child = node.firstChild; child; child = child.nextSibling) {
    if (child.type.name === 'Interpolation') {
      if (child.from > cursor) {
        ranges.push({ from: cursor, to: child.from });
      }
      cursor = Math.max(cursor, child.to);
    }
  }

  if (cursor < close) {
    ranges.push({ from: cursor, to: close });
  }

  return ranges.filter((range) => range.to > range.from);
}

export function javascriptWithHtmlTemplates(): LanguageSupport {
  // Enable JSX in JavaScript language so editor can parse/render JSX syntax
  const baseJavascript = javascript({ jsx: true });
  const htmlSupport = html();

  const mixedLanguage = (baseJavascript.language as unknown as LRLanguage).configure({
    wrap: parseMixed((node) => {
      if (node.type.name !== 'TemplateString') {
        return null;
      }

      const ranges = getTemplateHtmlRanges(node.node);
      if (!ranges.length) {
        return null;
      }

      return {
        parser: htmlLanguage.parser,
        overlay: ranges,
      };
    }),
  });

  return new LanguageSupport(mixedLanguage, [baseJavascript.support, htmlSupport.support]);
}
