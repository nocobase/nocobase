# Custom Instructions

## When to extend

Prefer an existing installed Instruction. Use `RunInstruction` plus a typed service for application-specific calculations, CRUD, sending a notification, or calling an API. Extend the node type when several workflows need a reusable, named operation with its own validated configuration and result contract, or when they need process-control semantics that Run cannot express. A single email call does not by itself require a new Instruction. Keep application-owned extensions in the application; create a separately published plugin only when that is the requested distribution boundary.

Durable waiting, approval, loops, and subflows require dedicated lifecycle support. The synchronous completion example below does not implement those capabilities; adding a `resume()` method alone does not provide an external resume API. Confirm the installed runtime's supported lifecycle before promising them.

## Public API

| Public entry                           | Exports and purpose                                                                                                                                                          |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@nocobase/app-plugin-workflow`        | `createNodeExpression`, `defineWorkflow`, core Instruction classes, `WorkflowNodeSourceInput`, `NodeExpression`, `ConfigIssue`, `NodeResultSchema`, `WorkflowSourceAst`      |
| `@nocobase/app-plugin-workflow/dsl`    | `workflow`, `createNode`, `defineHandler`, `NodeMeta`, `WorkflowNode`, `CreateNodeOptions` — the typed authoring builder, with no server implementations in its module graph |
| `@nocobase/app-plugin-workflow/server` | `WorkflowInstruction`, `WorkflowInstructionClass`, `WorkflowInstructionContext`, `WorkflowInstructionResult`, `workflowServiceToken`                                         |
| `@nocobase/app-plugin-workflow/build`  | `checkWorkflowPackage`, `buildApplicationWorkflows`                                                                                                                          |

An Instruction class supplies a stable unique `type`, `branches` (`null` for a sequential node), `create(source)`, and synchronous `validateConfig(unknown)` returning `{ path, message }[]`. Declare `result` when downstream nodes can reference its output. The instance implements async `run()` and, for supported branching lifecycles, `resume()`. `this.config` is the node configuration; custom types must explicitly implement any desired template evaluation rather than assuming Run's argument binding applies automatically. `this.signal` is the cancellation signal; `this.processor.services` provides application service resolution. A completed node returns `{ status: 1, result }` (`1` is RESOLVED); do not import internal status constants through unpublished paths.

Keep module evaluation deterministic and free of service initialization: the checker evaluates DSL in a disposable process. Put asynchronous runtime initialization in Provider `boot()`, not `register()` (which is synchronous). Register the custom class once, after Workflow is available and before accepting workflow invocations. Duplicate types are rejected.

## Runnable application example

This small `example-label` node returns a literal label without external services. It demonstrates the extension API, not a reason to replace ordinary Run modules. Use an initialized application with Workflow installed and registered, its existing TypeScript tooling, and `tsx` available as a development dependency. All paths below are relative to that application's root. Edit application settings in `config.yml`; use `config.example.yml` as the configuration reference.

Create `server/workflow-instructions/label.ts`:

```ts
import {
  createNodeExpression,
  type ConfigIssue,
  type NodeExpression,
  type NodeResultSchema,
  type WorkflowNodeSourceInput,
} from '@nocobase/app-plugin-workflow';
import {
  WorkflowInstruction,
  type WorkflowInstructionResult,
} from '@nocobase/app-plugin-workflow/server';

type LabelConfig = { label: string };

export class LabelInstruction extends WorkflowInstruction {
  static readonly type: 'example-label' = 'example-label';
  static readonly branches: null = null;
  static readonly result: NodeResultSchema = { type: 'string' };

  static create(source: WorkflowNodeSourceInput<LabelConfig>): NodeExpression {
    return createNodeExpression(LabelInstruction, source);
  }

  static validateConfig(config: unknown): ConfigIssue[] {
    if (
      config === null ||
      typeof config !== 'object' ||
      Array.isArray(config)
    ) {
      return [{ path: 'config', message: 'Expected an object.' }];
    }
    const record = config as Record<string, unknown>;
    if (Object.keys(record).some((key) => key !== 'label')) {
      return [{ path: 'config', message: 'Only label is supported.' }];
    }
    return typeof record.label === 'string' && record.label.length > 0
      ? []
      : [
          {
            path: 'config.label',
            message: 'Expected a non-empty literal string.',
          },
        ];
  }

  async run(): Promise<WorkflowInstructionResult> {
    this.signal.throwIfAborted();
    const issues = LabelInstruction.validateConfig(this.config);
    if (issues.length) throw new Error(issues[0].message);
    return { status: 1, result: this.config.label };
  }
}
```

Create `server/providers/workflow-instructions.ts`:

```ts
import type { Application } from '@nocobase/app-server/application';
import { workflowServiceToken } from '@nocobase/app-plugin-workflow/server';
import { ServiceProvider } from '@nocobase/service-provider';

export default class WorkflowInstructionsProvider extends ServiceProvider<Application> {
  readonly name: string = 'workflow-instructions';

