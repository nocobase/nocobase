/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr as _tExpr, useFlowEngine } from '@nocobase/flow-engine';
import { useTranslation as useT } from 'react-i18next';

export const NAMESPACE = 'calendar';

export function tExpr(key: string) {
  return _tExpr(key, { ns: [NAMESPACE, 'client'] });
}

export function useCalendarT() {
  const engine = useFlowEngine();
  return (key: string, options: any = {}) => engine.context.t(key, { ns: NAMESPACE, ...options });
}

export function generateNTemplate(key: string) {
  return `{{t('${key}', { ns: '${NAMESPACE}', nsMode: 'fallback' })}}`;
}

export function useTranslation() {
  return useT([NAMESPACE, 'client'], {
    nsMode: 'fallback',
  });
}
