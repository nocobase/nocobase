/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { collectAstIdentifierBindingsFromAst } from '../flow-surfaces/runjs-authoring/ast/static-bindings';
import { unwrapAstChainExpression } from '../flow-surfaces/runjs-authoring/ast/bindings';
import {
  getAstStaticPropertyName,
  isUnshadowedCtxIdentifier,
  resolveAstStaticStringValue,
} from '../flow-surfaces/runjs-authoring/ast/static-values';
import { parseRunJsAuthoringAst } from '../flow-surfaces/runjs-authoring/ast/parser';
import { walkAstSimple } from '../flow-surfaces/runjs-authoring/ast/walk';
import {
  MAX_RUNJS_SOURCES_PER_REQUEST,
  MAX_RUNJS_SOURCE_LENGTH,
  MAX_RUNJS_TOTAL_SOURCE_LENGTH,
} from '../flow-surfaces/runjs-authoring/runtime/constants';

type PersistedRunJsValue = Readonly<{
  code: string;
  version?: string | null;
}>;

type AstNode = {
  arguments?: unknown[];
  callee?: unknown;
  object?: unknown;
  type?: string;
};

const RUNJS_VALUE_KEYS = new Set(['code', 'version']);

function isPersistedRunJsValue(value: unknown): value is PersistedRunJsValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const input = value as Record<string, unknown>;
  const keys = Object.keys(input);
  return (
    typeof input.code === 'string' &&
    (input.version == null || typeof input.version === 'string') &&
    keys.every((key) => RUNJS_VALUE_KEYS.has(key))
  );
}

function extractStaticGetVarTemplates(code: string): string[] {
  const parsed = parseRunJsAuthoringAst(code);
  if (!parsed.ast) return [];

  const identifierBindings = collectAstIdentifierBindingsFromAst(parsed.ast, code);
  const templates = new Set<string>();
  walkAstSimple(parsed.ast, {
    CallExpression(node: AstNode) {
      const callee = unwrapAstChainExpression(node.callee) as AstNode | undefined;
      if (
        callee?.type !== 'MemberExpression' ||
        !isUnshadowedCtxIdentifier(callee.object, identifierBindings) ||
        getAstStaticPropertyName(callee) !== 'getVar'
      ) {
        return;
      }
      const path = resolveAstStaticStringValue(node.arguments?.[0], code)?.trim();
      if (!path?.startsWith('ctx.')) return;
      templates.add(`{{ ${path} }}`);
    },
  });
  return Array.from(templates);
}

export function collectPersistedRunJsVariableTemplates(value: unknown): string[] {
  const templates = new Set<string>();
  const seen = new WeakSet<object>();
  let sourceCount = 0;
  let totalSourceLength = 0;

  const visit = (input: unknown) => {
    if (!input || typeof input !== 'object') return;
    if (seen.has(input)) return;
    seen.add(input);

    if (isPersistedRunJsValue(input)) {
      sourceCount += 1;
      totalSourceLength += input.code.length;
      if (
        sourceCount > MAX_RUNJS_SOURCES_PER_REQUEST ||
        input.code.length > MAX_RUNJS_SOURCE_LENGTH ||
        totalSourceLength > MAX_RUNJS_TOTAL_SOURCE_LENGTH
      ) {
        return;
      }
      extractStaticGetVarTemplates(input.code).forEach((template) => templates.add(template));
      return;
    }

    if (Array.isArray(input)) {
      input.forEach(visit);
      return;
    }
    Object.values(input).forEach(visit);
  };

  visit(value);
  return Array.from(templates);
}
