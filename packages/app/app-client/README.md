# @nocobase/app-client

Browser application runtime for NocoBase v3. It provides the stateful
`ClientApplication`, application-scoped services, static Client plugin
composition, Refine integration, React tree composition, routes, locale
resources, and public runtime configuration.

## Architecture

```text
public HTML config + static declarations
                    ↓
          resolveAppRuntime()
                    ↓
          ClientApplication
          ├── config
          ├── ServiceContainer
          ├── ServiceProviders
          ├── Refine configuration
          └── React render configuration
                    ↓
          start() → host render()
```

The Client and Server use the same explicit `serviceProviders` term for
application services and lifecycle. Client React tree contributions are named
`reactProviders`, so they cannot be confused with ServiceProviders or with
Refine properties such as `authProvider` and `dataProvider`.

## Application runtime declaration

Startup-required declarations use static imports. Lazy loading belongs at leaf
boundaries such as route pages, locale messages, heavy SDKs, and truly optional
features.

```ts
import { createAppClientConfig } from '@nocobase/app-client';
import { defineAppRuntime } from '@nocobase/app-client/runtime';

import locales from './locales/index.js';
import plugins from './plugins.js';
import routeComponentOverrides from './route-overrides.js';
import serviceProviders from './providers/index.js';
import reactProviders from './react-providers/index.js';
import routes from './routes.js';

export default defineAppRuntime({
  packageName: '@example/app',
  config: createAppClientConfig,
  serviceProviders,
  reactProviders,
  routes,
  locales,
  plugins,
  routeComponentOverrides,
});
```

`plugins` is the complete value returned by `defineClientPlugins()`. Runtime
resolution collects its route component overrides automatically;
`routeComponentOverrides` contains only overrides owned by the application.

Static import makes the composition plan available to runtime resolution. It does not register a service, execute lifecycle hooks, render a React component, load a route page, or load locale messages. Declaration modules must therefore remain side-effect-free.

## Client entry

```tsx
import { AppClientRoot } from '@nocobase/app-client';
import { resolveAppRuntime } from '@nocobase/app-client/runtime';
import { createRoot } from 'react-dom/client';

import { createApp } from './app.js';
import appRuntime from './runtime.js';

const container = document.getElementById('root');
if (!container) throw new Error('Missing application root element.');
const root = createRoot(container);

const runtime = await resolveAppRuntime(appRuntime);
const app = createApp(runtime);

await app.start();
root.render(<AppClientRoot app={app} />);
```

`app.start()` performs the complete ServiceProvider lifecycle and finalizes the
Refine and render configuration. The Browser host owns the React root and
renders `AppClientRoot` only after startup succeeds. During disposal, the host
unmounts its React root and `app.shutdown()` shuts down providers in reverse
order.

`AppClientRoot` is a `BrowserRouter` around `AppClientProviders`, which mounts the application, its React providers and Refine around the routes. A test renders a page in `AppClientProviders` under a router of its own; `renderWithApp()` from `@nocobase/app-testing/client` does that for a started test application.

`new ClientApplication({ runtime, createRenderConfig, fetch })` sends the API client's requests through `fetch` instead of the global one. Production leaves it out; a test passes a server it runs in process. `resolveAppRuntime(definition, { i18n })` likewise runs the application on the i18n runtime it is given instead of building one from the locales; a test passes a strict one.

## ClientApplication

An application owns:

- the resolved Runtime;
- a read-only `app.config`;
- one application-scoped `ServiceContainer`;
- ServiceProvider instances and lifecycle state;
- the HTTP API client binding under `apiClientToken`;
- the WebSocket client binding under `realtimeClientToken`;
- mutable `app.refine` setters during Provider lifecycle;
- finalized `app.refineConfig` after startup;
- finalized React render configuration consumed by `AppClientRoot`.

The application owns a separate lazy realtime service under `realtimeClientToken`. By default,
its WebSocket endpoint is the `/ws` sibling of `api.baseURL`; deployments with
a different topology can set `api.realtimeURL` explicitly. Consumers that keep
durable state should use `onOpen()` to refetch after the initial connection and
reconnection. Topic events remain lightweight invalidation signals rather than
authoritative state.

Create an application directly when the default helper is sufficient:

```ts
import { createApp } from '@nocobase/app-client';

const app = createApp(runtime, (application) => {
  const { runtime, refineConfig } = application;
  return {
    basename: runtime.basename,
    reactProviders: runtime.reactProviders.map(({ component }) => component),
    routes: createRoutes(runtime.routes, refineConfig),
  };
});
```

The default template constructs `ClientApplication` directly because it adds
its own router and application-level i18n wrapper.

Resolve HTTP and WebSocket clients independently:

```ts
import { apiClientToken, realtimeClientToken } from '@nocobase/app-client';

const api = app.services.resolve(apiClientToken);
const realtime = app.services.resolve(realtimeClientToken);
type Order = { readonly id: string };

await api.request({ path: 'healthz' });
await api.repository<Order>('orders').findOne({
  filter: { id: 'order-1' },
});
const unsubscribe = realtime.subscribe('orders:changed', (event) => {
  console.log(event.payload);
});
```

