# ctx.exitAll()

Terminate the current flow and all nested child flows. Commonly used to immediately abort all flows for the current event due to global errors or permission checks.  
Can be called in scripts running in the FlowEngine context, such as JSField, JSItem, Action.

## Type Definition (Simplified)

```ts
exitAll(): never;
```

Calling `ctx.exitAll()` throws an internal `FlowExitAllException`, which is caught by the Flow engine to stop the current flow instance and all child flows it triggered (e.g., sub-workflows, flows inside dialogs).  
Once called, the remaining statements in the current JS code will not run.

Related methods:

- `ctx.exit()`: terminate the current flow instance (exit only the current flow)
- `ctx.exitAll()`: terminate **all** related flows for the current event (current flow and other flows triggered by this event)

> Tip:
> - Suitable for pre-checks, permission checks, or unmet conditions to prevent any further steps
> - Often used after showing a reason via `ctx.message`, `ctx.notification`, or a dialog, then call `ctx.exitAll()` to abort all flows in the current event
> - If you only need to stop the current sub-flow without affecting others, use `ctx.exit()`
> - Usually you don't need to catch `FlowExitAllException` in business code; letting the Flow engine handle it is safer
