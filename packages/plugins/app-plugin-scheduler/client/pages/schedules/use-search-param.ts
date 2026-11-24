/** One search parameter of the page's URL, so a link, a refresh and the back button keep the tab and the open schedule. */
import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

export function useSearchParam(
  name: string,
): [string | undefined, (next: string | undefined, replace?: boolean) => void] {
  const [params, setParams] = useSearchParams();
  const value = params.get(name) ?? undefined;
  const set = useCallback(
    (next: string | undefined, replace = false) => {
      setParams(
        (previous) => {
          const updated = new URLSearchParams(previous);
          if (next === undefined) updated.delete(name);
          else updated.set(name, next);
          return updated;
        },
        { replace },
      );
    },
    [name, setParams],
  );
  return [value, set];
}
