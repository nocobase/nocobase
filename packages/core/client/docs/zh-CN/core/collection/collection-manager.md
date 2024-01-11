# CollectionManager

用于管理数据表相关信息，其在 [Application](/core/application/application) 存在一个全局实例，可在 [插件](/core/application/plugin) 中通过 `this.app.collectionManager` 访问实例。

- 类型

```tsx | pure
interface CollectionManagerOptionsV2 {
  collections?: Record<string, CollectionV2[] | CollectionOptions[]> | CollectionV2[] | CollectionOptions[];
  collectionTemplates?: CollectionTemplateV2[] | CollectionTemplateOptions[];
  collectionFieldInterfaces?: CollectionFieldInterfaceV2[] | CollectionFieldInterfaceOptions[];
  collectionNamespaces?: Record<string, string>;
}

interface GetCollectionOptions {
  ns?: string;
}

class CollectionManagerV2 {
  public app: Application;

  constructor(options: CollectionManagerOptionsV2 = {}, app: Application);

  addCollectionNamespaces(collectionNamespaces: Record<string, string>): void;
  getCollectionNamespaces(): { name: string; title: string }[];

  addCollectionTemplates(templates: CollectionTemplateV2[] | CollectionTemplateOptions[]): void;
  getCollectionTemplates(): CollectionTemplateV2[];
  getCollectionTemplate(name?: string): CollectionTemplateV2

  addCollections(collections: (CollectionOptions | CollectionV2)[], options?: GetCollectionOptions): void
  setCollections(collections: (CollectionOptions | CollectionV2)[], options?: GetCollectionOptions): void
  getAllCollections(): Record<string, Record<string, CollectionV2>>
  getCollections(ns?: string, predicate?: (collection: CollectionV2) => boolean): CollectionV2[]
  getCollection(path: string, options?: GetCollectionOptions): Promise<CollectionV2 | undefined>
  getCollectionName(path: string, options?: GetCollectionOptions): Promise<string | undefined>;
  removeCollection(path: string, options?: GetCollectionOptions): void;
  getCollectionField(path: string, options?: GetCollectionOptions): Promise<CollectionFieldOptions | undefined>;

  addFieldInterfaces(interfaces:CollectionFieldInterfaceV2[] | CollectionFieldInterfaceOptions[]): void;
  getFieldInterfaces(): CollectionFieldInterfaceV2[]
  getCollectionFieldInterfaceGroups(): { name: string; children: CollectionFieldInterfaceV2[] }[]
  getFieldInterface(name: string): CollectionFieldInterfaceV2
}
```

相关文档：

