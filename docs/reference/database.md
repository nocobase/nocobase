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

自定义 model 见 [db.registerModels()](#dbregistermodels)

自定义 repository 见 [db.registerRepositories()](#dbregisterrepositories)

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
```

##### Examples

导入某文件夹下的所有 Collection 配置

```ts
db.import({
  directory: '/path/to/collections',
  extensions: ['js', 'ts', 'json'],
});
```

## `db.on()` <Badge>待完善</Badge>

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
