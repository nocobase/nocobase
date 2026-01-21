# ctx.runjs

`ctx.runjs(code: string, vars?: Record<string, any>)` evaluates JavaScript in a sandboxed runtime with the provided variables injected. Available from any FlowRuntimeContext.

## Examples

- `@nocobase/plugin-flow-engine/context/runjs/shuffle.md` injects Lodash helpers and executes ad-hoc functions to randomize data.
- `@nocobase/plugin-flow-engine/context/runjs/echarts.md` loads ECharts dynamically and renders charts by running snippets returned from the flow.
