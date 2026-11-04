import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
  type ReactElement,
} from 'react';

import { DEMO_MODE_NAMESPACE } from '../namespace.js';

/** Resolve the visitor's session before a protected route can redirect to its login page. */
export function DemoEntry({
  children,
  required,
}: PropsWithChildren<{ required: boolean }>): ReactElement {
  const api = useApiClient();
  const { t } = useTranslation(DEMO_MODE_NAMESPACE);
  const [ready, setReady] = useState(false);
  const pendingRef = useRef<Promise<boolean> | undefined>(undefined);

  useEffect(() => {
    if (!required) return;
    let active = true;
    pendingRef.current ??= api
      .request<{ data: { signedIn: boolean } }>({
        path: '/demoMode/accounts/signInDefault',
        method: 'POST',
      })
      .then(async ({ data }) => {
        if (!data.signedIn) return false;
        // A successful sign-in response does not prove the browser accepted its cookies. Reload only after the next
        // request recognizes the session; otherwise leave normal entry available instead of signing in forever.
        const session = await api.request<{ user?: unknown } | null>({
          path: '/auth/get-session',
        });
        return Boolean(session?.user);
      });
    pendingRef.current
      .then((signedIn) => {
        if (!active) return;
        if (signedIn) window.location.reload();
        else setReady(true);
      })
      .catch(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [api, required]);

  return ready || !required ? (
    <>{children}</>
  ) : (
    <p role='status' className='p-4 text-sm text-muted-foreground'>
      {t('accounts.entering')}
    </p>
  );
}
