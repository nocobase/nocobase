# Collection

Collection 数据表类。

## 类型

```tsx | pure
interface CollectionOptions {
  name: string;
  title?: string;
  fields?: FieldOptions[];
  // ....
}

class CollectionV2 {
  constructor(options: CollectionOptions) {}
  collectionManager: CollectionManagerV2;
  name: string;
  primaryKey: string;
  titleField: string;

  getOptions(): CollectionOptions;
  setOptions(options: CollectionOptions): void;
  getOption<K extends keyof CollectionOptions>(key: K): CollectionOptions[K];

  getFields(predicate?: CollectionFieldOptions | ((collection: CollectionFieldOptions) => boolean) | keyof CollectionFieldOptions): any[]
  getField(name: SchemaKey): CollectionFieldOptions
  hasField(name: SchemaKey): boolean;
}
```

```tsx | pure
const usersCollection = new CollectionV2({
  name: 'users',
  title: 'Users',
  fields: [
    {
      type: 'string',
      name: 'username',
    },
    {
      type: 'integer',
      name: 'age',
    },
  ],
});
```

## CollectionOptions

```tsx | pure
interface CollectionOptions {
  name: string;
  title?: string;
  namespace?: string;
  /**
   * Used for @nocobase/plugin-duplicator
   * @see packages/core/database/src/collection-group-manager.tss
   *
   * @prop {'required' | 'optional' | 'skip'} dumpable - Determine whether the collection is dumped
   * @prop {string[] | string} [with] - Collections dumped with this collection
   * @prop {any} [delayRestore] - A function to execute after all collections are restored
   */
  duplicator?:
    | dumpable
    | {
        dumpable: dumpable;
        with?: string[] | string;
        delayRestore?: any;
      };

  tableName?: string;
  inherits?: string[] | string;
  viewName?: string;
  writableView?: boolean;

  filterTargetKey?: string;
  fields?: FieldOptions[];
  model?: any;
  repository?: any;
  sortable?: CollectionSortable;
  /**
   * @default true
   */
  autoGenId?: boolean;
  /**
   * @default 'options'
   */
  magicAttribute?: string;

  tree?: string;

  template?: string;

  [key: string]: any;
}
```

- name: Collection 的标识，必须唯一。

- title: Collection 的标题，用于显示。

- fields: 字段列表，详细说明请查看 [CollectionField](/core/collection/collection-field)

- template: 模板标识，用于标识该 Collection 是由哪个模板创建的，详细说明请查看 [CollectionTemplate](/core/collection/collection-template)

- namespace

- duplicator

- tableName

- inherits

- viewName

- writableView

- filterTargetKey

- model

- repository


## 实例属性

### collection.name

collection 的标识。

### collection.collectionManager

[CollectionManager](/core/collection/collection-manager) 的实例。

### collection.primaryKey

主键字段的 name 属性。

### collection.titleFieldName

标题字段的 name 属性。

## 实例方法

### collection.getOptions()

获取 collection 的所有配置项。

- 类型

```tsx | pure
class CollectionV2 {
  getOptions(): CollectionOptions;
}
```

- 示例

```tsx | pure
const usersCollection = new CollectionV2({
  name: 'users',
  title: 'Users',
  fields: [
    // ...
  ],
});

console.log(usersCollection.getOptions()); // { name: 'users', title: 'Users', fields: [ ] }
```

### collection.setOptions(options)

设置 collection 的配置项，最终会和默认配置项进行合并。

- 类型

```tsx | pure
class CollectionV2 {
  setOptions(options: CollectionOptions): void;
}
```

- 示例

```tsx | pure
collection.setOptions({
  name: 'users',
  title: 'Users',
  fields: [
    // ...
  ],
});
```

### collection.getOption(key)

获取 collection 的单个配置项。

- 类型

```tsx | pure
class CollectionV2 {
  getOption<K extends keyof CollectionOptions>(key: K): CollectionOptions[K];
}
```

- 示例

```tsx | pure
collection.getOption('name'); // 'users'
collection.getOption('title'); // 'Users'
```

### collection.getFields(predicate?)

获取 collection 的字段列表。

- 类型

```tsx | pure
class CollectionV2 {
  getFields(predicate?: CollectionFieldOptions | ((collection: CollectionFieldOptions) => boolean) | keyof CollectionFieldOptions): any[]
}
```

- 详解
  - predicate
    - 类型
      - `CollectionFieldOptions`
      - `(collection: CollectionFieldOptions) => boolean`
      - `keyof CollectionFieldOptions`
    - 说明
      - 如果传递了 `predicate`，则返回符合条件的字段列表
      - 如果没有传递 `predicate`，则返回所有字段列表

`predicate` 的使用可看参考 [lodash.filter](https://www.lodashjs.com/docs/lodash.filter)。

- 示例

```tsx | pure
collection.getFields(); // [{ name: 'username', type: 'string', primaryKey: true }, { name: 'age', type: 'integer' }]

collection.getFields({ name: 'age' }); // [{ name: 'age', type: 'integer' }]

collection.getFields('primaryKey'); // [{ name: 'username', type: 'string', primaryKey: true }]

collection.getFields(field => field.type === 'string'); // [{ name: 'name', type: 'string' }]
```

### collection.getField(name)

获取 collection 的单个字段。

- 类型

```tsx | pure
class CollectionV2 {
  getField(name: SchemaKey): CollectionFieldOptions
}
```

- 示例

```tsx | pure
collection.getField('username'); // { name: 'username', type: 'string', primaryKey: true }
```

### collection.hasField(name)

判断 collection 是否存在某个字段。

- 类型

```tsx | pure
class CollectionV2 {
  hasField(name: SchemaKey): boolean;
}
```

- 示例

```tsx | pure
collection.hasField('username'); // true
collection.hasField('name'); // false
```
