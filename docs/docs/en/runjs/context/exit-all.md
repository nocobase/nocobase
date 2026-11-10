# ctx.exitAll()

Terminates the current event flow and all subsequent event flows triggered in the same event dispatch. It is commonly used when all event flows under the current event need to be aborted immediately due to a global error or permission validation failure.

## Use Cases

`ctx.exitAll()` is generally used in JS-executable contexts where it is necessary to **simultaneously abort the current event flow and subsequent event flows triggered by that event**:

| Scenario | Description |
|------|------|
| **Event Flow** | Main event flow validation fails (e.g., insufficient permissions), requiring the termination of the main flow and any subsequent flows under the same event that have not yet executed. |
| **Linkage Rules** | When linkage validation fails, the current linkage and subsequent linkages triggered by the same event must be terminated. |
| **Action Events** | Pre-action validation fails (e.g., permission check before deletion), requiring the prevention of the main action and subsequent steps. |

> `ctx.exit()` / `ctx.exitAll()` — Both calls stop the current step and skip the remaining flows in the same sequential event dispatch. Flows already running in parallel continue.

## Type Definition

```ts
exitAll(): never;
```

Calling `ctx.exitAll()` throws an internal `FlowExitAllException`, which is caught by the FlowEngine to stop the current event flow instance and subsequent event flows under the same event. Once called, the remaining statements in the current JS code will not be executed.

## Execution Mode

- **Sequential Execution**: Event flows under the same event are executed in order. After any event flow calls `ctx.exitAll()`, subsequent event flows will not execute.
- **Parallel Execution**: Event flows under the same event are executed in parallel. Calling `ctx.exitAll()` in one event flow will not interrupt other concurrent event flows (as they are independent).

## Examples

### Terminate all event flows when permission validation fails

```ts
// Abort the main event flow and subsequent event flows when permissions are insufficient
if (!hasPermission(ctx)) {
  ctx.notification.error({ message: 'No operation permission' });
  ctx.exitAll();
}
```

### Terminate when global pre-validation fails

```ts
// Example: If associated data is found to be non-deletable before deletion, prevent the main event flow and subsequent actions
const canDelete = await checkDeletable(ctx.model?.getValue?.());
if (!canDelete) {
  ctx.message.error('Cannot delete: associated data exists');
  ctx.exitAll();
}
```

### Prompt before terminating

```ts
if (!isValidInput(ctx.form?.getValues?.())) {
  ctx.message.warning('Please correct the errors in the form first');
  ctx.exitAll();
}
```

## Notes

- After calling `ctx.exitAll()`, subsequent code in the current JS will not execute. It is recommended to explain the reason to the user via `ctx.message`, `ctx.notification`, or a modal before calling it.
- Business code usually does not need to catch `FlowExitAllException`; let the FlowEngine handle it.
- In parallel mode, `ctx.exitAll()` only terminates the current event flow and does not interrupt other concurrent event flows.

## Related

- [ctx.exit()](./exit.md)
- [ctx.message](./message.md): Message prompts
- [ctx.modal](./modal.md): Confirmation modal
