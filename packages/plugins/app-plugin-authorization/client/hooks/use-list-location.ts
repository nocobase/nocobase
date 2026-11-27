import { useState } from 'react';
import {
  useLocation,
  useOutlet,
  useResolvedPath,
  useSearchParams,
  type SetURLSearchParams,
} from 'react-router';

/** A list covered by a child page keeps the query it last had, not the child's; returning to it reads afresh. */
export function useListLocation(): {
  readonly params: URLSearchParams;
  readonly setParams: SetURLSearchParams;
  readonly active: boolean;
} {
  const location = useLocation();
  const listPath = useResolvedPath('.').pathname;
  const child = useOutlet();
  const [current, setParams] = useSearchParams();
  const active =
    (listPath === '/' && child === null) ||
    location.pathname.replace(/\/$/u, '') === listPath.replace(/\/$/u, '');
  const [last, setLast] = useState(current);
  if (active && last !== current) setLast(current);
  return { params: active ? current : last, setParams, active };
}
