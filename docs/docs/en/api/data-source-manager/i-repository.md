# IRepository

The `Repository` interface defines a series of model operation methods for adapting the CRUD operations of the data source.

## API 

### find()

Returns a list of models that match the query parameters.

#### Signature

- `find(options?: any): Promise<IModel[]>`

### findOne()

Returns a model that matches the query parameters. If there are multiple matching models, only the first one is returned.

#### Signature 

- `findOne(options?: any): Promise<IModel>`


### count()

Returns the number of models that match the query parameters.

#### Signature

- `count(options?: any): Promise<Number>`

### findAndCount()

Returns the list and count of models that match the query parameters.

#### Signature

- `findAndCount(options?: any): Promise<[IModel[], Number]>`

### create()

Creates a model data object.

#### Signature

- `create(options: any): void`

### update()

Updates a model data object based on the query conditions.

#### Signature

- `update(options: any): void`

### destroy()

Deletes a model data object based on the query conditions.

#### Signature

- `destroy(options: any): void`