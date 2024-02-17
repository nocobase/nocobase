# DataSourceProvider

用于提供 `DataSource` 的实例。

## 组件

- 类型

```tsx | pure
interface DataSourceProviderPropsV2 {
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

### useDataSourceV2()

获取 `DataSource` 实例。

- 类型

```tsx | pure
function useDataSourceV2(): DataSource;
```

- 示例

```tsx | pure
const MyComponent = () => {
  const dataSource = useDataSourceV2();
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
