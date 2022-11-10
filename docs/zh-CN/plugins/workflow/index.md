# 工作流

工作流是一个编排和配置自动化流程的强大工具，常用于基于数据模型的业务流程设计与编排，通过触发条件与执行流程编排实现业务流程的自动化流转。基于工作流插件，可以在 UI 界面上完成大部分业务的编排，而无需通过修改代码的传统方式来开发或升级系统中的业务流程。

## 基本使用

TODO

## 扩展开发

### 内核简介

工作流引擎也是一个微内核架构，核心仅为一个自动状态机的设计，可根据具体配置的指令进行程序化的自动处理。基于状态机的内核设计，可以任意扩展触发器类型、节点（指令）类型，以尽可能达到无代码或低代码开发的目的。

工作流在配置和运行时的基础数据建模如下图：

<img src="./workflow-modeling.svg" style="max-width: 600px;" />

* 一个工作流（workflow）有若干个流程节点（node）。
* 多个节点之间有上下游和分支关系，组成树状结构。
* 一个工作流可以有多次触发，每次触发会创建一个新的流程实例（execution），用于跟踪执行状态。
* 每次触发执行，根据配置的节点，会有若干个任务（job），以记录每个节点的执行状态和结果。

工作流在触发后的执行的状态有以下几种：

| 常量名 | 值 | 含义 |
| --- | --- | --- |
| `EXECUTION_STATUS.STARTED` | `0` | 执行中 |
| `EXECUTION_STATUS.RESOLVED` | `1` | 已执行成功 |
| `EXECUTION_STATUS.REJECTED` | `-1` | 已执行失败 |

每个节点的执行状态有以下几种：

| 常量名 | 值 | 含义 |
| --- | --- | --- |
| `JOB_STATUS.PENDING` | `0` | 已执行到该节点，但指令要求挂起等待 |
| `JOB_STATUS.RESOLVED` | `1` | 该节点已执行成功 |
| `JOB_STATUS.REJECTED` | `-1` | 该节点已执行失败（报错或业务拒绝） |

节点的执行状态会影响整个流程的成功或失败，通常在没有分支的情况下，某个节点的失败会直接导致整个流程失败。在并行分支或其他特定的情况下，某个节点执行失败后会将状态交由分支入口的节点按特定情况判断进行处理。例如在 `all` 模式的并行分支内，某个分支失败个流程即失败，但在 `any` 模式下，只要有一个分支成功，整个流程即成功。

节点的状态由具体对应的指令（程序）执行决定，在扩展指令类型时会涉及到指令的执行的返回状态。

### 扩展触发器类型

触发器类型基于字符串标识注册在插件的触发器表中，工作流插件内置了两种触发器：

* `'collection'`：数据表操作触发；
* `'schedule'`：定时任务触发；

扩展的触发器类型需要保证标识唯一，在服务端注册触发器的订阅/取消订阅的实现，在客户端注册界面配置的实现。

#### 服务端

任意触发器需要继承自 `Trigger` 基类，并实现 `on`/`off` 方法，分别用于订阅和取消订阅具体的环境事件。在 `on` 方法中，需要在具体的事件回调函数中调用 `this.plugin.trigger()`，以最终触发事件。另外在 `off` 方法中，需要做取消订阅的相关清理工作。

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

  off(workflow) {
    // unregister event
    clearInterval(this.timer);
  }
}
```

之后在对工作流进行扩展的插件中将触发器实例注册到工作流引擎上：

```ts
export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.getPlugin('workflow');

    // register trigger instance
    workflowPlugin.triggers.register('interval', new MyTrigger(workflowPlugin));
  }
}
```

服务端启动加载以后，`'interval'` 类型的触发器就可以被添加和执行了。

#### 客户端

客户端的部分主要根据触发器类型所需的配置项提供配置界面。每种触发器类型同样需要向工作流插件注册相应的类型配置。

例如对上面的定时执行的触发器定义配置界面：

```ts
import { triggers } from '@nocobase/workflow/client';

