# Database

## Overview

Database is the database interaction tool provided by NocoBase, it provides very convenient database interaction features for no-code and low-code applications. The supported databases are:

* SQLite 3.8.8+
* MySQL 8.0.17+ 
* PostgreSQL 10.0+

### Connect to Database

In `Database` constructor, database connection can be configured by passing the `options` parameter.

```javascript
const { Database } = require('@nocobase/database');

// SQLite database configuration parameters
const database = new Database({
  dialect: 'sqlite',
  storage: 'path/to/database.sqlite'
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

Refer to [Constructor](#constructor) for detailed configurations.

### Define Data Structure

`Database` defines database structure through `Collection`, one `Collection` object represents one table in the database.

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

After the database structure is defined, use `sync()` method to synchronize the database structure.

```javascript
await database.sync();
```

Refer to [Collection](/api/database/collection.md) for detailed usage of `Collection`.

### CRUD Data

`Database` operates data through `Repository`.

```javascript

const UserRepository = UserCollection.repository();

// Create
await UserRepository.create({
  name: 'Mark',
  age: 18,
});

// Query
const user = await UserRepository.findOne({
  filter: {
    name: 'Mark',
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

Refer to [Repository](/api/database/repository.md) for details of data CRUD.

## Constructor

**Signature**

* `constructor(options: DatabaseOptions)`

Create a database instance.

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `options.host` | `string` | `'localhost'` | Database host |
| `options.port` | `number` | - | Database service port, default port depends on the type of database used |
| `options.username` | `string` | - | Database username |
| `options.password` | `string` | - | Database password|
| `options.database` | `string` | - | Database name |
| `options.dialect` | `string` | `'mysql'` | Database type |
| `options.storage?` | `string` | `':memory:'` | Storage mode for SQLite |
| `options.logging?` | `boolean` | `false` | Whether to enable logging |
| `options.define?` | `Object` | `{}` | Default table definition parameters |
| `options.tablePrefix?` | `string` | `''` | NocoBase extension, table prefix |
| `options.migrator?` | `UmzugOptions` | `{}` | NocoBase extension, parameters for migrator, refer to [Umzug](https://github.com/sequelize/umzug/blob/main/src/types.ts#L15) for the implementation |

## Migration Methods

### `addMigration()`

Add single migration file.

**Signature**

* `addMigration(options: MigrationItem)`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `options.name` | `string` | - | Name of the migration file |
| `options.context?` | `string` | - | Context of the migration file |
| `options.migration?` | `typeof Migration` | - | Custom type of the migration file |
| `options.up` | `Function` | - | `up` method of the migration file |
| `options.down` | `Function` | - | `down` method of the migration file |

**Example**

```ts
db.addMigration({
  name: '20220916120411-test-1',
  async up() {
    const queryInterface = this.context.db.sequelize.getQueryInterface();
    await queryInterface.query(/* your migration sqls */);
  }
});
```

### `addMigrations()`

Add the migration files in the specified directory.

**Signature**

* `addMigrations(options: AddMigrationsOptions): void`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `options.directory` | `string` | `''` | Directory where the migration files are located |
| `options.extensions` | `string[]` | `['js', 'ts']` | File extensions |
| `options.namespace?` | `string` | `''` | Namespace |
| `options.context?` | `Object` | `{ db }` | Context of the migration files |

**Example**

```ts
db.addMigrations({
  directory: path.resolve(__dirname, './migrations'),
  namespace: 'test'
});
```

## Tool Methods

### `inDialect()`

Check whether the current database type is the specified type.

**Signature**

* `inDialect(dialect: string[]): boolean`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `dialect` | `string[]` | - | Database type, options are `mysql`, `postgres` and `sqlite` |

### `getTablePrefix()`

Get the table name prefix in the configuration.

**Signature**

* `getTablePrefix(): string`

## Data Table Configurations

### `collection()`

Define a data table. This is like the `define` method of Sequelize, which only creates table structure in memory. Call the `sync` method if needs to be persisted to the database.

**Signature**

* `collection(options: CollectionOptions): Collection`

**Parameter**

All configuration parameters of `options` is consistent with the constructor of the `Collection` class, refer to [Collection](/api/server/database/collection#Constructor).

**Event**

* `'beforeDefineCollection'`: Trigger before defining the table.
* `'afterDefineCollection'`: Trigger after defining the table.

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
    }
  ]
});

// sync collection as table to db
await db.sync();
```

### `getCollection()`

Get a defined data table.

**Signature**

* `getCollection(name: string): Collection`

**Parameter**

| Name	 | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `string` | - | Table name |

**Example**

```ts
const collection = db.getCollection('books');
```

### `hasCollection()`

Check whether a specified data table is defined.

**Signature**

* `hasCollection(name: string): boolean`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `string` | - | Table name |

**Example**

```ts
db.collection({ name: 'books' });

db.hasCollection('books'); // true

db.hasCollection('authors'); // false
```

### `removeCollection()`

Remove a defined data table. It is to remove from memory only, call the `sync` method if needs to be persisted to the database.

**Signature**

* `removeCollection(name: string): void`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `string` | - | Table name |

**Event**

* `'beforeRemoveCollection'`: Trigger before removing the table.
* `'afterRemoveCollection'`: Trigger after removing the table

**Example**

```ts
db.collection({ name: 'books' });

db.removeCollection('books');
```

### `import()`

Load all files in the import file directory into memory as the configuration of collection.

**Signature**

* `async import(options: { directory: string; extensions?: ImportFileExtension[] }): Promise<Map<string, Collection>>`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `options.directory` | `string` | - | Path of directory to be imported |
| `options.extensions` | `string[]` | `['ts', 'js']` | Scan for specific suffixes |

**Example**

The collection defined by file `./collections/books.ts` is as below:

```ts
export default {
  name: 'books',
  fields: [
    {
      type: 'string',
      name: 'title',
    }
  ]
};
```

Import the relevant configurations when loading the plugin:

```ts
class Plugin {
  async load() {
    await this.app.db.import({
      directory: path.resolve(__dirname, './collections'),
    });
  }
}
```

## Extension Registrations and Acquisitions

### `registerFieldTypes()`

Register custom field type.

**Signature**

* `registerFieldTypes(fieldTypes: MapOf<typeof Field>): void`

**Parameter**

`fieldTypes` is a key-value pair, where key is the field type name, and value is the field type class.

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

Register custom data model class.

**Signature**

* `registerModels(models: MapOf<ModelStatic<any>>): void`

**Parameter**

`models` is a key-value pair, where key is the data model name, and value is the data model class.

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
  model: 'myModel'
});
```

### `registerRepositories()`

Register custom data repository class.

**Signature**

* `registerRepositories(repositories: MapOf<RepositoryType>): void`

**Parameter**

`repositories` is a key-value pair, where key is the data repository name, and value is the data repository class.

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
  repository: 'myRepository'
});
```

### `registerOperators()`

Register custom data query operator.

**Signature**

* `registerOperators(operators: MapOf<OperatorFunc>)`

**Parameter**

`operators` is a key-value pair, where key is the operator name, and value is the generating function of the comparison operator statement.

**Example**

```ts
db.registerOperators({
  $dateOn(value) {
    return {
      [Op.and]: [{ [Op.gte]: stringToDate(value) }, { [Op.lt]: getNextDay(value) }],
    };
  }
});

