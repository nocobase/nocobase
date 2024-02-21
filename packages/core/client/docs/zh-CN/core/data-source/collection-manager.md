# CollectionManager

用于管理 [Collection](./collection.md)，其被 [DataSource](./data-source.md) 管理。

## 实例方法

### addCollections(collections)

添加数据表。

- 类型

```tsx | pure
class CollectionManager {
  addCollections(collections: CollectionOptions[]): void
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

collectionManager.addCollections([userCollectionOptions]);
```

### setCollections(collections)

重置数据表，会先移除所有数据表，然后再调用 `addCollections()` 添加数据表。

- 类型

```tsx | pure
class CollectionManager {
  setCollections(collections: CollectionOptions[]): void
}
```

### reAddCollections(collections)

由于 [CollectionTemplate](./collection-template.md) 或者 [CollectionMixins](./collection-mixins.md) 的添加会影响 Collection 的实例化，所以提供了重新添加数据表的方法。

- 类型

```tsx | pure
class CollectionManager {
  reAddCollections(collectionInstances: Collection[]): void
}
```

- 示例

```tsx | pure
const userCollectionInstance = collectionManager.getCollection('users');
collectionManager.reAddCollections([userCollectionInstance]);
```

### getCollections(predicate?)

获取数据表。

- 类型

```tsx | pure
class CollectionManager {
  getCollections(predicate?: (collection: Collection) => boolean)
}
```

- 示例

```tsx | pure
collectionManager.getCollections(); // [ userCollection ]

collectionManager.getCollections(collection => collection.name === 'posts'); // [ postCollection ]
```


### getCollection(path)

获取数据表。

- 类型

```tsx | pure
class CollectionManager {
  getCollection<Mixins = {}>(path: string): (Mixins & Collection) | undefined
}
```

- 详细解释
  - `path` 参数可以是数据表名称，也可以是[关系字段](https://docs.nocobase.com/development/server/collections/association-fields)路径。
    - `path: 'users'`: 获取 `users` 数据表
    - `path: 'users.posts'`: 获取 `users` 数据表的 `posts` 关联字段对应的数据表，即 `postCollection`

- 示例

```tsx | pure
collectionManager.getCollection('users'); // userCollection

collectionManager.getCollection('users.posts'); // postCollection
collectionManager.getCollection('users.profileId'); // profileCollection
```

结合 Mixin 使用：

```tsx | pure
const collection = collectionManager.getCollection<TestMixin>('users');
const collection = collectionManager.getCollection<TestMixin & TestMixin2>('users');
```

### getCollectionFields(collectionName)

获取数据表字段列表。

- 类型

```tsx | pure
class CollectionManager {
  getCollectionFields(collectionName: string): CollectionFieldOptions[];
}
```

- 示例

```tsx | pure
collectionManager.getCollectionFields('users'); // [ { name: 'username', type: 'string', title: 'Username', .. }, { name: 'password', type: 'password', title: 'Password', .. } ]
```

### getCollectionName(path)

获取数据表名称。

- 类型

```tsx | pure
class CollectionManager {
  getCollectionName(path: string: GetCollectionOptions): string | undefined;
}
```

- 示例

```tsx | pure
collectionManager.getCollectionName('users'); // 'users'

collectionManager.getCollectionName('users.profiles'); // 'profiles'
```


### getCollectionField(path)

获取数据表字段。

- 类型

```tsx | pure
class CollectionManager {
  getCollectionField(path: string: GetCollectionOptions): CollectionFieldOptions | undefined;
}
```

- 示例

```tsx | pure
collectionManager.getCollectionField('users.username'); // { name: 'username', type: 'string', title: 'Username', .. }

collectionManager.getCollectionField('users.roles.name'); // 获取 roles 关联字段对应的 roles 表中的 name 字段
```
