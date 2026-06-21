/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { parse } from '@nocobase/utils/client';
import type { SQLInstructionConfig, SQLVariable } from './types';

type ParsedTemplateParameter = {
  key?: string;
};

function setPath(target: Record<string, unknown>, path: string, value: unknown) {
  const segments = path.split('.').filter(Boolean);
  if (!segments.length) {
    return;
  }
  let cursor = target;
  segments.slice(0, -1).forEach((segment) => {
    const next = cursor[segment];
    if (!next || typeof next !== 'object' || Array.isArray(next)) {
      cursor[segment] = {};
    }
    cursor = cursor[segment] as Record<string, unknown>;
  });
  cursor[segments[segments.length - 1]] = value;
}

export function migrateUnsafeSqlConfig(config: SQLInstructionConfig): SQLInstructionConfig {
  const sql = config.sql || '';
  const template = parse(sql);
  const parameters = (template.parameters || []) as ParsedTemplateParameter[];
  const uniqueKeys = Array.from(
    new Set(parameters.map((parameter) => parameter.key).filter((key): key is string => Boolean(key))),
  );
  const context: Record<string, unknown> = {};

  uniqueKeys.forEach((key, index) => {
    setPath(context, key, `:var${index}`);
  });

  const variables: SQLVariable[] = uniqueKeys.map((key, index) => ({
    name: `var${index}`,
    value: `{{${key}}}`,
  }));

  return {
    ...config,
    sql: template(context),
    variables,
    unsafeInjection: false,
  };
}
