# Extending Node Types

A node's type is essentially an operational instruction. Different instructions represent different operations executed in the workflow.

Similar to triggers, extending node types is also divided into two parts: server-side and client-side. The server-side needs to implement the logic for the registered instruction, while the client-side needs to provide the interface configuration for the parameters of the node where the instruction is located.

## Server-side

### The Simplest Node Instruction

The core content of an instruction is a function, meaning the `run` method in the instruction class must be implemented to execute the instruction's logic. Any necessary operations can be performed within the function, such as database operations, file operations, calling third-party APIs, etc.

All instructions need to be derived from the `Instruction` base class. The simplest instruction only needs to implement a `run` function:

```ts
import { Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

export class MyInstruction extends Instruction {
  run(node, input, processor) {
    console.log('my instruction runs!');
    return {
      status: JOB_STATUS.RESOVLED,
    };
  }
}
```

And register this instruction with the workflow plugin:

```ts
export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.getPlugin<WorkflowPlugin>(WorkflowPlugin);

    // register instruction
    workflowPlugin.registerInstruction('my-instruction', MyInstruction);
  }
}
```

The status value (`status`) in the instruction's return object is mandatory and must be a value from the `JOB_STATUS` constant. This value determines the flow of subsequent processing for this node in the workflow. Typically, `JOB_STATUS.RESOVLED` is used, indicating that the node has executed successfully and the execution will continue to the next nodes. If there is a result value that needs to be saved in advance, you can also call the `processor.saveJob` method and return its return object. The executor will generate an execution result record based on this object.

### Node Result Value

If there is a specific execution result, especially data prepared for use by subsequent nodes, it can be returned through the `result` property and saved in the node's job object:

```ts
import { Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

export class RandomStringInstruction extends Instruction {
  run(node, input, processor) {
    // customized config from node
    const { digit = 1 } = node.config;
    const result = `${Math.round(10 ** digit * Math.random())}`.padStart(
      digit,
      '0',
    );
    return {
      status: JOB_STATUS.RESOVLED,
      result,
    };
  },
};
```

Here, `node.config` is the node's configuration item, which can be any required value. It will be saved as a `JSON` type field in the corresponding node record in the database.

### Instruction Error Handling

If exceptions may occur during execution, you can catch them in advance and return a failed status:

```ts
import { JOB_STATUS } from '@nocobase/plugin-workflow';

export const errorInstruction = {
  run(node, input, processor) {
    try {
      throw new Error('exception');
    } catch (error) {
      return {
        status: JOB_STATUS.ERROR,
        result: error,
      };
    }
  },
};
```

If predictable exceptions are not caught, the workflow engine will automatically catch them and return an error status to prevent uncaught exceptions from crashing the program.

### Asynchronous Nodes

When flow control or asynchronous (time-consuming) I/O operations are needed, the `run` method can return an object with a `status` of `JOB_STATUS.PENDING`, prompting the executor to wait (suspend) until some external asynchronous operation is completed, and then notify the workflow engine to continue execution. If a pending status value is returned in the `run` function, the instruction must implement the `resume` method; otherwise, the workflow execution cannot be resumed:

```ts
import { Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

export class PayInstruction extends Instruction {
  async run(node, input, processor) {
    // job could be create first via processor
    const job = await processor.saveJob({
      status: JOB_STATUS.PENDING,
    });

    const { workflow } = processor;
    // do payment asynchronously
    paymentService.pay(node.config, (result) => {
      // notify processor to resume the job
      return workflow.resume(job.id, result);
    });

    // return created job instance
    return job;
  }

  resume(node, job, processor) {
    // check payment status
    job.set('status', job.result.status === 'ok' ? JOB_STATUS.RESOVLED : JOB_STATUS.REJECTED);
    return job;
  },
};
```

Here, `paymentService` refers to a payment service. In the service's callback, the workflow is triggered to resume the execution of the corresponding job, and the current process exits first. Later, the workflow engine creates a new processor and passes it to the node's `resume` method to continue executing the previously suspended node.

:::info{title=Note}
The "asynchronous operation" mentioned here does not refer to `async` functions in JavaScript, but rather to non-instantaneous return operations when interacting with other external systems, such as a payment service that needs to wait for another notification to know the result.
:::

### Node Result Status

The execution status of a node affects the success or failure of the entire workflow. Typically, without branches, the failure of a node will directly cause the entire workflow to fail. The most common scenario is that if a node executes successfully, it proceeds to the next node in the node table until there are no more subsequent nodes, at which point the entire workflow completes with a successful status.

If a node returns a failed execution status during execution, the engine will handle it differently depending on the following two situations:

1.  The node that returns a failed status is in the main workflow, meaning it is not within any branch workflow opened by an upstream node. In this case, the entire main workflow is judged as failed, and the process exits.

2.  The node that returns a failed status is within a branch workflow. In this case, the responsibility for determining the next state of the workflow is handed over to the node that opened the branch. The internal logic of that node will decide the state of the subsequent workflow, and this decision will recursively propagate up to the main workflow.

Ultimately, the next state of the entire workflow is determined at the nodes of the main workflow. If a node in the main workflow returns a failure, the entire workflow ends with a failed status.

If any node returns a "pending" status after execution, the entire execution process will be temporarily interrupted and suspended, waiting for an event defined by the corresponding node to trigger the resumption of the workflow. For example, the Manual Node, when executed, will pause at that node with a "pending" status, waiting for manual intervention to decide whether to approve. If the manually entered status is approval, the subsequent workflow nodes will continue; otherwise, it will be handled according to the failure logic described earlier.

For more instruction return statuses, please refer to the Workflow API Reference section.

### Early Exit

