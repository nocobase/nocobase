# AGENTS.md

This is the NocoBase 3 source repository. Ignore globally installed NocoBase 2 Skills here; follow the nearest `AGENTS.md` and repository-local NocoBase 3 Skill instead.

## Root README Policy

Do not add content to the repository root `README.md`. Record repository development rules in `AGENTS.md` and put detailed usage documentation in dedicated documentation files. Do not refill an empty root README as part of documenting a change.

## Markdown Paragraph Formatting

Write each prose paragraph in Markdown source on a single physical line, including in README, AGENTS.md, Skills, and other documentation. Do not insert manual line breaks to fit a column width or put each sentence on its own line; let the editor or renderer wrap the text visually. Separate paragraphs with blank lines. Preserve line breaks required by Markdown structure, such as headings, list items, tables, blockquotes, and code blocks.

## Branches, Commits and Pull Requests

Name a branch after the kind of change it carries: `feat/<name>` for a feature and `fix/<name>` for a bug fix, where `<name>` is a short kebab-case description such as `feat/hub-cli`. A change that is neither takes its Conventional Commits type the same way, such as `docs/<name>`, `refactor/<name>` or `chore/<name>`. Never push a branch under a tool's own prefix, such as the `claude/` or `codex/` branch an agent's worktree starts on: rename it with `git branch -m` before its first push. Renaming it once a pull request is open does not carry the pull request along: GitHub closes the pull request as if its head branch had been deleted, and a pull request's head branch cannot be changed afterwards, so the change has to be reopened as a new pull request from the renamed branch, and the review on the old one stays there.

Commit messages and pull request descriptions carry no attribution to an AI tool: no `Co-Authored-By` trailer naming a model or an agent, and no "Generated with …" line. A trailer naming a human co-author is unaffected. The repository's `.claude/settings.json` turns Claude Code's own attribution off for everyone working here; the rule holds whichever tool writes the commit, so a tool that adds such lines by default has to be told not to.

## Before Creating or Updating a Pull Request

Read [.changeset/README.md](.changeset/README.md) before creating or updating a PR. If the PR changes a publishable package and affects its published output, include a changeset in the same PR covering every affected package. Run `node scripts/validate-changesets.mjs` before pushing.

CI enforces this rather than suggesting it: `scripts/require-changesets.mjs` fails the PR when a changed package has no changeset covering it. It asks whether a file reaches the published artifact, not whether the change deserves a release, so what it exempts is narrow — a package's `README`, `CHANGELOG`, `docs/`, its tests, and the development configuration it does not ship. Everything else counts, including `AGENTS.md`, `CLAUDE.md` and `skills/`: those are published with the package and synchronized into an installed application's `.agents/skills/`, so an unreleased change to them leaves every consumer's agent working from the previous rules. A template package is stricter still, because its `files` field ships its own `eslint.config.js`, `vitest.config.ts` and tsconfigs as source a user reads and edits.

Run it locally the way CI does before pushing:

```bash
BASE_SHA=$(git merge-base origin/develop HEAD) HEAD_SHA=$(git rev-parse HEAD) \
  node scripts/require-changesets.mjs
```

When a change genuinely should not be released — a pure refactor, or reverting something that never shipped — add the `release:skip` label to the PR and say why in the description. The label is the only way past the check, which keeps the decision visible in the PR rather than hidden in a changeset nobody meant to write.

A new changeset goes in `.changeset/`, never in `.changeset/pre/`. That subdirectory belongs to the changesets tool: while the branch is in prerelease mode, `changeset version` moves each changeset it has already consumed into it, and reads the whole directory again on later runs to compute the accumulated bump. Writing a new file there directly presents it as already released — the release run never consumes it, so its summary never reaches the CHANGELOG and the version it asked for is never applied. Nothing fails; the changeset is silently ignored. The directory is full of files because the branch has been releasing for a while, which makes it an easy place to add one by imitation.

## Repository Layout

Every published package lives under `packages/`, grouped into six directories by what the package is. The grouping is a convention for readers: pnpm resolves packages by name, so which directory a package sits in changes nothing about how it is depended on or filtered.

| Directory             | What belongs here                                                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `packages/libs/`      | Runtime libraries that solve one problem and know nothing about NocoBase applications, such as `caching`, `drive`, and `i18n`   |
| `packages/app/`       | The application runtime itself — what an application is built out of, such as `app-server`, `app-client`, and `app-cli`         |
| `packages/plugins/`   | Application plugins that ship as product features, such as `app-plugin-authentication`                                          |
| `packages/examples/`  | Application plugins that exist to demonstrate a capability, such as `app-plugin-routes-example`                                 |
| `packages/templates/` | Complete applications that `create-app` scaffolds from: `app-template-default`, `app-template-examples`, and `app-template-hub` |
| `packages/tools/`     | Development and build tooling that never ships inside an application, such as `dev-config`, `create-app`, and `create-plugin`   |

`packages/README.md` describes each directory in more detail and is the place to look when a new package does not obviously belong to one of them. `pnpm plugin:create` scaffolds into `packages/plugins/`.

`docs/` is the seventh workspace member and the one exception to the table above. It is the documentation site rather than something an application depends on, so it sits at the repository root rather than under `packages/`, and it is the only workspace package that sets `private: true`. That placement is what keeps it out of `pnpm pack:check`, which discovers publishable packages by descending into `packages/<category>/` and would otherwise reject it for being private. See the "Documentation Site" section below before changing anything under it.

## Repository Skills

