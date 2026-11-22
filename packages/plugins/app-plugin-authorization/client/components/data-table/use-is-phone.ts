import { useCallback, useSyncExternalStore } from 'react';

/** Below the `md` breakpoint, the width `useIsMobile` and the sidebar also use. */
const PHONE_QUERY = '(max-width: 767px)';

function phoneMedia(): MediaQueryList | undefined {
  return typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function'
    ? window.matchMedia(PHONE_QUERY)
    : undefined;
}

/** Whether the viewport is phone-sized, read on the first render so a phone never flashes the table. */
export function useIsPhone(enabled: boolean): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const media = enabled ? phoneMedia() : undefined;
      if (typeof media?.addEventListener !== 'function') return () => {};
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    },
    [enabled],
  );
  return useSyncExternalStore(
    subscribe,
    () => enabled && phoneMedia()?.matches === true,
    () => false,
  );
}
