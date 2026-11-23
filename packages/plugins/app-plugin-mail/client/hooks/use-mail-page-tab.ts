import { useCallback, useState } from 'react';

/**
 * The tab the page shows, kept in the address's `tab` parameter so a reload or a shared link opens the same tab, such
 * as the personal Mail accounts page returning from an OAuth Provider.
 */
export function useMailPageTab<TKey extends string>(
  keys: readonly TKey[],
  fallback: TKey,
): readonly [TKey, (key: TKey) => void] {
  const [tab, setTab] = useState<TKey>(() => {
    if (typeof window === 'undefined') return fallback;
    const value = new URLSearchParams(window.location.search).get('tab');
    return keys.find((key) => key === value) ?? fallback;
  });
  const select = useCallback(
    (key: TKey) => {
      setTab(key);
      if (typeof window === 'undefined') return;
      const url = new URL(window.location.href);
      if (key === fallback) url.searchParams.delete('tab');
      else url.searchParams.set('tab', key);
      window.history.replaceState(window.history.state, '', url);
    },
    [fallback],
  );
  return [tab, select];
}
