# Database

`Database` is an important component of a database-type `DataSource`. Each database-type data source has a corresponding `Database` instance, accessible via `dataSource.db`. The database instance of the main data source also provides a convenient `app.db` alias. Familiarity with the common methods of `db` is fundamental to writing server-side plugins.

## Database Components

A typical `Database` consists of the following parts:

- **Collection**: Defines the collection structure.
- **Model**: Corresponds to the ORM model (usually managed by Sequelize).
- **Repository**: Encapsulates data access logic, providing higher-level operation methods.
- **FieldType**: Field types.
- **FilterOperator**: Operators used for filtering.
- **Event**: Lifecycle events and database events.

## When to Use in a Plugin

### What to Do in the beforeLoad Phase

Database operations are not allowed in this phase. It is suitable for registering static classes or listening for events.

- `db.registerFieldTypes()` — Custom field types
- `db.registerModels()` — Register custom model classes
- `db.registerRepositories()` — Register custom repository classes
- `db.registerOperators()` — Register custom filter operators
- `db.on()` — Listen for database-related events

### What to Do in the load Phase

In this phase, all prerequisite class definitions and events have been loaded, so loading collections will not cause any omissions or errors.

- `db.defineCollection()` — Define a new collection
- `db.extendCollection()` — Extend existing collection configurations

For defining a plugin's built-in collections, it is more recommended to place them in the `./src/server/collections` directory. For details, see [Collections](./collections.md).

## Data Operations

`Database` provides two main ways to access and operate on data:

### Operations via Repository

```ts
const repo = db.getRepository('users');
const user = await repo.findOne({ filter: { id: 1 } });
```

The `Repository` layer is typically used to encapsulate business logic, such as pagination, filtering, permission checks, etc.

### Operations via Model

```ts
const UserModel = db.getModel('users');
const user = await UserModel.findByPk(1);
```

The `Model` layer directly corresponds to ORM entities and is suitable for performing lower-level database operations.

## In Which Phases Can Database Operations Be Performed?

### Plugin Lifecycle

| Phase | Database Operations Allowed |
|------|----------------|
| `staticImport` | No |
| `afterAdd` | No |
| `beforeLoad` | No |
| `load` | No |
| `install` | Yes |
| `beforeEnable` | Yes |
| `afterEnable` | Yes |
| `beforeDisable` | Yes |
| `afterDisable` | Yes |
| `remove` | Yes |
| `handleSyncMessage` | Yes |

### App Events

| Phase | Database Operations Allowed |
|------|----------------|
| `beforeLoad` | No |
| `afterLoad` | No |
| `beforeStart` | Yes |
| `afterStart` | Yes |
| `beforeInstall` | No |
| `afterInstall` | Yes |
| `beforeStop` | Yes |
| `afterStop` | No |
| `beforeDestroy` | Yes |
| `afterDestroy` | No |
| `beforeLoadPlugin` | No |
| `afterLoadPlugin` | No |
| `beforeEnablePlugin` | Yes |
| `afterEnablePlugin` | Yes |
| `beforeDisablePlugin` | Yes |
| `afterDisablePlugin` | Yes |
| `afterUpgrade` | Yes |

### Database Events/Hooks

| Phase | Database Operations Allowed |
|------|----------------|
| `beforeSync` | No |
| `afterSync` | Yes |
| `beforeValidate` | Yes |
| `afterValidate` | Yes |
| `beforeCreate` | Yes |
| `afterCreate` | Yes |
| `beforeUpdate` | Yes |
| `afterUpdate` | Yes |
| `beforeSave` | Yes |
| `afterSave` | Yes |
| `beforeDestroy` | Yes |
| `afterDestroy` | Yes |
| `afterCreateWithAssociations` | Yes |
| `afterUpdateWithAssociations` | Yes |
| `afterSaveWithAssociations` | Yes |
| `beforeDefineCollection` | No |
| `afterDefineCollection` | No |
| `beforeRemoveCollection` | No |
| `afterRemoveCollection` | No |