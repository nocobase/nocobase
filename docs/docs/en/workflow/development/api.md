---
title: "API Reference"
description: "Workflow extension API reference: Workflow Model, node execution context, trigger API, variable passing."
keywords: "workflow,API reference,Workflow Model,node context,trigger API,NocoBase"
---

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

| Parameter | Type                        | Description              |
| --------- | --------------------------- | ------------------------ |
| `type`    | `string`                    | Trigger type identifier  |
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

| Parameter     | Type                                | Description                |
| ------------- | ----------------------------------- | -------------------------- |
| `type`        | `string`                            | Instruction type identifier |
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

:::info{title=Note}
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

| Parameter | Type       | Description            |
| --------- | ---------- | ---------------------- |
| `job`     | `JobModel` | The updated job object |

:::info{title=Note}
The passed job object is generally an updated object, and its `status` is usually updated to a value other than `JOB_STATUS.PENDING`, otherwise it will continue to wait.
:::

**Example**

See [source code](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-manual/src/server/actions.ts#L99) for details.

### `Trigger`

The base class for triggers, used to extend custom trigger types.

```ts
import { Trigger } from '@nocobase/plugin-workflow';
```

| Parameter     | Type                                                        | Description                              |
| ------------- | ----------------------------------------------------------- | ---------------------------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Trigger` | Constructor                              |
| `on?`         | `(workflow: WorkflowModel): void`                           | Event handler after enabling a workflow  |
| `off?`        | `(workflow: WorkflowModel): void`                           | Event handler after disabling a workflow |

`on`/`off` are used to register/unregister event listeners when a workflow is enabled/disabled. The passed parameter is the workflow instance corresponding to the trigger, which can be processed according to the configuration. Some trigger types that already have globally listened events may not need to implement these two methods. For example, in a scheduled trigger, you can register a timer in `on` and unregister it in `off`.

### `Instruction`

The base class for instruction types, used to extend custom instruction types.

```ts
import { Instruction } from '@nocobase/plugin-workflow';
```

| Parameter     | Type                                                            | Description                                                                    |
| ------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Instruction` | Constructor                                                                    |
| `run`         | `Runner`                                                        | Execution logic for the first entry into the node                              |
| `resume?`     | `Runner`                                                        | Execution logic for entering the node after resuming from an interruption      |
| `getScope?`   | `(node: FlowNodeModel, data: any, processor: Processor): any`  | Provides the local variable content for the branch generated by the corresponding node |

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

```ts
import { EXECUTION_STATUS } from '@nocobase/plugin-workflow';
```

| Constant Name                   | Meaning                                 |
| ------------------------------- | --------------------------------------- |
| `EXECUTION_STATUS.QUEUEING`     | Queueing                                |
| `EXECUTION_STATUS.STARTED`      | Started                                 |
| `EXECUTION_STATUS.RESOLVED`     | Resolved                                |
| `EXECUTION_STATUS.FAILED`       | Failed                                  |
| `EXECUTION_STATUS.ERROR`        | Error                                   |
| `EXECUTION_STATUS.ABORTED`      | Aborted                                 |
| `EXECUTION_STATUS.CANCELED`     | Canceled                                |
| `EXECUTION_STATUS.REJECTED`     | Rejected                                |
| `EXECUTION_STATUS.RETRY_NEEDED` | Not successfully executed, retry needed |

Except for the first three, all others represent a failed state, but can be used to describe different reasons for failure.

### `JOB_STATUS`

A constant table for workflow node job statuses, used to identify the current status of the corresponding node job. The status generated by the node also affects the status of the entire execution plan.

```ts
import { JOB_STATUS } from '@nocobase/plugin-workflow';
```

| Constant Name              | Meaning                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------ |
| `JOB_STATUS.PENDING`      | Pending: Execution has reached this node, but the instruction requires it to suspend and wait    |
| `JOB_STATUS.RESOLVED`     | Resolved                                                                                         |
| `JOB_STATUS.FAILED`       | Failed: The execution of this node failed to meet the configured conditions                      |
| `JOB_STATUS.ERROR`        | Error: An unhandled error occurred during the execution of this node                             |
| `JOB_STATUS.ABORTED`      | Aborted: The execution of this node was terminated by other logic after being in a pending state  |
| `JOB_STATUS.CANCELED`     | Canceled: The execution of this node was manually canceled after being in a pending state         |
| `JOB_STATUS.REJECTED`     | Rejected: The continuation of this node was manually rejected after being in a pending state      |
| `JOB_STATUS.RETRY_NEEDED` | Not successfully executed, retry needed                                                          |

## Client-side

The APIs available in the client-side package structure are shown in the following code:

```ts
import PluginWorkflowClientV2, {
  Trigger,
  Instruction,
} from '@nocobase/plugin-workflow/client-v2';
```

### `PluginWorkflowClientV2`

Workflow client plugin class. Usually obtained via `this.app.pm.get('workflow')`.

#### `registerTrigger()`

Registers the configuration panel for a trigger type.

**Signature**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger): void`

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| `type` | `string` | Trigger type identifier, consistent with the server-side registered identifier |
| `trigger` | `typeof Trigger \| Trigger` | Trigger type or instance |

#### `registerInstruction()`

Registers the configuration panel for a node type.

**Signature**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction): void`

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| `type` | `string` | Node type identifier, consistent with the server-side registered identifier |
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
| --- | --- | --- |
| `type` | `string` | Node group identifier |
| `group` | `{ label: string }` | Group information, currently only includes the title |

