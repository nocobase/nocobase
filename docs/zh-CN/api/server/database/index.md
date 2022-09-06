# Database

NocoBase 内置的数据库访问类，通过封装 [Sequelize](https://sequelize.org/) 提供了更加简单的数据库访问接口和统一化的 JSON 数据库表配置方式，同时也提供了扩展字段类型和查询操作符的能力。

Database 类继承自 EventEmitter，可以通过 `db.on('event', callback)` 监听数据库事件。

## 构造函数

**签名**

* `constructor(options: DatabaseOptions)`

创建一个数据库实例。

**参数**

`options` 参数与 [Sequelize 的构造参数](https://sequelize.org/api/v6/class/src/sequelize.js~sequelize#instance-constructor-constructor)一致的部分会透传至 Sequelize，同时 NocoBase 也会使用一些额外的参数：

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `options.tablePrefix` | `string` | `''` | 表名前缀 |
| `options.migrator` | `UmzugOptions` | `{}` | 迁移管理器相关参数，参考 [Umzug](https://github.com/sequelize/umzug/blob/main/src/types.ts#L15) 实现 |

**示例**

```ts
import Database from '@nocobase/database';

const app = new Database({
  dialect: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: '123456',
  database: 'test',
  tablePrefix: 'my_'
});
```

## 实例成员

### `sequelize`

初始化后的 Sequelize 实例，在需要使用 sequelize 底层方法时可以调用，相关信息可以直接参考 sequelize 的文档。

### `options`

初始化的配置参数，包含了 Sequelize 的配置参数和 NocoBase 的额外配置参数。

## 实例方法

### `addMigrations()`

添加迁移文件。

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

ModelClass === MyModel // true
```

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

### `sync()`

同步数据库表结构。

