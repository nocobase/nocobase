# CollectionProvider

获取并传递数据表信息的组件。

## 组件

### CollectionProvider

- 类型

```tsx | pure
export type CollectionProviderProps = ({ name: string } | { collection: CollectionOptions| CollectionV2 }) & {
  children?: ReactNode;
};
```

- 详解

当传递 `name` 时，会根据 `name` 去 [CollectionManager](/core/collection/collection-manager) 中查询数据表信息，如果查询不到，则会不进行渲染。也可以直接传递 `collection` 对象或者 [CollectionV2 实例](/core/collection/collection)，不进行查询。

最终传递给子组件的是 [CollectionV2 实例](/core/collection/collection)。

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

```tsx | pure
import { CollectionProvider } from '@nocobase/client';

const collection = {
  name: 'tests',
  fields: [
    {
      type: 'string',
      name: 'title1',
      interface: 'input',
      uiSchema: {
        title: 'Title1',
        type: 'string',
        'x-component': 'Input',
        required: true,
        description: 'description1',
      } as ISchema,
    },
  ],
};

const MyComponent = () => {
  return (
    <CollectionProvider collection={collection}>
      <div>...</div>
    </CollectionProvider>
  )
}
```

```tsx | pure
const collection = useCollectionV2({
   name: 'tests',
  fields: [
    // ...
  ],
});

const MyComponent = () => {
  return (
    <CollectionProvider collection={collection}>
      <div>...</div>
    </CollectionProvider>
  )
}
```


## Hooks

### useCollectionV2()

用于获取 `CollectionProvider` 传递的数据表信息。

```tsx | pure
const collection = useCollectionV2()

console.log(collection instanceof CollectionV2) // true
console.log(collection);
```

### useCollectionDataV2()

等同于 `useCollectionV2().data`。

```tsx | pure
const data = useCollectionDataV2();
const collection = useCollectionV2();

console.log(data === collection.data); // true
```

## 示例

- 传递 `name` 属性，根据 `name` 查询数据表信息

<code src="./demos/collection/demo1.tsx"></code>


- 传递 `collection` 对象，不进行查询

<code src="./demos/collection/demo2.tsx"></code>


- 传递 `Collection` 实例，不进行查询

<code src="./demos/collection/demo3.tsx"></code>

<!-- 根据 schema 中的 `collection` 字段，查询并提供当前数据区块的数据表信息，其内置在 [DataBlockProvider](xx) 中。

```js {4} | pure
{
  'x-decorator': 'DataBlockProvider',
  'x-decorator-props': {
    collection: 'users',
    action: 'list',
  }
}
```

关于 collection 的更多说明，请参考: [collections concept](https://docs.nocobase.com/manual/core-concepts/collections) 和 [development collection](https://docs.nocobase.com/manual/core-concepts/collections#collection) -->
