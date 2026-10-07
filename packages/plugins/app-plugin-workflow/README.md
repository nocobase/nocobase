# @nocobase/app-plugin-workflow

Provides the complete optional Workflow capability. The typed authoring API lives in `dsl/`, browser-safe graph helpers live in `client/`, and server code is organized by responsibility under `server/collections`, `server/engine`, `server/instructions`, `server/loader`, `server/repositories`, and `server/routes`, with `server/service.ts` as the domain service entry. TypeScript source loading, checking, package scanning, and Artifact generation live behind the build boundary and are not loaded by the production server runtime.

The package root is the workflow authoring entry (`defineWorkflow`, `condition`, `terminate`, `run`, and `wait`). Application integration uses the deliberately small `./server` entry, application build tooling uses the contributed `workflow` CLI topic, and browser management UI uses `./client`. Runtime loading and synchronization modules are package-internal; `./build` remains public for applications that need to supply custom Instruction contracts.

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

## Persistence, leases and recovery

A Processor runs in segments: the first one from the head node, and one more each time something resumes a suspended node. What a segment produces — its Node Runs, the Workflow Run's new state and the consumption of the resume request it applied — is written once, in a short transaction, when the segment exits. The database therefore always holds a checkpoint and never a step in between: a node that is merely entered leaves no row, a pending Node Run appears together with everything before it, and a segment that crashes or loses its checkpoint is repeated from the previous one. The transaction does not cover the code that produced the segment, so a repeated segment may repeat that code's side effects; make external calls idempotent with a stable business key rather than the Node Run id, which a repeated segment allocates again.

Run and Node Run ids are allocated before the row exists, from the application's snowflake id service (`idGeneratorToken` of `@nocobase/app-server/id-generator`). Every instance has to run with its own `snowflake.workerId` (0 to 31) so that two instances never allocate the same id (a run's id is also its creation order); the latest Node Run of a node key is the one with the highest id. A production application that does not register `IdGeneratorProvider` fails to start the workflow service rather than fall back to a single-process generator; outside production the engine falls back to one on worker 0.

Exactly one worker executes a Workflow Run at a time. Every task — the first execution, a resumption, a rerun — takes a lease on the run (`leaseToken`, `leaseExpiresAt`), renews it while it works, and releases it after its checkpoint. A lease that is not renewed expires after `leaseTtlMs` (60 seconds), so a stopped worker cannot hold a run forever, and a checkpoint is written only while the run is still started and still carries the writer's token, so a worker that was replaced cannot overwrite its successor and a cancelled or timed-out run is not resurrected. A rerun or resumption that finds the run leased is not lost: a rerun fails with `WorkflowBusyError`, and a resume request stays queued until the holder has finished.

Anything that resumes a suspended node from outside the Processor writes a row to `workflowResumeRequests` instead of reaching into the run: `wait.resume()` for a wait, and the engine itself for a node whose own background work produces the result, such as a Run node's script. `ResumeRequestService.submit()` validates the payload, makes it idempotent by `(run, node key, idempotency key)`, allows one live request per Node Run and writes it in the same transaction that confirms the node is still pending, and only then publishes the task that applies it. That confirmation is a conditional update of the Node Run row rather than a read, so it waits for a checkpoint that is completing the node and sees its result: a request is never accepted for a node that has just stopped waiting. A request is `queued`, `processing` while a worker applies it, and finally `consumed` together with the checkpoint, or `rejected` with a reason when it can no longer apply: `stale` when the node stopped waiting, or is waiting for a later execution than the one the request answers, `run-ended`, `target-missing`, or `commit-failed`. Accepting a request is therefore not applying it, and `wait.getRequest(requestId)` reports where a wait decision stands.

Every write to a request after it is claimed — renewing the claim, releasing it, rejecting it, consuming it — is conditioned on `claimToken`, the lease token of the worker that claimed it. A worker whose lease expired and whose claim was reset and taken over therefore cannot hand its successor's request back to the queue or reject it; its writes match nothing and it leaves the request alone.

A Run node's script is background work: its node is suspended by `processor.scheduleBackground()`, and the checkpoint that stores the node as pending writes, in the same transaction, the request its result will arrive in, in state `executing`. After the commit the request is delivered to a worker, which claims it with a token of its own, renews the claim while the script runs, and on completion writes the result onto the same row and moves it to `queued`, from where it is applied like any other request. The script is run by an instruction rebuilt from the stored run (its `background()` method), never by a closure of the segment that scheduled it, so a worker that stops between the checkpoint and the script, or while the script runs, leaves an `executing` request that recovery hands to another worker. A script therefore runs at least once: `options.idempotencyKey` identifies the execution of the node and stays the same when it is run again, and external side effects have to be keyed on it. Each claim counts as an attempt; a script interrupted five times is not started again, and its node fails instead.

An overwriting rerun restarts a Node Run under its old id with a new `startedAt`, and its checkpoint rejects whatever requests were still live for the execution it replaced, `executing` ones included. A script of the replaced execution that finishes late finds its request no longer its own and drops the result, and a Run node's result also names the execution that produced it by that `startedAt`, which `resume()` checks before applying it.

A segment whose checkpoint cannot be committed changes nothing, so its request goes back to the queue. Each such failure is counted in the request's `attempts`; after five, the failure is taken to be one a retry cannot cure — a value the database refuses rather than an outage — and the request is rejected as `commit-failed` while the run ends in error. A segment with no request to retry ends the run in error at once. The error is written without the Node Runs that failed to commit, which would fail again. A request that was not applied — its message was lost, the run was busy, or the worker that claimed it stopped renewing — is published again by `Dispatcher.recoverResumeRequests()`, which the engine runs at startup and every 30 seconds. The same scan republishes background work nobody claimed within the grace period and work whose worker stopped renewing its claim.

What is and is not recovered automatically:

| Interrupted work                                                           | Recovery                                                                                                                                                                                     |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A segment applying a resume request (a wait decision, a Run node's result) | Recovered. The request is claimed again once the lease expires and the segment is repeated from the previous checkpoint; after five failed commits it is rejected and the run ends in error. |
| The first execution of a run, a manual rerun                               | Not recovered. A checkpoint that cannot be committed ends the run in error; a crash leaves it `STARTED`. Rerun it manually.                                                                  |
| A Run node's script, before it starts or while it executes                 | Recovered. The script is run again, at least once in all, under the same `options.idempotencyKey`; after five interrupted attempts the node fails.                                           |

The schema declared for a wait's result describes the result type for authors; `wait.resume()` validates that the result is JSON of at most 65,536 bytes, not that it matches the schema.

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
