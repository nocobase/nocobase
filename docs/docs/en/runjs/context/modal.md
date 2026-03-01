# ctx.modal

Shortcut API built on Ant Design Modal for opening modals (info, confirm, etc.) from RunJS. Implemented by `ctx.viewer` / the view system.

## Use Cases

| Scenario | Description |
|----------|-------------|
| **JSBlock / JSField** | Show result, error, or confirmation after user action |
| **Event flow / action events** | Confirm before submit; use `ctx.exit()` when user cancels |
| **Linkage** | Show modal when validation fails |

> Note: `ctx.modal` is available in RunJS when a view context exists (e.g. JSBlock on a page, event flow); in backend or no-UI contexts it may be absent—use optional chaining: `ctx.modal?.confirm?.()`.

## Type

```ts
modal: {
  info: (config: ModalConfig) => Promise<void>;
  success: (config: ModalConfig) => Promise<void>;
  error: (config: ModalConfig) => Promise<void>;
  warning: (config: ModalConfig) => Promise<void>;
  confirm: (config: ModalConfig) => Promise<boolean>;  // true = OK, false = Cancel
};
```

`ModalConfig` matches Ant Design Modal static method config.

## Common Methods

| Method | Returns | Description |
|--------|--------|-------------|
| `info(config)` | `Promise<void>` | Info modal |
| `success(config)` | `Promise<void>` | Success modal |
| `error(config)` | `Promise<void>` | Error modal |
| `warning(config)` | `Promise<void>` | Warning modal |
| `confirm(config)` | `Promise<boolean>` | Confirm; OK → `true`, Cancel → `false` |

## Config

Same as Ant Design `Modal`; common fields:

| Parameter | Type | Description |
|-----------|------|-------------|
| `title` | `ReactNode` | Title |
| `content` | `ReactNode` | Content |
| `okText` | `string` | OK button text |
| `cancelText` | `string` | Cancel button text (`confirm` only) |
| `onOk` | `() => void \| Promise<void>` | On OK click |
| `onCancel` | `() => void` | On Cancel click |

## Relation to ctx.message, ctx.openView

| Use | Recommended |
|-----|-------------|
| **Short auto-dismiss** | `ctx.message` |
| **Info/success/error/warning modal** | `ctx.modal.info` / `success` / `error` / `warning` |
| **Confirm (user choice)** | `ctx.modal.confirm`; use `ctx.exit()` to control flow |
| **Complex form, list, etc.** | `ctx.openView` for custom view (page/drawer/dialog) |

## Examples

### Simple info

```ts
ctx.modal.info({
  title: 'Notice',
  content: 'Operation completed',
});
```

### Confirm and control flow

```ts
const confirmed = await ctx.modal.confirm({
  title: 'Confirm delete',
  content: 'Delete this record?',
  okText: 'OK',
  cancelText: 'Cancel',
});
if (!confirmed) {
  ctx.exit();
  return;
}
await ctx.runAction('destroy', { filterByTk: ctx.record?.id });
```

### Confirm with onOk

```ts
await ctx.modal.confirm({
  title: 'Confirm submit',
  content: 'Cannot be changed after submit. Continue?',
  async onOk() {
    await ctx.form.submit();
  },
});
```

### Error

```ts
try {
  await someOperation();
  ctx.modal.success({ title: 'Success', content: 'Done' });
} catch (e) {
  ctx.modal.error({ title: 'Error', content: e.message });
}
```

## Related

- [ctx.message](./message.md): short auto-dismiss messages
- [ctx.exit()](./exit.md): when user cancels confirm, use `if (!confirmed) ctx.exit()`
- [ctx.openView()](./open-view.md): open custom view for complex flows
