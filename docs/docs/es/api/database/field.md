:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Campo

## Resumen

Clase de gestión de campos de **colección** (clase abstracta). Es también la clase base para todos los tipos de campo. Cualquier otro tipo de campo se implementa heredando de esta clase.

Para saber cómo personalizar campos, consulte [Extender tipos de campo]

## Constructor

Normalmente, los desarrolladores no lo llaman directamente. Se invoca principalmente a través del método `db.collection({ fields: [] })` como punto de entrada proxy.

Al extender un campo, se implementa principalmente heredando de la clase abstracta `Field` y luego registrándola en la instancia de `Database`.

**Firma**

- `constructor(options: FieldOptions, context: FieldContext)`

**Parámetros**

| Parámetro            | Tipo           | Valor predeterminado | Descripción                                     |
| -------------------- | -------------- | -------------------- | ----------------------------------------------- |
| `options`            | `FieldOptions` | -                    | Objeto de configuración del campo               |
| `options.name`       | `string`       | -                    | Nombre del campo                                |
| `options.type`       | `string`       | -                    | Tipo de campo, que corresponde al nombre del tipo de campo registrado en la base de datos |
| `context`            | `FieldContext` | -                    | Objeto de contexto del campo                    |
| `context.database`   | `Database`     | -                    | Instancia de la base de datos                   |
| `context.collection` | `Collection`   | -                    | Instancia de la **colección**                   |

## Miembros de Instancia

### `name`

Nombre del campo.

### `type`

Tipo de campo.

### `dataType`

Tipo de almacenamiento del campo en la base de datos.

### `options`

Parámetros de configuración de inicialización del campo.

### `context`

Objeto de contexto del campo.

## Métodos de Configuración

### `on()`

Un método de definición abreviado basado en eventos de la **colección**. Equivalente a `db.on(this.collection.name + '.' + eventName, listener)`.

Normalmente, no es necesario sobrescribir este método al heredar.

**Firma**

- `on(eventName: string, listener: (...args: any[]) => void)`

**Parámetros**

| Parámetro   | Tipo                       | Valor predeterminado | Descripción       |
| ----------- | -------------------------- | -------------------- | ----------------- |
| `eventName` | `string`                   | -                    | Nombre del evento |
| `listener`  | `(...args: any[]) => void` | -                    | Escuchador de eventos |

### `off()`

Un método de eliminación abreviado basado en eventos de la **colección**. Equivalente a `db.off(this.collection.name + '.' + eventName, listener)`.

Normalmente, no es necesario sobrescribir este método al heredar.

**Firma**

- `off(eventName: string, listener: (...args: any[]) => void)`

**Parámetros**

| Parámetro   | Tipo                       | Valor predeterminado | Descripción       |
| ----------- | -------------------------- | -------------------- | ----------------- |
| `eventName` | `string`                   | -                    | Nombre del evento |
| `listener`  | `(...args: any[]) => void` | -                    | Escuchador de eventos |

### `bind()`

El contenido que se ejecuta cuando un campo se añade a una **colección**. Se utiliza normalmente para añadir escuchadores de eventos de la **colección** y otros procesos.

Al heredar, debe llamar primero al método `super.bind()` correspondiente.

**Firma**

- `bind()`

### `unbind()`

El contenido que se ejecuta cuando un campo se elimina de una **colección**. Se utiliza normalmente para eliminar escuchadores de eventos de la **colección** y otros procesos.

Al heredar, debe llamar primero al método `super.unbind()` correspondiente.

**Firma**

- `unbind()`

### `get()`

Obtiene el valor de un elemento de configuración de un campo.

**Firma**

- `get(key: string): any`

**Parámetros**

| Parámetro | Tipo     | Valor predeterminado | Descripción                |
| --------- | -------- | -------------------- | -------------------------- |
| `key`     | `string` | -                    | Nombre del elemento de configuración |

**Ejemplo**

```ts
const field = db.collection('users').getField('name');

// Obtiene el valor del elemento de configuración del nombre del campo, devuelve 'name'
console.log(field.get('name'));
```

### `merge()`

Fusiona los valores de los elementos de configuración de un campo.

**Firma**

- `merge(options: { [key: string]: any }): void`

**Parámetros**

