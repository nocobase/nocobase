# CollectionProvider

用于提供 [Collection](/core/data-source/collction) 实例。

## 组件

### CollectionProvider

- 类型

```tsx | pure
interface CollectionProviderProps {
  name: string;
  dataSource?: string;
  children?: ReactNode;
}
```

- 详解

组件会根据 `name` 去 [CollectionManager](/core/data-source/collection-manager) 中查询数据表信息，如果查询不到，则会不进行渲染。

`dataSource` 用于指定数据表所在的[命名空间](/core/data-source/collection-manager#datasource)，如果不指定，则默认命名空间。

- 示例

```tsx | pure
import { CollectionProvider } from '@nocobase/client';

const MyComponent = () => {
  return (
    <CollectionProvider name="users">
      <div>...</div>
    </CollectionProvider>
  )
}
```


## Hooks

### useCollection()

用于获取 `CollectionProvider` 传递的 `Collection` 实例。

```tsx | pure
const collection = useCollection()

console.log(collection instanceof Collection) // true
console.log(collection);
```

结合 Mixin 使用：

```tsx | pure
const collection = useCollection<TestMixin>()
const collection = useCollection<TestMixin & TestMixin2>()
```

## 示例

<code src="./demos/collection/demo1.tsx"></code>

