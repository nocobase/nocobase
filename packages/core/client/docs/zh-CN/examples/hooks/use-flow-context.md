# useFlowContext()

`useFlowContext()` 是 NocoBase 流引擎中用于获取当前流上下文实例的 Hook。它能够让你在任意支持的 React 组件中，方便地访问当前流的上下文对象（如全局上下文、模型上下文、流运行时上下文、流配置态上下文等），从而获取流程数据、操作方法、视图控制等能力。

---

## FlowContext 🗂️ 层级结构图

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

---

## 使用场景

不同层级下，`useFlowContext()` 获取到的上下文类型会有所不同，常见场景如下：

### 1. 在 FlowModel.render() 内渲染的 React 组件

此时 `useFlowContext()` 获取的是当前模型的 `FlowModelContext` 实例，可用于访问模型数据、操作模型方法等。

```ts
const ctx = useFlowContext<FlowModelContext>();
```

### 2. 在 FlowStep.uiSchema 内渲染的 React 组件

此时 `useFlowContext()` 获取的是配置态的 `FlowRuntimeContext` 实例，适合访问和操作当前流程步骤的配置态的上下文。
注意：运行时的 FlowRuntimeContext<'runtime'> 只在 FlowStep.handler 里使用，没有 Hook 方法。

```ts
type FlowSettingsContext = FlowRuntimeContext<'settings'>;
const ctx = useFlowContext<FlowSettingsContext>();
```

### 3. 在非 Flow 体系下使用

如果在流程体系外部调用，`useFlowContext()` 获取的是全局的 `FlowEngineContext` 实例。

```ts
const ctx = useFlowContext<FlowEngineContext>();
```
