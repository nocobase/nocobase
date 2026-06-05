# DataSourceManager

`DataSourceManager` is the management class for multiple `dataSource` instances.

## API

### add()
Adds a `dataSource` instance.

#### Signature

- `add(dataSource: DataSource, options: any = {}): Promise<void>`

### use()

Adds global middleware to the `dataSource` instance.

### middleware()

Gets the middleware of the current `dataSourceManager` instance, which can be used to respond to http requests.

### afterAddDataSource()

A hook function that is called after a new `dataSource` is added.

#### Signature

- `afterAddDataSource(hook: DataSourceHook)`

```typescript
type DataSourceHook = (dataSource: DataSource) => void;
```

### registerDataSourceType()

Registers a data source type and its class.

#### Signature

- `registerDataSourceType(type: string, dataSourceClass: typeof DataSource)`

### getDataSourceType()

Gets the data source class.

#### Signature

- `getDataSourceType(type: string): typeof DataSource`

### buildDataSourceByType()

Creates a data source instance based on the registered data source type and instance options.

#### Signature

- `buildDataSourceByType(type: string, options: any): DataSource`