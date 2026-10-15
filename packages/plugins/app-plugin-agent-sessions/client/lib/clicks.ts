import type { MouseEvent } from 'react';

/** A click that means "open here": the main button without a modifier, which would ask for a new tab or window. */
export function plainClick(event: MouseEvent): boolean {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}
