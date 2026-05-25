/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ReactNode } from 'react';

type TFunction = (key: string) => string;

const LEGACY_T_TEMPLATE = /^\s*\{\{\s*t\s*\(\s*(['"])(.*?)\1(?:\s*,[\s\S]*?)?\)\s*\}\}\s*$/;

export function compileLegacyTemplate(value: ReactNode, t: TFunction): ReactNode {
  if (typeof value !== 'string') {
    return value;
  }
  const match = value.match(LEGACY_T_TEMPLATE);
  if (!match?.[2]) {
    return value;
  }
  return t(match[2]);
}

export function compileLegacyTemplateText(value: ReactNode, t: TFunction, fallback = '-'): string {
  const compiled = compileLegacyTemplate(value, t);
  if (compiled === undefined || compiled === null || compiled === '') {
    return fallback;
  }
  return typeof compiled === 'string' || typeof compiled === 'number' || typeof compiled === 'boolean'
    ? String(compiled)
    : fallback;
}
