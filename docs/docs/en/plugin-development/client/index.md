# Client Overview

This chapter introduces the basic structure and working mechanism of NocoBase client plugins, including directory structure, lifecycle, common APIs, the front-end flow engine (FlowModel), and the resource and data source systems, to help you extend and customize front-end behavior and logic in your plugins.

---

## 📁 Directory Structure Overview

When you create a plugin, the client-side code is usually placed in the `src/client` directory, with the following structure:

```bash
├─ /packages/plugins/@my-project/plugin-hello
│  ├─ client.d.ts                   # Type declaration file
│  ├─ client.js                     # Build output, plugin loading entry point
│  └─ src
│     ├─ index.ts                   # Default export of the client plugin
│     ├─ client
│     │  ├─ index.tsx               # Default export of the Plugin class
│     │  ├─ plugin.tsx              # Plugin class (extends @nocobase/client Plugin)
│     │  ├─ models                  # Optional: Register front-end models (e.g., FlowModel)
│     │  │  └─ index.ts
│     │  └─ utils                   # Optional: Plugin utility functions
│     │     ├─ index.ts
│     │     └─ useT.ts              # Internationalization helper function
│     ├─ utils                      # General plugin utilities
│     │  ├─ index.ts
│     │  └─ tExpr.ts
│     └─ locale                     # Optional: Locale files
│        ├─ en-US.json
│        └─ zh-CN.json
```

> 💡 `client.js` is the plugin's build output and is loaded when the plugin is enabled. During development, you should focus on the source code under `src/client`.

---

## 🔄 Plugin Class and Lifecycle

Client plugins need to extend the `Plugin` base class provided by `@nocobase/client`, which offers three main lifecycle hooks:

```ts
import { Plugin } from '@nocobase/client';

export class PluginHelloClient extends Plugin {
  async afterAdd() {
    // Executes after the plugin is added (instance initialization)
  }

  async beforeLoad() {
    // Executes before the plugin is loaded (all plugins have been instantiated)
  }

  async load() {
    // Executes when the plugin is loading (all plugins have completed their beforeLoad)
  }
}

export default PluginHelloClient;
```

### Lifecycle Execution Order

Each time the page is refreshed or the application starts, the plugin lifecycle is as follows:

```
afterAdd → beforeLoad → load
```

| Lifecycle      | Timing                                  | Notes                                       |
| -------------- | --------------------------------------- | ------------------------------------------- |
| `afterAdd()`   | After the plugin instance is created    | ❗ Cannot access other plugins              |
| `beforeLoad()` | Before loading, all plugins are initialized | ✅ Can get other plugins via `pm.get(name)` |
| `load()`       | After the plugin has finished loading   | ✅ The `beforeLoad` of all plugins has been executed |

---

## 🧩 Client Plugin Architecture

Through the `Plugin` instance, a client plugin can access a series of functional objects:

| Property / Method  | Description                                  |
| ---------------- | -------------------------------------------- |
| `plugin.logger`  | Plugin logger                                |
| `plugin.pm`      | Plugin Manager                               |
| `plugin.context` | Plugin context                               |
| `plugin.engine`  | Front-end flow engine                        |
| `plugin.router`  | Page routing system                          |
| `plugin.t()`     | Internationalization function (same as i18next) |

---

## 🌐 Client Context

Context provides the runtime environment for the plugin. Common context classes include:

| Context Class          | Purpose                                          |
| ---------------------- | ------------------------------------------------ |
| `FlowContext`          | Front-end flow execution context                 |
| `FlowEngineContext`    | Flow engine runtime context                      |
| `FlowRunjsContext`     | Context for executing `runjs` nodes              |
| `FlowModelContext`     | Flow model execution context                     |
| `FlowForkModelContext` | Flow model fork context                          |
| `FlowRuntimeContext`   | The complete runtime context of the flow engine |

### Common Context APIs:

| Method                     | Description                                  |
| -------------------------- | -------------------------------------------- |
| `ctx.engine`               | Get the front-end flow engine instance       |
| `ctx.router`               | Page-level router object                     |
| `ctx.pluginSettingsRouter` | Plugin settings page router                  |
| `ctx.request`              | Wrapper for making network requests          |
| `ctx.createResource()`     | Create a remote resource object (REST API wrapper) |
| `ctx.i18n`                 | Internationalization object                  |
| `ctx.logger`               | Logger                                       |
| `ctx.t()`                  | Translation function (same as `plugin.t()`)  |
| `ctx.dataSourceManager`    | Data Source Manager                          |
| `ctx.jsonLogic`            | JSON Logic executor                          |

