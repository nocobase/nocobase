# 上下文体系概览

NocoBase 流引擎的上下文体系分为三层，分别对应不同的作用域，合理使用可实现服务、配置、数据的灵活共享与隔离，提升业务可维护性和可扩展性。

- **FlowEngineContext（全局上下文）**：全局唯一，所有模型、流都可访问，适用于注册全局服务、配置等。
- **FlowModelContext（模型上下文）**：用于模型树内部共享上下文，子模型自动代理父模型上下文，支持同名覆盖，适用于模型级别的逻辑和数据隔离。
- **FlowRuntimeContext（流运行时上下文）**：每次流执行时创建，贯穿整个流运行周期，适用于流中的数据传递、变量存储、运行状态记录等。支持 `mode: 'runtime' | 'settings'` 两种模式，分别对应运行态和配置态。

所有的 `FlowEngineContext`（全局上下文）、`FlowModelContext`（模型上下文）、`FlowRuntimeContext`（流运行时上下文）等，都是 `FlowContext` 的子类或实例。

---

## 🗂️ 层级结构图

```text
FlowEngineContext（全局上下文）
│
├── FlowModelContext（模型上下文）
│     ├── 子 FlowModelContext（子模型）
│     │     ├── FlowRuntimeContext（流运行时上下文）
│     │     └── FlowRuntimeContext（流运行时上下文）
│     └── FlowRuntimeContext（流运行时上下文）
│
├── FlowModelContext（模型上下文）
│     └── FlowRuntimeContext（流运行时上下文）
│
└── FlowModelContext（模型上下文）
      ├── 子 FlowModelContext（子模型）
      │     └── FlowRuntimeContext（流运行时上下文）
      └── FlowRuntimeContext（流运行时上下文）
```

- `FlowModelContext` 通过代理（delegate）机制可访问 `FlowEngineContext` 的属性和方法，实现全局能力共享。
- 子模型的 `FlowModelContext` 通过代理（delegate）机制可访问父模型的上下文（同步关系），支持同名覆盖。
- 异步父子模型不会建立代理（delegate）关系，避免状态污染。
- `FlowRuntimeContext` 总是通过代理（delegate）机制访问其对应的 `FlowModelContext`，但不会向上回传。

---

## 🧭 运行态与配置态（mode）

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

## 🤖 面向大模型的上下文信息：`ctx.getInfos()`

在某些场景下（例如 JS*Model 的 RunJS 代码编辑、AI coding），需要让“调用方”在不执行代码的前提下了解：当前 `ctx` 下有哪些属性/方法、它们的用途、参数、示例、以及文档链接。

为此，`FlowContext` 提供了异步 API：`await ctx.getInfos(options?)`，用于返回**静态可序列化**的上下文信息（不包含函数）。

你可以通过以下方式为上下文补充“面向补全/大模型”的信息：

- `ctx.defineMethod(name, fn, info?)`：为方法补充描述、参数、示例、补全插入、文档链接等；
- `ctx.defineProperty(key, { meta?, info? })`：其中 `meta` 面向变量选择器 UI（`getPropertyMetaTree`），`info` 面向 `getInfos()`/补全/大模型（不影响变量选择器 UI）。

如果你需要在运行时通过“变量表达式路径字符串”取值（例如来自配置/用户输入），可以使用：`await ctx.getVar('ctx.xxx')`。

### 返回结构

- `apis`: `{ [name]: ApiInfo }`（合并属性与方法信息）
- `envs`: `{ popup?, block?, flowModel?, resource?, record? }`（面向大模型/提示词的“环境信息节点树”）
  - 节点结构：`{ description?, getVar?, value?, properties? }`
    - `getVar`：可直接用于 `await ctx.getVar(getVar)` 的表达式字符串（推荐以 `ctx.` 开头）
    - `value`：已解析/可序列化的静态值（可选，仅在能推断到时返回；建议保持小体积）
    - `properties`：子节点（用于表达 `popup.resource.xxx` 等层级）

示例（简化）：

```json
{
  "apis": {
    "runAction": {
      "description": "Execute a resource action.",
      "params": [{ "name": "actionName", "type": "string" }],
      "returns": { "type": "Promise<any>" }
    }
  },
  "envs": {
    "resource": {
      "description": "Resource information",
      "getVar": "ctx.view.inputArgs",
      "properties": {
        "collectionName": { "getVar": "ctx.view.inputArgs.collectionName", "value": "users" },
        "dataSourceKey": { "getVar": "ctx.view.inputArgs.dataSourceKey", "value": "main" },
        "associationName": { "getVar": "ctx.view.inputArgs.associationName", "value": "posts" }
      }
    },
    "popup": {
      "description": "Current popup information",
      "getVar": "ctx.popup",
      "properties": {
        "uid": { "getVar": "ctx.popup.uid", "value": "p1" },
        "record": { "getVar": "ctx.popup.record" }
      }
    }
  }
}
```

其中 `ApiInfo` 至少可包含（均为可选）：

- `title` / `type` / `interface`
- `description` / `examples`
- `completion.insertText`（用于编辑器补全插入）
- `ref`（支持 `string | { url: string; title?: string }`）
- `params` / `returns`（JSDoc-like）
- `disabled` / `disabledReason`（已计算后的静态值）

### 常用参数

- `maxDepth`：属性展开最大层级（默认 3）
- `path: string | string[]`：剪裁，只输出指定路径下的能力信息（适合减少 token）
- `version`：RunJS 文档版本（默认 `v1`）

### 计算/过滤规则

- `hidden`：支持函数/async 函数，会基于运行时 `ctx` 计算并过滤隐藏节点
- `disabled/disabledReason`：支持函数/async 函数，会基于运行时 `ctx` 计算并返回静态值
- 以下划线 `_` 开头的方法/属性会被视为私有成员，不会出现在 `getInfos()` 的输出中
