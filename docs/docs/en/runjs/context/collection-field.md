# ctx.collectionField

The `CollectionField` instance associated with the current RunJS execution context, used to access field metadata, types, validation rules, and association information. It only exists when the field is bound to a collection definition; custom/virtual fields may be `null`.

## Use Cases

| Scenario | Description |
|------|------|
| **JSField** | Perform linkage or validation in form fields based on `interface`, `enum`, `targetCollection`, etc. |
| **JSItem** | Access metadata of the field corresponding to the current column in sub-table items. |
| **JSColumn** | Select rendering methods based on `collectionField.interface` or access `targetCollection` in table columns. |

> Note: `ctx.collectionField` is only available when the field is bound to a Collection definition; it is usually `undefined` in scenarios like JSBlock independent blocks or action events without field binding. It is recommended to check for null values before use.

## Type Definition

```ts
collectionField: CollectionField | null | undefined;
```

## Common Properties

| Property | Type | Description |
|------|------|------|
| `name` | `string` | Field name (e.g., `status`, `userId`) |
| `title` | `string` | Field title (including internationalization) |
| `type` | `string` | Field data type (`string`, `integer`, `belongsTo`, etc.) |
| `interface` | `string` | Field interface type (`input`, `select`, `m2o`, `o2m`, `m2m`, etc.) |
| `collection` | `Collection` | The collection the field belongs to |
| `targetCollection` | `Collection` | The target collection of the association field (only for association types) |
| `target` | `string` | Target collection name (for association fields) |
| `enum` | `array` | Enumeration options (select, radio, etc.) |
| `defaultValue` | `any` | Default value |
| `collectionName` | `string` | Name of the collection it belongs to |
| `foreignKey` | `string` | Foreign key field name (belongsTo, etc.) |
| `sourceKey` | `string` | Association source key (hasMany, etc.) |
| `targetKey` | `string` | Association target key |
| `fullpath` | `string` | Full path (e.g., `main.users.status`), used for API or variable references |
| `resourceName` | `string` | Resource name (e.g., `users.status`) |
| `readonly` | `boolean` | Whether it is read-only |
| `titleable` | `boolean` | Whether it can be displayed as a title |
| `validation` | `object` | Validation rule configuration |
| `uiSchema` | `object` | UI configuration |
| `targetCollectionTitleField` | `CollectionField` | The title field of the target collection (for association fields) |

## Common Methods

| Method | Description |
|------|------|
| `isAssociationField(): boolean` | Whether it is an association field (belongsTo, hasMany, hasOne, belongsToMany, etc.) |
| `isRelationshipField(): boolean` | Whether it is a relationship field (including o2o, m2o, o2m, m2m, etc.) |
| `getComponentProps(): object` | Get the default props of the field component |
| `getFields(): CollectionField[]` | Get the field list of the target collection (association fields only) |
| `getFilterOperators(): object[]` | Get the filter operators supported by this field (e.g., `$eq`, `$ne`, etc.) |

## Examples

### Branch rendering based on field type

```ts
if (!ctx.collectionField) return null;
const { interface: iface } = ctx.collectionField;
if (['m2o', 'o2m', 'm2m'].includes(iface)) {
  // Association field: display associated records
  const target = ctx.collectionField.targetCollection;
  // ...
} else if (iface === 'select' || iface === 'radioGroup') {
  const options = ctx.collectionField.enum || [];
  // ...
}
```

### Determine if it is an association field and access the target collection

```ts
if (ctx.collectionField?.isAssociationField()) {
  const targetCol = ctx.collectionField.targetCollection;
  const titleField = targetCol?.titleCollectionField?.name;
  // Process according to the target collection structure
}
```

### Get enumeration options

```ts
const options = ctx.collectionField?.enum ?? [];
const labels = options.map((o) => (typeof o === 'object' ? o.label : o));
```

### Conditional rendering based on read-only/view mode

```ts
const { Input } = ctx.libs.antd;
if (ctx.collectionField?.readonly) {
  ctx.render(<span>{ctx.getValue?.() ?? '-'}</span>);
} else {
  ctx.render(<Input onChange={(e) => ctx.setValue?.(e.target.value)} />);
}
```

### Get the title field of the target collection

```ts
// When displaying an association field, use targetCollectionTitleField to get the title field name
const titleField = ctx.collectionField?.targetCollectionTitleField;
const titleKey = titleField?.name ?? 'title';
const assocValue = ctx.getValue?.() ?? ctx.record?.[ctx.collectionField?.name];
const label = assocValue?.[titleKey];
```

## Relationship with ctx.collection

| Requirement | Recommended Usage |
|------|----------|
| **Current field's collection** | `ctx.collectionField?.collection` or `ctx.collection` |
| **Field metadata (name, type, interface, enum, etc.)** | `ctx.collectionField` |
| **Target collection** | `ctx.collectionField?.targetCollection` |

`ctx.collection` usually represents the collection bound to the current block; `ctx.collectionField` represents the definition of the current field in the collection. In scenarios like sub-tables or association fields, the two may differ.

## Notes

- In scenarios such as **JSBlock** or **JSAction (without field binding)**, `ctx.collectionField` is usually `undefined`. It is recommended to use optional chaining before access.
- If a custom JS field is not bound to a collection field, `ctx.collectionField` may be `null`.
- `targetCollection` only exists for association type fields (e.g., m2o, o2m, m2m); `enum` only exists for fields with options like select or radioGroup.

## Related

- [ctx.collection](./collection.md): Collection associated with the current context
- [ctx.model](./model.md): Model where the current execution context is located
- [ctx.blockModel](./block-model.md): Parent block carrying the current JS
- [ctx.getValue()](./get-value.md), [ctx.setValue()](./set-value.md): Read and write the current field value