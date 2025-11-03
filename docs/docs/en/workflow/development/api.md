# API Reference

## Server-side

The APIs available in the server-side package structure are shown in the following code:

```ts
import PluginWorkflowServer, {
  Trigger,
  Instruction,
  EXECUTION_STATUS,
  JOB_STATUS,
} from '@nocobase/plugin-workflow';
```

### `PluginWorkflowServer`

Workflow plugin class.

Usually, during the application's runtime, you can call `app.pm.get<PluginWorkflowServer>(PluginWorkflowServer)` anywhere you can get the application instance `app` to obtain the workflow plugin instance (referred to as `plugin` below).

#### `registerTrigger()`

Extends and registers a new trigger type.

**Signature**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger })`

**Parameters**

| Parameter | Type | Description |
| --------- | --------------------------- | ---------------- |
| `type` | `string` | Trigger type identifier |
| `trigger` | `typeof Trigger \| Trigger` | Trigger type or instance |

**Example**

```ts
import PluginWorkflowServer, { Trigger } from '@nocobase/plugin-workflow';

function handler(this: MyTrigger, workflow: WorkflowModel, message: string) {
  // trigger workflow
  this.workflow.trigger(workflow, { data: message.data });
}

class MyTrigger extends Trigger {
  messageHandlers: Map<number, WorkflowModel> = new Map();
  on(workflow: WorkflowModel) {
    const messageHandler = handler.bind(this, workflow);
    // listen some event to trigger workflow
    process.on(
      'message',
      this.messageHandlers.set(workflow.id, messageHandler),
    );
  }

  off(workflow: WorkflowModel) {
    const messageHandler = this.messageHandlers.get(workflow.id);
    // remove listener
    process.off('message', messageHandler);
  }
}

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin =
      this.app.pm.get<PluginWorkflowServer>(PluginWorkflowServer);

    // register trigger
    workflowPlugin.registerTrigger('myTrigger', MyTrigger);
  }
}
```

#### `registerInstruction()`

Extends and registers a new node type.

**Signature**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction })`

**Parameters**

| Parameter | Type | Description |
| ------------- | ----------------------------------- | -------------- |
| `type` | `string` | Instruction type identifier |
| `instruction` | `typeof Instruction \| Instruction` | Instruction type or instance |

**Example**

```ts
import PluginWorkflowServer, { Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

class LogInstruction extends Instruction {
  run(node, input, processor) {
    console.log('my instruction runs!');
    return {
      status: JOB_STATUS.RESOVLED,
    };
  },
};

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.pm.get<PluginWorkflowServer>(PluginWorkflowServer);

    // register instruction
    workflowPlugin.registerInstruction('log', LogInstruction);
  }
}
```

#### `trigger()`

Triggers a specific workflow. Mainly used in custom triggers to trigger the corresponding workflow when a specific custom event is listened to.

**Signature**

`trigger(workflow: Workflow, context: any)`

**Parameters**
| Parameter | Type | Description |
| --- | --- | --- |
| `workflow` | `WorkflowModel` | The workflow object to be triggered |
| `context` | `object` | Context data provided at trigger time |

:::info{title=Tip}
`context` is currently a required item. If not provided, the workflow will not be triggered.
:::

**Example**

```ts
import { Trigger } from '@nocobase/plugin-workflow';

class MyTrigger extends Trigger {
  timer: NodeJS.Timeout;

  on(workflow) {
    // register event
    this.timer = setInterval(() => {
      // trigger workflow
      this.plugin.trigger(workflow, { date: new Date() });
    }, workflow.config.interval ?? 60000);
  }
}
```

#### `resume()`

Resumes a waiting workflow with a specific node job.

- Only workflows in the waiting state (`EXECUTION_STATUS.STARTED`) can be resumed.
- Only node jobs in the pending state (`JOB_STATUS.PENDING`) can be resumed.

**Signature**

`resume(job: JobModel)`

**Parameters**

| Parameter | Type | Description |
| ----- | ---------- | ---------------- |
| `job` | `JobModel` | The updated job object |

:::info{title=Tip}
The passed job object is generally an updated object, and its `status` is usually updated to a value other than `JOB_STATUS.PENDING`, otherwise it will continue to wait.
:::

**Example**

