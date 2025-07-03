# 上下文体系概览

NocoBase 流引擎的上下文体系分为四层，分别对应全局、模型、流运行时和流步骤的不同作用域。合理使用这些上下文，可以实现服务、配置、数据的灵活共享与隔离，提升业务开发的可维护性和扩展性。

- **FlowEngineContext**：全局上下文，所有 Model 和 Flow 都可访问，用于注册和共享全局服务、配置等。
- **FlowModelContext**：模型树内共享与复用，子 Model 会自动继承父 Model 的上下文属性，若有同名属性则以子 Model 的为准，实现灵活覆盖和本地控制。
- **FlowRuntimeContext**：每次流执行期间创建的上下文，贯穿整个流运行生命周期，负责流级别的数据、状态和共享变量。
- **FlowStepContext**：每个流步骤执行时创建的上下文，仅在当前步骤 handler 执行期间有效，通常包含 step 入参、步骤级变量等。每个 FlowRuntimeContext 会为每个步骤生成对应的 FlowStepContext。

---

## 层级结构图

```
FlowEngineContext（全局上下文）
│
├── FlowModelContext（模型上下文） 1
│     ├── 子 FlowModelContext（子模型） 1-1 （继承父 FlowModelContext 1 的上下文）
│     │     ├── FlowRuntimeContext（流运行时上下文） 1-1-1
│     │     │     ├── FlowStepContext（步骤上下文） 1-1-1-a
│     │     │     └── FlowStepContext（步骤上下文） 1-1-1-b
│     │     └── FlowRuntimeContext（流运行时上下文） 1-1-2
│     │           └── FlowStepContext（步骤上下文） 1-1-2-a
│     └── FlowRuntimeContext（流运行时上下文） 1-1
│           ├── FlowStepContext（步骤上下文） 1-1-a
│           └── FlowStepContext（步骤上下文） 1-1-b
│
├── FlowModelContext（模型上下文） 2
│     └── FlowRuntimeContext（流运行时上下文） 2-1
│           └── FlowStepContext（步骤上下文） 2-1-a
│
└── FlowModelContext（模型上下文） 3
      ├── 子 FlowModelContext（子模型） 3-1 （继承父 FlowModelContext 3 的上下文）
      │     └── FlowRuntimeContext（流运行时上下文） 3-1-1
      │           └── FlowStepContext（步骤上下文） 3-1-1-a
      └── FlowRuntimeContext（流运行时上下文） 3-1
            └── FlowStepContext（步骤上下文） 3-1-a
```
