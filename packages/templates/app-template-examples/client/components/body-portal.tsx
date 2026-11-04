import { useLayoutEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/** Detach body content when its page is hidden by Activity, retaining its React state for the next permission result. */
export function BodyPortal({ children }: { readonly children: ReactNode }) {
  const [container] = useState(() => {
    const element = document.createElement('div');
    element.style.display = 'contents';
    return element;
  });
  useLayoutEffect(() => {
    document.body.append(container);
    return () => container.remove();
  }, [container]);
  return createPortal(children, container);
}
