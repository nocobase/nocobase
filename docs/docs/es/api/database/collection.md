:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Colección

## Resumen

La `colección` se utiliza para definir modelos de datos en el sistema, como nombres de modelos, campos, índices, asociaciones y otra información.
Generalmente, se invoca a través del método `collection` de una instancia de `Database` como punto de entrada de proxy.

```javascript
const { Database } = require('@nocobase/database')

// Crear una instancia de base de datos
const db = new Database({...});

// Definir un modelo de datos
db.collection({
  name: 'users',
  // Definir campos del modelo
  fields: [
    // Campo escalar
    {
      name: 'name',
      type: 'string',
    },

    // Campo de asociación
    {
      name: 'profile',
      type: 'hasOne' // 'hasMany', 'belongsTo', 'belongsToMany'
    }
  ],
});
```

Para más tipos de campos, consulte [Campos](/api/database/field).

## Constructor

**Firma**

- `constructor(options: CollectionOptions, context: CollectionContext)`

**Parámetros**

| Parámetro             | Tipo                                                        | Valor predeterminado | Descripción                                                                                   |
| --------------------- | ----------------------------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------- |
| `options.name`        | `string`                                                    | -                    | Identificador de la colección                                                                 |
| `options.tableName?`  | `string`                                                    | -                    | Nombre de la tabla de la base de datos. Si no se proporciona, se utilizará el valor de `options.name`. |
| `options.fields?`     | `FieldOptions[]`                                            | -                    | Definiciones de campos. Consulte [Campo](./field) para más detalles.                          |
| `options.model?`      | `string \| ModelStatic<Model>`                              | -                    | Tipo de modelo de Sequelize. Si se utiliza una `string`, el nombre del modelo debe haberse registrado previamente en la base de datos. |
| `options.repository?` | `string \| RepositoryType`                                  | -                    | Tipo de repositorio. Si se utiliza una `string`, el tipo de repositorio debe haberse registrado previamente en la base de datos. |
| `options.sortable?`   | `string \| boolean \| { name?: string; scopeKey?: string }` | -                    | Configuración del campo ordenable. Por defecto, no es ordenable.                              |
| `options.autoGenId?`  | `boolean`                                                   | `true`               | Indica si se debe generar automáticamente una clave primaria única. El valor predeterminado es `true`. |
| `context.database`    | `Database`                                                  | -                    | La base de datos en el contexto actual.                                                       |

**Ejemplo**

Crear una colección de publicaciones:

```ts
const posts = new Collection(
  {
    name: 'posts',
    fields: [
      {
        type: 'string',
        name: 'title',
      },
      {
        type: 'double',
        name: 'price',
      },
    ],
  },
  {
    // Instancia de base de datos existente
    database: db,
  },
);
```

## Miembros de Instancia

### `options`

Parámetros de configuración inicial de la colección. Son los mismos que el parámetro `options` del constructor.

### `context`

El contexto al que pertenece la colección actual, que actualmente es principalmente la instancia de la base de datos.

### `name`

Nombre de la colección.

### `db`

La instancia de base de datos a la que pertenece.

### `filterTargetKey`

El nombre del campo utilizado como clave primaria.

### `isThrough`

Indica si es una colección intermedia.

### `model`

Coincide con el tipo de modelo de Sequelize.

### `repository`

Instancia del repositorio.

## Métodos de Configuración de Campos

### `getField()`

Obtiene el objeto de campo con el nombre correspondiente definido en la colección.

**Firma**

- `getField(name: string): Field`

**Parámetros**

| Parámetro | Tipo     | Valor predeterminado | Descripción     |
| --------- | -------- | -------------------- | --------------- |
| `name`    | `string` | -                    | Nombre del campo |

**Ejemplo**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

const field = posts.getField('title');
```

### `setField()`

Establece un campo para la colección.

**Firma**

- `setField(name: string, options: FieldOptions): Field`

**Parámetros**

| Parámetro | Tipo           | Valor predeterminado | Descripción                                   |
| --------- | -------------- | -------------------- | --------------------------------------------- |
| `name`    | `string`       | -                    | Nombre del campo                              |
| `options` | `FieldOptions` | -                    | Configuración del campo. Consulte [Campo](./field) para más detalles. |

**Ejemplo**

```ts
const posts = db.collection({ name: 'posts' });

posts.setField('title', { type: 'string' });
```

### `setFields()`

Establece múltiples campos para la colección en lote.

**Firma**

- `setFields(fields: FieldOptions[], resetFields = true): Field[]`

**Parámetros**

| Parámetro     | Tipo             | Valor predeterminado | Descripción                                   |
| ------------- | ---------------- | -------------------- | --------------------------------------------- |
| `fields`      | `FieldOptions[]` | -                    | Configuración del campo. Consulte [Campo](./field) para más detalles. |
| `resetFields` | `boolean`        | `true`               | Indica si se deben restablecer los campos existentes. |

**Ejemplo**

```ts
const posts = db.collection({ name: 'posts' });

