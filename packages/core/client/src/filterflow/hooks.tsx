/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { BaseModel, FilterHandlerContext, useBlockConfigs, useFilterFlowManager } from '@nocobase/client'; // 确认 FilterFlowManager 和类型的实际路径
import { autorun } from '@formily/reactive';

// 使用 Map 作为简单的内存缓存
const filterCache = new Map<
  any,
  {
    status: 'pending' | 'resolved' | 'rejected';
    promise?: Promise<any>;
    data?: any;
    error?: any;
  }
>();

// 安全地获取对象的可序列化表示
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
      const result = '[' + items.map(item => safeStringify(item, visited, depth + 1, maxDepth)).join(',') + 
        (obj.length > maxItems ? ',...' : '') + ']';
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
    
    const pairs = limitedKeys.map(key => {
      const value = obj[key];
      return `${key}:${safeStringify(value, visited, depth + 1, maxDepth)}`;
    });
    
    return '{' + pairs.join(',') + (keys.length > maxKeys ? ',...' : '') + '}';
  } catch (e) {
    // 如果无法序列化，返回一个简单的标识
    return '[Object]';
  }
}

export function useApplyFilters(
  flowName: string,
  model: BaseModel,
  context?: FilterHandlerContext | (() => Promise<FilterHandlerContext>),
  id?: string,
): { reApplyFilters: () => void } {
  const [, forceUpdate] = useState(true);
  const { setConfigs, subscribe } = useBlockConfigs();
  const filterFlowManager = useFilterFlowManager();
  
  const cacheKey = useMemo(() => {
    if (id) {
      return `${flowName}-${id}`;
    }
    
    // 对于函数类型的context，我们不能序列化其内容，只能基于引用
    if (typeof context === 'function') {
      return `${flowName}-function`;
    }
    
    // 对于对象类型，尝试安全地序列化其内容
    try {
      const contextHash = safeStringify(context);
      return `${flowName}-${contextHash}`;
    } catch (e) {
      // 如果序列化失败，使用一个通用标识符
      console.warn('Failed to create stable cache key for context', e);
      return `${flowName}-object`;
    }
  }, [flowName, context, id]);

  const prevCacheKey = useRef(cacheKey);
  const contextPromise = new Promise<FilterHandlerContext>((resolve, reject) => {
    if (typeof context === 'function') {
      context().then(resolve).catch(reject);
    } else {
      resolve(context);
    }
  });

  useEffect(() => {
    let isFirstRun = true;
    let timer: any = null;
    const dispose = autorun(() => {
      // 监听filterParams[flowName]变化
      const params = model.filterParams?.[flowName];
      console.log('params', params);
      if (isFirstRun) {
        isFirstRun = false;
        return;
      }
      if (timer) clearTimeout(timer);
      timer = setTimeout(async () => {
        const cachedEntry = filterCache.get(cacheKey);
        if (cachedEntry?.status === 'resolved') {
          const newData = await contextPromise.then((ctx) =>
            filterFlowManager.applyFilters(flowName, model, ctx),
          );
          filterCache.set(cacheKey, { status: 'resolved', data: newData, promise: Promise.resolve(newData) });
          forceUpdate((prev) => !prev);
        }
      }, 300);
    });
    return () => {
      dispose();
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model.filterParams, flowName, cacheKey]);

  useEffect(() => {
    if (prevCacheKey.current !== cacheKey) {
      filterCache.delete(prevCacheKey.current);
      prevCacheKey.current = cacheKey;
    }
  }, [cacheKey]);

  useEffect(() => {
    return subscribe(() => {
      filterCache.delete(cacheKey);
      forceUpdate((prev) => !prev);
    });
  }, []);

  // 检查缓存
  const cachedEntry = filterCache.get(cacheKey);

  if (cachedEntry) {
    switch (cachedEntry.status) {
      case 'pending':
        // 如果仍在请求中，抛出 Promise
        throw cachedEntry.promise;
      case 'rejected':
        // 如果请求失败，抛出错误
        throw cachedEntry.error;
      case 'resolved':
        // 如果已成功，返回数据
        setConfigs(cachedEntry.data?.blockConfig, false);
        return {
          reApplyFilters: () => {
            filterCache.delete(cacheKey);
            forceUpdate((prev) => !prev);
          },
        };
    }
  }

  // 创建新的 Promise
  const promise = contextPromise
    .then((ctx) => filterFlowManager.applyFilters(flowName, model, ctx))
    .then((result) => {
      // 成功时更新缓存
      filterCache.set(cacheKey, { status: 'resolved', data: result, promise });
      return result;
    })
    .catch((err) => {
      // 失败时更新缓存
      filterCache.set(cacheKey, { status: 'rejected', error: err, promise });
      // 重新抛出错误，以便 ErrorBoundary 可以捕获
      throw err;
    });

  // 将新的 Promise 存入缓存，并标记为 pending
  filterCache.set(cacheKey, { status: 'pending', promise });

  // 抛出 Promise 以触发 Suspense
  throw promise;
}