| Parámetro | Tipo                     | Valor predeterminado | Descripción                      |
| --------- | ------------------------ | -------------------- | -------------------------------- |
| `options` | `{ [key: string]: any }` | -                    | El objeto de elementos de configuración a fusionar |

**Ejemplo**

```ts
const field = db.collection('users').getField('name');

field.merge({
  // Añade una configuración de índice
  index: true,
});
```

### `remove()`

Elimina el campo de la **colección** (solo de la memoria).

**Ejemplo**

```ts
const books = db.getCollections('books');

books.getField('isbn').remove();

// eliminar realmente de la base de datos
await books.sync();
```

## Métodos de Base de Datos

### `removeFromDb()`

Elimina el campo de la base de datos.

**Firma**

- `removeFromDb(options?: Transactionable): Promise<void>`

**Parámetros**

| Parámetro              | Tipo          | Valor predeterminado | Descripción           |
| ---------------------- | ------------- | -------------------- | --------------------- |
| `options.transaction?` | `Transaction` | -                    | Instancia de transacción |

### `existsInDb()`

Determina si el campo existe en la base de datos.

**Firma**

- `existsInDb(options?: Transactionable): Promise<boolean>`

**Parámetros**

| Parámetro              | Tipo          | Valor predeterminado | Descripción           |
| ---------------------- | ------------- | -------------------- | --------------------- |
| `options.transaction?` | `Transaction` | -                    | Instancia de transacción |

## Lista de Tipos de Campo Integrados

NocoBase incluye algunos tipos de campo de uso común. Puede usar directamente el nombre de tipo correspondiente para especificar el tipo al definir los campos de una **colección**. Los diferentes tipos de campo tienen configuraciones de parámetros distintas; consulte la lista a continuación para obtener más detalles.

Todos los elementos de configuración para los tipos de campo, excepto los que se presentan a continuación, se pasarán a Sequelize. Por lo tanto, todos los elementos de configuración de campo compatibles con Sequelize se pueden usar aquí (como `allowNull`, `defaultValue`, etc.).

Además, los tipos de campo del lado del servidor resuelven principalmente problemas de almacenamiento en la base de datos y algunos algoritmos, y son básicamente independientes de los tipos de visualización de campo y los componentes utilizados en el frontend. Para los tipos de campo del frontend, consulte las instrucciones correspondientes en el tutorial.

### `'boolean'`

Tipo de valor lógico (booleano).

**Ejemplo**

```js
db.collection({
  name: 'books',
  fields: [
    {
      type: 'boolean',
      name: 'published',
    },
  ],
});
```

### `'integer'`

Tipo entero (32 bits).

**Ejemplo**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'integer',
      name: 'pages',
    },
  ],
});
```

### `'bigInt'`

Tipo entero largo (64 bits).

**Ejemplo**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'bigInt',
      name: 'words',
    },
  ],
});
```

### `'double'`

Tipo de punto flotante de doble precisión (64 bits).

**Ejemplo**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'double',
      name: 'price',
    },
  ],
});
```

### `'real'`

Tipo de número real (solo para PostgreSQL).

### `'decimal'`

Tipo decimal.

### `'string'`

Tipo de cadena de texto. Equivalente al tipo `VARCHAR` en la mayoría de las bases de datos.

**Ejemplo**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});
```

### `'text'`

Tipo de texto. Equivalente al tipo `TEXT` en la mayoría de las bases de datos.

**Ejemplo**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'text',
      name: 'content',
    },
  ],
});
```

### `'password'`

Tipo de contraseña (extensión de NocoBase). Cifra contraseñas utilizando el método `scrypt` del paquete nativo `crypto` de Node.js.

**Ejemplo**

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'password',
      name: 'password',
      length: 64, // Longitud, por defecto 64
      randomBytesSize: 8, // Longitud de bytes aleatorios, por defecto 8
    },
  ],
});
```

**Parámetros**

| Parámetro         | Tipo     | Valor predeterminado | Descripción            |
| ----------------- | -------- | -------------------- | ---------------------- |
| `length`          | `number` | 64                   | Longitud de caracteres |
| `randomBytesSize` | `number` | 8                    | Tamaño de bytes aleatorios |

### `'date'`

Tipo de fecha.

### `'time'`

Tipo de hora.

### `'array'`

Tipo de array (solo para PostgreSQL).

### `'json'`

Tipo JSON.

### `'jsonb'`

Tipo JSONB (solo para PostgreSQL; otros se compatibilizarán como tipo `'json'`).

