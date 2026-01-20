# ctx.message

`ctx.message` wraps Ant Design’s message API so flow steps can show toast notifications while running.

## Example

- `@nocobase/plugin-flow-engine/src/ai-docs/context/message/examples.ts` triggers `ctx.message.loading`, `ctx.message.success`, and `ctx.message.error` around an async task.
