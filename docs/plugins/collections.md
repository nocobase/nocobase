# collections

提供 HTTP API 的方式管理数据表和字段

## HTTP API

### Collections

```bash
GET     /api/collections
POST    /api/collections
GET     /api/collections/<collectionName>
PUT     /api/collections/<collectionName>
DELETE  /api/collections/<collectionName>
```

### Fields

```bash
GET     /api/collections/<collectionName>/fields
POST    /api/collections/<collectionName>/fields
GET     /api/collections/<collectionName>/fields/<fieldName>
PUT     /api/collections/<collectionName>/fields/<fieldName>
DELETE  /api/collections/<collectionName>/fields/<fieldName>
```

<Alert title="注意">

- 方便开发使用，API Route 上直接暴露的是 collectionName 和 fieldName，这样的可读性更好，但是如果修改了 collectionName 和 fieldName，可能会导致很多不可预知问题，所以要谨慎修改，或者不允许修改。
- fieldName 只在某 collectionName 下是唯一的。fields 表要为 collectionName 和 fieldName 建立唯一索引。

</Alert>

## Repository API

### `CollectionRepository.load()`

将符合条件的 collections 配置导入 db.collections

##### Definition

```ts
class CollectionRepository extends Repository {
  async load(options?: LoadOptions): void;
}
```

##### Examples

```ts
const Collection = db.getCollection('collections');
await Collection.repository.load({
  filter: {},
});
```

## Model API

### `CollectionModel.migrate()`

将配置导入 db.collections，并执行 collection.sync()

##### Definition

```ts
class CollectionModel extends Model {
  migrate(options?: MigrateOptions): Promise<void>;
}
```

##### Examples

```ts
const collection = await Collection.repository.create({
  name: 'tests',
});
await collection.migrate();
```

### `FieldModel.migrate()`

将 field 配置导入对应 db.collection，并执行 collection.sync()

##### Definition

```ts
class FieldModel extends Model {
  migrate(options?: MigrateOptions): Promise<void>;
}
```

##### Examples

```ts
const Field = db.getCollection('fields');
const field = await Field.repository.create({
  type: 'string',
  name: 'title',
  collectionName: 'tests',
});
await field.migrate();
```

<Alert title="注意">
数据表里的 collections & fields 配置并不直接同步给 db，而是在需要的时候通过执行 migrate 方法处理。
</Alert>

## FAQs

### plugin-collections vs db.collection()

- plugin-collections 增加了绑定组件的相关参数：interface、uiSchema
- plugin-collections 的配置存储在数据表里，再同步给 db.collection()
- db.collection() 适用于配置较固定的系统表
- plugin-collections 适用于配置动态的业务表

## 参数说明

CollectionOptions 与 Database 提供的略有不同，多了一些扩展参数（数据库里也无法直接存对象和函数类型）。

```ts
interface CollectionOptions {
  // 数据表名（英文）、标识，具备唯一性，缺失时，随机生成
  name: string;
  // 数据表标题
  title?: string;
  fields?: FieldOptions[];
  // 是否可以排序，默认为 true，会自动隐式生成一个 sort 字段
  sortable?: true | SortableType;
  // 操作日志记录，有 action-logs 插件提供，默认为 true
  logging?: boolean;
  // 是否记录创建人信息，由 users 插件提供，默认为 true
  createdBy?: boolean;
  // 是否记录最后修改人信息，由 users 插件提供，默认为 true
  updatedBy?: boolean;

  // 其他可能用到的 Sequelize ModelOptions 参数
  scopes?: any;
  defaultScope?: any;
  timestamps?: boolean;
  paranoid?: boolean;
  createdAt?: string | boolean;
  deletedAt?: string | boolean;
  updatedAt?: string | boolean;
}
```

FieldOptions 与 Database 提供的略有不同，多了一些扩展参数

```ts
interface FieldOptions {
  // 字段唯一标识，PK 字段，非 name
  key: string;
  // 字段名（英文标识），缺失时随机生成，只在某 collectionName 下是唯一的
  name: string;
  // 属于哪个表
  collectionName: string;
  // 前端组件模板
  interface?: string;
  // Formily Schema
  uiSchema?: ISchema;
  // 子字段，如子表格字段
  children?: FieldOptions[];
  // ... 其他参数与 Database 的 Field Types 的一致
}
```

## Examples

<Alert title="注意">
例子待补充
</Alert>

简单的配置

```ts
Collection.repository.create({
  name: 'tests',
  fields: [
    { type: 'string', name: 'title' },
    { type: 'text', name: 'content' },
  ],
});
```

带 uiSchema 的配置

```ts
Collection.repository.create({
  name: 'tests',
  fields: [
    { type: 'string', name: 'title' },
    { type: 'text', name: 'content', uiSchema: {}, interface: 'markdown' },
  ],
});
```
