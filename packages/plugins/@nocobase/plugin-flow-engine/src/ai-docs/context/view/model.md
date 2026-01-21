# Model Delegation

## delegate child model

Spawn another FlowModel and delegate the view context so nested components share the same helpers.

```ts
const childModel = ctx.engine.createModel({ use: 'ChildModel' }, { delegate: ctx.view });
```
