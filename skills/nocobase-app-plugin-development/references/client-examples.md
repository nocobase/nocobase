# Client Service, Context, and Routed Tabs Examples

Use these examples when the shorter Client references do not show enough implementation detail. They follow the current `ClientApplication`, authorization Client, React Router, and shadcn/base-nova APIs on `v3-develop`; adapt package names, resource identities, copy, and event topics to the owning plugin.

## Application-scoped Client service with typed options

This example registers one lazy service, subscribes only after Client startup has finalized its render configuration, and releases the subscription during reverse shutdown. It resolves the host Realtime Client instead of opening a second connection.

```ts
// client/audit-feed.ts
import type { RealtimeClient } from '@nocobase/app-client';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

export interface AuditEntry {
  readonly id: string;
  readonly action: string;
  readonly createdAt: string;
}

export interface AuditFeedSnapshot {
  readonly entries: readonly AuditEntry[];
}

export interface AuditFeed {
  getSnapshot(): AuditFeedSnapshot;
  subscribe(listener: () => void): () => void;
  start(): Promise<void>;
  close(): Promise<void>;
}

export const auditFeedToken: ServiceToken<AuditFeed> =
  createServiceToken<AuditFeed>(
    '@nocobase/app-plugin-audit-log/client/audit-feed',
  );

export class RealtimeAuditFeed implements AuditFeed {
  private readonly listeners = new Set<() => void>();
  private snapshot: AuditFeedSnapshot = Object.freeze({ entries: [] });
  private unsubscribe: (() => void) | undefined;

  public constructor(
    private readonly realtime: RealtimeClient,
    private readonly topic: string,
  ) {}

  public getSnapshot(): AuditFeedSnapshot {
    return this.snapshot;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return (): void => {
      this.listeners.delete(listener);
    };
  }

  public start(): Promise<void> {
    if (this.unsubscribe !== undefined) return Promise.resolve();
    this.unsubscribe = this.realtime.subscribe<AuditEntry>(
      this.topic,
      ({ payload }) => {
        this.publish({ entries: [payload, ...this.snapshot.entries] });
      },
    );
    return Promise.resolve();
  }

  public close(): Promise<void> {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    return Promise.resolve();
  }

  private publish(snapshot: AuditFeedSnapshot): void {
    this.snapshot = Object.freeze(snapshot);
    this.listeners.forEach((listener) => listener());
  }
}
```

The Provider constructor receives the exact options stored by `defineClientPlugin()`.

```ts
// client/service-provider.ts
import {
  ClientApplication,
  realtimeClientToken,
  type ClientServiceProviderContext,
} from '@nocobase/app-client';
import type { ClientServiceProviderConstructor } from '@nocobase/app-client/plugins';
import { ServiceProvider } from '@nocobase/service-provider';

import { RealtimeAuditFeed, auditFeedToken } from './audit-feed.js';
import type { AuditLogClientOptions } from './plugin.js';

export class AuditLogClientServiceProvider extends ServiceProvider<ClientApplication> {
  public readonly name: string = '@nocobase/app-plugin-audit-log/client';

  public constructor(
    app: ClientApplication,
    private readonly context: ClientServiceProviderContext<AuditLogClientOptions>,
  ) {
    super(app);
  }

  public override register(): void {
    this.app.container.singleton(
      auditFeedToken,
      (resolver) =>
        new RealtimeAuditFeed(
          resolver.resolve(realtimeClientToken),
          this.context.options.topic ?? 'audit-log:created',
        ),
    );
  }

  public override async start(): Promise<void> {
    await this.app.container.resolve(auditFeedToken).start();
  }

  public override async shutdown(): Promise<void> {
    await this.app.container.resolveIfCreated(auditFeedToken)?.close();
  }
}

const serviceProviders: readonly ClientServiceProviderConstructor<AuditLogClientOptions>[] =
  [AuditLogClientServiceProvider];

export default serviceProviders;
```

Declare and register the options once. The options are public browser configuration, so they must not contain credentials.

```ts
// client/plugin.ts
import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';

import reactProviders from './react-providers.js';
import routes from './routes.js';
import serviceProviders from './service-provider.js';

export interface AuditLogClientOptions {
  readonly topic?: string;
}

const auditLog: AppClientPluginFactory<AuditLogClientOptions> =
  defineClientPlugin({
    packageName: '@nocobase/app-plugin-audit-log',
    serviceProviders,
    reactProviders,
    routes,
  });

export default auditLog;
```

```ts
// target App: client/plugins.ts
import auditLog from '@nocobase/app-plugin-audit-log/client';
import { defineClientPlugins } from '@nocobase/app-client/plugins';

export default defineClientPlugins([
  auditLog({
    topic: 'audit-log:created',
  }),
]);
```

## React Context composed over the service