triggers.register('interval', {
  title: 'Interval timer trigger',
  type: 'interval',
  // fields of trigger config
  fieldset: {
    'config.interval': {
      type: 'number',
      title: 'Interval',
      name: 'config.interval',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      default: 60000,
    }
  }
});
```

### 扩展节点类型

节点的类型本质上就是操作指令，不同的指令代表流程中依次执行的不同的操作。

与触发器类似，扩展节点的类型也分为前后端两部分。服务端需要对注册的指令进行逻辑实现，客户端需要提供指令内容的界面配置。

#### 服务端

指令的基础内容是一个函数，函数中可以执行任意需要的操作，例如数据库操作、文件操作、调用第三方 API 等等。另外，指令的返回对象中的状态值，将决定该节点在流程中的后续处理的流向。

最简单的指令只需要定义一个 `run` 函数即可：

```ts
import { JOB_STATUS } from '@nocobase/plugin-workflow';

export const myInstruction = {
  run(node, input, processor) {
    console.log('my instruction runs!');
    return {
      status: JOB_STATUS.RESOVLED,
    };
  }
};
```

返回值中必须要包含该指令执行完以后的状态描述，必须是常量 `JOB_STATUS` 中的值，通常使用 `JOB_STATUS.RESOVLED` 即可，代表该节点成功执行完毕，会继续后续节点的执行。如果有需要提前保存的结果值，也可以调用 `processor.saveJob` 方法，并返回该方法的返回对象。

如果有特定的执行结果，尤其是准备可供后续节点使用的数据，可以通过 `result` 属性返回：

```ts
import { JOB_STATUS } from '@nocobase/plugin-workflow';

export const randomString = {
  run(node, input, processor) {
    // customized config from node
    const { digit = 1 } = node.config;
    const result = `${Math.round(10 ** digit * Math.random())}`.padStart(digit, '0');
    return {
      status: JOB_STATUS.RESOVLED,
      result,
    };
  }
}
```

其中 `node.config` 是节点的配置项，可以是需要的任意值，会以 `JSON` 类型字段保存在数据库对应的节点记录中。

如果执行过程可能会有异常，可以提前捕获后并返回失败状态：

```ts
import { JOB_STATUS } from '@nocobase/plugin-workflow';

export const errorInstruction = {
  run(node, input, processor) {
    try {
      throw new Error('exception');
    } catch (error) {
      return {
        status: JOB_STATUS.REJECTED,
        result: error
      };
    }
  }
};
```

如果不对可预测的异常进行捕获，那么流程引擎会自动捕获并返回失败状态。如果执行中使用了事务，可能造成事务的回滚。

当需要进行流程控制或者异步（耗时）IO 操作时，可以返回 `JOB_STATUS.PENDING` 状态表示该流程暂时挂起，等待某些外部异步操作完成后，通知流程引擎继续执行。如果在 `run` 函数中返回了挂起的状态值，则该指令必须实现 `resume` 方法，否则无法恢复流程的执行：

```ts
import { JOB_STATUS } from '@nocobase/plugin-workflow';

export const pay = {
  async run(node, input, processor) {
    // job could be create first via processor
    const job = await processor.saveJob({
      status: JOB_STATUS.PENDING
    });

    const { plugin } = processor;
    // do payment
    await paymentService.pay(node.config, (result) => {
      // notify processor to resume the job
      return plugin.resume(job.id, result);
    });

    // return created job instance
    return job;
  },
  resume(node, job, processor) {
    // check payment status
    job.set('status', job.result.status === 'ok' ? JOB_STATUS.RESOVLED : JOB_STATUS.REJECTED);
    return job;
  }
};
```

其中 `paymentService` 指代某个支付服务，在服务的回调中再触发工作流恢复对应任务的执行流程，当前流程先退出。之后由工作流引擎创建新的处理器转交到节点的 `resume` 方法中，将之前已挂起的节点继续执行。

注：这里说的“异步操作”不是指 JavaScript 中的 `async` 函数，而是与其他外部系统交互时，如果不是一个即时返回的操作，比如支付服务会需要等待另外的通知才能知道结果。

#### 客户端

与触发器类型，节点类型的配置内容需要在前端实现。

例如我们需要为上面在服务端定义的随机数字符串类型（`randomString`）的节点提供配置界面，其中有一个配置项是 `digit` 代表随机数的位数，在配置表单中我们使用一个数字输入框来接收用户输入。

```tsx | pure
import { instructions } from '@nocobase/workflow/client';

