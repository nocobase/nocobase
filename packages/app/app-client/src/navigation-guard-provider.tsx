import {
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  UNSAFE_LocationContext,
  UNSAFE_NavigationContext,
  type Navigator,
} from 'react-router';

import {
  NavigationGuardContext,
  type NavigationGuard,
} from './navigation-guard.js';

function historyIndex(navigator: Navigator): number | undefined {
  if ('index' in navigator && typeof navigator.index === 'number')
    return navigator.index;
  const state = window.history.state as { idx?: unknown } | null;
  return typeof state?.idx === 'number' ? state.idx : undefined;
}

/**
 * A stable boundary below the host router and above its routes. Browser POP has already reached the router here;
 * keep publishing the accepted location until guards allow the new one, so a declined traversal cannot unmount
 * an editor. The navigator is scoped to descendants, never patched on the shared router object.
 */
export function NavigationGuardProvider({
  children,
}: {
  readonly children?: ReactNode;
}): ReactElement {
  const incoming = useContext(UNSAFE_LocationContext);
  const navigation = useContext(UNSAFE_NavigationContext);
  const { navigator } = navigation;
  const [guards] = useState(() => new Set<NavigationGuard>());
  const [accepted, setAccepted] = useState(() => ({
    context: incoming,
    index: historyIndex(navigator),
  }));
  const restoringRef = useRef(false);
  const approvedRef = useRef(false);
  const allows = useCallback(
    (): boolean =>
      !restoringRef.current && [...guards].every((guard) => guard()),
    [guards],
  );
  const guardedNavigator = useMemo<Navigator>(
    () => ({
      ...navigator,
      push: (...args) => {
        if (!allows()) return;
        approvedRef.current = true;
        navigator.push(...args);
      },
      replace: (...args) => {
        if (!allows()) return;
        approvedRef.current = true;
        navigator.replace(...args);
      },
    }),
    [allows, navigator],
  );
  const scopedNavigation = useMemo(
    () => ({ ...navigation, navigator: guardedNavigator }),
    [navigation, guardedNavigator],
  );

  useLayoutEffect(() => {
    let active = true;
    let timer: number | undefined;
    // Resolve after commit: a memory navigator can notify synchronously, and confirmations must not run in render.
    queueMicrotask(() => {
      if (!active) return;
      if (incoming === accepted.context) return;
      if (
        incoming.location.key === accepted.context.location.key &&
        incoming.location.pathname === accepted.context.location.pathname &&
        incoming.location.search === accepted.context.location.search &&
        incoming.location.hash === accepted.context.location.hash
      ) {
        restoringRef.current = false;
        setAccepted({ context: incoming, index: historyIndex(navigator) });
        return;
      }
      const wasApproved = approvedRef.current;
      approvedRef.current = false;
      if (wasApproved || allows()) {
        restoringRef.current = false;
        setAccepted({ context: incoming, index: historyIndex(navigator) });
        return;
      }
      const index = historyIndex(navigator);
      if (accepted.index === undefined || index === undefined) {
        // Entries outside the router have no reversible delta. Preserve the editor and replace the current URL.
        approvedRef.current = true;
        navigator.replace(
          accepted.context.location,
          accepted.context.location.state,
        );
        return;
      }
      restoringRef.current = true;
      const targetIndex = accepted.index;
      // Recompute from the latest entry, including POPs arriving while an earlier restoration is in flight.
      timer = window.setTimeout(() => {
        const current = historyIndex(navigator);
        if (current !== undefined && current !== targetIndex)
          navigator.go(targetIndex - current);
      }, 0);
    });
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [incoming, accepted, allows, navigator]);

  // PUSH/REPLACE were checked synchronously above; other changes are held until the layout effect decides.
  return (
    <NavigationGuardContext.Provider value={guards}>
      <UNSAFE_NavigationContext.Provider value={scopedNavigation}>
        <UNSAFE_LocationContext.Provider value={accepted.context}>
          {children}
        </UNSAFE_LocationContext.Provider>
      </UNSAFE_NavigationContext.Provider>
    </NavigationGuardContext.Provider>
  );
}
