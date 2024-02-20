
## Collection Mixins

Collection Mixins 是为扩展 Collection 类提供的一种机制，可以通过 `dataSourceManager.addCollectionMixins()` 添加 Collection Mixins。

### 定义和注册

```tsx | pure
import { Collection, Plugin } from '@nocobase/client';

class TestMixin extends Collection {
  test() {
    const { name } = this.options;
    return 'test '+ name;
  }
}

class MyPlugin extends Plugin {
  async load() {
    this.app.dataSourceManager.addCollectionMixins([TestMixin]);
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

<code src='./demos/data-source-manager/mixins.tsx'></code>
