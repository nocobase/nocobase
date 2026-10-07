/**
 * The tab of a detail page, kept in the URL (`?tab=`) so a link, a refresh and the browser's back button return to the
 * same tab. The first tab is the default and leaves the URL clean.
 */
import { useSearchParams } from 'react-router';

/** The tab the URL names, if it is one of `tabs`; the first otherwise. */
export function useTabParam<T extends string>(
  tabs: readonly T[],
): [T, (next: T) => void] {
  const [params, setParams] = useSearchParams();
  const named = params.get('tab');
  const fallback = tabs[0];
  const current = tabs.find((tab) => tab === named) ?? fallback;
  const select = (next: T): void => {
    setParams((previous) => {
      const updated = new URLSearchParams(previous);
      if (next === fallback) updated.delete('tab');
      else updated.set('tab', next);
      return updated;
    });
  };
  return [current, select];
}

/** `?tab=<tab>` with the URL's other parameters kept: a link to one tab of the page. */
export function useTabHref(): (tab: string) => string {
  const [params] = useSearchParams();
  return (tab) => {
    const updated = new URLSearchParams(params);
    updated.set('tab', tab);
    return `?${updated.toString()}`;
  };
}
