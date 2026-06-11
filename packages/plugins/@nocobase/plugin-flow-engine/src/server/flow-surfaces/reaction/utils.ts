/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

type RunJSValue = {
  code: string;
  version?: string;
};

export function extractPropertyPath(value: string): string[] | null {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  const variableRegex = /^\{\{\s*ctx(?:\.(.+?))?\s*\}\}$/;
  const match = trimmed.match(variableRegex);

  if (!match) return null;

  const pathString = match[1];
  if (!pathString) return [];

  return pathString
    .split('.')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function formatPathToVariable(path: string[]): string {
  if (path.length === 0) return '{{ ctx }}';
  return `{{ ctx.${path.join('.')} }}`;
}

export function isVariableExpression(value: unknown): boolean {
  if (typeof value !== 'string') return false;

  const trimmed = value.trim();
  const variableRegex = /^\{\{\s*ctx(?:\..+?)?\s*\}\}$/;
  return variableRegex.test(trimmed);
}

export function normalizeRunJSValue(value: RunJSValue | null | undefined): Required<RunJSValue> {
  return {
    code: String(value?.code ?? ''),
    version: String(value?.version ?? 'v1'),
  };
}
