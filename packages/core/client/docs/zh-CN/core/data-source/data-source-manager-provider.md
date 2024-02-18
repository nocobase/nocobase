# DataSourceManagerProvider

用于提供 `DataSourceManager` 实例。


## Hooks

### useDataSourceManagerV2()

获取 `DataSourceManager` 实例。

- 类型

```tsx | pure
function useDataSourceManagerV2(): DataSourceManager;
```

- 示例

```tsx | pure
const MyComponent = () => {
  const dataSourceManager = useDataSourceManagerV2();
  dataSourceManager.removeDataSources(['my-data-source']);
}
```
