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

### CollectionRepository.load()

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

### CollectionRepository.import()

导入配置

##### Definition

```ts
class CollectionRepository extends Repository {
  async import(data: CollectionOptions, options?: ImportOptions): void;
}

interface ImportOptions {
  migrate?: boolean;
}
```

##### Examples

```ts
const Collection = db.getCollection('collections');
await Collection.repository.import({
  name: 'tests',
  fields: [
    { type: 'string', name: 'name' },
  ],
});
```

## Model API

### CollectionModel.migrate()

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

### FieldModel.migrate()

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

## plugin-collections 和 db.collection() 的区别

- plugin-collections 增加了绑定组件的相关参数：interface、uiSchema
- plugin-collections 的配置存储在数据表里，再同步给 db.collection()
- db.collection() 适用于配置较固定的系统表
- plugin-collections 适用于配置业务表

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
