# Client Service, Context, and Routed Tabs Examples

Use these examples when the shorter Client references do not show enough implementation detail. They follow the current `ClientApplication`, authorization Client, React Router, and shadcn/base-nova APIs on `develop`; adapt package names, resource identities, copy, and event topics to the owning plugin.

## Application-scoped Client service with typed options

This example registers one lazy service, configures a Refine resource during `boot()`, subscribes only after Client startup has finalized its render configuration, and releases the subscription during reverse shutdown. It resolves the host Realtime Client instead of opening a second connection.

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

The Provider constructor receives the exact options stored by `defineClientPlugin()`. Refine mutation is valid only while a Provider lifecycle hook owns the current contribution context; code outside those hooks reads `app.refineConfig` instead.

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

  public override boot(): Promise<void> {
    this.app.refine.addResources([{ name: 'audit-logs', list: '/audit-logs' }]);
    return Promise.resolve();
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

## URL-controlled Settings Tabs with child access

Generate `tabs` into this plugin before using the next page:

```bash
cd packages/plugins/app-plugin-audit-log
pnpm exec shadcn add tabs
```

Keep the generated primitives in `client/components/ui/`, then replace their `@/` runtime imports with explicit relative `.js` imports. The page below intentionally imports the plugin-owned primitive; a compiled plugin must not import the target App's private `@/components/ui/tabs` path.

```ts
// client/routes.ts
import { defineSettingsRoutes } from '@nocobase/app-client/plugins';

const routes = defineSettingsRoutes([
  {
    name: 'audit-log',
    path: '/audit-log',
    navigation: { title: 'navigation.auditLog' },
    authz: { resource: { type: 'audit.settings', id: 'page' }, action: 'read' },
    componentLoader: () => import('./pages/settings/index.js'),
    children: [
      {
        name: 'general',
        path: 'general',
        authz: {
          resource: { type: 'audit.settings', id: 'general' },
          action: 'read',
        },
        componentLoader: () => import('./pages/settings/general.js'),
      },
      {
        name: 'retention',
        path: 'retention',
        authz: {
          resource: { type: 'audit.settings', id: 'retention' },
          action: 'read',
        },
        componentLoader: () => import('./pages/settings/retention.js'),
      },
    ],
  },
]);

export default routes;
```

The parent asks the current authorization Client for the same resource/action pairs declared on its children. `useAuthorizationRevision()` causes permission invalidation to reload visibility. Opening the exact parent URL redirects only after access is ready; direct child and unknown URLs are never rewritten.

```tsx
// client/pages/settings/index.tsx
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

type AuditSettingsTab = 'general' | 'retention';

interface AuditSettingsTabDefinition {
  readonly value: AuditSettingsTab;
  readonly labelKey: string;
  readonly resource: { readonly type: string; readonly id: string };
  readonly action: string;
}

const SETTINGS_TABS: readonly AuditSettingsTabDefinition[] = [
  {
    value: 'general',
    labelKey: 'settings.tabs.general',
    resource: { type: 'audit.settings', id: 'general' },
    action: 'read',
  },
  {
    value: 'retention',
    labelKey: 'settings.tabs.retention',
    resource: { type: 'audit.settings', id: 'retention' },
    action: 'read',
  },
];

type TabsAccessState =
  | { readonly revision: number; readonly status: 'loading' }
  | {
      readonly revision: number;
      readonly status: 'ready';
      readonly tabs: readonly AuditSettingsTabDefinition[];
    }
  | { readonly revision: number; readonly status: 'error' };

async function loadAccessibleTabs(
  authorization: Pick<AuthorizationClient, 'can'>,
): Promise<readonly AuditSettingsTabDefinition[]> {
  const allowed = await Promise.all(
    SETTINGS_TABS.map((tab) =>
      authorization.can({ resource: tab.resource, action: tab.action }),
    ),
  );
  return SETTINGS_TABS.filter((_tab, index) => allowed[index] === true);
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

function isAuditSettingsTab(value: unknown): value is AuditSettingsTab {
  return value === 'general' || value === 'retention';
}

export default function AuditLogSettingsPage(): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-audit-log');
  const access = useAccessibleTabs();
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
  const activeTab = isAuditSettingsTab(childMatch?.params.tab)
    ? childMatch.params.tab
    : null;

  if (access.status === 'loading') {
    return <p>{t('settings.loading')}</p>;
  }
  if (access.status === 'error') {
    return <p role='alert'>{t('settings.accessError')}</p>;
  }
  if (access.tabs.length === 0) {
    return <p>{t('settings.noAccess')}</p>;
  }
  if (isParentEntry) {
    return (
      <Navigate
        replace
        to={{ pathname: access.tabs[0].value, search: location.search }}
      />
    );
  }

  const selectTab = async (value: unknown): Promise<void> => {
    if (!isAuditSettingsTab(value)) return;
    if (!access.tabs.some((tab) => tab.value === value)) return;
    await navigate({ pathname: value, search: location.search });
  };

  return (
    <section className='space-y-6'>
      <header>
        <h1 className='text-2xl font-semibold'>{t('settings.title')}</h1>
      </header>
      <Tabs value={activeTab} onValueChange={selectTab}>
        <TabsList aria-label={t('settings.tabs.label')}>
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

Render the page with `renderWithApp()` from `@nocobase/app-testing/client`, declared in `devDependencies` together with `@testing-library/react`, in a Vitest project that runs `tests/client/` under jsdom (`createReactVitestConfig()` from `@nocobase/dev-config/vitest/react`). It starts a real client application around the page, so `useService()`, the API client and `useTranslation()` are the real implementations rather than a `vi.mock('@nocobase/app-client')`. Translations are strict: a misspelt key, or one the locale file lacks, fails the render instead of showing the key.

The page's `t()` calls need these keys. This is the `en-US.ts` from [internationalization](i18n.md) with a `settings` group added:

```ts
// client/locales/en-US.ts
import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  navigation: { auditLog: 'Audit logs' },
  errors: { notFound: 'Audit log {{id}} was not found' },
  settings: {
    title: 'Audit log settings',
    loading: 'Loading settings…',
    accessError: 'The settings could not be loaded.',
    noAccess: 'You cannot open any audit log settings.',
    tabs: { label: 'Settings', general: 'General', retention: 'Retention' },
  },
};

