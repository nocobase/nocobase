# ctx.exitAll()

Stops the current event flow and all **subsequent** event flows that were triggered in the same event dispatch. Use when a global error or permission check requires stopping every flow for that event.

## Use Cases

Use `ctx.exitAll()` in JS-capable contexts when you need to **stop both the current flow and any later flows for the same event**:

| Scenario | Description |
|----------|-------------|
| **Event flow** | Main flow fails (e.g. no permission); stop it and any subsequent flows for that event |
| **Linkage rules** | When linkage validation fails and you want to stop current and subsequent linkage |
| **Action events** | Pre-action check fails (e.g. delete permission); block the action and later steps |

> Difference from `ctx.exit()`: `ctx.exit()` only stops the current flow; `ctx.exitAll()` also stops **subsequent** flows for that event.

## Type

```ts
exitAll(): never;
```

Calling `ctx.exitAll()` throws an internal `FlowExitAllException`, which the engine uses to stop the current flow instance and subsequent flows for the same event. The rest of the current JS does not run.

## Comparison with ctx.exit()

| Method | Scope |
|--------|--------|
| `ctx.exit()` | Stops only the current flow; later flows still run |
| `ctx.exitAll()` | Stops the current flow and **subsequent** flows for the same event |

## Execution mode

- **Sequential**: flows for the same event run one after another; after any flow calls `ctx.exitAll()`, later flows do not run.
- **Parallel**: flows run in parallel; one flow calling `ctx.exitAll()` does not stop other already-running flows.

## Examples

### Stop all flows on permission failure

```ts
if (!hasPermission(ctx)) {
  ctx.notification.error({ message: 'No permission' });
  ctx.exitAll();
}
```

### Stop on global pre-check failure

```ts
const canDelete = await checkDeletable(ctx.model?.getValue?.());
if (!canDelete) {
  ctx.message.error('Cannot delete: related data exists');
  ctx.exitAll();
}
```

### When to use ctx.exit() vs ctx.exitAll()

```ts
// Only this flow → ctx.exit()
if (!params.valid) {
  ctx.message.error('Invalid params');
  ctx.exit();
}

// This and all subsequent flows → ctx.exitAll()
if (!ctx.model?.context?.getPermission?.()) {
  ctx.notification.warning({ message: 'No permission' });
  ctx.exitAll();
}
```

### Message then exit

```ts
if (!isValidInput(ctx.form?.getValues?.())) {
  ctx.message.warning('Please fix form errors first');
  ctx.exitAll();
}
```

## Notes

- After `ctx.exitAll()`, the rest of the current JS does not run; explain to the user with `ctx.message`, `ctx.notification`, or a dialog before calling.
- You usually do not need to catch `FlowExitAllException`; the engine handles it.
- To stop only the current flow, use `ctx.exit()`.
- In parallel mode, `ctx.exitAll()` only stops the current flow; it does not cancel other concurrent flows.

## Related

- [ctx.exit()](./exit.md): stop only the current flow
- [ctx.message](./message.md): message API
- [ctx.modal](./modal.md): confirm dialog