db.getRepository('books').count({
  filter: {
    createdAt: {
      // registered operator
      $dateOn: '2020-01-01',
    }
  }
});
```

### `getModel()`

Get the defined data model class. If no custom model class has been registered before, the default model class of Sequelize will be returned. The default name is the same as the name defined by collection.

**Signature**

* `getModel(name: string): Model`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `string` | - | Registered model name |

**Example**

```ts
db.registerModels({
  books: class MyModel extends Model {}
});

const ModelClass = db.getModel('books');

console.log(ModelClass.prototype instanceof MyModel) // true
```

Note: The model class retrieved from collection is not strictly equivalent to the model class at registration, but is inherited from the model class at registration. Since the properties of Sequelize's model class are modified during initialization, NocoBase automatically handles this inheritance relationship. All the definitions work fine except that the classes are not equal.

### `getRepository()`

Get the defined data repository class. If no custom data repository class has been registered before, the default data repository class of NocoBase will be returned. The default name is the same as the name defined by collection.

Data repository class is mainly used for the CRUD operations based on data model, refer to [Repository](/api/server/database/repository).

**Signature**

* `getRepository(name: string): Repository`
* `getRepository(name: string, relationId?: string | number): Repository`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `string` | - | Registered data repository name |
| `relationId` | `string` \| `number` | - | Foreign key value for relational data |

When the name contains relationship in the form of `'tables.relactions'`, the related data repository class is returned. If the second parameter is provided, the data repository will be used (query, modify, etc.) based on the foreign key values of the relational data.

**Example**

Suppose there are two data tables <i>posts</i> and <i>authors</i>, and there is a foreign key in the <i>posts</i> table points to the <i>authors</i> table:

```ts
const AuthorsRepo = db.getRepository('authors');
const author1 = AuthorsRepo.create({ name: 'author1' });

