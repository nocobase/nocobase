# CollectionManager

用于管理数据表相关信息，其在 [Application](/core/application/application) 存在一个全局实例，可在 [插件](/core/application/plugin) 中通过 `this.app.collectionManager` 访问实例。

- 类型

```tsx | pure
interface CollectionManagerOptionsV2 {
  collections?: CollectionOptionsV2[];
  collectionTemplates?: (typeof CollectionTemplate)[];
  fieldInterfaces?: (typeof CollectionFieldInterface)[];
  fieldGroups?: Record<string, { label: string; order?: number }>;
  collectionNamespaces?: Record<string, string>;
  collectionMixins?: CollectionMixinConstructor[];
}

interface GetCollectionOptions {
  ns?: string;
}

class CollectionManagerV2 {
  public app: Application;

  constructor(options: CollectionManagerOptionsV2 = {}, app: Application);

  addCollectionNamespaces(collectionNamespaces: Record<string, string>): void;
  getCollectionNamespaces(): { name: string; title: string }[];

  addCollectionTemplates(templateClasses: (typeof CollectionTemplate)[]): void;
  getCollectionTemplates(): CollectionTemplate[];
  getCollectionTemplate<T extends CollectionTemplate>(name: string): T

  addCollections(collections: CollectionOptionsV2[], options: GetCollectionOptions = {}): void
  setCollections(collections: CollectionOptionsV2[], options: GetCollectionOptions = {}): void
  getAllCollections(): Record<string, Record<string, CollectionV2>>
  getCollections(predicate?: (collection: CollectionV2) => boolean, options: GetCollectionOptions = {})
  getCollection<Mixins = {}>(path: string, options: GetCollectionOptions = {}): (Mixins & CollectionV2) | undefined
  getCollectionName(path: string, options?: GetCollectionOptions): Promise<string | undefined>;
  getCollectionFields(collectionName: string, options: GetCollectionOptions = {}): CollectionFieldOptionsV2[];
  getCollectionField(path: string, options?: GetCollectionOptions): Promise<CollectionFieldOptions | undefined>;

  addFieldInterfaces(interfaces: (typeof CollectionFieldInterface)[]): void;
  getFieldInterfaces(): CollectionFieldInterface[];
  getFieldInterface<T extends CollectionFieldInterface>(name: string): T;

  addFieldGroups(fieldGroups: Record<string, { label: string; order?: number }>): void;
  getFieldGroups():  Record<string, { label: string; order?: number }>;
  getFieldGroup(name: string): { label: string; order?: number };

  addCollectionMixins(mixins: CollectionMixinConstructor[]): void;
}
```

相关文档：

