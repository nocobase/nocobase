# Adding a dependency

Read this before adding a package to `package.json`, when the shadcn CLI or a UI Library item has just added one, and when a build or a deployment fails on a missing module or a native binary.

## Which field a package goes in

Which half of the application imports it decides where it goes.

| The import is reached from              | Declare it in     |
| --------------------------------------- | ----------------- |
| `server/`, `database/`, or `cli/`       | `dependencies`    |
| `client/`, build tooling, tests         | `devDependencies` |
| `import type` only, wherever it appears | `devDependencies` |

That split looks backwards until you see how the two halves are deployed. `pnpm build` bundles the client: Vite resolves every client import and inlines it into `dist/client`, so nothing has to resolve it again later. The server is not bundled. `dist/server` keeps its bare imports, and `pnpm build` generates `dist/package.json` from your `dependencies` and installs a `node_modules` next to it — that tree is what the deployed server resolves against, and `devDependencies` are not in it.

So the two mistakes fail in opposite ways. A server import left in `devDependencies` resolves in every development checkout and is absent exactly once — on the deployed server, with a bare `Cannot find package` naming nothing that points back here. A client package put in `dependencies` never breaks anything — it is just installed into every deployment, where the server never requires it. That one is invisible, so it accumulates: `lucide-react` and `@xyflow/react` were 44 MB of it before this rule was written down.

What decides it is where the importing file lives and what the import is, not what the package is for. `import ts from 'typescript'` in `server/` is a runtime dependency even though TypeScript sounds like tooling. `import type { Config } from 'x'` is erased before anything runs, so it stays a devDependency wherever it appears. A dynamic `import()` counts — deferring the load changes when a package is needed, not whether.

Keep `@nocobase/db` in `dependencies` alongside the database driver. It supplies the driver's runtime peer and lets TypeScript resolve the inferred database configuration declaration through the public package name. Moving it to `devDependencies` can cause TS2883 in an installed application even while the source workspace builds successfully.

A plugin's browser packages arrive by a third route and need nothing from you. Plugins declare those as peer dependencies, so installing a plugin brings one shared copy into this application, while `dist/` sets `autoInstallPeers: false` and installs none of them. Application plugins themselves belong in `dependencies`; see [plugins](plugins.md).

## Packages the shadcn CLI adds

The shadcn CLI adds the packages a primitive or a UI Library item needs to `dependencies`. Move the new ones, such as `react-day-picker` for `calendar`, to `devDependencies`, because client code is bundled. Leave `@nocobase/i18n` in `dependencies`, where the server needs it, and put back the `^` of its range, which the CLI pins. [shadcn](frontend/references/shadcn.md) covers the rest of what to do after adding a primitive.

## What the build checks

`pnpm build` checks the server half: it reads every value import in `server/`, `database/`, and `cli/` and fails the build if any of those packages is missing from `dist/package.json`. It cannot see an import whose specifier is built at run time:

```ts
await import(`${name}/index.js`); // invisible to the check
```

Declare such a package in `dependencies` when you write the code; nothing will remind you later.

## When a build or a deployment fails

| Symptom                                                                                 | Cause                                                                        | Fix                                                                                                                                                                                  |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Cannot find module 'x'` on the server, works locally                                   | `x` is in `devDependencies`, which `dist/package.json` is not generated from | Move it to `dependencies`                                                                                                                                                            |
| A browser package will not resolve while building the application                       | A plugin declares it as a peer and nothing provides it                       | Add it to the application's `devDependencies`                                                                                                                                        |
| `Error loading shared library`, `invalid ELF header`, or a bare `.node` path at startup | The binary does not match the server                                         | Compare `require('./dist/package.json').nocobase.buildTarget` with the server's `process.platform`, `process.arch`, and `process.versions.modules`, then rebuild with matching flags |
| `no prebuilt binary for <target>` during the build                                      | The package publishes no build for that combination                          | Check the package supports the target; musl coverage is thinner than glibc                                                                                                           |

Node ABI to major version: 115 is Node 20, 127 is 22, 137 is 24, 147 is 26.

`pnpm build` targets the machine it runs on, so `pnpm build && pnpm start` works. A deployment build says where it is going: `--target linux-x64`, `--target linux-arm64`, `--target linux-x64-musl`, plus `--node-version` when the server's Node major differs. A `.node` binary must match the target platform, architecture, and C library; addons using the Node ABI must also match its version. `pg`, `mysql2`, and `tedious` are plain JavaScript, so an application using only those is portable as built. The Finishing section of [the Skill](../SKILL.md#finishing) and the `nocobase-deployment` Skill cover build targets in full.