const PostsRepo = db.getRepository('authors.posts', author1.id);
const post1 = AuthorsRepo.create({ title: 'post1' });
asset(post1.authorId === author1.id); // true
```

## Database Events

### `on()`

Listen for database events.

**Signature**

* `on(event: string, listener: (...args: any[]) => void | Promise<void>): void`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| event | string | - | Event name |
| listener | Function | - | Event listener |

Event name supports Model event of Sequelize by default. Global event is listened to by the name `<sequelize_model_global_event>`, single Model event is listened to by the name `<model_name>. <sequelize_model_event>`.

Refer to the [Built-in Events](#built-in-events) section for parameter descriptions and detailed examples of all built-in event types.

### `off()`

Remove the event listener function.

**Signature**

* `off(name: string, listener: Function)`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
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

Database connection verification. It can be used to ensure that the application has established connection to the data.

**Signature**

* `auth(options: QueryOptions & { retry?: number } = {}): Promise<boolean>`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `options?` | `Object` | - | Verification option |
| `options.retry?` | `number` | `10` | Number of retries in case of verification failure |
| `options.transaction?` | `Transaction` | - | Transaction object |
| `options.logging?` | `boolean \| Function` | `false` | Whether to print the log |

**Example**
  
```ts
await db.auth();
```

### `reconnect()`

Reconnect to the database.

**Example**

```ts
await db.reconnect();
```

### `closed()`

Check whether database has closed the connection.

**Signature**

* `closed(): boolean`

### `close()`

Closes database connection. Equivalent to `sequelize.close()`.

### `sync()`

Synchronizes database table structure. Equivalent to `sequelize.sync()`, refer to [Sequelize documentation](https://sequelize.org/api/v6/class/src/sequelize.js~sequelize#instance-method-sync) for parameters.

### `clean()`

Empty the database, it will delete all data tables.

**Signature**

* `clean(options: CleanOptions): Promise<void>`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `options.drop` | `boolean` | `false` | Whether to remove all data tables |
| `options.skip` | `string[]` | - | Names of tables to skip |
| `options.transaction` | `Transaction` | - | Transaction object |

**Example**

Remove all tables except for the `users` table.

```ts
await db.clean({
  drop: true,
  skip: ['users']
})
```

## Package-Level Export

### `defineCollection()`

Create the configuration content of a data table.

**Signature**

* `defineCollection(name: string, config: CollectionOptions): CollectionOptions`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `collectionOptions` | `CollectionOptions` | - | All parameters are the same with `db.collection()` |

**Example**

For the data table configuration file to be imported by `db.import()`:

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

Extent the configuration content of a data table that is already in memory, mainly for the content of files imported by the `import()` method. This is the top-level package export method of `@nocobase/database`, and is not called through db instance. The `extend` alias can also be used.

**Signature**

* `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ExtendedCollectionOptions`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `collectionOptions` | `CollectionOptions` | - | All the same with `db.collection()` |
| `mergeOptions?` | `MergeOptions` | - | [deepmerge](https://npmjs.com/package/deepmerge) options of npm package |

**Example**

Original definition of the table <i>books</i> (books.ts):

```ts
export default {
  name: 'books',
  fields: [
    { name: 'title', type: 'string' }
  ]
}
```

Extend the definition of the table <i>books</i> (books.extend.ts):

```ts
import { extend } from '@nocobase/database';

