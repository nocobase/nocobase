/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ReactNode } from 'react';

type TFunction = (key: string, options?: Record<string, unknown>) => string;

const LEGACY_T_TEMPLATE = /^\s*\{\{\s*t\s*\(\s*(['"])(.*?)\1(?:\s*,[\s\S]*?)?\)\s*\}\}\s*$/;

export function compileLegacyTemplate(value: ReactNode, t: TFunction) {
  if (typeof value !== 'string') {
    return value;
  }
  const match = value.match(LEGACY_T_TEMPLATE);
  return match?.[2] ? t(match[2]) : value;
}

export function getFieldTitle(field: Record<string, unknown>, t: TFunction) {
  const uiSchema = field.uiSchema as Record<string, ReactNode> | undefined;
  const title = uiSchema?.title || (field.title as ReactNode) || (field.name as ReactNode);
  return compileLegacyTemplate(title, t);
}
