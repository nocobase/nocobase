# Database

## Overview

Database is a database interaction tool provided by NocoBase, offering convenient database interaction capabilities for no-code and low-code applications. Currently supported databases are:

- SQLite 3.8.8+
- MySQL 8.0.17+
- PostgreSQL 10.0+

### Connect to Database

In the `Database` constructor, you can configure the database connection by passing in the `options` parameter.

```javascript
const { Database } = require('@nocobase/database');

// SQLite database configuration parameters
const database = new Database({
  dialect: 'mysql',
  host: 'localhost',
  port: 3306,
  database: 'nocobase',
  username: 'root',
  password: 'password'
})

// MySQL \ PostgreSQL database configuration parameters
const database = new Database({
  dialect: /* 'postgres' or 'mysql' */,
  database: 'database',
  username: 'username',
  password: 'password',
  host: 'localhost',
  port: 'port'
})

```

For detailed configuration parameters, please refer to [Constructor](#constructor).

### Data Model Definition

`Database` defines the database structure through `Collection`. A `Collection` object represents a table in the database.

```javascript
// Define Collection
const UserCollection = database.collection({
  name: 'users',
  fields: [
    {
      name: 'name',
      type: 'string',
    },
    {
      name: 'age',
      type: 'integer',
    },
  ],
});
```

After the database structure is defined, you can use the `sync()` method to synchronize the database structure.

```javascript
await database.sync();
```

For more detailed usage of `Collection`, please refer to [Collection](/api/database/collection).

### Data Read/Write

`Database` operates on data through `Repository`.

```javascript
const UserRepository = UserCollection.repository();

// Create
await UserRepository.create({
  name: 'John',
  age: 18,
});

// Query
const user = await UserRepository.findOne({
  filter: {
    name: 'John',
  },
});

// Update
await UserRepository.update({
  values: {
    age: 20,
  },
});

// Delete
await UserRepository.destroy(user.id);
```

For more detailed data CRUD usage, please refer to [Repository](/api/database/repository).

## Constructor

**Signature**

- `constructor(options: DatabaseOptions)`

Creates a database instance.

**Parameters**

| Parameter | Type | Default | Description |
| ---------------------- | -------------- | ------------- | ------------------------------------------------------------------------------------------------------------------- |
| `options.host` | `string` | `'localhost'` | Database host |
| `options.port` | `number` | - | Database service port, with a default port corresponding to the database used |
| `options.username` | `string` | - | Database username |
| `options.password` | `string` | - | Database password |
| `options.database` | `string` | - | Database name |
| `options.dialect` | `string` | `'mysql'` | Database type |
| `options.storage?` | `string` | `':memory:'` | Storage mode for SQLite |
| `options.logging?` | `boolean` | `false` | Whether to enable logging |
| `options.define?` | `Object` | `{}` | Default table definition parameters |
| `options.tablePrefix?` | `string` | `''` | NocoBase extension, table name prefix |
| `options.migrator?` | `UmzugOptions` | `{}` | NocoBase extension, parameters related to the migration manager, refer to the [Umzug](https://github.com/sequelize/umzug/blob/main/src/types.ts#L15) implementation |

## Migration-related Methods

### `addMigration()`

Adds a single migration file.

**Signature**

- `addMigration(options: MigrationItem)`

**Parameters**

| Parameter | Type | Default | Description |
| -------------------- | ------------------ | ------ | ---------------------- |
| `options.name` | `string` | - | Migration file name |
| `options.context?` | `string` | - | Context of the migration file |
| `options.migration?` | `typeof Migration` | - | Custom class for the migration file |
| `options.up` | `Function` | - | `up` method of the migration file |
| `options.down` | `Function` | - | `down` method of the migration file |

**Example**

```ts
db.addMigration({
  name: '20220916120411-test-1',
  async up() {
    const queryInterface = this.context.db.sequelize.getQueryInterface();
    await queryInterface.query(/* your migration sqls */);
  },
});
```

### `addMigrations()`

Adds migration files from a specified directory.

**Signature**

- `addMigrations(options: AddMigrationsOptions): void`

**Parameters**

| Parameter | Type | Default | Description |
| -------------------- | ---------- | -------------- | ---------------- |
| `options.directory` | `string` | `''` | Directory where migration files are located |
| `options.extensions` | `string[]` | `['js', 'ts']` | File extensions |
| `options.namespace?` | `string` | `''` | Namespace |
| `options.context?` | `Object` | `{ db }` | Context of the migration file |

**Example**

```ts
db.addMigrations({
  directory: path.resolve(__dirname, './migrations'),
  namespace: 'test',
});
```

## Utility Methods

### `inDialect()`

Checks if the current database type is one of the specified types.

**Signature**

- `inDialect(dialect: string[]): boolean`

**Parameters**

| Parameter | Type | Default | Description |
| --------- | ---------- | ------ | ------------------------------------------------ |
| `dialect` | `string[]` | - | Database type, possible values are `mysql`/`postgres`/`mariadb` |

### `getTablePrefix()`

Gets the table name prefix from the configuration.

**Signature**

- `getTablePrefix(): string`

## Collection Configuration

### `collection()`

Defines a collection. This call is similar to Sequelize's `define` method, creating the table structure only in memory. To persist it to the database, you need to call the `sync` method.

**Signature**

- `collection(options: CollectionOptions): Collection`

**Parameters**

All `options` configuration parameters are consistent with the constructor of the `Collection` class, refer to [Collection](/api/database/collection#constructor).

**Events**

- `'beforeDefineCollection'`: Triggered before defining a collection.
- `'afterDefineCollection'`: Triggered after defining a collection.

**Example**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
    {
      type: 'float',
      name: 'price',
    },
  ],
});

