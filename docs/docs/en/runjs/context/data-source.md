# ctx.dataSource

The `DataSource` instance bound to the current RunJS execution context, used to access collections, field metadata, and manage collection configurations **within the current data source**. It usually corresponds to the data source selected for the current page or block (e.g., the main database `main`).

## Use Cases

| Scenario | Description |
|------|------|
| **Single Data Source Operations** | Get collection and field metadata when the current data source is known. |
| **Collection Management** | Get, add, update, or delete collections under the current data source. |
| **Get Fields by Path** | Use the `collectionName.fieldPath` format to get field definitions (supports association paths). |

> Note: `ctx.dataSource` represents a single data source for the current context. To enumerate or access other data sources, please use [ctx.dataSourceManager](./data-source-manager.md).

## Type Definition

```ts
dataSource: DataSource;

class DataSource {
  constructor(options?: Record<string, any>);

  // Read-only properties
  get flowEngine(): FlowEngine;   // Current FlowEngine instance
  get displayName(): string;      // Display name (supports i18n)
  get key(): string;              // Data source key, e.g., 'main'
  get name(): string;             // Same as key

  // Collection reading
  getCollections(): Collection[];                      // Get all collections
  getCollection(name: string): Collection | undefined; // Get collection by name
  getAssociation(associationName: string): CollectionField | undefined; // Get association field (e.g., users.roles)

  // Collection management
  addCollection(collection: Collection | CollectionOptions): void;
  updateCollection(newOptions: CollectionOptions): void;
  upsertCollection(options: CollectionOptions): Collection | undefined;
  upsertCollections(collections: CollectionOptions[], options?: { clearFields?: boolean }): void;
  removeCollection(name: string): void;
  clearCollections(): void;

  // Field metadata
  getCollectionField(fieldPath: string): CollectionField | undefined;
}
```

## Common Properties

| Property | Type | Description |
|------|------|------|
| `key` | `string` | Data source key, e.g., `'main'` |
| `name` | `string` | Same as key |
| `displayName` | `string` | Display name (supports i18n) |
| `flowEngine` | `FlowEngine` | Current FlowEngine instance |

## Common Methods

| Method | Description |
|------|------|
| `getCollections()` | Gets all collections under the current data source (sorted, with hidden ones filtered). |
| `getCollection(name)` | Gets a collection by name; `name` can be `collectionName.fieldName` to get the target collection of an association. |
| `getAssociation(associationName)` | Gets an association field definition by `collectionName.fieldName`. |
| `getCollectionField(fieldPath)` | Gets a field definition by `collectionName.fieldPath`, supporting association paths like `users.profile.avatar`. |

## Relationship with ctx.dataSourceManager

| Requirement | Recommended Usage |
|------|----------|
| **Single data source bound to current context** | `ctx.dataSource` |
| **Entry point for all data sources** | `ctx.dataSourceManager` |
| **Get collection within current data source** | `ctx.dataSource.getCollection(name)` |
| **Get collection across data sources** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **Get field within current data source** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **Get field across data sources** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## Example

### Get Collections and Fields

```ts
// Get all collections
const collections = ctx.dataSource.getCollections();

// Get collection by name
const users = ctx.dataSource.getCollection('users');
const primaryKey = users?.filterTargetKey ?? 'id';

// Get field definition by "collectionName.fieldPath" (supports associations)
const field = ctx.dataSource.getCollectionField('users.profile.avatar');
const userNameField = ctx.dataSource.getCollectionField('orders.createdBy.name');
```

### Get Association Fields

```ts
// Get association field definition by collectionName.fieldName
const rolesField = ctx.dataSource.getAssociation('users.roles');
if (rolesField?.isAssociationField()) {
  const targetCol = rolesField.targetCollection;
  // Process based on target collection structure
}
```

### Iterate Through Collections for Dynamic Processing

```ts
const collections = ctx.dataSource.getCollections();
for (const col of collections) {
  const fields = col.getFields();
  const requiredFields = fields.filter((f) => f.options?.required);
  // ...
}
```

### Perform Validation or Dynamic UI Based on Field Metadata

```ts
const field = ctx.dataSource.getCollectionField('users.status');
if (field) {
  const options = field.enum ?? [];
  const operators = field.getFilterOperators();
  // Perform UI logic or validation based on interface, enum, validation, etc.
}
```

## Notes

- The path format for `getCollectionField(fieldPath)` is `collectionName.fieldPath`, where the first segment is the collection name and the subsequent segments are the field path (supports associations, e.g., `user.name`).
- `getCollection(name)` supports the `collectionName.fieldName` format, returning the target collection of the association field.
- In the RunJS context, `ctx.dataSource` is usually determined by the data source of the current block or page. If no data source is bound to the context, it may be `undefined`; it is recommended to perform a null check before use.

## Related

- [ctx.dataSourceManager](./data-source-manager.md): Data source manager, manages all data sources.
- [ctx.collection](./collection.md): The collection associated with the current context.
- [ctx.collectionField](./collection-field.md): The collection field definition for the current field.