The React Provider turns the service's stable snapshot and subscription contract into render state with `useSyncExternalStore()`. It does not duplicate the Realtime subscription or own the service lifetime.

```tsx
// client/components/audit-log-provider.tsx
import { useService } from '@nocobase/app-client';
import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type PropsWithChildren,
  type ReactElement,
} from 'react';

import { auditFeedToken, type AuditFeedSnapshot } from '../audit-feed.js';

const AuditLogContext = createContext<AuditFeedSnapshot | undefined>(undefined);

export function AuditLogProvider({
  children,
}: PropsWithChildren): ReactElement {
  const feed = useService(auditFeedToken);
  const subscribe = useCallback(
    (listener: () => void) => feed.subscribe(listener),
    [feed],
  );
  const getSnapshot = useCallback(() => feed.getSnapshot(), [feed]);
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return (
    <AuditLogContext.Provider value={snapshot}>
      {children}
    </AuditLogContext.Provider>
  );
}

export function useAuditLog(): AuditFeedSnapshot {
  const value = useContext(AuditLogContext);
  if (value === undefined) {
    throw new Error('useAuditLog() must be used inside AuditLogProvider.');
  }
  return value;
}
```

```ts
// client/react-providers.ts
import {
  defineClientReactProviders,
  type AppClientReactProviderDefinition,
} from '@nocobase/app-client/plugins';

import { AuditLogProvider } from './components/audit-log-provider.js';

const reactProviders: readonly AppClientReactProviderDefinition[] =
  defineClientReactProviders([
    {
      name: 'audit-log',
      component: AuditLogProvider,
      layer: 'extension',
      after: ['@nocobase/app-plugin-authentication:authentication'],
    },
  ]);

export default reactProviders;
```

Use the hook from any plugin page rendered below the Provider. Test the Provider with a controlled `AuditFeed` and assert rerender and unsubscribe behavior; declaration tests separately assert the full `after` ID and extension layer.

## URL-controlled Tabs with child access

This is a plugin-owned business page for browsing audit events, with Overview and Activity views. Administration such as retention configuration belongs to settings items and APIs, with any editor owned by the application; see [system settings](system-settings.md).

Generate `tabs` into this plugin before using the next page:

```bash
cd packages/plugins/app-plugin-audit-log
pnpm exec shadcn add tabs
```

Keep the generated primitives in `client/components/ui/`, then replace their `@/` runtime imports with explicit relative `.js` imports. The page below intentionally imports the plugin-owned primitive; a compiled plugin must not import the target App's private `@/components/ui/tabs` path.

```ts
// client/routes.ts
import { defineAppRoutes } from '@nocobase/app-client/plugins';

const routes = defineAppRoutes([
  {
    name: 'audit-log',
    path: '/audit-log',
    navigation: { title: 'navigation.auditLog' },
    authz: { resource: { type: 'page', id: 'audit-log' }, action: 'access' },
    componentLoader: () => import('./pages/audit-log/index.js'),
    children: [
      {
        name: 'overview',
        path: 'overview',
        authz: {
          resource: { type: 'page', id: 'audit-log-overview' },
          action: 'access',
        },
        componentLoader: () => import('./pages/audit-log/overview.js'),
      },
      {
        name: 'activity',
        path: 'activity',
        authz: {
          resource: { type: 'page', id: 'audit-log-activity' },
          action: 'access',
        },
        componentLoader: () => import('./pages/audit-log/activity.js'),
      },
    ],
  },
]);

export default routes;
```

The parent asks the current authorization Client for the same resource/action pairs declared on its children. `useAuthorizationRevision()` causes permission invalidation to reload visibility. Opening the exact parent URL redirects only after access is ready; direct child and unknown URLs are never rewritten.

