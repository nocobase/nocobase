# ctx.blockModel

The parent block model (BlockModel instance) for the current JS field / JS block.

In form blocks, table blocks, and similar scenarios, `ctx.blockModel` points to the block model that hosts the current JS logic, and can be used to:

- Access the collection bound to the current block (`collection`)
- Access the block's resource (`resource`) and perform operations like refresh or get selected rows
- Access the form instance (`form`) inside the block to read/validate form values
- Listen to block events (e.g., `formValuesChange`) to implement linkage or re-rendering

## Type Definition (Simplified)

```ts
blockModel: BlockModel | FormBlockModel | TableBlockModel | CollectionBlockModel | DataBlockModel | null;
```

The actual type depends on the current block type. For example, a form block is usually `FormBlockModel`, and a table block is usually `TableBlockModel`.

## Common Properties and Methods

```ts
ctx.blockModel.collection; // Collection bound to the current block
ctx.blockModel.resource;   // Resource used by the current block (SingleRecordResource / MultiRecordResource, etc.)
ctx.blockModel.form;       // For form blocks: Antd Form instance, supports getFieldsValue/validateFields, etc.

// Listen to events (e.g., render a summary based on form changes)
ctx.blockModel.on?.('formValuesChange', (values) => {
  // react to latest form values
});

// Re-render the current block (some block models implement rerender)
ctx.blockModel.rerender?.();
```

> Tip:
> - In form-related scenarios, use `ctx.blockModel.form.getFieldsValue()` to get all form field values
> - In table-related scenarios, use `ctx.blockModel.resource.getSelectedRows()` to get currently selected rows
> - Different BlockModel subclasses may expose additional methods like expand/collapse or refresh; use them based on the block type
