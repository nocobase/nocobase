# FlowModel vs React.Component

## Comparison of Basic Responsibilities

| Feature/Capability | `React.Component` | `FlowModel` |
| --- | --- | --- |
| Rendering Capability | Yes, the `render()` method generates UI | Yes, the `render()` method generates UI |
| State Management | Built-in `state` and `setState` | Uses `props`, but state management relies more on the model tree structure |
| Lifecycle | Yes, e.g., `componentDidMount` | Yes, e.g., `onInit`, `onMount`, `onUnmount` |
| Purpose | Building UI components | Building data-driven, flow-based, structured "model trees" |
| Data Structure | Component tree | Model tree (supports parent-child models, multi-instance Fork) |
| Child Components | Using JSX to nest components | Using `setSubModel`/`addSubModel` to explicitly set sub-models |
| Dynamic Behavior | Event binding, state updates drive UI | Registering/dispatching Flows, handling automatic flows |
| Persistence | No built-in mechanism | Supports persistence (e.g., `model.save()`) |
| Supports Fork (multiple renderings) | No (requires manual reuse) | Yes (`createFork` for multiple instantiations) |
| Engine Control | None | Yes, managed, registered, and loaded by `FlowEngine` |

## Lifecycle Comparison

| Lifecycle Hook | `React.Component` | `FlowModel` |
| --- | --- | --- |
| Initialization | `constructor`, `componentDidMount` | `onInit`, `onMount` |
| Unmounting | `componentWillUnmount` | `onUnmount` |
| Responding to Input | `componentDidUpdate` | `onBeforeAutoFlows`, `onAfterAutoFlows` |
| Error Handling | `componentDidCatch` | `onAutoFlowsError` |

## Construction Structure Comparison

**React:**

```tsx pure
class MyComponent extends React.Component {
  render() {
    return <div>Hello</div>;
  }
}
```

**FlowModel:**

```tsx pure
class HelloModel extends FlowModel {
  render() {
    return <div>Hello</div>;
  }
}
```

## Component Tree vs Model Tree

*   **React Component Tree**: A UI rendering tree formed by nested JSX at runtime.
*   **FlowModel Model Tree**: A logical structure tree managed by FlowEngine, which can be persisted, and allows dynamic registration and control of sub-models. Suitable for building page blocks, action flows, data models, etc.

## Special Features (FlowModel Specific)

| Function | Description |
| --- | --- |
| `registerFlow` | Register flow |
| `applyFlow` / `dispatchEvent` | Execute/trigger flow |
| `setSubModel` / `addSubModel` | Explicitly control the creation and binding of sub-models |
| `createFork` | Supports reusing a model's logic for multiple renderings (e.g., each row in a table) |
| `openFlowSettings` | Flow step settings |
| `save` / `saveStepParams()` | The model can be persisted and integrated with the backend |

## Summary

| Item | React.Component | FlowModel |
| --- | --- | --- |
| Suitable Scenarios | UI layer component organization | Data-driven flow and block management |
| Core Idea | Declarative UI | Model-driven structured flow |
| Management Method | React controls the lifecycle | FlowModel controls the model's lifecycle and structure |
| Advantages | Rich ecosystem and toolchain | Strongly structured, flows can be persisted, sub-models are controllable |

> FlowModel can be used complementarily with React: Use React for rendering within a FlowModel, while its lifecycle and structure are managed by FlowEngine.