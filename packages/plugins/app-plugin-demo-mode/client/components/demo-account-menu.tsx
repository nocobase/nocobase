import { useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { Users } from 'lucide-react';
import { type ReactElement } from 'react';
import { useLocation } from 'react-router';

import { useDemoAccounts } from '../accounts.js';
import { DEMO_MODE_NAMESPACE } from '../namespace.js';
import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from './ui/dropdown-menu.js';

/**
 * The demo accounts as a submenu of an application's account menu, placed before signing out: the account the
 * visitor is in, and the others to switch to. Renders nothing outside a demo or when quick sign-in offers no account.
 * It belongs inside the application's Base UI dropdown menu content.
 */
export function DemoAccountMenu(): ReactElement | null {
  const location = useLocation();
  const { accounts, signIn } = useDemoAccounts();
  const toaster = useToaster();
  const { t } = useTranslation(DEMO_MODE_NAMESPACE);
  if (!accounts?.length) return null;
  const current = accounts.find((account) => account.current);
  return (
    <>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger openOnHover delay={0} className='gap-2'>
          <Users className='size-4' />
          <span className='min-w-0 flex-1 truncate'>
            {current
              ? t('accounts.menu', { name: current.name })
              : t('accounts.title')}
          </span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className='w-64 duration-0'>
          <DropdownMenuRadioGroup
            value={current?.username ?? ''}
            onValueChange={(username: string) => {
              if (username === current?.username) return;
              signIn(username, `${location.pathname}${location.search}`).catch(
                () =>
                  toaster.show({ type: 'error', title: t('accounts.failed') }),
              );
            }}
          >
            {accounts.map((account) => (
              <DropdownMenuRadioItem
                key={account.username}
                value={account.username}
              >
                <span className='min-w-0'>
                  <span className='block truncate'>{account.name}</span>
                  <span className='block truncate text-xs text-muted-foreground'>
                    {account.role}
                  </span>
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuSeparator />
    </>
  );
}
