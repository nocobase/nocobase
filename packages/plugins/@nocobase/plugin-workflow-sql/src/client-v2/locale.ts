/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr as _tExpr, useFlowEngine } from '@nocobase/flow-engine';
import { NAMESPACE } from './constants';

export { NAMESPACE };

export function tExpr(key: string, options?: Record<string, unknown>) {
  return _tExpr(key, { ns: NAMESPACE, ...options });
}

export function useT() {
  const flowEngine = useFlowEngine();
  return (key: string, options?: Record<string, unknown>) =>
    flowEngine.context.t(key, { ns: [NAMESPACE, 'workflow', 'client'], nsMode: 'fallback', ...options });
}