instructions.register('randomString', {
  title: 'Generate random number string',
  type: 'randomString',
  group: 'extended',
  fieldset: {
    'config.digit': {
      type: 'number',
      title: 'Digit',
      name: 'config.digit',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      'x-component-props': {
        min: 1,
        max: 10,
      },
      default: 6,
    },
  },
  getter() {
    return <span>Random number string</span>;
  }
});
```

## API 参考

### 服务端

在应用的运行时，任意可以获取应用实例 `app` 的地方调用 `app.getPlugin('workflow')` 以获取插件实例（下文以 `plugin` 指代）。

#### `plugin.triggers`

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

#### `plugin.instructions`

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

#### `plugin.trigger()`

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

#### `plugin.resume()`

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

### 客户端

客户端包结构可用的 API 如以下代码所示：

```ts
import {
  triggers,
  instructions
} from '@nocobase/workflow/client'
```

#### `triggers.register()`

注册触发器类型对应的配置面板。

**签名**

`triggers.register(type: string, config: Trigger): void`

**参数**

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `title` | `string` | 触发器类型名称 |
| `type` | `string` | 触发器类型标识，与注册使用的标识一致 |
| `fieldset` | `{ [key: string]: ISchema }` | 触发器配置项集合 |
| `scope?` | `{ [key: string]: any }` | 配置项 Schema 中可能用到的对象集合 |
| `components?` | `{ [key: string]: React.FC }` | 配置项 Schema 中可能用到的组件集合 |
| `getter?` | `React.FC` | 触发上下文数据的值获取器 |
| `view?` | `ISchema` | 触发器配置项的摘要展示组件 |

* `fieldset` 中的配置项的表单名称暂时需以 `config.` 开头（未来可能会省略）。
* `getter` 如果没有设置，则代表该类型触发器不提供取值功能，在流程的节点中无法选取触发器的上下文数据。

#### `instructions.register()`

注册节点类型对应的配置面板。

**签名**

`instructions.register(type: string, config: Instruction): void`

**参数**

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `title` | `string` | 节点类型名称 |
| `type` | `string` | 节点类型标识，与注册使用的标识一致 |
| `group` | `string` | 节点类型分组标识，目前可选：`'control'`/`'collection'`/`extended` |
| `fieldset` | `{ [key: string]: ISchema }` | 节点配置项集合 |
| `scope?` | `{ [key: string]: any }` | 配置项 Schema 中可能用到的对象集合 |
| `components?` | `{ [key: string]: React.FC }` | 配置项 Schema 中可能用到的组件集合 |
| `getter?` | `React.FC` | 触发上下文数据的值获取器 |
| `view?` | `ISchema` | 节点配置项的摘要展示组件 |
| `render?` | `React.FC` | 自定义节点渲染组件 |

* `fieldset` 中的配置项的表单名称暂时需以 `config.` 开头（未来可能会省略）。
* `getter` 如果没有设置，则代表该节点类型不提供取值功能，在流程的节点中无法选该类型节点的结果数据。如果结果值是单一的（不可选），则返回一个可以表达对应信息的静态内容即可。如果需要可选（如一个 Object 中的某个属性），则可以自定义对应的选择组件输出。
* `render` 方法当默认节点渲染不满足时可以完全覆盖替代使用，进行自定义节点视图渲染。例如要针对分支类型的开始节点提供更多操作按钮或其他交互，则需要使用该方法，具体可以参考并行分支等节点的前端实现（[相关源码](https://github.com/nocobase/nocobase/blob/main/packages/plugins/workflow/src/client/nodes/parallel.tsx)）。
