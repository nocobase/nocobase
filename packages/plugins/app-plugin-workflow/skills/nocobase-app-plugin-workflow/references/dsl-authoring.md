# DSL Authoring

## Contents

- [Context handlers](#context-handlers)
- [Migrate an existing definition](#migrate-an-existing-definition)
- [Package and imports](#package-and-imports)
- [Node types](#node-types)
- [Complete current example](#complete-current-example)
- [Default application lifecycle](#default-application-lifecycle)
- [Top-level definition](#top-level-definition)
- [Input Schema](#input-schema)
- [Administrator parameters](#administrator-parameters)
- [Topology and keys](#topology-and-keys)
- [Condition nodes](#condition-nodes)
- [Terminate nodes](#terminate-nodes)
- [Run nodes and scripts](#run-nodes-and-scripts)
- [Variables and templates](#variables-and-templates)
- [Node result schemas](#node-result-schemas)
- [Validation and compilation](#validation-and-compilation)
- [Error-prevention checklist](#error-prevention-checklist)

## Migrate an existing definition

For an existing `defineWorkflow()` package, follow [Migrate the previous DSL](dsl-migration.md). Convert its definition and handler modules together; mapped arguments and JSON Logic conditions have different handler contracts from the typed builder.

## Context handlers

Import authoring factories from `@nocobase/app-plugin-workflow/dsl`. Use `.run(defineHandler<typeof run>('./server/calculate'))` without `.input()` or `.output()`. The module exports `run`; its first argument receives `{ input, parameters, nodeResults }`, and its second argument provides execution services, cancellation and logging.

```ts
// workflow.ts
import { Type } from '@sinclair/typebox';
import {
  workflow,
  createRunInstruction,
  defineHandler,
  type ContextOf,
  type WorkflowSourceAst,
} from '@nocobase/app-plugin-workflow/dsl';
import type { run as calculate } from './server/calculate';

const flow = workflow({
  key: 'calculation',
  title: 'Calculation',
  input: { schema: Type.Object({ amount: Type.Number() }) },
  parameters: { schema: Type.Object({ rate: Type.Number({ default: 1 }) }) },
}).addNode(
  createRunInstruction({
    key: 'calculate',
    title: 'Calculate',
    description: 'Multiply the invocation amount by the configured rate.',
  }).run(defineHandler<typeof calculate>('./server/calculate')),
);

export interface FlowContext {
  input: ContextOf<typeof flow>['input'];
  parameters: ContextOf<typeof flow>['parameters'];
  nodeResults: ContextOf<typeof flow>['nodeResults'];
}

const definition: WorkflowSourceAst = flow.finalize();
export default definition;
```

```ts
// server/calculate.ts
import type { FlowContext } from '../workflow';

export function run({ input, parameters }: FlowContext): { total: number } {
  return { total: input.amount * parameters.rate };
}
```

Chain `addNode()` calls or keep their returned builder. The builder is immutable: `addNode()` returns the workflow containing that node and leaves the receiver with the node list it already had, so discarding the result drops the node from the definition rather than appending it unchecked. Keep a separate node variable when the node itself is needed again, such as for a branch. A node may still belong to only one workflow, so two builders derived from the same `workflow()` call cannot both compile the same node.

Use the member-by-member `FlowContext` interface above for handlers that refer back to their workflow. A direct `type FlowContext = ContextOf<typeof flow>` alias can create a circular inference error. Give those handlers explicit return types to avoid deriving a node's output recursively from its own workflow context. Use `import type` from handlers so no runtime import cycle is introduced. Handlers without that cycle can retain inferred returns. No per-handler list of upstream result types is needed.

`finalize()` and `compile()` check handler input, parameter and node-result requirements against the workflow the builder holds, which is exactly the node list it will compile. `addNode()` only accumulates types, so it does not force the context cycle to expand while constructing the workflow. TypeBox surfaces supply precise input and parameter types; raw JSON Schema retains the generic context surfaces and skips their compatibility checks. Condition `.check()` accepts only boolean or Promise<boolean> results.

`context.nodeResults` has the known result-producing node keys and their inferred value types; every result is optional. A handler may read a later node or a different branch, but must handle `undefined`. This context contract checks types, not execution order or whether a branch actually ran. A Run returning `void` stores `null`; terminate nodes do not contribute readable results. The builder hands out no binding handles: neither the builder nor a node exposes a reference, because a handler reads what it needs from its context. `createReference()` and `lowerBindings()` remain exported for hand-built `defineWorkflow()` definitions, which is the only place a `{{...}}` template still comes from.

These contracts are TypeScript-only. A context Run node still serializes only its module path, without `args` or a result schema. Do not add node-level input/output schemas or duplicate result interfaces solely for context checking. Workflow input and parameter schemas and existing low-level mapped-argument artifacts remain unchanged.

## Package and imports

`defineHandler<typeof run>(module)` returns an immutable descriptor containing a brand and its package-relative module path. Import the handler with `import type`; the signature exists only in the type system and preserves `.run()` context/result inference and `.check()` boolean constraints. Definition evaluation does not load the handler implementation or its dependencies. Only the module path is serialized; execution loads the module's exported `run` function. Import the function as a value only in tests that execute it directly. The type import and module path must refer to the same module; their correspondence is not currently checked automatically.

Relative handler imports may omit the extension, for example `import type { run } from './server/calculate-risk'`. Use the same extensionless path in `defineHandler<typeof run>('./server/calculate-risk')`. Source evaluation uses `tsx`; the workflow checker accepts bundler-style resolution. Application server builds use `module: "ESNext"`, `moduleResolution: "Bundler"`, and `tsc-alias.resolveFullPaths: true` in `tsconfig.server.json` so emitted imports have explicit `.js` paths before Workflow Artifacts are collected. Keep the `tsc-alias` build step; plain `tsc` output alone is not deployable with extensionless imports. Existing explicit `.js` imports remain supported.

Each direct child directory of the configured workflow source root is one workflow package. The directory name is its stable workflow key. In the default application it must contain `workflow.ts`. The low-level package scanner also recognizes `workflow.js`, but the checker, Artifact builder, and default application's build script currently resolve `workflow.ts`; do not offer `workflow.js` as a default-project authoring option.

In the default initialized app, workflow packages are direct children of `workflows`. Import the builder, the node helpers, and the TypeBox schema builder directly from the workflow plugin:

```ts
import {
  createConditionInstruction,
  createRunInstruction,
  createTerminateInstruction,
  defineHandler,
  Type,
  workflow,
  type WorkflowSourceAst,
} from '@nocobase/app-plugin-workflow';
```

`workflow()` starts a definition; `createRunInstruction()`, `createConditionInstruction()`, and `createTerminateInstruction()` build the three node types the plugin registers today. The lower-level `defineWorkflow()` with `RunInstruction.create()` and friends is still exported and still supported, but it maps each node's arguments with `{{...}}` templates where the builder gives every handler the same context, so prefer the builder for new work.

Use Instruction classes exported by an installed plugin or defined in the application, and register the same classes in the target application's build-time and runtime instruction registries.

Declare static execution settings in `workflow({ ..., options: { timeout: 60, stackLimit: 3 } })`. `WorkflowOptions` is shared by the authoring definition, AST and Flat IR; validated values are stored unchanged in the workflow revision's database `options` field. `timeout` is a finite non-negative number of seconds (zero or omission disables the limit). `stackLimit` is a non-negative safe integer limiting occurrences of this workflow in a nested run chain (default 1; zero rejects nested invocation). These settings belong to the published revision, not invocation input or administrator parameters. Node timeouts remain separate and use milliseconds.

## Node types

A node's result type is inferred from its handler's return type, including awaited asynchronous results, and reaches downstream handlers as `context.nodeResults.<nodeKey>`. Do not define a node output schema, and do not create argument mappings at a node call site. Neither the builder nor a node hands out a value to bind: a handler reads what it needs through `context.input`, `context.parameters`, and `context.nodeResults`. Workflow input and parameter schemas remain the application boundary contracts.

`createRunInstruction`, `createConditionInstruction` and `createTerminateInstruction` cover the installed node types. The builder resolves nothing by type name — it reads each node's own type, configuration and branch structure — so an application that registers its own Instruction class adds a factory beside it with `createNode()` and places the result through the same `addNode()`. See [Custom Instructions](./custom-instructions.md#authoring-nodes-for-the-typed-builder).

## Complete current example

The [migration example](dsl-migration.md#minimal-conversion-pattern) shows a complete definition and two typechecked handler modules. The examples template also contains a workflow with both condition branches, branch-local results, client forms, and a shared `FlowContext`: `packages/templates/app-template-examples/workflows/example-quotation-routing/`. Keep handlers as named `run` exports, import their signatures with `import type`, and use `defineHandler<typeof run>(module)` in the definition.

## Default application lifecycle

From `packages/templates/app-template-default` (or the corresponding initialized application root), use this evidence-driven sequence:

1. Create `workflows/<stable-key>/workflow.ts` and every referenced run script.
2. Check the DSL source:

   ```bash
   pnpm nocobase workflow check workflows/<stable-key>
   ```

   Expect `Workflow check passed: ... (<n> nodes)`. This is only the five-phase DSL/IR check described below. Add `--ir` to print the compiled flat IR instead, which is the definition an Artifact would carry.

3. Run the target application's typecheck and focused tests for every `run` module and application service. Cover representative branches, result shapes, cancellation where relevant, and business idempotency for side effects. A passing DSL check does not prove this behavior.
4. Run the target application's normal server build, then build the complete Workflow Artifacts:

   ```bash
   pnpm nocobase workflow build
   ```

   The normal `pnpm build` also invokes this step. The standalone command scans every direct Workflow package and replaces the configured Artifact output tree, so do not point `--dist-root` at source or an unrelated directory.

   A running development server does not need this. It compiles the workflow source root on demand, so an edited definition is already listed and enableable there without a build and without a restart. Its local digest identifies source resources and need not match the digest of a production Artifact built from compiled resources. Build to produce a deployable Artifact or to verify what a deployment will receive, not to see a change in development.

5. Verify `dist/workflows/<stable-key>/<digest>/workflow.json` and the package-relative run modules. A source-resource build contains `.ts`; a production build contains the default server build's `.js` at the same relative paths. The production Artifact digest covers those compiled bytes, is verified on storage and loading, and is the deployed hash used by management concurrency checks.
6. Only when runtime mutation is authorized, start an isolated application/runtime and invoke by the DSL package directory key after obtaining the bound runtime. Do not assume Artifact build itself writes database definitions.
7. If the Artifact has no synchronized id, first-enable with its deployed hash: `enable(hash)` or `POST /api/workflows/<hash>/enable`. Synchronized definitions use their database id.
8. Read/update administrator input overrides only if needed, and read them back.
9. Invoke business events by resolving `workflowServiceToken` from `app.container` and calling `workflowRuntime.trigger(key, input, options?)`, explicitly handling both `accepted` and `skipped`. Use the authenticated management `run` route only for an authorized manual run of an explicitly selected definition revision; it may be historical or disabled without changing enablement.
10. For an accepted trigger, resolve the run by event key, inspect relevant node attempts and payload/log records, and verify the observable business effects by their stable identities. Execution remains asynchronous even though the ordinary trigger path creates the run before returning.

Keep those stages separate: source check does not prove run-entry buildability; Artifact build does not enable a definition; enablement does not invoke it.

## Top-level definition

`workflow()` accepts:

| Field         | Required | Contract                                                                         |
| ------------- | -------: | -------------------------------------------------------------------------------- |
| `key`         |      yes | the workflow package directory name; the stable business trigger key             |
| `title`       |      yes | string                                                                           |
| `description` |       no | string                                                                           |
| `input`       |       no | `{ schema, form? }` for invocation input; default schema is `{ type: 'object' }` |
| `parameters`  |       no | `{ schema, form? }` for administrator settings                                   |
| `inputSchema` |       no | shorthand for `input: { schema }` when there is no client form                   |

Each surface groups its schema with its optional client form, so a form path never becomes another top-level `*Form` field. A form path is relative to the workflow package and must resolve inside its `client/` directory; the module must default-export a React component. The build records the package's content revision alongside the path, so a later build that changes a form cannot change how an already published revision renders.

`flow.addNode()` appends nodes in order and returns a builder carrying the accumulated node types. There is no top-level `trigger`, `start`, node map, or edge list, and no `.next()`, `.goto()`, or `.join()`.

Use the workflow-level `description` to explain the workflow's purpose. When updating an existing DSL, such as changing nodes, sequencing, branches, or configuration, you may also include a concise note describing what changed relative to the previous version and the reason for the change. Preserve the purpose summary and replace the previous change note on each subsequent update; keep only the latest change, not an accumulated version history. Base the note on the actual changes and known rationale. For example: “Routes orders through inventory fulfillment. Latest change: added a fraud-risk check before inventory reservation to hold high-risk orders for review.” This note belongs to the workflow's top-level `description`; each node's required `description` still explains that node's current purpose and logic.

The evaluated AST must be JSON-compatible: no functions, symbols, BigInt, Date, Map, class instances, circular references, or non-finite numbers. `finalize()` enforces this and names the path that carried the offending value.

## Input Schema

Input is supplied for each invocation and is persisted in the run. The root schema must have exactly `type: 'object'`. The current implementation accepts this subset:

- Metadata: `$schema` (2020-12 literal), `title`, `description`.
- Types: `null`, `boolean`, `number`, `integer`, `string`, `array`, `object`, including a type array.
- Structure: `properties`, `required`, `additionalProperties`, `items`.
- Values/limits: `enum`, `const`, `minimum`, `maximum`, `minLength`, `maxLength`, `minItems`, `maxItems`.

`$ref`, `$dynamicRef`, `format`, and `$async` are explicitly rejected. Do not assume arbitrary JSON Schema keywords are implemented. At runtime, omitted `additionalProperties` behaves as `false`, so declare all accepted fields or explicitly set `true`/a schema. Input must be a JSON object, use finite numbers, and serialize to at most 65,536 UTF-8 bytes.

## Administrator parameters

`parameters.schema` declares administrator settings; it is not invocation input. It uses the same JSON Schema object shape as `input.schema`:

```ts
const source = workflow({
  key: 'approval',
  title: 'Approval',
  parameters: {
    schema: Type.Object({ approvalLimit: Type.Number({ default: 100000 }) }),
  },
});
```

Each property declaration accepts only:

- `type`: `string`, `number`, or `boolean`.
- Optional string `title` and `description`.
- Optional same-type finite scalar `default`.
- Optional `enum: { label, value }[]` for string/number only.

Enum values must be type-correct and unique; the default must occur in the enum. Boolean enum is invalid. Unknown declaration/option fields are invalid. The object must use `additionalProperties: false` when present. There is no required marker: a missing override falls back to the DSL default, otherwise the value is absent.

`compileToFlatIr()` lowers this object schema into the flat declaration map the parameter editor and the value resolver read, so the Artifact, the stored revision, and the management API all carry the lowered form. Authoring an `enum` as a plain list of values is part of that: the lowered form holds `{ label, value }` pairs.

A handler reads a parameter as `context.parameters.approvalLimit`. Only declared keys exist, and the resolved snapshot is flat: a parameter holds a string, number or boolean, never a nested object.

## Topology and keys

- A `nodes` array is a sequential block. Its first node is the block entry; each later node is the preceding node's successor.
- `.branch({ yes: [...], no: [...] })` attaches nested blocks to a branching node. Branch blocks return to the parent and then continue at the parent's next sibling.
- Branch map order has no semantics; keys are normalized in stable order. Node array order is semantic and must not be reordered.
- There is no `.next()`, `.goto()`, `.join()`, `.start()`, callback builder, or arbitrary cycle.
- Every node key across the complete workflow, including all branches, must be globally unique and match `^[A-Za-z_][A-Za-z0-9_-]*$`.
- Node and branch keys cannot be `__proto__`, `prototype`, or `constructor`.
- Keep node keys stable across revisions. Titles/descriptions may change; keys connect history, diagnostics, and result references.
- Only call `.branch()` on a branching node, and only use branch names declared by that instruction contract.

Every node source has `key`, optional `title`, `description`, required `config`, and optional `result`. When authoring or editing workflow orchestration, you must provide a non-empty, non-whitespace `description` for every node, including all nested branch nodes and custom Instructions. Fill missing descriptions in the workflow being edited and update descriptions whenever node logic changes. This is a mandatory authoring rule even though the DSL schema currently permits omission; a passing checker does not replace this review.

Describe the node's business purpose and actual logic rather than repeating its title or key. Include relevant input sources, calculations or actions, outputs consumed downstream, and side effects. For a condition, explain the decision rule and what the `yes` and `no` branches do; for a terminate node, explain why execution stops and its outcome. Keep descriptions concise and specific to the implemented behavior; do not claim effects that the script does not perform. For example: “Compare the calculated risk score with the administrator's approval limit; flag above-limit quotations for manual review and otherwise continue without flagging.”

Node-level timeout is not currently enforced by the runtime; configure a workflow-level timeout instead. Config is an instruction-owned namespace; never flatten config fields onto the node.

## Condition nodes

A condition runs a handler module that returns a boolean. Its config accepts only `module`, which follows the same rules as a run node's: a static, extensionless, package-relative specifier that cannot contain a template.

```ts
createConditionInstruction({ key: 'needsApproval', description: '...' })
  .check(needsApprovalHandler)
  .yes([...])
  .no([...])
```

The handler receives one argument, `{ input, parameters, nodeResults }`, each a frozen snapshot of the run's data, and the same `options` a run handler gets. It must return a boolean; anything else fails the node with an error.

```ts
import type { FlowContext } from '../workflow';

export function run({ nodeResults, parameters }: FlowContext): boolean {
  const risk = nodeResults.calculateRisk;
  return risk !== undefined && risk.score > parameters.approvalLimit;
}
```

Decisions are code rather than a serialized expression language, so the comparison is typechecked with the rest of the package, can be unit tested on its own, and has no operator, depth, or arity limits to work around. The cost is that reading a condition means opening its module: the definition records which module decides, not the rule itself.

Prefer `.yes([...])` and `.no([...])` for condition nodes. Either or both may be omitted, their order is unrestricted, and an empty array creates no branch. `.check(handler)` already returns a node that can be passed to `addNode()`. Each branch call returns a new node without changing the previous one. The dedicated methods check that branch contents are workflow nodes. Declaring the same branch twice throws, including empty declarations and mixed calls such as `.branch({ yes: [] }).yes([])`. The generic `.branch({ yes: [...], no: [...] })` remains available without eager branch-name validation; source validation checks surviving branches against the condition contract. Custom Instructions declare branch blocks through `createNode()` rather than these condition methods. A condition contributes a boolean result, so a later handler reads it as `context.nodeResults.<conditionKey>`.

## Terminate nodes

`createTerminateInstruction(...).outcome()` terminates the complete Workflow Run immediately after its own Node Run is persisted. It does not execute later nodes in the same block, return from the current branch, or run a branching parent's common successor.

`outcome()` takes `success` (the default) or `failure`:

```ts
const flow = workflow({ key: 'example', title: 'Example' }).addNode(
  createConditionInstruction({
    key: 'canContinue',
    description:
      'Continue when the input is approved; otherwise take the branch that ends the workflow.',
  })
    .check(isApprovedHandler)
    .no([
      createTerminateInstruction({
        key: 'stopRejected',
        description:
          'End the workflow successfully for an unapproved input and skip all remaining processing.',
      }).outcome('success'),
    ]),
);
const completeFlow = flow.addNode(
  createRunInstruction({
    key: 'continueProcessing',
    description:
      'Run the continuation script for approved input after the decision branch returns.',
  }).run(continueProcessingHandler),
);
```

When `approved` is false, `stopRejected` resolves the Workflow Run and `continueProcessing` is not executed. Use `outcome: 'failure'` only when the early outcome is a business failure rather than an expected successful stop. A `terminate` node has no result contract and cannot have branches.

## Run nodes and scripts

A Run node declares only its handler through the node-specific fluent method:

```ts
createRunInstruction({
  key: 'calculateRisk',
  description: 'Calculate the risk score.',
}).run(defineHandler<typeof calculateRisk>('./server/calculate-risk'));
```

The handler's first argument is the shared workflow context. The second argument contains `services`, `signal`, and `logger`. Use an explicit handler return type when the handler imports its workflow context to break the inference cycle; a broad `: WorkflowRunFunction` annotation erases the concrete result. No node input/output schema or call-site argument map is needed. `defineHandler` returns an immutable descriptor without modifying the imported function; the serialized config contains only `module`.

The module must export `run`. Its module path is a static, extensionless, package-relative specifier. The processor runs it asynchronously, saves its JSON-storable result, and resumes the flow. `undefined` becomes `null`; BigInt, functions, symbols, non-finite numbers, cycles, and class instances are rejected. Throw to report failure. Services must be resolved through their owner's original public token; the handler cannot replace application services. Respect cancellation through `signal` and log through the bound `logger`.

## Variables and templates

A builder-authored node has no argument mapping, so a handler written against it never encounters a template. Templates belong to the lower-level `defineWorkflow()` API, which writes them as strings in a node's `config.args`. The three namespaces a template may read:

| Template                        | Reads                                       |
| ------------------------------- | ------------------------------------------- |
| `{{$input.path}}`               | invocation input                            |
| `{{$parameters.key}}`           | the resolved administrator setting snapshot |
| `{{$nodeResults.nodeKey.path}}` | a visible declared upstream result          |

A `$parameters` template must name exactly one declared parameter; it supports neither nested paths nor inline defaults.

The templates behave the way they always have. An exact template preserves the underlying type, so `{{$input.amount}}` can resolve to a number. An embedded template such as `Amount: {{$input.amount}}` always becomes a string; `null`/`undefined` interpolate as empty text and objects as JSON text. A run node that carries no `args` receives the handler context instead, which is how both authoring styles run on one engine. `createReference()` and `lowerBindings()` are exported for building these templates from typed handles when hand-writing an AST.

## Node result schemas

Node factories infer output types from handler functions and do not accept `.output()` or a result schema. Return ordinary values and let TypeScript infer their structure. Prefer the workflow's `ContextOf<typeof flow>['nodeResults']` for downstream results; use `Awaited<ReturnType<typeof upstreamRun>>` only when a standalone handler needs a specific upstream result type.

The lower-level AST still accepts legacy result schemas for explicit template-reference validation. This compatibility contract is separate from context-handler authoring. A handler's `nodeResults` type annotation alone does not establish execution order or prove that a branch executed, so inspect availability before reading a branch-local result.

## Validation and compilation

Run the installed plugin's actual checker before load/build:

```bash
pnpm nocobase workflow check <package-or-workflow.ts>
```

This CLI uses the workflow plugin's core `condition`, `run`, and `terminate` contracts. If the workflow uses an Instruction supplied by another installed plugin, the application must call the public `checkWorkflowPackage()`/`buildApplicationWorkflows()` APIs from its own checker/build entry and pass the same Instruction contracts registered at runtime. A default CLI pass cannot validate an application-specific Instruction, and the default CLI rejecting that node does not prove the installed extension is invalid.

The checker performs, in order:

1. `typecheck`: strict TypeScript with bundler module resolution and the `source` export condition.
2. `evaluate`: a bounded disposable Node process loads the declarative TypeScript module and requires a valid default AST export.
3. `schema`: Input Schema, parameters, node config, and result schemas.
4. `semantic`: registered types, unique/safe keys, branches, declared parameters, and visible result references.
5. `compile`: flat IR topology must have one start, one owner per non-start node, no missing targets, cycles, or unreachable nodes.

`check` does not scan the complete package or write the database. In particular, it does not prove that `config.module` exists or verify its named `run` export. It evaluates `workflow.ts` but does not load the run scripts. Do not publish/load after any issue. Error output contains phase, code, file/line where available, AST path, node key, and contract type; fix the earliest phase first because later phases depend on it.

The default app's Artifact build scans each direct Workflow package and writes immutable Artifacts to its configured dist root. In development it copies the package's source resources. In production the normal server TypeScript build runs first, and the Artifact build collects that package-relative JavaScript output without rebundling or renaming modules. Runtime module loading enforces containment and checks the named `run` export. Startup persists Artifacts and publishes Client resources without creating database revisions or changing the current version. Database materialization happens on demand when a user enables a version, saves its parameters, or manually runs it; activation and enablement remain separate management concerns.

### Deterministic definition builds

`workflow.ts` executes during check/build. Its evaluated JSON becomes part of the Artifact identity. Keep it a pure deterministic definition:

- Do not use `Date.now()`, random/UUID generation, current locale/time zone, machine absolute paths, environment-dependent branching, network calls, or mutable external state.
- Do not read undeclared files or reach outside the package during definition construction.
- Keep node array order intentional and stable; avoid filesystem/object enumeration whose order or contents vary by machine.
- Put runtime lookups and changing business data in `run` scripts, input, or declared administrator parameters.

Rebuild twice from unchanged sources when determinism is in doubt and compare the emitted digest. An unexpected digest change is a deployment change and must not be silently accepted during enable.

## Error-prevention checklist

- No legacy YAML, `trigger`, `start`, node map, numeric branch, or edge-list syntax.
- `workflow.ts` default-exports the AST from `flow.finalize()`, never the builder. A `WorkflowSourceAst`-annotated const makes the source shape explicit, as in the example above; the current application templates set `isolatedDeclarations: false`, so a bare `export default flow.finalize()` is also valid.
- Import Instruction classes through installed plugins' public exports or application-owned modules, and register them with the application.
- No invented nodes/operators/config fields.
- A node never carries an argument mapping: a handler reads `context.input`, `context.parameters` and `context.nodeResults`, and a `{{...}}` template belongs only to a hand-written `defineWorkflow()` AST.
- Every run and condition handler is wrapped in `defineHandler()` with its own package-relative module path.
- All objects and evaluated helpers produce JSON-only values.
- Input root is `object`; extra fields are deliberately allowed or rejected.
- Every parameter reference is declared and has no inline default/nested path.
- Every node key is safe, global, unique, and stable.
- Every node, including nested branch nodes and custom Instructions, has a non-empty `description` that accurately explains its purpose and logic; review this even if the schema check passes.
- Every branch belongs to the node contract.
- Every run script is static, named-exported, abort-aware, and idempotent; every condition handler returns a boolean.
- For a builder handler, check that a referenced result is available at runtime; types alone do not prove execution order or branch selection. For a hand-built template reference, maintain an accurate, lexically visible result schema.
- The real five-phase checker passes, then the Artifact build preserves the workflow package's runtime resources at their package-relative paths.

Workflow diagnostics use the application logging service with source `workflow` and workflow, execution, and node identities where available. They share `storage/logs/app.<UTC-date>.<part>.log` by default. Set `logging.loggers.workflow.file.name: workflow` to separate them. The message-first logger passed to run modules adapts to this service; diagnostic output is not copied into the database node execution `log` field. Execution status, result, and error records remain business data.

## Source preview during development

Use the candidate entry from the workflow list when iterating with `pnpm dev`. Its `/settings/workflow/workflows/<hash>` URL identifies the discovered artifact exactly. Source edits produce a new hash, so reopen the candidate from the refreshed list to inspect the new definition; an old unpublished hash may become unavailable. Viewing a candidate does not materialize a database revision. Parameter settings and manual run remain visible for an unmaterialized version, but opening either shows an enable-first prompt without loading custom forms. Enable the version to materialize it and navigate to its id page; parameter configuration is optional when the workflow provides defaults.

An `id` URL remains pinned to its materialized revision. Enable uses the displayed revision identifier; parameter settings and manual run use the materialized id, including for previously enabled versions that are now disabled; they must not silently fall back to newer source when that revision is unavailable.

## Materialized resource snapshots

In development and production, materialization persists an immutable artifact and publishes its compiled browser resources before creating the database version. The database id is the version reference; its hash is an internal address in that environment's artifact store and need not match hashes from other environments. Source discovery prepares and caches development artifact bytes without creating a database version. Subsequent source edits produce a new candidate and never replace an existing snapshot.

Parameter and input forms resolve the selected database version's hash through its client manifest. Materialized executions also load their server modules from that version's artifact store, including during development. Editing source therefore requires enabling the new candidate to use the changes; old ids retain their original forms and handlers. Startup restores published client files from the private artifact store. Preserve that store with the database across restarts and deployments; rebuilding or removing source must not delete referenced artifacts.

Legacy development versions created before snapshot persistence may have no stored resources. A hash cannot reconstruct missing bytes; restore a matching backup or enable a new version from the available source. Do not substitute the current source for a historical id.
