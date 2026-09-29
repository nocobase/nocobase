---
title: 'Workflow definition DSL'
description: 'Define workflow inputs, administrator parameters, node order, branches, and result references.'
---

# Workflow definition DSL

:::warning Translation in progress
The complete English version of this page is being prepared.
:::

The TypeScript DSL describes a versioned process contract; executable business work remains in typed run modules and application services.

## Typed handler context

Chain `addNode()` calls and keep the returned builder. Nodes retain their literal keys and infer outputs from handler return types. `finalize()` and `compile()` check handler context compatibility against the complete workflow, including branch nodes. This does not check execution order: every node result may be `undefined`. Discarding an `addNode()` result and finalizing the builder it was called on fails, naming each node that was never compiled.

Handlers can import a shared context using `import type`. Declare it member by member to avoid eagerly expanding the cycle between the workflow and its handlers:

```ts
export interface FlowContext {
  input: ContextOf<typeof flow>['input'];
  parameters: ContextOf<typeof flow>['parameters'];
  nodeResults: ContextOf<typeof flow>['nodeResults'];
}
```

Import `ContextOf` from `@nocobase/app-plugin-workflow/dsl`. Give handlers explicit return types when their context refers back to the workflow. TypeBox input and parameter schemas supply static surface types; raw JSON Schema retains generic surfaces. These types add no runtime result schemas or validation. Explicit reference lowering retains its separate ordering checks.

## Type-only handler imports

Declare handlers with a type-only import so checking or loading a definition does not execute server modules or their dependencies. The generic preserves context and result types, including the boolean return constraint for conditions; execution still loads the module named by the path and calls its `run` export. Keep the type import and module path aligned: their correspondence is not checked automatically.

```ts
import type { run as loadMetrics } from './server/load-metrics';

const loadMetricsHandler = defineHandler<typeof loadMetrics>(
  './server/load-metrics',
);
```
