import {
  useLocation,
  useOutlet,
  useResolvedPath,
  useSearchParams,
} from 'react-router';
import { useRouteSearches } from '../routing/route-context.js';

/** Covered lists keep their own query; returning activates a fresh read. */
export function useListLocation() {
  const location = useLocation();
  const listPath = useResolvedPath('.').pathname;
  const child = useOutlet();
  const searches = useRouteSearches();
  const [current, setParams] = useSearchParams();
  const active =
    (listPath === '/' && child === null) ||
    location.pathname.replace(/\/$/u, '') === listPath.replace(/\/$/u, '');
  const params = active
    ? current
    : new URLSearchParams(searches.get(listPath) ?? '');
  return { params, setParams, active };
}
