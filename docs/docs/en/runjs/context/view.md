# ctx.view

The currently active view controller (dialog, drawer, popover, embedded area, etc.), used to access view-level information and operations. Provided by `FlowViewContext`, it is only available within view content opened via `ctx.viewer` or `ctx.openView`.

## Use Cases

| Scenario | Description |
|------|------|
| **Dialog/Drawer Content** | Use `ctx.view.close()` within the `content` to close the current view, or use `Header` and `Footer` to render titles and footers. |
| **After Form Submission** | Call `ctx.view.close(result)` after a successful submission to close the view and return the result. |
| **JSBlock / Action** | Determine the current view type via `ctx.view.type`, or read opening parameters from `ctx.view.inputArgs`. |
| **Association Selection, Sub-tables** | Read `collectionName`, `filterByTk`, `parentId`, etc., from `inputArgs` for data loading. |

> Note: `ctx.view` is only available in RunJS environments with a view context (e.g., inside the `content` of `ctx.viewer.dialog()`, in dialog forms, or inside association selectors). In standard pages or backend contexts, it is `undefined`. It is recommended to use optional chaining (`ctx.view?.close?.()`).

## Type Definition

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
  submit?: () => Promise<any>;  // Available in workflow configuration views
};
```

## Common Properties and Methods

| Property/Method | Type | Description |
|-----------|------|------|
| `type` | `'drawer' \| 'popover' \| 'dialog' \| 'embed'` | Current view type |
| `inputArgs` | `Record<string, any>` | Parameters passed when opening the view (see below) |
| `Header` | `React.FC \| null` | Header component, used to render titles and action areas |
| `Footer` | `React.FC \| null` | Footer component, used to render buttons, etc. |
| `close(result?, force?)` | `void` | Closes the current view; `result` can be passed back to the caller |
| `update(newConfig)` | `void` | Updates view configuration (e.g., width, title) |
| `navigation` | `ViewNavigation \| undefined` | In-page view navigation, including Tab switching, etc. |

> Currently, only `dialog` and `drawer` support `Header` and `Footer`.

## Common inputArgs Fields

The fields in `inputArgs` vary depending on the opening scenario. Common fields include:

| Field | Description |
|------|------|
| `viewUid` | View UID |
| `collectionName` | Collection name |
| `filterByTk` | Primary key filter (for single record details) |
| `parentId` | Parent ID (for association scenarios) |
| `sourceId` | Source record ID |
| `parentItem` | Parent item data |
| `scene` | Scene (e.g., `create`, `edit`, `select`) |
| `onChange` | Callback after selection or change |
| `tabUid` | Current Tab UID (within a page) |

Access these via `ctx.getVar('ctx.view.inputArgs.xxx')` or `ctx.view.inputArgs.xxx`.

## Examples

### Closing the Current View

```ts
// Close dialog after successful submission
await ctx.resource.runAction('create', { data: formData });
ctx.view?.close();

// Close and return results
ctx.view?.close({ id: newRecord.id, name: newRecord.name });
```

### Using Header / Footer in Content

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
        <Button type="primary" onClick={handleSubmit}>Submit</Button>
      </Footer>
    </div>
  );
}
```

### Branching Based on View Type or inputArgs

```ts
if (ctx.view?.type === 'embed') {
  // Hide header in embedded views
  ctx.model.setProps('headerStyle', { display: 'none' });
}

const collectionName = ctx.view?.inputArgs?.collectionName;
if (collectionName === 'users') {
  // User selector scenario
}
```

## Relationship with ctx.viewer and ctx.openView

| Purpose | Recommended Usage |
|------|----------|
| **Open a new view** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` or `ctx.openView()` |
| **Operate on current view** | `ctx.view.close()`, `ctx.view.update()` |
| **Get opening parameters** | `ctx.view.inputArgs` |

`ctx.viewer` is responsible for "opening" a view, while `ctx.view` represents the "current" view instance. `ctx.openView` is used to open pre-configured workflow views.

## Notes

- `ctx.view` is only available inside a view; it is `undefined` on standard pages.
- Use optional chaining: `ctx.view?.close?.()` to avoid errors when no view context exists.
- The `result` from `close(result)` is passed to the Promise returned by `ctx.viewer.open()`.

## Related

- [ctx.openView()](./open-view.md): Open a pre-configured workflow view
- [ctx.modal](./modal.md): Lightweight popups (info, confirmation, etc.)

> `ctx.viewer` provides methods like `dialog()`, `drawer()`, `popover()`, and `embed()` to open views. The `content` opened by these methods can access `ctx.view`.