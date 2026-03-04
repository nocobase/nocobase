# ctx.modal

A shortcut API based on Ant Design Modal, used to actively open modal boxes (information prompts, confirmation pop-ups, etc.) in RunJS. It is implemented by `ctx.viewer` / the view system.

## Use Cases

| Scenario | Description |
|------|------|
| **JSBlock / JSField** | Display operation results, error prompts, or secondary confirmations after user interaction. |
| **Workflow / Action Events** | Pop-up confirmation before submission; terminate subsequent steps via `ctx.exit()` if the user cancels. |
| **Linkage Rules** | Pop-up prompts for the user when validation fails. |

> Note: `ctx.modal` is available in RunJS environments with a view context (such as JSBlocks within a page, workflows, etc.); it may not exist in the backend or non-UI contexts. It is recommended to use optional chaining (`ctx.modal?.confirm?.()`) when calling it.

## Type Definition

```ts
modal: {
  info: (config: ModalConfig) => Promise<void>;
  success: (config: ModalConfig) => Promise<void>;
  error: (config: ModalConfig) => Promise<void>;
  warning: (config: ModalConfig) => Promise<void>;
  confirm: (config: ModalConfig) => Promise<boolean>;  // Returns true if the user clicks OK, false if they cancel
};
```

`ModalConfig` is consistent with the configuration of Ant Design `Modal` static methods.

## Common Methods

| Method | Return Value | Description |
|------|--------|------|
| `info(config)` | `Promise<void>` | Information prompt modal |
| `success(config)` | `Promise<void>` | Success prompt modal |
| `error(config)` | `Promise<void>` | Error prompt modal |
| `warning(config)` | `Promise<void>` | Warning prompt modal |
| `confirm(config)` | `Promise<boolean>` | Confirmation modal; returns `true` if the user clicks OK, and `false` if they cancel |

## Configuration Parameters

Consistent with Ant Design `Modal`, common fields include:

| Parameter | Type | Description |
|------|------|------|
| `title` | `ReactNode` | Title |
| `content` | `ReactNode` | Content |
| `okText` | `string` | OK button text |
| `cancelText` | `string` | Cancel button text (only for `confirm`) |
| `onOk` | `() => void \| Promise<void>` | Executed when clicking OK |
| `onCancel` | `() => void` | Executed when clicking Cancel |

## Relationship with ctx.message and ctx.openView

| Purpose | Recommended Usage |
|------|----------|
| **Lightweight temporary prompt** | `ctx.message`, disappears automatically |
| **Info/Success/Error/Warning modal** | `ctx.modal.info` / `success` / `error` / `warning` |
| **Secondary confirmation (requires user choice)** | `ctx.modal.confirm`, used with `ctx.exit()` to control the flow |
| **Complex interactions like forms or lists** | `ctx.openView` to open a custom view (page/drawer/modal) |

## Examples

### Simple Information Modal

```ts
ctx.modal.info({
  title: 'Prompt',
  content: 'Operation completed',
});
```

### Confirmation Modal and Flow Control

```ts
const confirmed = await ctx.modal.confirm({
  title: 'Confirm Delete',
  content: 'Are you sure you want to delete this record?',
  okText: 'Confirm',
  cancelText: 'Cancel',
});
if (!confirmed) {
  ctx.exit();  // Terminate subsequent steps if the user cancels
  return;
}
await ctx.runAction('destroy', { filterByTk: ctx.record?.id });
```

### Confirmation Modal with onOk

```ts
await ctx.modal.confirm({
  title: 'Confirm Submission',
  content: 'Changes cannot be modified after submission. Do you want to continue?',
  async onOk() {
    await ctx.form.submit();
  },
});
```

### Error Prompt

```ts
try {
  await someOperation();
  ctx.modal.success({ title: 'Success', content: 'Operation completed' });
} catch (e) {
  ctx.modal.error({ title: 'Error', content: e.message });
}
```

## Related

- [ctx.message](./message.md): Lightweight temporary prompt, disappears automatically
- [ctx.exit()](./exit.md): Commonly used as `if (!confirmed) ctx.exit()` to terminate the flow when a user cancels confirmation
- [ctx.openView()](./open-view.md): Opens a custom view, suitable for complex interactions