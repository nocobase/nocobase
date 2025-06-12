/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { autorun, toJS } from '@formily/reactive';
import { FlowModel } from '../models';
import { useFlowEngine } from '../provider';
import { FlowExtraContext } from '../types';
import { uid } from 'uid/secure';

// 生成稳定的缓存键
function generateCacheKey(prefix: string, flowKey: string, modelUid: string): string {
  return `${prefix}:${flowKey}:${modelUid}`;
}

// 安全序列化对象的函数
function safeStringify(obj: any, visited = new Set(), depth = 0, maxDepth = 5): string {
  // 深度限制，防止过深递归
  if (depth > maxDepth) {
    return '[MaxDepthExceeded]';
  }

  // 处理基本类型
  if (obj === null || obj === undefined) {
    return String(obj);
  }

  if (typeof obj !== 'object' && typeof obj !== 'function') {
    return String(obj);
  }

  // 处理函数
  if (typeof obj === 'function') {
    // 对于函数，可以使用函数名或为匿名函数生成一个标识符
    return `function:${obj.name || 'anonymous'}`;
  }

  // 处理循环引用
  if (visited.has(obj)) {
    return '[Circular]';
  }

  // 添加到已访问集合
  visited.add(obj);

  // 处理数组
  if (Array.isArray(obj)) {
    try {
      // 限制处理的数组元素数量
      const maxItems = 100;
      const items = obj.slice(0, maxItems);
      const result =
        '[' +
        items.map((item) => safeStringify(item, visited, depth + 1, maxDepth)).join(',') +
        (obj.length > maxItems ? ',...' : '') +
        ']';
      return result;
    } catch (e) {
      return '[Array]';
    }
  }

  // 处理普通对象
  try {
    const keys = Object.keys(obj).sort(); // 排序确保稳定性
    // 限制处理的属性数量
    const maxKeys = 50;
    const limitedKeys = keys.slice(0, maxKeys);

    const pairs = limitedKeys.map((key) => {
      const value = obj[key];
      return `${key}:${safeStringify(value, visited, depth + 1, maxDepth)}`;
    });

    return '{' + pairs.join(',') + (keys.length > maxKeys ? ',...' : '') + '}';
  } catch (e) {
    // 如果无法序列化，返回一个简单的标识
    return '[Object]';
  }
}

/**
 * 通用的流程执行 Hook
 * @param cacheKeyPrefix 缓存键前缀
 * @param flowKey 流程键
 * @param model FlowModel 实例
 * @param context 用户上下文
 * @param executor 执行函数
 * @param logMessage 日志消息
 * @returns 执行结果
 */
function useFlowExecutor<T, TModel extends FlowModel = FlowModel>(
  cacheKeyPrefix: string,
  flowKey: string,
  model: TModel,
  context: FlowExtraContext | undefined,
  executor: (context?: FlowExtraContext) => Promise<T>,
  logMessage: string,
): T {
  const engine = useFlowEngine();
  const cacheKey = useMemo(
    () => generateCacheKey(cacheKeyPrefix, flowKey, model.uid),
    [cacheKeyPrefix, flowKey, model.uid],
  );
  const [, forceUpdate] = useState({});
  const isMounted = useRef(false);
  const flowEngineCache = engine.applyFlowCache;

  useEffect(() => {
    isMounted.current = true;
    return () => {
      flowEngineCache.delete(cacheKey);
    };
  }, [cacheKey]);

  useEffect(() => {
    let debounceTimer: NodeJS.Timeout | null = null;
    let isInitialAutorunForEffect = true;

    const disposeAutorun = autorun(() => {
      // 只监听 stepParams 的变化，移除对 props 的监听以避免循环触发
      JSON.stringify(toJS(model.stepParams));

      if (isInitialAutorunForEffect) {
        isInitialAutorunForEffect = false;
        if (flowEngineCache.get(cacheKey)) {
          return;
        }
      }

      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        if (!isMounted.current) return;

        const cachedEntry = flowEngineCache.get(cacheKey);
        if (cachedEntry?.status === 'resolved' || !cachedEntry) {
          console.log(logMessage);
          try {
            const newResult = await executor(context);
            if (isMounted.current) {
              flowEngineCache.set(cacheKey, {
                status: 'resolved',
                data: newResult,
                promise: Promise.resolve(newResult),
              });
              forceUpdate({});
            }
          } catch (newError) {
            flowEngineCache.set(cacheKey, { status: 'rejected', error: newError, promise: Promise.reject(newError) });
            forceUpdate({});
          }
        }
      }, 300);
    });

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      disposeAutorun();
    };
  }, [model, context, cacheKey, executor, logMessage, engine]);

  // 检查缓存
  const cachedEntry = flowEngineCache.get(cacheKey);
  if (cachedEntry) {
    if (cachedEntry.status === 'resolved') return cachedEntry.data;
    if (cachedEntry.status === 'rejected') throw cachedEntry.error;
    if (cachedEntry.status === 'pending') throw cachedEntry.promise;
  }

  // 执行初始请求
  const promise = executor(context)
    .then((result) => {
      flowEngineCache.set(cacheKey, { status: 'resolved', data: result, promise });
      return result;
    })
    .catch((err) => {
      flowEngineCache.set(cacheKey, { status: 'rejected', error: err, promise });
      throw err;
    });

  flowEngineCache.set(cacheKey, { status: 'pending', promise });
  throw promise;
}

export function useApplyFlow<TModel extends FlowModel = FlowModel>(
  flowKey: string,
  model: TModel,
  context?: FlowExtraContext,
): any {
  return useFlowExecutor(
    'applyFlow',
    flowKey,
    model,
    context,
    (ctx) => model.applyFlow(flowKey, ctx),
    `[FlowEngine.useApplyFlow] Reactive re-apply for flow: ${flowKey}, model: ${model.uid}`,
  );
}

/**
 * Hook for applying auto-apply flows on a FlowModel
 * @param model The FlowModel instance
 * @param context Optional user context
 * @returns The results of all auto-apply flows execution
 */
export function useApplyAutoFlows(modelOrUid: FlowModel | string, context?: FlowExtraContext, independentAutoFlowExecution?: boolean): any[] {
  const flowEngine = useFlowEngine();
  const model = useMemo(() => {
    if (typeof modelOrUid === 'string') {
      return flowEngine.getModel(modelOrUid);
    }
    return modelOrUid;
  }, [modelOrUid, flowEngine]);

  // const runId = useMemo(() => {
  //   if (independentAutoFlowExecution) {
  //     return `autoFlow:${uid()}`;
  //   }
  //   return 'autoFlow';
  // }, [independentAutoFlowExecution]);
  
  const executor = useCallback((ctx?: FlowExtraContext) => model.applyAutoFlows(ctx), [model]);

  return useFlowExecutor(
    // runId,
    'autoFlow',
    'all',
    model,
    context,
    executor,
    `[FlowEngine.useApplyAutoFlows] Reactive re-apply for model: ${model.uid}`,
  );
}
