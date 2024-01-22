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
  const allCollections = useMemo(() => collectionManager.getAllCollections(), [collectionManager]);

  return <div>
    <pre>{JSON.stringify(allCollections, null, 2)}</pre>
  </div>;
};
```

```tsx
import React, { useMemo } from 'react';
import { Application, useCollectionManagerV2, useCompile } from '@nocobase/client';

const Demo = () => {
  const compile = useCompile();
  const collectionManager = useCollectionManagerV2();
  const dataSources = useMemo(() => collectionManager.getDataSources(), [collectionManager]);

  return <div>
    <pre>{JSON.stringify(allCollections, null, 2)}</pre>
  </div>;
};

const app = new Application({
  providers: [Demo],
  collectionManager: {
    // ...
  }
});

export default app.getRootComponent();
```


