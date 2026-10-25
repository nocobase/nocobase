import { useApiClient } from '@nocobase/app-client';
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
  const root = useHref('/');
  const { search, hash } = useLocation();
  const { t } = useTranslation(DEMO_MODE_NAMESPACE);
  const [ready, setReady] = useState(false);
  const pendingRef = useRef<
    Promise<{ data: { signedIn: boolean } }> | undefined
  >(undefined);

  useEffect(() => {
    let active = true;
    pendingRef.current ??= api.request<{ data: { signedIn: boolean } }>({
      path: '/demoMode/accounts/signInDefault',
      method: 'POST',
    });
    pendingRef.current
      .then(({ data }) => {
        if (!active) return;
        if (data.signedIn) window.location.replace(`${root}${search}${hash}`);
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
    <p role='status' className='p-4 text-sm text-muted-foreground'>
      {t('accounts.entering')}
    </p>
  );
}
