# FlowRuntimeContext

> FlowRuntimeContext 继承自 FlowContext，详见 [FlowContext](./flow-context)

`FlowRuntimeContext` 是流引擎在每次执行流（Flow）时创建的运行时上下文对象，贯穿整个流执行周期，负责管理流程级别的数据、状态、步骤结果和日志等。通过 `ctx`，可以在各个步骤中访问和操作本次流程实例的上下文，实现流程控制、数据传递和复杂业务编排。

---

## mode: 'runtime' | 'settings'

`FlowRuntimeContext` 支持两种模式，通过 `mode` 参数区分：

- `mode: 'runtime'`（运行态）：用于流实际执行阶段，属性和方法返回真实数据。例如：
  ```js
  console.log(runtimeCtx.steps.step1.result); // 42
  ```
- `mode: 'settings'`（配置态）：用于流设计和配置阶段，属性访问返回变量模板字符串，便于表达式和变量选择。例如：
  ```js
  console.log(settingsCtx.steps.step1.result); // '{{ ctx.steps.step1.result }}'
  ```

这种双模式设计，既保证了运行时的数据可用性，也方便了配置时的变量引用和表达式生成，提升了流引擎的灵活性和易用性。

---

## 在 uiSchema 中使用 ctx 的注意事项

- **uiSchema 主要用于配置 params**：uiSchema 用于描述参数（params）的结构、表单、校验等，最终生成的 params 会传递给 handler 进行业务处理。
- **settings 模式下 ctx 变量为字符串模板**：在 uiSchema 设计阶段（settings 模式），ctx 的所有属性（如 runId、steps、inputArgs 等）都是字符串模板。例如：
  ```js
  console.log(settingsCtx.steps.step1.result); // '{{ ctx.steps.step1.result }}'
  ```
- **变量引用为字符串模板**：在 uiSchema 的表达式、默认值、联动条件等地方，使用 `{{ ctx.xxx }}` 形式引用流程变量，实现动态表单和参数配置。
- **不要在 uiSchema 里直接依赖真实数据**：settings 模式下 ctx 仅用于变量占位和表达式生成，不能获取到运行时的实际值。实际值只会在 handler（运行时）中通过 params 获取和处理。
- **典型用法**：在 uiSchema 的表达式、默认值、联动条件等地方，使用 `{{ ctx.xxx }}` 形式引用流程变量，实现动态表单和参数配置。

**总结**：  
uiSchema 里 ctx 只用于变量引用和表达式生成，所有 ctx 变量都是字符串模板，最终会在流程运行时由 handler 通过 params 获取真实数据。不要在 uiSchema 里依赖 ctx 的实际值。

---

## 代理（delegate）机制说明

- `FlowRuntimeContext` 通过代理（delegate）机制可访问其对应的 `FlowModelContext` 的属性和方法，实现模型级别的服务、配置、数据共享。
- 代理链可多层嵌套，支持复杂模型树结构下的上下文访问。
- 代理仅单向建立，`FlowRuntimeContext` 不会向上回传或影响 `FlowModelContext`。

---

## 生命周期与作用范围

- 每次通过 `model.applyFlow('flowKey', inputArgs)` 或 `model.dispatchEvent('eventName', inputArgs)` 执行流时，都会创建一个新的 `FlowRuntimeContext`。
- 该 context 仅在本次流执行的生命周期内有效，流执行结束后自动销毁。
- 在整个流的所有步骤中，`FlowRuntimeContext` 保持唯一，负责流程级别的数据、状态和共享变量。
- 每个步骤执行时，可通过 `ctx.currentStep` 访问当前步骤上下文。

---

## 主要属性与方法

