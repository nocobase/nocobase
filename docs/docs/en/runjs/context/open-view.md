# ctx.openView()

Opens a configured view (drawer, dialog, embed, etc.) programmatically. Provided by FlowModelContext; used in JSBlock, table cells, event flow, etc. to open ChildPage or PopupAction views.

## Use Cases

| Scenario | Description |
|----------|-------------|
| **JSBlock** | Button opens detail/edit dialog; pass current row `filterByTk` |
| **Table cell** | Button in cell opens row detail dialog |
| **Event flow / JSAction** | Open next view or dialog after action success |
| **Association field** | `ctx.runAction('openView', params)` for select/edit dialog |

> Note: `ctx.openView` requires a FlowModel context; if no model exists for the uid, a PopupActionModel is created and persisted.

## Signature

```ts
openView(uid: string, options?: OpenViewOptions): Promise<void>
```

## Parameters

### uid

Unique id of the view model. If missing, it is created and saved. Use a stable uid (e.g. `${ctx.model.uid}-detail`) so the same popup can be reused.

### options (common fields)

| Field | Type | Description |
|-------|------|-------------|
| `mode` | `drawer` / `dialog` / `embed` | How to open: drawer, dialog, embed; default `drawer` |
| `size` | `small` / `medium` / `large` | Dialog/drawer size; default `medium` |
| `title` | `string` | View title |
| `params` | `Record<string, any>` | Arbitrary params passed to the view |
| `filterByTk` | `any` | Primary key for single-record detail/edit |
| `sourceId` | `string` | Source record id (associations) |
| `dataSourceKey` | `string` | Data source |
| `collectionName` | `string` | Collection name |
| `associationName` | `string` | Association field name |
| `navigation` | `boolean` | Use route navigation; forced `false` when passing `defineProperties` / `defineMethods` |
| `preventClose` | `boolean` | Prevent close |
| `defineProperties` | `Record<string, PropertyOptions>` | Inject properties into view models |
| `defineMethods` | `Record<string, Function>` | Inject methods into view models |

## Examples

### Basic: open drawer

```ts
const popupUid = `${ctx.model.uid}-detail`;
await ctx.openView(popupUid, {
  mode: 'drawer',
  size: 'medium',
  title: ctx.t('Detail'),
});
```

### Pass current row context

```ts
const primaryKey = ctx.collection?.primaryKey || 'id';
await ctx.openView(`${ctx.model.uid}-1`, {
  mode: 'dialog',
  title: ctx.t('Row detail'),
  params: {
    filterByTk: ctx.record?.[primaryKey],
    record: ctx.record,
  },
});
```

### Open via runAction

When the model has an openView action (e.g. association field, clickable field):

```ts
await ctx.runAction('openView', {
  navigation: false,
  mode: 'dialog',
  collectionName: 'users',
  filterByTk: ctx.record?.id,
});
```

### Inject custom context

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

## Relation to ctx.viewer, ctx.view

| Use | Recommended |
|-----|-------------|
| **Open configured flow view** | `ctx.openView(uid, options)` |
| **Open custom content (no flow)** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` |
| **Operate current view** | `ctx.view.close()`, `ctx.view.inputArgs` |

`ctx.openView` opens a FlowPage (ChildPageModel) with a full flow; `ctx.viewer` opens arbitrary React content.

## Notes

- Prefer uids related to `ctx.model.uid` (e.g. `${ctx.model.uid}-xxx`) to avoid conflicts between blocks.
- When passing `defineProperties` / `defineMethods`, `navigation` is forced to `false` so context is not lost on refresh.
- Inside a popup, `ctx.view` is the current view and `ctx.view.inputArgs` holds the params passed when opening.

## Related

- [ctx.view](./view.md): current view instance
- [ctx.model](./model.md): current model; use for stable popupUid
