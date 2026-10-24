import { useApiClient, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useRef, useState, type ReactElement } from 'react';
import { useLocation } from 'react-router';

import { DEMO_SIGN_IN_PATH, useDemoAccounts } from '../accounts.js';
import { DEMO_MODE_NAMESPACE } from '../namespace.js';

/**
 * A corner button on every page of a demo, the sign-in page included, that enters or switches between the demo
 * accounts, so a visitor can see how the application looks to each of them. Bottom right, where application sidebars
 * keep nothing. With `signedOutOnly`, when the application's account menu carries the switch, it shows only to
 * visitors who have not signed in, such as on the sign-in page.
 */
export function DemoAccountSwitcher({
  signedOutOnly = false,
}: {
  readonly signedOutOnly?: boolean;
}): ReactElement | null {
  const location = useLocation();
  const api = useApiClient();
  const { accounts, signIn } = useDemoAccounts();
  // Whether someone is signed in, read again on every page; unknown until answered.
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    if (!signedOutOnly) return;
    let active = true;
    api
      .request<{ user?: unknown } | null>({ path: '/auth/get-session' })
      .then((session) => {
        if (active) setSignedIn(Boolean(session?.user));
      })
      .catch(() => {
        if (active) setSignedIn(false);
      });
    return () => {
      active = false;
    };
  }, [api, signedOutOnly, location.pathname]);
  const toaster = useToaster();
  const { t } = useTranslation(DEMO_MODE_NAMESPACE);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key !== 'Escape') return;
      if (
        event instanceof PointerEvent &&
        rootRef.current?.contains(event.target as Node)
      )
        return;
      setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  if (
    !accounts?.length ||
    location.pathname === DEMO_SIGN_IN_PATH ||
    (signedOutOnly && signedIn !== false)
  )
    return null;
  const current = accounts.find((account) => account.current);

  const enter = async (username: string) => {
    setPending(username);
    try {
      await signIn(username, `${location.pathname}${location.search}`);
    } catch {
      setPending(null);
      toaster.show({ type: 'error', title: t('accounts.failed') });
    }
  };

  return (
    <div
      ref={rootRef}
      className='fixed right-4 bottom-4 z-50 flex flex-col items-end text-sm'
    >
      {open ? (
        <div
          role='menu'
          aria-label={t('accounts.title')}
          className='mb-2 w-72 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg'
        >
          <p className='px-2 py-1.5 text-xs text-muted-foreground'>
            {t('accounts.description')}
          </p>
          {accounts.map((account) => (
            <button
              key={account.username}
              type='button'
              role='menuitem'
              disabled={pending !== null || account.current}
              onClick={() => void enter(account.username)}
              className='flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted disabled:cursor-default disabled:hover:bg-transparent'
            >
              <span className='min-w-0'>
                <span className='block truncate font-medium'>
                  {account.name}
                </span>
                <span className='block truncate text-xs text-muted-foreground'>
                  {account.role}
                </span>
              </span>
              <span className='shrink-0 text-xs text-muted-foreground'>
                {account.current
                  ? t('accounts.current')
                  : pending === account.username
                    ? t('accounts.entering')
                    : null}
              </span>
            </button>
          ))}
        </div>
      ) : null}
      <button
        type='button'
        aria-haspopup='menu'
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className='rounded-full border border-border bg-background px-3 py-1.5 font-medium shadow-md hover:bg-muted'
      >
        {current
          ? t('accounts.signedInAs', { name: current.name })
          : t('accounts.enter')}
      </button>
    </div>
  );
}
