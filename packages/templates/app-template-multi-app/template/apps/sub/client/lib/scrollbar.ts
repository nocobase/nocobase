// Every scrollbar in the application shows only while what it belongs to scrolls, or while the mouse is near the
// edge it runs along, so it can be found and grabbed (client/styles.css draws a bar under `[data-scrolling]` alone).
// One listener on the document, in the capture phase since a scroll does not bubble, marks the element that scrolls,
// or the page's root for the page itself, until it has been still for a moment; a second marks the scroller the mouse
// is within EDGE_PX of the right or bottom edge of, at most once a frame. Installed once, as the client starts
// (client/index.tsx).
const STILL_MS = 800;
const EDGE_PX = 16;
const timers = new WeakMap<Element, number>();

function reveal(element: HTMLElement): void {
  element.dataset.scrolling = '';
  window.clearTimeout(timers.get(element));
  timers.set(
    element,
    window.setTimeout(() => {
      delete element.dataset.scrolling;
    }, STILL_MS),
  );
}

function scrolls(element: Element, axis: 'x' | 'y'): boolean {
  const overflow =
    getComputedStyle(element)[axis === 'y' ? 'overflowY' : 'overflowX'];
  if (overflow !== 'auto' && overflow !== 'scroll') return false;
  return axis === 'y'
    ? element.scrollHeight > element.clientHeight
    : element.scrollWidth > element.clientWidth;
}

/** The scroller whose right or bottom edge the point is near: the nearest such ancestor of the target, or the page. */
function scrollerAtEdge(
  target: Element | null,
  x: number,
  y: number,
): HTMLElement | undefined {
  for (
    let element = target;
    element && element !== document.body;
    element = element.parentElement
  ) {
    if (element === document.documentElement) break;
    const box = element.getBoundingClientRect();
    if (scrolls(element, 'y') && x >= box.right - EDGE_PX && x <= box.right)
      return element as HTMLElement;
    if (scrolls(element, 'x') && y >= box.bottom - EDGE_PX && y <= box.bottom)
      return element as HTMLElement;
  }
  const page = (document.scrollingElement ??
    document.documentElement) as HTMLElement;
  if (page.scrollHeight > page.clientHeight && x >= window.innerWidth - EDGE_PX)
    return page;
  if (page.scrollWidth > page.clientWidth && y >= window.innerHeight - EDGE_PX)
    return page;
  return undefined;
}

export function revealScrollbarsWhileScrolling(): void {
  document.addEventListener(
    'scroll',
    (event) => {
      const element =
        event.target instanceof Element
          ? event.target
          : (document.scrollingElement ?? document.documentElement);
      if (element instanceof HTMLElement) reveal(element);
    },
    { capture: true, passive: true },
  );
  let frame = 0;
  document.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType !== 'mouse' || frame) return;
      const { clientX, clientY, target } = event;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const element = scrollerAtEdge(
          target instanceof Element ? target : null,
          clientX,
          clientY,
        );
        if (element) reveal(element);
      });
    },
    { passive: true },
  );
}
