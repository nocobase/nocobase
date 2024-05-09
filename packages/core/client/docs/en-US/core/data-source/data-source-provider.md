# DataSourceProvider

用于提供 `DataSource` 的实例。

## Component

- Type

```tsx | pure
interface DataSourceProviderProps {
  dataSource?: string;
  children?: ReactNode;
}
```

- Example

```tsx | pure
const MyComponent = () => {
  return (
    <DataSourceProvider dataSource="my-data-source">
      <MyChildComponent />
    </DataSourceProvider>
  );
}
```

## Hooks

### useDataSource()

Get the `DataSource` instance.

- Type

```tsx | pure
function useDataSource(): DataSource;
```

- Example

```tsx | pure
const MyComponent = () => {
  const dataSource = useDataSource();
  return <div>{dataSource.displayName}</div>
}
```

### useDataSourceKey()

Get the key of the `DataSource`.

- Type

```tsx | pure
function useDataSourceKey(): string;
```

- Example

```tsx | pure
const MyComponent = () => {
  const dataSourceKey = useDataSourceKey();
  return <div>{dataSourceKey}</div>
}
```
