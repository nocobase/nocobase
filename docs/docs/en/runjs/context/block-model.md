# ctx.blockModel

The parent block model (BlockModel instance) where the current JS Field / JS Block is located. In scenarios such as JSField, JSItem, and JSColumn, `ctx.blockModel` points to the form block or table block carrying the current JS logic. In a standalone JSBlock, it may be `null` or the same as `ctx.model`.

## Scenarios

| Scenario | Description |
|------|------|
| **JSField** | Access the `form`, `collection`, and `resource` of the parent form block within a form field to implement linkage or validation. |
| **JSItem** | Access the resource and collection information of the parent table/form block within a sub-table item. |
| **JSColumn** | Access the `resource` (e.g., `getSelectedRows`) and `collection` of the parent table block within a table column. |
| **Form Actions / FlowEngine** | Access `form` for pre-submission validation, `resource` for refreshing, etc. |

> Note: `ctx.blockModel` is only available in RunJS contexts where a parent block exists. In standalone JSBlocks (without a parent form/table), it may be `null`. It is recommended to perform a null check before use.

## Type Definition

```ts
blockModel: BlockModel | FormBlockModel | TableBlockModel | CollectionBlockModel | DataBlockModel | null;
```

The specific type depends on the parent block type: form blocks are mostly `FormBlockModel` or `EditFormModel`, while table blocks are mostly `TableBlockModel`.

## Common Properties

| Property | Type | Description |
|------|------|------|
| `uid` | `string` | Unique identifier of the block model. |
| `collection` | `Collection` | The collection bound to the current block. |
| `resource` | `Resource` | The resource instance used by the block (`SingleRecordResource` / `MultiRecordResource`, etc.). |
| `form` | `FormInstance` | Form Block: Ant Design Form instance, supporting `getFieldsValue`, `validateFields`, `setFieldsValue`, etc. |
| `emitter` | `EventEmitter` | Event emitter, used to listen for `formValuesChange`, `onFieldReset`, etc. |

## Relationship with ctx.model and ctx.form

| Requirement | Recommended Usage |
|------|----------|
| **Parent block of the current JS** | `ctx.blockModel` |
| **Read/Write form fields** | `ctx.form` (equivalent to `ctx.blockModel?.form`, more convenient in form blocks) |
| **Model of the current execution context** | `ctx.model` (Field model in JSField, Block model in JSBlock) |

In a JSField, `ctx.model` is the field model, and `ctx.blockModel` is the form or table block carrying that field; `ctx.form` is typically `ctx.blockModel.form`.

## Examples

### Table: Get selected rows and process

```ts
const rows = ctx.blockModel?.resource?.getSelectedRows?.() || [];
if (rows.length === 0) {
  ctx.message.warning('Please select data first');
  return;
}
```

### Form Scenario: Validate and Refresh

```ts
if (ctx.blockModel?.form) {
  await ctx.blockModel.form.validateFields();
  await ctx.blockModel.resource?.refresh?.();
}
```

### Listen for Form Changes

```ts
ctx.blockModel?.emitter?.on?.('formValuesChange', (payload) => {
  // Implement linkage or re-rendering based on the latest form values
});
```

### Trigger Block Re-render

```ts
ctx.blockModel?.rerender?.();
```

## Notes

- In a **standalone JSBlock** (without a parent form or table block), `ctx.blockModel` may be `null`. It is recommended to use optional chaining when accessing its properties: `ctx.blockModel?.resource?.refresh?.()`.
- In **JSField / JSItem / JSColumn**, `ctx.blockModel` refers to the form or table block carrying the current field. In a **JSBlock**, it may be itself or an upper-level block, depending on the actual hierarchy.
- `resource` only exists in data blocks; `form` only exists in form blocks. Table blocks typically do not have a `form`.

## Related

- [ctx.model](./model.md): The model of the current execution context.
- [ctx.form](./form.md): Form instance, commonly used in form blocks.
- [ctx.resource](./resource.md): Resource instance (equivalent to `ctx.blockModel?.resource`, use directly if available).
- [ctx.getModel()](./get-model.md): Get other block models by UID.