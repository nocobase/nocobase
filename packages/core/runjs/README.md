# @nocobase/runjs

Shared RunJS contracts, stable hashing helpers, source inspection, and the virtual-workspace compiler.

The root entry is dependency-light. Compiler functionality is exported from `@nocobase/runjs/compiler` and uses
TypeScript for semantic diagnostics plus esbuild for server-side workspace bundling. Browser-specific type-library
contracts are exported from `@nocobase/runjs/client-v2`.

`compileRunJSSourceWorkspace()` is asynchronous because workspace files are resolved through an in-memory esbuild
plugin. Callers must await its result.

## TypeScript type-library architecture

RunJS deliberately starts with `noLib: true` and a small NocoBase runtime declaration. Official third-party
declarations are loaded only when source usage requires them.

- The browser editor uses asynchronous logical type packs registered in a `RunJSTypeLibraryRegistry`. Generated
  loaders assemble each pack from its NocoBase root bridge and a content-addressed declaration graph.
- Node source inspection uses synchronous providers registered in a `NodeRunJSTypeLibraryRegistry`.
- Both paths use the same library names, pack IDs, source triggers, root bridges, dependency paths, versions, and
  content hashes.
- Browser declaration graphs are keyed by the stable hash of the ordered declaration closure after files supplied by
  explicit pack dependencies are removed. Packs with the same closure share one graph module and one cached Promise.
- Static Ant Design components and icon groups load symbol or group packs. Computed access, spreads, escaping aliases,
  and other unbounded usage load the corresponding `full` pack.
- A pack bridge augments `RunJSLibraries` and, only when the runtime has the matching top-level alias, `RunJSContext`.
- DOM declarations are type-only. A declaration such as `File` may be used as a type, but the bare runtime value stays
  unavailable unless it is explicitly exposed; use `window.File` for the value.

Do not add ambient `declare module` stubs for installed libraries. They hide errors from official declarations and can
silently override generated packs. Small interfaces such as the top-level `ctx.message`, `ctx.notification`, and
`ctx.modal` declarations are NocoBase runtime overlays, not replacements for the `antd` module.

## Generated artifacts

Run the unified generator from the repository root after changing a type dependency, pack definition, bridge, or
completion definition. It always generates completion catalogs first, then the DOM bridge, then type packs:

```bash
yarn workspace @nocobase/runjs generate
```

CI and pre-commit verification must use check mode. Completion and type-pack checks compare their committed manifests;
the DOM check compares its committed bridge. Ignored build inputs are recreated by the build lifecycle:

```bash
yarn workspace @nocobase/runjs generate:check
```

The generators own these outputs:

- A committed browser type-pack manifest under
  `packages/core/client-v2/src/flow/components/code-editor/type-packs/generated/manifest.ts`. It records pack hashes,
  graph hashes, versions, sources, and size statistics without declaration bodies.
- Ignored browser build inputs under the same generated directory: `loaders.ts` and content-addressed `graphs/`
  modules. They are recreated from the locked npm declarations during dependency installation and client builds; they
  are not source artifacts or npm package source files.
- A committed completion manifest plus ignored browser catalogs and loaders under
  `packages/core/client-v2/src/flow/components/code-editor/completion-catalogs/generated/`.
- Ignored shared Node completion data in `src/completion-catalog/generated.ts`.
- The DOM type-only bridge in `src/generated/dom-type-only-bridge.ts`.

Never edit generated files by hand. Change the source definition or generator, regenerate, and review the manifest
diff. Unexpected versions, pack hashes, or graph hashes indicate failed generation, not a reason to patch the artifact.

## Adding a built-in official type library

Use the following sequence so the browser and Node contracts cannot drift:

1. Confirm that the runtime library is actually exposed by RunJS and install or update its official declaration
   package in the repository. Prefer declarations shipped by the package; otherwise use the matching `@types/*`
   package.
2. Add the declaration entry and pack definitions under `scripts/`. The entry must resolve from the repository root
   and must include every transitive declaration dependency required by TypeScript. The generator derives and shares
   the content-addressed graph automatically.
3. Choose stable pack IDs. Use a single library pack for small libraries, symbol/group packs for large static surfaces,
   and a `full` pack for dynamic access. Dependencies must reference exact IDs, versions, and content hashes.
4. Add a minimal root bridge. It should normally use `typeof import('package')` and augment `RunJSLibraries`. Add a
   top-level `RunJSContext` property only if the runtime exposes the same value there.
5. Add source-usage definitions for `ctx.libs.<name>`, supported top-level aliases, and type-only module references.
   Static usage should select the smallest pack; ambiguous usage must fall back to `full` rather than inventing a
   partial type.
6. Register the asynchronous browser loader in the client-v2 registry and the synchronous Node provider in
   `src/compiler/node-type-library.ts`. The Node provider must not import browser chunks, DOM runtime modules, or
   client packages.
7. If the library needs completion before its declarations are loaded, add a catalog definition. Keep catalog entries
   as names and lightweight metadata; declaration bodies belong in asynchronous packs.
