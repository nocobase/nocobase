import { useNavigationGuard } from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import { ConfirmAction } from './shared.js';

/** Compatibility entry for prepared settings pages and application-owned consumers. */
export { useListData as useSettingsData } from '#hooks/use-list-data';

export function useUserPermission(action: string, id = '*') {
  return useCan({ resource: { type: 'user', id }, action }).can;
}
export function useRolePermission(action: string) {
  return useCan({
    resource: { type: 'settings', id: 'authorization.permission-sets' },
    action,
  }).can;
}
/** The same decision covers overlay close, sidebar links, browser history and refresh. */
export function useSettingsLeave(
  dirty: boolean,
  busy: boolean,
  onDiscard?: () => void,
) {
  const { t } = useTranslation();
  const location = useLocation();
  const allowedRef = useRef(false);
  useEffect(() => {
    allowedRef.current = false;
  }, [location.key]);
  const pendingRef = useRef<
    { promise: Promise<boolean>; resolve: (value: boolean) => void } | undefined
  >(undefined);
  const [open, setOpen] = useState(false);
  const guard = () => {
    if (allowedRef.current) return true;
    if (busy) return false;
    if (!dirty) return true;
    if (pendingRef.current) return pendingRef.current.promise;
    let resolve!: (value: boolean) => void;
    const promise = new Promise<boolean>((done) => {
      resolve = done;
    });
    pendingRef.current = { promise, resolve };
    setOpen(true);
    return promise;
  };
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
  const decide = (value: boolean) => {
    if (value) onDiscard?.();
    allowedRef.current = value;
    pendingRef.current?.resolve(value);
    pendingRef.current = undefined;
    setOpen(false);
  };
  return {
    guard,
    allow: () => {
      allowedRef.current = true;
    },
    dialog: (
      <ConfirmAction
        open={open}
        title={t('settings.discardTitle')}
        description={t('settings.discardHint')}
        busy={false}
        onCancel={() => decide(false)}
        onConfirm={() => decide(true)}
      />
    ),
  };
}
