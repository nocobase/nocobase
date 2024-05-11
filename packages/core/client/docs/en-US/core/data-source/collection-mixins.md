
## Collection Mixins

Collection Mixins are a mechanism for extending the Collection class, and can be added using `dataSourceManager.addCollectionMixins()`.

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

### Usage

- Method 1: Call `getCollection()` on the `CollectionManager` instance to retrieve a specific `Collection` instance.

```tsx | pure
const Demo = () => {
  const cm = useCollectionManager();
  const userCollection = cm.getCollection<TestMixin>('users');

  userCollection.test(); // 'test users'
}
```

- Usage 2: Call `useCollection()` to get the table information of the current context.

```tsx | pure
const Demo = () => {
  const collection = useCollection<TestMixin>();
  collection.test(); // 'test users'
}
```

### Usage of Multiple Mixins

If you have added mixins, you can get type hints using the following method:

```tsx | pure
const Demo = () => {
  const collection = useCollection<TestMixin & Test2Mixin>();
}
```

<code src='./demos/data-source-manager/mixins.tsx'></code>
