import { useLayoutEffect, useRef, type RefObject } from 'react';
import { chatNearBottom } from './feedback.js';

/** Follow layout growth, including Markdown and same-message deltas, without moving a reader up-thread. */
export function useChatScroll(
  firstSeq: number | undefined,
): RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement>(null);
  const followingRef = useRef(true);
  const previousRef = useRef({ firstSeq, height: 0 });
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const before = previousRef.current;
    if (
      firstSeq !== undefined &&
      before.firstSeq !== undefined &&
      firstSeq < before.firstSeq
    ) {
      element.scrollTop += element.scrollHeight - before.height;
      followingRef.current = false;
    } else if (followingRef.current) element.scrollTop = element.scrollHeight;
    previousRef.current = { firstSeq, height: element.scrollHeight };
  });
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const onScroll = () => {
      followingRef.current = chatNearBottom(element);
    };
    element.addEventListener('scroll', onScroll, { passive: true });
    const observer =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(() => {
            if (followingRef.current) element.scrollTop = element.scrollHeight;
            previousRef.current.height = element.scrollHeight;
          });
    if (element.firstElementChild) observer?.observe(element.firstElementChild);
    return () => {
      element.removeEventListener('scroll', onScroll);
      observer?.disconnect();
    };
  }, []);
  return ref;
}
