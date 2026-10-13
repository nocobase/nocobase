/**
 * Whether the page around an element has been scrolled down, for a pinned summary that folds to a bar while the feed is
 * read. `epoch` grows each time it starts being scrolled again, so a choice the viewer made applies until then.
 */
import { useEffect, useState, type RefObject } from 'react';

/** Past this many pixels the page counts as scrolled; back above `RESET` it does not. */
const COMPACT_AT = 96;
const RESET = 8;
/** A page with less to scroll than this keeps the summary as it is, so folding it cannot bounce the page back. */
const ROOM = 480;

export interface ScrollCompact {
  readonly scrolled: boolean;
  readonly epoch: number;
}

/** The nearest ancestor that scrolls vertically; null means the window scrolls. */
function scrollParentOf(element: HTMLElement | null): HTMLElement | null {
  let current = element?.parentElement ?? null;
  while (current && current !== document.body) {
    const { overflowY } = window.getComputedStyle(current);
    if (overflowY === 'auto' || overflowY === 'scroll') return current;
    current = current.parentElement;
  }
  return null;
}

export function useScrollCompact(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
): ScrollCompact {
  const [state, setState] = useState<ScrollCompact>({
    scrolled: false,
    epoch: 0,
  });
  useEffect(() => {
    if (!enabled) return;
    const parent = scrollParentOf(ref.current);
    const target: HTMLElement | Window = parent ?? window;
    const read = (): void => {
      const top = parent ? parent.scrollTop : window.scrollY;
      const room = parent
        ? parent.scrollHeight - parent.clientHeight
        : document.documentElement.scrollHeight - window.innerHeight;
      setState((current) => {
        if (!current.scrolled && top > COMPACT_AT && room > ROOM)
          return { scrolled: true, epoch: current.epoch + 1 };
        if (current.scrolled && top < RESET)
          return { scrolled: false, epoch: current.epoch };
        return current;
      });
    };
    target.addEventListener('scroll', read, { passive: true });
    return () => target.removeEventListener('scroll', read);
  }, [ref, enabled]);
  return state;
}
