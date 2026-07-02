/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/* istanbul ignore file -- @preserve: locale helpers are covered through translated UI behavior rather than standalone helper tests. */
import { tExpr as flowTExpr, useFlowEngine } from '@nocobase/flow-engine';
import { NAMESPACE } from '../common/constants';

export function useT() {
  const engine = useFlowEngine();
  return (key: string, options?: Record<string, any>) =>
    engine.context.t(key, { ns: [NAMESPACE, 'client'], ...options });
}

export function tExpr(key: string) {
  return flowTExpr(key, { ns: [NAMESPACE, 'client'] });
}
