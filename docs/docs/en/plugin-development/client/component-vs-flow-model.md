---
title: "Component vs FlowModel"
description: "NocoBase development selection guide: when to use plain React components, when to use FlowModel, capability differences, lifecycle comparison, and scenario selection."
keywords: "Component,FlowModel,selection guide,React component,visual configuration,model tree,NocoBase"
---

# Component vs FlowModel

In NocoBase plugin development, there are two approaches for building frontend UI: **plain React components** and **[FlowModel](../../flow-engine/index.md)**. They are not alternatives to each other — FlowModel is a layer of encapsulation on top of React components that adds visual configuration capabilities.

In general, you don't need to deliberate too long. Ask yourself one question:

> **Does this component need to appear in NocoBase's "Add Block / Field / Action" menu, allowing users to visually configure it on the interface?**

- **No** → Use a plain React component — standard React development
- **Yes** → Wrap it with FlowModel

## Default Approach: React Components

Plain React components are sufficient for most plugin scenarios. For example:

- Registering a standalone page (plugin settings page, custom route page)
- Building a modal, form, list, or other internal component
- Encapsulating a utility UI component

In these scenarios, write components with React + Antd, use `useFlowContext()` to access NocoBase's context capabilities (making requests, i18n, etc.) — no different from regular frontend development.

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function MySettingsPage() {
  const ctx = useFlowContext();

  return (
    <div>
      <h2>{ctx.t('Plugin settings')}</h2>
      {/* Plain React component, no FlowModel needed */}
    </div>
  );
}
```

See detailed usage at [Component Development](./component/index.md).

## When to Use FlowModel

Use FlowModel when your component needs to meet the following conditions:

1. **Appears in menus**: Users need to add it through the "Add Block", "Add Field", or "Add Action" menus
2. **Supports visual configuration**: Users can click on configuration options in the interface to modify the component's properties (e.g., changing the title, toggling display mode)
3. **Configuration needs to be persisted**: User configurations need to be saved and retained when the page is reopened

In short, FlowModel solves the problem of "making components configurable and persistable". If your component doesn't need these capabilities, you don't need it.

## The Relationship Between the Two

FlowModel is not meant to "replace" React components. It is a layer of abstraction on top of React components:

```
React component: responsible for rendering UI
    ↓ wrapping
FlowModel: manages props sources, configuration panels, configuration persistence
```

The `render()` method of a FlowModel contains regular React code. The difference is: a plain component's props are hardcoded or passed from a parent component, while a FlowModel's props are dynamically generated through Flows (configuration processes).

In practice, the two are quite similar in basic structure:

```tsx pure
// React component
class MyComponent extends React.Component {
  render() {
    return <div>Hello</div>;
  }
}

// FlowModel
class HelloModel extends FlowModel {
  render() {
    return <div>Hello</div>;
  }
}
```

However, they are managed in completely different ways. React components rely on JSX nesting to form a **component tree** — this is the runtime UI rendering tree. FlowModel, on the other hand, is managed by [FlowEngine](../../flow-engine/index.md), forming a **model tree** — a persistable, dynamically registrable logical structure tree that explicitly controls parent-child relationships through `setSubModel` / `addSubModel`, suitable for building structures that require configuration management such as page blocks, action flows, and data models.

## Capability Comparison

A more technical view of the differences:

| Capability | React Component | FlowModel |
| --- | --- | --- |
| Render UI | `render()` | `render()` |
| State management | Built-in `state` / `setState` | Managed through `props` and model tree structure |
| Lifecycle | `constructor`, `componentDidMount`, `componentWillUnmount` | `onInit`, `onMount`, `onUnmount` |
| Respond to input changes | `componentDidUpdate` | `onBeforeAutoFlows`, `onAfterAutoFlows` |
| Error handling | `componentDidCatch` | `onAutoFlowsError` |
| Child components | JSX nesting | `setSubModel` / `addSubModel` to explicitly set sub-models |
| Dynamic behavior | Event binding, state updates | Register and dispatch Flows |
| Persistence | No built-in mechanism | `model.save()`, etc., integrated with the backend |
| Multi-instance reuse | Manual handling required | `createFork` — e.g., for each row in a table |
| Engine management | None | Centrally registered, loaded, and managed by FlowEngine |

If you're familiar with React's lifecycle, FlowModel's lifecycle maps easily — `onInit` corresponds to `constructor`, `onMount` corresponds to `componentDidMount`, `onUnmount` corresponds to `componentWillUnmount`.

Additionally, FlowModel provides capabilities that React components don't have:

- **`registerFlow`** — Register a Flow to define configuration processes
- **`applyFlow` / `dispatchEvent`** — Execute or trigger a Flow
- **`openFlowSettings`** — Open the settings panel for a Flow step
- **`save` / `saveStepParams()`** — Persist model configuration
- **`createFork`** — Reuse one model logic for rendering multiple times (e.g., each row in a table)

These capabilities form the foundation for supporting the "visual configuration" experience. If your scenario doesn't involve visual configuration, you don't need to worry about them. See detailed usage at [FlowEngine Complete Documentation](../../flow-engine/index.md).

## Scenario Comparison

| Scenario | Approach | Reason |
| --- | --- | --- |
| Plugin settings page | React component | Standalone page, doesn't need to appear in configuration menus |
| Utility modal | React component | Internal component, doesn't need visual configuration |
| Custom data table block | FlowModel | Needs to appear in the "Add Block" menu, users can configure the data source |
| Custom field display component | FlowModel | Needs to appear in field configuration, users can select display methods |
| Custom action button | FlowModel | Needs to appear in the "Add Action" menu |
| Encapsulating a chart component for a block | React component | The chart itself is an internal component, called by the FlowModel block |

## Progressive Adoption

When in doubt, start with a React component to implement the functionality. Once you confirm the need for visual configuration capabilities, wrap it with FlowModel — this is the recommended progressive approach. Use FlowModel for large-scale content management, React components for internal details, and combine both.

## Related Links

- [Component Development](./component/index.md) — React component patterns and useFlowContext usage
- [FlowEngine Overview](./flow-engine/index.md) — FlowModel basics and registerFlow
- [FlowEngine Complete Documentation](../../flow-engine/index.md) — Complete reference for FlowModel, Flow, and Context
