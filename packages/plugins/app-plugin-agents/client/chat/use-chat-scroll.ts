import { useLayoutEffect, useRef, type RefObject } from 'react';
import { chatNearBottom } from './feedback.js';

type ScrollAnchor = { node: Element; offset: number };
function visibleAnchor(element: HTMLElement): ScrollAnchor | undefined {
  const viewport = element.getBoundingClientRect();
  for (const node of element.querySelector('ol')?.children ?? []) {
    const bounds = node.getBoundingClientRect();
    if (bounds.bottom > viewport.top && bounds.top < viewport.bottom)
      return { node, offset: bounds.top - viewport.top };
  }
  return undefined;
}

/** Follow layout growth, including Markdown and same-message deltas, without moving a reader up-thread. */
export function useChatScroll(
  firstSeq: number | undefined,
): RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement>(null);
  const followingRef = useRef(true);
  const previousRef = useRef({
    firstSeq,
    height: 0,
    anchor: undefined as ScrollAnchor | undefined,
  });
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const before = previousRef.current;
    if (
      firstSeq !== undefined &&
      before.firstSeq !== undefined &&
      firstSeq < before.firstSeq
    ) {
      // The same visible row separates prepended height from simultaneous output below it.
      // Its offset also accounts for browsers that have already applied native scroll anchoring.
      const anchor = before.anchor;
      element.scrollTop += anchor?.node.isConnected
        ? anchor.node.getBoundingClientRect().top -
          element.getBoundingClientRect().top -
          anchor.offset
        : element.scrollHeight - before.height;
      followingRef.current = false;
    } else if (followingRef.current) element.scrollTop = element.scrollHeight;
    previousRef.current = {
      firstSeq,
      height: element.scrollHeight,
      anchor: visibleAnchor(element),
    };
  });
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const onScroll = () => {
      followingRef.current = chatNearBottom(element);
      previousRef.current.anchor = visibleAnchor(element);
    };
    element.addEventListener('scroll', onScroll, { passive: true });
    const observer =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(() => {
            if (followingRef.current) element.scrollTop = element.scrollHeight;
            previousRef.current.height = element.scrollHeight;
            previousRef.current.anchor = visibleAnchor(element);
          });
    if (element.firstElementChild) observer?.observe(element.firstElementChild);
    return () => {
      element.removeEventListener('scroll', onScroll);
      observer?.disconnect();
    };
  }, []);
  return ref;
}
