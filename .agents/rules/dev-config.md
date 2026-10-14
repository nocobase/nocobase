# Shared Development Configuration and Package Publishing

Read this before creating a package, changing its tsconfig, ESLint, Prettier, Vitest or Vite configuration, changing dependencies, or preparing a package for publishing.

## Selecting and Using Shared Development Configuration

All new packages must use `@nocobase/dev-config` by default. Do not copy a complete tsconfig, ESLint, Prettier, Vitest, or Vite configuration from an existing package. See `packages/tools/dev-config/README.md` for the full English documentation; each configuration directory also has its own README.

### Selecting a TypeScript Preset

First determine the runtime environment, then whether the package emits declaration files:

| Scenario                                                          | `extends`                                           |
| ----------------------------------------------------------------- | --------------------------------------------------- |
| Minimal shared strict rules only                                  | `@nocobase/dev-config/tsconfig/base.json`           |
| Browser or React application with no emit                         | `@nocobase/dev-config/tsconfig/client.json`         |
| Browser or React library that emits `.d.ts`                       | `@nocobase/dev-config/tsconfig/client-library.json` |
| Node server application                                           | `@nocobase/dev-config/tsconfig/server.json`         |
| Node library that emits `.d.ts`                                   | `@nocobase/dev-config/tsconfig/server-library.json` |
| Node tooling such as Vite, Vitest, or build scripts, with no emit | `@nocobase/dev-config/tsconfig/node-tooling.json`   |

A hybrid Node/DOM package such as `app-host` should use `server-library` and add the DOM library locally. Keep the package-specific `include`, `exclude`, `paths`, `rootDir`, `outDir`, `tsBuildInfoFile`, and special `types` settings in the consuming package because they depend on its directory layout.

### ESLint, Prettier, Vitest, and Vite

- Use a thin `eslint.config.js`. Node libraries call `createNodeLibraryConfig`, browser libraries call `createClientLibraryConfig`, and applications call `createApplicationConfig`.
- A package may add precise `ignores` or documented, narrowly scoped rule exceptions. Do not disable type-aware linting across an entire package merely to complete a migration.
- Inherit Prettier through `"prettier": "@nocobase/dev-config/prettier"` in `package.json`.
- Prefer `pnpm fix` after editing code. It always runs ESLint `--fix` before Prettier `--write`. `pnpm format:check` is a read-only incremental check.
- Node tests use `createNodeVitestConfig`. React/jsdom tests use `createReactVitestConfig`. The React preset already installs jest-dom matchers and Testing Library cleanup.
- Application Vite configurations use `createAppViteConfig`. Keep proxy settings and aliases local.
- Keep Playwright configuration package-local for now; there is no shared Playwright preset.

### Dependencies and Runtime

- Use `catalog:` entries from `pnpm-workspace.yaml` for shared critical dependencies such as TypeScript, ESLint, Prettier, Vitest, Vite, React, Tailwind, and Testing Library.
- Continue to use `workspace:` for internal NocoBase packages. A peer dependency may retain an explicit version range when it intentionally supports a wider range than the workspace version.
- After changing dependencies, run `CI=true pnpm install --no-frozen-lockfile` and commit the synchronized lockfile. CI uses a frozen lockfile.
- Node runtime, server, and tooling packages declare Node `>=24.0.0`. A browser-only runtime must not declare a Node runtime requirement merely because its development tooling uses Node.

### Package Publishing

Every package under `packages/` is published to npm, so none of them set `private: true`. Root `pnpm pack:check` automatically discovers every package in that directory and rejects private packages, incomplete publish metadata, missing or stale changelogs, invalid tarballs, unresolved workspace protocols, and broken export or declaration metadata.

A new package therefore starts at version `0.0.1`, sets `publishConfig.access` to `"public"` — scoped packages default to restricted and would otherwise fail to publish — and declares `files`. Without `files` the package ships its sources, tests, and configs; libraries ship `dist` alone, while template packages that users are meant to read and edit ship their sources instead.

"Libraries ship `dist` alone" is stricter than it sounds, and `pack:check` now enforces it: a package that publishes `dist` must not also publish `database` or `server`. Plugins now declare an explicit `baseDir` for `database/migrations` and `database/seeds`. Earlier runtimes tried the package directory before `dist`, so publishing both handed installed applications TypeScript sources — and Node refuses to strip types from a file under `node_modules`. `@nocobase/app-plugin-ai-employee` shipped this way and failed every application start with `Stripping types is currently unsupported for files under node_modules`, while every development checkout kept working, because a workspace link resolves the same sources outside `node_modules`. Templates are unaffected: they publish their sources instead of a `dist`, so there is nothing to shadow.

Check npm before settling on a package name. A name the v2 line still publishes under is off limits — `@nocobase/database` is releasing `3.0.0-alpha` versions as this is written, so `@nocobase/db` is the v3 database package.

A name whose v2 releases have stopped may be reused, provided every version v3 publishes sorts above the last one published under the old name. `@nocobase/app-server` is the case to reason from: the abandoned package ends at `0.11.1-alpha.5`, so the v3 package starts at `1.0.0-beta.0` rather than continuing the `0.1.0-beta` line it had while it was called `@nocobase/app-server-kit`. Note that `0.1.0` sorts below `0.11.1`, which is exactly the mistake this rule exists to catch. Confirm the old package is genuinely dormant before taking its name; a name still in use cannot be claimed this way at any version.
