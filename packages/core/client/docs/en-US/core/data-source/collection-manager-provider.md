# CollectionManagerProvider

用于提供 [CollectionManager](/core/data-source/collection-manager) 实例。

## Component

- Type

```tsx | pure
interface CollectionManagerProviderProps {
  instance?: CollectionManager;
  dataSource?: string;
  children?: ReactNode;
}
```

- Parameter Details
  - `dataSource` - The name of the data source. If empty, the default data source will be used.
  - `instance` - The CollectionManager instance. If not provided, the collectionManager corresponding to the `dataSource` will be used.

- Example

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

Used to retrieve the instance passed by `CollectionManagerProvider`.

- Example

```tsx | pure
const Demo = () => {
  const collectionManager = useCollectionManager();
  const collections = collectionManager.getCollections()

  return <div>
    <pre>{JSON.stringify(collections, null, 2)}</pre>
  </div>;
};
```