| 属性/方法         | 说明                                                                                  |
|------------------|---------------------------------------------------------------------------------------|
| `ctx.runId`      | 本次流执行的唯一标识，便于日志追踪和问题排查。每个 Flow 实例应有唯一的 runId。           |
| `ctx.flowKey`    | 当前执行的流程 key。                                                                   |
| `ctx.model`      | 当前流关联的数据模型实例，通常用于在流步骤中访问和操作业务数据。                        |
| `ctx.exit()`     | 立即终止整个流的执行，后续步骤不再执行。适用于遇到致命错误或业务条件不满足时主动中断流。|
| `ctx.logger`     | 日志记录工具，支持 `info`、`warn`、`error`、`debug` 等方法。用于输出调试信息和业务日志。|
| `ctx.steps`      | 存储每个步骤的详细信息，结构为 `{ 步骤名: { params, uiSchema, result } }`。             |
| `ctx.inputArgs`  | 流入口参数，执行 flow 时传入的参数对象。                                               |

---

## 常见场景示例

### 1. 终止流

当遇到不可恢复的错误或业务条件不满足时，可调用 `ctx.exit()` 立即终止流。

```ts
async handler(ctx, params) {
  if (params.shouldExit) {
    ctx.exit();
  }
  // ...其他逻辑...
}
```

### 2. 访问步骤参数、结果和 UI 配置

通过 `ctx.steps` 可以方便地获取任意步骤的参数、结果和 uiSchema，实现步骤间的数据依赖和 UI 组合。

```ts
// 访问 step1 的参数、uiSchema 和结果
const { params, uiSchema, result } = ctx.steps.step1;
```

### 3. 访问当前步骤

在 handler 或 UI 层可直接访问当前步骤的上下文：

```ts
const { stepKey, params, uiSchema, result } = ctx.currentStep;
```

### 4. 日志记录示例

日志记录有助于流调试和问题追踪。推荐在关键步骤、异常处理等场景下使用。

```ts
ctx.logger.info('步骤开始', { step: ctx.currentStep.stepKey, params: ctx.currentStep.params });
ctx.logger.error('发生错误', error);
```

### 5. 在 uiSchema 组件中使用

```ts
import { useFlowSettingsContext } from '@nocobase/flow-engine';

function MyComponent() {
  const ctx = useFlowSettingsContext();
  ctx.getPropertyMetaTree();

  console.log(ctx.runId); // '{{ ctx.runId }}'
}
```

### 6. ctx 字符串变量示例

在 uiSchema 配置参数时，ctx 变量会以字符串模板的形式存在，实际运行时会被替换为真实值。常见用法如下：

```ts
{
  steps: {
    step1: {
      uiSchema: {
        runId: {
          'x-component': 'Input', // 表单中展示 runId 字段
        },
      },
      defaultParams: {
        runId: '{{ctx.runId}}', // 配置阶段为字符串模板
      },
      handler(ctx, params) {
        // 运行时 params.runId 会被替换为实际的 runId，如 'a3afl8...'
        console.log(params.runId); // 例如 'a3afl8...'
      }
    },
  }
}
```

**说明：**
- 在 `uiSchema` 阶段，`runId` 字段的默认值是字符串模板 `'{{ctx.runId}}'`，用于占位和表达式引用。
- 在流程实际运行时（handler 执行时），`params.runId` 会自动被替换为当前流程实例的真实 runId。
- 这种机制适用于所有 ctx 变量（如 `ctx.steps.step1.result`、`ctx.inputArgs.xxx` 等），便于在表单、参数、联动等场景下灵活引用流程上下文数据。

> 提示：`{{ctx.xxx}}` 在 uiSchema（settings 模式）中仅作为变量占位符，实际数据会在 handler（runtime 模式）中自动解析和注入。


### 7. 自定义 FlowRuntimeContext

```ts
class MyModel extends FlowModel {
  createRuntimeContext({ model, flowKey }) {
    return new FlowRuntimeContext(this, { mode, flowKey });
  }

  applyFlow(flowKey, inputArgs) {
    const ctx = this.createRuntimeContext({ mode: 'runtime', flowKey });
  }
}
```

uiSchema 里使用

```ts
function useFlowSettingsContext() {
  // ...coding
  return model.createRuntimeContext({ mode: 'settings', flowKey });
}

function MyComponent() {
  const ctx = useFlowSettingsContext();
  ctx.getPropertyMetaTree();

  console.log(ctx.runId); // '{{ ctx.runId }}'
}
```
