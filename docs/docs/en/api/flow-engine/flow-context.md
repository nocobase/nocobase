---
title: "FlowContext"
description: "NocoBase FlowContext API: Complete reference for the ctx object properties and methods in registerFlow handlers."
keywords: "FlowContext,FlowRuntimeContext,ctx,registerFlow,handler,FlowEngine,NocoBase"
---

# FlowContext

In the step handler of `registerFlow`, the `ctx` parameter is a `FlowRuntimeContext` instance. Through the delegation chain, it can access all properties and methods at both the model level and the engine level.

The delegation chain is:

```
FlowRuntimeContext (runtime context of the current flow)
  → FlowModelContext (model.context, model level)
    → FlowEngineContext (engine.context, global level)
```

## Common Properties

The most commonly used `ctx` properties in plugin development:

| Property | Type | Description |
|----------|------|-------------|
| `ctx.model` | `FlowModel` | Current FlowModel instance |
| `ctx.api` | `APIClient` | HTTP request client from `@nocobase/sdk` |
| `ctx.viewer` | `FlowViewer` | Popup/drawer manager providing `dialog()`, `drawer()`, and other methods |
| `ctx.message` | `MessageInstance` | Antd message instance, e.g., `ctx.message.success('OK')` |
| `ctx.notification` | `NotificationInstance` | Antd notification instance |
| `ctx.modal` | `HookAPI` | Antd Modal.useModal instance |
| `ctx.t(key, options?)` | `(string, object?) => string` | Internationalization translation method |
| `ctx.router` | `Router` | react-router instance |
| `ctx.route` | `RouteOptions` | Current route information (observable) |
| `ctx.location` | `Location` | Current URL location object (observable) |
| `ctx.ref` | `React.RefObject` | DOM ref of the current model's view container |
| `ctx.flowKey` | `string` | Key of the current flow |
| `ctx.mode` | `'runtime' \| 'settings'` | Current execution mode: runtime for runtime, settings for settings panel |
| `ctx.token` | `string` | Authentication token of the current user |
| `ctx.role` | `string` | Role of the current user |
| `ctx.auth` | `object` | Authentication info: `{ roleName, locale, token, user }` |
| `ctx.themeToken` | `object` | Antd theme token for accessing theme colors, etc. |
| `ctx.dataSourceManager` | `DataSourceManager` | Data source manager |
| `ctx.engine` | `FlowEngine` | FlowEngine instance |
| `ctx.app` | `Application` | NocoBase Application instance |
| `ctx.i18n` | `i18n` | i18next instance |

## Common Methods

### Request

| Method | Description |
|--------|-------------|
| `ctx.request(options)` | Make an HTTP request; internal URLs use `APIClient`, external URLs use `axios` |
| `ctx.makeResource(ResourceClass)` | Create a Resource instance (e.g., `MultiRecordResource`, `SingleRecordResource`) |
| `ctx.initResource(className)` | Initialize a resource on the model context |

### Dialog / Drawer

| Method | Description |
|--------|-------------|
| `ctx.viewer.dialog(options)` | Open a dialog; `options.content` accepts `(view) => JSX`, use `view.close()` to close |
| `ctx.viewer.drawer(options)` | Open a drawer |
| `ctx.openView(uid, options)` | Open a registered view (popup / drawer / dialog) |

### Flow Execution Control

| Method | Description |
|--------|-------------|
| `ctx.exit()` | Abort execution of the current flow |
| `ctx.exitAll()` | Abort execution of all flows |
| `ctx.getStepParams(stepKey)` | Get the saved parameters for a specific step |
| `ctx.setStepParams(stepKey, params)` | Set parameters for a specific step |
| `ctx.getStepResults(stepKey)` | Get the execution result of a previous step |

### Action & Event

| Method | Description |
|--------|-------------|
| `ctx.runAction(actionName, params?)` | Execute a registered action |
| `ctx.getAction(name)` | Get a registered action definition |
| `ctx.getActions()` | Get all registered actions |
| `ctx.getEvents()` | Get all registered events |

### ACL

| Method | Description |
|--------|-------------|
| `ctx.aclCheck(params)` | Check ACL permissions |
| `ctx.acl` | ACL instance |

### Others

| Method | Description |
|--------|-------------|
| `ctx.resolveJsonTemplate(template)` | Resolve `{{ ctx.xxx }}` expression templates |
| `ctx.getVar(path)` | Resolve a single `ctx.xxx.yyy` expression path |
| `ctx.runjs(code, variables?, options?)` | Dynamically execute JavaScript code |
| `ctx.requireAsync(url)` | Dynamically load a module (CommonJS style) |
| `ctx.importAsync(url)` | Dynamically load a module (ESM style) |
| `ctx.loadCSS(href)` | Dynamically load a CSS file |
| `ctx.onRefReady(ref, callback, timeout)` | Execute a callback once a React ref is ready |
| `ctx.defineProperty(key, options)` | Dynamically register a new property |
| `ctx.defineMethod(name, fn, info?)` | Dynamically register a new method |

## Typical Usage in Plugin Development

### Show a message in a click handler

```ts
MyModel.registerFlow({
  key: 'clickFlow',
  on: 'click',
  steps: {
    showMessage: {
      async handler(ctx) {
        ctx.message.success(ctx.t('Operation successful'));
      },
    },
  },
});
```

### Open a dialog to create a record

```ts
MyModel.registerFlow({
  key: 'clickFlow',
  on: 'click',
  steps: {
    openDialog: {
      async handler(ctx) {
        ctx.viewer.dialog({
          title: ctx.t('Create Record'),
          content: (view) => <MyForm onClose={() => view.close()} />,
        });
      },
    },
  },
});
```

### Get current row data (record-level action)

```ts
MyRecordAction.registerFlow({
  key: 'clickFlow',
  on: 'click',
  steps: {
    showRecord: {
      async handler(ctx) {
        const index = ctx.model.context.recordIndex;
        const record = ctx.model.context.record;
        ctx.message.info(`Row ${index}: ${record.title}`);
      },
    },
  },
});
```

### Operate data via resource

```ts
async handler(ctx) {
  const resource = ctx.model.context.resource;
  // Create a record
  await resource.create({ title: 'New item', completed: false });
  // Refresh data
  await resource.refresh();
}
```

## Related Links

- [FlowEngine Overview (Plugin Development)](../../plugin-development/client/flow-engine/index.md) — FlowModel basics and registerFlow
- [FlowDefinition](../../flow-engine/definitions/flow-definition.md) — Complete parameter reference for registerFlow
- [FlowEngine Full Documentation](../../flow-engine/index.md) — Complete reference for FlowModel and Flow
