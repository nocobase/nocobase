# Native Dependencies, Deployment Dependencies and Cross-Platform Builds

Read this before adding a native dependency, changing `allowBuilds`, deciding which dependency field a plugin or application import goes in for deployment, or touching the build scripts that produce `dist/`.

## Native Dependencies in Generated Applications

pnpm 11 does not run a dependency's install script unless the package is listed under `allowBuilds` in `pnpm-workspace.yaml`. That file is the only place the setting is read from: the `pnpm` field in `package.json` was removed in pnpm 11, and `.npmrc` has never carried build settings. A dependency that compiles a native addon and is missing from the list installs without building, `pnpm install` still reports success, and the failure surfaces much later as a runtime error that names nothing actionable — a native driver reports a missing bindings file or native module.

`@nocobase/create-app` writes this file into each application it generates. `ALLOWED_BUILDS` in `packages/tools/create-app/src/lib/pnpm-workspace.ts` is what it writes, and it mirrors the repository's own `pnpm-workspace.yaml` so an application and the monorepo decide the same packages the same way. `true` allows a script, `false` records that it is deliberately skipped; a package left undecided is worse than either answer, because pnpm stops the install with `ERR_PNPM_IGNORED_BUILDS` before anyone has written a line of code. A pure-JavaScript driver such as `pg` or `mysql2` belongs in neither column — it runs no install script, so an entry for it is noise in every generated project.

Do not put `pnpm-workspace.yaml` in `packages/templates/app-template-default`, and do not generate it there at pack time either. pnpm treats any directory holding that file as a workspace root, so a copy inside the package severs it from the monorepo: `pnpm list` stops resolving `workspace:` dependencies, and `pnpm pack` fails outright with `ERR_PNPM_CATALOG_ENTRY_NOT_FOUND_FOR_SPEC` because the package's `catalog:` ranges resolve against the nested file rather than the repository root. Copying the root catalog into the generated file does make `pack` succeed, but it duplicates the catalog into a second source of truth that silently goes stale.

When another native dependency needs the same treatment, add it to the root `pnpm-workspace.yaml` so the monorepo builds it, add the matching entry to `ALLOWED_BUILDS` so applications built from the template get it too, and cover it in `packages/tools/create-app/tests/pnpm-workspace.test.ts`.

`better-sqlite3` is a deliberate `false` in every one of these lists — the repository's own, `ALLOWED_BUILDS`, and the deployment `dist/pnpm-workspace.yaml` that `@nocobase/app-cli` writes. It ships prebuilt binaries for Linux (glibc and musl), macOS and Windows on x64 and arm64 and loads them before looking for a compiled one, so its implicit `node-gyp rebuild` compiles nothing on those platforms, yet still needs `make` and fails the entire install on a machine without a C++ toolchain, such as a slim Node.js image. Do not flip it back to `true` to fix a missing binding; that trades a failure on unsupported platforms for a failure on every machine without a compiler. `create-app` verifies `better-sqlite3` by loading it, because it is the one native addon a generated application is guaranteed to need, arriving through the `@nocobase/db-sqlite` every template depends on rather than being installed by name. On a platform with no matching prebuilt binary it stops with the remedy: install a toolchain, set the entry to `true`, and reinstall from an empty `node_modules`. `pnpm rebuild` is no remedy there — it skips a package whose build `allowBuilds` skips, and once pnpm has installed a package with its build skipped, flipping the entry does not make a later rebuild or install run it.

A separate failure mode is worth knowing for the builds that are allowed: `ignore-scripts=true` in a developer's npm configuration suppresses install scripts globally and outranks `allowBuilds`, so a correct `allowBuilds` still yields an uncompiled addon. `pnpm install` cannot repair this — the package is already in the store, so pnpm skips it and reports success without building. `pnpm rebuild <package>` does, and works without changing the developer's configuration.

### Declaring dependencies so they reach the right side

`pnpm build` emits a `dist/` that a server installs from its own `package.json`. What reaches that server is decided entirely by declarations — the build scans no code to choose packages and prunes no packages. `prune-dist-artifacts.mjs` removes only type declarations, third-party source maps and third-party documentation from the installed tree.

A plugin has three answers:

| The import is reached from                  | Declare it in      |
| ------------------------------------------- | ------------------ |
| `server/` or `database/`, at runtime        | `dependencies`     |
| `client/`, as a value import                | `peerDependencies` |
| Tests, build scripts, or `import type` only | `devDependencies`  |

The client row is the one worth understanding. A plugin's `client/` is not bundled by the plugin — `build` is `tsc`, so `dist/client/*.js` keeps its bare imports and the installing application's Vite build resolves them. The package therefore has to appear in the published manifest, and `devDependencies` are not published. But a server has no client build and never requires it, so `dependencies` would install tens of megabytes into every deployment that nothing loads. A peer satisfies both: the application installs one shared copy, and `dist/pnpm-workspace.yaml` sets `autoInstallPeers: false` so a deployment installs none. One declaration is enough — pnpm installs and links a peer here, so the plugin's own lint, tests, and build resolve it without a second entry.

