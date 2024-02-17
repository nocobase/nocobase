# ExtendCollectionsProvider

用于扩展 [Collection](./collection.md) 。

## 组件

- 类型

```tsx | pure
interface ExtendCollectionsProviderPropsV2 {
  collections: CollectionOptionsV2[];
  children?: ReactNode;
}
```

- 示例

```tsx | pure
import { ExtendCollectionsProvider, CollectionOptionsV2 } from '@nocobase/client';

const userCollection: CollectionOptionsV2 = {
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
      <CollectionProviderV2 name="users">
        <ChildComponent />
      </CollectionProviderV2>
    </ExtendCollectionsProvider>
  );
}

const ChildComponent = () => {
  const collection = useCollectionV2();

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
