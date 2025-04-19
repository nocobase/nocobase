/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { FilterFlowManager, FilterHandlerContext } from '@nocobase/client'; // 确认 FilterFlowManager 和类型的实际路径

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

export function useApplyFilters<T = any>(
  filterFlowManager: FilterFlowManager,
  flowName: string,
  initialValue: any,
  context?: FilterHandlerContext,
): T {
  const [, forceUpdate] = useState(0);

  const cacheKey = useMemo(() => {
    const key = JSON.stringify([flowName, context]);
    return key;
  }, [flowName, context]);

  const prevValue = useRef(initialValue);
  const prevCacheKey = useRef(cacheKey);

  useEffect(() => {
    if (prevValue.current !== initialValue) {
      const refreshData = async () => {
        const cachedEntry = filterCache.get(cacheKey);
        if (cachedEntry?.status === 'resolved') {
          const newData = await filterFlowManager.applyFilters(flowName, initialValue, context);
          filterCache.set(cacheKey, { status: 'resolved', data: newData, promise: Promise.resolve(newData) });
          forceUpdate((prev) => prev + 1);
        }
      };
      refreshData();
      prevValue.current = initialValue;
    }
  }, [initialValue]);

  useEffect(() => {
    if (prevCacheKey.current !== cacheKey) {
      filterCache.delete(prevCacheKey.current);
      prevCacheKey.current = cacheKey;
    }
  }, [cacheKey]);

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
        return cachedEntry.data as T;
    }
  }

  // 创建新的 Promise
  const promise = filterFlowManager
    .applyFilters(flowName, initialValue, context)
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