`ApiClient` owns `request()`, `stream()`, and `repository()`. `RealtimeClient`
owns WebSocket connection lifecycle and subscriptions.

## ServiceProviders

Client ServiceProviders share `@nocobase/service-provider` with Server
applications:

```ts
import { ClientApplication } from '@nocobase/app-client';
import { ServiceProvider } from '@nocobase/service-provider';

export class AuditServiceProvider extends ServiceProvider<ClientApplication> {
  public readonly name: string = '@example/audit/client';

  public override register(): void {
    this.app.container.singleton(auditToken, () =>
      createAuditService(this.app.config),
    );
  }

  public override async boot(): Promise<void> {
    this.app.refine.setLiveProvider(createLiveProvider());
  }

  public override async shutdown(): Promise<void> {
    await this.app.container.resolve(auditToken).close();
  }
}
```

The lifecycle order inside `app.start()` is:

```text
register all
→ boot all
→ finalize Refine and render configuration
→ validate authenticated-route prerequisites and Runtime
→ start all
→ ready all
```

Startup failure triggers reverse cleanup for providers that entered lifecycle.
Async hooks retain the owning Provider context, so `this.app.refine` remains
valid across `await` while the hook is running. Outside Provider lifecycle,
read the finalized `app.refineConfig` instead of mutating `app.refine`.

React components and custom Hooks can obtain the application's HTTP client with `useApiClient()`:

```tsx
import { useApiClient } from '@nocobase/app-client';

const api = useApiClient();
```

This is a no-argument shorthand for `useService(apiClientToken)`. It returns the same application-scoped instance and requires application context; it does not create a client or manage request state. Non-React code continues to resolve the token from the application or receive the client explicitly.

Application components can resolve services through:

```tsx
import { useClientApplication, useService } from '@nocobase/app-client';

const app = useClientApplication();
const audit = useService(auditToken);
```

## Toasts

Code that reports a result, in a plugin or in the application, shows it through `useToaster()` and never through a toast library:

```tsx
import { useToaster } from '@nocobase/app-client';

const toaster = useToaster();

toaster.show({ type: 'success', title: t('orders.saved') });
```

`show` takes a `title` and, optionally, a `type` (`'success'`, `'info'`, `'warning'`, `'error'` or `'loading'`), a `description`, an `action` button, a `duration` in milliseconds (`0` keeps the toast open), an `id` and an `onClose` callback. Clicking the action runs its `onClick` and leaves the toast open. Showing a toast with the id of one still open replaces it, without running the replaced one's `onClose`. `show` returns the id, and `close(id)` closes the toast.

The contract says what a toast reports, not how it looks: where toasts appear, how long they stay by default and how assistive technology announces them are the application's decisions. The application makes them by registering a toaster service, a `Toaster`, under `toasterToken` from a client ServiceProvider's `register()`; the templates register one in `client/service-provider.ts` that forwards to the Base UI `Toaster` component their `client/react-providers.ts` mounts:

```ts
import { ClientApplication, toasterToken } from '@nocobase/app-client';
import { ServiceProvider } from '@nocobase/service-provider';

import { createToaster } from './lib/toaster.js';

export class DefaultClientServiceProvider extends ServiceProvider<ClientApplication> {
  public readonly name: string = '@example/app/client';

  public override register(): void {
    this.app.container.instance(toasterToken, createToaster());
  }
}
```

`@nocobase/app-client` registers none itself, because rendering toasts belongs to the application's UI. Without one, nothing throws: each toast is logged to the console instead, an error toast with `console.error`, and the first one says how to register a toaster. A page that reports something only through a toast then tells the user nothing, so an application with plugins registers one. `useToaster()` returns the same instance on every render, so it can be listed in hook dependencies. Outside React, `resolveToaster(app.services)` returns the same toaster, with the same fallback.

## Unsaved changes in dialogs

A dialog with a form asks "Discard unsaved changes?" before it closes (Escape, the backdrop, ×, Cancel) while the form holds input that has not been submitted. `@nocobase/app-client` keeps the state of that question so plugins that do not depend on each other ask it the same way; each plugin renders the question with its own UI.

```tsx
import {
  UnsavedChangesContext,
  useGuardedClose,
  useUnsavedChanges,
  useUnsavedChangesGuard,
} from '@nocobase/app-client';

function OrderDialog({ onClose }: { onClose: () => void }) {
  const guard = useUnsavedChangesGuard();
  const requestClose = useGuardedClose(guard, onClose);
  return (
    <Dialog open onOpenChange={(open) => !open && requestClose()}>
      <UnsavedChangesContext.Provider value={guard.scope}>
        <OrderForm onSaved={onClose} />
        <ConfirmDiscard open={guard.asking} onAnswer={guard.answer} />
      </UnsavedChangesContext.Provider>
    </Dialog>
  );
}

function OrderForm({ onSaved }: { onSaved: () => void }) {
  const [title, setTitle] = useState('');
  const markSaved = useUnsavedChanges(title.trim() !== '');
  // After a successful submit: markSaved(); onSaved();
}
```

