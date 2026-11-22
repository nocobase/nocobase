import {
  createSearchParams,
  useLocation,
  useOutlet,
  useResolvedPath,
  useSearchParams,
  type SetURLSearchParams,
} from 'react-router';
import { useCallback, useEffect, useRef } from 'react';
import { useRouteSearches } from '../routing/route-context.js';

type ParamsUpdate = Parameters<SetURLSearchParams>;

/**
 * Covered lists keep their own query; returning activates a fresh read.
 *
 * `setParams` changes the list's query only while the list is the current location. An update that arrives while a
 * child covers the list, such as a debounced search firing after a row or a child action was opened, waits and
 * applies when the list is current again, so it never replaces the child's path.
 */
export function useListLocation() {
  const location = useLocation();
  const listPath = useResolvedPath('.').pathname;
  const child = useOutlet();
  const searches = useRouteSearches();
  const [current, setSearchParams] = useSearchParams();
  const active =
    (listPath === '/' && child === null) ||
    location.pathname.replace(/\/$/u, '') === listPath.replace(/\/$/u, '');
  const params = active
    ? current
    : new URLSearchParams(searches.get(listPath) ?? '');
  const pendingRef = useRef<ParamsUpdate[]>([]);
  const setParams = useCallback<SetURLSearchParams>(
    (next, options) => {
      if (active) setSearchParams(next, options);
      else pendingRef.current.push([next, options]);
    },
    [active, setSearchParams],
  );
  useEffect(() => {
    if (!active || pendingRef.current.length === 0) return;
    const updates = pendingRef.current;
    pendingRef.current = [];
    setSearchParams(
      (old) =>
        updates.reduce(
          (params, [next]) =>
            createSearchParams(
              typeof next === 'function' ? next(params) : next,
            ),
          old,
        ),
      updates[updates.length - 1][1],
    );
  });
  return { params, setParams, active };
}