This repository's Skills are committed under the root `skills/` directory, and nowhere else. Agents do not read that path on their own — most look in `.agents/skills/`, and Claude Code discovers Skills only under `~/.claude/skills/` and `<project>/.claude/skills/` — so `pnpm install` runs `scripts/sync-skills.mjs`, which links each Skill in `skills/` into both `.agents/skills/` and `.claude/skills/` as a relative symbolic link. Both directories are therefore generated and ignored, and editing a Skill through any of the three paths edits the same committed file. `nocobase skills sync` sets up a similar arrangement inside a generated application, with two differences: an application's Skills come from its installed packages rather than being written by hand, and they are copied into `.agents/skills/`, which the next sync replaces wholesale, while only `.claude/skills/` holds links to those copies.

Because a Skill is read through links one directory deeper than where it is committed, a relative Markdown link from a Skill into the rest of the repository resolves differently depending on the path it was opened through. Refer to repository files by their path from the repository root in a code span, such as `packages/app/app-cli/src/lib/skills-sync.ts`, and keep relative links for files inside the Skill itself.

`skills/` holds two kinds of Skill. `nocobase-plugin-development` is for developing plugins in a NocoBase 3 source workspace: this checkout links it, and it can also be installed globally with `npx skills add nocobase/nocobase3 --skill nocobase-plugin-development -g`, so it must not depend on a relative link into the repository. `nocobase-create-app` is installed globally by users, so that an agent knows how to reach NocoBase 3 before any application exists, with `npx skills add nocobase/nocobase3 --skill nocobase-create-app -g`; `--skill` is required because the `skills` CLI reads the whole directory and would otherwise offer the development Skill alongside it. `nocobase-app-installer`, installed the same way with `--skill nocobase-app-installer`, is its counterpart for the machine that runs NocoBase: `nocobase-create-app` creates a project to develop, `nocobase-app-installer` installs built NocoBase — a Hub from its template, or an application's deployment archive — and upgrades it. A request to install a Hub goes to `nocobase-app-installer` unless the user will develop the Hub's own code. Before merging a change to a global Skill, try it against the unreleased checkout with `pnpm unreleased:*`, as [skills/README.md](skills/README.md) describes: the published packages cannot show whether a Skill works with behavior that has not been released yet.

Every Skill in `skills/` is released by merging, not by publishing. `npx skills add` reads the default branch, so a change reaches every user the moment it lands on `develop`, while `pnpm create @nocobase/app` installs whatever version was last published to npm. A global Skill may therefore describe only behavior that has already been released: a change that documents a new command or flag waits until the release that ships it, and says so in its pull request. Nothing enforces this — `scripts/require-changesets.mjs` looks only at `packages/`, and there is no version to bump. Keep such a Skill to the entry point and hand over to the application's own `AGENTS.md` and `.agents/skills/` as soon as the application exists, because those are synchronized from the installed version and a global Skill is not.

Skills written for generated applications, such as `nocobase-deployment` and `nocobase-app-development`, are not linked here. They live in `packages/app/app-skills/skills/` so that `nocobase skills sync` delivers them to every application, and they describe work done inside an application rather than on this repository. Editing one is a change to `@nocobase/app-skills` and needs a changeset.

The sync never replaces a path that is not a symbolic link, so a Skill you keep only in `.agents/skills/` or `.claude/skills/` is reported and left alone rather than deleted, and a link whose Skill is gone from `skills/` is removed. It also never fails the install: a warning is enough, because the Skills are still readable where they are committed. Adding or removing a Skill takes effect on the next `pnpm install`, or immediately with `node ./scripts/sync-skills.mjs`.

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

### Test Layout

Tests live in a `tests/` directory at the package root, never beside the source files they cover. A package with nested source roots puts `tests/` at the root of that source tree, as `packages/plugins/app-plugin-authentication/server/tests` does. Subdirectories inside `tests/` are free to reflect whatever the package needs, such as `tests/unit` and `tests/integration` in `packages/libs/db`, or `tests/logic` and `tests/components` in the application templates.

Name test files `*.test.ts` or `*.test.tsx`. Vitest discovers them by filename rather than by directory, so a test placed outside `tests/` still runs and will not fail loudly; keeping the layout consistent is a convention the tooling does not enforce for you.

Test files stay out of the build. Keep `include` in the package `tsconfig.json` pointed at `src` so `tests/` is excluded from the emitted output, unless the package deliberately typechecks its tests the way `packages/libs/db` does.

### Never Assert a Package's Own Version as a Literal

A test must not spell out the version of a package in this repository. Read it from the manifest instead:

```ts
import packageMetadata from '../package.json' with { type: 'json' };

expect(service.getInfo()).toMatchObject({ version: packageMetadata.version });
```

The release workflow runs `changeset version` and then runs the tests, so every published package is on a version different from the one committed by the time the suite executes. A literal that matches today fails during the next release, and it fails after the version bump — the point where the branch has already been rewritten and the run has to be repaired before anything can ship. `@nocobase/app-plugin-system-info` broke a release exactly this way, asserting `'0.0.1'` against a package `changeset version` had just moved to `0.1.0-beta.0`. Use the manifest import shown above, or resolve the dependency’s `package.json` through `createRequire`, rather than repeating its version.

This applies to the version of any workspace package, whether the test owns it or depends on it. It does not apply to a version a test makes up for a fixture it writes itself — `version: '1.0.0'` in a synthetic `package.json` describes nothing real and never drifts.

The same reasoning covers anything else a release rewrites. Assert against the manifest, not against a copy of what it currently says.

### Validation

Run `lint`, `typecheck`, `test`, and `build` for the packages you modified, and for the packages that consume what you changed. Scope the run to those with `pnpm --filter <package>`; a workspace-wide `pnpm -r test` takes minutes and is CI's job, not a routine step after an edit.

