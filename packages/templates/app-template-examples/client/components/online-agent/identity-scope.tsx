import { useCallback, useLayoutEffect, useRef, type ReactNode } from 'react';

import { OnlineAgentIdentityContext } from './identity-context.js';

/** A notification can outlive its history row, but never its authenticated identity. */
export function OnlineAgentIdentityScope({
  children,
}: {
  readonly children: ReactNode;
}) {
  const activeRef = useRef(false);
  useLayoutEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
    };
  }, []);
  const isActive = useCallback(() => activeRef.current, []);
  return (
    <OnlineAgentIdentityContext value={isActive}>
      {children}
    </OnlineAgentIdentityContext>
  );
}
