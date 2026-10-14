/**
 * Whether an element has scrolled out of view, past the top of the area it scrolls in, so a summary that scrolls with
 * the page can be followed by its pinned one-line bar. Without `IntersectionObserver` it never is.
 */
import { useEffect, useState, type RefObject } from 'react';

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

export function useOutOfView(ref: RefObject<HTMLElement | null>): boolean {
  const [out, setOut] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;
    const root = scrollParentOf(element);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        // Only above the visible area: below it the summary is still to come.
        setOut(
          !entry.isIntersecting &&
            entry.boundingClientRect.bottom <= (entry.rootBounds?.top ?? 0) + 1,
        );
      },
      { root },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return out;
}
