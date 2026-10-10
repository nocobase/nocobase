import { useNavigationGuard } from '@nocobase/app-client';
import { useCallback, useLayoutEffect, useRef } from 'react';

/** Reports the editor's leave decision to the host; only dirty or pending editors subscribe to page unload. */
export function useWorkflowLeaveGuard(
  dirty: boolean,
  pending: boolean,
  message: string,
): () => void {
  const stateRef = useRef({ dirty, pending, message });
  useLayoutEffect(() => {
    stateRef.current = { dirty, pending, message };
  }, [dirty, pending, message]);
  useNavigationGuard(() => {
    const state = stateRef.current;
    return !state.pending && (!state.dirty || window.confirm(state.message));
  });
  const active = dirty || pending;
  useLayoutEffect(() => {
    if (!active) return;
    const onBeforeUnload = (event: BeforeUnloadEvent): void => {
      const state = stateRef.current;
      if (!state.dirty && !state.pending) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [active]);
  return useCallback(() => {
    stateRef.current = { ...stateRef.current, dirty: false, pending: false };
  }, []);
}