// sync collection as table to db
await db.sync();
```

### `getCollection()`

Gets a defined collection.

**Signature**

- `getCollection(name: string): Collection`

**Parameters**

| Parameter | Type | Default | Description |
| ------ | -------- | ------ | ---- |
| `name` | `string` | - | Collection name |

**Example**

```ts
const collection = db.getCollection('books');
```

### `hasCollection()`

Checks if a specified collection has been defined.

**Signature**

- `hasCollection(name: string): boolean`

**Parameters**

| Parameter | Type | Default | Description |
| ------ | -------- | ------ | ---- |
| `name` | `string` | - | Collection name |

**Example**

```ts
db.collection({ name: 'books' });

db.hasCollection('books'); // true

db.hasCollection('authors'); // false
```

### `removeCollection()`

Removes a defined collection. It is only removed from memory; to persist the change, you need to call the `sync` method.

**Signature**

- `removeCollection(name: string): void`

**Parameters**

| Parameter | Type | Default | Description |
| ------ | -------- | ------ | ---- |
| `name` | `string` | - | Collection name |

**Events**

- `'beforeRemoveCollection'`: Triggered before removing a collection.
- `'afterRemoveCollection'`: Triggered after removing a collection.

**Example**

```ts
db.collection({ name: 'books' });

db.removeCollection('books');
```

### `import()`

Imports all files in a directory as collection configurations into memory.

**Signature**

- `async import(options: { directory: string; extensions?: ImportFileExtension[] }): Promise<Map<string, Collection>>`

**Parameters**

| Parameter | Type | Default | Description |
| -------------------- | ---------- | -------------- | ---------------- |
| `options.directory` | `string` | - | Path of the directory to import |
| `options.extensions` | `string[]` | `['ts', 'js']` | Scan for specific suffixes |

**Example**

The collection defined in the `./collections/books.ts` file is as follows:

```ts
export default {
  name: 'books',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
};
```

Import the relevant configuration when the plugin loads:

```ts
class Plugin {
  async load() {
    await this.app.db.import({
      directory: path.resolve(__dirname, './collections'),
    });
  }
}
```

## Extension Registration and Retrieval

### `registerFieldTypes()`

Registers custom field types.

**Signature**

- `registerFieldTypes(fieldTypes: MapOf<typeof Field>): void`

**Parameters**

`fieldTypes` is a key-value pair where the key is the field type name and the value is the field type class.

**Example**

```ts
import { Field } from '@nocobase/database';

class MyField extends Field {
  // ...
}

