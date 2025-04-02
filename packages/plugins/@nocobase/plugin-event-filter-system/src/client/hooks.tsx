/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useEffect, useCallback, useState, useMemo, ComponentProps } from 'react';
import { useApp, useBlockResource } from '@nocobase/client';
import {
  FilterFunction,
  FilterOptions,
  EventListener,
  EventListenerOptions,
  ApplyFilterOptions,
  FilterContext,
  EventContext,
} from './types';
import { useFieldSchema } from '@formily/react';

/**
 * Hook for registering a filter function that will be automatically unregistered on component unmount
 *
 * @param name - Filter name to register with
 * @param filter - Filter function
 * @param options - Filter options
 * @param deps - Dependency array for memoizing the filter function
 */
export function useAddFilter(name: string, filter: FilterFunction, options: FilterOptions = {}, deps: any[] = []) {
  const app = useApp();

  // Memoize the filter function based on deps
  const memoizedFilter = useCallback(filter, [filter, ...deps]);

  useEffect(() => {
    // Register the filter on mount
    const unregister = app.filterManager.addFilter(name, memoizedFilter, options);

    // Unregister on unmount
    return unregister;
  }, [app, name, memoizedFilter, options]);
}

/**
 * Hook that returns a function that will apply filters to a given value
 *
 * @param name - Filter name to apply
 * @param options - Apply filter options
 * @returns A function that applies the filter and returns a Promise
 */

export const useApplyFilter = (name: string, options: ApplyFilterOptions) => {
  const { input, props } = options;
  const fieldSchema = useFieldSchema();
  const [done, setDone] = useState(false);
  const [result, setResult] = useState(null);
  const app = useApp();
  const resource = useBlockResource();

  useEffect(() => {
    const ctx: FilterContext = {
      settings: fieldSchema['x-component-settings'],
      resource,
      props,
      resourceParams: {
        page: fieldSchema?.['x-decorator-props']?.page,
        pageSize: fieldSchema?.['x-decorator-props']?.pageSize,
      },
      _cancel: false,
    };
    app.filterManager
      .applyFilter(name, input, ctx)
      .then((ret) => {
        if (!ctx._cancel) {
          setResult(ret);
          setDone(true);
        }
      })
      .catch((error) => {
        if (!ctx._cancel) {
          console.error('Error applying filter:', error);
        }
      });

    return () => {
      ctx._cancel = true;
    };
  }, [app, name, input, fieldSchema, props, resource]);

  return { done, result };
};

/**
 * 事件监听器的默认过滤函数。
 * 根据事件上下文 (ctx) 和监听器的选项 (options) 确定监听器是否应执行。
 *
 * 逻辑:
 * 1. 如果事件分发没有包含目标 (ctx.target 为假值)，则监听器始终运行（多播）。
 * 2. 如果事件分发包含了目标 (ctx.target 存在):
 *    a. 如果监听器选项包含特定的目标条件 (例如 options.uischema)，
 *       则仅当目标条件与上下文的目标匹配时，监听器才运行。
 */
function defaultListenerFilter(ctx: EventContext, options: EventListenerOptions): boolean {
  // 1. 多播: 分发时未指定目标, 监听器运行。
  if (!ctx.target) {
    return true;
  }

  // 2. 单播: 分发时指定了目标。检查监听器选项。
  if (options?.uischema) {
    const targetSchema = ctx.target.uischema;
    // 基本检查：两个 schema 都存在且具有匹配的 'x-uid'
    return !!(targetSchema && options.uischema['x-uid'] && options.uischema['x-uid'] === targetSchema['x-uid']);
  } else {
    return false;
  }
}

export function useAddEventListener(event: string | string[], handler: EventListener, options?: EventListenerOptions) {
  const fieldSchema = useFieldSchema();
  const app = useApp();

  useEffect(() => {
    const unsubscribe = app.eventManager.on(event, handler, {
      filter: defaultListenerFilter,
      uischema: fieldSchema.toJSON(),
      ...options,
    });
    return unsubscribe;
  }, [handler, app, event, fieldSchema]);
}

/**
 * Hook that returns a function that will dispatch an event
 *
 * @returns A function that dispatches events
 */
export function useDispatchEvent() {
  const app = useApp();

  return useCallback(
    async (eventName: string | string[], ctx: any) => {
      return app.eventManager.dispatchEvent(eventName, ctx);
    },
    [app],
  );
}
