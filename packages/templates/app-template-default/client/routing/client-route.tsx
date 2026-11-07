import { useTranslation } from '@nocobase/i18n/client';
import { useNavigationGuard } from '@nocobase/app-client';
import type {
  AppClientRegisteredRoute,
  AppClientRouteComponentModule,
} from '@nocobase/app-client/plugins';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { NamespaceScope } from '@nocobase/i18n/client';
import {
  Activity,
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { Loading } from '#components/loading';
import {
  RouteChildPageHost,
  RouteChildPageHostBoundary,
} from '#components/route-child-page';
import {
  RouteOverlayHost,
  RouteOverlayHostBoundary,
} from '#components/route-overlay';
import { Button } from '#components/ui/button';
import { cn } from 'cn';

export interface ClientRouteProps {
  readonly route: AppClientRegisteredRoute;
}

// Where a route's waiting, denial and failure render: the content area for a page, or the container the application
// opened for a declared child page, dialog or drawer. A route without a presentation keeps the page-sized placeholder.
type ClientRouteRegion = 'page' | 'child-page' | 'overlay';

const REGION_CLASS_NAMES: Record<ClientRouteRegion, string> = {
  page: 'min-h-[calc(100svh-4rem)]',
  'child-page': 'min-h-full',
  overlay: 'min-h-40',
};

export function ClientRoute({ route }: ClientRouteProps): ReactElement {
  const { t } = useTranslation();
  const { authz, componentLoader, presentation } = route;
  const checkAccess = authz !== 'skip';
  const { can: allowed, isPending: accessLoading } = useCan(
    authz === 'skip' ? undefined : authz,
  );
  const [componentModule, setComponentModule] =
    useState<AppClientRouteComponentModule>();
  const [loadError, setLoadError] = useState<unknown>();
  const [attempt, setAttempt] = useState(0);
  const [renderFailed, setRenderFailed] = useState(false);
  const loadedRef = useRef<
    | {
        loader: typeof componentLoader;
        attempt: number;
      }
    | undefined
  >(undefined);

  useEffect(() => {
    if (checkAccess && !allowed) return;
    // Activity reconnects Effects after a parent permission recheck. Keep the loaded component's identity:
    // loaders that wrap a module (for example, withNamespace) can return a new component on every call.
    if (
      loadedRef.current &&
      loadedRef.current.loader === componentLoader &&
      loadedRef.current.attempt === attempt
    )
      return;
    loadedRef.current = undefined;
    let active = true;

    componentLoader!().then(
      (module) => {
        if (active) {
          loadedRef.current = { loader: componentLoader, attempt };
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
  }, [allowed, attempt, checkAccess, componentLoader]);

  // Retries only this route's module, so the pages around it keep their drafts and scroll positions.
  const retryLoad = useCallback(() => {
    setLoadError(undefined);
    setAttempt((value) => value + 1);
  }, []);

  const kind = presentation?.kind;
  const region: ClientRouteRegion =
    kind === 'dialog' || kind === 'drawer'
      ? 'overlay'
      : kind === 'child-page'
        ? 'child-page'
        : 'page';
  const checking = checkAccess && accessLoading;
  const denied = checkAccess && !accessLoading && !allowed;
  const Component = componentModule?.default;
  const [mounted, setMounted] = useState(false);
  const present = Boolean(Component) && !denied && !loadError && !renderFailed;
  if (!checking && mounted !== present) setMounted(present);
  const rechecking = checking && mounted && !loadError && !renderFailed;
  // Activity disconnects form effects, including dirty registrations. This guard stays outside it and refuses
  // route departures until the page's effects reconnect; settled denial still unmounts the protected page.
  useNavigationGuard(() => !rechecking);
  useEffect(() => {
    if (!rechecking) return;
    const warn = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [rechecking]);

  let content: ReactNode;
  // A settled denial wins over an older load failure: the viewer may not see this page at all.
  if (denied) content = <ClientPageDenied route={route} region={region} />;
  else if (loadError)
    content = (
      <ClientPageError
        route={route}
        region={region}
        onRetry={retryLoad}
        retried={attempt > 0}
      />
    );
  else if (!Component) content = <ClientPageLoading region={region} />;
  else
    content = (
      <>
        {checking ? <ClientPageLoading region={region} /> : null}
        {/* Conceal a previously allowed page during rechecks without discarding its draft. A denial unmounts it. */}
        <Activity mode={checking ? 'hidden' : 'visible'}>
          <ErrorBoundary
            onError={() => setRenderFailed(true)}
            onReset={() => setRenderFailed(false)}
            fallbackRender={({ resetErrorBoundary }) => (
              <ClientPageError
                route={route}
                region={region}
                onRetry={resetErrorBoundary}
              />
            )}
          >
            {/* The owning package is the page's namespace, so a plugin page translates with a bare useTranslation(). */}
            <NamespaceScope ns={route.packageName}>
              <Component />
            </NamespaceScope>
          </ErrorBoundary>
        </Activity>
      </>
    );

  if (kind === 'dialog' || kind === 'drawer') {
    const title = presentation!.title!;
    return (
      <RouteChildPageHostBoundary>
        <RouteOverlayHost
          drawer={kind === 'drawer'}
          title={t(title, {
            ns: presentation!.namespace ?? route.packageName,
            defaultValue: title,
          })}
          ready={mounted && !denied && !loadError && !renderFailed}
          concealed={checking}
        >
          {content}
        </RouteOverlayHost>
      </RouteChildPageHostBoundary>
    );
  }
  if (kind === 'child-page')
    return (
      <RouteOverlayHostBoundary>
        <RouteChildPageHost>{content}</RouteChildPageHost>
      </RouteOverlayHostBoundary>
    );
  // A page that is not hosted builds its own container, including one rendered through a hosted page's outlet.
  return (
    <RouteOverlayHostBoundary>
      <RouteChildPageHostBoundary>{content}</RouteChildPageHostBoundary>
    </RouteOverlayHostBoundary>
  );
}

interface ClientRouteStateProps extends ClientRouteProps {
  readonly region: ClientRouteRegion;
}

function ClientPageDenied({
  route,
  region,
}: ClientRouteStateProps): ReactElement {
  const { t } = useTranslation();

  return (
    <section
      className={cn('grid place-items-center px-6', REGION_CLASS_NAMES[region])}
    >
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

function ClientPageLoading({
  region,
}: {
  readonly region: ClientRouteRegion;
}): ReactElement {
  const { t } = useTranslation();

  return (
    <Loading
      className={REGION_CLASS_NAMES[region]}
      label={t('status.loadingPage', { defaultValue: 'Loading page' })}
    />
  );
}

function ClientPageError({
  route,
  region,
  onRetry,
  retried = false,
}: ClientRouteStateProps & {
  readonly onRetry: () => void;
  /**
   * Set once a retry of the module failed too. A browser may keep answering a failed module import from its module
   * map without fetching again, so the full reload that does fetch it becomes the second way out.
   */
  readonly retried?: boolean;
}): ReactElement {
  const { t } = useTranslation();

  return (
    <section
      className={cn('grid place-items-center px-6', REGION_CLASS_NAMES[region])}
    >
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
        {retried && (
          <p className='text-sm text-muted-foreground'>
            {t('status.retryFailedDescription', {
              defaultValue:
                'It still could not be loaded. Reloading the whole page may help; unsaved changes on this page may be lost.',
            })}
          </p>
        )}
        <div className='flex flex-wrap justify-center gap-2'>
          <Button onClick={onRetry}>
            {t('status.retry', { defaultValue: 'Retry' })}
          </Button>
          {retried && (
            <Button variant='outline' onClick={() => window.location.reload()}>
              {t('status.reloadPage', { defaultValue: 'Reload page' })}
            </Button>
          )}
        </div>
      </section>
    </section>
  );
}