**Example**

```ts
import { Plugin } from '@nocobase/client-v2';

export default class YourPluginClient extends Plugin {
  async load() {
    const pluginWorkflow = this.app.pm.get('workflow');
    pluginWorkflow.registerInstructionGroup('ai', { label: `{{t("AI", { ns: "${NAMESPACE}" })}}` });
  }
}
```

#### `isWorkflowSync()`

Determines whether a workflow is in synchronous mode.

**Signature**

`isWorkflowSync(workflow: object): boolean`

### `Trigger`

The base class for triggers, used to extend custom trigger types.

| Parameter | Type | Description |
| --- | --- | --- |
| `title` | `string` | Trigger type name |
| `description?` | `string` | Trigger type description |
| `PresetFieldsetLoader?` | `LoaderOf` | Preset configuration form on creation (lazy-loaded) |
| `FieldsetLoader?` | `LoaderOf` | Full trigger configuration form (lazy-loaded) |
| `TriggerFieldsetLoader?` | `LoaderOf` | Input form for manual execution (lazy-loaded) |
| `validate` | `(config: Record<string, unknown>) => boolean` | Configuration validation; returns `true` if the configuration is valid |
| `createDefaultConfig?` | `() => Record<string, unknown>` | Provides default configuration values |
| `useVariables?` | `(config, options?: UseVariableOptions) => VariableOption[] \| null` | Variable options for trigger context data |
| `getCreateModelMenuItem?` | `(args) => SubModelItem \| SubModelItem[] \| null` | Menu items for creating sub-models on the canvas |
| `useTempAssociationSource?` | `(config, workflow?) => TriggerTempAssociationSource \| null` | Provides a temporary association data source |

**Related Types**

```ts
export type LoaderOf<P = {}> = () => Promise<{ default: ComponentType<P> }>;
```

- If `useVariables` is not set, it means that this trigger type does not provide a value retrieval function, and the trigger's context data cannot be selected in the workflow nodes.

### `Instruction`

The base class for instructions, used to extend custom node types.

