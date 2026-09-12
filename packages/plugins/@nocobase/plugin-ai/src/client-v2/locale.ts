/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr as flowTExpr, useFlowEngine } from '@nocobase/flow-engine';

export const NAMESPACE = '@nocobase/plugin-ai';

export function useAITranslation() {
  const t = useT();
  return { t };
}

export function useT() {
  const engine = useFlowEngine();
  return (key: string, options?: Record<string, unknown>) =>
    engine.context.t(key, { ns: [NAMESPACE, 'ai', 'client'], ...options });
}

export function tExpr(key: string, options?: Record<string, unknown>) {
  return flowTExpr(key, { ns: [NAMESPACE, 'ai', 'client'], ...options });
}