`optional` on a peer means the consumer may legitimately not need it, not "skip this at deploy time". An optional peer is not auto-installed anywhere, including in the application that needs it — which is the failure this arrangement exists to prevent. `@nocobase/i18n`'s `hono` is the legitimate case: a browser-only consumer has no use for it.

`@nocobase/app-cli` is the one package that uses optional peers for tooling, and the reason is the same one read the other way. It is a production dependency, because a deployment runs `node dist/cli/index.js db apply`, yet its `dev`, `build` and plugin-management commands need `typescript`, `tsx`, `vite`, `prettier`, `tar`, `tsc-alias` and `@nocobase/dev-config`, which a deployment legitimately does not have. Those are optional peers, every template declares them in `devDependencies`, and nothing a runtime command loads may import one at module top level: development commands are not registered in a built `dist/` and load their tooling only when they run. When app-cli gains another development-only import, add it to all three places.

An application has two, and the question is which half imports it: `server/`, `database/`, and `cli/` imports go in `dependencies`, because `dist/package.json` is generated from there; `client/` imports and build tooling stay in `devDependencies`, because Vite inlines them at build time and nothing resolves them again.

`build-server-dist-package.mjs` used to walk the built output for bare imports and expand every transitive dependency by hand. It had to, because applications declared their server packages in `devDependencies` and nothing else could tell which of them a deployment needed. Once those moved to `dependencies` the walk had nothing left to discover, and it was removed: `pnpm install` applies the same rules, and a scan that resolves specifiers is a scan that can miss one. Workspace packages remain the exception, vendored into `dist/vendor` under a `file:` path because a `workspace:` range means nothing to a deployment.

The shared UI packages — `@base-ui/react`, `class-variance-authority`, `cn`, `lucide-react`, `shadcn`, `tw-animate-css` — resolve through `catalog:` wherever they are declared, peers included; `pnpm pack` expands the reference before publishing.

An earlier version of this pruned `dist/node_modules` with a `@vercel/nft` file trace. It produced a far smaller tree, but what it could not see it deleted — the pino transports named in a `target:` string, each plugin's `dist/database` read by directory scan, `@nocobase/app-cli`'s registry module handed to oclif as a path. Every one surfaced only by running the built `dist/`, and every one would have shipped as a successful build. Declarations cannot fail that way.

### Building for another platform

`retarget-native.mjs` is unrelated to the above and stays: a `.node` binary is compiled for one platform, architecture, C library, and Node ABI at once, so a build for another target obtains different binaries. It classifies packages by manifest signal rather than by name — `cpu`/`os` fields, an install script invoking a native build helper, bundled `.node` files — so a native dependency an application adds later is handled without extending a list. Keep that.

A platform package — one member of a set its parent lists in `optionalDependencies` — is swapped for the target's member under the napi-rs name first (`linux-x64-gnu`, `win32-x64-msvc`), then under the bare platform and architecture some sets use instead (`sqlite-vec-linux-x64`, glibc only, and `sqlite-vec-windows-x64`). When npm answers 404 for every name, the set has no build for the target and the stale member is removed rather than failing the build, as an install there would leave it out; any other fetch failure still fails. `sqlite-vec` is the case: it publishes no musl build, so on Alpine the agents plugin's default vector store reports itself unavailable instead of stopping the deployment build.

A package whose build `allowBuilds` sets to `false` never ran its install script, so it is classified by the binaries it was published with rather than by that script. `better-sqlite3`'s bundled prebuilds are still trimmed to the target's, and a package that ships none, such as `cpu-features`, has no compiled addon to retarget and is left as installed rather than failing the build for a prebuilt binary nobody publishes.

The build targets the machine it runs on so `pnpm build && pnpm start` works, and `--target` plus `--node-version` select another. A forgotten `--target` produces a `dist/` that fails only on the server, so every build states the platform it produced and records it in `dist/package.json` under `nocobase.buildTarget`.

`verify-server-deps.mjs` runs once the deployment tree is installed, retargeted and pruned, before the `afterBuild` hooks and `--tar`, and fails the build when a package the application's own `server/`, `database/`, or `cli/` code imports is not in `dist/package.json`. It reads literal specifiers, so `await import(`${name}/index.js`)` is invisible to it — that case has to be declared deliberately, and no static check can cover it.

The `parseTarget` mapping from Node major to ABI is written out rather than taken from `node-abi`, which given a bare major returns the major itself: `getAbi('24')` is 24, not 137. A wrong ABI downloads a binary that will not load.
