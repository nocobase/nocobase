# ctx.view

The currently active view controller (dialog, drawer, popover, embed, etc.); used to access view-level info and actions. Provided by FlowViewContext; only available inside content opened via `ctx.viewer` or `ctx.openView`.

## Use Cases

| Scenario | Description |
|----------|-------------|
| **Dialog/drawer content** | In `content`, use `ctx.view.close()` to close, or render `Header`, `Footer` for title and actions |
| **After form submit** | Call `ctx.view.close(result)` to close and pass result back |
| **JSBlock / Action** | Check `ctx.view.type` for view type, or read `ctx.view.inputArgs` for open params |
| **Association select, sub-table** | Read `inputArgs` for `collectionName`, `filterByTk`, `parentId`, etc. for loading data |

> Note: `ctx.view` is only available in RunJS when a view context exists (e.g. inside `ctx.viewer.dialog()` content, dialog form, association selector); in a normal page or backend context it is `undefined`—use optional chaining: `ctx.view?.close?.()`.

## Type

```ts
type FlowView = {
  type: 'drawer' | 'popover' | 'dialog' | 'embed';
  inputArgs: Record<string, any>;
  Header: React.FC<{ title?: React.ReactNode; extra?: React.ReactNode }> | null;
  Footer: React.FC<{ children?: React.ReactNode }> | null;
  close: (result?: any, force?: boolean) => void;
  update: (newConfig: any) => void;
  navigation?: ViewNavigation;
  destroy?: () => void;
  submit?: () => Promise<any>;
};
```

## Common properties and methods

| Property/Method | Type | Description |
|-----------------|------|-------------|
| `type` | `'drawer' \| 'popover' \| 'dialog' \| 'embed'` | Current view type |
| `inputArgs` | `Record<string, any>` | Params passed when opening the view |
| `Header` | `React.FC \| null` | Header component for title and actions |
| `Footer` | `React.FC \| null` | Footer for buttons, etc. |
| `close(result?, force?)` | `void` | Close current view; optional `result` passed back to caller |
| `update(newConfig)` | `void` | Update view config (e.g. width, title) |
| `navigation` | `ViewNavigation \| undefined` | In-view navigation (tabs, etc.) |

> Currently only `dialog` and `drawer` support `Header` and `Footer`.

## inputArgs (common fields)

Fields in `inputArgs` depend on how the view was opened; common ones:

| Field | Description |
|-------|-------------|
| `viewUid` | View UID |
| `collectionName` | Collection name |
| `filterByTk` | Primary key filter (single record) |
| `parentId` | Parent id (associations) |
| `sourceId` | Source record id |
| `parentItem` | Parent item data |
| `scene` | Scene (e.g. `create`, `edit`, `select`) |
| `onChange` | Callback after select/change |
| `tabUid` | Current tab UID (in-page) |

Access via `ctx.getVar('ctx.view.inputArgs.xxx')` or `ctx.view.inputArgs.xxx`.

## Examples

### Close current view

```ts
await ctx.resource.runAction('create', { data: formData });
ctx.view?.close();

ctx.view?.close({ id: newRecord.id, name: newRecord.name });
```

### Header / Footer in content

```tsx
function DialogContent() {
  const ctx = useFlowViewContext();
  const { Header, Footer, close } = ctx.view;
  return (
    <div>
      <Header title="Edit" extra={<Button size="small">Help</Button>} />
      <div>Form content...</div>
      <Footer>
        <Button onClick={() => close()}>Cancel</Button>
        <Button type="primary" onClick={handleSubmit}>OK</Button>
      </Footer>
    </div>
  );
}
```

### Branch by view type or inputArgs

```ts
if (ctx.view?.type === 'embed') {
  ctx.model.setProps('headerStyle', { display: 'none' });
}

const collectionName = ctx.view?.inputArgs?.collectionName;
if (collectionName === 'users') {
  // User selector
}
```

## Relation to ctx.viewer, ctx.openView

| Use | Recommended |
|-----|-------------|
| **Open new view** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` or `ctx.openView()` |
| **Operate current view** | `ctx.view.close()`, `ctx.view.update()` |
| **Open params** | `ctx.view.inputArgs` |

`ctx.viewer` opens views; `ctx.view` is the current view instance; `ctx.openView` opens configured flow views.

## Notes

- `ctx.view` is only available inside a view; on a normal page it is `undefined`.
- Use optional chaining: `ctx.view?.close?.()` to avoid errors when no view context.
- `close(result)` passes `result` to the Promise returned by `ctx.viewer.open()`.

## Related

- [ctx.openView()](./open-view.md): open configured flow view
- [ctx.modal](./modal.md): lightweight modals (info, confirm, etc.)

> `ctx.viewer` provides `dialog()`, `drawer()`, `popover()`, `embed()`; inside their `content` you can use `ctx.view`.
