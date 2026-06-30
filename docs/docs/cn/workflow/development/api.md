---
title: "API 参考"
description: "工作流扩展 API 参考：Workflow Model、节点执行上下文、触发器 API、变量传递。"
keywords: "工作流,API 参考,Workflow Model,节点上下文,触发器 API,NocoBase"
---

# API 参考

## 服务端

服务端包结构可用的 API 如以下代码所示：

```ts
import PluginWorkflowServer, {
  Trigger,
  Instruction,
  EXECUTION_STATUS,
  JOB_STATUS,
} from '@nocobase/plugin-workflow';
```

### `PluginWorkflowServer`

工作流插件类。

通常在应用的运行时，任意可以获取应用实例 `app` 的地方调用 `app.pm.get<PluginWorkflowServer>(PluginWorkflowServer)` 以获取工作流插件实例（下文以 `plugin` 指代）。

#### `registerTrigger()`

扩展注册新的触发器类型。

**签名**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger })`

**参数**

| 参数      | 类型                        | 描述             |
| --------- | --------------------------- | ---------------- |
| `type`    | `string`                    | 触发器类型标识符 |
| `trigger` | `typeof Trigger \| Trigger` | 触发器类型或实例 |

**示例**

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

扩展注册新的节点类型。

**签名**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction })`

**参数**

| 参数          | 类型                                | 描述           |
| ------------- | ----------------------------------- | -------------- |
| `type`        | `string`                            | 指令类型标识符 |
| `instruction` | `typeof Instruction \| Instruction` | 指令类型或实例 |

**示例**

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

触发特定的工作流。主要用于在自定义触发器中，当监听到特定自定义事件时触发对应的工作流。

**签名**

`trigger(workflow: Workflow, context: any)`

**参数**
| 参数 | 类型 | 描述 |
| --- | --- | --- |
| `workflow` | `WorkflowModel` | 要触发的工作流对象 |
| `context` | `object` | 触发时提供的上下文数据 |

:::info{title=提示}
`context` 目前是必填项，不提供的话该工作流不会触发。
:::

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

#### `resume()`

以特定的节点任务将停等的工作流恢复执行。

- 只有处在停等状态（`EXECUTION_STATUS.STARTED`）的工作流才能被恢复执行。
- 只有处在停等状态（`JOB_STATUS.PENDING`）的节点任务才能被恢复执行。

**签名**

`resume(job: JobModel)`

**参数**

| 参数  | 类型       | 描述             |
| ----- | ---------- | ---------------- |
| `job` | `JobModel` | 更新后的任务对象 |

:::info{title=提示}
传入的任务对象一般是更新后的对象，且通常会将 `status` 更新为非 `JOB_STATUS.PENDING` 的值，否则将继续停等。
:::

**示例**

