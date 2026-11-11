import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  Fragment,
  useState,
  type PropsWithChildren,
  type ReactElement,
} from 'react';

import { Loading } from '#components/loading';
import { Button } from '#components/ui/button';

/** The first identity handshake must invalidate permissions before pages mount. */
export function SessionPreparation({
  children,
}: PropsWithChildren): ReactElement {
  const { preparation, retryPreparation, client, refresh, session } =
    useAuthentication();
  const { t } = useTranslation();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutFailed, setSignOutFailed] = useState(false);

  // List memory and ancestor queries belong to one signed-in identity only.
  if (preparation === 'ready')
    return <Fragment key={session?.user.id}>{children}</Fragment>;
  if (preparation === 'preparing') {
    return <Loading className='min-h-svh' label={t('auth.preparingSession')} />;
  }

  return (
    <section className='grid min-h-svh place-items-center px-6'>
      <div className='w-full max-w-lg space-y-4 text-center'>
        <h1 className='text-xl font-semibold'>{t('auth.connectionFailed')}</h1>
        <p className='text-sm text-muted-foreground'>
          {t('auth.connectionFailedDescription')}
        </p>
        {signOutFailed ? (
          <p role='alert'>{t('account.signOutFailed')}</p>
        ) : null}
        <div className='flex justify-center gap-3'>
          <Button disabled={signingOut} onClick={retryPreparation}>
            {t('auth.retry')}
          </Button>
          <Button
            variant='outline'
            disabled={signingOut}
            onClick={() => {
              void (async () => {
                setSigningOut(true);
                setSignOutFailed(false);
                try {
                  const result = await client.signOut();
                  if (result.error) {
                    setSignOutFailed(true);
                    return;
                  }
                  await refresh();
                } catch {
                  setSignOutFailed(true);
                } finally {
                  setSigningOut(false);
                }
              })();
            }}
          >
            {t(signingOut ? 'account.signingOut' : 'account.signOut')}
          </Button>
        </div>
      </div>
    </section>
  );
}
