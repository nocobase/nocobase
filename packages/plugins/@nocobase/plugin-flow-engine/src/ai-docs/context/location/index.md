# ctx.location

`ctx.location` reflects the current router location object (pathname, search params, hash). Use it to read or mutate query params during a flow.

## Example

- `@nocobase/plugin-flow-engine/src/ai-docs/context/location/basic.ts` inspects `ctx.location.pathname` and `ctx.location.search`, then updates the router state based on flow decisions.
