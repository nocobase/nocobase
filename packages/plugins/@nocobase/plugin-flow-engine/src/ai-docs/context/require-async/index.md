# ctx.requireAsync()

`ctx.requireAsync(url)` loads an external ES module at runtime and returns the resolved exports. It is available in any FlowContext.

## Use cases

- Lazy-load visualization libraries (ECharts, Three.js, etc.).
- Fetch helpers that are too heavy to bundle eagerly.

## Example

- `@nocobase/plugin-flow-engine/src/ai-docs/context/require-async/echarts.ts` downloads ECharts on demand and returns the loaded module.
