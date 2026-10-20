import { useSyncExternalStore } from 'react';

/** Whether a media query matches now, following its changes. */
export function useMediaQuery(
  query: string,
  fallback: boolean = false,
): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {};
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    () =>
      typeof window === 'undefined' || !window.matchMedia
        ? fallback
        : window.matchMedia(query).matches,
    () => fallback,
  );
}
