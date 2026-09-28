# Scaffolding and Package Contracts

Read this reference when creating a plugin, choosing capability ownership, or changing declarations, exports, and dependencies. It consolidates the original quick-start, development workflow, plugin structure, plugin declaration, and public contract guides.

## Scope and ownership

`plugin:create` creates a publishable package under `packages/plugins/app-plugin-<name>/` in the source workspace. It does not scaffold a standalone plugin project inside an installed App. For an existing plugin, inspect its manifest, declarations, public exports, tests, and target App composition before adding a capability.

Choose a lowercase kebab-case short name, check the destination and npm name for collisions, and identify the target App. The CLI defaults to `app-template-default`, but use the intended App explicitly when more than one is relevant. Follow repository publishing rules before reusing a name with historical releases.

| Requirement                              | Owner and entry                                           |
| ---------------------------------------- | --------------------------------------------------------- |
| Plugin-owned persistent schema           | Plugin `database/migrations/`                             |
| Required initial records                 | Plugin `database/seeds/`                                  |
| Business collections the App must supply | App source, with prerequisites in Plugin Skills           |
| Shared in-process behavior               | Plugin Service contract and original ServiceToken         |
| Browser-to-server calls                  | Public API Route                                          |
| Pages, Settings, or development tools    | Plugin `client/routes.ts`                                 |
| Reusable runtime UI                      | Plugin `client/components/` and deliberate public exports |
| Shared React context                     | Client React Provider                                     |
| Client service or startup initialization | Client ServiceProvider                                    |
| Asynchronous execution                   | Queue Job                                                 |
| App-owned editable UI source             | Registry item                                             |
| Agent integration knowledge              | Plugin `skills/`                                          |
| Application command                      | Plugin `cli/` and `./cli` export                          |

An App owns its page composition, business models, call sites, and permission configuration. A plugin owns its services, components, internal data, and lifecycle. Communicate through public exports, API endpoints, typed options, Registry items, and Plugin Skills; do not bypass private modules or internal tables.

## Select capabilities explicitly

| Capability                 | Generated foundation                                  |
| -------------------------- | ----------------------------------------------------- |
| `database`                 | Migration and seed directories with disabled examples |
| `server.service-providers` | Server Provider, Service, and Token                   |
| `server.routes`            | API/Root Route contribution structure                 |
| `server.jobs`              | Queue Job structure                                   |
| `server.locales`           | Server locale declaration/resources                   |
| `client.routes`            | Client Route contribution structure                   |
| `client.components`        | Plugin-owned React components                         |
| `client.service-providers` | Client Services and lifecycle                         |
| `client.react-providers`   | React context/wrapper contribution                    |
| `client.locales`           | Client locale declaration/resources                   |
| `cli`                      | CLI definition and command structure                  |
| `registry`                 | App-owned source delivery structure                   |
| `skills`                   | App-facing integration Skill draft                    |

Use repeatable `--with`; repeated capabilities are deduplicated. Use `--empty` for only a package foundation. Omitting both is an error. `--with all` is available when all capabilities are actually required; it is not a reason to generate unused modules. Locale capabilities are explicit: selecting Routes or Providers does not create locale resources.

```bash
pnpm plugin:create audit-log \
  --with client.routes \
  --with client.components \
  --with server.service-providers \
  --with server.routes \
  --with skills \
  --dry-run --json
```

JSON mode prints one document on stdout, success or failure, in the same envelope as `pnpm nocobase … --json`. Check `ok`, then read the plan under `result`: `requestedCapabilities`, `capabilities`, `files`, and the derived runtime entries. A dry run reports `status: "success-noop"` and has empty `writes` and `commands`. A failure still has a nonzero exit code; handle `error.code` and `error.suggestions`, rather than branching on human-readable messages. A checkout from before this envelope prints the plan at the top level, names itself `operation` rather than `command`, and writes a failure to stderr.

Apply the same selection without `--dry-run` when creation is in scope. `--no-install` separates generation from installation so a coordinated create/register workflow can install once. Follow the user's installation constraints; do not leave changed dependency declarations or a lockfile unsynchronized and call the task complete.

