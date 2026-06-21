# ctx.openView()

Programmatically open a specified view (drawer, dialog, embedded page, etc.). Provided by `FlowModelContext`, it is used to open configured `ChildPage` or `PopupAction` views in scenarios such as `JSBlock`, table cells, and workflows.

## Use Cases

| Scenario | Description |
|------|------|
| **JSBlock** | Open a detail/edit dialog after a button click, passing the current row's `filterByTk`. |
| **Table Cell** | Render a button within a cell that opens a row detail dialog when clicked. |
| **Workflow / JSAction** | Open the next view or a dialog after a successful operation. |
| **Association Field** | Open a selection/edit dialog via `ctx.runAction('openView', params)`. |

> Note: `ctx.openView` is available in a RunJS environment where a `FlowModel` context exists. If the model corresponding to the `uid` does not exist, a `PopupActionModel` will be automatically created and persisted.

## Signature

```ts
openView(uid: string, options?: OpenViewOptions): Promise<void>
```

## Parameters

### uid

The unique identifier of the view model. If it does not exist, it will be automatically created and saved. It is recommended to use a stable UID, such as `${ctx.model.uid}-detail`, so that the configuration can be reused when opening the same dialog multiple times.

### Common options Fields

| Field | Type | Description |
|------|------|------|
| `mode` | `drawer` / `dialog` / `embed` | Opening method: drawer, dialog, or embedded. Defaults to `drawer`. |
| `size` | `small` / `medium` / `large` | Size of the dialog or drawer. Defaults to `medium`. |
| `title` | `string` | View title. |
| `params` | `Record<string, any>` | Arbitrary parameters passed to the view. |
| `filterByTk` | `any` | Primary key value, used for single record detail/edit scenarios. |
| `sourceId` | `string` | Source record ID, used in association scenarios. |
| `dataSourceKey` | `string` | Data source. |
| `collectionName` | `string` | Collection name. |
| `associationName` | `string` | Association field name. |
| `navigation` | `boolean` | Whether to use route navigation. If `defineProperties` or `defineMethods` are provided, this is forced to `false`. |
| `preventClose` | `boolean` | Whether to prevent closing. |
| `defineProperties` | `Record<string, PropertyOptions>` | Dynamically inject properties into the model within the view. |
| `defineMethods` | `Record<string, Function>` | Dynamically inject methods into the model within the view. |

## Examples

### Basic Usage: Open a Drawer

```ts
const popupUid = `${ctx.model.uid}-detail`;
await ctx.openView(popupUid, {
  mode: 'drawer',
  size: 'medium',
  title: ctx.t('Details'),
});
```

### Passing Current Row Context

```ts
const primaryKey = ctx.collection?.primaryKey || 'id';
await ctx.openView(`${ctx.model.uid}-1`, {
  mode: 'dialog',
  title: ctx.t('Row Details'),
  params: {
    filterByTk: ctx.record?.[primaryKey],
    record: ctx.record,
  },
});
```

### Open via runAction

When a model is configured with an `openView` action (such as association fields or clickable fields), you can call:

```ts
await ctx.runAction('openView', {
  navigation: false,
  mode: 'dialog',
  collectionName: 'users',
  filterByTk: ctx.record?.id,
});
```

### Injecting Custom Context

```ts
await ctx.openView(`${ctx.model.uid}-edit`, {
  mode: 'drawer',
  filterByTk: ctx.record?.id,
  defineProperties: {
    onSaved: {
      get: () => () => ctx.resource?.refresh?.(),
      cache: false,
    },
  },
});
```

## Relationship with ctx.viewer and ctx.view

| Purpose | Recommended Usage |
|------|----------|
| **Open a configured flow view** | `ctx.openView(uid, options)` |
| **Open custom content (no flow)** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` |
| **Operate on the currently open view** | `ctx.view.close()`, `ctx.view.inputArgs` |

`ctx.openView` opens a `FlowPage` (`ChildPageModel`), which renders a complete flow page internally; `ctx.viewer` opens arbitrary React content.

## Notes

- It is recommended to associate the `uid` with `ctx.model.uid` (e.g., `${ctx.model.uid}-xxx`) to avoid conflicts between multiple blocks.
- When `defineProperties` or `defineMethods` are passed, `navigation` is forced to `false` to prevent context loss after a refresh.
- Inside the dialog, `ctx.view` refers to the current view instance, and `ctx.view.inputArgs` can be used to read the parameters passed during opening.

## Related

- [ctx.view](./view.md): The currently open view instance.
- [ctx.model](./model.md): The current model, used to construct a stable `popupUid`.