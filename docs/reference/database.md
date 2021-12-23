---
toc: menu
---

# Database

## `db.sequelize`

Sequelize 实例

##### Definition

```ts
class Database {
  public sequelize: Sequelize;
}
```

##### Examples

直接调用 sequelize api

```ts
db.sequelize.close();
```

## `db.close()`

断开数据库连接

##### Definition

```ts
class Database {
  close(): Promise<void>;
}
```

##### Examples

```ts
await db.close();
```

## `db.collection()`

配置数据表、字段和索引等，更多字段配置查看 [Field Types](field-types)

##### Definition

```ts
class Database {
  collection(options: CollectionOptions) : Collection;
}

interface CollectionOptions {
  name: string;
  title?: string;
  // 自定义 model
  model?: string;
  // 自定义 repository
  repository?: string;
  // 字段配置
  fields?: FieldOptions;
}

// TODO，需要提供完善的 types，用于配置时提示
type FieldOptions;
```

##### Examples

配置 fields

```ts
const Post = db.collection({
  name: 'posts',
  fields: [
    { type: 'string', name: 'name' },
  ],
});
```

##### Model 和 Repository

Database 中，内置了 Active Record 模式的 Model 与 Data Mapper 模式的 Repository 来解决数据的 CRUD。但实际场景中，内置的 CRUD 并不能完全满足需求，我们可能需要为某些 Collection 提供自定义的数据操作方法。

假设我们要为用户创建一个按 first name 和 last name 返回用户的函数。如：

```ts
const User = db.collection({
  name: 'users',
  fields: [
    { type: 'string', name: 'firstName' },
    { type: 'string', name: 'lastName' },
  ],
});
```

##### Active Record 模式的 Model

```ts
class UserModel extends Model {
  static findByName(firstName: string, lastName: string): UserModel {
    return this.findOne({
      where: {
        firstName,
        lastName,
      },
    });
  }
}

db.registerModels({
  UserModel,
});

const User = db.collection({
  name: 'users',
  model: 'UserModel',
  fields: [
    { type: 'string', name: 'firstName' },
    { type: 'string', name: 'lastName' },
  ],
});

await User.model.findByName('San', 'Zhang');
```

##### Data Mapper 模式的 Repository

```ts
class UserRepository extends Repository {
  static findByName(firstName: string, lastName: string): Model {
    return this.findOne({
      where: {
        firstName,
        lastName,
      },
    });
  }
}

db.registerRepositories({
  UserRepository,
});

const User = db.collection({
  name: 'users',
  model: 'UserRepository',
  fields: [
    { type: 'string', name: 'firstName' },
    { type: 'string', name: 'lastName' },
  ],
});

await User.repository.findByName('San', 'Zhang');
```

##### Model 和 Repository 选择哪一个？

从模式来说，Active Record 和 Data Mapper 是两种不一样的策略。Active Record 比较简单，适用于简单场景，Data Mapper 在复杂的场景里更适合。

## `db.constructor()`

##### Definition

```ts
class Database {
  constructor (options: DatabaseOptions) => void;
}

type DatabaseOptions = Sequelize.Options | Sequelize;
```

##### Examples

配置 options 与 Sequelize.Options 一致，如：

```ts
const db = new Database({
  dialect: 'sqlite',
  storage: 'path/to/database.sqlite'
});
```

也可以直接传 sequelize 实例

```ts
const sequelize = new Sequelize('sqlite::memory:');
const db = new Database(sequelize);
```

注意，new Sequelize() 会有针对参数的 try catch 处理，Database 如果要捕获异常，也需要在 new 的时候 try catch，如：

```ts
try {
  const db = new Database({
    dialect: 'sqlite',
    storage: 'path/to/database.sqlite'
  });
} catch(error) {

}
```

## `db.emit()`

同步事件触发

##### Definition

##### Examples

## `db.emitAsync()`

异步事件触发

##### Definition

##### Examples

## `db.getCollection()` <Badge>待完善</Badge>

##### Definition

```ts
class Database {
  getCollection(name: string): Collection;
}
```

##### Examples

```ts
const collection = db.getCollection('tests');
```

## `db.hasCollection()` <Badge>待完善</Badge>

##### Definition

