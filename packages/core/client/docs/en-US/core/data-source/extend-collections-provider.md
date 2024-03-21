# ExtendCollectionsProvider

用于扩展 [Collection](./collection.md) 。

## 组件

- 类型

```tsx | pure
interface ExtendCollectionsProviderProps {
  collections: CollectionOptions[];
  children?: ReactNode;
}
```

- 示例

```tsx | pure
import { ExtendCollectionsProvider, CollectionOptions } from '@nocobase/client';

const userCollection: CollectionOptions = {
  name: 'users',
  title: '{{t("Users")}}',
  fields: [
    {
      type: 'string',
      name: 'name',
      title: '{{t("Name")}}',
    },
    {
      type: 'string',
      name: 'email',
      title: '{{t("Email")}}',
    },
  ],
}

const MyPlugin = () => {
  return (
    <ExtendCollectionsProvider collections={[ userCollection ]}>
      <CollectionProvider name="users">
        <ChildComponent />
      </CollectionProvider>
    </ExtendCollectionsProvider>
  );
}

const ChildComponent = () => {
  const collection = useCollection();

  return (
    <div>
      <h1>{collection.name}</h1>
    </div>
  );
}
```

## Hooks

### useExtendCollections()

获取扩展的数据表。

```tsx | pure
import { useExtendCollections } from '@nocobase/client';

const MyComponent = () => {
  const collections = useExtendCollections();

  return (
    <div>
      {collections.map((collection) => (
        <div key={collection.name}>{collection.title}</div>
      ))}
    </div>
  );
}
```
