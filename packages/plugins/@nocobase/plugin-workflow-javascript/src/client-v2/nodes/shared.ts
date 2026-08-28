/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { TypedConstantSpec } from '@nocobase/client-v2';

export type ScriptArgumentConfig = {
  name: string;
  value?: unknown;
};

export type ScriptNodeConfig = {
  arguments?: ScriptArgumentConfig[];
  content?: string;
  timeout?: number;
  continue?: boolean;
};

export const SCRIPT_ARGUMENT_NAME_REGEXP = /^[\p{L}$_][\p{L}\p{N}$_]*$/u;

export const SCRIPT_DEFAULT_CONTENT = 'return "Hello world!";';

export const SCRIPT_DEFAULT_CONFIG: Required<ScriptNodeConfig> = {
  arguments: [],
  content: SCRIPT_DEFAULT_CONTENT,
  timeout: 0,
  continue: false,
};

export const SCRIPT_ARGUMENT_VALUE_TYPES: TypedConstantSpec[] = ['string', 'number', 'boolean', 'date', 'object'];

export const SCRIPT_VARIABLE_TYPE_SETS = {
  boolean: new Set(['checkbox']),
  number: new Set(['integer', 'number', 'percent']),
  string: new Set(['input', 'password', 'email', 'phone', 'select', 'radioGroup', 'text', 'markdown', 'richText']),
  date: new Set(['datetime', 'datetimeNoTz', 'dateOnly', 'createdAt', 'updatedAt']),
} as const;

export function supportsScriptVariableTypes(types?: unknown[]) {
  if (!types?.length) {
    return true;
  }

  return types.some(
    (type) =>
      typeof type === 'string' &&
      (type in SCRIPT_VARIABLE_TYPE_SETS ||
        Object.values(SCRIPT_VARIABLE_TYPE_SETS).some((supportedInterfaces) => supportedInterfaces.has(type))),
  );
}
