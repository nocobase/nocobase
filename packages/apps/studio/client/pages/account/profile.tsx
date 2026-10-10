import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { Link } from 'react-router';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { ProfileForm } from './profile-forms.js';

/** The person's own name and username (`/account/profile`), read fresh from the session on entry. */
function useFreshProfile() {
  const { client, session } = useAuthentication();
  return useQuery({
    queryKey: ['account-profile', session?.user.id],
    queryFn: async () => {
      const result = await client.getSession({
        query: { disableCookieCache: true },
      });
      if (result.error) throw new Error('Profile request failed');
      return result.data?.user ?? null;
    },
    retry: false,
    gcTime: 0,
    // Load fresh data on entry, but never replace a draft while its owner is typing.
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  });
}

export default function AccountProfile(): ReactElement {
  const { t } = useTranslation();
  const profile = useFreshProfile();
  if (profile.isPending)
    return (
      <div role='status' aria-label={t('status.loading')}>
        <Skeleton className='h-64' />
      </div>
    );
  if (profile.isError && !profile.data)
    return (
      <Alert variant='destructive'>
        <AlertDescription>{t('profile.loadFailed')}</AlertDescription>
        <Button
          variant='outline'
          onClick={() => void profile.refetch()}
          disabled={profile.isFetching}
        >
          {t('status.retry')}
        </Button>
      </Alert>
    );
  if (!profile.data)
    return (
      <Alert>
        <AlertDescription>{t('profile.signInAgain')}</AlertDescription>
        <Button
          variant='outline'
          nativeButton={false}
          render={<Link to='/login' />}
        >
          {t('auth.signIn')}
        </Button>
      </Alert>
    );
  return (
    <div className='space-y-4'>
      {profile.isError && (
        <Alert variant='destructive'>
          <AlertDescription>{t('profile.reloadFailed')}</AlertDescription>
          <Button
            variant='outline'
            onClick={() => void profile.refetch()}
            disabled={profile.isFetching}
          >
            {t('status.retry')}
          </Button>
        </Alert>
      )}
      <ProfileForm key={profile.data.id} user={profile.data} />
    </div>
  );
}
