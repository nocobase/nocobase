:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Repositorio

## Resumen

En un objeto de `colección` dado, puede obtener su objeto `Repository` para realizar operaciones de lectura y escritura en la `colección`.

```javascript
const { UserCollection } = require('./collections');

const UserRepository = UserCollection.repository;

const user = await UserRepository.findOne({
  filter: {
    id: 1,
  },
});

user.name = 'new name';
await user.save();
```

### Consulta

#### Consulta básica

En el objeto `Repository`, puede llamar a los métodos relacionados con `find*` para realizar operaciones de consulta. Todos los métodos de consulta admiten el paso de un parámetro `filter` para filtrar datos.

```javascript
// SELECT * FROM users WHERE id = 1
userRepository.find({
  filter: {
    id: 1,
  },
});
```

#### Operadores

El parámetro `filter` en `Repository` también ofrece una variedad de operadores para realizar operaciones de consulta más diversas.

```javascript
// SELECT * FROM users WHERE age > 18
userRepository.find({
  filter: {
    age: {
      $gt: 18,
    },
  },
});

// SELECT * FROM users WHERE age > 18 OR name LIKE '%张%'
userRepository.find({
  filter: {
    $or: [{ age: { $gt: 18 } }, { name: { $like: '%张%' } }],
  },
});
```

Para más detalles sobre los operadores, consulte [Operadores de filtro](/api/database/operators).

#### Control de campos

Al realizar una operación de consulta, puede controlar los campos de salida a través de los parámetros `fields`, `except` y `appends`.

- `fields`: Especifica los campos de salida.
- `except`: Excluye los campos de salida.
- `appends`: Añade campos asociados a la salida.

```javascript
// El resultado solo incluirá los campos id y name
userRepository.find({
  fields: ['id', 'name'],
});

// El resultado no incluirá el campo password
userRepository.find({
  except: ['password'],
});

// El resultado incluirá datos del objeto asociado posts
userRepository.find({
  appends: ['posts'],
});
```

#### Consulta de campos asociados

El parámetro `filter` admite el filtrado por campos asociados, por ejemplo:

```javascript
// Consulta objetos de usuario cuyos posts asociados tienen un objeto con el título 'post title'
userRepository.find({
  filter: {
    'posts.title': 'post title',
  },
});
```

Los campos asociados también pueden anidarse.

```javascript
// Consulta objetos de usuario donde los comentarios de sus posts contienen palabras clave
await userRepository.find({
  filter: {
    'posts.comments.content': {
      $like: '%keywords%',
    },
  },
});
```

#### Ordenación

Puede ordenar los resultados de la consulta utilizando el parámetro `sort`.

```javascript
// SELECT * FROM users ORDER BY age
await userRepository.find({
  sort: 'age',
});

// SELECT * FROM users ORDER BY age DESC
await userRepository.find({
  sort: '-age',
});

// SELECT * FROM users ORDER BY age DESC, name ASC
await userRepository.find({
  sort: ['-age', 'name'],
});
```

También puede ordenar por los campos de objetos asociados.

```javascript
await userRepository.find({
  sort: 'profile.createdAt',
});
```

### Creación

#### Creación básica

Cree nuevos objetos de datos a través del `Repository`.

```javascript
await userRepository.create({
  name: '张三',
  age: 18,
});
// INSERT INTO users (name, age) VALUES ('张三', 18)

// Admite la creación masiva
await userRepository.create([
  {
    name: '张三',
    age: 18,
  },
  {
    name: '李四',
    age: 20,
  },
]);
```

#### Creación de asociaciones

Al crear, también puede crear objetos asociados simultáneamente. De forma similar a las consultas, también se admite el uso anidado de objetos asociados, por ejemplo:

```javascript
await userRepository.create({
  name: '张三',
  age: 18,
  posts: [
    {
      title: 'post title',
      content: 'post content',
      tags: [
        {
          name: 'tag1',
        },
        {
          name: 'tag2',
        },
      ],
    },
  ],
});
// Cuando crea un usuario, se crea una publicación y se asocia con el usuario, y se crean etiquetas y se asocian con la publicación.
```

