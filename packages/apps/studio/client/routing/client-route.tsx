import { useTranslation } from '@nocobase/i18n/client';
import type {
  AppClientRegisteredRoute,
  AppClientRouteComponentModule,
} from '@nocobase/app-client/plugins';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { NamespaceScope } from '@nocobase/i18n/client';
import { type ReactElement, useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { Loading } from '@/components/loading';
import { Button } from '@/components/ui/button';

export interface ClientRouteProps {
  readonly route: AppClientRegisteredRoute;
}

export function ClientRoute({ route }: ClientRouteProps): ReactElement {
  const { authz, componentLoader } = route;
  const checkAccess = authz !== 'skip';
  const { can: allowed, isPending: accessLoading } = useCan(
    authz === 'skip' ? undefined : authz,
  );
  const [componentModule, setComponentModule] =
    useState<AppClientRouteComponentModule>();
  const [loadError, setLoadError] = useState<unknown>();

  useEffect(() => {
    if (checkAccess && !allowed) return;
    let active = true;

    componentLoader!().then(
      (module) => {
        if (active) {
          setComponentModule(module);
          setLoadError(undefined);
        }
      },
      (error: unknown) => {
        if (active) {
          setLoadError(error);
        }
      },
    );

    return () => {
      active = false;
    };
  }, [allowed, checkAccess, componentLoader]);

  if (loadError) {
    return <ClientPageError route={route} />;
  }

  if (checkAccess && accessLoading) return <ClientPageLoading />;
  if (checkAccess && !allowed) return <ClientPageDenied route={route} />;

  if (!componentModule) {
    return <ClientPageLoading />;
  }

  const Component = componentModule.default;

  return (
    <ErrorBoundary fallback={<ClientPageError route={route} />}>
      {/* The owning package is the page's namespace, so a plugin page translates with a bare useTranslation(). */}
      <NamespaceScope ns={route.packageName}>
        <Component />
      </NamespaceScope>
    </ErrorBoundary>
  );
}

function ClientPageDenied(inputProps: ClientRouteProps): ReactElement {
  const { t } = useTranslation();
  const { route } = inputProps;

  return (
    <section className='grid min-h-[calc(100svh-4rem)] place-items-center px-6'>
      <section className='w-full max-w-lg space-y-3 text-center'>
        <h1 className='text-xl font-semibold'>
          {t('status.denied', { defaultValue: 'Access denied' })}
        </h1>
        <p className='text-sm text-muted-foreground'>
          {t('status.deniedDescription', {
            label: route.name,
            defaultValue: `You do not have permission to access ${route.name}.`,
          })}
        </p>
      </section>
    </section>
  );
}

function ClientPageLoading(): ReactElement {
  const { t } = useTranslation();

  return (
    <Loading
      className='min-h-[calc(100svh-4rem)]'
      label={t('status.loadingPage', { defaultValue: 'Loading page' })}
    />
  );
}

function ClientPageError(inputProps: ClientRouteProps): ReactElement {
  const { t } = useTranslation();
  const { route } = inputProps;

  return (
    <section className='grid min-h-[calc(100svh-4rem)] place-items-center px-6'>
      <section className='w-full max-w-lg space-y-4 text-center'>
        <h1 className='text-xl font-semibold'>
          {t('status.pageFailed', { defaultValue: 'Unable to load page' })}
        </h1>
        <p className='text-sm text-muted-foreground'>
          {t('status.routeFailedDescription', {
            label: route.name,
            packageName: route.packageName,
            defaultValue: `Route ${route.name} from ${route.packageName} could not be loaded.`,
          })}
        </p>
        <Button onClick={() => window.location.reload()}>
          {t('status.retry', { defaultValue: 'Retry' })}
        </Button>
      </section>
    </section>
  );
}
