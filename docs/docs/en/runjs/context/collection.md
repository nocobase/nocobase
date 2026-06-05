# ctx.collection

The collection (data table) instance associated with the current RunJS execution context; used to access collection metadata, field definitions, primary key, etc. Usually from `ctx.blockModel.collection` or `ctx.collectionField?.collection`.

## Use Cases

| Scenario | Description |
|----------|-------------|
| **JSBlock** | Block-bound collection; access `name`, `getFields`, `filterTargetKey`, etc. |
| **JSField / JSItem / JSColumn** | Collection of current field or parent block; get field list, primary key, etc. |
| **Table column / detail block** | Render by collection structure, pass `filterByTk` when opening popup, etc. |

> Note: `ctx.collection` is available when the context is bound to a data block, form block, or table block; a standalone JSBlock with no bound collection may have `null`—check before use.

## Type

```ts
collection: Collection | null | undefined;
```

## Common Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Collection name (e.g. `users`, `orders`) |
| `title` | `string` | Collection title (i18n) |
| `filterTargetKey` | `string \| string[]` | Primary key field name(s); used for `filterByTk`, `getFilterByTK` |
| `dataSourceKey` | `string` | Data source key (e.g. `main`) |
| `dataSource` | `DataSource` | Data source instance |
| `template` | `string` | Collection template (e.g. `general`, `file`, `tree`) |
| `titleableFields` | `CollectionField[]` | Fields that can be used as title |
| `titleCollectionField` | `CollectionField` | Title field instance |

## Common Methods

| Method | Description |
|--------|-------------|
| `getFields(): CollectionField[]` | All fields (including inherited) |
| `getField(name: string): CollectionField \| undefined` | Single field by name |
| `getFieldByPath(path: string): CollectionField \| undefined` | Field by path (supports association, e.g. `user.name`) |
| `getAssociationFields(types?): CollectionField[]` | Association fields; `types` e.g. `['one']`, `['many']` |
| `getFilterByTK(record): any` | Primary key value from record for API `filterByTk` |

## Relation to ctx.collectionField, ctx.blockModel

| Need | Recommended |
|------|-------------|
| **Collection for current context** | `ctx.collection` (same as `ctx.blockModel?.collection` or `ctx.collectionField?.collection`) |
| **Collection of current field** | `ctx.collectionField?.collection` |
| **Target collection of association** | `ctx.collectionField?.targetCollection` |

In sub-tables etc., `ctx.collection` may be the association target; in normal form/table it is usually the block’s collection.

## Examples

### Get primary key and open popup

```ts
const primaryKey = ctx.collection?.filterTargetKey ?? 'id';
await ctx.openView(popupUid, {
  mode: 'dialog',
  params: {
    filterByTk: ctx.record?.[primaryKey],
    record: ctx.record,
  },
});
```

### Iterate fields for validation or linkage

```ts
const fields = ctx.collection?.getFields() ?? [];
const requiredFields = fields.filter((f) => f.options?.required);
for (const f of requiredFields) {
  const v = ctx.form?.getFieldValue(f.name);
  if (v == null || v === '') {
    ctx.message.warning(`${f.title} is required`);
    return;
  }
}
```

### Get association fields

```ts
const oneToMany = ctx.collection?.getAssociationFields(['many']) ?? [];
// For sub-tables, association resources, etc.
```

## Notes

- `filterTargetKey` is the collection’s primary key field name; some collections use `string[]` composite keys; fallback is often `'id'`.
- In **sub-tables, association fields**, `ctx.collection` may point to the association target, different from `ctx.blockModel.collection`.
- `getFields()` merges inherited collection fields; local fields override inherited ones with the same name.

## Related

- [ctx.collectionField](./collection-field.md): current field’s collection field definition
- [ctx.blockModel](./block-model.md): parent block that hosts current JS; has `collection`
- [ctx.model](./model.md): current model; may have `collection`
