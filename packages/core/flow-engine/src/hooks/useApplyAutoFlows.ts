/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useRequest } from 'ahooks';
import { useMemo } from 'react';
import { FlowModel } from '../models';
import { useFlowEngine } from '../provider';

/**
 * Hook for applying auto-apply flows on a FlowModel
 * @param model The FlowModel instance
 * @param context Optional user context
 * @returns true if the request is pending
 */
export function useApplyAutoFlows(
  modelOrUid: FlowModel | string,
  inputArgs?: Record<string, any>,
  options?: { throwOnError?: boolean; useCache?: boolean },
) {
  const flowEngine = useFlowEngine();
  const model = useMemo(() => {
    if (typeof modelOrUid === 'string') {
      return flowEngine.getModel(modelOrUid);
    }
    return modelOrUid;
  }, [modelOrUid, flowEngine]);

  model?.useHooksBeforeRender();

  const { loading, error } = useRequest(
    async () => {
      if (!model) return;
      // beforeRender 在模型层默认顺序执行并默认使用缓存（可覆盖）
      await model.dispatchEvent('beforeRender', inputArgs, { useCache: options?.useCache });
    },
    {
      refreshDeps: [model, inputArgs, options?.useCache],
    },
  );

  // 默认行为：保持抛错以便 ErrorBoundary 捕获
  if (options?.throwOnError !== false && error) {
    throw error;
  }

  return { loading, error } as const;
}