The scaffold creates inspectable wiring, not invented business behavior. Routes start as contribution structure, not fake pages or endpoints. Database `.ts.example` files do not execute; activate only the implementations the task requires. Replace Skill drafts with real integration instructions before delivery.

## File responsibilities

This is the union of possible capabilities, not a directory tree every plugin must contain.

| Path                                      | Responsibility                                             |
| ----------------------------------------- | ---------------------------------------------------------- |
| `client/index.ts`                         | Default export of the Client plugin factory                |
| `client/plugin.ts`                        | Static Client declaration                                  |
| `client/providers/index.ts`               | Default-exported `serviceProviders` constructor array      |
| `client/react-providers/`                 | React Provider declarations/implementations                |
| `client/routes.ts`                        | App, Settings, and Dev Route declarations                  |
| `client/pages/`                           | Lazy page modules                                          |
| `client/components/`                      | Plugin-owned components, including local shadcn source     |
| `client/locales/`                         | Lazy Client messages under the package namespace           |
| `server/index.ts`                         | Public Server definition and deliberate named exports      |
| `server/plugin.ts`                        | Static Server composition and absolute resource base       |
| `server/tokens.ts`                        | Public service contracts and Tokens                        |
| `server/providers/index.ts`               | Default-exported `serviceProviders` constructor array      |
| `server/services/`                        | Domain implementations                                     |
| `server/routes/`                          | Direct HTTP contributions                                  |
| `server/jobs/`                            | Queue Job definitions                                      |
| `server/locales/`                         | Lazy Server locale resources                               |
| `database/migrations/`, `database/seeds/` | Historical schema operations and initial records           |
| `cli/`                                    | Explicit CLI contribution and command modules              |
| `registry/`                               | Canonical source that becomes App-owned after installation |
| `skills/`                                 | Plugin-owned integration knowledge synchronized into Apps  |
| `tests/`                                  | Plugin behavior and integration tests                      |

## Static declarations and execution boundaries

Client contributions use `defineClientPlugin()` and produce a factory. The contribution fields are `serviceProviders`, `reactProviders`, `routes`, and `locales`, with typed options and `routeComponentOverrides` where needed; there is no plugin `config` contribution, separate Settings loader, or component contribution. A minimal Route plugin looks like this:

```ts
import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';

import routes from './routes.js';

const auditLog: AppClientPluginFactory = defineClientPlugin({
  packageName: '@nocobase/app-plugin-audit-log',
  routes,
});

export default auditLog;
```

Use typed options for stable per-registration choices; application-wide public browser configuration belongs in the target App's `client/config/`, and secrets stay on the Server. See [Client architecture](client.md) for options, Providers, and execution order.

Server contributions use `defineServerPlugin()` and produce a definition. A plugin with database resources declares the resource base explicitly:

```ts
import path from 'node:path';
import {
  defineServerPlugin,
  type AppServerPlugin,
} from '@nocobase/app-server/plugins';

const auditLog: AppServerPlugin = defineServerPlugin({
  packageName: '@nocobase/app-plugin-audit-log',
  baseDir: path.resolve(import.meta.dirname, '..'),
  database: {
    migrations: './database/migrations',
    seeds: './database/seeds',
  },
});

export default auditLog;
```

Every Server plugin needs `baseDir`, even without database resources. Server ServiceProviders and Routes are direct static contributions. Import `serviceProviders` from its aggregation module and use property shorthand; do not inline constructor arrays in declarations. Resource paths start with `./` and resolve relative to `baseDir`. See [database resources](database.md) for compiled locations and checksums.

Importing a declaration must not connect to a service, register listeners, start timers, render React, or execute a Job. Service registration happens during Provider lifecycle; the browser host renders `AppClientRoot` after startup; page components and locale messages load at leaf boundaries. App composition imports these declarations statically, so top-level effects would execute as soon as a composition root loads, outside any Provider lifecycle.

