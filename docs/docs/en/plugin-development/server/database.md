# Database

`Database` is an important component of database-type data sources (`DataSource`). Each database-type data source has a corresponding `Database` instance, accessible via `dataSource.db`. The main data source's database instance also provides the convenient `app.db` alias. Familiarizing yourself with `db`'s common methods is fundamental to writing server-side plugins.

## Database Components

A typical `Database` consists of the following parts:

- **Collection**: Defines data table structure.
- **Model**: Corresponds to ORM models (usually managed by Sequelize).
- **Repository**: Repository layer that encapsulates data access logic, providing higher-level operation methods.
- **FieldType**: Field types.
- **FilterOperator**: Operators used for filtering.
- **Event**: Lifecycle events and database events.

## Usage Timing in Plugins

### Things Suitable for the beforeLoad Stage

At this stage, database operations are not allowed. Suitable for static class registration or event listening.

- `db.registerFieldTypes()` — Custom field types  
- `db.registerModels()` — Register custom model classes  
- `db.registerRepositories()` — Register custom repository classes  
- `db.registerOperators()` — Register custom filter operators  
- `db.on()` — Listen to database-related events  

### Things Suitable for the load Stage

At this stage, all preceding class definitions and events have been loaded, so loading data tables won't have missing or omitted dependencies.

- `db.defineCollection()` — Define new data tables
- `db.extendCollection()` — Extend existing data table configurations

For defining plugin built-in tables, it's more recommended to place them in the `./src/server/collections` directory. See [Collections](./collections.md).

## Data Operations

`Database` provides two main ways to access and operate data:

### Operations via Repository

```ts
const repo = db.getRepository('users');
const user = await repo.findOne({ filter: { id: 1 } });
```

The Repository layer is usually used to encapsulate business logic, such as pagination, filtering, permission checks, etc.

### Operations via Model

```ts
const UserModel = db.getModel('users');
const user = await UserModel.findByPk(1);
```

The Model layer directly corresponds to ORM entities, suitable for lower-level database operations.

## Which Stages Allow Database Operations?

### Plugin Lifecycle

| Stage                | Database Operations Allowed |
| -------------------- | --------------------------- |
| `staticImport`       | No                          |
| `afterAdd`           | No                          |
| `beforeLoad`         | No                          |
| `load`                | No                          |
| `install`             | Yes                         |
| `beforeEnable`        | Yes                         |
| `afterEnable`         | Yes                         |
| `beforeDisable`       | Yes                         |
| `afterDisable`        | Yes                         |
| `remove`              | Yes                         |
| `handleSyncMessage`   | Yes                         |

### App Events

| Stage                | Database Operations Allowed |
| -------------------- | --------------------------- |
| `beforeLoad`         | No                          |
| `afterLoad`           | No                          |
| `beforeStart`         | Yes                         |
| `afterStart`          | Yes                         |
| `beforeInstall`       | No                          |
| `afterInstall`        | Yes                         |
| `beforeStop`          | Yes                         |
| `afterStop`           | No                          |
| `beforeDestroy`       | Yes                         |
| `afterDestroy`        | No                          |
| `beforeLoadPlugin`    | No                          |
| `afterLoadPlugin`     | No                          |
| `beforeEnablePlugin`  | Yes                         |
| `afterEnablePlugin`   | Yes                         |
| `beforeDisablePlugin` | Yes                         |
| `afterDisablePlugin`  | Yes                         |
| `afterUpgrade`        | Yes                         |

### Database Events/Hooks

| Stage                         | Database Operations Allowed |
| ------------------------------ | --------------------------- |
| `beforeSync`                   | No                          |
| `afterSync`                    | Yes                         |
| `beforeValidate`               | Yes                         |
| `afterValidate`                | Yes                         |
| `beforeCreate`                 | Yes                         |
| `afterCreate`                  | Yes                         |
| `beforeUpdate`                 | Yes                         |
| `afterUpdate`                  | Yes                         |
| `beforeSave`                   | Yes                         |
| `afterSave`                    | Yes                         |
| `beforeDestroy`               | Yes                         |
| `afterDestroy`                 | Yes                         |
| `afterCreateWithAssociations`  | Yes                         |
| `afterUpdateWithAssociations` | Yes                         |
| `afterSaveWithAssociations`    | Yes                         |
| `beforeDefineCollection`      | No                          |
| `afterDefineCollection`        | No                          |
| `beforeRemoveCollection`       | No                          |
| `afterRemoveCollection`        | No                          |