db.registerFieldTypes({
  myField: MyField,
});
```

### `registerModels()`

Registers custom data model classes.

**Signature**

- `registerModels(models: MapOf<ModelStatic<any>>): void`

**Parameters**

`models` is a key-value pair where the key is the model name and the value is the model class.

**Example**

```ts
import { Model } from '@nocobase/database';

class MyModel extends Model {
  // ...
}

db.registerModels({
  myModel: MyModel,
});

db.collection({
  name: 'myCollection',
  model: 'myModel',
});
```

### `registerRepositories()`

Registers custom repository classes.

**Signature**

- `registerRepositories(repositories: MapOf<RepositoryType>): void`

**Parameters**

`repositories` is a key-value pair where the key is the repository name and the value is the repository class.

**Example**

```ts
import { Repository } from '@nocobase/database';

class MyRepository extends Repository {
  // ...
}

db.registerRepositories({
  myRepository: MyRepository,
});

db.collection({
  name: 'myCollection',
  repository: 'myRepository',
});
```

### `registerOperators()`

Registers custom data query operators.

**Signature**

- `registerOperators(operators: MapOf<OperatorFunc>)`

**Parameters**

`operators` is a key-value pair where the key is the operator name and the value is the function that generates the comparison statement.

**Example**

```ts
db.registerOperators({
  $dateOn(value) {
    return {
      [Op.and]: [
        { [Op.gte]: stringToDate(value) },
        { [Op.lt]: getNextDay(value) },
      ],
    };
  },
});

db.getRepository('books').count({
  filter: {
    createdAt: {
      // registered operator
      $dateOn: '2020-01-01',
    },
  },
});
```

### `getModel()`

Gets a defined data model class. If no custom model class was previously registered, it will return the default Sequelize model class. The default name is the same as the collection name.

**Signature**

- `getModel(name: string): Model`

**Parameters**

| Parameter | Type | Default | Description |
| ------ | -------- | ------ | -------------- |
| `name` | `string` | - | Registered model name |

**Example**

```ts
db.registerModels({
  books: class MyModel extends Model {},
});

const ModelClass = db.getModel('books');

console.log(ModelClass.prototype instanceof MyModel); // true
```

Note: The model class obtained from a collection is not strictly equal to the registered model class, but inherits from it. Since Sequelize's model class properties are modified during initialization, NocoBase automatically handles this inheritance relationship. Except for the class inequality, all other definitions can be used normally.

### `getRepository()`

Gets a custom repository class. If no custom repository class was previously registered, it will return the default NocoBase repository class. The default name is the same as the collection name.

Repository classes are mainly used for CRUD operations based on data models, refer to [Repository](/api/database/repository).

**Signature**

- `getRepository(name: string): Repository`
- `getRepository(name: string, relationId?: string | number): Repository`

**Parameters**

| Parameter | Type | Default | Description |
| ------------ | -------------------- | ------ | ------------------ |
| `name` | `string` | - | Registered repository name |
| `relationId` | `string` \| `number` | - | Foreign key value for relational data |

When the name is an association name like `'tables.relations'`, it will return the associated repository class. If the second parameter is provided, the repository will be based on the foreign key value of the relational data when used (querying, updating, etc.).

**Example**

Suppose there are two collections, *posts* and *authors*, and the posts collection has a foreign key pointing to the authors collection:

```ts
const AuthorsRepo = db.getRepository('authors');
const author1 = AuthorsRepo.create({ name: 'author1' });

const PostsRepo = db.getRepository('authors.posts', author1.id);
const post1 = AuthorsRepo.create({ title: 'post1' });
asset(post1.authorId === author1.id); // true
```

## Database Events

### `on()`

Listens for database events.

**Signature**

- `on(event: string, listener: (...args: any[]) => void | Promise<void>): void`

**Parameters**

| Parameter | Type | Default | Description |
| -------- | -------- | ------ | ---------- |
| event | string | - | Event name |
| listener | Function | - | Event listener |

The event names support Sequelize's Model events by default. For global events, listen using the format `<sequelize_model_global_event>`, and for single Model events, use the format `<model_name>.<sequelize_model_event>`.

For parameter descriptions and detailed examples of all built-in event types, refer to the [Built-in Events](#built-in-events) section.

### `off()`

Removes an event listener function.

**Signature**

- `off(name: string, listener: Function)`

**Parameters**

| Parameter | Type | Default | Description |
| -------- | -------- | ------ | ---------- |
| name | string | - | Event name |
| listener | Function | - | Event listener |

**Example**

```ts
const listener = async (model, options) => {
  console.log(model);
};

