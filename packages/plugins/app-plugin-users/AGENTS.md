# AGENTS.md

This is a NocoBase application plugin: a package published to a registry and installed into an application someone else assembled. That makes it a guest, and most of the rules below follow from it.

## Adding a dependency

Where a package goes depends on where the code that imports it runs, not on what the package is for.

| The import is reached from                  | Declare it in      |
| ------------------------------------------- | ------------------ |
| `server/` or `database/`, at runtime        | `dependencies`     |
| `client/`, as a value import                | `peerDependencies` |
| Tests, build scripts, or `import type` only | `devDependencies`  |

`pnpm deps:check` at the repository root enforces the server row and runs in CI.

### Why server and client differ

They are deployed differently, and the split follows from that.

**Server code is deployed unbundled.** An application's `pnpm build` emits `dist/server` with its bare imports intact, generates `dist/package.json` by walking `dependencies`, and installs a `node_modules` beside it. That tree is what the deployed server resolves against, and `devDependencies` are not in it. A server import declared only as a devDependency resolves in every development checkout and is absent exactly once — on the deployed server, as a bare `Cannot find package` naming nothing that points back at this manifest.

**Client code is bundled by the application.** Your `client/` is compiled by the application's Vite build, which resolves those imports at build time and inlines them. Published client imports belong in `peerDependencies`: the application installs one shared copy, while server deployments disable automatic peer installation. A `dependencies` entry would instead install client-only packages into every server deployment.

So `hono` in `server/routes/` is a `dependency`, while `react`, `lucide-react`, `@base-ui/react`, and `cn` in `client/` are `peerDependencies`. Shared runtime packages follow the peer rule below even in server code. A dynamic `import()` counts as a value import. A type-only import is erased from JavaScript but can survive in published declarations; if consumers must resolve it, declare the dependency or shared peer instead of relying on a devDependency.

### Prefer what the application already has

Before adding a client package, check whether `packages/templates/app-template-default` already declares it. Reusing that version means the application bundles one copy instead of resolving two, and it keeps this plugin from pinning a range the application then has to work around. Use `catalog:` for anything the repository catalog already names.

### Runtime packages are peers, never dependencies

`@nocobase/app-server`, `@nocobase/app-client`, `@nocobase/db`, `@nocobase/i18n`, `@nocobase/service-provider`, `@nocobase/queue`, `@nocobase/caching`, `@nocobase/ai-employee`, `@nocobase/authorization`, `@nocobase/repository-input`, and every other `@nocobase/app-plugin-*` carry process-wide state or host-owned contracts — service tokens compared by object identity, React contexts, the application's queue service. A second copy splits that state, and nothing warns: the install succeeds, the build succeeds, and at runtime a demonstrably registered service reports `Service "..." is not registered`.

Declare each as a `peerDependency` — the published compatibility contract requiring a host-provided package. One declaration is enough; pnpm installs a peer and links it into this package's own `node_modules`, so lint, tests, and the build resolve it without a second entry to keep in step. `pnpm peers:check` enforces the packages in its recorded list; review newly identified shared packages explicitly.

## Before you finish

```bash
pnpm --filter <this-package> lint
pnpm --filter <this-package> typecheck
pnpm --filter <this-package> test
pnpm --filter <this-package> build
```

Every server route owns and tests its own authentication and authorization boundary; mounting under `/api` authenticates nothing. Keep declarations, exports, dependencies, tests, README, and Plugin Skills aligned when capabilities change.

The repository root `AGENTS.md` covers the rest — package publishing, test layout, migrations, and the reasoning behind the rules summarized here.