export type AuditLogResource = LocaleResource<typeof enUS>;
export default enUS;
```

Nothing in the test is mocked. `services` registers the authorization plugin's real `AuthorizationClient`, and `answerApi()` answers the one request it sends, `GET authorization/permissions`:

```tsx
// tests/client/audit-log-settings-page.test.tsx
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
import type { ReactElement } from 'react';
import { Outlet, Route, Routes, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import enUS from '../../client/locales/en-US.js';
import AuditLogSettingsPage from '../../client/pages/settings/index.js';

const NAMESPACE = '@nocobase/app-plugin-audit-log';

/** What `GET authorization/permissions` answers for the signed-in user. */
let snapshot: AuthorizationSnapshot;
const api = vi.fn((call: ApiCall) =>
  call.method === 'GET' && call.path === 'authorization/permissions'
    ? { data: snapshot }
    : new Response(null, { status: 404 }),
);

function settingsPermission(
  id: string,
): AuthorizationSnapshot['permissions'][number] {
  return { resource: { type: 'audit.settings', id }, actions: ['read'] };
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

function SettingsRoutes(): ReactElement {
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
        <Route path='/settings/audit-log' element={<AuditLogSettingsPage />}>
          <Route path='general' element={<p>General panel</p>} />
          <Route path='retention' element={<p>Retention panel</p>} />
        </Route>
      </Route>
    </Routes>
  );
}

async function renderAt(route: string): Promise<void> {
  await renderWithApp(<SettingsRoutes />, {
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

describe('AuditLogSettingsPage', () => {
  beforeEach(() => {
    api.mockClear();
    snapshot = { unrestricted: true, permissions: [] };
  });

  it('redirects the exact parent to the first accessible Tab and preserves its query', async () => {
    snapshot = {
      unrestricted: false,
      permissions: [settingsPermission('retention')],
    };

    await renderAt('/settings/audit-log?source=menu');

    expect(await screen.findByText('Retention panel')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/settings/audit-log/retention?source=menu',
    );
    expect(
      screen.queryByRole('tab', { name: enUS.settings.tabs.general }),
    ).not.toBeInTheDocument();
  });

  it('keeps an explicit child URL instead of redirecting it to the preferred Tab', async () => {
    await renderAt('/settings/audit-log/retention?source=link');

    expect(await screen.findByText('Retention panel')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/settings/audit-log/retention?source=link',
    );
    expect(
      screen.getByRole('tab', { name: enUS.settings.tabs.retention }),
    ).toHaveAttribute('data-active');
  });

  it('says so when no settings Tab is accessible', async () => {
    snapshot = { unrestricted: false, permissions: [] };

    await renderAt('/settings/audit-log');

    expect(await screen.findByText(enUS.settings.noAccess)).toBeInTheDocument();
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
