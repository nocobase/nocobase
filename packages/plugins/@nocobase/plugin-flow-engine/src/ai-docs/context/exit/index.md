# ctx.exit()

Call `ctx.exit()` inside a flow step to stop subsequent steps from running. Typical usage is aborting an operation after a user cancels confirmation or after validation fails.

## Example

- `@nocobase/plugin-flow-engine/context/exit/examples.md` shows a delete handler that confirms, shows a toast, and calls `ctx.exit()` when cancelled.
