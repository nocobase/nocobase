# @nocobase/runjs

`@nocobase/runjs` contains the shared RunJS data contracts, virtual-workspace compiler, TypeScript editor support, settings helpers, and server hashing utilities.

## Public entries

| Import | Contract |
| --- | --- |
| `@nocobase/runjs` | Source locators, diagnostics, runtime artifacts, path normalization, and stable serialization |
| `@nocobase/runjs/compiler` | Virtual-workspace compilation and source inspection |
| `@nocobase/runjs/compiler/build-identity` | Compiler build identity without loading the compiler |
| `@nocobase/runjs/compiler/portable` | Portable path, import-resolution, built-in module, and diagnostic contracts |
| `@nocobase/runjs/client-v2` | Browser TypeScript environment and project support |
| `@nocobase/runjs/settings` | Settings defaults, conditions, pruning, and Entry selection normalization |
| `@nocobase/runjs/server` | SHA-256 helpers for files, runtime code, and immutable artifacts |

The root entry stays dependency-light. Import compiler, client, settings, or server behavior from its explicit subpath.

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

`@nocobase/runjs/client-v2` provides the small TypeScript environment used by the browser editor. Workspace documents remain isolated by path and version, and editor diagnostics use the same source contracts as server inspection.

The host owns the runtime `ctx` object and the values exposed through `ctx.libs`. RunJS source cannot access a package merely because its types or import name are known. Resource requests still use the current NocoBase user and ACL.

## Settings

`@nocobase/runjs/settings` keeps schema defaults and stored overrides separate. Helpers preserve explicit values, prune properties that are no longer in the active schema, and reset Entry-specific overrides when a binding changes.

Settings descriptors and values are JSON data. Runtime code and source files do not belong in settings payloads.

## Package boundaries

- Root and portable entries do not import client packages
- Client code imports `@nocobase/runjs/client-v2`, never server helpers
- Server code imports `@nocobase/runjs/server` or compiler subpaths
- `compiler/build-identity` remains safe for startup paths that must not initialize the compiler
- Runtime values come from the host context; compile-time support never grants a capability

## Validation

Run server tests sequentially:

```bash
yarn test packages/core/runjs/src/__tests__/compiler-golden.test.ts --run --reporter=verbose
yarn test packages/core/runjs/src/__tests__/compiler-paths.test.ts --run --reporter=verbose
yarn test packages/core/runjs/src/__tests__/package-boundary.test.ts --run --reporter=verbose
yarn test packages/core/runjs/src/__tests__/package-exports.test.ts --run --reporter=verbose
yarn test packages/core/runjs/src/__tests__/settings-condition.test.ts --run --reporter=verbose
yarn test packages/core/runjs/src/settings/__tests__/settings.test.ts --run --reporter=verbose
```

Build the package after compiler or export changes:

```bash
yarn build @nocobase/runjs
```
