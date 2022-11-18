# API 参考

## 服务端

在应用的运行时，任意可以获取应用实例 `app` 的地方调用 `app.getPlugin('workflow')` 以获取插件实例（下文以 `plugin` 指代）。

### `plugin.triggers`

触发器注册表，用于扩展注册新的触发器类型。

**签名**

`plugin.triggers.register(type: string, trigger: Trigger)`

**参数**

| 参数 | 类型 | 描述 |
| --- | --- | --- |
| `type` | `string` | 触发器类型标识符 |
| `trigger` | `Trigger` | 触发器类实例 |

注：`trigger` 参数在实例化自定义 `Trigger` 类型时第一个参数需要传入工作流插件实例对象。

**示例**

```ts
import { Trigger } from '@nocobase/plugin-workflow';

class MyTrigger extends Trigger {
  // ...
  on(workflow) {
    // listen some event to trigger workflow
    // this.plugin.trigger(workflow, { data });
  }

  off(workflow) {
    // remove listener
  }
}

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.getPlugin('workflow');

    // register trigger instance
    workflowPlugin.triggers.register('myTrigger', new MyTrigger(workflowPlugin));
  }
}
```

### `plugin.instructions`

指令注册表，用于扩展注册新的节点类型。

**签名**

`plugin.instructions.register(type: string, instruction: Instruction)`

**参数**

| 参数 | 类型 | 描述 |
| --- | --- | --- |
| `type` | `string` | 指令类型标识符 |
| `instruction` | `Instruction` | 指令对象 |
| `instruction.run` | `Runner` | 执行内容函数 |
| `instruction.resume?` | `Runner` | 回溯再处理函数 |

**相关类型**

```ts
export type Job = {
  status: number;
  result?: unknown;
  [key: string]: unknown;
} | null;

export type InstructionResult = Job | Promise<Job>;

export type Runner = (node: FlowNodeModel, input: any, processor: Processor) => InstructionResult;

export interface Instruction {
  run: Runner;
  resume?: Runner
}
```

**示例**

```ts
import { JOB_STATUS } from '@nocobase/plugin-workflow';

const log = {
  run(node, input, processor) {
    console.log('my instruction runs!');
    return {
      status: JOB_STATUS.RESOVLED,
    };
  }
};

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.getPlugin('workflow');

    // register trigger instance
    workflowPlugin.instructions.register('log', log);
  }
}
```

### `plugin.trigger()`

触发特定的工作流。主要用于在自定义触发器中，当监听到特定自定义事件时触发对应的工作流。

**签名**

`plugin.trigger(workflow: Workflow, context: any)`

**参数**
| 参数 | 类型 | 描述 |
| --- | --- | --- |
| `workflow` | `WorkflowModel` | 要触发的工作流对象 |
| `context` | `any` | 触发时提供的上下文数据 |

注：`context` 目前是必填项，不提供的话该工作流不会触发。

**示例**

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

### `plugin.resume()`

以特定的节点任务将停等的工作流恢复执行。

* 只有处在停等状态（`EXECUTION_STATUS.STARTED`）的工作流才能被恢复执行。
* 只有处在停等状态（`JOB_STATUS.PENDING`）的节点任务才能被恢复执行。

**签名**

`plugin.resume(job: JobModel)`

**参数**

| 参数 | 类型 | 描述 |
| --- | --- | --- |
| `job` | `JobModel` | 更新后的任务对象 |

注：传入的任务对象一般是更新后的对象，且通常会将 `status` 更新为非 `JOB_STATUS.PENDING` 的值，否则将继续停等。

**示例**

详见[源码](https://github.com/nocobase/nocobase/blob/main/packages/plugins/workflow/src/server/actions/jobs.ts)。

## 客户端

客户端包结构可用的 API 如以下代码所示：

```ts
import {
  triggers,
  instructions,
} from '@nocobase/workflow/client';
```

### `triggers.register()`

注册触发器类型对应的配置面板。

**签名**

`triggers.register(type: string, config: Trigger): void`

**参数**

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `type` | `string` | 触发器类型标识，与注册使用的标识一致 |
| `config.title` | `string` | 触发器类型名称 |
| `config.fieldset` | `{ [key: string]: ISchema }` | 触发器配置项集合 |
| `config.scope?` | `{ [key: string]: any }` | 配置项 Schema 中可能用到的对象集合 |
| `config.components?` | `{ [key: string]: React.FC }` | 配置项 Schema 中可能用到的组件集合 |
| `config.getter?` | `React.FC` | 触发上下文数据的值获取器 |
| `config.view?` | `ISchema` | 触发器配置项的摘要展示组件 |

* `config.fieldset` 中的配置项的表单名称暂时需以 `config.` 开头（未来可能会省略）。
* `config.getter` 如果没有设置，则代表该类型触发器不提供取值功能，在流程的节点中无法选取触发器的上下文数据。

### `instructions.register()`

注册节点类型对应的配置面板。

**签名**

`instructions.register(type: string, config: Instruction): void`

**参数**

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `type` | `string` | 节点类型标识，与注册使用的标识一致 |
| `config.title` | `string` | 节点类型名称 |
| `config.group` | `string` | 节点类型分组标识，目前可选：`'control'`/`'collection'`/`'extended'` |
| `config.fieldset` | `{ [key: string]: ISchema }` | 节点配置项集合 |
| `config.scope?` | `{ [key: string]: any }` | 配置项 Schema 中可能用到的对象集合 |
| `config.components?` | `{ [key: string]: React.FC }` | 配置项 Schema 中可能用到的组件集合 |
| `config.getter?` | `React.FC` | 触发上下文数据的值获取器 |
| `config.view?` | `ISchema` | 节点配置项的摘要展示组件 |
| `config.render?` | `React.FC` | 自定义节点渲染组件 |

* `fieldset` 中的配置项的表单名称暂时需以 `config.` 开头（未来可能会省略）。
* `getter` 如果没有设置，则代表该节点类型不提供取值功能，在流程的节点中无法选该类型节点的结果数据。如果结果值是单一的（不可选），则返回一个可以表达对应信息的静态内容即可。如果需要可选（如一个 Object 中的某个属性），则可以自定义对应的选择组件输出。
* `render` 方法当默认节点渲染不满足时可以完全覆盖替代使用，进行自定义节点视图渲染。例如要针对分支类型的开始节点提供更多操作按钮或其他交互，则需要使用该方法，具体可以参考并行分支等节点的前端实现（[相关源码](https://github.com/nocobase/nocobase/blob/main/packages/plugins/workflow/src/client/nodes/parallel.tsx)）。
