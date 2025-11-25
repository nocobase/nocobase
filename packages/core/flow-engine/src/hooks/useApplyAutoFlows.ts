/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useRequest } from 'ahooks';
import { useEffect, useMemo, useRef } from 'react';
import { FlowModel } from '../models';
import { useFlowEngine } from '../provider';

// 全局去重：同一个模型+入参在 ready=true 的情况下只允许触发一次 beforeRender，避免 StrictMode 双挂载
const lastRunKeyByModel = new Map<string, string>();

/**
 * Hook for applying auto-apply flows on a FlowModel
 * @param model The FlowModel instance
 * @param context Optional user context
 * @returns true if the request is pending
 */
export function useApplyAutoFlows(
  modelOrUid: FlowModel | string,
  inputArgs?: Record<string, any>,
  options?: { throwOnError?: boolean; ready?: boolean },
) {
  const flowEngine = useFlowEngine();
  const model = useMemo(() => {
    if (typeof modelOrUid === 'string') {
      return flowEngine.getModel(modelOrUid);
    }
    return modelOrUid;
  }, [modelOrUid, flowEngine]);
  const ready = options?.ready ?? true;
  const lastRunKeyRef = useRef<string | null>(null);

  if (ready) {
    model?.useHooksBeforeRender();
  }

  const { loading, error, run } = useRequest(
    async () => {
      if (!model) return;
      // beforeRender 在模型层默认顺序执行并默认使用缓存（可覆盖）
      await model.dispatchEvent('beforeRender', inputArgs);
    },
    {
      manual: true,
      ready,
    },
  );

  useEffect(() => {
    if (!ready || !model) return;
    const key = `${model.uid}:${JSON.stringify(inputArgs ?? {})}`;
    // 已全局执行过同样的 beforeRender，就不再重复触发（应对 StrictMode 双调用）
    if (lastRunKeyByModel.get(model.uid) === key) return;
    lastRunKeyRef.current = key;
    lastRunKeyByModel.set(model.uid, key);
    run();
  }, [ready, model, inputArgs, run]);

  useEffect(() => {
    if (!ready) {
      // 页面隐藏后清空 key，重新激活时可再次运行
      lastRunKeyRef.current = null;
      if (model?.uid) {
        lastRunKeyByModel.delete(model.uid);
      }
    }
  }, [ready, model?.uid]);

  // 默认行为：保持抛错以便 ErrorBoundary 捕获
  if (options?.throwOnError !== false && error) {
    throw error;
  }

  return { loading, error } as const;
}
