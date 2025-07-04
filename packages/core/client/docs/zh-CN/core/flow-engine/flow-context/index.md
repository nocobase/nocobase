# 上下文体系概览

NocoBase 流引擎的上下文体系分为三层，分别对应不同的作用域，合理使用可实现服务、配置、数据的灵活共享与隔离，提升业务可维护性和可扩展性。

- **FlowEngineContext（全局上下文）**：全局唯一，所有模型、流都可访问，适用于注册全局服务、配置等。
- **FlowModelContext（模型上下文）**：用于模型树内部共享上下文，子模型自动代理父模型上下文，支持同名覆盖，适用于模型级别的逻辑和数据隔离。
- **FlowRuntimeContext（流运行时上下文）**：每次流执行时创建，贯穿整个流运行周期，适用于流中的数据传递、变量存储、运行状态记录等。

所有的 `FlowEngineContext`（全局上下文）、`FlowModelContext`（模型上下文）、`FlowRuntimeContext`（流运行时上下文）等，都是 `FlowContext` 的子类或实例。`FlowContext` 更多说明详见 [FlowContext](./flow-context/flow-context)

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
