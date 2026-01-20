# ctx.router

`ctx.router` exposes the React Router instance so you can imperatively navigate, push history entries, or inspect the navigation stack within a flow.

## Example

- `@nocobase/plugin-flow-engine/src/ai-docs/context/router/basic.ts` pushes new routes, replaces entries, and reads the current location from `ctx.router`.