| Parameter | Type | Description |
| --- | --- | --- |
| `title` | `string` | Node type name |
| `type` | `string` | Node type identifier |
| `group` | `string` | Node type group identifier, options: `'control'`/`'collection'`/`'manual'`/`'extended'` |
| `description?` | `string` | Node type description |
| `icon?` | `JSX.Element` | Node icon |
| `FieldsetLoader?` | `LoaderOf` | Node configuration drawer form (lazy-loaded) |
| `PresetFieldsetLoader?` | `LoaderOf` | Preset configuration form on creation (lazy-loaded) |
| `ComponentLoader?` | `LoaderOf<{ data: any }>` | Custom node rendering on the canvas (lazy-loaded), used for branch nodes and other cases requiring special rendering |
| `branching?` | `boolean \| object \| ((config) => boolean \| object)` | Declares whether the node is a branch node |
| `end?` | `boolean \| ((node) => boolean)` | Declares whether the node is a terminal node |
| `testable?` | `boolean` | Declares whether the node supports test runs |
| `createDefaultConfig?` | `() => object` | Provides default configuration values |
| `useVariables?` | `(node, options?: UseVariableOptions) => VariableOption` | Method for the node to provide variable options |
| `useScopeVariables?` | `(node, options?) => VariableOption[] \| MetaTreeNode[]` | Method for the node to provide branch-scoped variable options |
| `isAvailable?` | `(ctx: NodeAvailableContext) => boolean` | Method to determine whether the node is available |
| `getCreateModelMenuItem?` | `({ node, workflow }) => SubModelItem \| null` | Menu items for creating sub-models on the canvas |
| `useTempAssociationSource?` | `(node) => TempAssociationSource \| null` | Provides a temporary association data source |

**Related Types**

```ts
export type NodeAvailableContext = {
  engine: WorkflowPlugin;
  workflow: object;
  upstream: object;
  branchIndex: number;
};
```

