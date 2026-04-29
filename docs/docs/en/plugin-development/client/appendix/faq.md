---
title: "FAQ & Troubleshooting Guide"
description: "Common issues in NocoBase client plugin development: plugin not showing, block not appearing, translation not working, route not found, hot reload not working, build errors, startup failure after deployment, and more."
keywords: "FAQ,Common Issues,Troubleshooting,NocoBase,Build,Deploy,tar,axios"
---

# FAQ & Troubleshooting Guide

This page collects common pitfalls when developing client plugins. If you run into a situation where "the code looks right but it just doesn't work," check here first.

## Plugin Issues

### Plugin not visible in the Plugin Manager after creation

Make sure you ran `yarn pm create` instead of manually creating the directory. `yarn pm create` not only generates files but also registers the plugin in the `applicationPlugins` database table. If you created the directory manually, run `yarn nocobase upgrade` to trigger a rescan.

### No changes on the page after enabling a plugin

Troubleshoot in this order:

1. Confirm you ran `yarn pm enable <pluginName>`
2. Refresh the browser (sometimes a hard refresh `Ctrl+Shift+R` is needed)
3. Check the browser console for errors

### Page doesn't update after modifying code

Different file types have different hot reload behaviors:

| File Type | After Modification |
| --- | --- |
| tsx/ts under `src/client-v2/` | Auto hot reload, no action needed |
| Translation files under `src/locale/` | **Restart the application** |
| New or modified collections under `src/server/collections/` | Run `yarn nocobase upgrade` |

If client code changes don't hot reload, try refreshing the browser first.

## Routing Issues

### Registered page route is not accessible

NocoBase v2 routes automatically add a `/v2` prefix. For example, if you registered `path: '/hello'`, the actual URL is `/v2/hello`:

```ts
this.router.add('hello', {
  path: '/hello', // actual URL -> /v2/hello
  componentLoader: () => import('./pages/HelloPage'),
});
```

See [Router](../router) for details.

### Plugin settings page shows blank content

If the settings menu item appears but the content is blank, it's usually one of two reasons:

**Reason 1: Used `componentLoader` in v1 client**

`componentLoader` is a client-v2 syntax. In v1 client, use `Component` to pass the component directly:

```ts
// ❌ v1 client does not support componentLoader
this.pluginSettingsManager.addPageTabItem({
  menuKey: 'my-settings',
  key: 'index',
  componentLoader: () => import('./pages/MyPage'),
});

// ✅ v1 client uses Component
import MyPage from './pages/MyPage';
this.pluginSettingsManager.addPageTabItem({
  menuKey: 'my-settings',
  key: 'index',
  Component: MyPage,
});
```

**Reason 2: The page component is not exported with `export default`**

`componentLoader` requires the module to have a default export. Missing `default` means the component can't be loaded.

## Block Issues

### Custom block not visible in the "Add Block" menu

Confirm you registered the model in `load()`:

```ts
this.flowEngine.registerModelLoaders({
  MyBlockModel: {
    loader: () => import('./models/MyBlockModel'),
  },
});
```

If you're using `registerModels` (non-lazy-loading approach), confirm the model is properly exported from `models/index.ts`.

### After adding a block, my table is not in the data source selection list

Tables defined via `defineCollection` are server-internal tables and do not appear in the UI data source list by default.

**Recommended approach**: Add the corresponding data table in the NocoBase interface under "[Data Source Management](../../../data-sources/data-source-main/index.md)," configure the fields and interface types, and the table will automatically appear in the block's data source selection list.

If you do need to register it in plugin code (e.g., for demo scenarios in example plugins), you can manually register it via `addCollection`. See [Building a Full-Stack Data Management Plugin](../examples/fullstack-plugin) for details. Note that you must register via the `eventBus` pattern — you cannot call it directly in `load()`, because `ensureLoaded()` will clear and re-set all collections after `load()`.

### Custom block should only bind to a specific data table

Override `static filterCollection` on the model — only collections that return `true` will appear in the selection list:

```ts
export class MyBlockModel extends TableBlockModel {
  static filterCollection(collection: Collection) {
    return collection.name === 'myTable';
  }
}
```

## Field Issues

### Custom field component not visible in the "Field Component" dropdown

Troubleshoot in this order:

1. Confirm you called `DisplayItemModel.bindModelToInterface('ModelName', ['input'])`, and the interface type matches — for example, `input` corresponds to single-line text fields, `checkbox` corresponds to checkboxes
2. Confirm the model is registered in `load()` (`registerModels` or `registerModelLoaders`)
3. Confirm the field model has called `define({ label })`

### Field component dropdown shows the class name

You forgot to call `define({ label })` on the field model. Just add it:

```ts
MyFieldModel.define({
  label: tExpr('My field'),
});
```

Also make sure the translation files under `src/locale/` contain the corresponding key, otherwise the English text will be shown in Chinese environments.

## Action Issues

### Custom action button not visible in "Configure Actions"

Confirm the model has the correct `static scene` set:

| Value | Where it appears |
| --- | --- |
| `ActionSceneEnum.collection` | Block top action bar (next to the "Create" button) |
| `ActionSceneEnum.record` | Table row action column (next to "Edit" / "Delete") |
| `ActionSceneEnum.both` | Both scenarios |

### Clicking the action button does nothing

Confirm `registerFlow`'s `on` is set to `'click'`:

```ts
MyActionModel.registerFlow({
  key: 'myFlow',
  on: 'click', // listen for button click
  steps: {
    doSomething: {
      async handler(ctx) {
        // your logic
      },
    },
  },
});
```

:::warning Note

`uiSchema` in `registerFlow` is for the configuration panel (design-time UI), not the runtime dialog. If you want to open a form dialog when the button is clicked, use `ctx.viewer.dialog()` in the `handler`.

