/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr as _tExpr, useFlowEngine } from '@nocobase/flow-engine';
import enUS from '../locale/en-US.json';
import zhCN from '../locale/zh-CN.json';

export const NAMESPACE = '@nocobase/plugin-gantt';
export const LEGACY_NAMESPACE = 'gantt';

export const ganttLocaleResources = {
  'en-US': enUS,
  'zh-CN': zhCN,
};

export function useT() {
  const engine = useFlowEngine();
  return (str: string, options?: Record<string, any>) =>
    engine.context.t(str, { ns: [NAMESPACE, LEGACY_NAMESPACE, 'client'], nsMode: 'fallback', ...options });
}

export function tExpr(key: string, options?: Record<string, any>) {
  return _tExpr(key, { ns: [NAMESPACE, LEGACY_NAMESPACE, 'client'], nsMode: 'fallback', ...options });
}
