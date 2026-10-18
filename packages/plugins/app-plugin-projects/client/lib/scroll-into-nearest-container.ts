/**
 * Positions a task's comment, summary or selected row inside its nearest vertical content scroller.
 * Content must be inside an overflowing vertical auto/scroll container; otherwise returns false.
 * Unlike scrollIntoView, this never scrolls overflow:hidden layout ancestors or the document, and keeps the horizontal position.
 */
export function scrollIntoNearestContainer(
  element: HTMLElement,
  block: 'start' | 'center' | 'nearest',
  behavior: ScrollBehavior = 'auto',
): boolean {
  for (
    let container = element.parentElement;
    container &&
    container !== document.body &&
    container !== document.documentElement;
    container = container.parentElement
  ) {
    if (
      !/^(auto|scroll)$/u.test(getComputedStyle(container).overflowY) ||
      container.scrollHeight <= container.clientHeight
    )
      continue;
    const target = element.getBoundingClientRect();
    const frame = container.getBoundingClientRect();
    const start = frame.top + container.clientTop;
    const end = start + container.clientHeight;
    let delta = 0;
    if (block === 'start') delta = target.top - start;
    else if (block === 'center')
      delta = (target.top + target.bottom - start - end) / 2;
    else if (target.top < start && target.bottom > end) return true;
    else if (target.top < start) delta = target.top - start;
    else if (target.bottom > end) delta = target.bottom - end;
    container.scrollTo({ top: container.scrollTop + delta, behavior });
    return true;
  }
  return false;
}
