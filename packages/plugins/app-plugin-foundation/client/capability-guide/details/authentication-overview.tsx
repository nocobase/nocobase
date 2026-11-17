import { findCapabilityPage } from './find-capability-page.js';
import type { ReactElement } from 'react';
import { useClientApplication } from '@nocobase/app-client';
import {
  usePasswordResetCapability,
  useSignUpAvailable,
} from '@nocobase/app-plugin-authentication/client';
import { useDetailCopy } from './use-detail-copy.js';
import { ArrowUpRight, KeyRound, Mail, Terminal, UserPlus } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '#components/ui/button';
import { buttonVariants } from '#components/ui/button-variants';
import { useRouteAccess } from './route-context.js';
import {
  CurrentApplication,
  ConfigurationItem,
  ConfigurationActions,
  ConfigurationAction,
} from './detail-layout.js';

export default function AuthenticationOverview(): ReactElement | null {
  const { t } = useDetailCopy();
  const app = useClientApplication();
  // Authentication pages live outside the signed-in business route tree.
  const routes = app.runtime.routes;
  const access = useRouteAccess();
  const config = app.config.public;
  const passwordEnabled = config.has('auth.emailAndPassword.enabled')
    ? config.get('auth.emailAndPassword.enabled')
    : undefined;
  const signUpAvailable = useSignUpAvailable();
  const recovery = usePasswordResetCapability();
  const login = findCapabilityPage(routes, access.denied, ['login']);
  const register = findCapabilityPage(routes, access.denied, ['register']);
  const forgot = findCapabilityPage(routes, access.denied, ['forgot-password']);
  const reset = findCapabilityPage(routes, access.denied, ['reset-password']);
  const device = findCapabilityPage(routes, access.denied, ['device']);
  const passwordState = !login ? false : passwordEnabled;
  const registrationState =
    !register || !login || !signUpAvailable ? false : passwordEnabled;
  const recoveryState =
    !forgot || !reset || passwordEnabled === false
      ? false
      : recovery.isPending
        ? ('loading' as const)
        : recovery.isError
          ? undefined
          : recovery.data?.passwordResetAvailable;
  const entries = [
    {
      key: 'password',
      icon: KeyRound,
      state: passwordState,
      page: login,
      denied: login?.denied,
    },
    {
      key: 'registration',
      icon: UserPlus,
      state: registrationState,
      page: register,
      denied: register?.denied || login?.denied,
    },
    {
      key: 'recovery',
      icon: Mail,
      state: recoveryState,
      page: forgot,
      denied: forgot?.denied || reset?.denied,
    },
  ];

  return (
    <div className='flex min-w-0 flex-col gap-6'>
      <CurrentApplication
        footer={<p>{t('authenticationOverview.statusNote')}</p>}
      >
        {entries.map(({ key, icon, state, page, denied }) => (
          <ConfigurationItem
            key={key}
            title={t(`authenticationOverview.features.${key}.title`)}
            description={t(
              `authenticationOverview.features.${key}.${state === true ? 'configured' : state === false ? 'missing' : 'unknown'}`,
            )}
            state={state}
            icon={icon}
          >
            {state === true && page ? (
              access.loading ? (
                <p className='text-xs text-muted-foreground'>
                  {t('featureOverview.apiKeys.checkingAccess')}
                </p>
              ) : denied ? (
                <p className='text-xs text-muted-foreground'>
                  {t('authenticationOverview.denied')}
                </p>
              ) : (
                <div className='space-y-2'>
                  <Link
                    to={page.route.path}
                    target='_blank'
                    rel='noreferrer'
                    className={buttonVariants({
                      variant: 'outline',
                      size: 'sm',
                    })}
                  >
                    {t(`authenticationOverview.features.${key}.open`)}
                    <ArrowUpRight aria-hidden />
                  </Link>
                  <p className='text-xs leading-5 text-muted-foreground'>
                    {t('authenticationOverview.guestHint')}
                  </p>
                </div>
              )
            ) : null}
            {key === 'recovery' && recovery.isError && state === undefined ? (
              <Button
                variant='outline'
                size='sm'
                onClick={() => void recovery.refetch()}
              >
                {t('authenticationOverview.retry')}
              </Button>
            ) : null}
          </ConfigurationItem>
        ))}
        <ConfigurationItem
          title={t('authenticationOverview.deviceTitle')}
          description={t('authenticationOverview.deviceDescription')}
          state={!!device}
          icon={Terminal}
        >
          {device && !access.loading && !device.denied ? (
            <Link
              to={device.route.path}
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              {t('featureOverview.layout.open')}
              <ArrowUpRight aria-hidden />
            </Link>
          ) : device?.denied ? (
            <p className='text-xs text-muted-foreground'>
              {t('authenticationOverview.denied')}
            </p>
          ) : null}
        </ConfigurationItem>
      </CurrentApplication>
      <ConfigurationActions>
        {(
          [
            'login',
            'registration',
            'recovery',
            'sso',
            'security',
            'device',
          ] as const
        ).map((action) => (
          <ConfigurationAction
            key={action}
            title={t(`authenticationOverview.actions.${action}.title`)}
            description={t(
              `authenticationOverview.actions.${action}.description`,
            )}
            prompt={t(`authenticationOverview.actions.${action}.prompt`)}
            steps={['inspect', 'configure', 'verify'].map((step) =>
              t(`authenticationOverview.actions.${action}.${step}`),
            )}
          />
        ))}
      </ConfigurationActions>
    </div>
  );
}
