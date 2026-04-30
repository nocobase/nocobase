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

export const NAMESPACE = 'kanban';

export function tExpr(key: string, options?: Parameters<typeof _tExpr>[1]) {
  return _tExpr(key, { ...options, ns: options?.ns || [NAMESPACE, 'client'] });
}

export function lang(key: string) {
  return generateNTemplate(key);
}

export function generateNTemplate(key: string) {
  return `{{t(${JSON.stringify(key)}, { ns: '${NAMESPACE}', nsMode: 'fallback' })}}`;
}

export function useKanbanTranslation() {
  return useTranslation([NAMESPACE, 'client'], {
    nsMode: 'fallback',
  });
}
