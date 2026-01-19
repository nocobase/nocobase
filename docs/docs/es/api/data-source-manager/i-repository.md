:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# IRepository

La interfaz `Repository` define una serie de métodos para operar con modelos, adaptándose a las operaciones CRUD (Crear, Leer, Actualizar, Eliminar) de la fuente de datos.

## API

### find()

Devuelve una lista de modelos que coinciden con los parámetros de consulta.

#### Firma

- `find(options?: any): Promise<IModel[]>`

### findOne()

Devuelve un modelo que coincide con los parámetros de consulta. Si hay varios modelos que coinciden, devuelve solo el primero.

#### Firma

- `findOne(options?: any): Promise<IModel>`

### count()

Devuelve la cantidad de modelos que coinciden con los parámetros de consulta.

#### Firma

- `count(options?: any): Promise<Number>`

### findAndCount()

Devuelve la lista y la cantidad de modelos que coinciden con los parámetros de consulta.

#### Firma

- `findAndCount(options?: any): Promise<[IModel[], Number]>`

### create()

Crea un objeto de modelo de datos.

#### Firma

- `create(options: any): void`

### update()

Actualiza un objeto de modelo de datos según las condiciones de consulta.

#### Firma

- `update(options: any): void`

### destroy()

Elimina un objeto de modelo de datos según las condiciones de consulta.

#### Firma

- `destroy(options: any): void`