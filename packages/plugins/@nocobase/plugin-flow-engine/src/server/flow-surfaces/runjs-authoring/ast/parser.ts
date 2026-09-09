/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import * as acorn from 'acorn';
import jsx from 'acorn-jsx';
import * as acornWalk from 'acorn-walk';
import type { SourceRange } from '../internal-types';

export const AcornParserWithJsx = acorn.Parser.extend(jsx());

// Acorn's public types omit the tokenizer hooks used by parser plugins.
type TokenParser = acorn.Parser & {
  pos: number;
  curLine: number;
  lineStart: number;
  type: acorn.TokenType;
  context: { token: string }[];
  curContext(): { token: string };
  readToken(code: number): void;
  finishToken(type: acorn.TokenType, value?: string): void;
  jsx_readToken(): void;
  jsx_readNewLine(normalizeCRLF: boolean): string;
  next(): void;
  parseExpression(...args: unknown[]): acorn.Node;
};

const AcornParserWithLegacyTemplates = AcornParserWithJsx.extend((Parser) => {
  const Base = Parser as unknown as new (options: acorn.Options, input: string) => TokenParser;
  const { jsxText } = (Parser as typeof acorn.Parser & { acornJsx: { tokTypes: { jsxText: acorn.TokenType } } })
    .acornJsx.tokTypes;
  return class extends Base {
    get allowNewDotTarget() {
      // JSRunner executes scripts in a function scope; this fallback only locates legacy template comments.
      return true;
    }

    readLegacyTemplate() {
      if (this.input.startsWith('{{', this.pos)) {
        const start = this.pos;
        if (/^\s*ctx(?:\.|\?\.|\[)/.test(this.input.slice(start + 2))) {
          let end: number | undefined;
          const comments: acorn.Comment[] = [];
          try {
            const expression = acorn.parseExpressionAt(this.input, start + 2, {
              ecmaVersion: 'latest',
              onComment: comments,
            });
            const expressionEnd = Math.max(expression.end, comments.at(-1)?.end || 0);
            const closing = /^\s*}}/.exec(this.input.slice(expressionEnd));
            if (closing) end = expressionEnd + closing[0].length;
          } catch {
            // Invalid placeholders must still fail the full parse.
          }
          if (end !== undefined) {
            const onComment = this.options.onComment;
            if (typeof onComment === 'function') {
              for (const comment of comments) {
                onComment(comment.type === 'Block', comment.value, comment.start, comment.end);
              }
            }
            for (const newline of this.input.slice(start, end).matchAll(/\r\n?|\n|\u2028|\u2029/g)) {
              this.curLine += 1;
              this.lineStart = start + newline.index + newline[0].length;
            }
            this.pos = end;
            return true;
          }
        }
      }
      return false;
    }

    readToken(code: number) {
      if (code === 123 && !this.curContext().token.startsWith('<') && this.readLegacyTemplate()) {
        return this.finishToken(acorn.tokTypes._null);
      }
      return super.readToken(code);
    }

    jsx_readToken() {
      const start = this.pos;
      if (!this.readLegacyTemplate()) {
        // Only comment ranges are used: JSX text may contain raw > and } accepted by the client compiler.
        while (this.pos < this.input.length && !/[<{]/.test(this.input[this.pos])) {
          if (/[\r\n\u2028\u2029]/.test(this.input[this.pos])) this.jsx_readNewLine(true);
          else this.pos += 1;
        }
      }
      if (this.pos > start) return this.finishToken(jsxText, this.input.slice(start, this.pos));
      return super.jsx_readToken();
    }

    parseExpression(...args: unknown[]) {
      // Support spread children without relaxing JavaScript or JSX attribute expressions.
      if (this.type === acorn.tokTypes.ellipsis && this.context.at(-2)?.token === '<tag>...</tag>') {
        this.next();
      }
      return super.parseExpression(...args);
    }
  } as unknown as typeof acorn.Parser;
});

export type RunJsParseResult = {
  ast?: acorn.Node;
  comments?: readonly SourceRange[];
  error?: { index: number; message: string };
};

export const ACORN_WALK_BASE = {
  ...(acornWalk as any).base,
  JSXElement(node: any, state: any, callback: any) {
    callback(node.openingElement, state);
    for (const child of node.children || []) {
      callback(child, state);
    }
    if (node.closingElement) {
      callback(node.closingElement, state);
    }
  },
  JSXFragment(node: any, state: any, callback: any) {
    callback(node.openingFragment, state);
    for (const child of node.children || []) {
      callback(child, state);
    }
    callback(node.closingFragment, state);
  },
  JSXOpeningElement(node: any, state: any, callback: any) {
    callback(node.name, state);
    for (const attribute of node.attributes || []) {
      callback(attribute, state);
    }
  },
  JSXClosingElement(node: any, state: any, callback: any) {
    callback(node.name, state);
  },
  JSXAttribute(node: any, state: any, callback: any) {
    callback(node.name, state);
    if (node.value) {
      callback(node.value, state);
    }
  },
  JSXExpressionContainer(node: any, state: any, callback: any) {
    callback(node.expression, state);
  },
  JSXSpreadAttribute(node: any, state: any, callback: any) {
    callback(node.argument, state);
  },
  JSXMemberExpression(node: any, state: any, callback: any) {
    callback(node.object, state);
    callback(node.property, state);
  },
  JSXNamespacedName(node: any, state: any, callback: any) {
    callback(node.namespace, state);
    callback(node.name, state);
  },
  JSXIdentifier() {},
  JSXText() {},
  JSXEmptyExpression() {},
  JSXOpeningFragment() {},
  JSXClosingFragment() {},
};

export function parseRunJsAuthoringAst(
  source: string,
  options: { allowLegacyTemplates?: boolean } = {},
): RunJsParseResult {
  const comments: SourceRange[] = [];
  const parserOptions: acorn.Options = {
    allowAwaitOutsideFunction: true,
    allowReturnOutsideFunction: true,
    ecmaVersion: 'latest',
    locations: true,
    sourceType: 'script',
    onComment: (_block, _text, start, end) => comments.push({ start, end }),
  };
  try {
    return {
      ast: AcornParserWithJsx.parse(source, parserOptions),
      comments,
    };
  } catch (error) {
    if (options.allowLegacyTemplates && source.includes('{{')) {
      try {
        comments.length = 0;
        AcornParserWithLegacyTemplates.parse(source, parserOptions);
        // Substituted placeholders are only for locating comments, never for inferring static dependencies.
        return { comments };
      } catch {
        // Discard partial comment ranges: they cannot reliably describe an invalid script.
      }
    }
    const acornError = error as Error & { pos?: number };
    return {
      error: {
        index: typeof acornError.pos === 'number' ? acornError.pos : 0,
        message: acornError.message || 'Invalid JavaScript syntax',
      },
    };
  }
}
