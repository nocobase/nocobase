import { Loading, useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
  type ReactElement,
} from 'react';
import { useHref, useLocation } from 'react-router';

import { DEMO_MODE_NAMESPACE } from '../namespace.js';

/** Resolve the visitor's session before the application's home route can redirect to its login page. */
export function DemoHomeEntry({ children }: PropsWithChildren): ReactElement {
  const api = useApiClient();
  const { t } = useTranslation(DEMO_MODE_NAMESPACE);
  const root = useHref('/');
  const { search, hash } = useLocation();
  const [ready, setReady] = useState(false);
  const pendingRef = useRef<Promise<boolean> | undefined>(undefined);

  useEffect(() => {
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
        if (signedIn) window.location.replace(`${root}${search}${hash}`);
        else setReady(true);
      })
      .catch(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [api, root, search, hash]);

  return ready ? (
    <>{children}</>
  ) : (
    <Loading fullscreen label={t('status.loading')} />
  );
}