- Collections：数据表，具体参考：[Collection](/core/collection/collection)
- CollectionTemplate：数据表模板，具体参考：[CollectionTemplate](/core/collection/collection-template)
- FieldInterface：数据表字段，具体参考：[CollectionFieldInterface](/core/collection/collection-field-interface)
- CollectionNamespace：数据表命名空间，具体参考：[CollectionNamespace](/core/collection/collection-manager#collection-namespace)
- CollectionMixins：数据表类的扩展，具体参考：[Collection Mixins](/core/collection/collection-manager#collection-mixins)
- FieldGroups：数据字段类，具体参考：[Field Groups](/core/collection/collection-manager#field-groups)

## Collection Namespace

NocoBase 支持[多数据源](#)，每个数据源在 Collection 中对应一个命名空间。命名空间是一个 Key-Value 对象，Key 为命名空间名称，Value 为标题。例如：

```tsx | pure
{
  "main": "主数据源",
  "db2": "DB2"
}
```

在调用 `collectionManager.getCollections()` 等方法时，可以通过 `ns` 参数指定命名空间，例如：

```tsx | pure
const collections = collectionManager.getCollections('db2');
```

如果不传递 `ns` 参数，则返回默认命名空间的数据表。

## Collection Mixins

Collection Mixins 是为扩展 Collection 类提供的一种机制，可以通过 `collectionManager.addCollectionMixins()` 添加 Collection Mixins。

### 定义和注册

```tsx | pure
import { CollectionV2, Plugin } from '@nocobase/client';

class TestMixin extends CollectionV2 {
  test() {
    const { name } = this.options;
    return 'test '+ name;
  }
}

class MyPlugin extends Plugin {
  async load() {
    this.app.collectionManager.addCollectionMixins([TestMixin]);
  }
}
```

### 使用

- 使用方式1：在 `CollectionManager` 实例上调用 `getCollection()` 获取指定 `Collection` 实例。

```tsx | pure
const Demo = () => {
  const cm = useCollectionManager();
  const userCollection = cm.getCollection<TestMixin>('users');

  userCollection.test(); // 'test users'
}
```

- 使用方式2：调用 `useCollection()` 获取当前上下文的数据表信息。

```tsx | pure
const Demo = () => {
  const collection = useCollection<TestMixin>();
  collection.test(); // 'test users'
}
```

### 多个 Mixins 的使用

如果添加了 Mixins，可通过如下方式获得类型提示：

```tsx | pure
const Demo = () => {
  const collection = useCollection<TestMixin & Test2Mixin>();
}
```

<code src='./demos/collection-manager/mixins.tsx'></code>

## Field Groups

Field Groups 是用来对数据表字段进行分组的。

![Field Groups](./images/field-groups.png)

```tsx | pure
import { Plugin } from '@nocobase/client';

class MyPlugin extends Plugin {
  async load() {
    this.app.collectionManager.addFieldGroups({
      "basic": {
        label: "Basic",
        order: 1
      },
      "test": {
        label: "Test Group",
        order: 2
      }
    });
  }
}
```

## new CollectionManagerV2(options)

创建一个新的 `CollectionManagerV2` 实例。

- 类型

```tsx | pure
interface CollectionManagerOptionsV2 {
  collections?: CollectionOptionsV2[];
  collectionTemplates?: (typeof CollectionTemplate)[];
  fieldInterfaces?: (typeof CollectionFieldInterface)[];
  fieldGroups?: Record<string, { label: string; order?: number }>;
  collectionNamespaces?: Record<string, string>;
  collectionMixins?: CollectionMixinConstructor[];
}
```

- 参数说明

1. 基础使用：

```tsx | pure
// users
const userCollectionOptions = {
  "name": "users",
  "title": "Users",
  fields: [
    // ...
  ],
};

// collection template
class TreeCollectionTemplate extends CollectionTemplate {
  name = 'tree';
  type = 'object';
  title = '{{t("Tree collection")}}';
  configurableProperties = {
    // ...
  }
}


// field interface
class CheckboxFieldInterface extends CollectionFieldInterface {
  name = 'checkbox';
  type = 'object';
  group = 'choices';
  title = '{{t("Checkbox")}}';
  // ...
}

// collection mixins
class TestMixin extends CollectionV2 {
  test() {
    return 'test';
  }
}

const app = new Application({
  collectionManager: {
    collections: [userCollectionOptions],
    collectionTemplates: [TreeCollectionTemplate],
    fieldInterfaces: [CheckboxFieldInterface],
    collectionNamespaces: {
      "db2": "DB2"
    },
    fieldGroups: {
      'test': {
        label: 'Test',
        order: 1,
      }
    },
    collectionMixins: [TestMixin],
  }
});
```

2. `collections` 如果是一个对象，则 Key 为命名空间名称，Value 为数据表数组；如果是数组，则会添加到默认命名空间。例如：

```tsx | pure
import { DEFAULT_COLLECTION_NAMESPACE_NAME } from '@nocobase/client';

const collectionManager = new CollectionManager({
  collections: {
    [DEFAULT_COLLECTION_NAMESPACE_NAME]: [postCollection],
    "db2": [userCollection],
  }
})
```


```tsx | pure
import { DEFAULT_COLLECTION_NAMESPACE_NAME } from '@nocobase/client';

const collectionManager = new CollectionManager({
  collections: [userCollection]
})

// 等同于
const collectionManager = new CollectionManager({
  collections: {
    [DEFAULT_COLLECTION_NAMESPACE_NAME]: [userCollection]
  }
})
```

## 结合插件

```tsx | pure
import { Plugin } from '@nocobase/client';

class MyPlugin extends Plugin {
  async load()  {
    this.app.collectionManager.addCollectionNamespaces({
      "db2": "DB2"
    });

    this.app.collectionManager.addCollectionTemplates([ TreeCollectionTemplate, SqlCollectionTemplate ]);
    this.app.collectionManager.addFieldInterfaces([CheckboxFieldInterface]);
  }
}
```

## 实例方法

### cm.addCollectionNamespaces(collectionNamespaces)

添加数据表命名空间。

- 类型

```tsx | pure
class CollectionManagerV2 {
  addCollectionNamespaces(collectionNamespaces: Record<string, string>): void;
}
```

- 示例

```tsx | pure
import { Plugin } from '@nocobase/client';

class MyPlugin extends Plugin {
  async load() {
    this.app.collectionManager.addCollectionNamespaces({
      "db2": "DB2"
    });
  }
}
```

### cm.getCollectionNamespaces()

获取数据表命名空间。

- 类型

```tsx | pure
class CollectionManagerV2 {
  getCollectionNamespaces(): { name: string; title: string }[];
}
```

- 示例

```tsx | pure
collectionManager.getCollectionNamespaces(); // [ { name: 'main', title: '主数据源' }, { name: 'db2', title: 'DB2' }]
```

### cm.addCollectionTemplates(templates)

添加数据表模板的类。

- 类型

```tsx | pure
collectionManager.addCollectionTemplates(templateClasses: (typeof CollectionTemplate)[]): void;
```

- 示例

```tsx | pure
class SqlCollectionTemplate extends CollectionTemplate {
  name = 'sql';
  type = 'object';
  title = '{{t("SQL collection")}}';
  configurableProperties = {
    // ...
  }
}

class TreeCollectionTemplate extends CollectionTemplate {
  name = 'tree';
  type = 'object';
  title = '{{t("Tree collection")}}';
  configurableProperties = {
    // ...
  }
}

class MyPlugin extends Plugin {
  async load() {
    this.collectionManager.addCollectionTemplates([ SqlCollectionTemplate, TreeCollectionTemplate ]);
  }
}
```

更多关于数据表模板的信息，请参考：[CollectionTemplate](/core/collection/collection-template)

### cm.getCollectionTemplates()

获取数据表模板实例列表。

- 类型

```tsx | pure
class CollectionManagerV2 {
  getCollectionTemplates(): CollectionTemplate[];
}
```

- 示例

```tsx | pure
collectionManager.getCollectionTemplates(); // [ treeCollectionTemplate, sqlCollectionTemplate ]
```

### getCollectionTemplate(name: string)

获取数据表模板的实例。

- 类型

```tsx | pure
class CollectionManagerV2 {
  getCollectionTemplate<T extends CollectionTemplate>(name: string): T
}
```

- 详解

如果不传递 `name` 参数，则返回默认模板实例。

- 示例

```tsx | pure
collectionManager.getCollectionTemplate(); // generalCollectionTemplate

collectionManager.getCollectionTemplate('tree'); // treeCollectionTemplate
```

### cm.addCollectionMixins(mixins)

添加数据表类的扩展。

- 类型

```tsx | pure
class CollectionManagerV2 {
  addCollectionMixins(mixins: CollectionMixinConstructor[]): void;
}
```

- 示例

```tsx | pure

class TestMixin extends CollectionV2 {
  test() {
    return 'test';
  }
}


class MyPlugin extends Plugin {
  async load() {
    this.app.collectionManager.addCollectionMixins([TestMixin]);
  }
}
```

### cm.addCollections(collections, options?)

添加数据表。

- 类型

```tsx | pure
class CollectionManagerV2 {
  addCollections(collections: CollectionOptionsV2[], options: GetCollectionOptions = {}): void
}
```

- 示例

```tsx | pure
const userCollectionOptions = {
  "name": "users",
  "title": "Users",
  fields: [
    // ...
  ],
};

class MyPlugin extends Plugin {
  async load() {
    this.collectionManager.addCollections([userCollectionOptions]);
  }
}
```

更多关于数据表的信息，请参考：[Collection](/core/collection/collection)

### cm.getAllCollections()

获取所有数据表。

- 类型

```tsx | pure
class CollectionManagerV2 {
  getAllCollections(): Record<string, Record<string, CollectionV2>>
}
```

- 示例

```tsx | pure
collectionManager.getAllCollections(); // { main: { users: userCollection }， db2: {  } }
```

### cm.getCollections(predicate?, options?)

获取数据表。

- 类型

```tsx | pure
class CollectionManagerV2 {
  getCollections(predicate?: (collection: CollectionV2) => boolean, options: GetCollectionOptions = {})
}
```

- 详解

1. 如果不传递 `ns` 参数，则返回默认命名空间的数据表。
2. 如果传递 `ns` 参数，则返回指定命名空间的数据表。
3. 如果传递 `predicate` 参数，则返回符合条件的数据表。

- 示例

```tsx | pure
collectionManager.getCollections(); // [ userCollection ]

collectionManager.getCollections('db2'); // [ postCollection ]

collectionManager.getCollections(collection => collection.name === 'posts', { ns: 'db2' }); // [ postCollection ]
```

### cm.setCollections(collections, options?)

重置数据表，会先移除所有数据表，然后再调用 `cm.addCollections()` 添加数据表。

- 类型

```tsx | pure
class CollectionManagerV2 {
  setCollections(collections: CollectionOptionsV2[], options: GetCollectionOptions = {}): void
}
```

### cm.getCollection(path, options?)

获取数据表。

- 类型

```tsx | pure
class CollectionManagerV2 {
  getCollection<Mixins = {}>(path: string, options: GetCollectionOptions = {}): (Mixins & CollectionV2) | undefined
}
```

- 详细解释
  - `path` 参数可以是数据表名称，也可以是[关系字段](https://docs.nocobase.com/development/server/collections/association-fields)路径。
    - `path: 'users'`: 获取 `users` 数据表
    - `path: 'users.posts'`: 获取 `users` 数据表的 `posts` 关联字段对应的数据表，即 `postCollection`
  - 如果不传递 `options` 参数，则返回默认命名空间的数据表，如果传递 `options` 参数，则返回指定命名空间的数据表。

- 示例

```tsx | pure
collectionManager.getCollection('users'); // userCollection

collectionManager.getCollection('users.posts'); // postCollection
collectionManager.getCollection('users.profileId'); // profileCollection

collectionManager.getCollection('users', { ns: 'db2' }); // userCollection
```

结合 Mixin 使用：

```tsx | pure
const collection = collectionManager.getCollection<TestMixin>('users');
const collection = collectionManager.getCollection<TestMixin & TestMixin2>('users');
```

### cm.getCollectionFields(collectionName, options?)

获取数据表字段列表。

- 类型

```tsx | pure
class CollectionManagerV2 {
  getCollectionFields(collectionName: string, options: GetCollectionOptions = {}): CollectionFieldOptionsV2[];
}
```

- 示例

```tsx | pure
collectionManager.getCollectionFields('users'); // [ { name: 'username', type: 'string', title: 'Username', .. }, { name: 'password', type: 'password', title: 'Password', .. } ]
```

### cm.getCollectionName(path, options?)

获取数据表名称。

- 类型

```tsx | pure
class CollectionManagerV2 {
  getCollectionName(path: string, options?: GetCollectionOptions): string | undefined;
}
```

- 示例

```tsx | pure
collectionManager.getCollectionName('users'); // 'users'

collectionManager.getCollectionName('users.profileId'); // 'profiles'
```


### cm.getCollectionField(path, options?)

获取数据表字段。

- 类型

```tsx | pure
class CollectionManagerV2 {
  getCollectionField(path: string, options?: GetCollectionOptions): CollectionFieldOptions | undefined;
}
```

- 示例

```tsx | pure
collectionManager.getCollectionField('users.username'); // { name: 'username', type: 'string', title: 'Username', .. }

collectionManager.getCollectionField('users.roles.name'); // 获取 roles 关联字段对应的 roles 表中的 name 字段
```

### cm.addFieldInterfaces(interfaces)

添加数据表字段接口。

- 类型

```tsx | pure
class CollectionManagerV2 {
  addFieldInterfaces(interfaces: (typeof CollectionFieldInterface)[]): void;
}
```

- 示例

```tsx | pure
class CheckboxFieldInterface extends CollectionFieldInterface {
  name = 'checkbox';
  type = 'object';
  group = 'choices';
  title = '{{t("Checkbox")}}';
  // ...
}

class MyPlugin extends Plugin {
  async load() {
    this.app.collectionManager.addFieldInterfaces([CheckboxFieldInterface]);
  }
}
```

### cm.getFieldInterfaces()

获取数据表字段接口。

- 类型

```tsx | pure
class CollectionManagerV2 {
  getFieldInterfaces(): Record<string, CollectionFieldInterface>
}
```

- 示例

```tsx | pure
collectionManager.getFieldInterfaces(); // { checkbox: checkboxFieldInterface, url: urlFieldInterface }
```

### cm.getFieldInterface(name)

获取数据表字段接口。

- 类型

```tsx | pure
class CollectionManagerV2 {
  getFieldInterface<T extends CollectionFieldInterface>(name: string): T;
}
```

- 示例

```tsx | pure
collectionManager.getFieldInterface('checkbox'); // checkboxFieldInterface
```


### cm.addFieldGroups(fieldGroups)

添加数据表字段分组。

- 类型

```tsx | pure
class CollectionManagerV2 {
  addFieldGroups(fieldGroups: Record<string, { label: string; order?: number }>): void;
}
```

- 示例

```tsx | pure
class MyPlugin extends Plugin {
  async load() {
    this.app.collectionManager.addFieldGroups({
      'test': {
        label: 'Test',
        order: 1,
      }
    });
  }
}
```

### cm.getFieldGroups()

获取数据表字段分组。

- 类型

```tsx | pure
class CollectionManagerV2 {
  getFieldGroups():  Record<string, { label: string; order?: number }>;
}
```

- 示例

```tsx | pure
collectionManager.getFieldGroups(); // { test: { label: 'Test', order: 1 } }
```

### cm.getFieldGroup(name)

获取数据表字段分组。

- 类型

```tsx | pure
class CollectionManagerV2 {
  getFieldGroup(name: string): { label: string; order?: number };
}
```

- 示例

```tsx | pure
collectionManager.getFieldGroup('test'); // { label: 'Test', order: 1 }
```
