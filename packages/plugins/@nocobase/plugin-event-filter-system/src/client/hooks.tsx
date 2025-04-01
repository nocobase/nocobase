/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useEffect, useCallback, useState, useMemo, ComponentProps } from 'react';
import { useApp } from '@nocobase/client';
import {
  FilterFunction,
  FilterOptions,
  EventListener,
  EventListenerOptions,
  ApplyFilterOptions,
  FilterContext,
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
 * @returns A function that applies the filter and returns a Promise
 */

export const useApplyFilter = (name: string, options: ApplyFilterOptions) => {
  const { input, settings, resource, props, resourceParams } = options;
  const [done, setDone] = useState(false);
  const [result, setResult] = useState(null);
  const app = useApp();

  useEffect(() => {
    const ctx: FilterContext = {
      settings,
      resource,
      props,
      resourceParams,
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
  }, [app, name, input, settings, resource, props, resourceParams]);

  return { done, result };
};

/**
 * Hook for registering an event listener that will be automatically unregistered on component unmount
 *
 * @param eventName - Event name(s) to listen for
 * @param listener - Event listener function
 * @param options - Event listener options
 * @param deps - Dependency array for memoizing the listener function
 */
export function useEventListener(
  eventName: string | string[],
  listener: EventListener,
  options: EventListenerOptions = {},
  deps: any[] = [],
) {
  const app = useApp();

  // Memoize the listener function based on deps
  const memoizedListener = useCallback(listener, [listener, ...deps]);

  useEffect(() => {
    // Register the listener on mount
    const unsubscribe = app.eventManager.on(eventName, memoizedListener, options);

    // Unregister on unmount
    return unsubscribe;
  }, [app, eventName, memoizedListener, options]);
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
