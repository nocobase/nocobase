/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr as flowTExpr, useFlowEngine } from '@nocobase/flow-engine';

export const NAMESPACE = 'workflow-response-message';

export function useT() {
  const flowEngine = useFlowEngine();
  return (key: string, options?: Record<string, any>) =>
    flowEngine.context.t(key, { ns: [NAMESPACE, 'client'], nsMode: 'fallback', ...options });
}

export function tExpr(key: string, options?: Record<string, any>) {
  return flowTExpr(key, { ns: [NAMESPACE, 'client'], nsMode: 'fallback', ...options });
}
