/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useMemo } from 'react';
import { FlowModel } from '../models';
import { useFlowEngine } from '../provider';
import { useRequest } from 'ahooks';

/**
 * Hook for applying auto-apply flows on a FlowModel
 * @param model The FlowModel instance
 * @param context Optional user context
 * @returns true if the request is pending
 */
export function useApplyAutoFlows(modelOrUid: FlowModel | string, inputArgs?: Record<string, any>) {
  const flowEngine = useFlowEngine();
  const model = useMemo(() => {
    if (typeof modelOrUid === 'string') {
      return flowEngine.getModel(modelOrUid);
    }
    return modelOrUid;
  }, [modelOrUid, flowEngine]);

  const { loading } = useRequest(
    async () => {
      await model.applyAutoFlows(inputArgs);
    },
    {
      refreshDeps: [model, inputArgs],
    },
  );

  return loading;
}
