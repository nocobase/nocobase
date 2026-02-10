# ctx.exit()

Terminate the current flow execution. Subsequent steps will not run. Use when conditions are not met, the user cancels, or a non-recoverable error occurs.

You can call it in FlowEngine scripts such as JSField, JSItem, or Action.

## Type definition (simplified)

```ts
exit(): never;
```

Calling `ctx.exit()` throws an internal `FlowExitException`, which is caught by the flow engine to stop the current flow. After calling it, remaining statements will not execute.

Related methods:

- `ctx.exit()` - terminate the current flow
- `ctx.exitAll()` - terminate all flows related to the current event

> Tips:
> - Use for pre-checks, permission checks, or user cancel scenarios
> - You can show a message first via `ctx.message`, `ctx.notification`, or a modal
> - To stop all flows under the current event, use `ctx.exitAll()`
