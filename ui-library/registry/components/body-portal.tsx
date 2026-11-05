import {
  useLayoutEffect,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

export interface BodyPortalProps {
  readonly children: ReactNode;
}

/** Detach body content when its page is hidden by Activity, retaining its React state for the next permission result. */
export function BodyPortal({ children }: BodyPortalProps): ReactElement {
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