  async boot(): Promise<void> {
    const { LabelInstruction } =
      await import('../workflow-instructions/label.js');
    const workflow = this.app.container.resolve(workflowServiceToken);
    workflow.registerInstruction(LabelInstruction);
  }
}
```

In `server/providers/index.ts`, import `WorkflowInstructionsProvider` from `./workflow-instructions.js` and append it to the existing `serviceProviders` array. Preserve all existing providers. The application's `server/runtime.ts` already consumes that array. If publishing this as a plugin instead, expose the Instruction through an explicit package export and contribute the Provider through the plugin's Server contribution; consumers must import that public entry, never a guessed internal file path.

### Authoring nodes for the typed builder

The Instruction class above is the server half: it validates configuration and executes the node. A definition still has to be able to place that node, and the builder resolves nothing by type name — it reads the node's own type, configuration and branch structure — so an extension supplies a small factory beside its class and needs no registration on the authoring side.

Create `server/workflow-instructions/label-node.ts`. Use the same literal type as `LabelInstruction.type` without importing the server Instruction into definition evaluation:

```ts
import {
  createNode,
  type WorkflowNode,
} from '@nocobase/app-plugin-workflow/dsl';
import type { NodeMeta } from '@nocobase/app-plugin-workflow/dsl';

/** `TOutput` is what the node resolves with; downstream handlers read it from `context.nodeResults`. */
export function labelNode<const TKey extends string>(
  meta: NodeMeta<TKey>,
  label: string,
): WorkflowNode<string, unknown, TKey> {
  return createNode<string, unknown, TKey>('example-label', meta, {
    label,
  });
}
```

Give `createNode` a fourth argument for a branching node: `{ branches: { approved: [...], rejected: [...] } }` declares the blocks, and `{ options: { timeout: 30_000 } }` sets the node option the engine enforces. Keep the branch keys equal to the class's `static branches`; source validation checks them against the registered class, and nothing in the authoring layer can.

Create `workflows/label-example/workflow.ts`:

```ts
import {
  workflow,
  type WorkflowSourceAst,
} from '@nocobase/app-plugin-workflow/dsl';
import { labelNode } from '../../server/workflow-instructions/label-node.js';

const flow = workflow({
  key: 'label-example',
  title: 'Label example',
  input: {
    schema: { type: 'object', properties: {}, additionalProperties: false },
  },
}).addNode(
  labelNode(
    {
      key: 'label',
      title: 'Record a label',
      description: 'Returns a fixed label to demonstrate a custom node result.',
    },
    'Example completed',
  ),
);

const definition: WorkflowSourceAst = flow.finalize();
export default definition;
```

`addNode()` returns the workflow containing the node; the receiver keeps the list it already had. Keep the returned builder — finalizing one that a later `addNode()` moved past fails rather than compiling a definition missing the node.

The lower-level `defineWorkflow()` form remains available and is what a node built by `LabelInstruction.create()` goes into:

```ts
import {
  defineWorkflow,
  type WorkflowSourceAst,
} from '@nocobase/app-plugin-workflow';
import { LabelInstruction } from '../../server/workflow-instructions/label.js';

const workflow: WorkflowSourceAst = defineWorkflow({
  title: 'Label example',
  inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  nodes: [
    LabelInstruction.create({
      key: 'label',
      title: 'Record a label',
      description: 'Returns a fixed label to demonstrate a custom node result.',
      config: { label: 'Example completed' },
    }),
  ],
});
export default workflow;
```

Create `scripts/check-build-custom-workflows.mjs`:

```js
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ConditionInstruction,
  RunInstruction,
  TerminateInstruction,
} from '@nocobase/app-plugin-workflow';
import {
  checkWorkflowPackage,
  buildApplicationWorkflows,
} from '@nocobase/app-plugin-workflow/build';
import { LabelInstruction } from '../server/workflow-instructions/label.ts';

const appRoot = fileURLToPath(new URL('../', import.meta.url));
const sourceRoot = path.join(appRoot, 'workflows');
const instructions = new Map(
  [
    ConditionInstruction,
    RunInstruction,
    TerminateInstruction,
    LabelInstruction,
  ].map((instruction) => [instruction.type, instruction]),
);
const checked = await checkWorkflowPackage(
  path.join(sourceRoot, 'label-example'),
  {
    contracts: { nodes: instructions },
  },
);
console.log(JSON.stringify(checked.ir, null, 2));
const summary = await buildApplicationWorkflows({
  sourceRoot,
  distRoot: path.join(appRoot, '.workflow-artifacts'),
  resourceRoot: sourceRoot,
  instructions,
});
console.log(summary);
```

Run from the application root:

```bash
pnpm exec tsx scripts/check-build-custom-workflows.mjs
pnpm typecheck
```

The script checks the example and builds every workflow under `sourceRoot` with the same map. A supplied map replaces the defaults, so include the core classes and all installed extensions in use. The default `pnpm nocobase workflow check <package>` command knows only core types; use this custom entry for extended workflows. A default-command rejection of an unknown extension does not establish that the extension is invalid.

The example has no runtime resources, so it reads resources from the source tree. For workflows with Run modules or assets, first compile/copy them to `dist/workflows` and change `resourceRoot` to that directory, preserving each workflow's package-relative paths. `buildApplicationWorkflows()` clears `distRoot`: keep it separate from the source tree, compiled resource tree, and other build outputs. Add `.workflow-artifacts/` to the application's ignore file. For production, adapt the application's existing workflow build stage to pass this same map, then install the resulting artifacts in the configured artifact directory after their resources have been read. Do not run the unmodified core-only build stage over custom workflows or let a later build step overwrite the extended artifacts.

Start the application with `pnpm dev` after adding the Provider. Development loads source workflows using runtime-registered contracts. Inspect `label-example` in Workflow management, enable it and invoke it with `{}` when authorized; its node should resolve with `Example completed`. Building an Artifact does not register the runtime class, enable the workflow, or trigger a run. Verify the actual run in addition to source checking before considering a production extension complete.