```ts
class Database {
  hasCollection(name: string): boolean;
}
```

##### Examples

```ts
if (db.hasCollection('tests')) {

}
```

## `db.import()` <Badge>待完善</Badge>

##### Definition

```ts
class Database {
  import(options: ImportOptions): Map<string, Collection>;
}

interface ImportOptions {
  // 配置所在文件夹
  directory: string;
  // 配置后置
  // @default ['js', 'ts', 'json']
  extensions?: string[];
}
// 为了配合 db.import()，提供了一个 extend 方法，用于扩展已有 collection 配置
function extend(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions) {}
```

##### Examples

导入某文件夹下的所有 Collection 配置

```ts
db.import({
  directory: '/path/to/collections',
  extensions: ['js', 'ts', 'json'],
});
```

db.import 的使用场景分析

```ts
// 假设在 A 插件里配置里 tests
db.collection({
  name: 'tests',
  { type: 'string', name: 'name1' },
  { type: 'string', name: 'name2' },
  { type: 'string', name: 'name3' },
});

// 在 B 插件里可能想给 tests 新增字段
const Test = db.getCollection('tests');
Test.addField('name4', {});
Test.addField('name5', {});
Test.addField('name6', {});

// 通过 db.import 的做法，文件不分先后，自动处理
// 文件1里
{
  name: 'tests',
  fields: [
    { type: 'string', name: 'name1' },
    { type: 'string', name: 'name2' },
    { type: 'string', name: 'name3' },
  ],
}

// 文件2里
extend({
  name: 'tests',
  fields: [
    { type: 'string', name: 'name4' },
  ],
});
```

