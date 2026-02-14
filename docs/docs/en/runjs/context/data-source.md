# ctx.dataSource

The data source instance (`DataSource`) bound to the current RunJS context; used to access collections, field metadata, and collection config **within that data source**. Usually the current page/block’s data source (e.g. main `main`).

## Use Cases

| Scenario | Description |
|----------|-------------|
| **Single data source** | Get collections, field metadata when the current data source is known |
| **Collection management** | Get/add/update/remove collections in the current data source |
| **Field by path** | Get field definition by `collectionName.fieldPath` (supports association path) |

> Note: `ctx.dataSource` is the single data source for the current context; to enumerate or access other data sources use [ctx.dataSourceManager](./data-source-manager.md).

## Type

```ts
dataSource: DataSource;

class DataSource {
  constructor(options?: Record<string, any>);

  get flowEngine(): FlowEngine;
  get displayName(): string;
  get key(): string;
  get name(): string;

  getCollections(): Collection[];
  getCollection(name: string): Collection | undefined;
  getAssociation(associationName: string): CollectionField | undefined;

  addCollection(collection: Collection | CollectionOptions): void;
  updateCollection(newOptions: CollectionOptions): void;
  upsertCollection(options: CollectionOptions): Collection | undefined;
  upsertCollections(collections: CollectionOptions[], options?: { clearFields?: boolean }): void;
  removeCollection(name: string): void;
  clearCollections(): void;

  getCollectionField(fieldPath: string): CollectionField | undefined;
}
```

## Common Properties

| Property | Type | Description |
|----------|------|-------------|
| `key` | `string` | Data source key (e.g. `main`) |
| `name` | `string` | Same as key |
| `displayName` | `string` | Display name (i18n) |
| `flowEngine` | `FlowEngine` | Current FlowEngine instance |

## Common Methods

| Method | Description |
|--------|-------------|
| `getCollections()` | All collections in this data source (sorted, hidden filtered) |
| `getCollection(name)` | Collection by name; `name` can be `collectionName.fieldName` for association target |
| `getAssociation(associationName)` | Association field by `collectionName.fieldName` |
| `getCollectionField(fieldPath)` | Field by `collectionName.fieldPath`; supports paths like `users.profile.avatar` |

## Relation to ctx.dataSourceManager

| Need | Recommended |
|------|-------------|
| **Single data source for context** | `ctx.dataSource` |
| **Entry to all data sources** | `ctx.dataSourceManager` |
| **Collection in current data source** | `ctx.dataSource.getCollection(name)` |
| **Collection in another data source** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **Field in current data source** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **Field across data sources** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## Examples

### Get collections and fields

```ts
const collections = ctx.dataSource.getCollections();

const users = ctx.dataSource.getCollection('users');
const primaryKey = users?.filterTargetKey ?? 'id';

const field = ctx.dataSource.getCollectionField('users.profile.avatar');
const userNameField = ctx.dataSource.getCollectionField('orders.createdBy.name');
```

### Get association field

```ts
const rolesField = ctx.dataSource.getAssociation('users.roles');
if (rolesField?.isAssociationField()) {
  const targetCol = rolesField.targetCollection;
  // ...
}
```

### Iterate collections

```ts
const collections = ctx.dataSource.getCollections();
for (const col of collections) {
  const fields = col.getFields();
  const requiredFields = fields.filter((f) => f.options?.required);
  // ...
}
```

### Validation or dynamic UI from field metadata

```ts
const field = ctx.dataSource.getCollectionField('users.status');
if (field) {
  const options = field.enum ?? [];
  const operators = field.getFilterOperators();
  // ...
}
```

## Notes

- `getCollectionField(fieldPath)` uses path format `collectionName.fieldPath`; first segment is collection name, rest is field path (supports association, e.g. `user.name`).
- `getCollection(name)` supports `collectionName.fieldName` and returns the association target collection.
- In RunJS, `ctx.dataSource` is usually determined by the current block/page; if there is no bound data source it may be `undefined`—check before use.

## Related

- [ctx.dataSourceManager](./data-source-manager.md): manager for all data sources
- [ctx.collection](./collection.md): collection for current context
- [ctx.collectionField](./collection-field.md): current field’s collection field definition
