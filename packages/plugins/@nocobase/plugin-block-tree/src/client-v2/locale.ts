/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr as _tExpr, useFlowEngine } from '@nocobase/flow-engine';
import { useTranslation } from 'react-i18next';

export const NAMESPACE = '@nocobase/plugin-block-tree';

export function useTreeTranslation() {
  return useTranslation([NAMESPACE, 'client'], { nsMode: 'fallback' });
}

export function useT() {
  const engine = useFlowEngine();
  return (str: string) => engine.context.t(str, { ns: [NAMESPACE, 'client'] });
}

export function tExpr(key: string) {
  return _tExpr(key, { ns: [NAMESPACE, 'client'] });
}

export function generateNTemplate(key: string) {
  return `{{t('${key}', { ns: '${NAMESPACE}', nsMode: 'fallback' })}}`;
}

export function generateCommonTemplate(key: string) {
  return `{{t('${key}')}}`;
}
