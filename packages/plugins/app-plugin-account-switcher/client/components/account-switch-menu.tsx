import { useApiClient, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { ArrowLeftRight, Undo2 } from 'lucide-react';
import { useEffect, useId, useState, type ReactElement } from 'react';

import type {
  AccountRoleTitle,
  SwitchableAccount,
} from '../../shared/types.js';
import {
  ACCOUNT_SWITCHER_NAMESPACE,
  useAccountSwitcher,
  type AccountSwitcherContextValue,
} from '../context.js';
import {
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from './ui/dropdown-menu.js';
import { Input } from './ui/input.js';

const PAGE_SIZE = 20;
const SEARCH_DELAY_MS = 200;

/**
 * Account-menu entries, rendered inside the application's `DropdownMenuContent`. Renders nothing unless the signed-in
 * person may switch accounts, and that person stays the one deciding while acting as another account.
 */
export function AccountSwitchMenu(): ReactElement | null {
  const context = useAccountSwitcher();
  const { t } = useTranslation(ACCOUNT_SWITCHER_NAMESPACE);
  const toaster = useToaster();
  if (!context?.state?.canSwitch) return null;
  const { switched } = context.state;

  return (
    <>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger className='gap-2'>
          <ArrowLeftRight aria-hidden className='size-4' />
          {t('menu.switchAccount')}
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className='w-72 max-w-[calc(100vw-2rem)]'>
          <AccountList context={context} />
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      {switched ? (
        <DropdownMenuItem
          className='gap-2'
          onClick={() => {
            context.stop().catch(() => {
              toaster.show({ type: 'error', title: t('errors.returnFailed') });
            });
          }}
        >
          <Undo2 aria-hidden className='size-4' />
          {t('banner.return', { name: switched.actor.name })}
        </DropdownMenuItem>
      ) : null}
    </>
  );
}

interface AccountPage {
  readonly accounts: readonly SwitchableAccount[];
  readonly total: number;
}

function AccountList({
  context,
}: {
  readonly context: AccountSwitcherContextValue;
}): ReactElement {
  const api = useApiClient();
  const { t } = useTranslation(ACCOUNT_SWITCHER_NAMESPACE);
  const toaster = useToaster();
  const searchId = useId();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState<AccountPage | null>(null);
  const [failed, setFailed] = useState(false);
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    const timer = setTimeout(
      () => {
        const q = search.trim();
        api
          .request<{
            data: SwitchableAccount[];
            meta: { total: number };
          }>({
            path: '/accountSwitcher/accounts',
            query: { pageSize: PAGE_SIZE, ...(q ? { q } : {}) },
          })
          .then(
            ({ data, meta }) => {
              if (!current) return;
              setFailed(false);
              setPage({ accounts: data, total: meta.total });
            },
            () => {
              if (current) setFailed(true);
            },
          );
      },
      search ? SEARCH_DELAY_MS : 0,
    );
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [api, search]);

  const label = (title: AccountRoleTitle): string =>
    typeof title === 'string'
      ? title
      : t(title.key, { ns: title.ns, defaultValue: title.defaultValue });

  const choose = async (account: SwitchableAccount) => {
    if (pending !== null || account.current) return;
    setPending(account.id);
    try {
      await (account.own ? context.stop() : context.start(account.id));
    } catch {
      setPending(null);
      toaster.show({ type: 'error', title: t('errors.switchFailed') });
    }
  };

  const accounts = page?.accounts ?? [];
  const current = accounts.find((account) => account.current)?.id ?? '';

  return (
    <div className='flex flex-col'>
      <div className='p-1'>
        <Input
          id={searchId}
          aria-label={t('menu.search')}
          placeholder={t('menu.search')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          // The menu would otherwise treat each key as type-ahead and take the focus away.
          onKeyDown={(event) => event.stopPropagation()}
        />
      </div>
      {accounts.length ? (
        <DropdownMenuRadioGroup
          value={current}
          aria-label={t('menu.switchAccount')}
          aria-busy={pending !== null}
          className='max-h-72 overflow-y-auto'
        >
          {accounts.map((account) => (
            <DropdownMenuRadioItem
              key={account.id}
              value={account.id}
              disabled={pending !== null}
              closeOnClick={false}
              onClick={() => void choose(account)}
            >
              <span className='min-w-0'>
                <span className='block truncate'>{account.name}</span>
                <span className='block truncate text-xs text-muted-foreground'>
                  {[...new Set(account.roleTitles.map(label))].join(', ') ||
                    account.email}
                </span>
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      ) : null}
      {!accounts.length || (page && page.total > accounts.length) ? (
        <p role='status' className='px-2 py-1.5 text-xs text-muted-foreground'>
          {failed
            ? t('menu.loadFailed')
            : !page
              ? t('menu.loading')
              : page.total > accounts.length
                ? t('menu.more', { count: page.total - accounts.length })
                : t('menu.empty')}
        </p>
      ) : null}
    </div>
  );
}
