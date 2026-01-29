# ctx.exit()

Terminate execution of the current flow; subsequent steps will not run. Commonly used when business conditions are not met, the user cancels, or an unrecoverable error occurs.

Can be called in scripts running in the FlowEngine context, such as JSField, JSItem, Action.

## Type Definition (Simplified)

```ts
exit(): never;
```

Calling `ctx.exit()` throws an internal `FlowExitException`, which is caught by the Flow engine to stop the current flow execution.  
Once called, the remaining statements in the current JS code will not run.

Related methods:

- `ctx.exit()`: terminate the current flow
- `ctx.exitAll()`: terminate all related flows for the current event (the current flow and any flows triggered by this event)

> Tip:
> - Suitable for pre-checks, permission checks, or user cancel scenarios to abort the flow immediately
> - You can use `ctx.message`, `ctx.notification`, or a dialog to explain the reason before calling `ctx.exit()`
> - If you want to stop all flows for the current event, use `ctx.exitAll()`
