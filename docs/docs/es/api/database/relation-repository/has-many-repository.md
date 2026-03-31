:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# HasManyRepository

`HasManyRepository` es un `Relation Repository` que se utiliza para gestionar relaciones `HasMany`.

## Métodos de Clase

### `find()`

Busca objetos asociados

**Firma**

- `async find(options?: FindOptions): Promise<M[]>`

**Detalles**

Los parámetros de consulta son los mismos que los de [`Repository.find()`](../repository.md#find).

### `findOne()`

Busca un objeto asociado, devolviendo solo un registro

**Firma**

- `async findOne(options?: FindOneOptions): Promise<M>`

<embed src="../shared/find-one.md"></embed>

### `count()`

Devuelve el número de registros que coinciden con las condiciones de consulta

**Firma**

- `async count(options?: CountOptions)`

**Tipo**

```typescript
interface CountOptions
  extends Omit<SequelizeCountOptions, 'distinct' | 'where' | 'include'>,
    Transactionable {
  filter?: Filter;
}
```

### `findAndCount()`

Consulta la base de datos para obtener un conjunto de datos y el número de resultados que coinciden con condiciones específicas.

**Firma**

- `async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]>`

**Tipo**

```typescript
type FindAndCountOptions = CommonFindOptions;
```

### `create()`

Crea objetos asociados

**Firma**

- `async create(options?: CreateOptions): Promise<M>`

<embed src="../shared/create-options.md"></embed>

### `update()`

Actualiza los objetos asociados que cumplen las condiciones

**Firma**

- `async update(options?: UpdateOptions): Promise<M>`

<embed src="../shared/update-options.md"></embed>

### `destroy()`

Elimina los objetos asociados que cumplen las condiciones

**Firma**

- `async destroy(options?: TK | DestroyOptions): Promise<M>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

Añade asociaciones de objetos

**Firma**

- `async add(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Tipo**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

**Detalles**

- `tk` - El valor `targetKey` del objeto asociado, que puede ser un valor único o un array.
  <embed src="../shared/transaction.md"></embed>

### `remove()`

Elimina la asociación con los objetos dados

**Firma**

- `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Detalles**

Los parámetros son los mismos que los del método [`add()`](#add).

### `set()`

Establece los objetos asociados para la relación actual

**Firma**

- `async set(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Detalles**

Los parámetros son los mismos que los del método [`add()`](#add).