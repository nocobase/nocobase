import { useLocation, useResolvedPath, useSearchParams } from 'react-router';

/**
 * The list's query and whether the list itself is showing. Its child routes (the create dialog and the edit drawer)
 * open with the list's query in their own URL, so the list keeps reading it while one of them covers it.
 */
export function useListLocation(): {
  readonly params: URLSearchParams;
  readonly setParams: ReturnType<typeof useSearchParams>[1];
  readonly active: boolean;
} {
  const location = useLocation();
  const listPath = useResolvedPath('.').pathname;
  const [params, setParams] = useSearchParams();
  const active =
    location.pathname.replace(/\/$/u, '') === listPath.replace(/\/$/u, '');
  return { params, setParams, active };
}
