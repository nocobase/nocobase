import { useCallback, useState, useSyncExternalStore } from 'react';

/** Whether `query` matches, following changes; false where there is no `matchMedia` (tests). */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {};
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    () =>
      typeof window !== 'undefined' && !!window.matchMedia
        ? window.matchMedia(query).matches
        : false,
    () => false,
  );
}

/** Whether files are being dragged over the page, for the hints that only matter then. */
export function useDraggingFiles(): boolean {
  return useSyncExternalStore(
    subscribeDragging,
    () => dragging,
    () => false,
  );
}

let dragging = false;
const listeners = new Set<() => void>();
let depth = 0;

function setDragging(next: boolean): void {
  if (dragging === next) return;
  dragging = next;
  for (const listener of listeners) listener();
}

const carriesFiles = (event: DragEvent) =>
  Array.from(event.dataTransfer?.types ?? []).includes('Files');

const onEnter = (event: DragEvent) => {
  if (!carriesFiles(event)) return;
  depth += 1;
  setDragging(true);
};
const onLeave = (event: DragEvent) => {
  if (!carriesFiles(event)) return;
  depth = Math.max(0, depth - 1);
  if (depth === 0) setDragging(false);
};
const onEnd = () => {
  depth = 0;
  setDragging(false);
};

function subscribeDragging(listener: () => void): () => void {
  if (listeners.size === 0 && typeof document !== 'undefined') {
    document.addEventListener('dragenter', onEnter, true);
    document.addEventListener('dragleave', onLeave, true);
    document.addEventListener('drop', onEnd, true);
    document.addEventListener('dragend', onEnd, true);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && typeof document !== 'undefined') {
      document.removeEventListener('dragenter', onEnter, true);
      document.removeEventListener('dragleave', onLeave, true);
      document.removeEventListener('drop', onEnd, true);
      document.removeEventListener('dragend', onEnd, true);
      onEnd();
    }
  };
}

/** An element's width, following changes; 0 until measured (and where there is no `ResizeObserver`). */
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