```tsx
// client/pages/audit-log/index.tsx
import { useService } from '@nocobase/app-client';
import {
  authorizationClientToken,
  useAuthorizationRevision,
  type AuthorizationClient,
} from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useState, type ReactElement } from 'react';
import {
  matchPath,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
  useResolvedPath,
} from 'react-router';

import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs.js';

type AuditLogTab = 'overview' | 'activity';

interface AuditLogTabDefinition {
  readonly value: AuditLogTab;
  readonly labelKey: string;
  readonly resource: { readonly type: string; readonly id: string };
  readonly action: string;
}

const AUDIT_LOG_TABS: readonly AuditLogTabDefinition[] = [
  {
    value: 'overview',
    labelKey: 'auditLog.tabs.overview',
    resource: { type: 'page', id: 'audit-log-overview' },
    action: 'access',
  },
  {
    value: 'activity',
    labelKey: 'auditLog.tabs.activity',
    resource: { type: 'page', id: 'audit-log-activity' },
    action: 'access',
  },
];

type TabsAccessState =
  | { readonly revision: number; readonly status: 'loading' }
  | {
      readonly revision: number;
      readonly status: 'ready';
      readonly tabs: readonly AuditLogTabDefinition[];
    }
  | { readonly revision: number; readonly status: 'error' };

async function loadAccessibleTabs(
  authorization: Pick<AuthorizationClient, 'can'>,
): Promise<readonly AuditLogTabDefinition[]> {
  const allowed = await Promise.all(
    AUDIT_LOG_TABS.map((tab) =>
      authorization.can({ resource: tab.resource, action: tab.action }),
    ),
  );
  return AUDIT_LOG_TABS.filter((_tab, index) => allowed[index] === true);
}

function useAccessibleTabs(): TabsAccessState {
  const authorization = useService(authorizationClientToken);
  const revision = useAuthorizationRevision();
  const [state, setState] = useState<TabsAccessState>({
    revision: -1,
    status: 'loading',
  });

  useEffect(() => {
    let current = true;
    const request = loadAccessibleTabs(authorization);
    request.then(
      (tabs) => {
        if (current) setState({ revision, status: 'ready', tabs });
      },
      () => {
        if (current) setState({ revision, status: 'error' });
      },
    );
    return (): void => {
      current = false;
    };
  }, [authorization, revision]);

  return state.revision === revision ? state : { revision, status: 'loading' };
}

function isAuditLogTab(value: unknown): value is AuditLogTab {
  return value === 'overview' || value === 'activity';
}

export default function AuditLogPage(): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-audit-log');
  const access = useAccessibleTabs();
  const [navigationFailed, setNavigationFailed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const parentPath = useResolvedPath('.');
  const isParentEntry = Boolean(
    matchPath({ path: parentPath.pathname, end: true }, location.pathname),
  );
  const childMatch = matchPath(
    { path: `${parentPath.pathname}/:tab`, end: true },
    location.pathname,
  );
  const activeTab = isAuditLogTab(childMatch?.params.tab)
    ? childMatch.params.tab
    : null;

  if (access.status === 'loading') {
    return <p>{t('auditLog.loading')}</p>;
  }
  if (access.status === 'error' || navigationFailed) {
    return <p role='alert'>{t('auditLog.accessError')}</p>;
  }
  if (access.tabs.length === 0) {
    return <p>{t('auditLog.noAccess')}</p>;
  }
  if (isParentEntry) {
    return (
      <Navigate
        replace
        to={{ pathname: access.tabs[0].value, search: location.search }}
      />
    );
  }

  const selectTab = (value: unknown): void => {
    if (!isAuditLogTab(value)) return;
    if (!access.tabs.some((tab) => tab.value === value)) return;
    Promise.resolve(navigate({ pathname: value, search: location.search })).catch(
      () => setNavigationFailed(true),
    );
  };

  return (
    <section className='space-y-6'>
      <header>
        <h1 className='text-2xl font-semibold'>{t('auditLog.title')}</h1>
      </header>
      <Tabs value={activeTab} onValueChange={selectTab}>
        <TabsList aria-label={t('auditLog.tabs.label')}>
          {access.tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {t(tab.labelKey)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <Outlet />
    </section>
  );
}
```

The child modules default-export their content and do not add a second Tabs root. Keep their Server calls protected independently of these Client access checks.

## Behavior test for redirect, query, and access fallback

Render the page with `renderWithApp()` from `@nocobase/app-testing/client`, declared in `devDependencies` together with `@testing-library/react` and `@testing-library/user-event`, in a Vitest project that runs `tests/client/` under jsdom (`createReactVitestConfig()` from `@nocobase/dev-config/vitest/react`). It starts a real client application around the page, so `useService()`, the API client and `useTranslation()` are the real implementations rather than a `vi.mock('@nocobase/app-client')`. Translations are strict: a misspelt key, or one the locale file lacks, fails the render instead of showing the key.

The page's `t()` calls need these keys. This is the `en-US.ts` from [internationalization](i18n.md) with an `auditLog` group added:

```ts
// client/locales/en-US.ts
import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  navigation: { auditLog: 'Audit logs' },
  errors: { notFound: 'Audit log {{id}} was not found' },
  auditLog: {
    title: 'Audit logs',
    loading: 'Loading audit logs…',
    accessError: 'The audit logs could not be loaded.',
    noAccess: 'You cannot open any audit log views.',
    tabs: { label: 'Audit logs', overview: 'Overview', activity: 'Activity' },
  },
};

export type AuditLogResource = LocaleResource<typeof enUS>;
export default enUS;
```

Nothing in the test is mocked. `services` registers the authorization plugin's real `AuthorizationClient`, and `answerApi()` answers the one request it sends, `GET authorization/permissions`:

