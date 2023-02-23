import { useCallback, useRef } from 'react';

export const useOnceFn = (cb: (...args: any) => void) => {
  const isFresh = useRef(false);
  return useCallback(() => {
    if (isFresh.current) {
      return;
    }
    cb();
    isFresh.current = true;
  }, [cb]);
};
