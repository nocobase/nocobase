# Identity-Sensitive Packages and Declaring Dependencies by Usage

Read this before adding or moving a dependency in any package, or when a check from `pnpm peers:check` or `pnpm deps:check` fails.

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

Public classes with private members also carry declaration identity: passing a DatabaseConnection between packages using different db versions can fail type checking even when runtime methods match. A host-owned service a plugin resolves from the container belongs to the rule too, even without any of the state above: `@nocobase/queue` holds no singleton or registry, but every plugin receives the application's `QueueService` and publishes declarations typed against it, so a second copy describes the host's service with another version of its contract. Review public object contracts as well as singletons, including authorization error identity, caching registries, plugin service tokens, and repository-input filter symbols. Ordinary dependencies remain appropriate for implementation details that do not cross the package boundary.

Two cases need no judgement. Every `@nocobase/app-plugin-*` is covered unconditionally, because plugins export tokens for one another and `isIdentitySensitive` matches them by prefix, so a new plugin is included the day it is created. A type-only import that survives in published declarations still needs a consumer-resolvable dependency contract.

When you do add an entry, record what breaks without it rather than only the package name. The reason is what lets the next person apply this rule to a package nobody has seen yet; a bare list decays into something people copy without understanding.

The current entries:

| Package                      | What breaks when a second copy exists                                                                                                                                                                                                              |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@nocobase/service-provider` | `ServiceContainer` keys its `Map` by the token object itself, so two `createServiceToken` calls with the same name produce two keys that never match                                                                                               |
| `@nocobase/app-server`       | Exports the tokens every server plugin resolves against, such as `queueServiceToken` and `driveManagerToken`                                                                                                                                       |
| `@nocobase/db`               | Exports `databaseManagerToken` and migration identity                                                                                                                                                                                              |
| `@nocobase/app-client`       | Exports React contexts plus the identity-keyed `apiClientToken`, `realtimeClientToken`, `toasterToken` and `queryClientToken`                                                                                                                      |
| `@nocobase/app-cli`          | `AppCommand` reads the application the runner located and the runtimes it tracks, so a plugin command built on a second copy runs under another version of that contract                                                                           |
| `@nocobase/i18n`             | Exports the React contexts backing the i18n runtime                                                                                                                                                                                                |
| `@nocobase/queue`            | Plugins receive the host-owned `QueueService` and type their published declarations against it, so a second copy describes that service with another contract version                                                                              |
| `@nocobase/lifecycle`        | A `LifecycleRuntime` is shared between plugins through `addGuard()`, and `EffectFailure` and `LifecycleError` are recognised with `instanceof`, so a second copy neither registers into the runtime it is handed nor recognises the other's errors |
| `@tanstack/react-query`      | The application query cache reaches pages through its React context, so the hooks of a second copy read another context and find no `QueryClient`, or a different one, instead of the application's                                                |
| any `@nocobase/app-plugin-*` | Plugins export tokens for one another, such as `authenticationToken` and `notificationServiceToken`                                                                                                                                                |

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

Some packages a plugin must not declare at all, not even as a peer, because only the host's copy counts and the host re-exports what plugins need. `HOST_ONLY_PACKAGES` in `scripts/check-peer-deps.mjs` lists them with the export to use instead, and `pnpm peers:check` fails a guest that declares one in any dependency field. `hono-openapi` is the first: `describeRoute()` attaches route metadata under a symbol the module owns, and the API document is generated by `@nocobase/app-server`'s copy, which cannot see metadata attached by another, so plugins take `describeRoute`, `apiValidator` and the response helpers from `@nocobase/app-server/router`.

A plugin that contributes CLI commands declares `@oclif/core` as a peer for a related but distinct reason: not module identity, but one shared version, so help rendering and flag parsing behave the same in the plugin and in the application that assembles its commands.

`pnpm plugin:create` emits this shape, so a generated plugin satisfies the rule without further edits. When the list changes, update `packages/tools/create-plugin/src/lib/template.ts` and its tests in the same change — a generator that emits the old shape reintroduces the problem in every plugin created afterwards.

## Declaring Dependencies by How They Are Used

Ordinary server implementation dependencies go in `dependencies`; shared identity-sensitive packages follow the peer rule above even when imported by server code. Browser code a consumer has to resolve goes in `peerDependencies`. Build tooling, tests, and type imports absent from published declarations go in `devDependencies`. `pnpm deps:check` checks server runtime import declarations and runs in CI.

The rule is one question: **does someone outside this repository have to resolve this import?** If yes, declare it as a dependency or peer according to its ownership; a published package's devDependencies are not installed for its consumers.

**A deployed server resolves its imports at runtime.** `pnpm build` emits `dist/server` with its bare imports intact and generates `dist/package.json` by walking `dependencies`. A server module importing something declared only as a devDependency resolves in every development checkout and is absent exactly once — on the deployed server. A plugin shipped this: one of its server modules imported `typescript`, and `typescript` sat in `devDependencies`. The application crashed on start with `Cannot find package 'typescript'`, an error naming nothing that points back at the manifest.

**An installing application resolves a plugin's client imports at build time.** A plugin's `client/` is not bundled by the plugin — `build` is `tsc`, so `dist/client/*.js` keeps its bare imports, and the consuming application's Vite build is what resolves them. That application installed the plugin from a registry, so it has only what the published manifest declares. `@nocobase/app-plugin-notification-provider` shipped `sonner` in `devDependencies`; a generated application failed on `pnpm dev` with `Could not resolve "sonner"`, and another plugin failed the same way on `@xyflow/react`.

That failure cannot be reproduced here, which is why it reached npm twice. The monorepo installs every devDependency and links it into the plugin's own `node_modules`, so the import resolves in development and fails only once the plugin is installed from a registry.

A plugin's client dependency is also easy to believe is fine when it is not. Ten of the twelve affected plugins appeared to work because `app-template-default` happened to declare the same package for its own use; a plugin whose client packages no template happened to declare had no such coincidence and was simply broken. Relying on a template to satisfy a plugin's dependency is not a design, and an application the template did not generate has no reason to declare any of it.

So the question is who resolves the import, and then what the import actually is:

- **An ordinary server value import belongs in `dependencies`; shared identity-sensitive imports are peers.** `import ts from 'typescript'` in `server/` needs a runtime dependency even though TypeScript sounds like build tooling. A shared database connection follows the host-provided peer contract instead.
- **A client value import belongs in `peerDependencies`.** `sonner`, `lucide-react`, `@base-ui/react`, `cn` — the installing application resolves them from the published manifest and provides one shared copy, while a server deployment installs none.
- **A type-only import can belong in `devDependencies` only if consumers do not need to resolve it.** JavaScript erases `import type`, but emitted `.d.ts` files can retain references to that package. Inspect the published declarations and use a dependency or peer contract when those references survive; shared classes with private members follow the peer rule.
- **A dynamic `import()` counts as a value import.** Deferring the load changes when a package is needed, not whether.
- **The `files` field decides whether code ships at all.** A test, an eval harness, or a build script excluded from `files` never reaches a consumer, so its imports are correctly devDependencies.

`registry/` is excluded for a stronger reason than the rest: it is shadcn-style source copied into a consumer and compiled there against that package's own `react` and `package.json#imports`. The recipe's publishing plugin cannot resolve those imports, so declaring them would claim dependencies it does not have.

`peerDependencies` is the third answer, for a package the application must supply exactly one copy of. `react`, `react-dom`, `react-router`, and everything in `IDENTITY_SENSITIVE_PACKAGES` belong here rather than in `dependencies`: a second copy of a router or a React context does not merely waste space, it silently breaks. `@nocobase/i18n` is the shape to copy: it exports a server entry and a client entry from one package, so `i18next` is an ordinary dependency while `react`, `hono`, and `react-i18next` are optional peers. Mark such a peer `optional` in `peerDependenciesMeta` so the consumer that legitimately does not need it gets no warning.

A tool a package **spawns** rather than imports is a dependency too, and it is the one neither check can find: both read import specifiers, so a `spawn('vite', …)` is invisible to them. Declare it as a peer, because the application owns the copy that runs, and record it where someone adding the next one will look — `@nocobase/app-cli` keeps a table of the executables it spawns in its README. Nothing else catches an omission here: the binary resolves from `node_modules/.bin` in this repository and in any generated application, so it is missing only in an application that never installed it.

This rule changed once, and the reason is worth recording. Client imports used to belong in `devDependencies`, because `dist/package.json` was built by walking `dependencies` transitively and dragged every client package into the server deployment — `lucide-react` and `@xyflow/react` alone were 44 MB installed and never required. They are peers now, which keeps them out of a deployment without keeping them out of the application that has to resolve them.

When the check reports something, inspect ownership and usage: declare an ordinary server dependency, declare a shared peer and its application provider, or remove a client or build-time import that leaked into server code. Adding a declaration only to silence the check can leave either a duplicate shared module or an unnecessary deployment dependency.

`pnpm plugin:create` emits a generated plugin's `AGENTS.md` carrying this rule, so a plugin created tomorrow is told where a dependency goes before anyone adds one. When the rule changes here, change `packages/tools/create-plugin/template/AGENTS.md` in the same commit — the two are kept in step by a test, but only for the files' existence, not their content.

## Reading Another Package's Files

A package that uses another workspace package's files declares that package, even when only a test or a configuration reads them. pnpm's dependency graph has only the edges manifests declare, so a test importing `../../../tools/create-plugin/src/…`, a Vitest configuration copying files from `../../templates/app-template-default`, or a stylesheet importing a template's CSS by path depends on that package invisibly: `pnpm --filter <package>...` misses the reader, and the Quality scope selection (`scripts/select-quality-scope.mjs`), which runs a changed package and the packages depending on it, never reruns the reader when the package it reads changes.

Either declare the package (a `devDependency` is enough for a test or a configuration, and the import can then use the package name) or build the fixture the test needs in a temporary directory, as `packages/app/app-server/tests/plugins.test.ts` writes its plugin packages with `mkdtemp`. A declaration must not create a cycle: a plugin cannot declare a template, because every template depends on the plugins it installs.

`pnpm deps:check` runs `scripts/check-cross-package-paths.mjs`, which resolves every relative module specifier, every string literal beginning with `./` or `../`, every `packages/<group>/<name>` literal and every relative path in a stylesheet, tsconfig or `package.json` script, and fails when one lands in another workspace package the reader does not declare. The few reads that cannot be declared are listed in its `EXEMPTIONS`, each with its reason; the check fails once an entry covers nothing. An exempted read that CI runs also needs an entry in `pathDependencies` in `scripts/select-quality-scope.mjs`, so a change to what it reads still selects the reader.

## Commercial database optional peers

The runtime and testing packages retain optional peer contracts for KingbaseES, Dameng and OceanBase with ordinary semver ranges because their source belongs to Pro. The root `.pnpmfile.cjs` omits only those optional peers from OSS development resolution: pnpm otherwise installs workspace projects' optional peers automatically. The hook does not edit package manifests or published artifacts, and it is not applied when OSS is a submodule of Pro. Do not add commercial driver development dependencies to OSS. Pro validates automatic loading against the actual drivers.
