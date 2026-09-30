# AGENTS.md

This is a NocoBase application plugin: a package published to a registry and installed into an application someone else assembled. That makes it a guest, and most of the rules below follow from it.

## Adding a dependency

Where a package goes depends on who has to resolve the import, and there are three different answers.

| The import is reached from                  | Declare it in                                |
| ------------------------------------------- | -------------------------------------------- |
| `server/` or `database/`, at runtime        | `dependencies`                               |
| `client/`, as a value import                | `peerDependencies`                           |
| `registry/`                                 | nothing — the application compiles it        |
| Tests, build scripts, or `import type` only | `devDependencies`                            |

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

## Contributing CLI commands

A plugin can add commands to an application's `pnpm nocobase`, and can ask an application to run a command during its `pnpm build` or `pnpm dev`. Both are declared in `cli/index.ts` through `defineCliPlugin`, and the `cli` capability generates that entry with one example command.

A command extends `AppCommand` from `@nocobase/app-cli`: it returns its result, throws `CommandError` on failure, and gets `--json` for free. By default a command is static tooling that reads and writes files and packages. One that needs the application creates it with `this.withApp(async ({ app }) => …)`, which always shuts it down again, and calls `app.start()` only when it needs every provider running. Work users trigger while the application serves is a server route or a job, not a command. The `nocobase-plugin-development` Skill's CLI reference has the full contract.

Build and dev hooks are for a plugin that has to produce something before the application can run. Declaring the step here rather than in each application's build script is what keeps it correct: it appears only where this plugin is registered, and disappears with it.

```ts
buildHooks: {
  afterServerBuild: [{ label: 'Build artifacts', command: ['pnpm', 'nocobase', '<topic>', 'build'] }],
},
```

A hook command is any executable with its arguments, already split — no shell, so no quoting to get right, and no `&&` or pipes. The stage names say what exists when the hook runs: `beforeBuild` (empty `dist`), `afterClientBuild` (`dist/client`), `afterServerBuild` (`+ dist/server`), `afterBuild` (the installed deployment tree), and `beforeDev` for `pnpm dev`.

## Before you finish

```bash
pnpm --filter <this-package> lint
pnpm --filter <this-package> typecheck
pnpm --filter <this-package> test
pnpm --filter <this-package> build
```

Every server route owns and tests its own authentication and authorization boundary; mounting under `/api` authenticates nothing. Keep declarations, exports, dependencies, tests, README, and Plugin Skills aligned when capabilities change.

The repository root `AGENTS.md` covers the rest — package publishing, test layout, migrations, and the reasoning behind the rules summarized here.

## Migrations and seeds

A plugin's migrations and seeds live at `database/migrations` and `database/seeds`, declared in `server/plugin.ts`:

```ts
database: {
  migrations: './database/migrations',
  seeds: './database/seeds',
},
```

They are not laid out the way an application's are. An application puts them under `database/<connection>/`, one directory per configured connection. A plugin declares one set with no connection segment, because a plugin's tasks run against the installing application's default connection and only that one: it cannot know which additional connections an application defines, and cannot target one.

Two consequences follow, and both surface in someone else's application rather than here.

**A migration name must be unique across the whole application.** The runner flattens every source — the application's own directory and each registered plugin's — and rejects a duplicate name outright, which fails the run for everyone rather than only for the plugin that introduced it. Derive names from this package instead of using a bare timestamp.

**Ordering is by name across all sources.** Migrations from this plugin and from the application interleave in plain name order; they are not grouped by owner and this plugin's are not applied as a block. A migration here cannot assume anything an application's own migrations created, and the application's cannot assume this plugin's.

Execution history records this package name alongside each migration, so history stays attributable per plugin even though the run is shared.

How to write the files themselves — self-contained, immutable once merged, `builder` for structure and `query` for data — is in the repository root `AGENTS.md`.

## Server resource base and database builds

Every Server plugin declaration requires an absolute `baseDir`. In `server/plugin.ts`, calculate it with `path.resolve(import.meta.dirname, '..')` using `node:path`. Migrations, Seeds, and Jobs resolve only relative to this directory; the same declaration under `dist/server` resolves compiled resources. Keep source and published exports aligned.

After compiling database tasks and finishing JavaScript rewriting, run `nocobase-db-manifests` from `@nocobase/dev-config`. Publish the generated `.manifest.json` alongside the marked JavaScript in each migrations and seeds directory. Do not edit historical migration sources or bypass checksums to accommodate compilation differences.

The application must explicitly provide required shared server peers in its production dependencies because deployment disables automatic peer installation. Peer ranges must be compatible; the declaration alone does not guarantee one module across incompatible installed versions.
