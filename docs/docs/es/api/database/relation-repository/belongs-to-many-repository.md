:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# BelongsToManyRepository

`BelongsToManyRepository` es un `Relation Repository` que se utiliza para gestionar relaciones `BelongsToMany`.

A diferencia de otros tipos de relaciones, las relaciones `BelongsToMany` requieren una tabla intermedia para su registro.
Al definir una relación de asociación en NocoBase, la tabla intermedia puede crearse automáticamente o especificarse explícitamente.

## Métodos de Clase

### `find()`

Busca objetos asociados

**Signature**

- `async find(options?: FindOptions): Promise<M[]>`

**Detalles**

Los parámetros de consulta son consistentes con [`Repository.find()`](../repository.md#find).

### `findOne()`

Busca un objeto asociado, devolviendo solo un registro.

**Signature**

- `async findOne(options?: FindOneOptions): Promise<M>`

<embed src="../shared/find-one.md"></embed>

### `count()`

Devuelve el número de registros que coinciden con las condiciones de la consulta.

**Signature**

- `async count(options?: CountOptions)`

**Type**

```typescript
interface CountOptions
  extends Omit<SequelizeCountOptions, 'distinct' | 'where' | 'include'>,
    Transactionable {
  filter?: Filter;
}
```

### `findAndCount()`

Consulta la base de datos para obtener un conjunto de datos y el recuento total bajo condiciones específicas.

**Signature**

- `async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]>`

**Type**

```typescript
type FindAndCountOptions = CommonFindOptions;
```

### `create()`

Crea un objeto asociado

**Signature**

- `async create(options?: CreateOptions): Promise<M>`

<embed src="../shared/create-options.md"></embed>

### `update()`

Actualiza los objetos asociados que cumplen las condiciones.

**Signature**

- `async update(options?: UpdateOptions): Promise<M>`

<embed src="../shared/update-options.md"></embed>

### `destroy()`

Elimina los objetos asociados que cumplen las condiciones.

**Signature**

- `async destroy(options?: TargetKey | TargetKey[] | DestroyOptions): Promise<Boolean>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

Añade nuevos objetos asociados.

**Signature**

- `async add(
options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions
): Promise<void>`

**Type**

```typescript
type PrimaryKeyWithThroughValues = [TargetKey, Values];

interface AssociatedOptions extends Transactionable {
  tk?:
    | TargetKey
    | TargetKey[]
    | PrimaryKeyWithThroughValues
    | PrimaryKeyWithThroughValues[];
}
```

**Detalles**

Puede pasar directamente la `targetKey` del objeto asociado, o pasar la `targetKey` junto con los valores de los campos de la tabla intermedia.

**Ejemplo**

```typescript
const t1 = await Tag.repository.create({
  values: { name: 't1' },
});

const t2 = await Tag.repository.create({
  values: { name: 't2' },
});

const p1 = await Post.repository.create({
  values: { title: 'p1' },
});

const PostTagRepository = new BelongsToManyRepository(Post, 'tags', p1.id);

// Pasa la targetKey
PostTagRepository.add([t1.id, t2.id]);

// Pasa los campos de la tabla intermedia
PostTagRepository.add([
  [t1.id, { tagged_at: '123' }],
  [t2.id, { tagged_at: '456' }],
]);
```

### `set()`

Establece objetos asociados.

**Signature**

- async set(
  options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions,
  ): Promise<void>

**Detalles**

Los parámetros son los mismos que en [add()](#add).

### `remove()`

Elimina la asociación con los objetos dados.

**Signature**

- `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Type**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

### `toggle()`

Alterna objetos asociados.

En algunos escenarios de negocio, a menudo es necesario alternar objetos asociados. Por ejemplo, un usuario puede marcar un producto como favorito, quitarlo de favoritos y volver a marcarlo. El método `toggle` permite implementar rápidamente una funcionalidad similar.

**Signature**

- `async toggle(options: TargetKey | { tk?: TargetKey; transaction?: Transaction }): Promise<void>`

**Detalles**

El método `toggle` comprueba automáticamente si el objeto asociado ya existe. Si existe, lo elimina; si no, lo añade.