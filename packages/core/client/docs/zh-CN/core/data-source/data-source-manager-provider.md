# DataSourceManagerProvider

用于提供 `DataSourceManager` 实例。


## Hooks

### useDataSourceManager()

获取 `DataSourceManager` 实例。

- 类型

```tsx | pure
function useDataSourceManager(): DataSourceManager;
```

- 示例

```tsx | pure
const MyComponent = () => {
  const dataSourceManager = useDataSourceManager();
  dataSourceManager.removeDataSources(['my-data-source']);
}
```
