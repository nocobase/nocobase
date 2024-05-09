# DataSourceManagerProvider

Used to provide an instance of `DataSourceManager`.

## Hooks

### useDataSourceManager()

Get an instance of `DataSourceManager`.

- Type

```tsx | pure
function useDataSourceManager(): DataSourceManager;
```

- Example

```tsx | pure
const MyComponent = () => {
  const dataSourceManager = useDataSourceManager();
  dataSourceManager.removeDataSources(['my-data-source']);
}
```