Widening the scope is worth it when a change reaches further than the package it lives in: an exported type or signature, a shared configuration preset, or anything a generated application depends on. Judge that from the change itself rather than running everything by reflex.

Root `pnpm check` also performs incremental formatting and publish-ready tarball checks. The Husky + lint-staged pre-commit hook fixes staged files automatically, but it does not replace CI.

The executable source of `@nocobase/dev-config` is TypeScript, while its npm
exports resolve to compiled ESM JavaScript and declarations in `dist`. When
changing `packages/tools/dev-config`, run
`pnpm --filter @nocobase/dev-config check`; do not hand-edit generated output.

## Keeping the Application Templates in Sync

`packages/templates/app-template-default`, `packages/templates/app-template-examples`, and `packages/templates/app-template-hub` are three applications built on the same framework. A change to the framework layer of one belongs in all applicable templates by default: the runtime composition roots, the client shell, routing, layouts and theme, the server entry points, the `cli/plugins.ts` composition root, the `package.json` scripts, tsconfigs, and the agent-facing documentation — `AGENTS.md`, `CLAUDE.md`, and `README.MD`. Shared application Skills live in `packages/app/app-skills` and synchronize into each application from the `@nocobase/app-skills` dependency.

They drift otherwise, and the drift is invisible until someone hits it. Both templates carried a `tsconfig.migrations.base.json` that nothing referenced, and both omitted `database/**/*.ts` from `tsconfig.server.json`, so an application-owned migration ran under `pnpm nocobase db apply` but was silently dropped by `pnpm build` — the same defect, twice, because a fix to one was never carried across.

Not everything transfers. Examples owns its demonstration homepage, article module, and example plugin composition. Each template keeps its own identity and the parts that follow from what it is: `package.json` name, `displayName`, and version; `nocobase.templateKind` and its plugin list; the pages, locales, and branding that make it that product. When a documentation change mentions the other template by name, reword it rather than copying the sentence — the Hub's own `server/embedded.ts` is not "the entry point when a Hub hosts the application".

Apply all applicable sides in one change and run each affected template's `check`. A framework change that lands in only one template is incomplete, and a reviewer cannot tell whether the omission was a decision or an oversight; if it genuinely does not apply, say so in the pull request.

When a template, application runtime, or CLI change affects how an agent develops, configures, builds, deploys, or upgrades an application, review `packages/app/app-skills` and update the relevant Skill or reference in the same change. Keep the guidance concise and actionable; record the current rule rather than implementation history, and link to existing detail instead of duplicating it.

## Application Themes and UI Styling

For creating or editing theme presets, read `packages/app/app-skills/skills/nocobase-app-development/references/frontend/references/theme.md` from the repository root.

For application UI styling, including plugin UI rendered in an App, use the shared color, font, size, spacing, radius and shadow contract in `packages/app/app-skills/skills/nocobase-app-development/references/frontend/references/theme.md` from the repository root. Prefer its Tailwind utilities so components respond to theme changes; keep deliberate fixed-size exceptions explicit.

## Database Migration Development

Database migrations are immutable historical records and must be self-contained. Write the exact, deterministic table, field, index, constraint, and metadata synchronization operations directly in each migration. Schema changes must likewise spell out the exact add, alter, rename, or drop operations that the migration performs.

Do not import or iterate over live collection schemas, field definitions, model definitions, registration lists, or other runtime application definitions from a migration. Those definitions continue to evolve, so referencing them can silently change the behavior and checksum of an already published migration. Reuse of such definitions is appropriate for runtime initialization and tests, but not for migration implementation.

When a migration needs to create a collection, call `builder.createCollection` with its fixed name and declare every field, relation, index, and constraint in the migration itself. Write `down` with the corresponding explicit reverse operations in a safe dependency order. For an existing schema, use explicit `builder.alterCollection`, field, index, constraint, or metadata operations rather than synchronizing from the current collection definition.

Add a migration-level test that executes `up` and, when reversible, `down` against a real test database and verifies the resulting physical schema and metadata.

### Choosing a data-access tool in a migration or seed

A migration's context carries three tools and they are not interchangeable. `builder` is the only one that changes structure. `query` is the default for data: it reads and writes rows through the Connection naming strategy and expresses exactly what it is given. `repository` is the narrow one — reach for it only where `query` would get the write wrong: cross-dialect field encoding and decoding, Collection-level naming overrides, and relation writes, including the junction rows behind a `belongsToMany`. Anything `query` expresses correctly stays on `query`.

A seed's context carries only the last two, because a seed never changes structure. There the default is reversed: installation data is written in Collection terms, so `repository` is the normal tool and `query` is for what it cannot express, such as reading a physical table that backs no Collection.

This does not loosen the rule above. `repository(name)` resolves the Collection from the database itself — the metadata a previous `builder` operation wrote — which is why it is available at all; importing or iterating an application's own collection definitions from a migration remains forbidden, and no amount of convenience justifies it. What it does mean is that a migration using `repository` is betting on a shape it did not declare in its own body, so three things follow:

- Say in a comment why `query` was not enough. A reviewer cannot tell a considered use from a reflex, and the comment is what makes the difference visible.
- Do not use it in `down`. By the time a rollback runs, the Collection has already moved past what `up` left behind, possibly several migrations past.
- Do not use it to walk a table. Selecting every row and updating each one through a Repository is the shape to avoid; a set-based `query` statement is both correct and bounded.

Both tasks get their Repository from the connection the task runs on, which inside a transaction is that transaction's connection. This is why the service container withholds the application's `DatabaseManager` from migrations and seeds: a Repository taken from it would write outside the task's transaction and survive a failure that should have discarded it.

### A plugin's migrations are laid out differently from an application's