## Public exports and compatibility

| Consumer                      | Public contract                                                        |
| ----------------------------- | ---------------------------------------------------------------------- |
| Target App Client composition | `<package>/client`, a factory called with typed options                |
| Target App Server composition | `<package>/server`, a definition registered directly                   |
| Target App CLI composition    | `<package>/cli`, see [CLI plugins](cli.md)                             |
| Another Server plugin         | Stable Token/interface subpath owned by the providing plugin           |
| Another Client module         | Deliberate component, hook, or factory subpath                         |
| Browser                       | Documented Route method/path, input, response, errors, and permissions |

Keep source and publish exports paired. A public Client entry uses this shape:

```json
{
  "exports": {
    "./client": {
      "types": "./client/index.ts",
      "import": "./client/index.ts"
    }
  },
  "publishConfig": {
    "access": "public",
    "exports": {
      "./client": {
        "types": "./dist/client/index.d.ts",
        "import": "./dist/client/index.js"
      }
    }
  }
}
```

Apply the same pairing to Server, CLI, and intentional public subpaths. A source file's existence is not a public contract; avoid wildcard deep imports. Removing a capability requires removing its declarations, both export mappings, unused dependencies/scripts, tests, and documentation together.

Define a Service interface and its original Token in the owning plugin. Describe behavior, return types, errors, idempotency, lifecycle, and required call context without exposing uncommitted implementation details. HTTP contracts include method, base path, validation, identity, status codes, and stable error codes; translatable errors preserve `code/ns/key/params`. Route component overrides replace a page without redeclaring its Route.

Treat changed public names, paths, inputs, outputs, options, and permissions as compatibility changes. Update behavior tests and Plugin Skills, and follow repository changeset rules for publishable output. Internal refactoring should not force App callers to import new private paths.

## Development and publishing configuration

Keep the configuration emitted by `plugin:create`: browser-only libraries use `client-library` without a Node runtime requirement; Server libraries use `server-library` and Node lint rules; full-stack libraries add DOM/JSX locally. Use `@nocobase/dev-config` rather than copied full configurations. Published declaration libraries follow the repository's explicit exported-type annotations and `isolatedDeclarations` requirements.

| Import usage                                                      | Manifest location                                                  |
| ----------------------------------------------------------------- | ------------------------------------------------------------------ |
| Host runtime, Token, React context, singleton, or shared identity | `peerDependencies`                                                 |
| Plugin Client value import, including dynamic imports             | `peerDependencies`                                                 |
| Ordinary Server/database/CLI implementation at runtime            | `dependencies`, except shared peers                                |
| Tests, build tools, or erased types that consumers never resolve  | `devDependencies`                                                  |
| Types retained in published declarations                          | Consumer-resolvable dependency or peer contract                    |
| Registry source compiled only after copying into an App           | Registry item dependency contract, not plugin runtime dependencies |

Use `catalog:` for shared catalog packages and `workspace:` for internal packages as required by the repository. Mark peers optional only when a consumer legitimately does not need them. A client peer is not optional merely because a Server deployment omits client tooling. Dependency edits require the coordinated package-manager install and lockfile update.

Every package under `packages/` is publishable: use the required public metadata, `files`, changelog, and initial version policy. Runtime code ships from `dist`; do not also publish source `server/` or `database/` directories that can shadow compiled resources. Publish `skills/` and Registry artifacts only when provided. Build checksum manifests for emitted migrations/seeds as described in [database resources](database.md).

## Delivery sequence

Implement the required data model, service contract and Provider, HTTP/Job boundary, Client behavior, locales, and integration knowledge in dependency order. Registry source is needed only when the App should own editable UI. Keep implementation, declarations, exports, dependencies, published files, tests, README, and Plugin Skills aligned throughout.

Continue with [registration](registration.md) when target App integration is requested and [testing](testing.md) for completion checks. The capability source (`packages/tools/create-plugin/src/lib/capabilities.ts`) and generator templates (`packages/tools/create-plugin/template`) are authoritative when extending the scaffold itself.