- If `useVariables` is not set, it means that this node type does not provide a value retrieval function, and the result data of this type of node cannot be selected in the workflow nodes. If the result value is singular (not selectable), you can return static content that expresses the corresponding information (see: [calculation node source code](https://github.com/nocobase/nocobase/blob/develop/packages/plugins/%40nocobase/plugin-workflow/src/client-v2/nodes/calculation.tsx)). If it needs to be selectable (e.g., a property of an Object), you can customize the corresponding selection component output (see: [query data node source code](https://github.com/nocobase/nocobase/blob/develop/packages/plugins/%40nocobase/plugin-workflow/src/client-v2/nodes/query.tsx)).
- `ComponentLoader` is a custom rendering component for the node. When the default node rendering is not sufficient, it can be completely overridden for custom node view rendering. For example, to provide additional branch rendering for branch-type nodes (see: [condition node source code](https://github.com/nocobase/nocobase/blob/develop/packages/plugins/%40nocobase/plugin-workflow/src/client-v2/nodes/condition.tsx)).
- `isAvailable` is mainly used to determine whether a node can be used (added) in the current environment. The current environment includes the workflow plugin instance, the current workflow, upstream nodes, and the current branch index.

### Variable Input Components

The workflow provides a set of variable input components for letting users select workflow variables in node/trigger configuration forms.

```ts
import {
  WorkflowVariableInput,
  WorkflowVariableTextArea,
  WorkflowTypedVariableInput,
  WorkflowVariableWrapper,
} from '@nocobase/plugin-workflow/client-v2';
```

#### `WorkflowVariableInput`

Variable input that supports selecting a variable and continuing to type content. Suitable for single-line input scenarios that require a mix of variable references and free text.

```tsx
import { WorkflowVariableInput } from '@nocobase/plugin-workflow/client-v2';

<Form.Item name={['config', 'target']} label="Target">
  <WorkflowVariableInput />
</Form.Item>
```

![WorkflowVariableInput](https://static-docs.nocobase.com/20260701160110.png)

**Props**

| Parameter | Type | Description |
| --- | --- | --- |
| `value?` | `string` | Variable path value, e.g. `{{$jobsMapByNodeKey.xxx.field}}` |
| `onChange?` | `(value: string) => void` | Value change callback |
| `variableOptions?` | `UseWorkflowVariableOptions` | Variable filter options (type filtering, depth, etc.) |
| `disabled?` | `boolean` | Whether disabled |
| `placeholder?` | `string` | Placeholder text |

#### `WorkflowVariableTextArea`

Multi-line text area that supports inserting variable references at any cursor position. Suitable for free text scenarios such as HTTP Body, template text, etc.

```tsx
import { WorkflowVariableTextArea } from '@nocobase/plugin-workflow/client-v2';

<Form.Item name={['config', 'body']} label="Body">
  <WorkflowVariableTextArea autoSize={{ minRows: 5 }} />
</Form.Item>
```

![WorkflowVariableTextArea](https://static-docs.nocobase.com/20260701160242.png)

**Props**

| Parameter | Type | Description |
| --- | --- | --- |
| `value?` | `string` | Text value (may contain variable references) |
| `onChange?` | `(value: string) => void` | Value change callback |
| `variableOptions?` | `UseWorkflowVariableOptions` | Variable filter options |
| `delimiters?` | `readonly [string, string]` | Variable delimiters, defaults to `['{{', '}}']` |

Inherits other Props from antd `TextArea` (such as `autoSize`, `placeholder`, etc.).

#### `WorkflowTypedVariableInput`

Typed input that switches between "constant" and "variable reference" modes. In variable mode, you can only select a variable; you cannot continue typing after selection. In constant mode, five types are supported: `string`, `number`, `boolean`, `date`, and `object`.

```tsx
import { WorkflowTypedVariableInput } from '@nocobase/plugin-workflow/client-v2';

<Form.Item name={['config', 'value']} label="Value">
  <WorkflowTypedVariableInput />
</Form.Item>
```

![WorkflowTypedVariableInput](https://static-docs.nocobase.com/20260701160608.png)

**Props**

| Parameter | Type | Description |
| --- | --- | --- |
| `variableOptions?` | `UseWorkflowVariableOptions` | Variable filter options |

Inherits other Props from `TypedVariableInput` (excluding internally used `extraNodes`, `metaTree`, `namespaces`).

#### `WorkflowVariableWrapper`

Generic wrapper for substituting different input components in different contexts. For example, when the same field requires different input methods in the trigger node configuration and the node configuration drawer, you can use this component to wrap a native input into a variable-mode-switchable input.

```tsx
import { WorkflowVariableWrapper } from '@nocobase/plugin-workflow/client-v2';

<Form.Item name={['config', 'timeout']} label="Timeout">
  <WorkflowVariableWrapper
    render={({ value, onChange }) => (
      <InputNumber value={value} onChange={onChange} min={0} />
    )}
  />
</Form.Item>
```

**Props**

| Parameter | Type | Description |
| --- | --- | --- |
| `value?` | `TValue \| string \| null` | Current value (constant value or variable path string) |
| `onChange?` | `(value: TValue \| string \| null) => void` | Value change callback |
| `variableOptions?` | `UseWorkflowVariableOptions` | Variable filter options |
| `render` | `(props: { value?, onChange? }) => ReactNode` | Renders the native input component |
| `clearValue?` | `TValue \| null` | Initial value when switching from variable mode back to constant mode, defaults to `null` |

### Collection-related Components

The workflow also provides a set of collection-related helper components:

```ts
import {
  CollectionCascader,
  AppendsSelect,
  FieldsSelect,
  SortFieldsInput,
  PaginationFields,
} from '@nocobase/plugin-workflow/client-v2';
```

- `CollectionCascader` — Data-source-aware collection selector (cascader)
- `AppendsSelect` — Association field preloading selector (tree select)
- `FieldsSelect` — Collection field multi-selector
- `SortFieldsInput` — Sort field input
- `PaginationFields` — Pagination parameter form items
