# @nocobase/app-plugin-modules

Open-source module registration, startup and client layout composition for NocoBase 3. Modules use the ordinary App plugin runtime and can run without a commercial management plugin. This package and `@nocobase/create-module` are source-workspace additions; their presence here does not imply a published release.

## Register modules

Register `@nocobase/app-plugin-modules/server` in the host's `defineServerPlugins()` list before business modules. In each module's Server provider, resolve `modulesServiceToken` from `@nocobase/app-plugin-modules/server` and call `register()` during `register()`, before database boot:

```ts
modules.register({
  id: 'samples',
  packageName: '@acme/app-module-samples',
  namespace: '@acme/app-module-samples',
  entry: '/modules/samples',
  icon: 'LayoutGrid',
  tone: 1,
  dependencies: [],
  async start(onStop) {
    // Start module-owned services here; register their cleanup with onStop().
  },
});
```

IDs are lowercase slugs of at most 40 characters. Entries stay under `/modules/<id>` and exclude the deployment base path. Dependencies name registered module IDs, not npm packages. Missing dependencies and cycles prevent startup. A package's manifest name, Server plugin name and registration `packageName` must match; custom npm scopes are supported.

Without management, registered modules start in dependency order after their database tasks finish. Startup fails if a module's required connection skips migrations or seeds. Cleanup runs in reverse order on shutdown or a failed start. No installation table, installation seed or `defaultInstalled` field belongs to the module definition.

Every business endpoint owns its authentication and authorization. Call `modules.requireAvailable(id)` before access and again when authorizing mutation replays; pass the transaction when checking an effectful operation. This readiness check does not grant business permissions.

## Database connections

The host owns credentials and `database.connections`. A module declares the connection names it contributes to in its Server plugin:

```ts
database: { connections: { main: {}, audit: {} } }
```

The runtime discovers `database/main/migrations`, `database/main/seeds`, `database/audit/migrations` and `database/audit/seeds` relative to the plugin's `baseDir`. All required connections must be configured by the host. Explicit directory overrides preserve older module task paths without changing executed migration/seed files. See the App Server database API for task planning and history validation.

## Client composition

Import `ModuleDescriptor` from `./shared` and `ModuleLayout`, `ModuleLayoutHost`, `ModulePage` and their types from `./client`. Each business module owns its routes, navigation and translations. `ModuleLayout` works with a basic semantic-token layout by default. A host may wrap its routes in `ModuleLayoutHost` to render its own shell. Include module source files in the host's Tailwind scanning. Neither a commercial catalogue nor a custom layout host is required for module registration.

## Optional management

A management provider may call `modules.setManagement(adapter)` once before readiness. The adapter implements database coordination, availability checks, readiness and shutdown. The commercial `@nocobase/app-plugin-multi-module` supplies persisted installation state, administrator operations, retries and audit UI through this interface; this package does not import it.

Register the management provider after this plugin and before readiness. The module provider owns the App's single database task coordinator; another coordinator must integrate through this adapter rather than replacing that token. Without an adapter, the standard App database plan runs unchanged.

## Verification

```bash
pnpm --filter @nocobase/app-plugin-modules check
```

Tests start a real OSS-only App with main and audit databases, exercise lifecycle order and cleanup, and reject incomplete database startup. Published exports contain the shared contracts and client/server entry points.
