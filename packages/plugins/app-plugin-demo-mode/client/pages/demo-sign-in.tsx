import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useRef, useState, type ReactElement } from 'react';
import { Link, useSearchParams } from 'react-router';

import { useDemoAccounts } from '../accounts.js';
import { Loading } from '../components/loading.js';
import { DEMO_MODE_NAMESPACE } from '../namespace.js';

/**
 * Where a visitor enters a demo without a password:
 * `?as=<username>` enters that account at once, `?redirect=/path` is where it lands. Without `as`, or when the account
 * cannot be entered, the page lists the accounts to choose from.
 */
export default function DemoSignInPage(): ReactElement {
  const { t } = useTranslation(DEMO_MODE_NAMESPACE);
  const [params] = useSearchParams();
  const requested = params.get('as');
  const redirect = params.get('redirect') ?? undefined;
  const { accounts, signIn } = useDemoAccounts();
  const [pending, setPending] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const attemptedRef = useRef(false);
  // The account `?as=` names, once the list says it can be entered.
  const automatic =
    requested && accounts?.some((account) => account.username === requested)
      ? requested
      : null;

  useEffect(() => {
    if (!automatic || attemptedRef.current) return;
    attemptedRef.current = true;
    signIn(automatic, redirect).catch(() => setFailed(true));
  }, [automatic, redirect, signIn]);

  const enter = async (username: string) => {
    setPending(username);
    setFailed(false);
    try {
      await signIn(username, redirect);
    } catch {
      setPending(null);
      setFailed(true);
    }
  };
  const refused = failed || Boolean(accounts && requested && !automatic);
  const entering = automatic !== null && !failed && pending === null;

  if ((requested && accounts === null) || entering) {
    return <Loading fullscreen />;
  }

  return (
    <main className='flex min-h-svh items-center justify-center bg-background p-4 text-foreground'>
      <section className='w-full max-w-md space-y-4'>
        <header className='space-y-1'>
          <h1 className='text-xl font-semibold'>{t('accounts.title')}</h1>
          <p className='text-sm text-muted-foreground'>
            {t('accounts.description')}
          </p>
        </header>
        {refused ? (
          <p role='alert' className='text-sm text-destructive'>
            {t('accounts.failed')}
          </p>
        ) : null}
        {accounts === null ? (
          <p role='status' className='text-sm text-muted-foreground'>
            {t('menu.loading')}
          </p>
        ) : accounts.length ? (
          <ul className='space-y-2'>
            {accounts.map((account) => (
              <li key={account.username}>
                <button
                  type='button'
                  disabled={pending !== null}
                  onClick={() => void enter(account.username)}
                  className='flex w-full items-center justify-between gap-3 rounded-lg border border-border px-4 py-3 text-left hover:bg-muted disabled:opacity-60'
                >
                  <span className='min-w-0'>
                    <span className='block truncate font-medium'>
                      {account.name}
                    </span>
                    <span className='block truncate text-sm text-muted-foreground'>
                      {account.role}
                    </span>
                  </span>
                  <span className='shrink-0 text-sm text-muted-foreground'>
                    {pending === account.username
                      ? t('accounts.entering')
                      : account.current
                        ? t('accounts.current')
                        : t('accounts.enter')}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className='text-sm text-muted-foreground'>
            {t('accounts.unavailable')}
          </p>
        )}
        <Link to='/login' className='inline-block text-sm underline'>
          {t('accounts.password')}
        </Link>
      </section>
    </main>
  );
}
