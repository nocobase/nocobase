# Client Contributions

Use this reference when a plugin needs browser services, application-wide React context, public browser configuration, or a combination of Client contributions. Read [client-components.md](./client-components.md) for UI implementation, [client-routing.md](./client-routing.md) for pages, navigation, and route overrides, [client-examples.md](./client-examples.md) for complete ServiceProvider and React Context examples, and [i18n.md](./i18n.md) for translated resources.

## Choose the owning mechanism

| Requirement                                                        | Mechanism              |
| ------------------------------------------------------------------ | ---------------------- |
| Add an App, Settings, or development-only page                     | Client Route           |
| Share React Context across several Client surfaces                 | React Provider         |
| Register an application-scoped browser service or configure Refine | Client ServiceProvider |
| Export reusable UI or Hooks                                        | Component export       |
| Declare translations owned by the plugin                           | Client locale manifest |
| Configure one plugin registration with typed, stable values        | Plugin options         |
| Provide public deployment configuration to all Client code         | App Client config      |
| Deliver editable source into the target App                        | Plugin Registry item   |

A component named `SomethingProvider` is not automatically a ServiceProvider. A component that wraps the React tree belongs in `reactProviders`; a class that participates in the application Container and lifecycle belongs in `serviceProviders`.

## Declare Client contributions statically

Keep `client/plugin.ts` a small, side-effect-free declaration. Import contribution declarations statically so composition can read them, while keeping page modules and each locale module lazy at their leaf loaders.

```ts
import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';

import locales from './locales/index.js';
import serviceProviders from './providers/index.js';
import reactProviders from './react-providers/index.js';
import routes from './routes.js';

export interface AuditLogClientOptions {
  readonly endpoint?: string;
}

const auditLog: AppClientPluginFactory<AuditLogClientOptions> =
  defineClientPlugin({
    packageName: '@nocobase/app-plugin-audit-log',
    serviceProviders,
    reactProviders,
    routes,
    locales,
  });

export default auditLog;
```

The target App enables the plugin explicitly and supplies options at registration:

```ts
import auditLog from '@nocobase/app-plugin-audit-log/client';
import { defineClientPlugins } from '@nocobase/app-client/plugins';

export default defineClientPlugins([auditLog({ endpoint: '/api/auditLogs' })]);
```

Static import does not instantiate a ServiceProvider, render a React Provider, load a page, or load locale messages. `ClientApplication.start()` runs ServiceProvider lifecycle; after startup the Browser host renders `AppClientRoot`; navigation invokes a route's `componentLoader()`; the i18n runtime invokes the selected locale loader.

Plugin options are typed configuration for one registration. They may feed a synchronous contribution factory, but they must not contain secrets or mutable process state:

```tsx
export const reactProviders = (options: AuditLogClientOptions) =>
  defineClientReactProviders([
    {
      name: 'audit-log',
      component: createAuditLogProvider(options.endpoint ?? '/api/auditLogs'),
    },
  ]);
```

Public deployment configuration belongs to the target App's `client/config/*.ts`, is assembled with the runtime's public JSON payload, and is read through `app.config.get()`. A server value the browser needs is listed in `public` of that section's server `defineAppConfig` and read through `app.config.public.get()` at the same path; `app.config.get()` never returns it. Declare those fields by augmenting `PublicAppConfig` from `@nocobase/app-client`, which is what makes the path and value type-checked. Neither Client config nor plugin options may contain server credentials; expose only the minimum protected data through a Server API.

## Client ServiceProviders

Use a Client ServiceProvider for Container registrations, Refine configuration, connections, listeners, timers, and cleanup that belongs to the application lifecycle. Keep page-local loading and state in React.

```ts
import { ClientApplication } from '@nocobase/app-client';
import { ServiceProvider } from '@nocobase/service-provider';

export class AuditLogServiceProvider extends ServiceProvider<ClientApplication> {
  public readonly name: string = '@nocobase/app-plugin-audit-log/client';

  public override register(): void {
    this.app.container.singleton(auditLogToken, () => createAuditLogService());
  }

  public override boot(): Promise<void> {
    this.app.refine.addResources([{ name: 'audit-logs', list: '/audit-logs' }]);
    return Promise.resolve();
  }

  public override shutdown(): Promise<void> {
    this.app.container.resolveIfCreated(auditLogToken)?.close();
    return Promise.resolve();
  }
}
```

Export constructors from the contribution module rather than wrapping them in dynamic imports:

```ts
import type { ClientServiceProviderConstructor } from '@nocobase/app-client/plugins';

import { AuditLogServiceProvider } from './audit-log.js';

const serviceProviders: readonly ClientServiceProviderConstructor[] = [
  AuditLogServiceProvider,
];

export default serviceProviders;
```

The startup sequence is `register all → boot all → finalize Refine and render configuration → validate Runtime → start all → ready all`. Startup failure and `app.shutdown()` clean up Providers in reverse order. `app.refine` is valid only inside the owning lifecycle hook; code outside lifecycle reads the finalized `app.refineConfig`.

React code resolves application services with `useService(token)` or the HTTP client with `useApiClient()`. Non-React code resolves a token from the application Container or receives the service explicitly. Read the shared [Client API reference](client-api.md) for configured base paths, requests, uploads, cancellation, errors, and remote Repository operations.

## React Providers

Use a React Provider when multiple pages or other Client surfaces consume the same React Context. Use page-local state when only one page needs it.

```tsx
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

Plugins may contribute only to the `extension` layer; omitting `layer` selects it automatically. `root` and `application` belong to the App. `before` and `after` express real same-layer dependencies and must contain complete plugin-qualified IDs in the form `<packageName>:<providerName>`. Missing targets, cross-layer dependencies, and cycles are rejected.

The declaration module must not access the DOM, issue a request, start a timer, or install a listener. React effects belong inside the Provider component with cleanup; work that must start independently of rendering belongs in a ServiceProvider.

## Dependency and module boundaries

Client value imports in a published plugin belong in `peerDependencies`, including `@nocobase/app-client`, `@nocobase/i18n`, `@nocobase/service-provider`, React, and the runtime packages imported by generated shadcn components. This gives the target application one shared runtime identity and avoids installing browser dependencies in a server-only deployment. Build and test tooling belongs in `devDependencies`; a type-only dependency that survives in published declarations must still be consumer-resolvable, normally through `peerDependencies`.

Use `workspace:^` for internal NocoBase peers and `catalog:` for shared catalog dependencies unless a deliberate wider peer range is required. If a dependency changes, follow the repository install and lockfile rules; do not edit only `package.json`.

Published ESM code must use explicit relative `.js` specifiers for internal imports. The target App's `@/` alias and a plugin's TypeScript `paths` setting do not rewrite import specifiers in compiled plugin JavaScript.

## Verification

Verify each changed layer at the layer that owns the behavior:

- Test declaration factories with representative plugin options and assert stable names, layers, ordering, routes, and locale manifests.
- Test ServiceProvider registration, lifecycle order, failure cleanup, and finalized Refine configuration through `ClientApplication`.
- Render React Providers around a consumer and test Context, loading, error, cleanup, and repeat mounts.
- Run the plugin's focused `lint`, `typecheck`, `test`, and `build`, then run the target App checks when registration or composition changes.

For the current public contracts, consult the repository's app-client README (`packages/app/app-client/README.md`) and Client plugin definitions (`packages/app/app-client/src/plugins.ts`).
