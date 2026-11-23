import { useCallback, useLayoutEffect, useRef } from 'react';

/**
 * Whether the calling component is still mounted, for work that resolves after a request. The Agent plugin's layout
 * provider remounts the signed-in tree when the person changes, so a page that is still mounted still belongs to the
 * person who started the request.
 */
export function useIsMounted(): () => boolean {
  const mountedRef = useRef(false);
  useLayoutEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  return useCallback(() => mountedRef.current, []);
}
