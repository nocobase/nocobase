# AGENTS.md

This example owns the file and business migrations, concrete API routes and the
upload, preview and relation pages. Consume the core File Repository plugin only
through its public exports; register both plugins in the target App, core first.
Keep public documentation in English. The example exposes public routes.
Applications own authentication and authorization; Range and conditional
requests are not supported. Business relations are written through the owning
repository's write policy, never by editing file metadata directly.

This is a NocoBase application plugin: a package published to a registry and installed into an application someone else assembled. That makes it a guest, and most of the rules below follow from it.

## Adding a dependency

Where a package goes depends on who has to resolve the import, and there are three different answers.

| The import is reached from                  | Declare it in                         |
| ------------------------------------------- | ------------------------------------- |
| `server/` or `database/`, at runtime        | `dependencies`                        |
| `client/`, as a value import                | `peerDependencies`                    |
| `registry/`                                 | nothing — the application compiles it |
| Tests, build scripts, or `import type` only | `devDependencies`                     |

`pnpm deps:check` at the repository root enforces the server row and runs in CI.

### Why the client row is different

**A deployed server resolves its imports at runtime.** An application's `pnpm build` generates `dist/package.json` from `dependencies` and installs from it. A server import declared only as a devDependency resolves in every development checkout and is absent exactly once — on the deployed server, as a bare `Cannot find package` naming nothing that points back at this manifest.

**An installing application resolves your client imports at build time.** Your `client/` is not bundled by this plugin: `build` is `tsc`, so `dist/client/*.js` keeps its bare imports and the application's Vite build resolves them. That application has only what the published manifest declares, and npm does not publish `devDependencies` — so a client import left there fails with `Could not resolve "…"`. It will not fail here, because a workspace install links every devDependency into this plugin's own `node_modules`, which is why this mistake reaches a registry before anyone sees it.

**But that same server never requires a browser package.** Declaring one as a `dependency` would install it into every deployment, where nothing loads it.

`peerDependencies` is what satisfies both: the application installs one shared copy for its Vite build, while a deployment sets `autoInstallPeers: false` and installs none of them. One declaration is enough — pnpm installs and links a peer here, so this plugin's own lint, tests, and build resolve it without a second entry.

Do not mark such a peer `optional`. An optional peer is not auto-installed anywhere, including in the application that needs it, which is the failure this arrangement exists to prevent. `optional` means the consumer may legitimately not need the package at all.

So `hono` in `server/routes/` is a `dependency`, and `lucide-react` in `client/` is a peer. Shared runtime packages follow the peer rule below even in server code. A dynamic `import()` counts as a value import. A type-only import is erased from JavaScript but can survive in published declarations; if consumers must resolve it, declare the dependency or shared peer instead of relying on a devDependency.

`registry/` is the exception: it is source the application copies into itself and compiles there, against that application's own `react` and `@/` alias. This plugin never resolves those imports at all, so declaring them would claim dependencies it does not have.

### Prefer what the application already has

Before adding a client package, check whether `packages/templates/app-template-default` already declares it. Reusing that version means the application bundles one copy instead of resolving two, and it keeps this plugin from pinning a range the application then has to work around. Use `catalog:` for anything the repository catalog already names.

### Runtime packages are peers, never dependencies

`@nocobase/app-server`, `@nocobase/app-client`, `@nocobase/db`, `@nocobase/i18n`, `@nocobase/service-provider`, `@nocobase/queue`, `@nocobase/caching`, `@nocobase/ai-employee`, `@nocobase/authorization`, `@nocobase/repository-input`, and every other `@nocobase/app-plugin-*` carry process-wide state or host-owned contracts — service tokens compared by object identity, React contexts, the application's queue service. A second copy splits that state, and nothing warns: the install succeeds, the build succeeds, and at runtime a demonstrably registered service reports `Service "..." is not registered`.

Declare each as a `peerDependency` — the published compatibility contract requiring a host-provided package. One declaration is enough; pnpm installs a peer and links it into this package's own `node_modules`, so lint, tests, and the build resolve it without a second entry to keep in step. `pnpm peers:check` enforces the packages in its recorded list; review newly identified shared packages explicitly. The generator already emits this shape for the capabilities you selected.

## Before you finish

```bash
pnpm --filter <this-package> lint
pnpm --filter <this-package> typecheck
pnpm --filter <this-package> test
pnpm --filter <this-package> build
```

Every server route owns and tests its own authentication and authorization boundary; mounting under `/api` authenticates nothing. Keep declarations, exports, dependencies, tests, README, and Plugin Skills aligned when capabilities change.

The repository root `AGENTS.md` covers the rest — package publishing, test layout, migrations, and the reasoning behind the rules summarized here.