See [source code](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-manual/src/server/actions.ts#L99) for details.

### `Trigger`

The base class for triggers, used to extend custom trigger types.

| Parameter | Type | Description |
| ------------- | ----------------------------------------------------------- | ---------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Trigger` | Constructor |
| `on?` | `(workflow: WorkflowModel): void` | Event handler after enabling a workflow |
| `off?` | `(workflow: WorkflowModel): void` | Event handler after disabling a workflow |

`on`/`off` are used to register/unregister event listeners when a workflow is enabled/disabled. The passed parameter is the workflow instance corresponding to the trigger, which can be processed according to the configuration. Some trigger types that already have globally listened events may not need to implement these two methods. For example, in a scheduled trigger, you can register a timer in `on` and unregister it in `off`.

### `Instruction`

The base class for instruction types, used to extend custom instruction types.

| Parameter | Type | Description |
| ------------- | --------------------------------------------------------------- | ---------------------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Instruction` | Constructor |
| `run` | `Runner` | Execution logic for the first entry into the node |
| `resume?` | `Runner` | Execution logic for entering the node after resuming from an interruption |
| `getScope?` | `(node: FlowNodeModel, data: any, processor: Processor): any` | Provides the local variable content for the branch generated by the corresponding node |

**Related Types**

```ts
export type Job =
  | {
      status: JOB_STATUS[keyof JOB_STATUS];
      result?: unknown;
      [key: string]: unknown;
    }
  | JobModel
  | null;

export type InstructionResult = Job | Promise<Job>;

export type Runner = (
  node: FlowNodeModel,
  input: JobModel,
  processor: Processor,
) => InstructionResult;

export class Instruction {
  run: Runner;
  resume?: Runner;
}
```

For `getScope`, you can refer to the [implementation of the loop node](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-loop/src/server/LoopInstruction.ts#L83), which is used to provide local variable content for branches.

### `EXECUTION_STATUS`

A constant table for workflow execution plan statuses, used to identify the current status of the corresponding execution plan.

| Constant Name | Meaning |
| ------------------------------- | -------------------- |
| `EXECUTION_STATUS.QUEUEING` | Queueing |
| `EXECUTION_STATUS.STARTED` | Started |
| `EXECUTION_STATUS.RESOLVED` | Resolved |
| `EXECUTION_STATUS.FAILED` | Failed |
| `EXECUTION_STATUS.ERROR` | Error |
| `EXECUTION_STATUS.ABORTED` | Aborted |
| `EXECUTION_STATUS.CANCELED` | Canceled |
| `EXECUTION_STATUS.REJECTED` | Rejected |
| `EXECUTION_STATUS.RETRY_NEEDED` | Not successfully executed, retry needed |

Except for the first three, all others represent a failed state, but can be used to describe different reasons for failure.

### `JOB_STATUS`

A constant table for workflow node job statuses, used to identify the current status of the corresponding node job. The status generated by the node also affects the status of the entire execution plan.

| Constant Name | Meaning |
| ------------------------- | ---------------------------------------- |
| `JOB_STATUS.PENDING` | Pending: Execution has reached this node, but the instruction requires it to suspend and wait |
| `JOB_STATUS.RESOLVED` | Resolved |
| `JOB_STATUS.FAILED` | Failed: The execution of this node failed to meet the configured conditions |
| `JOB_STATUS.ERROR` | Error: An unhandled error occurred during the execution of this node |
| `JOB_STATUS.ABORTED` | Aborted: The execution of this node was terminated by other logic after being in a pending state |
| `JOB_STATUS.CANCELED` | Canceled: The execution of this node was manually canceled after being in a pending state |
| `JOB_STATUS.REJECTED` | Rejected: The continuation of this node was manually rejected after being in a pending state |
| `JOB_STATUS.RETRY_NEEDED` | Not successfully executed, retry needed |

## Client-side

The APIs available in the client-side package structure are shown in the following code:

```ts
import PluginWorkflowClient, {
  Trigger,
  Instruction,
} from '@nocobase/plugin-workflow/client';
```

### `PluginWorkflowClient`

#### `registerTrigger()`

Registers the configuration panel for the trigger type.

**Signature**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger): void`

**Parameters**

| Parameter | Type | Description |
| --------- | --------------------------- | ------------------------------------ |
| `type` | `string` | Trigger type identifier, consistent with the identifier used for registration |
| `trigger` | `typeof Trigger \| Trigger` | Trigger type or instance |

#### `registerInstruction()`

Registers the configuration panel for the node type.

**Signature**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction): void`

**Parameters**

| Parameter | Type | Description |
| ------------- | ----------------------------------- | ---------------------------------- |
| `type` | `string` | Node type identifier, consistent with the identifier used for registration |
| `instruction` | `typeof Instruction \| Instruction` | Node type or instance |

#### `registerInstructionGroup()`

Registers a node type group. NocoBase provides 4 default node type groups:

* `'control'`: Control
* `'collection'`: Collection operations
* `'manual'`: Manual processing
* `'extended'`: Other extensions

If you need to extend other groups, you can use this method to register them.

**Signature**

`registerInstructionGroup(type: string, group: { label: string }): void`

**Parameters**

| Parameter | Type | Description |
| --------- | ----------------- | ----------------------------- |
| `type` | `string` | Node group identifier, consistent with the identifier used for registration |
| `group` | `{ label: string }` | Group information, currently only includes the title |

**Example**

```js
export default class YourPluginClient extends Plugin {
  load() {
    const pluginWorkflow = this.app.pm.get(PluginWorkflowClient);

    pluginWorkflow.registerInstructionGroup('ai', { label: `{{t("AI", { ns: "${NAMESPACE}" })}}` });
  }
}
```

### `Trigger`

The base class for triggers, used to extend custom trigger types.

| Parameter | Type | Description |
| --------------- | ---------------------------------------------------------------- | ---------------------------------- |
| `title` | `string` | Trigger type name |
| `fieldset` | `{ [key: string]: ISchema }` | Collection of trigger configuration items |
| `scope?` | `{ [key: string]: any }` | Collection of objects that may be used in the configuration item Schema |
| `components?` | `{ [key: string]: React.FC }` | Collection of components that may be used in the configuration item Schema |
| `useVariables?` | `(config: any, options: UseVariableOptions ) => VariableOptions` | Value accessor for trigger context data |

- If `useVariables` is not set, it means that this type of trigger does not provide a value retrieval function, and the trigger's context data cannot be selected in the workflow nodes.

### `Instruction`

The base class for instructions, used to extend custom node types.

| Parameter | Type | Description |
| -------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `group` | `string` | Node type group identifier, currently available options: `'control'`/`'collection'`/`'manual'`/`'extended'` |
| `fieldset` | `Record<string, ISchema>` | Collection of node configuration items |
| `scope?` | `Record<string, Function>` | Collection of objects that may be used in the configuration item Schema |
| `components?` | `Record<string, React.FC>` | Collection of components that may be used in the configuration item Schema |
| `Component?` | `React.FC` | Custom rendering component for the node |
| `useVariables?` | `(node, options: UseVariableOptions) => VariableOption` | Method for the node to provide node variable options |
| `useScopeVariables?` | `(node, options?) => VariableOptions` | Method for the node to provide branch local variable options |
| `useInitializers?` | `(node) => SchemaInitializerItemType` | Method for the node to provide initializer options |
| `isAvailable?` | `(ctx: NodeAvailableContext) => boolean` | Method to determine if the node is available |

**Related Types**

```ts
export type NodeAvailableContext = {
  workflow: object;
  upstream: object;
  branchIndex: number;
};
```

- If `useVariables` is not set, it means that this node type does not provide a value retrieval function, and the result data of this type of node cannot be selected in the workflow nodes. If the result value is singular (not selectable), you can return static content that expresses the corresponding information (see: [calculation node source code](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/calculation.tsx#L68)). If it needs to be selectable (e.g., a property of an Object), you can customize the corresponding selection component output (see: [create data node source code](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/create.tsx#L41)).
- `Component` is a custom rendering component for the node. When the default node rendering is not sufficient, it can be completely overridden for custom node view rendering. For example, if you need to provide more action buttons or other interactions for the start node of a branch type, you would use this method (see: [parallel branch source code](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow-parallel/src/client/ParallelInstruction.tsx)).
- `useInitializers` is used to provide a method for initializing blocks. For example, in a manual node, you can initialize related user blocks based on upstream nodes. If this method is provided, it will be available when initializing blocks in the manual node's interface configuration (see: [create data node source code](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/create.tsx#L71)).
- `isAvailable` is mainly used to determine whether a node can be used (added) in the current environment. The current environment includes the current workflow, upstream nodes, and the current branch index.