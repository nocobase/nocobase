/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr as _tExpr, useFlowEngine } from '@nocobase/flow-engine';

export const NAMESPACE = 'block-workbench';

export function tExpr(key: string) {
  return _tExpr(key, { ns: [NAMESPACE, 'client'] });
}

export function useT() {
  const flowEngine = useFlowEngine();
  return (key: string, options?: Record<string, any>) =>
    flowEngine.context.t(key, { ns: [NAMESPACE, 'client'], ...options });
}
