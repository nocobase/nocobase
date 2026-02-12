# ctx.blockModel

The parent block model (BlockModel instance) of the current JS field / JS block.

In form blocks, table blocks, and similar scenarios, `ctx.blockModel` points to the block model that hosts the current JS logic. It can be used to:

- Access the collection bound to the block (`collection`)
- Access the block resource (`resource`) for refresh, selected rows, etc.
- Access the form instance inside the block (`form`) for reading/validating form values
- Listen to block events (e.g. `formValuesChange`) for linkage or re-render

## Type definition (simplified)

```ts
blockModel: BlockModel | FormBlockModel | TableBlockModel | CollectionBlockModel | DataBlockModel | null;
```

The concrete type depends on the block type (e.g. form blocks usually use `FormBlockModel`, table blocks use `TableBlockModel`).

## Common properties and methods

```ts
ctx.blockModel.collection; // collection bound to the block
ctx.blockModel.resource;   // resource used by the block (SingleRecordResource / MultiRecordResource, etc.)
ctx.blockModel.form;       // form block: Antd Form instance, supports getFieldsValue/validateFields, etc.

// Listen to events (e.g. render summary based on form changes)
ctx.blockModel.on?.('formValuesChange', (values) => {
  // handle latest form values
});

// Re-render the current block (some block models implement rerender)
ctx.blockModel.rerender?.();
```

> Tips:
> - For form-related scenarios, `ctx.blockModel.form.getFieldsValue()` returns all form values
> - For table-related scenarios, `ctx.blockModel.resource.getSelectedRows()` returns selected rows
> - Different BlockModel subclasses may expose expand/collapse/refresh methods; use them as supported
