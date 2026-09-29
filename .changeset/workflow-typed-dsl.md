---
'@nocobase/app-plugin-workflow': minor
'@nocobase/dev-config': minor
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-template-hub': patch
'@nocobase/app-skills': patch
---

### Typed workflow DSL

Author workflow definitions with a typed, immutable builder instead of hand-written variable templates.

`workflow()`, exported from `@nocobase/app-plugin-workflow/dsl`, returns a builder that owns the definition's identity. `addNode()` returns a new builder over its own node list rather than mutating the one it was called on, so chained authoring works as before but code that called `addNode()` for its side effect has to keep the returned builder. `finalize()` rejects a node borrowed from another workflow, a node added to two workflows, and a duplicate node key. Give the `input` or `parameters` surface a TypeBox `Type.*` schema to type it; a raw JSON Schema still describes the surface and leaves it untyped. Workflow and node `options` are typed and validated, and preserved through artifacts and database materialization.

Handlers are declared with `defineHandler<typeof handler>('./server/handler')` over a type-only import, so evaluating a definition never loads server implementations or their dependencies. A handler reads invocation input, parameters, and upstream results from one shared context rather than from per-node argument mappings, and each node's result type is inferred from its handler's return type and accumulates through the chain, nested branches included. `finalize()` checks that every handler's context requirements are satisfied by the typed surfaces and upstream results.

The Workflow Skill now explains how to author typed DSL definitions and migrate mapped arguments and JSON Logic conditions to context handlers.

Conditions now run a handler module that returns a boolean, and the JSON Logic engine is removed along with the `expression` config field and the `evaluateJsonLogic`, `validateJsonLogicExpression`, and `JSON_LOGIC_*` exports. An existing definition that configures `expression` must move that comparison into a handler module. A condition's branches can be declared with the chainable `yes()` and `no()` methods, which reject empty and duplicate branch declarations; generic `branch()` authoring still works.

`parameters` accepts the same JSON Schema object shape as `inputSchema`, and `compileToFlatIr()` lowers it to the flat declaration map the parameter editor, the value resolver, and the materializer read. The lower-level `defineWorkflow()` API with `RunInstruction.create()` and friends is unchanged and still exported, together with `createReference()` and `lowerBindings()` for its `{{$input.x}}`, `{{$parameters.x}}`, and `{{$nodeResults.key.path}}` templates. A run node that carries no `args` receives the shared handler context, so both authoring styles execute on one engine.

The examples template's workflows are migrated to the typed builder and read their shared inferred contexts without result casts.

### Custom Instruction nodes

Open the typed workflow builder to application-registered Instructions.

The builder resolved a node's expression metadata from a table holding `run`, `terminate` and `condition`, so a node of any other type failed with `Unknown workflow instruction`. It now reads the node's own type, configuration and branch structure, which is all the expression needs, and `createNode()` is exported so an extension can supply a node factory beside its Instruction class. The custom Instruction reference documents that factory alongside the existing `defineWorkflow()` form.

### Builder validation

Fail finalization when a workflow builder's `addNode()` result was discarded.

`addNode()` returns the workflow containing the node, so calling it for its side effect and finalizing the receiver compiled a definition the node was simply missing from — and with it every handler context requirement `finalize()` would otherwise have checked. Types cannot catch this, because the discarded builder is the only value that carries the node. The builder now records what it has claimed and rejects `finalize()` and `compile()` naming each node that was never compiled, including nodes nested in a branch.

### Workflow client forms

Let a workflow revision render its own custom input and parameter forms.

A workflow package may declare `input.form` and `parameters.form`, resolved inside its own `client/` directory. Those `client` declarations are persisted with the workflow revision and returned by the management API, and the form itself is published under the revision's Artifact hash, so a later build that changes a form cannot change how an already published revision renders. `@nocobase/app-plugin-workflow/vite` exposes those forms to the application build through a virtual module keyed by workflow, revision, and path. In development the module index refreshes when workflow sources change, including added and removed resources, without restarting Vite. Forms get React through bridge exports generated from the installed React modules and the matching host JSX runtimes, so they can use the full React API without bundling a second instance.

Workflow management addresses unpublished candidates by Artifact hash, so a detail URL identifies one exact version. Hot updates refresh the workflow list and version picker; reopen a changed candidate from there, since an unpublished hash can expire. Materialized revision URLs and mutations stay bound to exact versions. Parameter settings and manual run on a version that has not been materialized yet prompt to enable it first, then navigate to the materialized id. A version that was already materialized stays usable while disabled.

### Custom input form schemas

Hand a custom input form the declarations it is typed for.

The manual run dialog passed a workflow's raw input schema properties to a custom input form through an `as never` cast, so a form received whatever the schema happened to hold rather than the `string`, `number` and `boolean` declarations `WorkflowParameterFormProps` promises. The properties are now narrowed at that boundary: a property the contract cannot describe is left out instead of being handed over under a type it does not have.

### Artifact materialization

Materialize workflow revisions on demand rather than at startup.

Startup persists immutable artifact snapshots and publishes client resources, in development as well as production, without creating database revisions. A revision is materialized when a user enables a version, configures its parameters, or runs it manually, and its forms and handlers are resolved from that version's artifact hash. Persisting artifacts, materializing, publishing client resources, and selecting the current version are separate steps: reading parameters and running manually no longer select the current revision, while the first successful parameter save still does. Browser assets are served before the development SPA fallback and restored from persistent storage on startup.

### Application workflow layout

Keep application workflow definitions in a top-level `workflows/` directory and build them to `dist/workflows`.

Development discovery, `workflow build`, `workflow check`, production artifact loading, and the application Skill all use that location.

Application server source may now use extensionless relative imports, so a workflow package can import a handler as `./server/calculate-risk`. All three templates set `module: "ESNext"`, `moduleResolution: "Bundler"`, and `tsc-alias.resolveFullPaths: true` in `tsconfig.server.json`: development runs under `tsx`, and the build runs `tsc-alias` after `tsc` to complete the paths for native Node ESM before workflow resources are collected. Workflow source checking and evaluation resolve extensionless handler imports the same way. A workflow package's `client/` form is typechecked and linted as browser code, through the client project rather than the server build.

`loadAppVitePlugins()` in `@nocobase/dev-config` loads the Vite contribution of every client plugin an application registers, so a template's `vite.config.ts` does not name individual plugins. An application without a `client/plugins.ts` contributes none rather than failing config resolution. A registered package that does not export its `package.json` is read from disk rather than failing config resolution.

The Workflow Vite contribution refreshes the workflow list and materialized revision picker during development by injecting its module index into the development page. The plugin's published client code no longer imports that index, so an application installing the plugin from a registry no longer fails Vite's dependency pre-bundling with `Could not resolve "virtual:nocobase-workflow-client-entries"`, and an application whose `vite.config.ts` does not call `loadAppVitePlugins()` still builds and runs; it only loses the live candidate refresh. To get it, call `loadAppVitePlugins()` as the templates' `vite.config.ts` does.

### Vite source root

Read a Vite contribution's registration options from the application that registered it.

`AppVitePluginRegistration.config` was declared but never populated, so the Workflow Vite plugin's configurable `sourceRoot` could not be set by any application and always resolved to the default. `loadAppVitePlugins()` now parses the options literal the application passed to the plugin factory in its `client/plugins.ts`. Only statically writable values are read — an argument that is not a literal object of literal values leaves `config` undefined rather than reporting a partial one, because the declaration is parsed and never executed. `workflow({ sourceRoot })` is the supported way to point the Workflow client build at a directory other than `workflows`; keep it equal to the `sourceRoot` in the application's server workflow configuration.