extend 可以自定义 merge 规则（[deepmerge](https://www.npmjs.com/package/deepmerge#options)），如：

```ts
extend({
  name: 'demos',
  actions: [
    {
      name: 'list',
    },
  ],
}, {
  arrayMerge: (t, s) => t.concat(s),
})
```

备注：extend 的 fields、hooks 等 array 参数，默认都是 concat 规则，string 参数是覆盖，如：

```ts
{
  name: 'tests',
  repository: 'TestRepository1',
  fields: [
    { type: 'string', name: 'name1' },
  ],
}

extend({
  name: 'tests',
  repository: 'TestRepository2',
  fields: [
    { type: 'string', name: 'name2' },
  ],
});

// 等同于
{
  name: 'tests',
  repository: 'TestRepository2',
  fields: [
    { type: 'string', name: 'name1' },
    { type: 'string', name: 'name2' },
  ],
}
```

## `db.on()`

##### Definition

collection 的事件（都是同步的）

- `beforeDefineCollection`
- `afterDefineCollection`
- `beforeUpdateCollection`
- `afterUpdateCollection`
- `beforeRemoveCollection`
- `afterRemoveCollection`

model 的事件（异步的）

- `<modelHookType>`
- `<modelName>.<modelHookType>`

##### Examples

全局事件

```ts
db.on('beforeDefineCollection', (options: CollectionOptions) => {

});

db.on('afterDefineCollection', (collection: Collection) => {

});

db.on('afterCreate', async (model, options) => {

});
```

特定 model 事件

```ts
db.on('posts.afterCreate', async (model, options) => {

});
```

## `db.registerFieldTypes()`

自定义字段存储类型，更多字段类型查看 [Field Types](field-types)

##### Definition

```ts
class Database {
  registerFieldTypes(types: RegisterFieldTypes): void;
}

interface RegisterFieldTypes {
  [key: string]: Field;
}
```

##### Examples

```ts
class CustomField extends Field {
  get dataType() {
    return DataTypes.STRING;
  }
}

db.registerFieldTypes({ custom: CustomField });

db.collection({
  name: 'tests',
  fields: [
    { type: 'custom', name: 'customName' },
  ],
});
```

## `db.registerModels()` <Badge>待完善</Badge>

自定义 Model

##### Definition

```ts
class Database {
  registerModels(models: RegisterModels): void;
}

interface RegisterModels {
  [key: string]: Sequelize.Model;
}
```

##### Examples

```ts
class CustomModel extends Model {
  customMethod() {
    console.log('custom method');
  }
}

db.registerModels({
  CustomModel,
});

const Test = db.collection({
  name: 'tests',
  model: 'CustomModel',
});

const test = Test.model<CustomModel>.create();
test.customMethod();
```

## `db.registerOperators()` <Badge>待完善</Badge>

自定义筛选条件

##### Definition

```ts
class Database {
  registerOperators(operators: RegisterOperators): any;
}

interface RegisterOperators {
  [key: string]: (value: any, ctx?: RegisterOperatorsContext) => any;
}

interface RegisterOperatorsContext {
  db?: Database;
  path?: string;
  field?: Field;
}
```

##### Examples

大部分自定义 Operator，可以直接转换，如：

```ts
db.registerOperators({
  includes: (value, ctx) => {
    const dialect = ctx.db.sequelize.getDialect();
    return {
      [dialect === 'postgres' ? Op.iLike : Op.like]: `%${value}%`,
    }
  },
});

repository.find({
  filter: {
    'attr.$includes': 'abc',
  },
});
```

但是也有少量 Operator 比较复杂

```ts
db.registerOperators({
  anyOf: (value: any[], ctx) => {
    if (!values) {
      return Sequelize.literal('');
    }
    values = Array.isArray(values) ? values : [values];
    if (values.length === 0) {
      return Sequelize.literal('');
    }
    const { path } = ctx;
    const column = path
      .split('.')
      .map((name) => `"${name}"`)
      .join('.');
    const sql = values
      .map((value) => `(${column})::jsonb @> '${JSON.stringify(value)}'`)
      .join(' OR ');
    return Sequelize.literal(sql);
  },
});

repository.find({
  filter: {
    'attr.$anyOf': ['val1', 'val2'],
  },
});
```

更多例子：

```ts
db.collection({
  name: 'users',
  fields: [
    { type: 'date', name: 'birthday' },
  ],
});

db.collection({
  name: 'posts',
  fields: [
    { type: 'belongsTo', name: 'user' },
  ],
});

repository.find({
  filter: {
    'birthday.$dateOn': '1999-01-02',
  },
});

db.registerOperators({
  dateOn: (value, ctx) => {
    console.log(value) // 1999-01-02
    console.log(ctx.path) // birthday
    console.log(ctx.field) // ctx.field instanceof DateField
  }
});

repository.find({
  filter: {
    $and: [
      { 'birthday.$dateOn': '1999-01-02' },
    ]
  },
});

db.registerOperators({
  dateOn: (value, ctx) => {
    console.log(value) // 1999-01-02
    console.log(ctx.path) // birthday
    console.log(ctx.field) // ctx.field instanceof DateField
  },
});

repository.find({
  filter: {
    $and: [
      { 'user.birthday.$dateOn': '1999-01-02' },
    ]
  },
});

db.registerOperators({
  dateOn: (value, ctx) => {
    console.log(value) // 1999-01-02
    console.log(ctx.path) // user.birthday
    console.log(ctx.field) // ctx.field instanceof DateField
  },
});

repository.find({
  filter: {
    $or: [
      {
        $and: [
          {'user.birthday.$dateOn': '1999-01-02'}
        ],
      },
    ],
  },
});

db.registerOperators({
  dateOn: (value, ctx) => {
    console.log(value) // 1999-01-02
    console.log(ctx.path) // user.birthday
    console.log(ctx.field) // ctx.field instanceof DateField
  }
});
```

## `db.registerRepositories()` <Badge>待完善</Badge>

自定义 Repository

##### Examples

```ts
class CustomRepository extends Repository {
  customMethod() {
    console.log('custom method');
  }
}

db.registerModels({
  CustomRepository,
});

const Test = db.collection({
  name: 'tests',
  repository: 'CustomRepository',
});

Test.repository<CustomRepository>.customMethod();
```

## `db.removeCollection()` <Badge>待完善</Badge>

移除 collection

##### Definition

```ts
class Database {
  removeCollection(name: string): Collection;
}
```

##### Examples

```ts
db.removeCollection('tests');
```

## `db.sync()`

将所有定义的 Collections 同步给数据库。

##### Definition

```ts
class Database {
  sync(options?: Sequelize.SyncOptions): Promise<Database>;
}
```

##### Examples

```ts
await db.sync();
await db.sync({force: true});
```