8. Regenerate all affected artifacts and run generator, source-inspection, browser-project, package-boundary, and
   diagnostic-parity tests.

### Pack contract

Each logical pack keeps its stable `id`, `libraryName`, `version`, `contentHash`, dependency list, root files, and
dependency files. The generated manifest additionally records the `graphHash` used to load its shared declaration
closure. Root files contain RunJS bridges and are TypeScript program roots. Dependency files come from the shared
declaration graph, satisfy module resolution, and must not independently become roots. The registries reject:

- duplicate provider or pack IDs;
- declared dependency version or content-hash mismatches;
- different content hashes for the same virtual path;
- incompatible packs attempting to replace an already loaded full pack.

The pack content hash identifies the complete pack contract, not merely a package version. The graph hash identifies
the ordered dependency-file closure after explicit pack dependencies are excluded. Reuse the same virtual path only
when the content is byte-for-byte compatible.

## Custom library type extensions

A custom `ctx.libs.xxx` integration has four independent responsibilities:

1. Register the runtime value with `registerRunJSLib()` from `@nocobase/flow-engine`. Keep the returned disposer and
   call it when the plugin or App scope is destroyed.
2. Register a browser type pack with `registerRunJSTypeLibrary()` or an App-local `RunJSTypeLibraryRegistry` from
   `@nocobase/client-v2`. The registration describes the runtime library name, static source triggers, dynamic pack
   loader, expected version/hash, and an optional completion catalog loader.
3. Register a synchronous Node declaration provider with `registerNodeRunJSTypeLibrary()` or pass an isolated
   `NodeRunJSTypeLibraryRegistry` to `inspectRunJSSourceWorkspace()`. Node providers must not import browser chunks or
   DOM-only modules.
4. Put a bridge declaration in the pack/provider root files. Augment `RunJSLibraries` for `ctx.libs.xxx`; augment
   `RunJSContext` separately only when a compatible top-level alias exists at runtime.

`CodeEditorTypeScriptProject.typeLibraryIds` and `InspectRunJSSourceWorkspaceInput.typeLibraryIds` force a registered
pack to load when static source analysis cannot identify it. `declarationFiles` remains an editor workspace-local escape
hatch and does not replace reusable library registration.

Registries reject duplicate IDs, declared version/hash mismatches, dependency mismatches, and different content hashes
for the same virtual path. App-local registries inherit core built-ins but isolate plugin providers from other App
instances. Dispose the registry to release all registrations and cached loads in that scope. An unregistered `ctx.libs`
property remains `unknown`.

## Completion catalogs

Completion catalogs let the editor suggest large library surfaces without eagerly loading declaration text. They are a
navigation aid, not an independent type definition. Selecting or inspecting an entry must still load the matching
official pack before TypeScript computes diagnostics, hover, or completion details.

Keep symbol-to-pack mapping aligned with source-usage analysis. For example, an Ant Design component completion must
resolve to its component pack, an icon to its letter group, and computed access to the full pack. Run the catalog
generator whenever dependency exports or grouping rules change.

## Validation

Run server-side RunJS tests sequentially:

```bash
yarn test packages/core/runjs/src/type-packs/__tests__/generator.test.ts --run --reporter=verbose
yarn test packages/core/runjs/src/completion-catalog/__tests__/generator.test.ts --run --reporter=verbose
yarn test packages/core/runjs/src/dom-type-only-bridge/__tests__/generator.test.ts --run --reporter=verbose
yarn test packages/core/runjs/src/__tests__/typescript-library-usage.test.ts --run --reporter=verbose
yarn test packages/core/runjs/src/__tests__/package-boundary.test.ts --run --reporter=verbose
yarn test packages/core/runjs/src/__tests__/final-diagnostic-matrix.test.ts --run --reporter=verbose
```

The final diagnostic matrix is pure data in
`src/__tests__/fixtures/runjs-typescript-final-matrix.ts`. Node source inspection and the compiler gate consume it;
browser project tests should consume the same cases and compare TypeScript diagnostic codes plus the stable message
fragments, not full compiler wording.

Browser editor tests use the client test command, for example:

```bash
yarn test:client packages/core/client-v2/src/flow/components/code-editor/__tests__/typescriptProject.test.ts --run --reporter=verbose
```

After source changes, run `yarn eslint --fix` on touched files and run the relevant package type check.

## Performance and production build checks

The ordinary editor path must not include third-party declaration bodies. The chunk measurement enforces graph count,
raw/gzip graph size, graph sharing, and initial-chunk budgets:

```bash
node packages/core/client-v2/src/flow/components/code-editor/__tests__/measure-runjs-typescript-chunk.mjs
```

Use the lightweight baseline probe when comparing TypeScript timing or Language Service creation behavior. It reports
measurements without enforcing unstable machine-specific latency thresholds:

```bash
yarn test:client packages/core/client-v2/src/flow/components/code-editor/__tests__/runjsTypeScriptBaseline.bench.ts --run --reporter=verbose
```

