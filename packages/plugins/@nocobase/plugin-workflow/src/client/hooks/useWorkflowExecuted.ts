/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowContext } from '../FlowContext';

export function useWorkflowExecuted() {
  const { workflow } = useFlowContext();
  return BigInt(workflow?.versionStats?.executed);
}

export function useWorkflowAnyExecuted() {
  const { workflow } = useFlowContext();
  return BigInt(workflow?.stats?.executed);
}
