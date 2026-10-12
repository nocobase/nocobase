/**
 * Keeps the floating chat button clear of what a page pins to the bottom of the screen, such as an issue's comment
 * composer or a form's sticky action bar. The button has a resting place (bottom right); when a sticky or fixed bar
 * lies under that place, the button rises to sit above the bar's top edge. Pages need not tell the button anything:
 * it looks at what is actually under its resting place whenever the layout may have changed.
 *
 * Bars that cover the button anyway are left alone: dialogs, sheets and toasts stack above it, and a bar taller than
 * half the screen is a panel rather than a bar.
 *
 * What is marked `data-floating-avoid`, such as an agent composer, is never covered, pinned or not: the button rises
 * above it too, and hides when it cannot (the composer is taller than half the screen, or runs off its top).
 */
import { useEffect, useState } from 'react';

/** The button's resting place, in CSS pixels: its size and its distance from the right and bottom edges. */
export const FLOATING_BUTTON = { size: 48, inset: 16 } as const;

/** What the button must never cover, wherever it sits. */
const AVOID_SELECTOR = '[data-floating-avoid]';

/** The stacking level of the button (`z-40`); anything stacked above it hides it rather than being hidden by it. */
const BUTTON_Z_INDEX = 40;

/** The nearest ancestor (or the element itself) that sticks to the screen, if any. */
function pinnedAncestor(element: Element, stop: Element): HTMLElement | null {
  for (
    let node: Element | null = element;
    node && node !== document.body && node !== document.documentElement;
    node = node.parentElement
  ) {
    if (node === stop || node.contains(stop)) return null;
    const style = getComputedStyle(node);
    if (style.position === 'sticky' || style.position === 'fixed')
      return node as HTMLElement;
  }
  return null;
}

function stacksAbove(element: HTMLElement): boolean {
  const zIndex = Number.parseInt(getComputedStyle(element).zIndex, 10);
  return Number.isFinite(zIndex) && zIndex > BUTTON_Z_INDEX;
}

/**
 * How far above its resting place the button must sit so that no pinned bar is under it: 0 when nothing is, null when
 * it must hide because something it may not cover cannot be cleared. `button` is the button itself, ignored when looking
 * at what lies under its resting place.
 */
export function measureFloatingClearance(
  button: Element | null,
): number | null {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const { size, inset } = FLOATING_BUTTON;
  const left = width - inset - size;
  const top = height - inset - size;
  // The corners and the centre of the resting place.
  const points: [number, number][] = [
    [left + 2, top + 2],
    [left + size - 2, top + 2],
    [left + 2, top + size - 2],
    [left + size - 2, top + size - 2],
    [left + size / 2, top + size / 2],
  ];
  let clearance = 0;
  const seen = new Set<HTMLElement>();
  for (const [x, y] of points) {
    for (const element of document.elementsFromPoint(x, y)) {
      if (button && (element === button || button.contains(element))) continue;
      const avoided = element.closest(AVOID_SELECTOR) !== null;
      const bar =
        pinnedAncestor(element, button ?? document.body) ??
        element.closest<HTMLElement>(AVOID_SELECTOR);
      if (!bar || seen.has(bar)) continue;
      seen.add(bar);
      if (stacksAbove(bar)) continue;
      const rect = bar.getBoundingClientRect();
      if (rect.height > height / 2 || rect.top <= 0) {
        if (avoided) return null;
        continue;
      }
      clearance = Math.max(clearance, Math.ceil(height - rect.top));
      // Raised that far, the button would leave the screen.
      if (avoided && clearance + inset + size > height) return null;
    }
  }
  return clearance;
}

/**
 * The button's distance from the bottom edge: its inset, raised above any pinned bar under its resting place; null
 * while it must hide (`measureFloatingClearance`). It is
 * measured again after anything that may move a bar: resizing, scrolling, focus moving (a composer growing as it is
 * focused) and the page changing.
 */
export function useFloatingButtonBottom(
  button: HTMLElement | null,
): number | null {
  const [clearance, setClearance] = useState<number | null>(0);
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() =>
        setClearance(measureFloatingClearance(button)),
      );
    };
    measure();
    const observer = new MutationObserver(measure);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden'],
    });
    const resize = new ResizeObserver(measure);
    resize.observe(document.documentElement);
    window.addEventListener('resize', measure);
    document.addEventListener('scroll', measure, true);
    document.addEventListener('focusin', measure);
    document.addEventListener('focusout', measure);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resize.disconnect();
      window.removeEventListener('resize', measure);
      document.removeEventListener('scroll', measure, true);
      document.removeEventListener('focusin', measure);
      document.removeEventListener('focusout', measure);
    };
  }, [button]);
  if (clearance === null) return null;
  return clearance > 0
    ? clearance + FLOATING_BUTTON.inset
    : FLOATING_BUTTON.inset;
}