db.on('afterCreate', listener);

db.off('afterCreate', listener);
```

## Database Operations

### `auth()`

Database connection authentication. Can be used to ensure that the application has established a connection with the data.

**Signature**

- `auth(options: QueryOptions & { retry?: number } = {}): Promise<boolean>`

**Parameters**

| Parameter | Type | Default | Description |
| ---------------------- | --------------------- | ------- | ------------------ |
| `options?` | `Object` | - | Authentication options |
| `options.retry?` | `number` | `10` | Number of retries on authentication failure |
| `options.transaction?` | `Transaction` | - | Transaction object |
| `options.logging?` | `boolean \| Function` | `false` | Whether to print logs |

**Example**

```ts
await db.auth();
```

### `reconnect()`

Reconnects to the database.

**Example**

```ts
await db.reconnect();
```

### `closed()`

Checks if the database connection is closed.

**Signature**

- `closed(): boolean`

### `close()`

Closes the database connection. Equivalent to `sequelize.close()`.

### `sync()`

Synchronizes the database collection structure. Equivalent to `sequelize.sync()`, for parameters refer to the [Sequelize documentation](https://sequelize.org/api/v6/class/src/sequelize.js~sequelize#instance-method-sync).

### `clean()`

Cleans the database, deleting all collections.

**Signature**

- `clean(options: CleanOptions): Promise<void>`

**Parameters**

| Parameter | Type | Default | Description |
| --------------------- | ------------- | ------- | ------------------ |
| `options.drop` | `boolean` | `false` | Whether to drop all collections |
| `options.skip` | `string[]` | - | Configuration of collection names to skip |
| `options.transaction` | `Transaction` | - | Transaction object |

**Example**

Removes all collections except for the `users` collection.

```ts
await db.clean({
  drop: true,
  skip: ['users'],
});
```

## Package-level Exports

### `defineCollection()`

Creates the configuration content for a collection.

**Signature**

- `defineCollection(name: string, config: CollectionOptions): CollectionOptions`

**Parameters**

| Parameter | Type | Default | Description |
| ------------------- | ------------------- | ------ | ----------------------------------- |
| `collectionOptions` | `CollectionOptions` | - | Same as all parameters of `db.collection()` |

**Example**

For a collection configuration file to be imported by `db.import()`:

```ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'users',
  fields: [
    {
      type: 'string',
      name: 'name',
    },
  ],
});
```

### `extendCollection()`

Extends the configuration content of a collection already in memory, mainly for file content imported by the `import()` method. This method is a top-level method exported by the `@nocobase/database` package and is not called through a db instance. The `extend` alias can also be used.

**Signature**

- `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ExtendedCollectionOptions`

**Parameters**

| Parameter | Type | Default | Description |
| ------------------- | ------------------- | ------ | -------------------------------------------------------------- |
| `collectionOptions` | `CollectionOptions` | - | Same as all parameters of `db.collection()` |
| `mergeOptions?` | `MergeOptions` | - | Parameters for the npm package [deepmerge](https://npmjs.com/package/deepmerge) |

**Example**

Original books collection definition (books.ts):

```ts
export default {
  name: 'books',
  fields: [{ name: 'title', type: 'string' }],
};
```

Extended books collection definition (books.extend.ts):

```ts
import { extend } from '@nocobase/database';

// extend again
export default extend({
  name: 'books',
  fields: [{ name: 'price', type: 'number' }],
});
```

If the two files above are imported when calling `import()`, after being extended again with `extend()`, the books collection will have both `title` and `price` fields.

This method is very useful for extending collection structures already defined by existing plugins.

## Built-in Events

The database triggers the following corresponding events at different stages of its lifecycle. Subscribing to them with the `on()` method allows for specific processing to meet certain business needs.

### `'beforeSync'` / `'afterSync'`

Triggered before and after a new collection structure configuration (fields, indexes, etc.) is synchronized to the database. It is usually triggered when `collection.sync()` (internal call) is executed and is generally used for handling logic for special field extensions.

**Signature**

```ts
on(eventName: `${string}.beforeSync` | 'beforeSync' | `${string}.afterSync` | 'afterSync', listener: SyncListener): this
```

**Type**

```ts
import type { SyncOptions, HookReturn } from 'sequelize/types';