---

## 🔁 Front-end FlowEngine

NocoBase provides a **front-end flow engine** for low-code scenarios, used to configure and execute component behavior logic, such as:

*   Button click → API request → Show notification
*   Field value change → Control the visibility of another field
*   On page load → Execute a set of initialization logic

### What is FlowModel?

`FlowModel` is the core class of the front-end flow engine and the starting point for building this component logic. You can extend it to register your plugin's front-end flow models.

The typical registration method is as follows:

```ts
// src/client/models/custom-flow.ts
import { FlowModel } from '@nocobase/client';

export class CustomFlowModel extends FlowModel {
  // Custom flow structure and execution logic
}
```

```ts
// src/client/models/index.ts
export const models = {
  CustomFlowModel,
};
```

### Definitions

A front-end flow model is composed of a set of composable definitions:

| Definition Class   | Description                                                  |
| ------------------ | ------------------------------------------------------------ |
| `ModelDefinition`  | Base class for all definitions                               |
| `FlowDefinition`   | Describes the overall flow structure                         |
| `EventDefinition`  | Defines trigger events (e.g., onClick)                       |
| `ActionDefinition` | Defines execution actions (e.g., API requests, field assignments) |
| `StepDefinition`   | Defines the flow steps between events and actions            |

---

## 🔗 Resource

The NocoBase client encapsulates a unified resource invocation system for concise API calls, data fetching, pagination, and other operations.

### Common Resource Types:

| Type                   | Purpose                        |
| ---------------------- | ------------------------------ |
| `FlowResource`         | Front-end flow engine resource |
| `APIResource`          | REST API wrapper               |
| `BaseRecordResource`   | Base record resource           |
| `MultiRecordResource`  | Multiple records resource      |
| `SingleRecordResource` | Single record resource         |
| `SQLResource`          | SQL query resource             |
| `ChartResource`        | Chart data resource wrapper    |

---

## 🧱 Data Source System

The client manages all data sources through the `DataSourceManager`, supporting custom Collections and Fields.

| Module              | Description                         |
| ------------------- | ----------------------------------- |
| `DataSourceManager` | Manages all data source connections |
| `DataSource`        | Represents a data source instance   |
| `Collection`        | Collection structure definition   |
| `CollectionField`   | Field definition structure          |

---

## 📚 Detailed Tutorials

### Core Features

- **[FlowEngine](./flow-engine.md)** - Detailed usage and best practices for the front-end flow engine
- **[Data Source System](./data-sources.md)** - A complete guide to data source management
- **[Resource System](./resources.md)** - Detailed explanation of resource types and operations
- **[Router System](./router.md)** - Route management and page navigation

### UI Components

- **[Block System](./blocks/)** - Development guide for the block model
  - [Block Definition](./blocks/definition.md) - How to define and configure blocks
  - [Block Scenes](./blocks/scenes.md) - Using blocks in different scenarios
  - [Block Categories](./blocks/categories.md) - Block categorization and management
- **[Action System](./actions.md)** - Development guide for the action model
- **[Field System](./fields.md)** - Development guide for the field model

### Advanced Features

- **[Context System](./context.md)** - Detailed explanation of the context system
- **[Hooks System](./hooks.md)** - Using React Hooks
- **[Styles and Theme](./styles-and-theme.md)** - Style management and theme customization
- **[Testing Guide](./tests.md)** - Testing strategies and tool usage

### Complete Tutorials

- **[Tutorial Outline](./tutorial-outline.md)** - A complete outline for client development tutorials
- **[Learning Path](../learning-path.md)** - Recommended learning path

## 🚀 Recommended Learning Path

It is recommended to follow this path to progressively delve into client-side development:

1.  Familiarize yourself with the plugin directory and lifecycle (`Plugin` class)
2.  Master common APIs and the Context system
3.  Use and extend the front-end `FlowModel`
4.  Use Resource for data interaction
5.  Write configuration pages and custom behavior logic

📷 Example Diagram:


![Learning Path Diagram](https://static-docs.nocobase.com/20250929072438.png)


## Further Learning

- If you are writing a plugin for the first time, you can start with the example in "[Write Your First Plugin](../write-your-first-plugin)"
- To understand server-side plugin capabilities, please read "[Server Overview](../server/index)"
- For an in-depth look at the API, you can refer to the type definitions and example code in the `@nocobase/client` package
- Check the "[Tutorial Outline](./tutorial-outline.md)" for a complete client development guide