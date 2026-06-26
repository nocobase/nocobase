/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr as _tExpr, useFlowEngine } from '@nocobase/flow-engine';

export const NAMESPACE = '@nocobase/plugin-comments-flexible';

export function useT() {
  const engine = useFlowEngine();
  return (str: string, options?: Record<string, unknown>) =>
    engine.context.t(str, { ...(options || {}), ns: [NAMESPACE, 'client'] });
}

export function tExpr(key: string, options?: Record<string, unknown>) {
  return _tExpr(key, { ...(options || {}), ns: [NAMESPACE, 'client'] });
}
