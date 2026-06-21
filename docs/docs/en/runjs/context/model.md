# ctx.model

The `FlowModel` instance where the current RunJS execution context is located. It serves as the default entry point for scenarios like JSBlock, JSField, and JSAction. The specific type varies depending on the context: it could be a subclass such as `BlockModel`, `ActionModel`, or `JSEditableFieldModel`.

## Scenarios

| Scenario | Description |
|------|------|
| **JSBlock** | `ctx.model` is the current block model. You can access `resource`, `collection`, `setProps`, etc. |
| **JSField / JSItem / JSColumn** | `ctx.model` is the field model. You can access `setProps`, `dispatchEvent`, etc. |
| **Action Events / ActionModel** | `ctx.model` is the action model. You can read/write step parameters, dispatch events, etc. |

> Tip: If you need to access the **parent block carrying the current JS** (e.g., a Form or Table block), use `ctx.blockModel`. To access **other models**, use `ctx.getModel(uid)`.

## Type Definition

```ts
model: FlowModel;
```

`FlowModel` is the base class. At runtime, it is an instance of various subclasses (such as `BlockModel`, `FormBlockModel`, `TableBlockModel`, `JSEditableFieldModel`, `ActionModel`, etc.). Available properties and methods depend on the specific type.

## Common Properties

| Property | Type | Description |
|------|------|------|
| `uid` | `string` | Unique identifier of the model. Can be used for `ctx.getModel(uid)` or popup UID binding. |
| `collection` | `Collection` | The collection bound to the current model (exists when the block/field is bound to data). |
| `resource` | `Resource` | Associated resource instance, used for refreshing, getting selected rows, etc. |
| `props` | `object` | UI/behavior configuration of the model. Can be updated using `setProps`. |
| `subModels` | `Record<string, FlowModel>` | Collection of child models (e.g., fields within a form, columns within a table). |
| `parent` | `FlowModel` | Parent model (if any). |

## Common Methods

| Method | Description |
|------|------|
| `setProps(partialProps: any): void` | Updates model configuration and triggers re-rendering (e.g., `ctx.model.setProps({ loading: true })`). |
| `dispatchEvent(eventName: string, payload?: any, options?: any): Promise<any[]>` | Dispatches an event to the model, triggering workflows configured on that model that listen for the event name. Optional `payload` is passed to the workflow handler; `options.debounce` enables debouncing. |
| `getStepParams?.(flowKey, stepKey)` | Reads configuration flow step parameters (used in settings panels, custom actions, etc.). |
| `setStepParams?.(flowKey, stepKey, params)` | Writes configuration flow step parameters. |

## Relationship with ctx.blockModel and ctx.getModel

| Requirement | Recommended Usage |
|------|----------|
| **Model of the current execution context** | `ctx.model` |
| **Parent block of the current JS** | `ctx.blockModel`. Often used to access `resource`, `form`, or `collection`. |
| **Get any model by UID** | `ctx.getModel(uid)` or `ctx.getModel(uid, true)` (search across view stacks). |

In a JSField, `ctx.model` is the field model, while `ctx.blockModel` is the Form or Table block containing that field.

## Examples

### Updating Block/Action Status

```ts
ctx.model.setProps({ loading: true });
await doSomething();
ctx.model.setProps({ loading: false });
```

### Dispatching Model Events

```ts
// Dispatch an event to trigger a workflow configured on this model that listens for this event name
await ctx.model.dispatchEvent('remove');

// When a payload is provided, it is passed to the workflow handler's ctx.inputArgs
await ctx.model.dispatchEvent('customEvent', { id: 123 });
```

### Using UID for Popup Binding or Cross-Model Access

```ts
const myUid = ctx.model.uid;
// In popup configuration, you can pass openerUid: myUid for association
const other = ctx.getModel('other-block-uid');
if (other) other.rerender?.();
```

## Related

- [ctx.blockModel](./block-model.md): The parent block model where the current JS is located.
- [ctx.getModel()](./get-model.md): Get other models by UID.