详见[源码](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-manual/src/server/actions.ts#L99)。

### `Trigger`

触发器基类，用于扩展自定义触发器类型。

| 参数          | 类型                                                        | 说明                   |
| ------------- | ----------------------------------------------------------- | ---------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Trigger` | 构造函数               |
| `on?`         | `(workflow: WorkflowModel): void`                           | 开启工作流后的事件处理 |
| `off?`        | `(workflow: WorkflowModel): void`                           | 停用工作流后的事件处理 |

`on`/`off` 用于在工作流启用/停用时进行事件监听的注册/注销，传入的参数是对应触发器的工作流实例，可根据对应配置进行处理。部分触发器类型如果是已经在全局监听了事件的，也可以不用实现这两个方法。例如在定时触发器中，可以在 `on` 中注册定时器，`off` 中注销定时器。

### `Instruction`

指令类型基类，用于扩展自定义指令类型。

| 参数          | 类型                                                            | 说明                               |
| ------------- | --------------------------------------------------------------- | ---------------------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Instruction` | 构造函数                           |
| `run`         | `Runner`                                                        | 首次进入节点的执行逻辑             |
| `resume?`     | `Runner`                                                        | 在中断恢复执行后进入节点的执行逻辑 |
| `getScope?`   | `(node: FlowNodeModel, data: any, processor: Processor): any`   | 提供对应节点产生分支的局域变量内容 |

**相关类型**

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

`getScope` 可以参考[循环节点的实现](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-loop/src/server/LoopInstruction.ts#L83)，用于提供分支的局域变量内容。

### `EXECUTION_STATUS`

工作流执行计划状态的常量表，用于标识对应执行计划的当前状态。

| 常量名                          | 含义                 |
| ------------------------------- | -------------------- |
| `EXECUTION_STATUS.QUEUEING`     | 排队中               |
| `EXECUTION_STATUS.STARTED`      | 执行中               |
| `EXECUTION_STATUS.RESOLVED`     | 成功完成             |
| `EXECUTION_STATUS.FAILED`       | 失败                 |
| `EXECUTION_STATUS.ERROR`        | 执行错误             |
| `EXECUTION_STATUS.ABORTED`      | 已中断               |
| `EXECUTION_STATUS.CANCELED`     | 已取消               |
| `EXECUTION_STATUS.REJECTED`     | 已拒绝               |
| `EXECUTION_STATUS.RETRY_NEEDED` | 未成功执行，需要重试 |

除了前三种以外，其他都代表失败状态，但可以用于表述不同的失败原因。

### `JOB_STATUS`

工作流节点任务状态的常量表，用于标识对应节点任务的当前状态，节点产生的状态同时也会影响整个执行计划的状态。

| 常量名                    | 含义                                     |
| ------------------------- | ---------------------------------------- |
| `JOB_STATUS.PENDING`      | 停等：已执行到该节点，但指令要求挂起等待 |
| `JOB_STATUS.RESOLVED`     | 成功完成                                 |
| `JOB_STATUS.FAILED`       | 失败：该节点执行未能满足配置条件         |
| `JOB_STATUS.ERROR`        | 错误：该节点执行过程中发生未捕获的错误   |
| `JOB_STATUS.ABORTED`      | 终止：该节点在停等后被其他逻辑终止执行   |
| `JOB_STATUS.CANCELED`     | 取消：该节点在停等后被人为取消执行       |
| `JOB_STATUS.REJECTED`     | 拒绝：该节点在停等后被人为拒绝继续       |
| `JOB_STATUS.RETRY_NEEDED` | 未成功执行，需要重试                     |

## 客户端

客户端包结构可用的 API 如以下代码所示：

```ts
import PluginWorkflowClientV2, {
  Trigger,
  Instruction,
} from '@nocobase/plugin-workflow/client-v2';
```

### `PluginWorkflowClientV2`

工作流客户端插件类。通常通过 `this.app.pm.get('workflow')` 获取实例。

#### `registerTrigger()`

注册触发器类型对应的配置面板。

**签名**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger): void`

**参数**

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `type` | `string` | 触发器类型标识，与服务端注册的标识一致 |
| `trigger` | `typeof Trigger \| Trigger` | 触发器类型或实例 |

#### `registerInstruction()`

注册节点类型对应的配置面板。

**签名**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction): void`

**参数**

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `type` | `string` | 节点类型标识，与服务端注册的标识一致 |
| `instruction` | `typeof Instruction \| Instruction` | 节点类型或实例 |

#### `registerInstructionGroup()`

注册节点类型分组。NocoBase 默认提供 4 个节点类型分组：

* `'control'`：控制类
* `'collection'`：数据表操作类
* `'manual'`：人工处理类
* `'extended'`：其他扩展类

如果需要扩展其他分组，可以使用该方法注册。

**签名**

`registerInstructionGroup(type: string, group: { label: string }): void`

**参数**

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `type` | `string` | 节点分组标识 |
| `group` | `{ label: string }` | 分组信息，目前仅包含标题 |

**示例**

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

判断工作流是否为同步模式。

**签名**

`isWorkflowSync(workflow: object): boolean`

### `Trigger`

触发器基类，用于扩展自定义触发器类型。

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `title` | `string` | 触发器类型名称 |
| `description?` | `string` | 触发器类型描述 |
| `PresetFieldsetLoader?` | `LoaderOf` | 创建时的预设配置表单（懒加载） |
| `FieldsetLoader?` | `LoaderOf` | 触发器完整配置表单（懒加载） |
| `TriggerFieldsetLoader?` | `LoaderOf` | 手动执行时的输入表单（懒加载） |
| `validate` | `(config: Record<string, unknown>) => boolean` | 配置校验，返回 `true` 表示配置有效 |
| `createDefaultConfig?` | `() => Record<string, unknown>` | 提供默认配置值 |
| `useVariables?` | `(config, options?: UseVariableOptions) => VariableOption[] \| null` | 触发上下文数据的变量选项 |
| `getCreateModelMenuItem?` | `(args) => SubModelItem \| SubModelItem[] \| null` | 画布上创建子模型菜单项 |
| `useTempAssociationSource?` | `(config, workflow?) => TriggerTempAssociationSource \| null` | 提供临时关联数据源 |

**相关类型**

```ts
export type LoaderOf<P = {}> = () => Promise<{ default: ComponentType<P> }>;
```

- `useVariables` 如果没有设置，则代表该类型触发器不提供取值功能，在流程的节点中无法选取触发器的上下文数据。

### `Instruction`

指令基类，用于扩展自定义节点类型。

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `title` | `string` | 节点类型名称 |
| `type` | `string` | 节点类型标识 |
| `group` | `string` | 节点类型分组标识，可选：`'control'`/`'collection'`/`'manual'`/`'extended'` |
| `description?` | `string` | 节点类型描述 |
| `icon?` | `JSX.Element` | 节点图标 |
| `FieldsetLoader?` | `LoaderOf` | 节点配置抽屉表单（懒加载） |
| `PresetFieldsetLoader?` | `LoaderOf` | 创建时的预设配置表单（懒加载） |
| `ComponentLoader?` | `LoaderOf<{ data: any }>` | 画布上自定义节点渲染（懒加载），用于分支节点等需要特殊渲染的情况 |
| `branching?` | `boolean \| object \| ((config) => boolean \| object)` | 声明节点是否为分支节点 |
| `end?` | `boolean \| ((node) => boolean)` | 声明节点是否为终止节点 |
| `testable?` | `boolean` | 声明节点是否支持测试运行 |
| `createDefaultConfig?` | `() => object` | 提供默认配置值 |
| `useVariables?` | `(node, options?: UseVariableOptions) => VariableOption` | 节点提供变量选项的方法 |
| `useScopeVariables?` | `(node, options?) => VariableOption[] \| MetaTreeNode[]` | 节点提供分支局域变量选项的方法 |
| `isAvailable?` | `(ctx: NodeAvailableContext) => boolean` | 节点是否可用的判断方法 |
| `getCreateModelMenuItem?` | `({ node, workflow }) => SubModelItem \| null` | 画布上创建子模型菜单项 |
| `useTempAssociationSource?` | `(node) => TempAssociationSource \| null` | 提供临时关联数据源 |

**相关类型**

```ts
export type NodeAvailableContext = {
  engine: WorkflowPlugin;
  workflow: object;
  upstream: object;
  branchIndex: number;
};
```

- `useVariables` 如果没有设置，则代表该节点类型不提供取值功能，在流程的节点中无法选该类型节点的结果数据。如果结果值是单一的（不可选），则返回一个可以表达对应信息的静态内容即可（参考：[运算节点源码](https://github.com/nocobase/nocobase/blob/develop/packages/plugins/%40nocobase/plugin-workflow/src/client-v2/nodes/calculation.tsx)）。如果需要可选（如一个 Object 中的某个属性），则可以自定义对应的选择组件输出（参考：[查询数据节点源码](https://github.com/nocobase/nocobase/blob/develop/packages/plugins/%40nocobase/plugin-workflow/src/client-v2/nodes/query.tsx)）。
- `ComponentLoader` 节点自定义渲染组件，当默认节点渲染不满足时可以完全覆盖替代使用，进行自定义节点视图渲染。例如要针对分支类型的节点提供额外的分支渲染（参考：[条件节点源码](https://github.com/nocobase/nocobase/blob/develop/packages/plugins/%40nocobase/plugin-workflow/src/client-v2/nodes/condition.tsx)）。
- `isAvailable` 主要用于判断节点是否可以在当前环境中可以被使用（添加）。当前环境包括工作流插件实例、当前工作流、上游节点和当前分支索引等。

### 变量输入组件

工作流提供了一组变量输入组件，用于在节点/触发器配置表单中让用户选择工作流变量。这些组件都从 `@nocobase/plugin-workflow/client-v2` 导出。

#### `WorkflowVariableInput`

变量选择器，只能选择变量，不能在选择后继续输入。适用于需要精确选择某个变量值的场景。

```tsx
import { WorkflowVariableInput } from '@nocobase/plugin-workflow/client-v2';

<Form.Item name={['config', 'target']} label="Target">
  <WorkflowVariableInput />
</Form.Item>
```

**Props**

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `value?` | `string` | 变量路径值，如 `{{$jobsMapByNodeKey.xxx.field}}` |
| `onChange?` | `(value: string) => void` | 值变更回调 |
| `variableOptions?` | `UseWorkflowVariableOptions` | 变量过滤选项（类型过滤、深度等） |
| `disabled?` | `boolean` | 是否禁用 |
| `placeholder?` | `string` | 占位文本 |

#### `WorkflowVariableTextArea`

多行文本区域，支持在任意光标位置插入变量引用。适用于 HTTP Body、模板文本等自由文本场景。

```tsx
import { WorkflowVariableTextArea } from '@nocobase/plugin-workflow/client-v2';

<Form.Item name={['config', 'body']} label="Body">
  <WorkflowVariableTextArea autoSize={{ minRows: 5 }} />
</Form.Item>
```

**Props**

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `value?` | `string` | 文本值（可包含变量引用） |
| `onChange?` | `(value: string) => void` | 值变更回调 |
| `variableOptions?` | `UseWorkflowVariableOptions` | 变量过滤选项 |
| `delimiters?` | `readonly [string, string]` | 变量定界符，默认 `['{{', '}}']` |

继承 antd `TextArea` 的其他 Props（如 `autoSize`、`placeholder` 等）。

#### `WorkflowVariableJsonTextArea`

JSON 文本区域，支持插入变量引用。适用于需要输入 JSON 数据并混合变量的场景。

```tsx
import { WorkflowVariableJsonTextArea } from '@nocobase/plugin-workflow/client-v2';

<Form.Item name={['config', 'data']} label="Data">
  <WorkflowVariableJsonTextArea autoSize={{ minRows: 10 }} />
</Form.Item>
```

#### `WorkflowTypedVariableInput`

带类型切换的输入，可切换「常量」和「变量引用」两种模式。常量模式下支持 `string`、`number`、`boolean`、`date`、`object` 五种类型。

```tsx
import { WorkflowTypedVariableInput } from '@nocobase/plugin-workflow/client-v2';

<Form.Item name={['config', 'value']} label="Value">
  <WorkflowTypedVariableInput />
</Form.Item>
```

**Props**

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `variableOptions?` | `UseWorkflowVariableOptions` | 变量过滤选项 |

继承 `TypedVariableInput` 的其他 Props（排除内部使用的 `extraNodes`、`metaTree`、`namespaces`）。

#### `WorkflowVariableWrapper`

通用包装器，用于在不同场合下替换不同的输入组件。例如同一个字段在触发器节点配置和节点配置抽屉中需要不同的输入方式时，可以用此组件将原生输入包装为可切换变量模式的输入。

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

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `value?` | `TValue \| string \| null` | 当前值（常量值或变量路径字符串） |
| `onChange?` | `(value: TValue \| string \| null) => void` | 值变更回调 |
| `variableOptions?` | `UseWorkflowVariableOptions` | 变量过滤选项 |
| `render` | `(props: { value?, onChange? }) => ReactNode` | 渲染原生输入组件 |
| `clearValue?` | `TValue \| null` | 从变量模式切换回常量时的初始值，默认 `null` |

### 集合相关组件

工作流还提供了一组集合相关的辅助组件，从 `@nocobase/plugin-workflow/client-v2` 导出：

- `CollectionCascader` — 数据源感知的集合选择器（级联选择）
- `AppendsSelect` — 关联字段预加载选择器（树选择）
- `FieldsSelect` — 集合字段多选器
- `SortFieldsInput` — 排序字段输入
- `PaginationFields` — 分页参数表单项
