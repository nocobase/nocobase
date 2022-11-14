# Database

## 概览

Database 是 Nocobase 提供的数据库交互工具，为无代码、低代码应用提供了非常方便的数据库交互功能。目前支持的数据库为：

* SQLite 3.8.8+
* MySQL 8.0.17+ 
* PostgreSQL 10.0+


### 连接数据库

在 `Database` 构造函数中，可以通过传入 `options` 参数来配置数据库连接。

```javascript
const { Database } = require('@nocobase/database');

// SQLite 数据库配置参数
const database = new Database({
  dialect: 'sqlite',
  storage: 'path/to/database.sqlite'
})

// MySQL \ PostgreSQL 数据库配置参数
const database = new Database({
  dialect: /* 'postgres' 或者 'mysql' */,
  database: 'database',
  username: 'username',
  password: 'password',
  host: 'localhost',
  port: 'port'
})

```

详细的配置参数请参考 [构造函数](#构造函数)。

### 数据模型定义

`Database` 通过 `Collection` 定义数据库结构，一个 `Collection` 对象代表了数据库中的一张表。

```javascript
// 定义 Collection 
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

数据库结构定义完成之后，可使用 `sync()` 方法来同步数据库结构。

```javascript
await database.sync();
```

更加详细的 `Collection` 使用方法请参考 [Collection](/api/database/collection.md)。

### 数据读写

`Database` 通过 `Repository` 对数据进行操作。

```javascript

const UserRepository = UserCollection.repository();

// 创建
await UserRepository.create({
  name: '张三',
  age: 18,
});

// 查询
const user = await UserRepository.findOne({
  filter: {
    name: '张三',
  },
});

// 修改
await UserRepository.update({
  values: {
    age: 20,
  },
});

// 删除
await UserRepository.destroy(user.id);
```

更加详细的数据 CRUD 使用方法请参考 [Repository](/api/database/repository.md)。


## 构造函数

**签名**

* `constructor(options: DatabaseOptions)`

创建一个数据库实例。

**参数**


| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `options.host` | `string` | `'localhost'` | 数据库主机 |
| `options.port` | `number` | - | 数据库服务端口，根据使用的数据库有对应默认端口 |
| `options.username` | `string` | - | 数据库用户名 |
| `options.password` | `string` | - | 数据库密码 |
| `options.database` | `string` | - | 数据库名称 |
| `options.dialect` | `string` | `'mysql'` | 数据库类型 |
| `options.storage?` | `string` | `':memory:'` | SQLite 的存储模式 |
| `options.logging?` | `boolean` | `false` | 是否开启日志 |
| `options.define?` | `Object` | `{}` | 默认的表定义参数 |
| `options.tablePrefix?` | `string` | `''` | NocoBase 扩展，表名前缀 |
| `options.migrator?` | `UmzugOptions` | `{}` | NocoBase 扩展，迁移管理器相关参数，参考 [Umzug](https://github.com/sequelize/umzug/blob/main/src/types.ts#L15) 实现 |

## 迁移相关方法

### `addMigration()`

添加单个迁移文件。

**签名**

* `addMigration(options: MigrationItem)`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `options.name` | `string` | - | 迁移文件名称 |
| `options.context?` | `string` | - | 迁移文件的 `up` 方法 |
| `options.migration?` | `typeof Migration` | - | 迁移文件的自定义类 |
| `options.up` | `Function` | - | 迁移文件的 `up` 方法 |
| `options.down` | `Function` | - | 迁移文件的 `down` 方法 |

**示例**

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

添加指定目录下的迁移文件。

**签名**

* `addMigrations(options: AddMigrationsOptions): void`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `options.directory` | `string` | `''` | 迁移文件所在目录 |
| `options.extensions` | `string[]` | `['js', 'ts']` | 文件扩展名 |
| `options.namespace?` | `string` | `''` | 命名空间 |
| `options.context?` | `Object` | `{ db }` | 迁移文件的上下文 |

**示例**

```ts
db.addMigrations({
  directory: path.resolve(__dirname, './migrations'),
  namespace: 'test'
});
```

## 工具方法

### `inDialect()`

判断当前数据库类型是否为指定类型。

**签名**

* `inDialect(dialect: string[]): boolean`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `dialect` | `string[]` | - | 数据库类型，可选值为 `mysql`/`postgres`/`sqlite` |

### `getTablePrefix()`

获取配置中的表名前缀。

**签名**

* `getTablePrefix(): string`

## 数据表配置

### `collection()`

定义一个数据表。该调用类似与 Sequelize 的 `define` 方法，只在内存中创建表结构，如需持久化到数据库，需要调用 `sync` 方法。

**签名**

* `collection(options: CollectionOptions): Collection`

**参数**

`options` 所有配置参数与 `Collection` 类的构造函数一致，参考 [Collection](/api/server/database/collection#构造函数)。

**事件**

* `'beforeDefineCollection'`：在定义表之前触发。
* `'afterDefineCollection'`：在定义表之后触发。

**示例**

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

获取已定义的数据表。

**签名**

* `getCollection(name: string): Collection`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `name` | `string` | - | 表名 |

**示例**

```ts
const collection = db.getCollection('books');
```

### `hasCollection()`

判断是否已定义指定的数据表。

**签名**

* `hasCollection(name: string): boolean`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `name` | `string` | - | 表名 |

**示例**

```ts
db.collection({ name: 'books' });

db.hasCollection('books'); // true

db.hasCollection('authors'); // false
```

### `removeCollection()`

移除已定义的数据表。仅在内存中移除，如需持久化，需要调用 `sync` 方法。

**签名**

* `removeCollection(name: string): void`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `name` | `string` | - | 表名 |

**事件**

* `'beforeRemoveCollection'`：在移除表之前触发。
* `'afterRemoveCollection'`：在移除表之后触发。

**示例**

```ts
db.collection({ name: 'books' });

db.removeCollection('books');
```

### `import()`

导入文件目录下所有文件作为 collection 配置载入内存。

**签名**

* `async import(options: { directory: string; extensions?: ImportFileExtension[] }): Promise<Map<string, Collection>>`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `options.directory` | `string` | - | 要导入的目录路径 |
| `options.extensions` | `string[]` | `['ts', 'js']` | 扫描特定后缀 |

**示例**

`./collections/books.ts` 文件定义的 collection 如下：

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

在插件加载时导入相关配置：

```ts
class Plugin {
  async load() {
    await this.app.db.import({
      directory: path.resolve(__dirname, './collections'),
    });
  }
}
```

## 扩展注册与获取

### `registerFieldTypes()`

注册自定义字段类型。

**签名**

* `registerFieldTypes(fieldTypes: MapOf<typeof Field>): void`

**参数**

`fieldTypes` 是一个键值对，键为字段类型名称，值为字段类型类。

**示例**

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

注册自定义数据模型类。

**签名**

* `registerModels(models: MapOf<ModelCtor<any>>): void`

**参数**

`models` 是一个键值对，键为数据模型名称，值为数据模型类。

**示例**

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

注册自定义数据仓库类。

**签名**

* `registerRepositories(repositories: MapOf<RepositoryType>): void`

**参数**

`repositories` 是一个键值对，键为数据仓库名称，值为数据仓库类。

**示例**

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

注册自定义数据查询操作符。

**签名**

* `registerOperators(operators: MapOf<OperatorFunc>)`

**参数**

`operators` 是一个键值对，键为操作符名称，值为操作符比较语句生成函数。

**示例**

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

获取已定义的数据模型类。如果没有在之前注册自定义模型类，将返回 Sequelize 默认的模型类。默认名称与 collection 定义的名称相同。

**签名**

* `getModel(name: string): Model`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `name` | `string` | - | 已注册的模型名 |

**示例**

```ts
db.registerModels({
  books: class MyModel extends Model {}
});

const ModelClass = db.getModel('books');

console.log(ModelClass.prototype instanceof MyModel) // true
```

注：从 collection 中获取的模型类并不与注册时的模型类严格相等，而是继承自注册时的模型类。由于 Sequelize 的模型类在初始化过程中属性会被修改，所以 NocoBase 自动处理了这个继承关系。除类不相等以外，其他所有定义都可以正常使用。

### `getRepository()`

获取自定义的数据仓库类。如果没有在之前注册自定义数据仓库类，将返回 NocoBase 默认的数据仓库类。默认名称与 collection 定义的名称相同。

数据仓库类主要用于基于数据模型的增删改查等操作，参考 [数据仓库](/api/server/database/repository)。

**签名**

* `getRepository(name: string): Repository`
* `getRepository(name: string, relationId?: string | number): Repository`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `name` | `string` | - | 已注册的数据仓库名 |
| `relationId` | `string` \| `number` | - | 关系数据的外键值 |

当名称是形如 `'tables.relactions'` 的带关联的名称时，将返回关联的数据仓库类。如果提供了第二个参数，数据仓库在使用时（查询、修改等）会基于关系数据的外键值。

**示例**

假设有两张数据表_文章_与_作者_，并且文章表中有一个外键指向作者表：

```ts
const AuthorsRepo = db.getRepository('authors');
const author1 = AuthorsRepo.create({ name: 'author1' });

const PostsRepo = db.getRepository('authors.posts', author1.id);
const post1 = AuthorsRepo.create({ title: 'post1' });
asset(post1.authorId === author1.id); // true
```

## 数据库事件 

### `on()`

监听数据库事件。

**签名**

* `on(event: string, listener: (...args: any[]) => void | Promise<void>): void`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| event | string | - | 事件名称 |
| listener | Function | - | 事件监听器 |

事件名称默认支持 Sequelize 的 Model 事件。针对全局事件，通过 `<sequelize_model_global_event>` 的名称方式监听，针对单 Model 事件，通过 `<model_name>.<sequelize_model_event>` 的名称方式监听。

所有内置的事件类型的参数说明和详细示例参考 [内置事件](#内置事件) 部分内容。

### `off()`

移除事件监听函数。

**签名**

* `off(name: string, listener: Function)`

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| name | string | - | 事件名称 |
| listener | Function | - | 事件监听器 |

**示例**

```ts
const listener = async (model, options) => {
  console.log(model);
};

db.on('afterCreate', listener);

db.off('afterCreate', listener);
```

## 数据库操作

### `auth()`

数据库连接验证。可以用于确保应用与数据已建立连接。

**签名**

* `auth(options: QueryOptions & { retry?: number } = {}): Promise<boolean>`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `options?` | `Object` | - | 验证选项 |
| `options.retry?` | `number` | `10` | 验证失败时重试次数 |
| `options.transaction?` | `Transaction` | - | 事务对象 |
| `options.logging?` | `boolean \| Function` | `false` | 是否打印日志 |

**示例**
  
```ts
await db.auth();
```

### `reconnect()`

重新连接数据库。

**示例**

```ts
await db.reconnect();
```

### `closed()`

判断数据库是否已关闭连接。

**签名**

* `closed(): boolean`

### `close()`

关闭数据库连接。等同于 `sequelize.close()`。

### `sync()`

同步数据库表结构。等同于 `sequelize.sync()`，参数参考 [Sequelize 文档](https://sequelize.org/api/v6/class/src/sequelize.js~sequelize#instance-method-sync)。

### `clean()`

清空数据库，将删除所有数据表。

**签名**

* `clean(options: CleanOptions): Promise<void>`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `options.drop` | `boolean` | `false` | 是否移除所有数据表 |
| `options.skip` | `string[]` | - | 跳过的表名配置 |
| `options.transaction` | `Transaction` | - | 事务对象 |

**示例**

移除除 `users` 表以外的所有表。

```ts
await db.clean({
  drop: true,
  skip: ['users']
})
```

## 包级导出

### `defineCollection()`

创建一个数据表的配置内容。

**签名**

* `defineCollection(name: string, config: CollectionOptions): CollectionOptions`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `collectionOptions` | `CollectionOptions` | - | 与所有 `db.collection()` 的参数相同 |

**示例**

对于要被 `db.import()` 导入的数据表配置文件：

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

扩展已在内存中的表结构配置内容，主要用于 `import()` 方法导入的文件内容。该方法是 `@nocobase/database` 包导出的顶级方法，不通过 db 实例调用。也可以使用 `extend` 别名。

**签名**

* `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ExtendedCollectionOptions`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `collectionOptions` | `CollectionOptions` | - | 与所有 `db.collection()` 的参数相同 |
| `mergeOptions?` | `MergeOptions` | - | npm 包 [deepmerge](https://npmjs.com/package/deepmerge) 的参数 |

**示例**

原始 books 表定义（books.ts）：

```ts
export default {
  name: 'books',
  fields: [
    { name: 'title', type: 'string' }
  ]
}
```

扩展 books 表定义（books.extend.ts）：

```ts
import { extend } from '@nocobase/database';

// 再次扩展
export default extend({
  name: 'books',
  fields: [
    { name: 'price', type: 'number' }
  ]
});
```

以上两个文件如在调用 `import()` 时导入，通过 `extend()` 再次扩展以后，books 表将拥有 `title` 和 `price` 两个字段。

此方法在扩展已有插件已定义的表结构时非常有用。

## 内置事件

数据库会在相应的生命周期触发以下对应的事件，通过 `on()` 方法订阅后进行特定的处理可满足一些业务需要。

### `'beforeSync'` / `'afterSync'`

当新的表结构配置（字段、索引等）被同步到数据库前后触发，通常在执行 `collection.sync()`（内部调用）时会触发，一般用于一些特殊的字段扩展的逻辑处理。

**签名**

```ts
on(eventName: `${string}.beforeSync` | 'beforeSync' | `${string}.afterSync` | 'afterSync', listener: SyncListener): this
```

**类型**

```ts
import type { SyncOptions, HookReturn } from 'sequelize/types';

type SyncListener = (options?: SyncOptions) => HookReturn;
```

**示例**

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

创建或更新数据前会有基于 collection 定义的规则对数据的验证过程，在验证前后会触发对应事件。当调用 `repository.create()` 或 `repository.update()` 时会触发。

**签名**

```ts
on(eventName: `${string}.beforeValidate` | 'beforeValidate' | `${string}.afterValidate` | 'afterValidate', listener: ValidateListener): this
```

**类型**

```ts
import type { ValidationOptions } from 'sequelize/types/lib/instance-validator';
import type { HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

type ValidateListener = (model: Model, options?: ValidationOptions) => HookReturn;
```

**示例**

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

创建一条数据前后会触发对应事件，当调用 `repository.create()` 时会触发。

**签名**

```ts
on(eventName: `${string}.beforeCreate` | 'beforeCreate' | `${string}.afterCreate` | 'afterCreate', listener: CreateListener): this
```

**类型**

```ts
import type { CreateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type CreateListener = (model: Model, options?: CreateOptions) => HookReturn;
```

**示例**

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

更新一条数据前后会触发对应事件，当调用 `repository.update()` 时会触发。

**签名**

```ts
on(eventName: `${string}.beforeUpdate` | 'beforeUpdate' | `${string}.afterUpdate` | 'afterUpdate', listener: UpdateListener): this
```

**类型**

```ts
import type { UpdateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type UpdateListener = (model: Model, options?: UpdateOptions) => HookReturn;
```

**示例**

```ts
db.on('beforeUpdate', async (model, options) => {
  // do something
});

db.on('books.afterUpdate', async (model, options) => {
  // do something
});
```

### `'beforeSave'` / `'afterSave'`

创建或更新一条数据前后会触发对应事件，当调用 `repository.create()` 或 `repository.update()` 时会触发。

**签名**

```ts
on(eventName: `${string}.beforeSave` | 'beforeSave' | `${string}.afterSave` | 'afterSave', listener: SaveListener): this
```

**类型**

```ts
import type { SaveOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type SaveListener = (model: Model, options?: SaveOptions) => HookReturn;
```

**示例**

```ts
db.on('beforeSave', async (model, options) => {
  // do something
});

db.on('books.afterSave', async (model, options) => {
  // do something
});
```

### `'beforeDestroy'` / `'afterDestroy'`

删除一条数据前后会触发对应事件，当调用 `repository.destroy()` 时会触发。

**签名**

```ts
on(eventName: `${string}.beforeDestroy` | 'beforeDestroy' | `${string}.afterDestroy` | 'afterDestroy', listener: DestroyListener): this
```

**类型**

```ts
import type { DestroyOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type DestroyListener = (model: Model, options?: DestroyOptions) => HookReturn;
```

**示例**

```ts
db.on('beforeDestroy', async (model, options) => {
  // do something
});

db.on('books.afterDestroy', async (model, options) => {
  // do something
});
```

### `'afterCreateWithAssociations'`

创建一条携带层级关系数据的数据之后会触发对应事件，当调用 `repository.create()` 时会触发。

**签名**

```ts
on(eventName: `${string}.afterCreateWithAssociations` | 'afterCreateWithAssociations', listener: CreateWithAssociationsListener): this
```

**类型**

```ts
import type { CreateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type CreateWithAssociationsListener = (model: Model, options?: CreateOptions) => HookReturn;
```

**示例**

```ts
db.on('afterCreateWithAssociations', async (model, options) => {
  // do something
});

db.on('books.afterCreateWithAssociations', async (model, options) => {
  // do something
});
```

### `'afterUpdateWithAssociations'`

更新一条携带层级关系数据的数据之后会触发对应事件，当调用 `repository.update()` 时会触发。

**签名**

```ts
on(eventName: `${string}.afterUpdateWithAssociations` | 'afterUpdateWithAssociations', listener: CreateWithAssociationsListener): this
```

**类型**

```ts
import type { UpdateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type UpdateWithAssociationsListener = (model: Model, options?: UpdateOptions) => HookReturn;
```

**示例**

```ts
db.on('afterUpdateWithAssociations', async (model, options) => {
  // do something
});

db.on('books.afterUpdateWithAssociations', async (model, options) => {
  // do something
});
```

### `'afterSaveWithAssociations'`

创建或更新一条携带层级关系数据的数据之后会触发对应事件，当调用 `repository.create()` 或 `repository.update()` 时会触发。

**签名**

```ts
on(eventName: `${string}.afterSaveWithAssociations` | 'afterSaveWithAssociations', listener: SaveWithAssociationsListener): this
```

**类型**

```ts
import type { SaveOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type SaveWithAssociationsListener = (model: Model, options?: SaveOptions) => HookReturn;
```

**示例**

```ts
db.on('afterSaveWithAssociations', async (model, options) => {
  // do something
});

db.on('books.afterSaveWithAssociations', async (model, options) => {
  // do something
});
```

### `'beforeDefineCollection'`

当定义一个数据表之前触发，如调用 `db.collection()` 时。

注：该事件是同步事件。

**签名**

```ts
on(eventName: 'beforeDefineCollection', listener: BeforeDefineCollectionListener): this
```

**类型**

```ts
import type { CollectionOptions } from '@nocobase/database';

export type BeforeDefineCollectionListener = (options: CollectionOptions) => void;
```

**示例**

```ts
db.on('beforeDefineCollection', (options) => {
  // do something
});
```

### `'afterDefineCollection'`

当定义一个数据表之后触发，如调用 `db.collection()` 时。

注：该事件是同步事件。

**签名**

```ts
on(eventName: 'afterDefineCollection', listener: AfterDefineCollectionListener): this
```

**类型**

```ts
import type { Collection } from '@nocobase/database';

export type AfterDefineCollectionListener = (options: Collection) => void;
```

**示例**

```ts
db.on('afterDefineCollection', (collection) => {
  // do something
});
```

### `'beforeRemoveCollection'` / `'afterRemoveCollection'`

当从内存中移除一个数据表前后触发，如调用 `db.removeCollection()` 时。

注：该事件是同步事件。

**签名**

```ts
on(eventName: 'beforeRemoveCollection' | 'afterRemoveCollection', listener: RemoveCollectionListener): this
```

**类型**

```ts
import type { Collection } from '@nocobase/database';

export type RemoveCollectionListener = (options: Collection) => void;
```

**示例**

```ts
db.on('beforeRemoveCollection', (collection) => {
  // do something
});

db.on('afterRemoveCollection', (collection) => {
  // do something
});
```