Each form reports `useUnsavedChanges(dirty)`, where dirty means a field differs from what the form opened with, and calls the returned `markSaved()` before closing after a successful submit. A dialog that holds its form state itself passes `dirty` to `useUnsavedChangesGuard(dirty)` instead. A route dialog returns `guard.confirmDiscard()` from its `beforeClose`; a dialog held in component state closes through `useGuardedClose`. Outside a provider, `useUnsavedChanges` does nothing.

## React Providers

React Providers are synchronous React components that receive `children`:

```tsx
import {
  defineClientReactProviders,
  type AppClientReactProviderDefinition,
} from '@nocobase/app-client/plugins';

const reactProviders: readonly AppClientReactProviderDefinition[] =
  defineClientReactProviders([
    {
      name: 'audit-context',
      component: AuditContextProvider,
      layer: 'extension',
      after: ['theme'],
    },
  ]);

export default reactProviders;
```

React Providers are ordered outer-to-inner by layer and explicit `before`/`after`
constraints. Their components render only when the Browser host renders
`AppClientRoot` for a started application. Use a
Wrapper for React Context or tree-local UI behavior; use a ServiceProvider for
application services, Container bindings, Refine setup, connections, listeners,
and lifecycle cleanup.

## Routes and locale resources

Route definitions are static, while page components remain lazy:

```ts
import { defineAppRoutes } from '@nocobase/app-client/plugins';

export default defineAppRoutes([
  {
    name: 'audit-log',
    path: '/audit-log',
    auth: 'required',
    authz: { resource: { type: 'page', id: 'audit-log' }, action: 'access' },
    componentLoader: () => import('./pages/audit-log.js'),
  },
]);
```

Locale manifests are static, while each language module remains lazy:

```ts
export default {
  'en-US': () => import('./locales/en-US.js'),
  'zh-CN': () => import('./locales/zh-CN.js'),
};
```

Settings pages use `defineSettingsRoutes()`. Route component overrides replace
only a page component loader and keep the plugin-owned route identity, path,
authentication, navigation, and access metadata.

## Client plugin declaration

```ts
import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';

import locales from './locales/index.js';
import serviceProviders from './providers/index.js';
import reactProviders from './react-providers/index.js';
import routes from './routes.js';

export interface AuditClientOptions {
  readonly resourceLabel?: string;
}

const audit: AppClientPluginFactory<AuditClientOptions> = defineClientPlugin({
  packageName: '@example/app-plugin-audit',
  config: [auditClientConfig],
  serviceProviders,
  reactProviders,
  routes,
  locales,
});

export default audit;
```

The target application enables plugins explicitly:

```ts
import audit from '@example/app-plugin-audit/client';
import { defineClientPlugins } from '@nocobase/app-client/plugins';

export default defineClientPlugins([audit({ resourceLabel: 'Audit logs' })]);
```

Array order is contribution order. Plugin options are immutable registration
configuration; they are not deployment secrets or mutable global state.

## Public runtime configuration

Server-rendered SPA HTML contains a versioned JSON data block:

```html
<script id="nocobase-runtime-config" type="application/json">
  { "version": 1, "config": { "app": { "title": "NocoBase" } } }
</script>
```

`resolveAppRuntime()` reads and validates this payload, then passes its public
`config` value to the application config loader. It then executes the application
TypeScript configuration factory with the runtime and merges its defaults below
the public values. Services read the assembled configuration through
`app.config.get()`; `app.config` and `runtime.config` reference the same object.

Only public Browser configuration belongs in this payload. Server secrets must never be copied into the HTML data block, Client plugin options, or logs.

## Verification

```bash
pnpm --filter @nocobase/app-client lint
pnpm --filter @nocobase/app-client typecheck
pnpm --filter @nocobase/app-client test
pnpm --filter @nocobase/app-client build
```

After changing a public contract, also validate the default template and the
plugins that consume the changed fields.

## Authorization

Application authorization is provided by `@nocobase/app-plugin-authorization/client`. Use `useCan` for reactive visibility checks and `useAuthorizationClient` or `authorizationClientToken` for the current application client. `AppClientRefineConfig` excludes `accessControlProvider`, and the Refine registry has no `setAccessControlProvider` setter.

Client route authentication uses `auth: 'required' | 'guest' | 'optional'`. Authorization uses `authz: 'skip' | 'unrestricted' | { resource: { type, id }, action }`. Declare it on the first page of every path. A nested page that omits it inherits the effective value of its nearest ancestor page, through any number of groups and levels, and a child that declares its own value overrides it for its subtree. A first page that omits it never stops the application: protected `app` pages (`auth: 'required'`) and `settings` pages default to `'unrestricted'`, which admits only identities with unrestricted access such as root and hides the page from everyone else's menus, while `guest` and `optional` app pages and `dev` pages default to `'skip'`. Development builds log one warning per defaulted page naming its id, path and default; production logs nothing. `'unrestricted'` may also be declared explicitly for a root-only page, and it is never offered as a grant. `'skip'` applies only to the current page and does not bypass parent guards. Route groups cannot declare `authz`. Malformed values, the removed `access` field and string resource declarations are rejected.
