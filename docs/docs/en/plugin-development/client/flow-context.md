# Context System Overview

The NocoBase FlowEngine context system is divided into three layers, each corresponding to a different scope. Proper use enables flexible sharing and isolation of services, configurations, and data, enhancing business maintainability and scalability.

- **FlowEngineContext (Global Context)**: Globally unique and accessible by all models and flows. It is suitable for registering global services, configurations, etc.
- **FlowModelContext (Model Context)**: Used for sharing context within a model tree. Child models automatically delegate to the parent model's context, supporting overriding with the same name. It is suitable for model-level logic and data isolation.
- **FlowRuntimeContext (Flow Runtime Context)**: Created each time a flow is executed and persists throughout the entire flow execution cycle. It is suitable for data passing, variable storage, and recording runtime status within the flow. It supports two modes: `mode: 'runtime' | 'settings'`, corresponding to runtime and settings states, respectively.

## 🗂️ Hierarchy Diagram

```text
FlowEngineContext (Global Context)
│
├── FlowModelContext (Model Context)
│     ├── Child FlowModelContext (Child Model)
│     │     ├── FlowRuntimeContext (Flow Runtime Context)
│     │     └── FlowRuntimeContext (Flow Runtime Context)
│     └── FlowRuntimeContext (Flow Runtime Context)
│
├── FlowModelContext (Model Context)
│     └── FlowRuntimeContext (Flow Runtime Context)
│
└── FlowModelContext (Model Context)
      ├── Child FlowModelContext (Child Model)
      │     └── FlowRuntimeContext (Flow Runtime Context)
      └── FlowRuntimeContext (Flow Runtime Context)
```

- `FlowModelContext` can access the properties and methods of `FlowEngineContext` through a delegation mechanism, enabling the sharing of global capabilities.
- A child model's `FlowModelContext` can access the parent model's context (synchronous relationship) through a delegation mechanism and supports overriding with the same name.
- Asynchronous parent-child models do not establish a delegation relationship to avoid state pollution.
- `FlowRuntimeContext` always accesses its corresponding `FlowModelContext` through a delegation mechanism but does not pass data back up.