type SyncListener = (options?: SyncOptions) => HookReturn;
```

**Example**

```ts
const users = db.collection({
  name: 'users',
  fields: [{ type: 'string', name: 'username' }],
});

db.on('beforeSync', async (options) => {
  // do something
});

db.on('users.afterSync', async (options) => {
  // do something
});

await users.sync();
```

### `'beforeValidate'` / `'afterValidate'`

Before creating or updating data, there is a validation process based on the rules defined in the collection. Corresponding events are triggered before and after validation. This is triggered when `repository.create()` or `repository.update()` is called.

**Signature**

```ts
on(eventName: `${string}.beforeValidate` | 'beforeValidate' | `${string}.afterValidate` | 'afterValidate', listener: ValidateListener): this
```

**Type**

```ts
import type { ValidationOptions } from 'sequelize/types/lib/instance-validator';
import type { HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

type ValidateListener = (
  model: Model,
  options?: ValidationOptions,
) => HookReturn;
```

**Example**

```ts
db.collection({
  name: 'tests',
  fields: [
    {
      type: 'string',
      name: 'email',
      validate: {
        isEmail: true,
      },
    },
  ],
});

// all models
db.on('beforeValidate', async (model, options) => {
  // do something
});
// tests model
db.on('tests.beforeValidate', async (model, options) => {
  // do something
});

// all models
db.on('afterValidate', async (model, options) => {
  // do something
});
// tests model
db.on('tests.afterValidate', async (model, options) => {
  // do something
});

const repository = db.getRepository('tests');
await repository.create({
  values: {
    email: 'abc', // checks for email format
  },
});
// or
await repository.update({
  filterByTk: 1,
  values: {
    email: 'abc', // checks for email format
  },
});
```

### `'beforeCreate'` / `'afterCreate'`

Corresponding events are triggered before and after creating a record. This is triggered when `repository.create()` is called.

**Signature**

```ts
on(eventName: `${string}.beforeCreate` | 'beforeCreate' | `${string}.afterCreate` | 'afterCreate', listener: CreateListener): this
```

**Type**

```ts
import type { CreateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type CreateListener = (
  model: Model,
  options?: CreateOptions,
) => HookReturn;
```

**Example**

```ts
db.on('beforeCreate', async (model, options) => {
  // do something
});

db.on('books.afterCreate', async (model, options) => {
  const { transaction } = options;
  const result = await model.constructor.findByPk(model.id, {
    transaction,
  });
  console.log(result);
});
```

### `'beforeUpdate'` / `'afterUpdate'`

Corresponding events are triggered before and after updating a record. This is triggered when `repository.update()` is called.

**Signature**

```ts
on(eventName: `${string}.beforeUpdate` | 'beforeUpdate' | `${string}.afterUpdate` | 'afterUpdate', listener: UpdateListener): this
```

**Type**

```ts
import type { UpdateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type UpdateListener = (
  model: Model,
  options?: UpdateOptions,
) => HookReturn;
```

**Example**

```ts
db.on('beforeUpdate', async (model, options) => {
  // do something
});

db.on('books.afterUpdate', async (model, options) => {
  // do something
});
```

### `'beforeSave'` / `'afterSave'`

Corresponding events are triggered before and after creating or updating a record. This is triggered when `repository.create()` or `repository.update()` is called.

**Signature**

```ts
on(eventName: `${string}.beforeSave` | 'beforeSave' | `${string}.afterSave` | 'afterSave', listener: SaveListener): this
```

**Type**

```ts
import type { SaveOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type SaveListener = (model: Model, options?: SaveOptions) => HookReturn;
```

**Example**

```ts
db.on('beforeSave', async (model, options) => {
  // do something
});

db.on('books.afterSave', async (model, options) => {
  // do something
});
```

### `'beforeDestroy'` / `'afterDestroy'`

Corresponding events are triggered before and after deleting a record. This is triggered when `repository.destroy()` is called.

**Signature**

```ts
on(eventName: `${string}.beforeDestroy` | 'beforeDestroy' | `${string}.afterDestroy` | 'afterDestroy', listener: DestroyListener): this
```

**Type**

```ts
import type { DestroyOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type DestroyListener = (
  model: Model,
  options?: DestroyOptions,
) => HookReturn;
```

**Example**

```ts
db.on('beforeDestroy', async (model, options) => {
  // do something
});

db.on('books.afterDestroy', async (model, options) => {
  // do something
});
```

### `'afterCreateWithAssociations'`

This event is triggered after creating a record with hierarchical association data. It is triggered when `repository.create()` is called.

**Signature**

```ts
on(eventName: `${string}.afterCreateWithAssociations` | 'afterCreateWithAssociations', listener: CreateWithAssociationsListener): this
```

**Type**

```ts
import type { CreateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type CreateWithAssociationsListener = (
  model: Model,
  options?: CreateOptions,
) => HookReturn;
```

**Example**

```ts
db.on('afterCreateWithAssociations', async (model, options) => {
  // do something
});

db.on('books.afterCreateWithAssociations', async (model, options) => {
  // do something
});
```

### `'afterUpdateWithAssociations'`

This event is triggered after updating a record with hierarchical association data. It is triggered when `repository.update()` is called.

**Signature**

```ts
on(eventName: `${string}.afterUpdateWithAssociations` | 'afterUpdateWithAssociations', listener: CreateWithAssociationsListener): this
```

**Type**

```ts
import type { UpdateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type UpdateWithAssociationsListener = (
  model: Model,
  options?: UpdateOptions,
) => HookReturn;
```

**Example**

```ts
db.on('afterUpdateWithAssociations', async (model, options) => {
  // do something
});

db.on('books.afterUpdateWithAssociations', async (model, options) => {
  // do something
});
```

### `'afterSaveWithAssociations'`

This event is triggered after creating or updating a record with hierarchical association data. It is triggered when `repository.create()` or `repository.update()` is called.

**Signature**

```ts
on(eventName: `${string}.afterSaveWithAssociations` | 'afterSaveWithAssociations', listener: SaveWithAssociationsListener): this
```

**Type**

```ts
import type { SaveOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type SaveWithAssociationsListener = (
  model: Model,
  options?: SaveOptions,
) => HookReturn;
```

**Example**

```ts
db.on('afterSaveWithAssociations', async (model, options) => {
  // do something
});

db.on('books.afterSaveWithAssociations', async (model, options) => {
  // do something
});
```

### `'beforeDefineCollection'`

Triggered before a collection is defined, e.g., when `db.collection()` is called.

Note: This is a synchronous event.

**Signature**

```ts
on(eventName: 'beforeDefineCollection', listener: BeforeDefineCollectionListener): this
```

**Type**

```ts
import type { CollectionOptions } from '@nocobase/database';

export type BeforeDefineCollectionListener = (
  options: CollectionOptions,
) => void;
```

**Example**

```ts
db.on('beforeDefineCollection', (options) => {
  // do something
});
```

### `'afterDefineCollection'`

Triggered after a collection is defined, e.g., when `db.collection()` is called.

Note: This is a synchronous event.

**Signature**

```ts
on(eventName: 'afterDefineCollection', listener: AfterDefineCollectionListener): this
```

**Type**

```ts
import type { Collection } from '@nocobase/database';

export type AfterDefineCollectionListener = (options: Collection) => void;
```

**Example**

```ts
db.on('afterDefineCollection', (collection) => {
  // do something
});
```

### `'beforeRemoveCollection'` / `'afterRemoveCollection'`

Triggered before and after a collection is removed from memory, e.g., when `db.removeCollection()` is called.

Note: This is a synchronous event.

**Signature**

```ts
on(eventName: 'beforeRemoveCollection' | 'afterRemoveCollection', listener: RemoveCollectionListener): this
```

**Type**

```ts
import type { Collection } from '@nocobase/database';

export type RemoveCollectionListener = (options: Collection) => void;
```

**Example**

```ts
db.on('beforeRemoveCollection', (collection) => {
  // do something
});

db.on('afterRemoveCollection', (collection) => {
  // do something
});
```