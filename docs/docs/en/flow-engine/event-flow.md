# Event Flow

In FlowEngine, all interface components are **event-driven**.
The behavior, interaction, and data changes of components are triggered by events and executed through a flow.

## Static Flow vs. Dynamic Flow

In FlowEngine, flows can be divided into two types:

### **1. Static Flow**

- Defined by developers in code;
- Acts on **all instances of a Model class**;
- Commonly used to handle the general logic of a Model class;

### **2. Dynamic Flow**

- Configured by users on the interface;
- Only takes effect on a specific instance;
- Commonly used for personalized behavior in specific scenarios;

In short: **A static flow is a logic template defined on a class, while a dynamic flow is personalized logic defined on an instance.**

## Linkage Rules vs. Dynamic Flow

In the FlowEngine configuration system, there are two ways to implement event logic:

### **1. Linkage Rules**

- Are **encapsulations of built-in event flow steps**;
- Simpler to configure and more semantic;
- Essentially, they are still a simplified form of an **event flow (Flow)**.

### **2. Dynamic Flow**

- Complete Flow configuration capabilities;
- Customizable:
  - **Trigger (on)**: Defines when to trigger;
  - **Execution steps (steps)**: Defines the logic to be executed;
- Suitable for more complex and flexible business logic.

Therefore, **Linkage Rules ≈ Simplified Event Flow**, and their core mechanisms are consistent.

## Consistency of FlowAction

Both **Linkage Rules** and **Event Flows** should use the same set of **FlowActions**.
That is to say:

- **FlowAction** defines the actions that can be called by a Flow;
- Both share one action system, rather than implementing two separate ones;
- This ensures logic reuse and consistent extension.

## Conceptual Hierarchy

Conceptually, the core abstract relationship of FlowModel is as follows:

```bash
FlowModel
 └── FlowDefinition
      ├── FlowEventDefinition
      │     ├── Global Events
      │     └── Local Events
      └── FlowActionDefinition
            ├── Global Actions
            └── Local Actions
```

### Hierarchy Description

- **FlowModel**
  Represents a model entity with configurable and executable flow logic.

- **FlowDefinition**
  Defines a complete set of flow logic (including trigger conditions and execution steps).

- **FlowEventDefinition**
  Defines the trigger source of the flow, including:
  - **Global events**: such as application startup, data loading completion;
  - **Local events**: such as field changes, button clicks.

- **FlowActionDefinition**
  Defines the executable actions of the flow, including:
  - **Global actions**: such as refreshing the page, global notifications;
  - **Local actions**: such as modifying field values, switching component states.

## Summary

| Concept | Purpose | Scope |
|------|------|-----------|
| **Static Flow** | Flow logic defined in code | All instances of XXModel |
| **Dynamic Flow** | Flow logic defined on the interface | A single FlowModel instance |
| **FlowEvent** | Defines the trigger (when to trigger) | Global or local |
| **FlowAction** | Defines the execution logic | Global or local |
| **Linkage Rule** | Simplified encapsulation of event flow steps | Block, Action level |