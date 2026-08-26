# ctx.collection

The Collection instance associated with the current RunJS execution context, used to access collection metadata, field definitions, primary keys, and other configurations. It usually originates from `ctx.blockModel.collection` or `ctx.collectionField?.collection`.

## Use Cases

| Scenario | Description |
|------|------|
| **JSBlock** | The collection bound to the block; can access `name`, `getFields`, `filterTargetKey`, etc. |
| **JSField / JSItem / JSColumn** | The collection the current field belongs to (or the parent block's collection), used to retrieve field lists, primary keys, etc. |
| **Table Column / Detail Block** | Used for rendering based on collection structure or passing `filterByTk` when opening popups. |

> Note: `ctx.collection` is available in scenarios where a data block, form block, or table block is bound to a collection. In an independent JSBlock that is not bound to a collection, it may be `null`. It is recommended to perform a null check before use.

## Type Definition

```ts
collection: Collection | null | undefined;
```

## Common Properties

| Property | Type | Description |
|------|------|------|
| `name` | `string` | Collection name (e.g., `users`, `orders`) |
| `title` | `string` | Collection title (includes internationalization) |
| `filterTargetKey` | `string \| string[]` | Primary key field name, used for `filterByTk` and `getFilterByTK` |
| `dataSourceKey` | `string` | Data source key (e.g., `main`) |
| `dataSource` | `DataSource` | The data source instance it belongs to |
| `template` | `string` | Collection template (e.g., `general`, `file`, `tree`) |
| `titleableFields` | `CollectionField[]` | List of fields that can be displayed as titles |
| `titleCollectionField` | `CollectionField` | The title field instance |

## Common Methods

| Method | Description |
|------|------|
| `getFields(): CollectionField[]` | Get all fields (including inherited ones) |
| `getField(name: string): CollectionField \| undefined` | Get a single field by field name |
| `getFieldByPath(path: string): CollectionField \| undefined` | Get a field by path (supports associations, e.g., `user.name`) |
| `getAssociationFields(types?): CollectionField[]` | Get association fields; `types` can be `['one']`, `['many']`, etc. |
| `getFilterByTK(record): any` | Extract the primary key value from a record, used for the API's `filterByTk` |

## Relationship with ctx.collectionField and ctx.blockModel

| Requirement | Recommended Usage |
|------|----------|
| **Collection associated with current context** | `ctx.collection` (equivalent to `ctx.blockModel?.collection` or `ctx.collectionField?.collection`) |
| **Collection definition of the current field** | `ctx.collectionField?.collection` (the collection the field belongs to) |
| **Association target collection** | `ctx.collectionField?.targetCollection` (the target collection of an association field) |

In scenarios like sub-tables, `ctx.collection` might be the association target collection; in standard forms/tables, it is usually the collection bound to the block.

## Examples

### Get Primary Key and Open Popup

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

### Iterate Through Fields for Validation or Linkage

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

### Get Association Fields

```ts
const oneToMany = ctx.collection?.getAssociationFields(['many']) ?? [];
// Used for building sub-tables, associated resources, etc.
```

## Notes

- `filterTargetKey` is the primary key field name of the collection. Some collections may use a `string[]` for composite primary keys. If not configured, `'id'` is commonly used as a fallback.
- In scenarios like **sub-tables or association fields**, `ctx.collection` may point to the association target collection, which differs from `ctx.blockModel.collection`.
- `getFields()` merges fields from inherited collections; local fields override inherited fields with the same name.

## Related

- [ctx.collectionField](./collection-field.md): The collection field definition of the current field
- [ctx.blockModel](./block-model.md): The parent block hosting the current JS, containing `collection`
- [ctx.model](./model.md): The current model, which may contain `collection`