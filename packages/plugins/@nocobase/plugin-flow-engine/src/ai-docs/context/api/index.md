# ctx.api

`ctx.api` exposes the flow runtime HTTP client. Call `ctx.api.request(options)` to send authenticated requests through the same Axios instance used in the app (respecting interceptors, headers, etc.).

## Usage

- Build REST calls with `{ method, url, params, data }`.
- Await the Promise to get `{ data, status }` and hydrate your model or context.
- Works anywhere you have access to the FlowContext (models, steps, hooks).

## Example

- `@nocobase/plugin-flow-engine/context/api/example.md` demonstrates GET/POST requests through `ctx.api.request`.