An application keeps its tasks under `database/<connection>/migrations` and `seeds`, one directory per configured connection. A plugin declares a single `database/migrations` and `database/seeds` in its `defineServerPlugin` call, relative to the plugin's `baseDir`, and there is no connection segment because a plugin contributes only to the installing application's default connection. It cannot know which further connections an application defines, and cannot target one.

The loader flattens the application's sources and every registered plugin's into one list per connection, rejects duplicate migration names across all of them, and orders what remains by name alone. So a plugin's migration name has to be derived from its package rather than being a bare timestamp — a collision fails the run for the whole application — and a plugin's migrations interleave with the application's by name rather than applying as a block. Execution history records the owning package name, so attribution survives the shared run.

`packages/tools/create-plugin/template/AGENTS.md` carries this for generated plugins; change both together.

Before editing an existing migration, check its Git history and the status of the branch that introduced it. An existing migration may be corrected directly only while its introducing feature branch has not yet been merged. Once that branch has been merged into its target branch, never modify the migration again; implement every correction or subsequent schema change in a new migration. Do not use hard-coded previous checksum hashes to make an edited migration appear compatible.

## Database Integration Test Scheduling

Run a dialect integration suite through the package that owns it: `pnpm --filter @nocobase/db-<dialect> test:integration`. `@nocobase/db` has no integration script of its own. Run one suite at a time locally: never start two at once, and never leave one in the background. The runners isolate their Compose projects and host ports, so the hazard is not a collision but contention for one machine's CPU, memory, and Docker I/O, which pushes service health checks past their start period and reports a flaky startup failure instead of a result. CI parallelizes safely because each selected dialect gets its own job and runner.

On pull requests and pushes to `develop`, `scripts/select-db-integration-matrix.mjs` selects the Quality workflow's database matrix from changed paths. A dialect package change selects that dialect; changes to `db`, `db-testkit`, their shared dependencies, shared development configuration, or dependency/CI inputs select all eight. Unrelated changes skip the matrix. Selection covers entire package directories, including tests and documentation; deletions and both sides of renames count. An unavailable comparison range runs all eight conservatively. Keep the selector's shared paths current when adding database dependencies or changing the test setup.

Run locally only the dialects the change puts at risk; CI covers the selected matrix. After changing `packages/libs/db`, `packages/libs/db-testkit`, or a `packages/libs/db-<dialect>` package, read [packages/libs/db-testkit/docs/integration-testing.md](packages/libs/db-testkit/docs/integration-testing.md) for which suites a change requires, how to narrow a run, and the command forms that silently run nothing.

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

`@nocobase/app-cli` is the one package that uses optional peers for tooling, and the reason is the same one read the other way. It is a production dependency, because a deployment runs `node dist/cli/index.js db apply`, yet its `dev`, `build` and plugin-management commands need `typescript`, `tsx`, `vite`, `prettier`, `tar`, `@refinedev/cli`, `tsc-alias` and `@nocobase/dev-config`, which a deployment legitimately does not have. Those are optional peers, every template declares them in `devDependencies`, and nothing a runtime command loads may import one at module top level: development commands are not registered in a built `dist/` and load their tooling only when they run. When app-cli gains another development-only import, add it to all three places.

An application has two, and the question is which half imports it: `server/`, `database/`, and `cli/` imports go in `dependencies`, because `dist/package.json` is generated from there; `client/` imports and build tooling stay in `devDependencies`, because Vite inlines them at build time and nothing resolves them again.

`build-server-dist-package.mjs` used to walk the built output for bare imports and expand every transitive dependency by hand. It had to, because applications declared their server packages in `devDependencies` and nothing else could tell which of them a deployment needed. Once those moved to `dependencies` the walk had nothing left to discover, and it was removed: `pnpm install` applies the same rules, and a scan that resolves specifiers is a scan that can miss one. Workspace packages remain the exception, vendored into `dist/vendor` under a `file:` path because a `workspace:` range means nothing to a deployment.

The shared UI packages — `@base-ui/react`, `class-variance-authority`, `clsx`, `lucide-react`, `shadcn`, `tailwind-merge`, `tw-animate-css` — resolve through `catalog:` wherever they are declared, peers included; `pnpm pack` expands the reference before publishing.

An earlier version of this pruned `dist/node_modules` with a `@vercel/nft` file trace. It produced a far smaller tree, but what it could not see it deleted — the pino transports named in a `target:` string, each plugin's `dist/database` read by directory scan, `@nocobase/app-cli`'s registry module handed to oclif as a path. Every one surfaced only by running the built `dist/`, and every one would have shipped as a successful build. Declarations cannot fail that way.

### Building for another platform

`retarget-native.mjs` is unrelated to the above and stays: a `.node` binary is compiled for one platform, architecture, C library, and Node ABI at once, so a build for another target obtains different binaries. It classifies packages by manifest signal rather than by name — `cpu`/`os` fields, an install script invoking a native build helper, bundled `.node` files — so a native dependency an application adds later is handled without extending a list. Keep that.

The build targets the machine it runs on so `pnpm build && pnpm start` works, and `--target` plus `--node-version` select another. A forgotten `--target` produces a `dist/` that fails only on the server, so every build states the platform it produced and records it in `dist/package.json` under `nocobase.buildTarget`.

`verify-server-deps.mjs` runs once the deployment tree is installed, retargeted and pruned, before the `afterBuild` hooks and `--tar`, and fails the build when a package the application's own `server/`, `database/`, or `cli/` code imports is not in `dist/package.json`. It reads literal specifiers, so `await import(`${name}/index.js`)` is invisible to it — that case has to be declared deliberately, and no static check can cover it.

The `parseTarget` mapping from Node major to ABI is written out rather than taken from `node-abi`, which given a bare major returns the major itself: `getAbi('24')` is 24, not 137. A wrong ABI downloads a binary that will not load.

