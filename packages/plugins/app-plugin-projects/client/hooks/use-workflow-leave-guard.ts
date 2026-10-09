import { useCallback, useContext, useLayoutEffect, useRef } from 'react';
import { UNSAFE_NavigationContext, type Navigator } from 'react-router';

function historyIndex(): number | undefined {
  const state = window.history.state as { idx?: unknown } | null;
  return typeof state?.idx === 'number' ? state.idx : undefined;
}

/**
 * The host uses BrowserRouter, which has no data-router blocker. Guard its navigator and browser traversals before
 * they unmount the editor. The Navigation API can cancel a traversal before popstate; older environments undo a
 * declined popstate without notifying the router. A native confirmation keeps the decision synchronous.
 */
export function useWorkflowLeaveGuard(
  dirty: boolean,
  pending: boolean,
  message: string,
): () => void {
  const { navigator } = useContext(UNSAFE_NavigationContext);
  const stateRef = useRef({ dirty, pending, message });
  useLayoutEffect(() => {
    stateRef.current = { dirty, pending, message };
  }, [dirty, pending, message]);

  useLayoutEffect(
    () => installGuard(navigator, () => stateRef.current),
    [navigator],
  );

  return useCallback(() => {
    stateRef.current = { ...stateRef.current, dirty: false, pending: false };
  }, []);
}

/** Imperative adapter around React Router's mutable history object; always restores the original methods on cleanup. */
function installGuard(
  navigator: Navigator,
  readState: () => { dirty: boolean; pending: boolean; message: string },
): () => void {
  // Retain the original identities for cleanup; invoke them with their original receiver below.
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const push = navigator.push;
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const replace = navigator.replace;
  const go = navigator.go;
  let index = historyIndex();
  let restoring = false;
  let approvedTraversal = false;
  const allows = (): boolean => {
    const state = readState();
    if (restoring || state.pending) return false;
    return !state.dirty || window.confirm(state.message);
  };
  const guardedPush: typeof push = (...args) => {
    if (allows()) {
      push.apply(navigator, args);
      index = historyIndex();
    }
  };
  const guardedReplace: typeof replace = (...args) => {
    if (allows()) replace.apply(navigator, args);
  };
  // MemoryRouter traversals are synchronous and emit no popstate. BrowserRouter's go is guarded by popstate below.
  const guardedGo: typeof go = (delta) => {
    if (allows()) go.call(navigator, delta);
  };
  navigator.push = guardedPush;
  navigator.replace = guardedReplace;
  const memory = 'index' in navigator;
  if (memory) navigator.go = guardedGo;

  const onPopState = (event: PopStateEvent): void => {
    const next = historyIndex();
    if (approvedTraversal) {
      approvedTraversal = false;
      index = next;
      return;
    }
    if (restoring) {
      event.stopImmediatePropagation();
      if (next === index) restoring = false;
      return;
    }
    if (
      index !== undefined &&
      next !== undefined &&
      next !== index &&
      !allows()
    ) {
      event.stopImmediatePropagation();
      restoring = true;
      window.history.go(index - next);
      return;
    }
    index = next;
  };
  // Unlike popstate, this runs before an existing router listener can synchronously unmount a returning editor.
  const onNavigate = (event: NavigateEvent): void => {
    if (
      event.navigationType !== 'traverse' ||
      !event.destination.sameDocument ||
      !event.cancelable
    )
      return;
    approvedTraversal = allows();
    if (!approvedTraversal) event.preventDefault();
  };
  const onBeforeUnload = (event: BeforeUnloadEvent): void => {
    const state = readState();
    if (!state.dirty && !state.pending) return;
    event.preventDefault();
    event.returnValue = '';
  };
  window.addEventListener('popstate', onPopState, true);
  window.addEventListener('beforeunload', onBeforeUnload);
  const navigation = window.navigation;
  navigation?.addEventListener('navigate', onNavigate);
  return () => {
    if (navigator.push === guardedPush) navigator.push = push;
    if (navigator.replace === guardedReplace) navigator.replace = replace;
    if (memory && navigator.go === guardedGo) navigator.go = go;
    window.removeEventListener('popstate', onPopState, true);
    window.removeEventListener('beforeunload', onBeforeUnload);
    navigation?.removeEventListener('navigate', onNavigate);
  };
}
