# CollectionManager

Used to manage [Collection](./collection.md), which is managed by [DataSource](./data-source.md).

## Instance Methods

### addCollections(collections)

Add collections.

- Type

```tsx | pure
class CollectionManager {
  addCollections(collections: CollectionOptions[]): void
}
```

- Example

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

Reset collections, which will remove all collections first, and then call `addCollections()` to add collections.

- Type

```tsx | pure
class CollectionManager {
  setCollections(collections: CollectionOptions[]): void
}
```

### reAddCollections(collections)

由于 [CollectionTemplate](./collection-template.md) 或者 [CollectionMixins](./collection-mixins.md) 的添加会影响 Collection 的实例化，所以提供了重新添加数据表的方法。

- Type

```tsx | pure
class CollectionManager {
  reAddCollections(collectionInstances: Collection[]): void
}
```

- Example

```tsx | pure
const userCollectionInstance = collectionManager.getCollection('users');
collectionManager.reAddCollections([userCollectionInstance]);
```

### getCollections(predicate?)

Get a collection.

- Type

```tsx | pure
class CollectionManager {
  getCollections(predicate?: (collection: Collection) => boolean)
}
```

- Example

```tsx | pure
collectionManager.getCollections(); // [ userCollection ]

collectionManager.getCollections(collection => collection.name === 'posts'); // [ postCollection ]
```


### getCollection(path)

Get a collection.

- Type

```tsx | pure
class CollectionManager {
  getCollection<Mixins = {}>(path: string): (Mixins & Collection) | undefined
}
```

- Details
  - The `path` parameter can be either the name of a collection or a path to a [relationship field](https://docs.nocobase.com/development/server/collections/association-fields).
    - `path: 'users'`: Get the `users` collection.
    - `path: 'users.posts'`: Get the collection corresponding to the `posts` associated field of the `users` collection, i.e., `postCollection`.

- Example

```tsx | pure
collectionManager.getCollection('users'); // userCollection

collectionManager.getCollection('users.posts'); // postCollection
collectionManager.getCollection('users.profileId'); // profileCollection
```

Using Mixins:

```tsx | pure
const collection = collectionManager.getCollection<TestMixin>('users');
const collection = collectionManager.getCollection<TestMixin & TestMixin2>('users');
```

### getCollectionFields(collectionName)

Get the list of fields for a collection.

- Type

```tsx | pure
class CollectionManager {
  getCollectionFields(collectionName: string): CollectionFieldOptions[];
}
```

- Example

```tsx | pure
collectionManager.getCollectionFields('users'); // [ { name: 'username', type: 'string', title: 'Username', .. }, { name: 'password', type: 'password', title: 'Password', .. } ]
```

### getCollectionName(path)

Get the collection name.

- Type

```tsx | pure
class CollectionManager {
  getCollectionName(path: string: GetCollectionOptions): string | undefined;
}
```

- Example

```tsx | pure
collectionManager.getCollectionName('users'); // 'users'

collectionManager.getCollectionName('users.profiles'); // 'profiles'
```


### getCollectionField(path)

Get collection fields.

- Type

```tsx | pure
class CollectionManager {
  getCollectionField(path: string: GetCollectionOptions): CollectionFieldOptions | undefined;
}
```

- Example

```tsx | pure
collectionManager.getCollectionField('users.username'); // { name: 'username', type: 'string', title: 'Username', .. }

collectionManager.getCollectionField('users.roles.name'); // Get the 'name' field in the 'roles' table corresponding to the 'roles' associated field
```
