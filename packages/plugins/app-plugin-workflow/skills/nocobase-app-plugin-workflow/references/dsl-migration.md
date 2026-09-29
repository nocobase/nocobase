# Migrate the previous Workflow DSL

Use this guide when a workflow package uses `defineWorkflow()`, `RunInstruction.create()`, `ConditionInstruction.create()`, per-node `config.args`, or a condition's JSON Logic `config.expression`. Keep the package directory and workflow key stable so existing business triggers continue to address the same workflow. Existing materialized revisions retain their own artifacts and history; converting source creates a new candidate revision when its definition changes.

The lower-level `defineWorkflow()` and template APIs remain available for compatible hand-built definitions. A JSON Logic condition is different: `config.expression` and the JSON Logic engine were removed, so migrate that condition to a module returning a boolean even if the rest of the definition stays low-level. For new and converted definitions, prefer the typed builder.

## Convert the definition and handlers together

| Previous definition                                                                | Typed builder                                                                                                                     |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `defineWorkflow({ title, inputSchema, parameters, nodes })`                        | `workflow({ key, title, input: { schema }, parameters: { schema } }).addNode(...).finalize()`                                     |
| `RunInstruction.create({ key, config: { module, args }, result })`                 | `createRunInstruction({ key, description }).run(defineHandler<typeof run>(module))`                                               |
| `ConditionInstruction.create({ key, config: { expression } }).branch({ yes, no })` | `createConditionInstruction({ key, description }).check(defineHandler<typeof run>(module)).yes([...]).no([...])`                  |
| `TerminateInstruction.create(...)`                                                 | `createTerminateInstruction({ key, description }).outcome('success')` or `.outcome('failure')`                                    |
| `config.args` templates and explicit result schemas                                | Handler reads `input`, `parameters`, and optional `nodeResults` from the shared context; its return type supplies the result type |

1. Preserve the workflow package's directory key, node keys, order, and branch membership unless the behavior is intentionally changing. Move an application workflow to the configured source root if it still lives under an old source location; in the default app this is `workflows/<key>/workflow.ts` with package-relative `server/` and optional `client/` files.
2. Replace the top-level call with `workflow({ key: '<directory-key>', title, description, input: { schema }, parameters: { schema } })`. Wrap the previous flat parameter declarations in an object schema with `type: 'object'`, `properties`, and `additionalProperties: false`; TypeBox `Type.Object(...)` gives handlers precise input and parameter types. Keep any existing client forms as `input.form` and `parameters.form` inside the workflow package's `client/` directory.
3. For each Run, remove `config.args` and its explicit `result` schema from the builder node. Export a named `run` from its module, accepting the shared workflow context as the first argument and execution options as the second. Read the original template sources directly from `input`, `parameters`, and `nodeResults`. Keep validation and side effects in the handler or an application service. When one module served several nodes with different literal arguments, use distinct small handler modules or derive the value from the context without silently changing behavior.
4. Replace each JSON Logic expression with a condition handler that returns `boolean` or `Promise<boolean>`. Preserve the old rule's operator, missing-value behavior, and branch meaning deliberately. Import its `run` signature with `import type`, then pass `defineHandler<typeof run>('./server/check')` to `.check()`. Use `.yes([...]).no([...])` for the fixed condition branches; omitted or empty branches continue at the common successor.
5. Chain or retain every `addNode()` result. The builder is immutable; `flow.addNode(node); flow.finalize()` discards the new node and finalization rejects that omission. Give every node, including nested nodes, a specific non-empty `description`. Default-export the finalized AST, preferably through a `WorkflowSourceAst`-annotated const to make its source shape explicit.

## Minimal conversion pattern

```ts
// workflow.ts
import { Type } from '@sinclair/typebox';
import {
  workflow,
  createRunInstruction,
  createConditionInstruction,
  defineHandler,
  type ContextOf,
  type WorkflowSourceAst,
} from '@nocobase/app-plugin-workflow/dsl';
import type { run as calculate } from './server/calculate';
import type { run as needsReview } from './server/needs-review';

const flow = workflow({
  key: 'quotation-routing',
  title: 'Quotation routing',
  input: { schema: Type.Object({ amountCents: Type.Number() }) },
  parameters: {
    schema: Type.Object({ thresholdCents: Type.Number({ default: 100000 }) }),
  },
})
  .addNode(
    createRunInstruction({
      key: 'calculate',
      description: 'Return the quotation total in cents.',
    }).run(defineHandler<typeof calculate>('./server/calculate')),
  )
  .addNode(
    createConditionInstruction({
      key: 'needsReview',
      description: 'Compare the total with the configured threshold.',
    }).check(defineHandler<typeof needsReview>('./server/needs-review')),
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

export function run({ input }: FlowContext): { totalCents: number } {
  return { totalCents: input.amountCents };
}
```

```ts
// server/needs-review.ts
import type { FlowContext } from '../workflow';

export function run({ nodeResults, parameters }: FlowContext): boolean {
  const total = nodeResults.calculate;
  return total !== undefined && total.totalCents >= parameters.thresholdCents;
}
```

Use a member-by-member `FlowContext` interface and explicit handler return types to break the workflow/handler inference cycle. A type-only import keeps server code out of definition evaluation; its module path and the `defineHandler()` path must refer to the same file. Every `nodeResults` value is optional, including branch results; check it before use. The checker verifies type compatibility, but does not prove execution order or which branch ran.

## Verify the converted package

Run `pnpm nocobase workflow check workflows/<key>` from the target application; use `--ir` to compare node order, branches, and keys in the compiled flat IR. Typecheck, test, and build the application's handlers and client forms separately: the workflow check evaluates the definition but does not load handler modules or prove their exports. Run focused tests for the converted comparison, missing results, both branches, and side effects. Build the workflow Artifact through the application's normal build, then verify module loading and materialization in an isolated runtime before enabling the new revision. Existing materialized ids remain tied to their previous artifacts; retain the artifact store and use the new revision's id or hash for management operations.

For the full authoring contract, see [DSL Authoring](dsl-authoring.md). The migrated example workflow in `packages/templates/app-template-examples/workflows/example-quotation-routing/` shows branch-local handlers, a shared `FlowContext`, and client forms.
