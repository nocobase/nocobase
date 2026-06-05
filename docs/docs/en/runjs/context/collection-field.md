# ctx.collectionField

The collection field (CollectionField) instance for the current RunJS context; used to access field metadata, type, validation rules, and association info. Only present when the field is bound to a collection definition; custom/virtual fields may have `null`.

## Use Cases

| Scenario | Description |
|----------|-------------|
| **JSField** | Use `interface`, `enum`, `targetCollection`, etc. for linkage or validation |
| **JSItem** | Access metadata of the column’s field in sub-table items |
| **JSColumn** | Choose render by `collectionField.interface`, or use `targetCollection` |

> Note: `ctx.collectionField` is only available when the field is bound to a collection; in standalone JSBlock or actions with no field binding it is usually `undefined`—check before use.

## Type

```ts
collectionField: CollectionField | null | undefined;
```

## Common Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Field name (e.g. `status`, `userId`) |
| `title` | `string` | Field title (i18n) |
| `type` | `string` | Data type (`string`, `integer`, `belongsTo`, etc.) |
| `interface` | `string` | UI type (`input`, `select`, `m2o`, `o2m`, `m2m`, etc.) |
| `collection` | `Collection` | Field’s collection |
| `targetCollection` | `Collection` | Target collection for association fields only |
| `target` | `string` | Target collection name (association) |
| `enum` | `array` | Enum options (select, radio, etc.) |
| `defaultValue` | `any` | Default value |
| `collectionName` | `string` | Collection name |
| `foreignKey` | `string` | Foreign key (e.g. belongsTo) |
| `sourceKey` | `string` | Source key (e.g. hasMany) |
| `targetKey` | `string` | Target key |
| `fullpath` | `string` | Full path (e.g. `main.users.status`) for API/variables |
| `resourceName` | `string` | Resource name (e.g. `users.status`) |
| `readonly` | `boolean` | Read-only |
| `titleable` | `boolean` | Can be used as title |
| `validation` | `object` | Validation config |
| `uiSchema` | `object` | UI config |
| `targetCollectionTitleField` | `CollectionField` | Title field of target collection (association) |

## Common Methods

| Method | Description |
|--------|-------------|
| `isAssociationField(): boolean` | Whether it is an association (belongsTo, hasMany, hasOne, belongsToMany, etc.) |
| `isRelationshipField(): boolean` | Whether it is a relationship (o2o, m2o, o2m, m2m, etc.) |
| `getComponentProps(): object` | Default props for the field component |
| `getFields(): CollectionField[]` | Fields of target collection (association only) |
| `getFilterOperators(): object[]` | Filter operators (e.g. `$eq`, `$ne`) |

## Examples

### Branch by field type

```ts
if (!ctx.collectionField) return null;
const { interface: iface } = ctx.collectionField;
if (['m2o', 'o2m', 'm2m'].includes(iface)) {
  const target = ctx.collectionField.targetCollection;
  // ...
} else if (iface === 'select' || iface === 'radioGroup') {
  const options = ctx.collectionField.enum || [];
  // ...
}
```

### Check association and use target collection

```ts
if (ctx.collectionField?.isAssociationField()) {
  const targetCol = ctx.collectionField.targetCollection;
  const titleField = targetCol?.titleCollectionField?.name;
  // ...
}
```

### Get enum options

```ts
const options = ctx.collectionField?.enum ?? [];
const labels = options.map((o) => (typeof o === 'object' ? o.label : o));
```

### Conditional render by readonly

```ts
const { Input } = ctx.libs.antd;
if (ctx.collectionField?.readonly) {
  ctx.render(<span>{ctx.getValue?.() ?? '-'}</span>);
} else {
  ctx.render(<Input onChange={(e) => ctx.setValue?.(e.target.value)} />);
}
```

### Title field of target collection

```ts
const titleField = ctx.collectionField?.targetCollectionTitleField;
const titleKey = titleField?.name ?? 'title';
const assocValue = ctx.getValue?.() ?? ctx.record?.[ctx.collectionField?.name];
const label = assocValue?.[titleKey];
```

## Relation to ctx.collection

| Need | Recommended |
|------|-------------|
| **Collection of current field** | `ctx.collectionField?.collection` or `ctx.collection` |
| **Field metadata (name, type, interface, enum, etc.)** | `ctx.collectionField` |
| **Target collection** | `ctx.collectionField?.targetCollection` |

`ctx.collection` is usually the block’s collection; `ctx.collectionField` is the field definition; they can differ in sub-tables and associations.

## Notes

- In **JSBlock**, **JSAction (no field binding)**, `ctx.collectionField` is usually `undefined`; use optional chaining.
- Custom JS fields not bound to a collection field may have `ctx.collectionField` as `null`.
- `targetCollection` exists only for association fields (m2o, o2m, m2m); `enum` only for select, radioGroup, etc.

## Related

- [ctx.collection](./collection.md): collection for current context
- [ctx.model](./model.md): model for current execution context
- [ctx.blockModel](./block-model.md): parent block
- [ctx.getValue()](./get-value.md), [ctx.setValue()](./set-value.md): read/write current field value
