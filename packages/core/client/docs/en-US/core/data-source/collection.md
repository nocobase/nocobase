# Collection

The Collection class represents a data table and is managed by the [CollectionManager](/core/data-source/collection-manager).

## 类型

```tsx | pure
interface CollectionOptions {
  name: string;
  title?: string;
  fields?: FieldOptions[];
  // ....
}

class Collection {
  app: Application;
  collectionManager: CollectionManager;

  constructor(options: CollectionOptions) {}

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
const usersCollection = new Collection({
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
export interface CollectionOptions {
  name: string;
  title?: string;
  dataSource?: string;
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
  inherit?: string;
  key?: string;
  viewName?: string;
  writableView?: boolean;

  filterTargetKey?: string;
  fields?: CollectionFieldOptions[];
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

  isThrough?: boolean;
  autoCreate?: boolean;
  resource?: string;
  collectionName?: string;
  sourceKey?: string;
  uiSchema?: any;
  [key: string]: any;
}
```

- name: The identifier of the Collection, must be unique.

- title: The title of the Collection, used for display.

- fields: The list of fields, for more details please refer to [CollectionField](/core/data-source/collection-field)

- template: The template identifier, used to identify which template the Collection is created from, for more details please refer to [CollectionTemplate](/core/data-source/collection-template)

- dataSource: The data source identifier, used to identify which data source the Collection is created from, for more details please refer to [CollectionDataSource](/core/data-source/collection-manager#datasource)

- duplicator

- tableName

- inherits

- viewName

- writableView

- filterTargetKey

- model

- repository


## Instance Properties

### collection.collectionManager

[CollectionManager](/core/data-source/collection-manager) 的实例。

### collection.titleFieldName

The `name` property of the title field.

### Other Properties

Other properties are the same as [CollectionOptions](/core/data-source/collection#collectionoptions).

## Instance Methods

### collection.getOptions()

Get all configuration options of the collection.

- Type

```tsx | pure
class Collection {
  getOptions(): CollectionOptions;
}
```

- Example

```tsx | pure
const usersCollection = new Collection({
  name: 'users',
  title: 'Users',
  fields: [
    // ...
  ],
});

console.log(usersCollection.getOptions()); // { name: 'users', title: 'Users', fields: [ ] }
```

### collection.setOptions(options)

Set the configuration options for the collection, which will be merged with the default configuration options.

- Type

```tsx | pure
class Collection {
  setOptions(options: CollectionOptions): void;
}
```

- Example

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

Get a single configuration option of the collection.

- Type

```tsx | pure
class Collection {
  getOption<K extends keyof CollectionOptions>(key: K): CollectionOptions[K];
}
```

- Example

```tsx | pure
collection.getOption('name'); // 'users'
collection.getOption('title'); // 'Users'
```

### collection.getFields(predicate?)

Get the list of fields for the collection.

- Type

```tsx | pure
class Collection {
  getFields(predicate?: CollectionFieldOptions | ((collection: CollectionFieldOptions) => boolean) | keyof CollectionFieldOptions): any[]
}
```

- Details
  - predicate
    - Type
      - `CollectionFieldOptions`
      - `(collection: CollectionFieldOptions) => boolean`
      - `keyof CollectionFieldOptions`
    - Description
      - If `predicate` is provided, it returns a list of fields that meet the condition.
      - If `predicate` is not provided, it returns a list of all fields.

The usage of `predicate` can be referred to [lodash.filter](https://www.lodashjs.com/docs/lodash.filter).

- Example

```tsx | pure
collection.getFields(); // [{ name: 'username', type: 'string', primaryKey: true }, { name: 'age', type: 'integer' }]

collection.getFields({ name: 'age' }); // [{ name: 'age', type: 'integer' }]

collection.getFields('primaryKey'); // [{ name: 'username', type: 'string', primaryKey: true }]

collection.getFields(field => field.type === 'string'); // [{ name: 'name', type: 'string' }]
```

### collection.getField(name)

Get a single field of the collection.

- Type

```tsx | pure
class Collection {
  getField(name: SchemaKey): CollectionFieldOptions
}
```

- Example

```tsx | pure
collection.getField('username'); // { name: 'username', type: 'string', primaryKey: true }
```

### collection.hasField(name)

Check if a collection has a specific field.

- Type

```tsx | pure
class Collection {
  hasField(name: SchemaKey): boolean;
}
```

- Example

```tsx | pure
collection.hasField('username'); // true
collection.hasField('name'); // false
```
