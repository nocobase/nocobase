# DataSource (abstract)

`DataSource` is an abstract class used to represent a type of data source, which can be a database, API, etc.

## Members

### collectionManager

The CollectionManager instance for the data source, which must implement the [`ICollectionManager`](/api/data-source-manager/i-collection-manager) interface.

### resourceManager

The resourceManager instance for the data source.

### acl

The ACL instance for the data source.

## API

### constructor()

Constructor, creates a `DataSource` instance.

#### Signature

- `constructor(options: DataSourceOptions)`

### init()

Initialization function, called immediately after the `constructor`.

#### Signature

- `init(options: DataSourceOptions)`


### name

#### Signature

- `get name()`

Returns the instance name of the data source.

### middleware()

Gets the middleware for the DataSource, used to mount to the Server to receive requests.

### testConnection()

A static method called during the test connection operation. It can be used for parameter validation, and the specific logic is implemented by the subclass.

#### Signature

- `static testConnection(options?: any): Promise<boolean>`

### load()

#### Signature

- `async load(options: any = {})`

The load operation for the data source. The logic is implemented by the subclass.

### createCollectionManager()

#### Signature
- `abstract createCollectionManager(options?: any): ICollectionManager`

Creates a CollectionManager instance for the data source. The logic is implemented by the subclass.

### createResourceManager()

Creates a ResourceManager instance for the data source. Subclasses can override the implementation. By default, it creates the `ResourceManager` from `@nocobase/resourcer`.

### createACL()

- Creates an ACL instance for the DataSource. Subclasses can override the implementation. By default, it creates the `ACL` from `@nocobase/acl`.