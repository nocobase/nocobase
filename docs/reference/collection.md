---
toc: menu
---

# Collection

## `collection.addField()`

添加字段，如果字段 name 已存在，直接替换。

##### Definition

```ts
interface addField {
  (name: string, options: FieldOptions): Field;
}
```

##### Examples

```ts
const field = collection.addField('name1', {
  type: 'string',
});
await field.sync();
```

## `collection.findField()`

##### Definition

```ts
interface findField {
  (fn: (field: Field) => boolean): Field;
}
```

##### Examples

```ts
const field = collection.findField((field) => {
  return field.name === 'name1';
});
```

## `collection.forEachField()`

##### Definition

```ts
interface forEachField {
  (fn: (field: Field) => void): void;
}
```

##### Examples

```ts
collection.forEachField((field) => {

});
```

## `collection.getField()`

获取字段

##### Definition

```ts
interface getField {
  (name: string): Field;
}
```

##### Examples

```ts
const field = collection.getField('name');
```

## `collection.hasField()`

是否存在某字段

##### Definition

```ts
interface hasField {
  (name: string): boolean;
}
```

##### Examples

```ts
collection.hasField('name');
```

## `collection.updateOptions()`

更改当前 collection 的 options

##### Definition

```ts
interface updateOptions {
  (options: CollectionOptions): void;
}
```

##### Examples

```ts
const collection = db.collection({
  name: 'tests',
});

collection.updateOptions({
  createdAt: true,
  updatedAt: true,
  sortable: true,
  fields: [],
});
```

## `collection.removeField()`

移除字段

##### Definition

```ts
interface removeField {
  (name: string): Field;
}
```

##### Examples

```ts
collection.removeField('name');
```

## `collection.setFields()`

设置 fields，会清空之前配置的 fields。

##### Definition

```ts
interface setFields {
  (fields: FieldOptions[]): void;
}
```

##### Examples

```ts
const collection = db.collection({
  name: 'tests',
});
collection.setFields([
  { type: 'string', name: 'name1' },
  { type: 'string', name: 'name2' },
]);
```

## `collection.sync()`

##### Definition

```ts
interface sync {
  (options?: SyncOptions): Promise<void>;
}
```

##### Examples

如果关联表不存在，不处理

```ts
const Post = db.collection({
  name: 'posts',
  fields: [
    { type: 'string', name: 'name' },
    // tags 跳过
    { type: 'belongsToMany', name: 'tags' },
  ],
});
await Post.sync();
```

如果关系表存在，一起处理

```ts
const Post = db.collection({
  name: 'posts',
  fields: [
    { type: 'string', name: 'name' },
    { type: 'belongsToMany', name: 'tags' },
  ],
});
const Tag = db.collection({
  name: 'tags',
  fields: [{ type: 'string', name: 'name' }],
});
await Post.sync();
// 等同于
await db.sequelize.models.posts.sync();
await db.sequelize.models.tags.sync();
await db.sequelize.models.posts_tags.sync();
```

## `collection.updateField()`

更新字段配置

##### Definition

```ts
interface updateField {
  (name: string, options: FieldOptions): Field;
}
```

##### Examples

更改 name

```ts
const field = collection.updateField('name1', {
  name: 'name2',
});
await field.sync();
```
