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

const AcornParserWithJsx = acorn.Parser.extend(jsx());
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

export function parseRunJsAuthoringAst(source: string): { ast?: any; error?: { index: number; message: string } } {
  try {
    return {
      ast: AcornParserWithJsx.parse(source, {
        allowAwaitOutsideFunction: true,
        allowReturnOutsideFunction: true,
        ecmaVersion: 'latest',
        locations: true,
        sourceType: 'script',
      }),
    };
  } catch (error) {
    const acornError = error as Error & { pos?: number };
    return {
      error: {
        index: typeof acornError.pos === 'number' ? acornError.pos : 0,
        message: acornError.message || 'Invalid JavaScript syntax',
      },
    };
  }
}
