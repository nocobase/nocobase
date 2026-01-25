# DataSourceManager

`DataSourceManager` 是多 `dataSource` 实例的管理类。

## API

### add()
添加一个 `dataSource` 实例。

#### 签名

- `add(dataSource: DataSource, options: any = {}): Promise<void>`

### use()

给 `dataSource` 实例添加全局中间件。

### middleware()

获取当前 `dataSourceManager` 实例的中间件，可用于响应 http 请求。

### afterAddDataSource()

新增`dataSource` 添加后的钩子函数。

#### 签名

- `afterAddDataSource(hook: DataSourceHook)`

```typescript
type DataSourceHook = (dataSource: DataSource) => void;
```

### registerDataSourceType()

注册数据源类型及其类。

#### 签名

- `registerDataSourceType(type: string, dataSourceClass: typeof DataSource)`

### getDataSourceType()

获取数据源类。

#### 签名

- `getDataSourceType(type: string): typeof DataSource`

### buildDataSourceByType()

根据注册的数据源类型和实例参数，创建数据源实例。

#### 签名

- `buildDataSourceByType(type: string, options: any): DataSource`
