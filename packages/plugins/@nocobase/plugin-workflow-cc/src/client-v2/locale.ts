/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr as flowTExpr, useFlowEngine } from '@nocobase/flow-engine';
import { useTranslation } from 'react-i18next';

export const NAMESPACE = '@nocobase/plugin-workflow-cc';

export function tExpr(key: string, options?: Record<string, unknown>) {
  return flowTExpr(key, { ns: NAMESPACE, ...options });
}

export function usePluginTranslation() {
  return useTranslation([NAMESPACE, 'client'], { nsMode: 'fallback' });
}

export function useT() {
  const flowEngine = useFlowEngine();
  return (key: string, options?: Record<string, unknown>) =>
    flowEngine.context.t(key, { ns: [NAMESPACE, 'client'], nsMode: 'fallback', ...options });
}
