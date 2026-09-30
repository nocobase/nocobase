import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useBeforeUnload } from 'react-router';

export interface LeaveGuardOptions {
  /** Leaving would discard edits; explicit leaves ask first and unloading the page warns. */
  readonly dirty: boolean;
  /** A write whose result is unknown; explicit leaves are refused without asking. */
  readonly pending?: boolean;
}

export interface LeaveGuard {
  /** True while the discard confirmation is open. */
  readonly confirming: boolean;
  /** Asks before an explicit leave, such as closing an editor, and resolves whether it may proceed. */
  readonly confirmLeave: () => Promise<boolean>;
  readonly confirm: () => void;
  readonly cancel: () => void;
  /** Stops guarding until the next render, for a navigation that follows a successful save. */
  readonly release: () => void;
}

/**
 * Guards unsaved edits against explicit leaves and page unload. It needs no data router, so it works under the host's
 * `BrowserRouter`. Browser back and forward are handled by `useHistoryGuard` in a component that stays mounted.
 */
export function useLeaveGuard({
  dirty,
  pending = false,
}: LeaveGuardOptions): LeaveGuard {
  const stateRef = useRef({ dirty, pending });
  useLayoutEffect(() => {
    stateRef.current = { dirty, pending };
  }, [dirty, pending]);
  const [confirming, setConfirming] = useState(false);
  const resolveRef = useRef<((allowed: boolean) => void) | null>(null);

  const settle = useCallback((allowed: boolean): void => {
    const resolve = resolveRef.current;
    resolveRef.current = null;
    setConfirming(false);
    resolve?.(allowed);
  }, []);

  const confirmLeave = useCallback((): Promise<boolean> => {
    const current = stateRef.current;
    if (current.pending) return Promise.resolve(false);
    if (!current.dirty) return Promise.resolve(true);
    // One confirmation serves every request made while it is open.
    resolveRef.current?.(false);
    setConfirming(true);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  useEffect(() => () => resolveRef.current?.(false), []);

  useBeforeUnload(
    useCallback((event: BeforeUnloadEvent) => {
      const current = stateRef.current;
      if (!current.dirty && !current.pending) return;
      event.preventDefault();
      event.returnValue = '';
    }, []),
  );

  return {
    confirming,
    confirmLeave,
    confirm: useCallback(() => settle(true), [settle]),
    cancel: useCallback(() => settle(false), [settle]),
    release: useCallback(() => {
      stateRef.current = { dirty: false, pending: false };
    }, []),
  };
}
