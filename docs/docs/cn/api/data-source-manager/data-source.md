# DataSource (abstract)

`DataSource` 抽象类，用于表示一种类型的数据源，可以是数据库、API等。

## 成员

### collectionManager

数据源的 CollectionManager 实例，需实现 [`ICollectionManager`](/api/data-source-manager/i-collection-manager) 接口。

### resourceManager

数据源的 resourceManager 实例，详见：[`resourceManager`](/api/resourcer/resource-manager)

### acl

数据源的 ACL 实例，详见： [`ACL`](/api/acl/acl)

## API

### constructor()

构造函数，创建一个 `DataSource` 实例。

#### 签名

- `constructor(options: DataSourceOptions)`

### init() 

初始化函数，在 `constructor` 之后既被调用。

#### 签名

- `init(options: DataSourceOptions)`


### name

#### 签名

- `get name()`

响应数据源的实例名称

### middleware()

获得 DataSource 的中间件，用于挂载到 Server 中接收请求。

### testConnection()

静态方法，在测试连接操作时调用，可用于参数校验，具体逻辑由子类实现。

#### 签名

- `static testConnection(options?: any): Promise<boolean>`

### load()

#### 签名

- `async load(options: any = {})`

数据源的加载操作，逻辑由子类实现。

### createCollectionManager()

#### 签名
- `abstract createCollectionManager(options?: any): ICollectionManager`

创建数据源的 CollectionManager 实例，逻辑由子类实现。

### createResourceManager()

创建数据源的 ResourceManager 实例，字类可覆盖实现，默认创建 `@nocobase/resourcer` 中的 `ResourceManager`。

### createACL()

- 创建 DataSource 的 ACL 实例，字类可覆盖实现，默认创建 `@nocobase/acl` 中的 `ACL`。

