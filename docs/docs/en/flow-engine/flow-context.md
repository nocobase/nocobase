# Context System Overview

The NocoBase FlowEngine's context system is divided into three layers, each corresponding to a different scope. Proper use can achieve flexible sharing and isolation of services, configurations, and data, improving business maintainability and scalability.

- **FlowEngineContext (Global Context)**: Globally unique, accessible by all models and flows, suitable for registering global services, configurations, etc.
- **FlowModelContext (Model Context)**: Used for sharing context within a model tree. Sub-models automatically delegate to the parent model's context, supporting same-name overrides. Suitable for model-level logic and data isolation.
- **FlowRuntimeContext (Flow Runtime Context)**: Created each time a flow is executed, persisting throughout the entire flow execution cycle. Suitable for data passing, variable storage, and recording runtime status within the flow. Supports two modes: `mode: 'runtime' | 'settings'`, corresponding to runtime mode and settings mode respectively.

All `FlowEngineContext` (Global Context), `FlowModelContext` (Model Context), `FlowRuntimeContext` (Flow Runtime Context), etc., are subclasses or instances of `FlowContext`.

---

## 🗂️ Hierarchy Diagram

```text
FlowEngineContext (Global Context)
│
├── FlowModelContext (Model Context)
│     ├── Sub FlowModelContext (Sub-model)
│     │     ├── FlowRuntimeContext (Flow Runtime Context)
│     │     └── FlowRuntimeContext (Flow Runtime Context)
│     └── FlowRuntimeContext (Flow Runtime Context)
│
├── FlowModelContext (Model Context)
│     └── FlowRuntimeContext (Flow Runtime Context)
│
└── FlowModelContext (Model Context)
      ├── Sub FlowModelContext (Sub-model)
      │     └── FlowRuntimeContext (Flow Runtime Context)
      └── FlowRuntimeContext (Flow Runtime Context)
```

- `FlowModelContext` can access the properties and methods of `FlowEngineContext` through a delegate mechanism, enabling the sharing of global capabilities.
- A sub-model's `FlowModelContext` can access the parent model's context (synchronous relationship) through a delegate mechanism, supporting same-name overrides.
- Asynchronous parent-child models do not establish a delegate relationship to avoid state pollution.
- `FlowRuntimeContext` always accesses its corresponding `FlowModelContext` through a delegate mechanism, but it does not propagate changes upwards.

---

## 🧭 Runtime and Settings Mode (mode)

`FlowRuntimeContext` supports two modes, distinguished by the `mode` parameter:

- `mode: 'runtime'` (Runtime mode): Used during the actual execution phase of the flow. Properties and methods return real data. For example:
  ```js
  console.log(runtimeCtx.steps.step1.result); // 42
  ```

- `mode: 'settings'` (Settings mode): Used during the flow design and configuration phase. Property access returns a variable template string, facilitating expression and variable selection. For example:
  ```js
  console.log(settingsCtx.steps.step1.result); // '{{ ctx.steps.step1.result }}'
  ```

This dual-mode design ensures data availability at runtime and facilitates variable referencing and expression generation during configuration, enhancing the flexibility and usability of the FlowEngine.