- Collections：数据表，具体参考：[Collection](/core/collection/collection)
- CollectionTemplate：数据表模板，具体参考：[CollectionTemplate](/core/collection/collection-template)
- CollectionFieldInterface：数据表字段模板，具体参考：[CollectionFieldInterface](/core/collection/collection-field-interface)
- CollectionNamespace：数据表命名空间，具体参考：[CollectionNamespace](/core/collection/collection-manager#collectionnamespace)

## CollectionNamespace

NocoBase 支持[多数据源](xxx)，每个数据源在 Collection 中对应一个命名空间。命名空间是一个 Key-Value 对象，Key 为命名空间名称，Value 为标题。例如：

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

## new CollectionManagerV2(options)

创建一个新的 `CollectionManagerV2` 实例。

- 类型

```tsx | pure
interface CollectionManagerOptionsV2 {
  collections?: Record<string, CollectionV2[] | CollectionOptions[]> | CollectionV2[] | CollectionOptions[];
  collectionTemplates?: CollectionTemplateV2[] | CollectionTemplateOptions[];
  collectionFieldInterfaces?: CollectionFieldInterfaceV2[] | CollectionFieldInterfaceOptions[];
  collectionNamespaces?: Record<string, string>;
}
```

- 参数说明

1. `collections`、`collectionTemplates`、`collectionFieldInterfaces` 既支持对应的实例，也支持构造函数参数。例如：

```tsx | pure
const userCollectionOptions = {
  "name": "users",
  "title": "Users",
  fields: [
    // ...
  ],
};

const treeCollectionTemplateOptions = {
  name: 'tree',
  title: '{{t("Tree collection")}}',
  configurableProperties: {
    // ...
  }
};

const checkboxCollectionFieldInterfaceOptions = {
  name: 'checkbox',
  type: 'object',
  title: '{{t("Checkbox")}}',
  // ...
};


const collectionManager1 = new CollectionManagerV2({
  collections: [userCollectionOptions],
  collectionTemplates: [treeCollectionTemplateOptions],
  collectionFieldInterfaces: [checkboxCollectionFieldInterfaceOptions],
  collectionNamespaces: {
    "db2": "DB2"
  }
});


const userCollection = new Collection(userCollectionOptions);
const treeCollectionTemplate = new CollectionTemplate(treeCollectionTemplateOptions);
const checkboxCollectionFieldInterface = new CollectionFieldInterface(checkboxCollectionFieldInterfaceOptions);

const collectionManager2 = new CollectionManagerV2({
  collections: [userCollection],
  collectionTemplates: [treeCollectionTemplate],
  collectionFieldInterfaces: [checkboxCollectionFieldInterface],
  collectionNamespaces: {
    "db2": "DB2"
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

    this.app.collectionManager.addCollectionTemplates([ treeCollectionTemplate, sqlCollectionTemplate ]);
    this.app.collectionManager.addFieldInterfaces([checkboxCollectionFieldInterface]);

    const collections = await this.app.apiClient.request({ url: 'collections:list' })
      .then((res) => res.data.data);
    this.app.collectionManager.addCollections(collections);
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

添加数据表模板。

- 类型

```tsx | pure
collectionManager.addCollectionTemplates(templates: CollectionTemplateV2[] | CollectionTemplateOptions[]): void;
```

- 示例

```tsx | pure
const treeCollectionTemplate = new CollectionTemplate({
  name: 'tree',
  title: '{{t("Tree collection")}}',
  configurableProperties: {
    // ...
  }
});

const sqlCollectionTemplate = new CollectionTemplate({
  name: 'sql',
  title: '{{t("SQL collection")}}',
  configurableProperties: {
    // ...
  }
});

class MyPlugin extends Plugin {
  async load() {
    this.collectionManager.addCollectionTemplates([ treeCollectionTemplate, sqlCollectionTemplate ]);
  }
}
```

更多关于数据表模板的信息，请参考：[CollectionTemplate](/core/collection/collection-template)

### cm.getCollectionTemplates()

获取数据表模板。

- 类型

```tsx | pure
class CollectionManagerV2 {
  getCollectionTemplates(): CollectionTemplateV2[];
}
```

- 示例

```tsx | pure
collectionManager.getCollectionTemplates(); // [ treeCollectionTemplate, sqlCollectionTemplate ]
```

### cm.getCollectionTemplate(name)

获取数据表模板。

- 类型

```tsx | pure
class CollectionManagerV2 {
  getCollectionTemplate(name: string): CollectionTemplateV2
}
```

- 详解

如果不传递 `name` 参数，则返回默认模板实例。

- 示例

```tsx | pure
collectionManager.getCollectionTemplate(); // generalCollectionTemplate

collectionManager.getCollectionTemplate('tree'); // treeCollectionTemplate
```

### cm.addCollections(collections, options?)

添加数据表。

- 类型

```tsx | pure
class CollectionManagerV2 {
  addCollections(collections: (CollectionOptions | CollectionV2)[], options?: GetCollectionOptions): void
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
collectionManager.getAllCollections(); // { main: { users: userCollection } }
```

### cm.getCollections(ns?, predicate?)

获取数据表。

- 类型

```tsx | pure
class CollectionManagerV2 {
  getCollections(ns?: string, predicate?: (collection: CollectionV2) => boolean): CollectionV2[]
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

collectionManager.getCollections('db2', collection => collection.name === 'posts'); // [ postCollection ]
```

### cm.setCollections(collections, options?)

重置数据表，会先移除所有数据表，然后再调用 `cm.addCollections()` 添加数据表。

- 类型

```tsx | pure
class CollectionManagerV2 {
  setCollections(collections: (CollectionOptions | CollectionV2)[], options?: GetCollectionOptions): void
}
```

### cm.getCollection(path, options?)

获取数据表。

- 类型

```tsx | pure
class CollectionManagerV2 {
  getCollection(path: string, options?: GetCollectionOptions): CollectionV2 | undefined
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

### cm.removeCollection(path, options?)

移除数据表。

- 类型

```tsx | pure
class CollectionManagerV2 {
  removeCollection(path: string, options?: GetCollectionOptions): void;
}
```

- 示例

```tsx | pure
collectionManager.removeCollection('users');
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
  addFieldInterfaces(interfaces:CollectionFieldInterfaceV2[] | CollectionFieldInterfaceOptions[]): void;
}
```

- 示例

```tsx | pure
const checkboxCollectionFieldInterface = new CollectionFieldInterface({
  name: 'checkbox',
  type: 'object',
  title: '{{t("Checkbox")}}',
  // ...
});

class MyPlugin extends Plugin {
  async load() {
    this.app.collectionManager.addFieldInterfaces([checkboxCollectionFieldInterface]);
  }
}
```

### cm.getFieldInterfaces()

获取数据表字段接口。

- 类型

```tsx | pure
class CollectionManagerV2 {
  getFieldInterfaces(): CollectionFieldInterfaceV2[]
}
```

- 示例

```tsx | pure
collectionManager.getFieldInterfaces(); // [ checkboxCollectionFieldInterface ]
```

### cm.getCollectionFieldInterfaceGroups()

获取数据表字段接口分组。

- 类型

```tsx | pure
class CollectionManagerV2 {
  getCollectionFieldInterfaceGroups(): { name: string; children: CollectionFieldInterfaceV2[] }[]
}
```

- 示例

```tsx | pure
collectionManager.getCollectionFieldInterfaceGroups(); // [ { name: '基础', children: [ checkboxCollectionFieldInterface ] } ]
```

### cm.getFieldInterface(name)

获取数据表字段接口。

- 类型

```tsx | pure
class CollectionManagerV2 {
  getFieldInterface(name: string): CollectionFieldInterfaceV2
}
```

- 示例

```tsx | pure
collectionManager.getFieldInterface('checkbox'); // checkboxCollectionFieldInterface
```