posts.setFields([
  { type: 'string', name: 'title' },
  { type: 'double', name: 'price' },
]);
```

### `removeField()`

Elimina el objeto de campo con el nombre correspondiente definido en la colección.

**Firma**

- `removeField(name: string): void | Field`

**Parámetros**

| Parámetro | Tipo     | Valor predeterminado | Descripción     |
| --------- | -------- | -------------------- | --------------- |
| `name`    | `string` | -                    | Nombre del campo |

**Ejemplo**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.removeField('title');
```

### `resetFields()`

Restablece (borra) los campos de la colección.

**Firma**

- `resetFields(): void`

**Ejemplo**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.resetFields();
```

### `hasField()`

Comprueba si un objeto de campo con el nombre correspondiente está definido en la colección.

**Firma**

- `hasField(name: string): boolean`

**Parámetros**

| Parámetro | Tipo     | Valor predeterminado | Descripción     |
| --------- | -------- | -------------------- | --------------- |
| `name`    | `string` | -                    | Nombre del campo |

**Ejemplo**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.hasField('title'); // true
```

### `findField()`

Encuentra un objeto de campo en la colección que cumple con los criterios.

**Firma**

- `findField(predicate: (field: Field) => boolean): Field | undefined`

**Parámetros**

| Parámetro   | Tipo                        | Valor predeterminado | Descripción        |
| ----------- | --------------------------- | -------------------- | ------------------ |
| `predicate` | `(field: Field) => boolean` | -                    | Criterios de búsqueda |

**Ejemplo**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.findField((field) => field.name === 'title');
```

### `forEachField()`

Itera sobre los objetos de campo en la colección.

**Firma**

- `forEachField(callback: (field: Field) => void): void`

**Parámetros**

| Parámetro  | Tipo                     | Valor predeterminado | Descripción       |
| ---------- | ------------------------ | -------------------- | ----------------- |
| `callback` | `(field: Field) => void` | -                    | Función de callback |

**Ejemplo**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.forEachField((field) => console.log(field.name));
```

## Métodos de Configuración de Índices

### `addIndex()`

Añade un índice a la colección.

**Firma**

- `addIndex(index: string | string[] | { fields: string[], unique?: boolean,[key: string]: any })`

**Parámetros**

| Parámetro | Tipo                                                         | Valor predeterminado | Descripción                  |
| --------- | ------------------------------------------------------------ | -------------------- | ---------------------------- |
| `index`   | `string \| string[]`                                         | -                    | Nombre(s) del campo a indexar. |
| `index`   | `{ fields: string[], unique?: boolean, [key: string]: any }` | -                    | Configuración completa.      |

**Ejemplo**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.addIndex({
  fields: ['title'],
  unique: true,
});
```

### `removeIndex()`

Elimina un índice de la colección.

**Firma**

- `removeIndex(fields: string[])`

**Parámetros**

| Parámetro | Tipo       | Valor predeterminado | Descripción                                       |
| --------- | ---------- | -------------------- | ------------------------------------------------- |
| `fields`  | `string[]` | -                    | Combinación de nombres de campos para el índice a eliminar. |

**Ejemplo**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
  indexes: [
    {
      fields: ['title'],
      unique: true,
    },
  ],
});

posts.removeIndex(['title']);
```

## Métodos de Configuración de la Colección

### `remove()`

Elimina la colección.

**Firma**

- `remove(): void`

**Ejemplo**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.remove();
```

## Métodos de Operación de Base de Datos

### `sync()`

Sincroniza la definición de la colección con la base de datos. Además de la lógica predeterminada de `Model.sync` en Sequelize, también procesa las colecciones correspondientes a los campos de asociación.

**Firma**

- `sync(): Promise<void>`

**Ejemplo**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

await posts.sync();
```

### `existsInDb()`

Comprueba si la colección existe en la base de datos.

**Firma**

- `existsInDb(options?: Transactionable): Promise<boolean>`

**Parámetros**

| Parámetro              | Tipo          | Valor predeterminado | Descripción          |
| ---------------------- | ------------- | -------------------- | -------------------- |
| `options?.transaction` | `Transaction` | -                    | Instancia de transacción |

**Ejemplo**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

const existed = await posts.existsInDb();

console.log(existed); // false
```

### `removeFromDb()`

**Firma**

- `removeFromDb(): Promise<void>`

**Ejemplo**

```ts
const books = db.collection({
  name: 'books',
});

// Sincronizar la colección de libros con la base de datos
await db.sync();

// Eliminar la colección de libros de la base de datos
await books.removeFromDb();
```