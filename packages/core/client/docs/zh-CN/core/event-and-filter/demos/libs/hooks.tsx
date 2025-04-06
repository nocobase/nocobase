/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useEffect, useCallback, useState } from 'react';
import { useBlockResource } from '@nocobase/client';
import {
  FilterFunction,
  FilterOptions,
  EventListener,
  EventListenerOptions,
  ApplyFilterOptions,
  FilterContext,
} from './types';
import { useFieldSchema } from '@formily/react';
import { defaultListenerCondition } from './event-manager';
import { eventManager, filterManager } from './defaults';

/**
 * Hook for registering a filter function that will be automatically unregistered on component unmount
 *
 * @param name - Filter name to register with
 * @param filter - Filter function
 * @param options - Filter options
 * @param deps - Dependency array for memoizing the filter function
 */
export function useAddFilter(name: string, filter: FilterFunction, options: FilterOptions = {}, deps: any[] = []) {
  // Memoize the filter function based on deps
  const memoizedFilter = useCallback(filter, [filter, ...deps]);

  useEffect(() => {
    // Register the filter on mount
    const unregister = filterManager.addFilter(name, memoizedFilter, options);

    // Unregister on unmount
    return unregister;
  }, [name, memoizedFilter, options]);
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
    filterManager
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
  }, [name, input, fieldSchema, props, resource]);

  return { done, result };
};

export function useAddEventListener(event: string | string[], handler: EventListener, options?: EventListenerOptions) {
  const fieldSchema = useFieldSchema();

  useEffect(() => {
    const unsubscribe = eventManager.on(event, handler, {
      condition: defaultListenerCondition,
      ...options,
    });
    return unsubscribe;
  }, [handler, event, fieldSchema]);
}

/**
 * Hook that returns a function that will dispatch an event
 *
 * @returns A function that dispatches events
 */
export function useDispatchEvent() {
  return useCallback(
    async (eventName: string | string[], ctx: any) => {
      return eventManager.dispatchEvent(eventName, ctx);
    },
    [eventManager],
  );
}