In some special workflows, it may be necessary to end the workflow directly within a node. You can return `null` to indicate exiting the current workflow, and subsequent nodes will not be executed.

This situation is common in flow control type nodes, such as the Parallel Branch Node ([code reference](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-parallel/src/server/ParallelInstruction.ts#L87)), where the current node's workflow exits, but new workflows are started for each sub-branch and continue to execute.

:::warn{title=Note}
Scheduling branch workflows with extended nodes has a certain complexity and requires careful handling and thorough testing.
:::

### Learn More

For the definitions of various parameters for defining node types, see the Workflow API Reference section.

## Client-side

Similar to triggers, the configuration form for an instruction (node type) needs to be implemented on the client-side.

### The Simplest Node Instruction

All instructions need to be derived from the `Instruction` base class. The related properties and methods are used for configuring and using the node.

For example, if we need to provide a configuration interface for the random number string type (`randomString`) node defined on the server-side above, which has a configuration item `digit` representing the number of digits for the random number, we would use a number input box in the configuration form to receive user input.

```tsx pure
import WorkflowPlugin, { Instruction, VariableOption } from '@nocobase/workflow/client';

class MyInstruction extends Instruction {
  title = 'Random number string';
  type = 'randomString';
  group = 'extended';
  fieldset = {
    'digit': {
      type: 'number',
      title: 'Digit',
      name: 'digit',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      'x-component-props': {
        min: 1,
        max: 10,
      },
      default: 6,
    },
  };
  useVariables(node, options): VariableOption {
    return {
      value: node.key,
      label: node.title,
    };
  }
}

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.getPlugin<WorkflowPlugin>(WorkflowPlugin);

    // register instruction
    workflowPlugin.registerInstruction('randomString', MyInstruction);
  }
}
```

:::info{title=Note}
The node type identifier registered on the client-side must be consistent with the one on the server-side, otherwise it will cause errors.
:::

### Providing Node Results as Variables

You may notice the `useVariables` method in the example above. If you need to use the node's result (the `result` part) as a variable for subsequent nodes, you need to implement this method in the inherited instruction class and return an object that conforms to the `VariableOption` type. This object serves as a structural description of the node's execution result, providing variable name mapping for selection and use in subsequent nodes.

The `VariableOption` type is defined as follows:

```ts
export type VariableOption = {
  value?: string;
  label?: string;
  children?: VariableOption[] | null;
  [key: string]: any;
};
```

The core is the `value` property, which represents the segmented path value of the variable name. `label` is used for display on the interface, and `children` is used to represent a multi-level variable structure, which is used when the node's result is a deeply nested object.

A usable variable is represented internally in the system as a path template string separated by `.`, for example, `{{jobsMapByNodeKey.2dw92cdf.abc}}`. Here, `jobsMapByNodeKey` represents the result set of all nodes (internally defined, no need to handle), `2dw92cdf` is the node's `key`, and `abc` is a custom property in the node's result object.

Additionally, since a node's result can also be a simple value, when providing node variables, the first level **must** be the description of the node itself:

```ts
{
  value: node.key,
  label: node.title,
}
```

That is, the first level is the node's `key` and title. For example, in the calculation node's [code reference](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow/src/client/nodes/calculation.tsx#L77), when using the result of the calculation node, the interface options are as follows:



![Result of Calculation Node](https://static-docs.nocobase.com/20240514230014.png)



When the node's result is a complex object, you can use `children` to continue describing nested properties. For example, a custom instruction might return the following JSON data:

```json
{
  "message": "ok",
  "data": {
    "id": 1,
    "name": "test",
  }
}
```

Then you can return it through the `useVariables` method as follows:

```ts
useVariables(node, options): VariableOption {
  return {
    value: node.key,
    label: node.title,
    children: [
      {
        value: 'message',
        label: 'Message',
      },
      {
        value: 'data',
        label: 'Data',
        children: [
          {
            value: 'id',
            label: 'ID',
          },
          {
            value: 'name',
            label: 'Name',
          },
        ],
      },
    ],
  };
}
```

This way, in subsequent nodes, you can use the following interface to select variables from it:



![Mapped Result Variables](https://static-docs.nocobase.com/20240514230103.png)



:::info{title="Note"}
When a structure in the result is an array of deeply nested objects, you can also use `children` to describe the path, but it cannot include array indices. This is because in NocoBase workflow's variable handling, the variable path description for an array of objects is automatically flattened into an array of deep values when used, and you cannot access a specific value by its index.
:::

### Node Availability

By default, any node can be added to a workflow. However, in some cases, a node may not be applicable in certain types of workflows or branches. In such situations, you can configure the node's availability using `isAvailable`:

```ts
// Type definition
export abstract class Instruction {
  isAvailable?(ctx: NodeAvailableContext): boolean;
}

export type NodeAvailableContext = {
  // Workflow plugin instance
  engine: WorkflowPlugin;
  // Workflow instance
  workflow: object;
  // Upstream node
  upstream: object;
  // Whether it is a branch node (branch number)
  branchIndex: number;
};
```

The `isAvailable` method returns `true` if the node is available, and `false` if it is not. The `ctx` parameter contains the context information of the current node, which can be used to determine its availability.

If there are no special requirements, you do not need to implement the `isAvailable` method, as nodes are available by default. The most common scenario requiring configuration is when a node might be a time-consuming operation and is not suitable for execution in a synchronous workflow. You can use the `isAvailable` method to restrict its use. For example:

```ts
isAvailable({ engine, workflow, upstream, branchIndex }) {
  return !engine.isWorkflowSync(workflow);
}
```

### Learn More

For the definitions of various parameters for defining node types, see the Workflow API Reference section.