:::

## Internationalization Issues

### Translation not taking effect

Most common causes:

- **First time adding** the `src/locale/` directory or files — requires an application restart to take effect
- **Translation key mismatch** — confirm the key exactly matches the string in the code, including spaces and capitalization
- **Using `ctx.t()` directly in a component** — `ctx.t()` does not automatically inject the plugin's namespace. In components, use the `useT()` hook (imported from `locale.ts`)

### Using `tExpr()`, `useT()`, and `this.t()` in the wrong context

These three translation methods are for different contexts. Using the wrong one will either cause errors or translations won't work:

| Method | Where to use | Description |
| --- | --- | --- |
| `tExpr()` | Static definitions like `define()`, `registerFlow()` | i18n isn't initialized at module load time, use deferred translation |
| `useT()` | Inside React components | Returns a translation function bound to the plugin's namespace |
| `this.t()` | In Plugin's `load()` | Automatically injects the plugin package name as namespace |

See [i18n Internationalization](../component/i18n) for details.

## API Request Issues

### Request returns 403 Forbidden

Usually the server-side ACL is not configured. For example, if your collection is called `todoItems`, you need to allow the corresponding actions in the server plugin's `load()`:

```ts
// Allow read only
this.app.acl.allow('todoItems', ['list', 'get'], 'loggedIn');

// Allow full CRUD
this.app.acl.allow('todoItems', ['list', 'get', 'create', 'update', 'destroy'], 'loggedIn');
```

`'loggedIn'` means any logged-in user can access it. Without `acl.allow`, only administrators can operate by default.

### Request returns 404 Not Found

Troubleshoot in this order:

- If using `defineCollection`, confirm the collection name is spelled correctly
- If using `resourceManager.define`, confirm both the resource name and action name are correct
- Check the request URL format — NocoBase's API format is `resourceName:actionName`, e.g., `todoItems:list`, `externalApi:get`

## Build and Deployment Issues

### `yarn build --tar` error "no paths specified to add to archive"

When running `yarn build <pluginName> --tar`, you get:

```bash
TypeError: no paths specified to add to archive
```

However, running `yarn build <pluginName>` alone (without `--tar`) works fine.

This is usually because the plugin's `.npmignore` uses **negation syntax** (npm's `!` prefix). When `--tar` packages the plugin, NocoBase reads each line of `.npmignore` and prepends `!` to convert them into `fast-glob` exclusion patterns. If your `.npmignore` already uses negation syntax, like:

```
*
!dist
!package.json
```

After processing, it becomes `['!*', '!!dist', '!!package.json', '**/*']`. The `!*` excludes all root-level files (including `package.json`), while `!!dist` is not recognized by `fast-glob` as "re-include dist" — the negation fails. If the `dist/` directory happens to be empty or the build produced no output files, the collected file list ends up empty, and `tar` throws this error.

**Solution:** Don't use negation syntax in `.npmignore`. Instead, only list the directories to exclude:

```
/node_modules
/src
```

The packaging logic will convert these into exclusion patterns (`!./node_modules`, `!./src`) and add `**/*` to match all other files. This approach is simpler and avoids the negation processing issue.

### Plugin activation fails in production after upload (works locally)

The plugin works fine during local development, but fails to activate after uploading via the "Plugin Manager" to production. The log shows an error like:

```bash
TypeError: Cannot assign to read only property 'constructor' of object '[object Object]'
```

This is usually because **the plugin bundled NocoBase's built-in dependencies into its own `node_modules/`**. NocoBase's build system maintains an [external list](../../dependency-management) of packages (such as `react`, `antd`, `axios`, `lodash`, etc.) that are provided by the NocoBase host and should not be bundled into plugins. If a plugin carries its own private copy, it may conflict with the version already loaded by the host at runtime, causing various unexpected errors.

**Why it works locally:** During local development, the plugin is in the `packages/plugins/` directory without a private `node_modules/`. Dependencies resolve to the already-loaded versions in the project root, so no conflicts occur.

**Solution:** Move all `dependencies` in the plugin's `package.json` to `devDependencies` — NocoBase's build system will automatically handle plugin dependencies:

```diff
{
- "dependencies": {
-   "axios": "1.7.7"
- },
+ "devDependencies": {
+   "axios": "1.7.7"
+ },
}
```

Then rebuild and repackage. This way the plugin's `dist/node_modules/` won't contain these packages, and the NocoBase host-provided versions will be used at runtime.

:::tip General Principle

NocoBase's build system maintains an [external list](../../dependency-management) of packages (such as `react`, `antd`, `axios`, `lodash`, etc.) that are provided by the NocoBase host — plugins should not bundle them. All plugin dependencies should be placed in `devDependencies`, and the build system will automatically determine which need to be bundled into `dist/node_modules/` and which are provided by the host.

:::

## Related Links

- [Plugin](../plugin) — Plugin entry and lifecycle
- [Router](../router) — Route registration and the `/v2` prefix
- [FlowEngine Overview](../flow-engine/index.md) — FlowModel basics
- [FlowEngine - Block Extension](../flow-engine/block) — BlockModel, TableBlockModel, filterCollection
- [FlowEngine - Field Extension](../flow-engine/field) — FieldModel, bindModelToInterface
- [FlowEngine - Action Extension](../flow-engine/action) — ActionModel, ActionSceneEnum
- [i18n Internationalization](../component/i18n) — Translation files, useT, tExpr usage
- [Context - Common Capabilities](../ctx/common-capabilities) — ctx.api, ctx.viewer, etc.
- [Server - Collections](../../server/collections) — defineCollection and addCollection
- [Server - ACL](../../server/acl) — API permission configuration
- [Plugin Build](../../build) — Build configuration, external list, packaging workflow
