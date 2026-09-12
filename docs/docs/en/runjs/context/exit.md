# ctx.exit()

Terminates the execution of the current event flow; subsequent steps will not run. It is commonly used when business conditions are not met, the user cancels, or an irrecoverable error occurs.

## Use Cases

`ctx.exit()` is generally used in the following contexts where JS can be executed:

| Scenario | Description |
|------|------|
| **Event Flow** | In event flows triggered by form submissions, button clicks, etc., terminates subsequent steps when conditions are not met. |
| **Linkage Rules** | In field linkages, filter linkages, etc., terminates the current event flow when validation fails or execution needs to be skipped. |
| **Action Events** | In custom actions (e.g., delete confirmation, pre-save validation), exits when the user cancels or validation fails. |

> Difference from `ctx.exitAll()`: `ctx.exit()` only terminates the current event flow; other event flows under the same event are not affected. `ctx.exitAll()` terminates the current event flow as well as any subsequent event flows under the same event that have not yet been executed.

## Type Definition

```ts
exit(): never;
```

Calling `ctx.exit()` throws an internal `FlowExitException`, which is caught by the FlowEngine to stop the current event flow execution. Once called, the remaining statements in the current JS code will not execute.

## Comparison with ctx.exitAll()

| Method | Scope of Effect |
|------|----------|
| `ctx.exit()` | Terminates only the current event flow; subsequent event flows are unaffected. |
| `ctx.exitAll()` | Terminates the current event flow and aborts subsequent event flows under the same event that are set to **execute sequentially**. |

## Examples

### Exit on User Cancellation

```ts
// In a confirmation modal, terminate the event flow if the user clicks cancel
if (!confirmed) {
  ctx.message.info('Operation cancelled');
  ctx.exit();
}
```

### Exit on Parameter Validation Failure

```ts
// Prompt and terminate when validation fails
if (!params.value || params.value.length < 3) {
  ctx.message.error('Invalid parameters, length must be at least 3');
  ctx.exit();
}
```

### Exit When Business Conditions Are Not Met

```ts
// Terminate if conditions are not met; subsequent steps will not execute
const record = ctx.model?.getValue?.();
if (!record || record.status !== 'draft') {
  ctx.notification.warning({ message: 'Only drafts can be submitted' });
  ctx.exit();
}
```

### Choosing Between ctx.exit() and ctx.exitAll()

```ts
// Only the current event flow needs to exit → Use ctx.exit()
if (!params.valid) {
  ctx.message.error('Invalid parameters');
  ctx.exit();  // Other event flows are unaffected
}

// Need to terminate all subsequent event flows under the current event → Use ctx.exitAll()
if (!ctx.model?.context?.getPermission?.()) {
  ctx.notification.warning({ message: 'Insufficient permissions' });
  ctx.exitAll();  // Both the current event flow and subsequent event flows under the same event are terminated
}
```

### Exit Based on User Choice After Modal Confirmation

```ts
const ok = await ctx.modal?.confirm?.({
  title: 'Confirm Delete',
  content: 'This action cannot be undone. Do you want to continue?',
});
if (!ok) {
  ctx.message.info('Cancelled');
  ctx.exit();
}
```

## Notes

- After calling `ctx.exit()`, subsequent code in the current JS will not execute; it is recommended to explain the reason to the user via `ctx.message`, `ctx.notification`, or a modal before calling it.
- There is usually no need to catch `FlowExitException` in business code; let the FlowEngine handle it.
- If you need to terminate all subsequent event flows under the current event, use `ctx.exitAll()`.

## Related

- [ctx.exitAll()](./exit-all.md): Terminates the current event flow and subsequent event flows under the same event.
- [ctx.message](./message.md): Message prompts.
- [ctx.modal](./modal.md): Confirmation modals.