Treat a chunk-budget failure as a release blocker unless the budget and rationale are deliberately reviewed. The
current graph budgets are 60 chunks, 8 MiB raw, and 2 MiB gzip while retaining all 109 logical packs.

Build once with a non-root public path before release:

```bash
APP_PUBLIC_PATH=/nocobase/ yarn build:client-v2
```

In a served production build, confirm that normal JavaScript loads no third-party declaration graph, static symbols do
not load the full logical pack, dynamic access does load the full pack, and all declaration-graph and Worker chunk URLs
return `200` under the configured prefix or CDN origin. Verify immutable cache headers for content-hashed chunks and
confirm a new build does not reuse an old declaration with a different version or hash.

## Worker, public path, and CSP

The browser TypeScript language service may run in a module Worker. Pack loading still follows the owning App registry;
the main thread transfers requested packs to the Worker and must preserve version/hash checks. Production verification
must cover diagnostics, hover, completion edits, rapid file switching, disposal, Worker crashes, and restart without
accepting stale responses from the previous Worker.

The deployment must allow the generated Worker and dynamic declaration-graph URLs:

- `APP_PUBLIC_PATH`, reverse-proxy prefixes, and CDN asset bases must agree with the built chunk URLs.
- CSP must permit the application script origin and Worker creation. Configure `worker-src` explicitly when the
  deployment does not inherit a suitable `script-src`.
- Cross-origin CDN responses must have the headers required for module scripts and Workers.
- Do not solve a deployment problem by embedding declaration bodies back into the initial editor chunk.

If Worker creation is unavailable, the supported fallback must produce the same diagnostic matrix and keep registry
isolation. Repeated Worker crashes, a pack request that never resolves, or diagnostics from an older document version
indicate a session-recovery bug rather than a type-pack generation problem.

## Dependency upgrades

When upgrading React, ReactDOM, Ant Design, icons, dayjs, lodash, mathjs, Formula.js, TypeScript, or DOM declarations:

1. Update dependencies and confirm runtime/declaration major-version compatibility.
2. Regenerate the logical pack manifest and declaration graphs, the DOM bridge when TypeScript DOM declarations
   changed, and completion catalogs when exports changed.
3. Run `yarn workspace @nocobase/runjs generate:check` and ensure the working tree remains unchanged.
4. Review manifest versions, pack and graph hashes, dependency closures, unique graph sizes, removed or added virtual
   files, symbol grouping, and completion changes.
5. Run the shared Node/browser diagnostic matrix, registry conflict tests, DOM boundary tests, baseline probe, chunk
   budget measurement, and non-root production build.
6. Test upgrading an already opened application so cached old chunks cannot silently satisfy new manifest requests.

## Troubleshooting

### A library stays `unknown`

Confirm that the runtime name, usage definition, bridge augmentation, and registry `libraryName` are identical. For
custom libraries, verify registration occurs in the active App registry and has not already been disposed. Use
`typeLibraryIds` only when the source cannot express a detectable static reference.

### A static symbol loads the full pack

Inspect aliases, computed keys, spreads, rest bindings, and values passed to unknown functions. These deliberately force
the full fallback. If access is statically knowable, update usage analysis and add a regression test rather than adding
a private loader bypass.

### Browser and Node diagnostics differ

Check that both registries use the same bridge, official declaration version, virtual paths, dependency closure, and
pack selection. Add the case to the shared final matrix. Do not weaken one side with `any`, an index signature, or an
ambient module stub.

### Generator check fails

Run the corresponding generator without `--check`, inspect the diff, and find the source dependency or definition that
changed. Generated output should be deterministic; repeated generation with no input changes must produce no diff.

### A declaration-graph chunk or Worker fails to load

Inspect its resolved URL, `APP_PUBLIC_PATH`, CDN/reverse-proxy routing, response MIME type, CORS, and CSP. A successful
development-server URL does not prove that a prefixed production build works.

### Completion works but diagnostics are missing or stale

The catalog may be loaded while the declaration graph failed. Check graph chunk loading, pack request/result messages,
pack version or content-hash rejection, document versions, Worker restart state, and registry disposal. Completion
catalog data must never be treated as a type authority.

## Release and rollback

Release notes should identify the official libraries covered, static symbol/group loading, dynamic full fallback,
custom browser/Node providers, the DOM type-only boundary, and Worker execution when enabled. Known limitations should
include dayjs plugin APIs that are not part of the generated base pack, optional library plugins not present in installed
declarations, the first-use cost of full packs, and deployment requirements for Worker/CSP/public paths. Type
availability does not make a library available at runtime.

Prefer reverting a self-contained Worker migration commit if Worker production behavior regresses; the type-pack and
Node-provider work can remain in place. For a declaration regression, revert the source definition or dependency change,
regenerate all affected artifacts, and rerun checks. Never repair a release by editing generated output or adding a
long-lived feature flag that leaves two unverified type systems in production.
