/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr as _tExpr } from '@nocobase/flow-engine';
import { useTranslation } from 'react-i18next';

export const NAMESPACE = '@nocobase/plugin-data-visualization';

export function tExpr(key: string) {
  return _tExpr(key, { ns: [NAMESPACE, 'client'] });
}

export function translateExpr(source: any, t: (key: string) => string = (key) => key) {
  if (typeof source === 'string') {
    return source.replace(/\{\{\s*t\((['"])(.*?)\1(?:\s*,\s*\{[^}]*\})?\)\s*\}\}/g, (_, __, key) => t(key));
  }
  return source;
}

export function useChartsTranslation() {
  return useTranslation([NAMESPACE, 'client'], {
    nsMode: 'fallback',
  });
}

export function useT() {
  return useChartsTranslation()[0];
}

export function tStr(key: string) {
  return `{{t(${JSON.stringify(key)}, { ns: ['${NAMESPACE}', 'client'], nsMode: 'fallback' })}}`;
}

export function lang(key: string) {
  return tStr(key);
}