### `'uuid'`

Tipo UUID.

### `'uid'`

Tipo UID (extensión de NocoBase). Tipo de identificador de cadena aleatoria corta.

### `'formula'`

Tipo fórmula (extensión de NocoBase). Permite configurar cálculos de fórmulas matemáticas basados en [mathjs](https://www.npmjs.com/package/mathjs). La fórmula puede hacer referencia a los valores de otras columnas en el mismo registro para el cálculo.

**Ejemplo**

```ts
db.collection({
  name: 'orders',
  fields: [
    {
      type: 'double',
      name: 'price',
    },
    {
      type: 'integer',
      name: 'quantity',
    },
    {
      type: 'formula',
      name: 'total',
      expression: 'price * quantity',
    },
  ],
});
```

### `'radio'`

Tipo radio (extensión de NocoBase). Como máximo, una fila de datos en toda la **colección** puede tener el valor `true` para este campo; todas las demás serán `false` o `null`.

**Ejemplo**

Solo hay un usuario marcado como 'root' en todo el sistema. Después de que el valor 'root' de cualquier otro usuario se cambie a `true`, todos los demás registros con 'root' en `true` se cambiarán a `false`:

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'radio',
      name: 'root',
    },
  ],
});
```

### `'sort'`

Tipo de ordenación (extensión de NocoBase). Ordena basándose en números enteros, genera automáticamente un nuevo número de secuencia para los nuevos registros y reordena los números de secuencia cuando se mueven los datos.

Si una **colección** define la opción `sortable`, también se generará automáticamente un campo correspondiente.

**Ejemplo**

Las publicaciones se pueden ordenar según el usuario al que pertenecen:

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsTo',
      name: 'user',
    },
    {
      type: 'sort',
      name: 'priority',
      scopeKey: 'userId', // Ordena los datos agrupados por el mismo valor de userId
    },
  ],
});
```

### `'virtual'`

Tipo virtual. No almacena datos realmente, solo se utiliza para definiciones especiales de *getter/setter*.

### `'belongsTo'`

Tipo de asociación de muchos a uno. La clave foránea se almacena en su propia **colección**, a diferencia de `hasOne`/`hasMany`.

**Ejemplo**

Cualquier publicación pertenece a un autor:

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users', // Si no se configura, por defecto será el nombre de la colección en plural
      foreignKey: 'authorId', // Si no se configura, por defecto será el formato <name> + Id
      sourceKey: 'id', // Si no se configura, por defecto será el id de la colección de destino
    },
  ],
});
```

### `'hasOne'`

Tipo de asociación de uno a uno. La clave foránea se almacena en la **colección** asociada, a diferencia de `belongsTo`.

**Ejemplo**

Cada usuario tiene un perfil:

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'hasOne',
      name: 'profile',
      target: 'profiles', // Puede omitirse
    },
  ],
});
```

### `'hasMany'`

Tipo de asociación de uno a muchos. La clave foránea se almacena en la **colección** asociada, a diferencia de `belongsTo`.

**Ejemplo**

Cualquier usuario puede tener múltiples publicaciones:

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'hasMany',
      name: 'posts',
      foreignKey: 'authorId',
      sourceKey: 'id',
    },
  ],
});
```

### `'belongsToMany'`

Tipo de asociación de muchos a muchos. Utiliza una **colección** intermedia para almacenar las claves foráneas de ambas partes. Si no se especifica una **colección** existente como intermedia, se creará automáticamente una **colección** intermedia.

**Ejemplo**

Cualquier publicación puede tener múltiples etiquetas, y cualquier etiqueta puede ser añadida a múltiples publicaciones:

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsToMany',
      name: 'tags',
      target: 'tags', // Puede omitirse si el nombre es el mismo
      through: 'postsTags', // La colección intermedia se generará automáticamente si no se configura
      foreignKey: 'postId', // La clave foránea de la colección de origen en la colección intermedia
      sourceKey: 'id', // La clave primaria de la colección de origen
      otherKey: 'tagId', // La clave foránea de la colección de destino en la colección intermedia
    },
  ],
});

db.collection({
  name: 'tags',
  fields: [
    {
      type: 'belongsToMany',
      name: 'posts',
      through: 'postsTags', // El mismo grupo de relaciones apunta a la misma colección intermedia
    },
  ],
});
```