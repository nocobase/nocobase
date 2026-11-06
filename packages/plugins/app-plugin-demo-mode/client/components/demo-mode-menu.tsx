import { useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { ChevronDown } from 'lucide-react';
import { useId, useState, type ReactElement } from 'react';
import { useLocation } from 'react-router';

import { useDemoAccounts } from '../accounts.js';
import { useDemoMode } from '../demo-mode-context.js';
import { DEMO_MODE_NAMESPACE } from '../namespace.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu.js';

/** A standalone demo entry for the application's header, beside its theme and account controls. */
export function DemoModeMenu(): ReactElement | null {
  const enabled = useDemoMode();
  return enabled ? <EnabledDemoModeMenu /> : null;
}

function EnabledDemoModeMenu(): ReactElement {
  const { accounts, signIn } = useDemoAccounts();
  const { t } = useTranslation(DEMO_MODE_NAMESPACE);
  const toaster = useToaster();
  const location = useLocation();
  const descriptionId = useId();
  const [pending, setPending] = useState<string | null>(null);
  const current = accounts?.find((account) => account.current);

  const enter = async (username: string) => {
    if (pending !== null || username === current?.username) return;
    setPending(username);
    try {
      await signIn(
        username,
        `${location.pathname}${location.search}${location.hash}`,
      );
    } catch {
      setPending(null);
      toaster.show({ type: 'error', title: t('accounts.failed') });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        openOnHover
        delay={0}
        aria-label={
          accounts?.length
            ? `${t('menu.label')} · ${t('menu.switchAccount')}`
            : t('menu.label')
        }
        className='inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 text-xs font-medium text-primary outline-none transition-colors hover:bg-primary/15 focus-visible:ring-3 focus-visible:ring-ring/50'
      >
        <span
          aria-hidden
          className='size-1.5 shrink-0 rounded-full bg-primary'
        />
        <span className='font-medium'>{t('menu.label')}</span>
        {accounts?.length ? (
          <span className='hidden font-normal text-primary/80 sm:inline'>
            · {t('menu.switchAccount')}
          </span>
        ) : null}
        <ChevronDown aria-hidden className='size-3.5 shrink-0 opacity-70' />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align='end'
        aria-describedby={descriptionId}
        className='w-72 max-w-[calc(100vw-2rem)] duration-0'
      >
        <div className='px-2 py-1.5'>
          <p className='text-sm font-medium'>{t('menu.title')}</p>
          <p
            id={descriptionId}
            className='mt-0.5 text-xs text-muted-foreground'
          >
            {t('menu.description')}
            {accounts?.length ? <> {t('menu.accountsDescription')}</> : null}
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t('menu.switchAccount')}</DropdownMenuLabel>
          {accounts?.length ? (
            <DropdownMenuRadioGroup
              value={current?.username ?? ''}
              aria-label={t('menu.switchAccount')}
              aria-busy={pending !== null}
              onValueChange={(username: string) => void enter(username)}
            >
              {accounts.map((account) => (
                <DropdownMenuRadioItem
                  key={account.username}
                  value={account.username}
                  disabled={pending !== null}
                  closeOnClick={false}
                >
                  <span className='min-w-0'>
                    <span className='block truncate'>{account.name}</span>
                    {account.role ? (
                      <span className='block truncate text-xs text-muted-foreground'>
                        {account.role}
                      </span>
                    ) : null}
                    {pending === account.username ? (
                      <span
                        role='status'
                        className='block text-xs text-muted-foreground'
                      >
                        {t('accounts.entering')}
                      </span>
                    ) : null}
                  </span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          ) : (
            <p
              role='status'
              className='px-2 py-1.5 text-xs text-muted-foreground'
            >
              {accounts === null
                ? t('menu.loading')
                : t('accounts.unavailable')}
            </p>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