## Depending on Identity-Sensitive Packages

A plugin declares the runtime it plugs into as a `peerDependency`, never as a `dependency`. `pnpm peers:check` enforces this and runs in CI.

### Deciding whether a package belongs to the rule

The list in `IDENTITY_SENSITIVE_PACKAGES` in `scripts/check-peer-deps.mjs` is what the check reads, but it is a record of past decisions rather than the rule itself. It will be incomplete: every new package, and every new export added to an existing one, has to be judged. Ask one question:

> Does this package hold state that is only correct while exactly one copy of the module exists in the process?

If yes, it belongs to the rule. In practice that means the package exports at least one of:

- **A value used as a key by identity.** `createServiceToken` returns a frozen object and `ServiceContainer` keys its `Map` by that object, so two tokens with the same `name` are two different keys. Anything compared with `===`, or used as a `Map`/`Set`/`WeakMap` key across a module boundary, has this property.
- **A React context.** `createContext` returns a new object each call, and `useContext` only matches the provider created from the same one.
- **A module-level singleton.** A `const` holding a `new` instance or accumulated state, such as `nocobaseClient`, gives each copy its own session, cache, or connection.
- **A registration into a process-wide registry.** A module-level table other modules register into: the second copy registers into a table the first one never reads.

Public classes with private members also carry declaration identity: passing a DatabaseConnection between packages using different db versions can fail type checking even when runtime methods match. A host-owned service a plugin resolves from the container belongs to the rule too, even without any of the state above: `@nocobase/queue` holds no singleton or registry, but every plugin receives the application's `QueueService` and publishes declarations typed against it, so a second copy describes the host's service with another version of its contract. Review public object contracts as well as singletons, including authorization error identity, caching registries, AI employee service tokens, and repository-input filter symbols. Ordinary dependencies remain appropriate for implementation details that do not cross the package boundary.

Two cases need no judgement. Every `@nocobase/app-plugin-*` is covered unconditionally, because plugins export tokens for one another and `isIdentitySensitive` matches them by prefix, so a new plugin is included the day it is created. A type-only import that survives in published declarations still needs a consumer-resolvable dependency contract.

When you do add an entry, record what breaks without it rather than only the package name. The reason is what lets the next person apply this rule to a package nobody has seen yet; a bare list decays into something people copy without understanding.

The current entries:

