import { useCallback, useState } from 'react';

/** A ref callback and the width of the element it is attached to, kept current as it resizes. */
export function useElementWidth<T extends HTMLElement>(): readonly [
  (element: T | null) => void,
  number,
] {
  const [width, setWidth] = useState(0);
  const ref = useCallback((element: T | null) => {
    if (!element || typeof ResizeObserver === 'undefined') return;
    setWidth(element.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}
