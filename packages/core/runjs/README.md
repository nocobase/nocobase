# @nocobase/runjs

Shared RunJS contracts, stable hashing helpers, source inspection, and the virtual-workspace compiler.

The root entry is dependency-light. Compiler functionality is exported from `@nocobase/runjs/compiler` and depends only on TypeScript plus Node.js standard-library modules.

## Custom library type extensions

A custom `ctx.libs.xxx` integration has four independent responsibilities:

1. Register the runtime value with `registerRunJSLib()` from `@nocobase/flow-engine`. Keep the returned disposer and call it when the plugin or App scope is destroyed.
2. Register a browser type pack with `registerRunJSTypeLibrary()` or an App-local `RunJSTypeLibraryRegistry` from `@nocobase/client-v2`. The registration describes the runtime library name, static source triggers, dynamic pack loader, expected version/hash, and an optional completion catalog loader.
3. Register a synchronous Node declaration provider with `registerNodeRunJSTypeLibrary()` or pass an isolated `NodeRunJSTypeLibraryRegistry` to `inspectRunJSSourceWorkspace()`. Node providers must not import browser chunks or DOM-only modules.
4. Put a bridge declaration in the pack/provider root files. Augment `RunJSLibraries` for `ctx.libs.xxx`; augment `RunJSContext` separately only when a compatible top-level alias exists at runtime.

`CodeEditorTypeScriptProject.typeLibraryIds` and `InspectRunJSSourceWorkspaceInput.typeLibraryIds` force a registered pack to load when static source analysis cannot identify it. `declarationFiles` remains the editor workspace-local escape hatch and does not replace a reusable library registration.

Registries reject duplicate IDs, declared version/hash mismatches, dependency mismatches, and different content hashes for the same virtual path. App-local registries inherit core built-ins but isolate plugin providers from other App instances. Dispose the registry to release all registrations and cached loads in that scope. An unregistered `ctx.libs` property remains `unknown`.
