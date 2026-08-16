# @nocobase/runjs

`@nocobase/runjs` contains the shared RunJS data contracts, virtual-workspace compiler, settings helpers, JS Template authoring contracts, multi-file Workspace integrations, and server utilities.

## Public entries

| Import | Contract |
| --- | --- |
| `@nocobase/runjs` | Source locators, diagnostics, runtime artifacts, path normalization, and stable serialization |
| `@nocobase/runjs/client` | Dependency-light RunJS registries, runtime logic, error parsing, source resolution, evaluation, and Host lifecycle factory |
| `@nocobase/runjs/compiler` | Virtual-workspace compilation and source inspection |
| `@nocobase/runjs/compiler/build-identity` | Compiler build identity without loading the compiler |
| `@nocobase/runjs/compiler/loader` | Server-only lazy compiler loading that works from source and built packages |
| `@nocobase/runjs/compiler/portable` | Portable path, import-resolution, built-in module, and diagnostic contracts |
| `@nocobase/runjs/js-template/client` | JS Template client context types and settings helpers |
| `@nocobase/runjs/js-template/schema` | Canonical `entry.json` schema and condition contracts |
| `@nocobase/runjs/js-template/schema/server` | Server-only schema file path, content, and digest |
| `@nocobase/runjs/js-template/shared` | Runtime-neutral JS Template settings contracts |
| `@nocobase/runjs/js-template/typegen` | Pure `entry.json.settings` type generation |
| `@nocobase/runjs/settings` | Settings defaults, conditions, pruning, and Entry selection normalization |
| `@nocobase/runjs/server` | SHA-256 helpers for files, runtime code, and immutable artifacts |
| `@nocobase/runjs/workspace/server` | Workspace persistence, compilation, permissions, and services |
| `@nocobase/runjs/workspace/shared` | Runtime-neutral Workspace contracts, client ports, and authoring algorithms |
| `@nocobase/runjs/workspace/swagger` | Workspace API schemas |

The root entry stays dependency-light. Import compiler, settings, or server behavior from its explicit subpath.

## JS Template authoring

The `js-template` entries are the canonical source for JS Template authoring types, schema contracts, and settings type generation. Schema URIs, generated paths, and `js-template:settings/*` imports remain protocol identifiers; package imports use `@nocobase/runjs/js-template/*`.

For example, a JS Block template can type its runtime context with:

```ts
import type { JSBlockContext, RunJSContext } from '@nocobase/runjs/js-template/client';
import type { Settings } from 'js-template:settings/client/js-block/hello-block';

const blockContext: RunJSContext & JSBlockContext<Settings> = ctx;
blockContext.render?.(null);
```

The generated settings import is authoring-only and is not stored with runtime artifacts.

## Multi-file Workspace

The Workspace implementation has three explicit layers:

- `client`, `compiler`, the root entry, and `workspace/shared` are runtime-neutral. The client entry implements the reusable Registry and Runtime Host logic against the ports defined by Shared; neither entry imports a NocoBase client runtime or UI framework. Shared also defines API-client, Flow-context, editor-provider, authoring-surface, diagnostics, and lifecycle-disposal ports. Snapshot, change-plan, path, and diagnostic helpers live here as well.
- `workspace/server` owns Database/Server-backed persistence, compilation materialization, permissions, diagnostics, ZIP handling, and Workspace services. It may depend on NocoBase Database and Server, but never on a browser client.
- Core client-v2 owns the Flow-context adapter and installs the single default Registry and Runtime Host chain through its built-in Flow Engine plugin. The JS Template plugin registers multi-file and TypeScript authoring providers, Studio, and Workspace API lifecycle contributions without owning another default Host.

The package publishes the browser-safe `client` entry for reusable Host logic. Consumers still obtain the active Host through core client-v2; they do not bootstrap a second Host from this entry.

## Virtual-workspace compiler

`compileRunJSSourceWorkspace()` compiles an in-memory set of TypeScript, TSX, JavaScript, JSX, and JSON files. It is asynchronous and callers must await it.

The compiler:

- normalizes relative workspace paths and blocks imports that escape the workspace
- resolves relative files and approved built-in packages without reading arbitrary host files
- rejects dynamic imports and unsupported package specifiers
- uses esbuild for bundling and TypeScript for source-aware semantic diagnostics
- maps diagnostics back to the original source path, line, and column
- returns code, source map, file hash, metadata, diagnostics, and a stable failure code

Built-in packages are rewritten to the matching value supplied through `ctx.libs`. Adding a compile-time import does not expose a new runtime capability.

## Editor and runtime context

The client-v2 browser editor uses CodeMirror for lightweight syntax parsing and completion. Full TypeScript semantic diagnostics run on the server through the RunJS compiler during Check and Save. The TypeScript environment and project files remain compiler internals, not browser public APIs.

The host owns the runtime `ctx` object and the values exposed through `ctx.libs`. RunJS source cannot access a package merely because its types or import name are known. Resource requests still use the current NocoBase user and ACL.

## Settings

`@nocobase/runjs/settings` keeps schema defaults and stored overrides separate. Helpers preserve explicit values, prune properties that are no longer in the active schema, and reset Entry-specific overrides when a binding changes.

Settings descriptors and values are JSON data. Runtime code and source files do not belong in settings payloads.

## Package boundaries

- Root, compiler, `workspace/shared`, and `workspace/server` do not import client packages, including through type-only imports
- Runtime-neutral Workspace code does not import Flow Engine host types; adapters exchange data through `workspace/shared` ports
- Browser client code uses the dependency-light root or settings entry and never imports compiler or server helpers
- Server code imports `@nocobase/runjs/server` or compiler subpaths
- JS Template consumers import only `@nocobase/runjs/js-template/*`
- Workspace consumers import neutral contracts from `@nocobase/runjs/workspace/shared` and server behavior from the explicit server or Swagger entry
- `compiler/build-identity` remains safe for startup paths that must not initialize the compiler
- `compiler/loader` is server-only and resolves the compiler adjacent to its source or built module
- Runtime values come from the host context; compile-time support never grants a capability

## Validation

Run server tests sequentially:

```bash
yarn test packages/core/runjs/src/compiler/__tests__/compiler-golden.test.ts --run --reporter=verbose
yarn test packages/core/runjs/src/compiler/__tests__/compiler-paths.test.ts --run --reporter=verbose
yarn test packages/core/runjs/src/workspace/server/__tests__/client-import-boundaries.test.ts --run --reporter=verbose
yarn test packages/core/runjs/src/__tests__/settings-condition.test.ts --run --reporter=verbose
yarn test packages/core/runjs/src/settings/__tests__/settings.test.ts --run --reporter=verbose
```

Build the package after compiler or export changes, then verify the real tarballs from an external consumer. Quick mode packs RunJS and JS Template; the real-client-v2 mode also packs client-v2 and checks the final browser dependency topology. The real-client-v2 mode is not supported on Windows.

```bash
yarn build @nocobase/runjs
yarn --cwd packages/core/runjs verify:package-boundary --json
yarn --cwd packages/core/runjs verify:package-boundary --real-client-v2 --json
```
