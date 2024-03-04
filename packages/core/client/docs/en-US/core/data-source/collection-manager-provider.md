# CollectionManagerProvider

用于提供 [CollectionManager](/core/data-source/collection-manager) 实例。

## 组件

- 类型

```tsx | pure
interface CollectionManagerProviderProps {
  instance?: CollectionManager;
  dataSource?: string;
  children?: ReactNode;
}
```

- 参数详解
  - `dataSource` - 数据源名称，如果为空，则会取默认数据源。
  - `instance` - CollectionManager 实例，如果没有，则会取 `dataSource` 对应的 collectionManager。

- 示例

```tsx | pure
const  collectionManager = new CollectionManager();

const Demo = () => {
  return (
    <CollectionManagerProvider dataSource='test'>
      <div>...</div>
    </CollectionManagerProvider>
  );
};
```

## Hooks

### useCollectionManager()

用于获取 `CollectionManagerProvider` 传递的实例。

- 示例

```tsx | pure
const Demo = () => {
  const collectionManager = useCollectionManager();
  const collections = collectionManager.getCollections()

  return <div>
    <pre>{JSON.stringify(collections, null, 2)}</pre>
  </div>;
};
```
