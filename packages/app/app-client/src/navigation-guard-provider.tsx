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
  if (
    'index' in navigator &&
    typeof navigator.index === 'number' &&
    Number.isFinite(navigator.index)
  )
    return navigator.index;
  const state = window.history.state as { idx?: unknown } | null;
  return typeof state?.idx === 'number' && Number.isFinite(state.idx)
    ? state.idx
    : undefined;
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
  // Only entries observed in one continuous router history segment have comparable indexes.
  const [historyEntries] = useState(
    () => new Map([[incoming.location.key, historyIndex(navigator)]]),
  );
  const restoringRef = useRef(false);
  const approvedRef = useRef<{
    index: number | undefined;
    delta: number;
  } | null>(null);
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
        approvedRef.current = { index: historyIndex(navigator), delta: 1 };
        navigator.push(...args);
      },
      replace: (...args) => {
        if (!allows()) return;
        approvedRef.current = { index: historyIndex(navigator), delta: 0 };
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
      const index = historyIndex(navigator);
      const wasApproved = approvedRef.current;
      approvedRef.current = null;
      const tracked =
        index !== undefined &&
        historyEntries.get(incoming.location.key) === index;
      const contiguous =
        wasApproved !== null &&
        wasApproved.index !== undefined &&
        wasApproved.index === accepted.index &&
        index === wasApproved.index + wasApproved.delta;
      const accept = (): void => {
        if (!tracked && !contiguous) historyEntries.clear();
        historyEntries.set(incoming.location.key, index);
        restoringRef.current = false;
        setAccepted({ context: incoming, index });
      };
      if (
        incoming.location.key === accepted.context.location.key &&
        incoming.location.pathname === accepted.context.location.pathname &&
        incoming.location.search === accepted.context.location.search &&
        incoming.location.hash === accepted.context.location.hash
      ) {
        accept();
        return;
      }
      if (wasApproved || allows()) {
        accept();
        return;
      }
      if (
        !tracked ||
        accepted.index === undefined ||
        index === undefined ||
        index === accepted.index
      ) {
        // Native entries can restart router indexes. Unknown entries, including those predating this boundary,
        // cannot supply a physical traversal distance; replace the URL without waiting for another POP.
        historyEntries.clear();
        const location = accepted.context.location;
        const pathname =
          location.pathname === '/'
            ? navigation.basename
            : `${navigation.basename.replace(/\/$/, '')}${location.pathname}`;
        navigator.replace({ ...location, pathname }, location.state);
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
  }, [
    incoming,
    accepted,
    allows,
    navigator,
    navigation.basename,
    historyEntries,
  ]);

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