```tsx
// tests/client/audit-log-page.test.tsx
import { apiClientToken } from '@nocobase/app-client';
import {
  AuthorizationClient,
  authorizationClientToken,
  type AuthorizationSnapshot,
} from '@nocobase/app-plugin-authorization/client';
import {
  answerApi,
  renderWithApp,
  type ApiCall,
} from '@nocobase/app-testing/client';
import { screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { Outlet, Route, Routes, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import enUS from '../../client/locales/en-US.js';
import AuditLogPage from '../../client/pages/audit-log/index.js';

const NAMESPACE = '@nocobase/app-plugin-audit-log';

/** What `GET authorization/permissions` answers for the signed-in user. */
let snapshot: AuthorizationSnapshot;
const api = vi.fn((call: ApiCall) =>
  call.method === 'GET' && call.path === 'authorization/permissions'
    ? { data: snapshot }
    : new Response(null, { status: 404 }),
);

function pagePermission(
  id: string,
): AuthorizationSnapshot['permissions'][number] {
  return { resource: { type: 'page', id: `audit-log-${id}` }, actions: ['access'] };
}

function LocationProbe(): ReactElement {
  const location = useLocation();
  return (
    <output data-testid='location'>
      {location.pathname}
      {location.search}
    </output>
  );
}

function AuditRoutes(): ReactElement {
  return (
    <Routes>
      <Route
        element={
          <>
            <LocationProbe />
            <Outlet />
          </>
        }
      >
        <Route path='/audit-log' element={<AuditLogPage />}>
          <Route path='overview' element={<p>Overview panel</p>} />
          <Route path='activity' element={<p>Activity panel</p>} />
        </Route>
      </Route>
    </Routes>
  );
}

async function renderAt(route: string): Promise<void> {
  await renderWithApp(<AuditRoutes />, {
    route,
    namespace: NAMESPACE,
    // The plugin's own locale file, read strictly: a key it lacks fails the render.
    namespaces: { [NAMESPACE]: enUS },
    // The real authorization client, without the authorization plugin's session providers.
    services: (app) =>
      app.container.singleton(
        authorizationClientToken,
        (resolver) => new AuthorizationClient(resolver.resolve(apiClientToken)),
      ),
    fetch: answerApi(api),
  });
}

describe('AuditLogPage', () => {
  beforeEach(() => {
    api.mockClear();
    snapshot = { unrestricted: true, permissions: [] };
  });

  it('redirects the exact parent to the first accessible Tab and preserves its query', async () => {
    snapshot = {
      unrestricted: false,
      permissions: [pagePermission('activity')],
    };

    await renderAt('/audit-log?source=menu');

    expect(await screen.findByText('Activity panel')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/audit-log/activity?source=menu',
    );
    expect(
      screen.queryByRole('tab', { name: enUS.auditLog.tabs.overview }),
    ).not.toBeInTheDocument();
  });

  it('keeps an explicit child URL instead of redirecting it to the preferred Tab', async () => {
    await renderAt('/audit-log/activity?source=link');

    expect(await screen.findByText('Activity panel')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/audit-log/activity?source=link',
    );
    expect(
      screen.getByRole('tab', { name: enUS.auditLog.tabs.activity }),
    ).toHaveAttribute('data-active');
  });

  it('changes Tabs through navigation and preserves the query', async () => {
    const user = userEvent.setup();
    await renderAt('/audit-log/overview?source=menu');
    await screen.findByText('Overview panel');

    await user.click(screen.getByRole('tab', { name: enUS.auditLog.tabs.activity }));

    expect(await screen.findByText('Activity panel')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/audit-log/activity?source=menu',
    );
  });

  it('says so when no audit log Tab is accessible', async () => {
    snapshot = { unrestricted: false, permissions: [] };

    await renderAt('/audit-log');

    expect(await screen.findByText(enUS.auditLog.noAccess)).toBeInTheDocument();
    expect(api).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        path: 'authorization/permissions',
      }),
    );
  });
});
```

- Pass `plugins: [auditLog()]` instead of `namespaces` when the test should also run the plugin's own service providers and load its locales from the plugin declaration. A plugin that is not passed registers nothing.
- `services` registers a stand-in in place of a plugin. Here it registers the real authorization client without the authorization plugin's React providers, which wait for a signed-in session.
- With neither `fetch` nor `server`, every request the page sends fails. A handler given to `answerApi()` should answer every branch explicitly, as the `404` above does: a handler that returns nothing answers `200` with a `null` body.
- `useToaster()` is a test toaster. Read its messages through `toasts()` on the value `renderWithApp()` resolves to.

The host Route renderer remains responsible for enforcing each child's declared `authz` before loading that child. Add a target App integration test for denied direct URLs because this focused component test intentionally exercises only the parent's selection and redirect behavior.
