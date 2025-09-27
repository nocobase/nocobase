/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CompletionContext, type CompletionSource, type CompletionResult } from '@codemirror/autocomplete';
import { EditorState } from '@codemirror/state';
import { htmlCompletionSource, htmlLanguage } from '@codemirror/lang-html';
import { syntaxTree } from '@codemirror/language';
import type { SyntaxNode } from '@lezer/common';
import { getTemplateHtmlRanges, TemplateHtmlRange } from './javascriptHtmlTemplate';

interface TemplateHtmlSegment {
  htmlFrom: number;
  htmlTo: number;
  docFrom: number;
}

interface HtmlTemplateContext {
  htmlDoc: string;
  htmlPos: number;
  segments: TemplateHtmlSegment[];
}

const buildSegments = (
  node: SyntaxNode,
  ranges: TemplateHtmlRange[],
  context: CompletionContext,
): HtmlTemplateContext | null => {
  const state = context.state;
  const doc = state.doc;
  const segments: TemplateHtmlSegment[] = [];
  let htmlDoc = '';
  let htmlOffset = 0;

  for (const range of ranges) {
    const text = doc.sliceString(range.from, range.to);
    const htmlFrom = htmlOffset;
    const htmlTo = htmlFrom + text.length;
    segments.push({ htmlFrom, htmlTo, docFrom: range.from });
    htmlDoc += text;
    htmlOffset = htmlTo;
  }

  if (!segments.length) {
    return null;
  }

  const segment = segments.find(
    ({ docFrom, htmlFrom, htmlTo }) => context.pos >= docFrom && context.pos <= docFrom + (htmlTo - htmlFrom),
  );

  if (!segment) {
    return null;
  }

  const htmlPos = segment.htmlFrom + (context.pos - segment.docFrom);

  return {
    htmlDoc,
    htmlPos,
    segments,
  };
};

const mapHtmlToDoc = (segments: TemplateHtmlSegment[], htmlPos: number): number | null => {
  for (let index = segments.length - 1; index >= 0; index -= 1) {
    const segment = segments[index];
    if (htmlPos >= segment.htmlFrom && htmlPos <= segment.htmlTo) {
      return segment.docFrom + (htmlPos - segment.htmlFrom);
    }
  }

  return null;
};

const findTemplateStringNode = (node: SyntaxNode | null): SyntaxNode | null => {
  for (let current: SyntaxNode | null = node; current; current = current.parent) {
    if (current.type.name === 'TemplateString') {
      return current;
    }
  }

  return null;
};

const resolveHtmlTemplateContext = (context: CompletionContext): HtmlTemplateContext | null => {
  const tree = syntaxTree(context.state);
  const node = tree.resolveInner(context.pos, -1);
  const template = findTemplateStringNode(node);

  if (!template) {
    return null;
  }

  if (node.type.name === 'Interpolation') {
    return null;
  }

  const ranges = getTemplateHtmlRanges(template.node);
  if (!ranges.length) {
    return null;
  }

  return buildSegments(template.node, ranges, context);
};

const createHtmlCompletionResult = (
  base: CompletionResult,
  segments: TemplateHtmlSegment[],
): CompletionResult | null => {
  const from = mapHtmlToDoc(segments, base.from);
  const to = mapHtmlToDoc(segments, base.to);

  if (from == null || to == null) {
    return null;
  }

  return {
    ...base,
    from,
    to,
  };
};

export const isHtmlTemplateContext = (context: CompletionContext): boolean =>
  resolveHtmlTemplateContext(context) != null;

export const createHtmlCompletion = (): CompletionSource => {
  const source = htmlCompletionSource;

  return (context) => {
    const templateContext = resolveHtmlTemplateContext(context);
    if (!templateContext) {
      return null;
    }

    const htmlState = EditorState.create({
      doc: templateContext.htmlDoc,
      extensions: [htmlLanguage],
    });
    const htmlContext = new CompletionContext(htmlState, templateContext.htmlPos, context.explicit);
    const result = source(htmlContext);

    if (!result) {
      return null;
    }

    return createHtmlCompletionResult(result, templateContext.segments);
  };
};
