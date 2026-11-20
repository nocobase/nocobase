import { getAvatarInitials } from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import { SidebarGroup, useSidebar } from '#components/ui/sidebar';

/** Who the personal settings belong to, under the way back; hidden while the sidebar shows icons only. */
export function PersonalSettingsIdentity(): ReactElement | null {
  const { session } = useAuthentication();
  const { t } = useTranslation();
  const { isMobile, state } = useSidebar();
  if (state === 'collapsed' && !isMobile) return null;
  const user = session?.user;
  const name =
    user?.name ||
    user?.email ||
    t('account.fallback', { defaultValue: 'Account' });
  const initials = getAvatarInitials(name, { cjk: Boolean(user?.name) });
  return (
    <SidebarGroup className='py-0'>
      <div className='flex min-w-0 items-center gap-3 rounded-lg border border-sidebar-border bg-background/60 p-2.5'>
        {user?.image ? (
          <img
            src={user.image}
            alt=''
            className='size-9 shrink-0 rounded-full object-cover'
          />
        ) : (
          <span className='grid size-9 shrink-0 place-items-center rounded-full bg-muted text-xs font-medium text-muted-foreground'>
            {initials}
          </span>
        )}
        <div className='min-w-0'>
          <p className='truncate text-sm font-medium'>{name}</p>
          <p className='truncate text-xs text-muted-foreground'>
            {t('settings.personal.title')}
          </p>
        </div>
      </div>
    </SidebarGroup>
  );
}