| Package                      | What breaks when a second copy exists                                                                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@nocobase/service-provider` | `ServiceContainer` keys its `Map` by the token object itself, so two `createServiceToken` calls with the same name produce two keys that never match                     |
| `@nocobase/app-server`       | Exports the tokens every server plugin resolves against, such as `queueServiceToken` and `driveManagerToken`                                                             |
| `@nocobase/db`               | Exports `databaseManagerToken` and migration identity                                                                                                                    |
| `@nocobase/app-client`       | Exports React contexts plus the identity-keyed `apiClientToken`, `realtimeClientToken` and `toasterToken`                                                                |
| `@nocobase/app-cli`          | `AppCommand` reads the application the runner located and the runtimes it tracks, so a plugin command built on a second copy runs under another version of that contract |
| `@nocobase/i18n`             | Exports the React contexts backing the i18n runtime                                                                                                                      |
| `@nocobase/queue`            | Plugins receive the host-owned `QueueService` and type their published declarations against it, so a second copy describes that service with another contract version    |
| any `@nocobase/app-plugin-*` | Plugins export tokens for one another, such as `authenticationToken` and `notificationServiceToken`                                                                      |

### Why a second copy is worth this much trouble

Installation can succeed while a later build rejects database classes from different versions because their private members have different declaration identities. If type checking succeeds, runtime identity can still fail: `Service "..." is not registered` for a service that is demonstrably registered, or a React context reads `undefined` under a mounted provider. Inspect the installed dependency graph when these symptoms cross package boundaries.

Workspace links can hide this problem by resolving consumers to the same source directory. Passing monorepo checks does not prove that published packages install correctly. Reproduce version skew with installed packages outside the workspace, as in `tests/scripts/shared-db-install.test.mjs`, and verify the published dependency contract before release.

### Declaring the shared dependency

```json
{
  "peerDependencies": { "@nocobase/app-server": "workspace:^" }
}
```

**`peerDependencies` is the published contract.** It is what npm ships in the package metadata, and it tells the installing application which compatible package to provide. `devDependencies` are not installed for consumers, so without the peer entry an installed plugin declares no requirement and a package manager is free to give it a second copy.

One declaration is enough. pnpm installs a peer and links it into the plugin's own `node_modules`, `workspace:^` resolving to the copy in this repository exactly as `workspace:*` would — a plugin with its devDependency removed still links, typechecks, builds, and tests against it. A paired `devDependency` used to be required on the grounds that development would otherwise float across the wide peer range; it does not, so the second entry only added a line to keep in step.

### Scope

The shared-provider rule also applies to libraries and application runtimes receiving host-owned objects. Applications supply the production dependencies. The current `pnpm peers:check` scans plugins and examples against its recorded package list; review library consumers and required template providers explicitly, because the check does not cover them.

A peer range expresses compatibility; it does not guarantee a global singleton across incompatible peer contexts. Test installed artifacts and old-lockfile upgrades, and keep the host ranges compatible. Deployment sets `autoInstallPeers: false`, so promoting a dependency to a peer must include its production provider in all affected templates. Do not rely on a development dependency or a transitive copy to supply it. For changes to these contracts, update all affected templates and the lockfile, run peer/runtime checks and the installed-package regression, and document existing-application upgrade requirements in a changeset. Do not hide type conflicts with casts or relaxed checking.

A plugin that contributes CLI commands declares `@oclif/core` as a peer for a related but distinct reason: not module identity, but one shared version, so help rendering and flag parsing behave the same in the plugin and in the application that assembles its commands.

`pnpm plugin:create` emits this shape, so a generated plugin satisfies the rule without further edits. When the list changes, update `packages/tools/create-plugin/src/lib/template.ts` and its tests in the same change — a generator that emits the old shape reintroduces the problem in every plugin created afterwards.

## Declaring Dependencies by How They Are Used

Ordinary server implementation dependencies go in `dependencies`; shared identity-sensitive packages follow the peer rule above even when imported by server code. Browser code a consumer has to resolve goes in `peerDependencies`. Build tooling, tests, and type imports absent from published declarations go in `devDependencies`. `pnpm deps:check` checks server runtime import declarations and runs in CI.

The rule is one question: **does someone outside this repository have to resolve this import?** If yes, declare it as a dependency or peer according to its ownership; a published package's devDependencies are not installed for its consumers.

**A deployed server resolves its imports at runtime.** `pnpm build` emits `dist/server` with its bare imports intact and generates `dist/package.json` by walking `dependencies`. A server module importing something declared only as a devDependency resolves in every development checkout and is absent exactly once — on the deployed server. `@nocobase/app-plugin-workflow` shipped this: `server/loader/source-parser.ts` imports `typescript`, and `typescript` sat in `devDependencies`. The application crashed on start with `Cannot find package 'typescript'`, an error naming nothing that points back at the manifest.

**An installing application resolves a plugin's client imports at build time.** A plugin's `client/` is not bundled by the plugin — `build` is `tsc`, so `dist/client/*.js` keeps its bare imports, and the consuming application's Vite build is what resolves them. That application installed the plugin from a registry, so it has only what the published manifest declares. `@nocobase/app-plugin-notification-provider` shipped `sonner` in `devDependencies`; a generated application failed on `pnpm dev` with `Could not resolve "sonner"`, and `@nocobase/app-plugin-workflow` failed the same way on `@xyflow/react`.

That failure cannot be reproduced here, which is why it reached npm twice. The monorepo installs every devDependency and links it into the plugin's own `node_modules`, so the import resolves in development and fails only once the plugin is installed from a registry.

A plugin's client dependency is also easy to believe is fine when it is not. Ten of the twelve affected plugins appeared to work because `app-template-default` happened to declare the same package for its own use; `@nocobase/app-plugin-hub`'s CodeMirror packages had no such coincidence and were simply broken. Relying on a template to satisfy a plugin's dependency is not a design, and an application the template did not generate has no reason to declare any of it.

So the question is who resolves the import, and then what the import actually is:

- **An ordinary server value import belongs in `dependencies`; shared identity-sensitive imports are peers.** `import ts from 'typescript'` in `server/` needs a runtime dependency even though TypeScript sounds like build tooling. A shared database connection follows the host-provided peer contract instead.
- **A client value import belongs in `peerDependencies`.** `sonner`, `lucide-react`, `@base-ui/react`, `clsx` — the installing application resolves them from the published manifest and provides one shared copy, while a server deployment installs none.
- **A type-only import can belong in `devDependencies` only if consumers do not need to resolve it.** JavaScript erases `import type`, but emitted `.d.ts` files can retain references to that package. Inspect the published declarations and use a dependency or peer contract when those references survive; shared classes with private members follow the peer rule.
- **A dynamic `import()` counts as a value import.** Deferring the load changes when a package is needed, not whether.
- **The `files` field decides whether code ships at all.** A test, an eval harness, or a build script excluded from `files` never reaches a consumer, so its imports are correctly devDependencies.

`registry/` is excluded for a stronger reason than the rest: it is shadcn-style source copied into an application and compiled there against that application's own `react` and `@/` alias. The plugin cannot resolve those imports at all, so declaring them would claim dependencies it does not have.

`peerDependencies` is the third answer, for a package the application must supply exactly one copy of. `react`, `react-dom`, `react-router`, and everything in `IDENTITY_SENSITIVE_PACKAGES` belong here rather than in `dependencies`: a second copy of a router or a React context does not merely waste space, it silently breaks. `@nocobase/i18n` is the shape to copy: it exports a server entry and a client entry from one package, so `i18next` is an ordinary dependency while `react`, `hono`, and `react-i18next` are optional peers. Mark such a peer `optional` in `peerDependenciesMeta` so the consumer that legitimately does not need it gets no warning.

A tool a package **spawns** rather than imports is a dependency too, and it is the one neither check can find: both read import specifiers, so a `spawn('vite', …)` is invisible to them. Declare it as a peer, because the application owns the copy that runs, and record it where someone adding the next one will look — `@nocobase/app-cli` keeps a table of the executables it spawns in its README. Nothing else catches an omission here: the binary resolves from `node_modules/.bin` in this repository and in any generated application, so it is missing only in an application that never installed it.

This rule changed once, and the reason is worth recording. Client imports used to belong in `devDependencies`, because `dist/package.json` was built by walking `dependencies` transitively and dragged every client package into the server deployment — `lucide-react` and `@xyflow/react` alone were 44 MB installed and never required. They are peers now, which keeps them out of a deployment without keeping them out of the application that has to resolve them.

When the check reports something, inspect ownership and usage: declare an ordinary server dependency, declare a shared peer and its application provider, or remove a client or build-time import that leaked into server code. Adding a declaration only to silence the check can leave either a duplicate shared module or an unnecessary deployment dependency.

`pnpm plugin:create` emits a generated plugin's `AGENTS.md` carrying this rule, so a plugin created tomorrow is told where a dependency goes before anyone adds one. When the rule changes here, change `packages/tools/create-plugin/template/AGENTS.md` in the same commit — the two are kept in step by a test, but only for the files' existence, not their content.

## JSON Output of Command-Line Tools

Every command-line tool this repository publishes answers `--json` with exactly one document on stdout, success or failure, in the application CLI's envelope, `{ schemaVersion: 1, ok, command, status, result | error, warnings }`, which `packages/libs/cli-envelope` defines and builds. `AppCommand` prints it for every `pnpm nocobase` command; a tool that runs before an application exists, such as `create-app`, depends on the package directly, builds its documents with `commandSuccessJson` and `commandFailureJson`, and runs the package's `node-guard` from its `bin/run.js` before loading anything else. When `ok` is true, `status` is `success`, `success-noop` — what every `--dry-run` answers — or `partial-success`; otherwise it is `failure`, and `error` carries a stable `code`, a `message`, `suggestions`, and `details` where there is anything to add. Progress and diagnostics go to stderr. A suggestion is `{ message, run? }`, and `run` is `{ command, args }`, an executable and its arguments rather than a shell line: a step that takes two commands is two suggestions, and a command that would not run as given, such as one holding a placeholder, goes in the message instead.

A command that extends `AppCommand` gets the envelope without writing it. `create-app`, `create-plugin` and `app-installer` cannot: they run before any application exists and do not depend on `@nocobase/app-cli`, so each depends on `@nocobase/cli-envelope` directly and keeps a thin `output.ts` that names its command and turns its own error type into the envelope's. `tests/scripts/json-envelope-parity.test.mjs` builds the same outcomes through each of those wrappers and through the application CLI and compares the printed documents. A new standalone tool that takes `--json` adds itself to that test. Before the shared package each tool kept a copy of the envelope, and the copies drifted: `app-installer` reported a failure as `error` with a shell-line `run`, `create-plugin` printed its failures on stderr under `operation`, and `create-app` had a flat result of its own.

Changing the envelope, or the members a command puts in it, breaks every script that parses the output, so the changeset says so. A global Skill that describes the output ships when it merges, before the release that changes the output does, so it describes the published shape alongside the new one.

## Documentation Site

`docs/` is a Rspress site copied from the v2 repository so that its custom theme, plugins, and checking scripts stay comparable with what they were ported from. It is a workspace member (`pnpm --filter @nocobase/docs <script>`), but it deliberately does not follow the shared-configuration rules the packages under `packages/` follow.

### Vendored theme components are excluded from both tools

`theme/components/{Nav,NavHamburger,NavScreen,Search,HomeHero}` are copied from Rspress's ejectable theme and kept byte-for-byte. Diffing them against the new upstream copy is the whole of a Rspress upgrade, which only works while they are unmodified.

Both tools skip them: for ESLint through `VENDORED_FROM_RSPRESS` in `docs/eslint.config.mjs`, which feeds the config's `ignores`, and for Prettier through **two** ignore files. The same five paths appear in `docs/.prettierignore`, which applies when Prettier runs inside the directory, and in the root `.prettierignore`, which applies when it runs from the repository root — the pre-commit hook and `pnpm format:all` both do. Miss either one and the files get reformatted by whichever entry point was left uncovered.

Formatting them would rewrite every one on the first run; linting them reports on code this repository does not own, where the only actionable response is the edit that destroys the diff. Fix a real problem in one of these files by fixing it upstream and re-copying, not by patching the copy. Everything outside those five directories is this repository's own code, is formatted and linted normally, and is held to zero errors.

When a copied file needs a deliberate local change, keep it and give it a header naming exactly what was changed and why — `Search/SearchPanel.tsx` and `Search/SuggestItem.tsx` are the two that carry one today. The directory stays excluded either way; the header is what tells the next person which differences are intentional.

### Formatting and linting for everything else

Prettier is the repository baseline, `@nocobase/dev-config/prettier`, referenced from `package.json` the same way every other package references it. Nothing about this directory is special to Prettier beyond the five vendored paths described above.

ESLint is this package's own flat config rather than a `dev-config` factory, because what it lints is a Rspress theme and a set of Node build scripts, neither of which the factories are shaped for. The root `eslint.config.js` enumerates the package roots it applies to and matches nothing here, so running ESLint over a file in this directory _from the repository root_ exits zero without evaluating a single rule — it looks like a pass and checks nothing. Two things follow. `pnpm lint` at the repository root is fine, because it runs each package's own `lint` script rather than one ESLint over everything. And `lint-staged.config.mjs` lists this directory in `SELF_LINTING_DIRECTORIES`, which is what makes the pre-commit hook run its ESLint from inside it; a new self-linting directory has to be added there or its rules silently stop running at commit time. The directory also pins ESLint 9 while the root is on 10, so the binary has to come from its own `node_modules` regardless.

The upstream copy of this site also carried Biome. It was dropped: its formatter duplicated Prettier over the same files with different settings, and the lint rules that were earning their place — hook dependency lists, conditionally called hooks, missing keys in rendered lists — are now covered by `eslint-plugin-react-hooks`. Removing it was a simplification only because that plugin came in with it.

### Dependencies

pnpm resolves strictly, so a dependency has to be declared even when the upstream copy relied on the flat `node_modules` a Yarn install produced. `clsx`, `body-scroll-lock`, and `js-yaml` are all imported by code that never declared them and are listed in this package as a result. When a copied file fails to resolve an import that works upstream, the cause is usually this and the fix is a declaration, not a change to the file.

React is the other divergence. The upstream copy pins React 18 through a `resolutions` field, which pnpm does not read at all, and Rspress 2.x depends on React 19 itself. This package uses React 19 and does not carry the pin; translating it would mean a root `pnpm.overrides` entry, which applies repository-wide and would drag every other package down to 18.

### Content and languages

Only the framework was copied — `docs/docs/` holds the pages this repository writes for itself. The framework carries translations for ten languages (`cn en ja es pt de fr ru id vi`) in `rspress.config.ts` and `theme/locales.ts`, but a language is only built if it has a directory under `docs/docs/`. Today that is `cn` and `en`. Adding a language means creating the directory; the translations are already there.

`cn` is the baseline the structural checks in `check.sh` compare every other language against, so a page added to another language without its `cn` counterpart fails the tree and meta alignment checks.

Dead-link checking runs during build, but only over links in Markdown bodies. The home page's hero actions and feature cards live in frontmatter, so a route named there can be missing without failing the build — those need checking by hand.

## Language

Anything a person outside the team can read is written in English. Anything only the team reads may be written in Chinese.

Write in English:

- Commit messages and pull request titles
- Code comments, including comments in workflow files
- Identifiers, log output, and error messages
- Changeset summaries — they are copied verbatim into the published CHANGELOG
- Everything a GitHub Actions run produces that a contributor sees: `workflow_dispatch` input descriptions, job and step names, job summaries, `::error` and `::warning` annotations, and the body of any pull request the workflow opens

Chinese is fine for:

- Feishu notification titles and bodies, which only reach an internal group

The distinction is the audience, not the file type. A comment inside a workflow is read by maintainers and stays English along with the rest of the code; the Feishu message that same workflow sends never leaves the team, so it stays Chinese.

The workflow files under `.github/workflows/` still carry Chinese comments written before this rule existed. Translate the ones you touch; there is no need to convert the rest in a single pass.

## TypeScript Requirements for Library Development

Library packages that emit `.d.ts` files (`declaration: true`) enable both `isolatedDeclarations: true` and `isolatedModules: true`. The three application templates keep declaration emission and `isolatedModules`, but set `isolatedDeclarations: false` in `tsconfig.server.json`: their full TypeScript build infers application configuration exports such as `export default defineAppDatabaseConfig(...)`. Do not apply this application exception to library packages. The library requirement currently covers:

| Configuration                                              | Purpose                    |
| ---------------------------------------------------------- | -------------------------- |
| `packages/plugins/app-plugin-authentication/tsconfig.json` | Authentication library     |
| `packages/libs/authorization/tsconfig.json`                | Authorization library      |
| `packages/libs/db/tsconfig.json`                           | Database package           |
| `packages/libs/db-testkit/tsconfig.json`                   | Database test contract     |
| `packages/libs/db-sqlite/tsconfig.json`                    | SQLite dialect             |
| `packages/libs/db-postgres/tsconfig.json`                  | PostgreSQL dialect         |
| `packages/libs/db-mysql/tsconfig.json`                     | MySQL dialect              |
| `packages/libs/db-kingbase/tsconfig.json`                  | Kingbase dialect           |
| `packages/libs/db-oceanbase/tsconfig.json`                 | OceanBase dialect          |
| `packages/libs/db-oracle/tsconfig.json`                    | Oracle dialect             |
| `packages/libs/db-mssql/tsconfig.json`                     | MSSQL dialect              |
| `packages/libs/db-dameng/tsconfig.json`                    | Dameng dialect             |
| `packages/app/app-cli/tsconfig.json`                       | Application CLI            |
| `packages/app/app-host/tsconfig.json`                      | Application host           |
| `packages/app/app-server/tsconfig.json`                    | Application server library |
| `packages/libs/caching/tsconfig.json`                      | Caching library            |
| `packages/libs/drive/tsconfig.json`                        | File storage library       |
| `packages/libs/snowflake/tsconfig.json`                    | Snowflake ID library       |
| `packages/libs/logging/tsconfig.json`                      | Logging library            |
| `packages/libs/queue/tsconfig.json`                        | Queue library              |
| `packages/libs/jobs/tsconfig.json`                         | Jobs library               |
| `packages/libs/session/tsconfig.json`                      | Session library            |

Within these scopes, every exported API must be declarable from the current file alone, without relying on cross-file type inference.

### Add Explicit Types to Every Export

- Exported functions, methods, getters, and arrow functions must declare their return types.
- Parameters with defaults must still declare their types. Write `name: string = getDefault()`, not `name = getDefault()`.
- Exported constants must declare their types, especially values inferred from calls such as `createContext(...)` or `new SomeClass()`. For example: `export const client: NocoBaseClient = new NocoBaseClient();`.
- When a function returns an anonymous object, extract the structure into a named exported type and use it as the return type. Existing examples include `RouteSurfaceState`, `AppExtensionContributions`, and `UseGetRolesResult`.

### Do Not Bypass Declaration Errors

Do not use `as any`, `@ts-ignore`, or `@ts-expect-error` to suppress `isolatedDeclarations` errors. Do not widen a type to `any` or `unknown` merely to make compilation pass. These errors indicate that the exported contract needs a precise annotation.

Annotations must match runtime behavior. For example, `resolveAclDataSourceKey` can return `undefined`, so its return type is `string | undefined` rather than `string`. `NocoBaseClient.stream()` throws when `response.body` is absent, so its return type is `Promise<ReadableStream<Uint8Array>>` rather than a nullable stream. Incorrect annotations propagate directly into downstream package failures.

### Validation After Changes

Run `pnpm typecheck` and `pnpm build` for the affected package.

## Other Notes

- Client code in `app-template-default` and `app-template-hub` (`tsconfig.json` and `tsconfig.node.json`) uses `noEmit` and only requires `isolatedModules`; it is not subject to the `isolatedDeclarations` rules above.
