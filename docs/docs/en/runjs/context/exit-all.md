# ctx.exitAll()

Terminate the current flow and all nested subflows. Use this when a global error or permission check requires stopping everything under the current event.

You can call it in FlowEngine scripts such as JSField, JSItem, or Action.

## Type definition (simplified)

```ts
exitAll(): never;
```

Calling `ctx.exitAll()` throws an internal `FlowExitAllException`, which is caught by the flow engine to stop the current flow instance and all subflows (e.g. child workflows, modal flows). After calling it, remaining statements will not execute.

Related methods:

- `ctx.exit()` - terminate only the current flow instance
- `ctx.exitAll()` - terminate **all** related flows under the current event

> Tips:
> - Use for pre-checks, permission checks, or conditions that must block any subsequent steps
> - Often you show a message first via `ctx.message`, `ctx.notification`, or a modal, then call `ctx.exitAll()`
> - If you only need to stop the current subflow, use `ctx.exit()`
> - You rarely need to catch `FlowExitAllException` in business code; let the engine handle it
