/**
 * The nearest ancestor that scrolls vertically, which a virtualized list measures against (the covering detail page,
 * the drawer body, or the page itself). Null means the window scrolls.
 */
export function findScrollParent(
  element: HTMLElement | null,
): HTMLElement | null {
  let current = element?.parentElement ?? null;
  while (current && current !== document.body) {
    const { overflowY } = window.getComputedStyle(current);
    if (overflowY === 'auto' || overflowY === 'scroll') return current;
    current = current.parentElement;
  }
  return null;
}

/** Past this many rows a list renders only what is on screen. */
export const PM_VIRTUALIZE_AFTER: number = 100;
/** The issue list keeps a real table up to this many rows. */
export const PM_VIRTUALIZE_TABLE_AFTER: number = 200;
