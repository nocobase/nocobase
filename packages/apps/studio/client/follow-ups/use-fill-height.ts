/**
 * The height that lets an element fill what is left of the area the page scrolls in, from its top to that area's
 * bottom less `gap`: My follow-ups' three columns on a wide screen, each scrolling on its own within it. The page
 * scrolls inside the shell below its header, so the window's height (`100dvh`) would overshoot. Null while `enabled`
 * is false or before it is measured. Returns the ref callback to put on the element.
 */
import { useCallback, useState } from 'react';

/** The nearest ancestor that scrolls vertically; null means the window scrolls. */
function scrollParentOf(element: HTMLElement): HTMLElement | null {
  let current = element.parentElement;
  while (current && current !== document.body) {
    const { overflowY } = window.getComputedStyle(current);
    if (overflowY === 'auto' || overflowY === 'scroll') return current;
    current = current.parentElement;
  }
  return null;
}

/** Never shorter than this, so a short window still shows a few rows. */
const MIN_HEIGHT = 320;

export function useFillHeight(
  enabled: boolean,
  gap: number,
): readonly [
  number | null,
  (element: HTMLElement | null) => (() => void) | void,
] {
  const [height, setHeight] = useState<number | null>(null);
  const ref = useCallback(
    (element: HTMLElement | null) => {
      if (!element || !enabled) return;
      const scroller = scrollParentOf(element);
      const measure = (): void => {
        const areaTop = scroller ? scroller.getBoundingClientRect().top : 0;
        const areaHeight = scroller
          ? scroller.clientHeight
          : window.innerHeight;
        const offset =
          element.getBoundingClientRect().top -
          areaTop +
          (scroller ? scroller.scrollTop : window.scrollY);
        setHeight(Math.max(MIN_HEIGHT, Math.floor(areaHeight - offset - gap)));
      };
      measure();
      const observer =
        typeof ResizeObserver === 'undefined'
          ? null
          : new ResizeObserver(measure);
      if (scroller) observer?.observe(scroller);
      window.addEventListener('resize', measure);
      return () => {
        observer?.disconnect();
        window.removeEventListener('resize', measure);
      };
    },
    [enabled, gap],
  );
  return [enabled ? height : null, ref] as const;
}