// Extend again
export default extend({
  name: 'books',
  fields: [
    { name: 'price', type: 'number' }
  ]
});
```

If the above two files are imported when calling `import()`, after being extended again by `extend()`, the table <i>books</i> will have `title` and `price` two fields.

This method is especially useful when extending the table structure that is already defined by existing plugin.

## Built-in Events

The following events will be triggered in the corresponding lifecycle of database, subscribe by the `on()` method and perform specific processing to meet some business needs. 

### `'beforeSync'` / `'afterSync'`

Events triggered before or after a new table structure configuration (fields, indexes, etc.) is synchronized to the database. This is usually triggered when executing `collection.sync()` (internal call) for the logical processing of the extension of some special fields.

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
  fields: [
    { type: 'string', name: 'username' }
  ]
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

Before creating or updating data, there is a validation against the data based on the rules defined by the collection, and the corresponding events are triggered before and after the validation. This is triggered when `repository.create()` or `repository.update()` is called.

**Signature**

```ts
on(eventName: `${string}.beforeValidate` | 'beforeValidate' | `${string}.afterValidate` | 'afterValidate', listener: ValidateListener): this
```

**Type**

```ts
import type { ValidationOptions } from 'sequelize/types/lib/instance-validator';
import type { HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

type ValidateListener = (model: Model, options?: ValidationOptions) => HookReturn;
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
    }
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

Events triggered before or after creating one piece of data. This is triggered when `repository.create()` is called.

**Signature**

```ts
on(eventName: `${string}.beforeCreate` | 'beforeCreate' | `${string}.afterCreate` | 'afterCreate', listener: CreateListener): this
```

**Type**

```ts
import type { CreateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type CreateListener = (model: Model, options?: CreateOptions) => HookReturn;
```

**Example**

```ts
db.on('beforeCreate', async (model, options) => {
  // do something
});

db.on('books.afterCreate', async (model, options) => {
  const { transaction } = options;
  const result = await model.constructor.findByPk(model.id, {
    transaction
  });
  console.log(result);
});
```

### `'beforeUpdate'` / `'afterUpdate'`

Events triggered before or after updating one piece of data. This is triggered when `repository.update()` is called.

**Signature**

```ts
on(eventName: `${string}.beforeUpdate` | 'beforeUpdate' | `${string}.afterUpdate` | 'afterUpdate', listener: UpdateListener): this
```

**Type**

```ts
import type { UpdateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type UpdateListener = (model: Model, options?: UpdateOptions) => HookReturn;
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

Events triggered before or after creating or updating one piece of data. This is triggered when `repository.create()` or `repository.update()` is called.

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

Events triggered before or after deleting one piece of data. This is triggered when `repository.destroy()` is called.

**Signature**

```ts
on(eventName: `${string}.beforeDestroy` | 'beforeDestroy' | `${string}.afterDestroy` | 'afterDestroy', listener: DestroyListener): this
```

**Type**

```ts
import type { DestroyOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type DestroyListener = (model: Model, options?: DestroyOptions) => HookReturn;
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

Events triggered after creating one piece of data that carries hierarchical data. This is triggered when `repository.create()` is called.

**Signature**

```ts
on(eventName: `${string}.afterCreateWithAssociations` | 'afterCreateWithAssociations', listener: CreateWithAssociationsListener): this
```

**Type**

```ts
import type { CreateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type CreateWithAssociationsListener = (model: Model, options?: CreateOptions) => HookReturn;
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

Events triggered after updating one piece of data that carries hierarchical data. This is triggered when `repository.update()` is called.

**Signature**

```ts
on(eventName: `${string}.afterUpdateWithAssociations` | 'afterUpdateWithAssociations', listener: CreateWithAssociationsListener): this
```

**Type**

```ts
import type { UpdateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type UpdateWithAssociationsListener = (model: Model, options?: UpdateOptions) => HookReturn;
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

Events triggered after creating or updating one piece of data that carries hierarchical data. This is triggered when `repository.create()` or `repository.update()` is called.

**Signature**

```ts
on(eventName: `${string}.afterSaveWithAssociations` | 'afterSaveWithAssociations', listener: SaveWithAssociationsListener): this
```

**Type**

```ts
import type { SaveOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type SaveWithAssociationsListener = (model: Model, options?: SaveOptions) => HookReturn;
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

Events triggered before defining a data table, such as when `db.collection()` is called.

Note: This is a synchronous event.

**Signature**

```ts
on(eventName: 'beforeDefineCollection', listener: BeforeDefineCollectionListener): this
```

**Type**

```ts
import type { CollectionOptions } from '@nocobase/database';

export type BeforeDefineCollectionListener = (options: CollectionOptions) => void;
```

**Example**

```ts
db.on('beforeDefineCollection', (options) => {
  // do something
});
```

### `'afterDefineCollection'`

Events triggered after defining a data table, such as when `db.collection()` is called.

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

Events triggered before or after removing a data table from memory, such as when `db.removeCollection()` is called.

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
