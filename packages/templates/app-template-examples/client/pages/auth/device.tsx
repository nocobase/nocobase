import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router';

import { DeviceApproval } from '@/extensions/nocobase-device-approval/device-approval';

import { AuthPage } from './shared.js';

/**
 * `/device?user_code=…`: where a command line's sign-in (Better Auth's device authorization, `deviceAuthorization()` in
 * `server/config/auth.ts`) sends the person to approve it. The route is `auth: 'optional'`, so it renders outside the
 * application's shell, like the sign-in pages; a person who is not signed in goes to the sign-in page, which brings
 * them back here with the code.
 */
export default function DevicePage(): ReactElement | null {
  const { t } = useTranslation();
  const { isPending, session } = useAuthentication();
  const { pathname, search } = useLocation();
  const [params, setParams] = useSearchParams();

  if (isPending) return null;
  if (!session)
    return (
      <Navigate
        replace
        to={`/login?redirect=${encodeURIComponent(`${pathname}${search}`)}`}
      />
    );
  return (
    <AuthPage
      description={t('deviceApproval.description')}
      title={t('deviceApproval.title')}
    >
      <DeviceApproval
        onUserCodeChange={(code) => setParams(code ? { user_code: code } : {})}
        userCode={params.get('user_code')}
      />
    </AuthPage>
  );
}
