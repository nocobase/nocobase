# @nocobase/app-plugin-workflow

Provides the complete optional Workflow capability. The typed authoring API lives in `dsl/`, browser-safe graph helpers live in `client/`, and server code is organized by responsibility under `server/collections`, `server/engine`, `server/instructions`, `server/loader`, `server/repositories`, and `server/routes`, with `server/service.ts` as the domain service entry. TypeScript source loading, checking, package scanning, and Artifact generation live behind the build boundary and are not loaded by the production server runtime.

The package root is the workflow authoring entry (`defineWorkflow`, `condition`,
`terminate`, and `run`). Application integration uses the deliberately small `./server`
entry, application build tooling uses the contributed `workflow` CLI topic, and browser
management UI uses `./client`. Runtime loading and synchronization modules are
package-internal; `./build` remains public for applications that need to supply
custom Instruction contracts.

Applications build their source-owned workflow packages through the installed
command:

```bash
pnpm nocobase workflow build \
  --source-root workflows \
  --dist-root dist/workflows \
  --resource-root dist/workflows
```

Applications with custom Instructions can use the public build API and pass
the same contracts that their server plugins register at runtime:

```ts
import { buildApplicationWorkflows } from '@nocobase/app-plugin-workflow/build';

await buildApplicationWorkflows({
  sourceRoot: 'workflows',
  distRoot: 'dist/workflows',
  instructions,
});
```

In development, omit `resourceRoot` so artifacts retain the source package's
relative `.ts` resources. In production, run the application's normal server
build first and point `resourceRoot` at its compiled workflow tree. Artifacts
then retain the same relative paths with `.js` resources. The plugin owns
workflow discovery, validation, resource collection, and Artifact emission; it
does not compile run modules separately or maintain a module-path manifest.

## Revision lifecycle

Production startup persists deployment Artifacts and publishes client resources without creating database revisions. On-demand materialization persists private resources and publishes client resources before creating database records; it does not select the current revision. Enabling a revision explicitly selects it as current. The first successful parameter save also selects a current revision, leaving it disabled, while later parameter saves preserve any existing current revision. Reading parameters and manually running a revision do not select it as current.

## Development loading

A development server does not need a separate build command. When a workflow source root is configured, the loader discovers and prepares snapshots from `workflows` on demand, so edits appear without restarting. Unchanged source reuses the cached snapshot. Preparing a changed snapshot includes bundling its browser resources; viewing it does not create a database revision.

Development loading uses the same schema validation, semantic validation, and flat IR compilation as the build. It skips `ts.createProgram`, which the application's own typecheck covers, and the disposable evaluation process, which a development server running under a TypeScript loader does not need. Its digest identifies the local source snapshot for development use. A production build collects compiled `.js` resources instead of `.ts` source, so its Artifact has a different digest; that digest identifies the deployable bytes and is verified when the Artifact is stored and loaded.

Development also validates against the instruction set the engine will execute with rather than the core set alone, so an instruction a plugin registers at runtime is understood without configuring a build entry for it. A key that exists only under `dist/workflows` is still offered, and source wins for a key present in both.

Both development and production materialize immutable resource snapshots into the persistent artifact store. Executions and forms use the selected database version's hash to load its saved resources, never the current source. Enabling an edited candidate creates a new version; old ids retain their original handlers and forms. Startup restores public browser resources from the private store, which must be preserved alongside the database. Legacy development versions without saved resources require a matching backup or a newly enabled version; their hashes cannot reconstruct missing files.

`nocobase workflow check <package> --ir` prints the same compiled flat IR for one
package, with the full five-phase check, for reading a definition outside a
running server.

The CLI evaluates each declarative `workflow.ts` in a bounded disposable Node
process, so it does not need a separate bundler. TypeScript is provided by the
application's existing build toolchain for source checking. The CLI and its
build modules remain part of the published package so applications can build
Workflow Artifacts, but the production `./server` runtime module graph does not
load those modules or TypeScript. Development source loading is the one part of
the build boundary a running server reaches, and it does so through a dynamic
import that a production runtime never evaluates and that never loads the
compiler.

The client contributes Workflows and Workflow runs under the application's Automation settings group. Their record detail routes stay inside the settings layout at `/settings/workflow/workflows/:id` and `/settings/workflow/runs/:id`.

Register it with `pnpm nocobase plugin register workflow --workspace-root . --app app-template-default`.
Application-owned workflow source remains in the application package. The
plugin itself owns and publishes its complete management UI; enabling the
plugin is sufficient to register the Automation settings pages and their
detail routes.

Run modules receive execution options containing a read-only application
service resolver, the Workflow abort signal, and a contextual logger. They
import the service owner's original public token and can consume configured
application services without receiving the Application or its mutable
container.

Server plugins can contribute an instruction through the public Workflow
service. Duplicate instruction types are rejected, while registration timing
is intentionally unrestricted:

```ts
const workflow = app.container.resolve(workflowServiceToken);
workflow.registerInstruction(CustomInstruction);
```

## Typed workflow context

Chain `workflow(...).addNode(node)` calls to accumulate node contracts; `addNode()` returns the builder rather than the node. `ContextOf<typeof flow>` exposes the workflow input, parameters and all result-producing nodes, including nested branches. Each node result is optional because it may not have executed. `finalize()` and `compile()` check handler context compatibility without enforcing execution order or changing runtime schemas.

Declare a handler with `import type { run as calculate } from './server/calculate'` and `defineHandler<typeof calculate>('./server/calculate')`. The descriptor stores only a brand and module path at runtime, while its type retains the handler signature. Definition checking, development discovery, and Vite parsing do not load the handler implementation through this declaration; node execution loads the module and calls `run`. Keep the type import and module path aligned; this correspondence is not yet checked automatically.

When independent handler modules import their own workflow context, use a member-by-member interface to keep recursive inference lazy, and explicitly declare handler return types where needed:

```ts
export interface FlowContext {
  input: ContextOf<typeof flow>['input'];
  parameters: ContextOf<typeof flow>['parameters'];
  nodeResults: ContextOf<typeof flow>['nodeResults'];
}
```

Handlers use `import type` for this interface. See [context handlers](skills/nocobase-app-plugin-workflow/references/dsl-authoring.md#context-handlers) for the complete authoring pattern and the distinction between context access and explicit reference lowering.

## Development dependencies

The Workflow tests use `@nocobase/db-sqlite`, which owns the `better-sqlite3` runtime dependency and uses the version in the workspace catalog. The plugin does not declare the native driver separately, so its tests exercise the same driver as applications.

## Agent Skill

The Workflow Agent Skill lives at
`skills/nocobase-app-plugin-workflow` and is published with this
plugin. Whenever the DSL, registered instructions, checker, Artifact builder,
service APIs, or runtime contracts change, review and update the Skill in the
same change.

The Skill is tailored to the default application's workflow source root.
Plugin activation infrastructure is responsible for exposing installed plugin
skills to agents under the application's `.agents/skills/` directory.
