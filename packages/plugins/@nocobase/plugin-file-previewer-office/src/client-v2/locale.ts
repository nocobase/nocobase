/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowEngine } from '@nocobase/flow-engine';

export const NAMESPACE = 'file-previewer-office';

export function useT() {
  const engine = useFlowEngine();
  return (key: string, options?: Record<string, any>) =>
    engine.context.t(key, { ns: [NAMESPACE, 'client'], ...options });
}