Si el objeto asociado ya existe en la base de datos, puede pasar su ID para establecer una asociación con él durante la creación.

```javascript
const tag1 = await tagRepository.findOne({
  filter: {
    name: 'tag1',
  },
});

await userRepository.create({
  name: '张三',
  age: 18,
  posts: [
    {
      title: 'post title',
      content: 'post content',
      tags: [
        {
          id: tag1.id, // Establece una asociación con un objeto asociado existente
        },
        {
          name: 'tag2',
        },
      ],
    },
  ],
});
```

### Actualización

#### Actualización básica

Después de obtener un objeto de datos, puede modificar directamente sus propiedades en el objeto de datos (`Model`) y luego llamar al método `save` para guardar los cambios.

```javascript
const user = await userRepository.findOne({
  filter: {
    name: '张三',
  },
});

user.age = 20;
await user.save();
```

El objeto de datos `Model` hereda del Modelo de Sequelize. Para operaciones en el `Model`, consulte [Sequelize Model](https://sequelize.org/master/manual/model-basics.html).

También puede actualizar datos a través del `Repository`:

```javascript
// Actualiza los registros de datos que cumplen con los criterios de filtro
await userRepository.update({
  filter: {
    name: '张三',
  },
  values: {
    age: 20,
  },
});
```

Al actualizar, puede controlar qué campos se actualizan utilizando los parámetros `whitelist` y `blacklist`, por ejemplo:

```javascript
await userRepository.update({
  filter: {
    name: '张三',
  },
  values: {
    age: 20,
    name: '李四',
  },
  whitelist: ['age'], // Solo actualiza el campo age
});
```

#### Actualización de campos asociados

Al actualizar, puede establecer objetos asociados, por ejemplo:

```javascript
const tag1 = tagRepository.findOne({
  filter: {
    id: 1,
  },
});

await postRepository.update({
  filter: {
    id: 1,
  },
  values: {
    title: 'new post title',
    tags: [
      {
        id: tag1.id, // Establece una asociación con tag1
      },
      {
        name: 'tag2', // Crea una nueva etiqueta y establece una asociación
      },
    ],
  },
});

await postRepository.update({
  filter: {
    id: 1,
  },
  values: {
    tags: null, // Desasocia la publicación de las etiquetas
  },
});
```

### Eliminación

Puede llamar al método `destroy()` en el `Repository` para realizar una operación de eliminación. Debe especificar los criterios de filtro al eliminar:

```javascript
await userRepository.destroy({
  filter: {
    status: 'blocked',
  },
});
```

## Constructor

Normalmente no es llamado directamente por los desarrolladores. Se instancia principalmente después de registrar el tipo a través de `db.registerRepositories()` y de especificar el tipo de repositorio registrado correspondiente en los parámetros de `db.collection()`.

**Firma**

- `constructor(collection: Collection)`

**Ejemplo**

```ts
import { Repository } from '@nocobase/database';

class MyRepository extends Repository {
  async myQuery(sql) {
    return this.database.sequelize.query(sql);
  }
}

db.registerRepositories({
  books: MyRepository,
});

db.collection({
  name: 'books',
  // aquí se enlaza al repositorio registrado
  repository: 'books',
});

await db.sync();

const books = db.getRepository('books') as MyRepository;
await books.myQuery('SELECT * FROM books;');
```

## Miembros de instancia

### `database`

La instancia de gestión de la base de datos del contexto.

### `collection`

La instancia de gestión de la `colección` correspondiente.

### `model`

La clase de modelo correspondiente.

## Métodos de instancia

### `find()`

Consulta un conjunto de datos de la base de datos, permitiendo la especificación de condiciones de filtro, ordenación, etc.

**Firma**

- `async find(options?: FindOptions): Promise<Model[]>`

**Tipo**

```typescript
type Filter = FilterWithOperator | FilterWithValue | FilterAnd | FilterOr;
type Appends = string[];
type Except = string[];
type Fields = string[];
type Sort = string[] | string;

interface SequelizeFindOptions {
  limit?: number;
  offset?: number;
}

interface FilterByTk {
  filterByTk?: TargetKey;
}

interface CommonFindOptions extends Transactionable {
  filter?: Filter;
  fields?: Fields;
  appends?: Appends;
  except?: Except;
  sort?: Sort;
}

type FindOptions = SequelizeFindOptions & CommonFindOptions & FilterByTk;
```

**Detalles**

#### `filter: Filter`

Condición de consulta utilizada para filtrar los resultados de los datos. En los parámetros de consulta pasados, la `key` es el nombre del campo a consultar, y el `value` puede ser el valor a consultar o utilizarse con operadores para otros filtros de datos condicionales.

```typescript
// Consulta los registros donde el nombre es 'foo' y la edad es mayor que 18
repository.find({
  filter: {
    name: 'foo',
    age: {
      $gt: 18,
    },
  },
});
```

Para más operadores, consulte [Operadores de consulta](./operators.md).

#### `filterByTk: TargetKey`

Consulta datos por `TargetKey`, que es un método conveniente para el parámetro `filter`. El campo específico para `TargetKey` se puede [configurar](./collection.md#filtertargetkey) en la `colección`, por defecto es `primaryKey`.

```typescript
// Por defecto, busca el registro con id = 1
repository.find({
  filterByTk: 1,
});
```

#### `fields: string[]`

Columnas de consulta, utilizadas para controlar los resultados de los campos de datos. Después de pasar este parámetro, solo se devolverán los campos especificados.

#### `except: string[]`

Columnas excluidas, utilizadas para controlar los resultados de los campos de datos. Después de pasar este parámetro, los campos pasados no se mostrarán.

#### `appends: string[]`

Columnas añadidas, utilizadas para cargar datos asociados. Después de pasar este parámetro, los campos de asociación especificados también se mostrarán.

#### `sort: string[] | string`

Especifica el método de ordenación para los resultados de la consulta. El parámetro es el nombre del campo, que por defecto es orden ascendente (`asc`). Para orden descendente (`desc`), añada un símbolo `-` antes del nombre del campo, por ejemplo, `['-id', 'name']`, lo que significa ordenar por `id desc, name asc`.

#### `limit: number`

Limita el número de resultados, igual que `limit` en `SQL`.

#### `offset: number`

Desplazamiento de la consulta, igual que `offset` en `SQL`.

**Ejemplo**

```ts
const posts = db.getRepository('posts');

const results = await posts.find({
  filter: {
    createdAt: {
      $gt: '2022-01-01T00:00:00.000Z',
    },
  },
  fields: ['title'],
  appends: ['user'],
});
```

### `findOne()`

Consulta un único dato de la base de datos que cumple con criterios específicos. Equivalente a `Model.findOne()` en Sequelize.

**Firma**

- `async findOne(options?: FindOneOptions): Promise<Model | null>`

<embed src="./shared/find-one.md"></embed>

**Ejemplo**

```ts
const posts = db.getRepository('posts');

const result = await posts.findOne({
  filterByTk: 1,
});
```

### `count()`

Consulta el número total de entradas de datos que cumplen con criterios específicos de la base de datos. Equivalente a `Model.count()` en Sequelize.

**Firma**

- `count(options?: CountOptions): Promise<number>`

**Tipo**

```typescript
interface CountOptions
  extends Omit<SequelizeCountOptions, 'distinct' | 'where' | 'include'>,
    Transactionable {
  filter?: Filter;
}
```

**Ejemplo**

```ts
const books = db.getRepository('books');

const count = await books.count({
  filter: {
    title: '三字经',
  },
});
```

### `findAndCount()`

Consulta un conjunto de datos y el número total de resultados que cumplen con criterios específicos de la base de datos. Equivalente a `Model.findAndCountAll()` en Sequelize.

**Firma**

- `async findAndCount(options?: FindAndCountOptions): Promise<[Model[], number]>`

**Tipo**

```typescript
type FindAndCountOptions = Omit<
  SequelizeAndCountOptions,
  'where' | 'include' | 'order'
> &
  CommonFindOptions;
```

**Detalles**

Los parámetros de consulta son los mismos que los de `find()`. El valor de retorno es un array donde el primer elemento es el resultado de la consulta y el segundo elemento es el recuento total.

### `create()`

Inserta un nuevo registro en la `colección`. Equivalente a `Model.create()` en Sequelize. Cuando el objeto de datos a crear contiene información sobre campos de relación, los registros de datos de relación correspondientes también se crearán o actualizarán.

**Firma**

- `async create<M extends Model>(options: CreateOptions): Promise<M>`

<embed src="./shared/create-options.md"></embed>

**Ejemplo**

```ts
const posts = db.getRepository('posts');

const result = await posts.create({
  values: {
    title: 'NocoBase 1.0 发布日志',
    tags: [
      // Cuando el valor de la clave primaria de la tabla de relación existe, actualiza ese dato
      { id: 1 },
      // Cuando no hay valor de clave primaria, crea un nuevo dato
      { name: 'NocoBase' },
    ],
  },
});
```

### `createMany()`

Inserta múltiples registros nuevos en la `colección`. Equivalente a llamar al método `create()` varias veces.

**Firma**

- `createMany(options: CreateManyOptions): Promise<Model[]>`

**Tipo**

```typescript
interface CreateManyOptions extends BulkCreateOptions {
  records: Values[];
}
```

**Detalles**

- `records`: Un array de objetos de datos para los registros a crear.
- `transaction`: Objeto de transacción. Si no se pasa ningún parámetro de transacción, el método creará automáticamente una transacción interna.

**Ejemplo**

```ts
const posts = db.getRepository('posts');

const results = await posts.createMany({
  records: [
    {
      title: 'NocoBase 1.0 发布日志',
      tags: [
        // Cuando el valor de la clave primaria de la tabla de relación existe, actualiza ese dato
        { id: 1 },
        // Cuando no hay valor de clave primaria, crea un nuevo dato
        { name: 'NocoBase' },
      ],
    },
    {
      title: 'NocoBase 1.1 发布日志',
      tags: [{ id: 1 }],
    },
  ],
});
```

### `update()`

Actualiza datos en la `colección`. Equivalente a `Model.update()` en Sequelize. Cuando el objeto de datos a actualizar contiene información sobre campos de relación, los registros de datos de relación correspondientes también se crearán o actualizarán.

**Firma**

- `async update<M extends Model>(options: UpdateOptions): Promise<M>`

<embed src="./shared/update-options.md"></embed>

**Ejemplo**

```ts
const posts = db.getRepository('posts');

const result = await posts.update({
  filterByTk: 1,
  values: {
    title: 'NocoBase 1.0 发布日志',
    tags: [
      // Cuando el valor de la clave primaria de la tabla de relación existe, actualiza ese dato
      { id: 1 },
      // Cuando no hay valor de clave primaria, crea un nuevo dato
      { name: 'NocoBase' },
    ],
  },
});
```

### `destroy()`

Elimina datos de la `colección`. Equivalente a `Model.destroy()` en Sequelize.

**Firma**

- `async destroy(options?: TargetKey | TargetKey[] | DestroyOptions): Promise<number>`

**Tipo**

```typescript
interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: Filter;
  filterByTk?: TargetKey | TargetKey[];
  truncate?: boolean;
  context?: any;
}
```

**Detalles**

- `filter`: Especifica las condiciones de filtro para los registros a eliminar. Para un uso detallado de Filter, consulte el método [`find()`](#find).
- `filterByTk`: Especifica las condiciones de filtro para los registros a eliminar por TargetKey.
- `truncate`: Si se deben truncar los datos de la `colección`, efectivo cuando no se pasa ningún parámetro `filter` o `filterByTk`.
- `transaction`: Objeto de transacción. Si no se pasa ningún parámetro de transacción, el método creará automáticamente una transacción interna.