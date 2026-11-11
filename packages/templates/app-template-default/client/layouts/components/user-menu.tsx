import { useAuthenticationErrorResolver } from '@nocobase/app-plugin-authentication/client/actions';
import {
  getAvatarInitials,
  useApiClient,
  useToaster,
} from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import {
  pushBase,
  unsubscribeDevice,
} from '@nocobase/app-plugin-notification-web-push/client';
import { Bell, LogOut, UserRound } from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { useHref } from 'react-router';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#components/ui/dropdown-menu';

import { ThemeSettings } from '../../theme/index.js';
import { LanguageSwitcher } from './language-switcher.js';
import { PushNotificationsDialog } from './push-notifications-dialog.js';

export function UserMenu(): ReactElement {
  const {
    client,
    session,
    isPending: isLoading,
    refresh,
  } = useAuthentication();
  const identity = session?.user
    ? {
        id: session.user.id,
        fullName: session.user.name,
        email: session.user.email,
        avatar: session.user.image ?? undefined,
      }
    : null;
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [pushOpen, setPushOpen] = useState(false);
  const api = useApiClient();
  const base = pushBase(useHref('/'));
  const { t } = useTranslation();
  const toaster = useToaster();
  const resolveError = useAuthenticationErrorResolver();

  const name =
    identity?.fullName ||
    identity?.email ||
    t('account.fallback', { defaultValue: 'Account' });
  const initials = getAvatarInitials(name, {
    cjk: Boolean(identity?.fullName),
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          openOnHover
          delay={0}
          aria-label={t('account.openMenu', {
            defaultValue: 'Open account menu',
          })}
          className='flex size-10 cursor-pointer items-center justify-center rounded-full border border-border bg-background/60 text-left text-sm outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50'
        >
          {identity?.avatar ? (
            <img
              src={identity.avatar}
              alt=''
              className='size-full rounded-full object-cover'
            />
          ) : (
            <span className='grid size-full place-items-center rounded-full bg-muted text-xs font-medium text-muted-foreground'>
              {isLoading ? <UserRound className='size-4' /> : initials}
            </span>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-64'>
          <div className='px-2 py-1.5'>
            <p className='truncate text-sm font-medium'>{name}</p>
            {identity?.email ? (
              <p className='truncate text-xs text-muted-foreground'>
                {identity.email}
              </p>
            ) : null}
          </div>
          <DropdownMenuSeparator />
          <LanguageSwitcher />
          <ThemeSettings />
          <DropdownMenuItem
            disabled={!identity}
            onClick={() => setPushOpen(true)}
            className='gap-2'
          >
            <Bell className='size-4' />
            {t('account.pushNotifications', {
              defaultValue: 'Push notifications',
            })}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={isLoggingOut}
            onClick={() => {
              void (async () => {
                setIsLoggingOut(true);
                try {
                  // This browser stops receiving the person's notifications before the session ends; if that fails,
                  // signing out stops too, so the device never keeps notifying a signed-out person.
                  if (identity) await unsubscribeDevice(api, base, identity.id);
                  // Better Auth returns API failures as data rather than throwing.
                  const result = await client.signOut();
                  if (result.error) {
                    toaster.show({
                      type: 'error',
                      title:
                        resolveError(result.error)?.message ??
                        t('account.signOutFailed', {
                          defaultValue: 'Unable to sign out. Please try again.',
                        }),
                    });
                    return;
                  }
                  await refresh();
                } catch (error) {
                  toaster.show({
                    type: 'error',
                    title:
                      resolveError(error)?.message ??
                      t('account.signOutFailed', {
                        defaultValue: 'Unable to sign out. Please try again.',
                      }),
                  });
                } finally {
                  setIsLoggingOut(false);
                }
              })();
            }}
            className='gap-2'
          >
            <LogOut className='size-4' />
            {isLoggingOut
              ? t('account.signingOut', { defaultValue: 'Signing out…' })
              : t('account.signOut', { defaultValue: 'Sign out' })}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <PushNotificationsDialog open={pushOpen} onOpenChange={setPushOpen} />
    </>
  );
}
