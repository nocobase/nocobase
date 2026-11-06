/**
 * Keeps an element above a phone's soft keyboard. Mobile keyboards often shrink only the visual viewport and leave
 * the layout's height as it was, so a composer at the bottom of a full-height view would sit under the keyboard. On a
 * phone (below 768px, not zoomed) the element is cut to end where the visible area ends; elsewhere it keeps the height
 * its layout gives it.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

export function useKeyboardFit(): (element: HTMLElement | null) => void {
  const elementRef = useRef<HTMLElement | null>(null);
  const [attached, setAttached] = useState(0);
  useEffect(() => {
    const viewport = window.visualViewport;
    const element = elementRef.current;
    if (!element || !viewport) return;
    const { style } = element;
    const fit = (): void => {
      style.height =
        window.matchMedia('(max-width: 767px)').matches &&
        viewport.scale === 1 &&
        viewport.height < window.innerHeight
          ? `${Math.max(0, viewport.offsetTop + viewport.height - element.getBoundingClientRect().top)}px`
          : '';
    };
    fit();
    viewport.addEventListener('resize', fit);
    viewport.addEventListener('scroll', fit);
    return () => {
      viewport.removeEventListener('resize', fit);
      viewport.removeEventListener('scroll', fit);
      style.height = '';
    };
  }, [attached]);
  return useCallback((next: HTMLElement | null) => {
    if (elementRef.current === next) return;
    elementRef.current = next;
    setAttached((count) => count + 1);
  }, []);
}
