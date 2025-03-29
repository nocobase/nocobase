/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useEffect, useCallback, useState, useMemo } from 'react';
import { useApp } from '@nocobase/client';
import { FilterFunction, FilterOptions, EventListener, EventListenerOptions } from './types';

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
export function useApplyFilter(name: string) {
  const app = useApp();

  return useCallback(
    async (initialValue: any, ...contextArgs: any[]) => {
      return app.filterManager.applyFilter(name, initialValue, ...contextArgs);
    },
    [app, name],
  );
}

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

/**
 * Hook for applying a filter and managing the loading state
 *
 * @param name - Filter name to apply
 * @param initialValue - Initial value to filter
 * @param contextArgs - Additional context arguments to pass to filters
 * @param deps - Dependencies to trigger re-filtering
 * @returns [filteredValue, isLoading, error]
 */
export function useFilteredValue<T>(
  name: string,
  initialValue: T,
  contextArgs: any[] = [],
  deps: any[] = [],
): [T, boolean, Error | null] {
  const app = useApp();
  const [filteredValue, setFilteredValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    // Define async function to apply the filter and update state
    const applyFilterAndUpdateState = async () => {
      try {
        const result = await app.filterManager.applyFilter(name, initialValue, ...contextArgs);
        if (isMounted) {
          setFilteredValue(result);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error(`Error applying filter '${name}':`, err);
          setError(err as Error);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Call the async function immediately
    applyFilterAndUpdateState();

    // Return cleanup function
    return () => {
      isMounted = false;
    };
  }, [app.filterManager, name, initialValue, contextArgs, deps]);

  return [filteredValue, isLoading, error];
}
