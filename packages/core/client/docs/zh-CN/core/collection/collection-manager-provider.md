# CollectionManagerProvider

用于提供 [CollectionManager](/core/collection/collection-manager) 实例，其内置到 [Application](/core/application) 中，无需手动使用，特殊场景下需要覆盖全局的 `CollectionManager`，则自行使用即可。

## 组件

- 类型

```tsx | pure
interface CollectionManagerProviderProps {
  collectionManager: CollectionManagerV2;
}
```

- 示例

```tsx | pure
const  collectionManager = new CollectionManagerV2();

const Demo = () => {
  return (
    <CollectionManagerProvider collectionManager={collectionManager}>
      <div>...</div>
    </CollectionManagerProvider>
  );
};
```

## Hooks

### useCollectionManagerV2()

用于获取 `CollectionManagerProvider` 传递的实例。

- 示例

```tsx | pure
const Demo = () => {
  const collectionManager = useCollectionManagerV2();
  const collectionNamespaces = useMemo(() => collectionManager.getCollectionNames(), [collectionManager]);

  return <div>
    {collectionNamespaces.map((namespace) => {
      return <div key={namespace.name}>{namespace.name}: {namespace.title}</div>;
    })}
  </div>;
};
```

```tsx
import React, { useMemo } from 'react';
import { Application, useCollectionManagerV2, useCompile } from '@nocobase/client';

const Demo = () => {
  const compile = useCompile();
  const collectionManager = useCollectionManagerV2();
  const collectionNamespaces = useMemo(() => collectionManager.getCollectionNamespaces(), [collectionManager]);

  return <div>
    {collectionNamespaces.map((namespace) => {
      return <div key={namespace.name}>{namespace.name}: { compile(namespace.title)}</div>;
    })}
  </div>;
};

const app = new Application({
  providers: [Demo],
  collectionManager: {
    collectionNamespaces: {
      'db2': "DB 2",
    }
  }
});

export default app.getRootComponent();
```


