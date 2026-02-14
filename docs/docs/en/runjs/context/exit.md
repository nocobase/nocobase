# ctx.exit()

Stops the current event flow; later steps in that flow do not run. Often used when business conditions fail, the user cancels, or an unrecoverable error occurs.

## Use Cases

`ctx.exit()` is used in contexts that execute JS, such as:

| Scenario | Description |
|----------|-------------|
| **Event flow** | In flows triggered by form submit, button click, etc., stop when conditions are not met |
| **Linkage rules** | Field or filter linkage; stop when validation fails or execution should be skipped |
| **Action events** | In custom actions (e.g. delete confirm, pre-save validation), exit when user cancels or validation fails |

> Difference from `ctx.exitAll()`: `ctx.exit()` only stops the **current** event flow; other flows for the same event still run. `ctx.exitAll()` also stops **subsequent** flows for that event.

## Type

```ts
exit(): never;
```

Calling `ctx.exit()` throws an internal `FlowExitException`, which the event flow engine catches and uses to stop the current flow. Once called, the rest of the current JS does not run.

## Comparison with ctx.exitAll()

| Method | Scope |
|--------|--------|
| `ctx.exit()` | Stops only the current event flow; others unaffected |
| `ctx.exitAll()` | Stops the current flow and **subsequent** flows for the same event |

## Examples

### Exit on user cancel

```ts
if (!confirmed) {
  ctx.message.info('Cancelled');
  ctx.exit();
}
```

### Exit on validation failure

```ts
if (!params.value || params.value.length < 3) {
  ctx.message.error('Invalid: length must be at least 3');
  ctx.exit();
}
```

### Exit when business condition fails

```ts
const record = ctx.model?.getValue?.();
if (!record || record.status !== 'draft') {
  ctx.notification.warning({ message: 'Only draft can be submitted' });
  ctx.exit();
}
```

### When to use ctx.exit() vs ctx.exitAll()

```ts
// Only this flow should stop → ctx.exit()
if (!params.valid) {
  ctx.message.error('Invalid params');
  ctx.exit();
}

// Stop this and all subsequent flows for this event → ctx.exitAll()
if (!ctx.model?.context?.getPermission?.()) {
  ctx.notification.warning({ message: 'No permission' });
  ctx.exitAll();
}
```

### Exit after modal confirm

```ts
const ok = await ctx.modal?.confirm?.({
  title: 'Confirm delete',
  content: 'Cannot be recovered. Continue?',
});
if (!ok) {
  ctx.message.info('Cancelled');
  ctx.exit();
}
```

## Notes

- After `ctx.exit()`, the rest of the current JS does not run; use `ctx.message`, `ctx.notification`, or a dialog before calling to explain why.
- You usually do not need to catch `FlowExitException`; the event flow engine handles it.
- To stop all subsequent flows for the same event, use `ctx.exitAll()`.

## Related

- [ctx.exitAll()](./exit-all.md): stop current and subsequent flows for the event
- [ctx.message](./message.md): message API
- [ctx.modal](./modal.md): confirm dialog
