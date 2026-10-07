/**
 * The "discard unsaved changes?" question a dialog asks before it closes while a form inside holds input that has not
 * been submitted. This is the state only: a plugin renders the question itself with its own UI, as a boundary that
 * provides `UnsavedChangesContext` with the guard's `scope` and shows a confirmation while `asking`, answering through
 * `answer`. Forms inside report themselves with `useUnsavedChanges`, and the dialog closes through `confirmDiscard`
 * (from a route dialog's `beforeClose`) or `useGuardedClose` (for a dialog held in component state).
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Context,
} from 'react';

export interface UnsavedChangesScope {
  /** Marks `source` as holding input that has not been submitted, or clears it. */
  readonly track: (source: object, dirty: boolean) => void;
}

/** Provided by a dialog's boundary with the guard's `scope`; forms reach it through `useUnsavedChanges`. */
export const UnsavedChangesContext: Context<UnsavedChangesScope | null> =
  createContext<UnsavedChangesScope | null>(null);

export interface UnsavedChangesGuard {
  readonly scope: UnsavedChangesScope;
  /**
   * Resolves `true` when closing may go ahead: no form inside the boundary holds unsubmitted input, or the member chose
   * to discard it. Return it from `beforeClose` of a `RouteDialog` / `RouteDrawer`, or await it before closing a dialog
   * held in component state.
   */
  readonly confirmDiscard: () => Promise<boolean>;
  readonly asking: boolean;
  readonly answer: (discard: boolean) => void;
}

/**
 * The "Discard unsaved changes?" confirmation of one dialog. Render the plugin's boundary with it inside the dialog; each
 * form in the boundary reports its state with `useUnsavedChanges`. A dialog that holds its form state itself passes
 * `dirty` here instead.
 */
export function useUnsavedChangesGuard(dirty = false): UnsavedChangesGuard {
  const sourcesRef = useRef(new Set<object>());
  const dirtyRef = useRef(dirty);
  useLayoutEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);
  const resolveRef = useRef<((discard: boolean) => void) | null>(null);
  const [asking, setAsking] = useState(false);

  const answer = useCallback((discard: boolean): void => {
    const resolve = resolveRef.current;
    resolveRef.current = null;
    setAsking(false);
    resolve?.(discard);
  }, []);
  const scope = useMemo<UnsavedChangesScope>(
    () => ({
      track: (source, dirty) => {
        if (dirty) {
          sourcesRef.current.add(source);
          return;
        }
        sourcesRef.current.delete(source);
        // A submit that finished (or a form that went away) while asking leaves nothing to discard: let the close
        // the member asked for go ahead.
        if (
          resolveRef.current &&
          sourcesRef.current.size === 0 &&
          !dirtyRef.current
        ) {
          answer(true);
        }
      },
    }),
    [answer],
  );
  const confirmDiscard = useCallback((): Promise<boolean> => {
    if (sourcesRef.current.size === 0 && !dirtyRef.current) {
      return Promise.resolve(true);
    }
    resolveRef.current?.(false);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setAsking(true);
    });
  }, []);
  // A dialog that goes away while asking discards nothing.
  useEffect(() => () => resolveRef.current?.(false), []);

  return { scope, confirmDiscard, asking, answer };
}

/**
 * Tells the enclosing boundary that the form holds input that has not been submitted while `dirty` is
 * true. Call the returned `markSaved` after a successful submit and before closing, so that close does not ask; the form
 * counts as unsaved again the next time `dirty` turns true. Outside a boundary it does nothing.
 */
export function useUnsavedChanges(dirty: boolean): () => void {
  const scope = useContext(UnsavedChangesContext);
  const sourceRef = useRef<object | null>(null);
  useLayoutEffect(() => {
    if (!scope || !dirty) return;
    const source = {};
    sourceRef.current = source;
    scope.track(source, true);
    return () => {
      scope.track(source, false);
      sourceRef.current = null;
    };
  }, [scope, dirty]);
  return useCallback(() => {
    if (sourceRef.current) scope?.track(sourceRef.current, false);
  }, [scope]);
}

/**
 * `onClose` behind the guard's confirmation, for a dialog held in component state: use it for Escape, the backdrop and
 * Cancel, and call `onClose` itself after a successful submit.
 */
export function useGuardedClose(
  guard: UnsavedChangesGuard,
  onClose: () => void,
): () => void {
  const { confirmDiscard } = guard;
  return useCallback(() => {
    void confirmDiscard().then((discard) => {
      if (discard) onClose();
    });
  }, [confirmDiscard, onClose]);
}
