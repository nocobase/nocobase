# FlowDefinition

`FlowDefinition` 是 NocoBase 流引擎中用于描述和注册流（Flow）的核心定义对象。它用于定义流的唯一标识（`key`）、各个步骤（`steps`）、事件触发条件、参数配置及处理逻辑，是实现流自动化和业务编排的基础。

---

## 核心结构

```ts
interface FlowDefinition {
  key: string; // 流唯一标识
  on?: { event: string }; // 可选：事件触发配置
  auto?: boolean; // 可选：是否自动运行
  steps: Record<string, StepDefinition>; // 流步骤定义
}

interface StepDefinition {
  use?: string; // 可选：引用已注册的全局 Action
  defaultParams?: any; // 默认参数
  uiSchema?: any; // 可选：用于 FlowSettings 配置界面
  handler?: (ctx: any, params: any) => Promise<any>; // 可选：步骤处理函数
}
```

---

## 定义流方式

### 函数式定义（适合简单流）

结构清晰、类型推断友好，推荐用于大多数场景。

```ts
type MyFlowSteps = {
  step1: { name: string };
  step2: { age: number };
};

const myFlow = defineFlow<MyFlowSteps>({
  key: 'myFlow',
  on: { event: 'user.created' }, // 监听 user.created 事件自动触发
  steps: {
    step1: {
      defaultParams: {},
      async handler(ctx, params) {
        // 步骤 1 的处理逻辑
        // 例如：console.log(params.name);
      }
    },
    step2: {
      uiSchema: {}, // 可用于 UI 配置
      defaultParams: {},
      async handler(ctx, params) {
        // 步骤 2 的处理逻辑
        // 例如：console.log(params.age);
      }
    },
  },
});

MyFlowModel.registerFlow(myFlow); // 注册流
```

---

### 类式定义（适合复杂流）

当流较复杂、需要继承或拆分逻辑时，推荐使用类定义方式。

```ts
class MyFlowDefinition implements FlowDefinition {
  key = 'MyFlowDefinition';

  steps = {
    step1: {
      use: 'globalAction', // 复用全局已注册 Action
      defaultParams: {},
    },
    step2: {
      defaultParams: {},
      async handler(ctx, params) {
        // 步骤 2 的处理逻辑
      }
    },
    step3: {
      uiSchema: {},
      defaultParams: {},
      async handler(ctx, params) {
        // 步骤 3 的处理逻辑
      }
    },
  };
}

MyFlowModel.registerFlow(new MyFlowDefinition());
```

如需扩展流执行上下文、步骤参数结构、UI 配置展示等，可以进一步封装自定义工具函数或继承 `FlowDefinition`。

```ts
// 示例：扩展 FlowDefinition 和 FlowModel

// 自定义流定义，继承 FlowDefinition
class TableColumnFlowDefinition implements FlowDefinition {
  baseSteps = {};
  // 可以在此扩展更多自定义属性或方法
}

// 自定义模型，继承 FlowModel
class TableColumnFlowModel extends FlowModel {}

// 注册流定义到模型
TableColumnFlowModel.registerFlow(new TableColumnFlowDefinition());

// 进一步继承模型，实现更细粒度的定制
class SelectTableColumnFlowModel extends TableColumnFlowModel {}

// 注册带有额外步骤的流定义
SelectTableColumnFlowModel.registerFlow(
  new TableColumnFlowDefinition({
    otherSteps: {}
    // 可以传递更多自定义步骤
  })
);
```

---

## 模型中的流执行

一个模型（`FlowModel`）可以注册多个不同的流（`FlowDefinition`）。在执行流时，可以通过 `stepParams` 为每个步骤传参，实现灵活定制。

### 1. 配置步骤参数

在模型实例化时配置各步骤的参数，或使用 `model.setStepParams(...)` 动态设置：

```ts
type MyFlows = {
  myFlow: MyFlowSteps;
};

const myModel = new MyFlowModel<MyFlows>({
  stepParams: {
    myFlow: {
      step1: { name: 'Tao Tao' }, // 给 step1 传递参数
      step2: { age: 6 },          // 给 step2 传递参数
    },
  },
});

// 动态设置步骤参数（可选）
myModel.setStepParams('myFlow', 'step1', { name: '小明' });
```

### 2. 执行流

```ts
await myModel.applyFlow('myFlow'); // 主动执行指定流
myModel.dispatchEvent('user.created'); // 分发事件触发流（如流配置了 on.event）
await myModel.applyAutoFlows(); // 执行所有 auto=true 的流
```

---

## 速查表

### FlowDefinition 配置速查表

| 字段          | 类型                               | 说明                                 |
| ----------- | -------------------------------- | ---------------------------------- |
| `key`       | `string`                         | 流唯一标识，必须配置                        |
| `on`        | `{ event: string }`              | （可选）事件触发配置                         |
| `auto`      | `boolean`                        | （可选）是否在 `applyAutoFlows()` 中自动执行流 |
| `steps`     | `Record<string, StepDefinition>` | 步骤集合，键为步骤名，值为步骤定义                  |

### StepDefinition 配置速查表

| 字段              | 类型                                     | 说明                                    |
| --------------- | -------------------------------------- | ------------------------------------- |
| `use`           | `string`                               | （可选）引用已注册的全局 Action                   |
| `defaultParams` | `any`                                  | 步骤的默认参数                               |
| `uiSchema`      | `any`                                  | （可选）用于 FlowSettings UI 渲染             |
| `handler`       | `(ctx, params) => Promise<any>` | （可选）步骤执行逻辑，若未定义则使用 `use` 指定的全局 Action |

---
