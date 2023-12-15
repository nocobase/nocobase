# CollectionFieldProvider

获取并传递数据表字段信息的组件。

## 组件

### CollectionFieldProvider

- 类型

```tsx | pure
export type CollectionFieldProviderProps = (
  | { name: string }
  | { collectionField: CollectionFieldV2 | CollectionFieldOptions }
) & {
  children?: ReactNode;
};
```

- 详解

当传递 `name` 时，会根据 `name` 去 [CollectionManager](/core/collection/collection-manager) 中查询数据表信息，如果查询不到，则会不进行渲染。也可以直接传递 `collectionField` 对象或者 [CollectionFieldV2 实例](/core/collection/collection-field)，不进行查询。

`name` 的格式为 `[collection].[field]`，例如 `users.password`。

最终传递给子组件的是 [CollectionFieldV2 实例](/core/collection/collection-field)。

- 示例

```tsx | pure
import { CollectionFieldProvider } from '@nocobase/client';

const MyComponent = () => {
  return (
    <CollectionFieldProvider name="users.password">
      <div>...</div>
    </CollectionFieldProvider>
  )
}
```

```tsx | pure
import { CollectionFieldProvider } from '@nocobase/client';

const passwordField = {
  type: 'string',
  name: 'password',
}

const MyComponent = () => {
  return (
    <CollectionFieldProvider collectionField={passwordField}>
      <div>...</div>
    </CollectionFieldProvider>
  )
}
```

```tsx | pure
import { CollectionFieldProvider, CollectionFieldV2 } from '@nocobase/client';

const passwordField = new CollectionFieldV2({
  type: 'string',
  name: 'password',
});

const MyComponent = () => {
  return (
    <CollectionFieldProvider collectionField={passwordField}>
      <div>...</div>
    </CollectionFieldProvider>
  )
}
```

## Hooks

### useCollectionFieldV2()

用于获取 `CollectionFieldProvider` 传递的数据表信息。

```tsx | pure
const collectionField = useCollectionFieldV2()

console.log(collectionField instanceof CollectionField) // true
console.log(collectionField);
```

### useCollectionFieldDataV2()

等同于 `useCollectionV2().data`。

```tsx | pure
const data = useCollectionFieldV2();
const collectionField = useCollectionFieldDataV2();

console.log(data === collectionField.data); // true
```

## 示例

- 传递 `name` 属性，根据 `name` 查询数据表信息

<code src="./demos/collection-field/demo1.tsx"></code>


- 传递 `collectionField` 对象，不进行查询

<code src="./demos/collection-field/demo2.tsx"></code>


- 传递 `CollectionField` 实例，不进行查询

<code src="./demos/collection-field/demo3.tsx"></code>
