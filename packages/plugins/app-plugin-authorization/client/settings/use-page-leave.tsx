import { useNavigationGuard, useUnsavedChanges } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
} from 'react';
import { useLocation } from 'react-router';

import { ConfirmAction } from './shared.js';

/**
 * Asks "Discard changes?" before the person leaves a form with unsaved changes: a link, the browser's back button, or
 * reloading and closing the tab. A save calls `allow()` before navigating away, so leaving after it does not ask. An
 * enclosing dialog that asks its own question is told through `useUnsavedChanges`.
 */
export function usePageLeave(
  dirty: boolean,
  busy: boolean,
  onDiscard?: () => void,
): {
  readonly guard: () => boolean | Promise<boolean>;
  readonly allow: () => void;
  readonly dialog: ReactElement | null;
} {
  const { t } = useTranslation();
  const location = useLocation();
  const [asking, setAsking] = useState(false);
  const stateRef = useRef({ dirty, busy, onDiscard, allowed: false });
  const pendingRef = useRef<((value: boolean) => void) | undefined>(undefined);
  const markSaved = useUnsavedChanges(dirty);
  useLayoutEffect(() => {
    stateRef.current.dirty = dirty;
    stateRef.current.busy = busy;
    stateRef.current.onDiscard = onDiscard;
  }, [dirty, busy, onDiscard]);
  // A new address is a new visit: leaving it asks again.
  useLayoutEffect(() => {
    stateRef.current.allowed = false;
  }, [location.key]);

  const decide = useCallback((value: boolean) => {
    if (value) {
      stateRef.current.onDiscard?.();
      stateRef.current.allowed = true;
    }
    pendingRef.current?.(value);
    pendingRef.current = undefined;
    setAsking(false);
  }, []);
  useEffect(() => () => pendingRef.current?.(false), []);

  const guard = useCallback((): boolean | Promise<boolean> => {
    const current = stateRef.current;
    if (current.allowed) return true;
    if (current.busy) return false;
    if (!current.dirty) return true;
    pendingRef.current?.(false);
    setAsking(true);
    return new Promise<boolean>((resolve) => {
      pendingRef.current = resolve;
    });
  }, []);
  useNavigationGuard(guard);

  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const allow = useCallback(() => {
    stateRef.current.allowed = true;
    markSaved();
  }, [markSaved]);

  return {
    guard,
    allow,
    dialog: asking ? (
      <ConfirmAction
        open
        title={t('settings.discardTitle')}
        description={t('settings.discardHint')}
        busy={false}
        onCancel={() => decide(false)}
        onConfirm={() => decide(true)}
      />
    ) : null,
  };
}
