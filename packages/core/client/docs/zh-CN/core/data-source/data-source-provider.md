# DataSourceProvider

用于提供 `DataSource` 的实例。

## 组件

- 类型

```tsx | pure
interface DataSourceProviderProps {
  dataSource?: string;
  children?: ReactNode;
}
```

- 示例

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

获取 `DataSource` 实例。

- 类型

```tsx | pure
function useDataSource(): DataSource;
```

- 示例

```tsx | pure
const MyComponent = () => {
  const dataSource = useDataSource();
  return <div>{dataSource.displayName}</div>
}
```

### useDataSourceKey()

获取 `DataSource` 的 key。

- 类型

```tsx | pure
function useDataSourceKey(): string;
```

- 示例

```tsx | pure
const MyComponent = () => {
  const dataSourceKey = useDataSourceKey();
  return <div>{dataSourceKey}</div>
}
```
