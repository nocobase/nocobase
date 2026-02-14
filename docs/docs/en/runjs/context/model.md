# ctx.model

The `FlowModel` instance for the current RunJS execution context; the default entry in JSBlock, JSField, JSAction, etc. The concrete type varies: e.g. `BlockModel`, `ActionModel`, `JSEditableFieldModel`.

## Use Cases

| Scenario | Description |
|----------|-------------|
| **JSBlock** | `ctx.model` is the block model; access `resource`, `collection`, `setProps`, etc. |
| **JSField / JSItem / JSColumn** | `ctx.model` is the field model; access `setProps`, `dispatchEvent`, etc. |
| **Action events / ActionModel** | `ctx.model` is the action model; read/write step params, dispatch events, etc. |

> Tip: For the **parent block** that hosts the current JS (e.g. form/table block), use `ctx.blockModel`; for **other models** use `ctx.getModel(uid)`.

## Type

```ts
model: FlowModel;
```

`FlowModel` is the base; at runtime it is a subclass (e.g. `BlockModel`, `FormBlockModel`, `TableBlockModel`, `JSEditableFieldModel`, `ActionModel`). Properties and methods depend on the type.

## Common Properties

| Property | Type | Description |
|----------|------|-------------|
| `uid` | `string` | Model unique id; use with `ctx.getModel(uid)` or popup binding |
| `collection` | `Collection` | Collection bound to the model (when block/field is bound to data) |
| `resource` | `Resource` | Resource instance; refresh, get selected rows, etc. |
| `props` | `object` | UI/behavior config; update with `setProps` |
| `subModels` | `Record<string, FlowModel>` | Child models (e.g. form fields, table columns) |
| `parent` | `FlowModel` | Parent model (if any) |

## Common Methods

| Method | Description |
|--------|-------------|
| `setProps(partialProps: any): void` | Update model config and trigger re-render (e.g. `ctx.model.setProps({ loading: true })`) |
| `dispatchEvent(eventName: string, payload?: any, options?: any): Promise<any[]>` | Dispatch event to the model; runs flows listening for that event. Optional `payload` to handler; `options.debounce` for debounce |
| `getStepParams?.(flowKey, stepKey)` | Read flow step params (settings panel, custom actions, etc.) |
| `setStepParams?.(flowKey, stepKey, params)` | Write flow step params |

## Relation to ctx.blockModel, ctx.getModel

| Need | Recommended |
|------|-------------|
| **Model for current execution context** | `ctx.model` |
| **Parent block of current JS** | `ctx.blockModel`; use for `resource`, `form`, `collection` |
| **Any model by uid** | `ctx.getModel(uid)` or `ctx.getModel(uid, true)` (cross view stack) |

In JSField, `ctx.model` is the field model and `ctx.blockModel` is the form/table block that hosts it.

## Examples

### Update block/action state

```ts
ctx.model.setProps({ loading: true });
await doSomething();
ctx.model.setProps({ loading: false });
```

### Dispatch model event

```ts
await ctx.model.dispatchEvent('remove');

await ctx.model.dispatchEvent('customEvent', { id: 123 });
```

### Use uid for popup or cross-model

```ts
const myUid = ctx.model.uid;
const other = ctx.getModel('other-block-uid');
if (other) other.rerender?.();
```

## Related

- [ctx.blockModel](./block-model.md): parent block of current JS
- [ctx.getModel()](./get-model.md): get another model by uid
