:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Base de Datos

## Visión general

Base de Datos es una herramienta de interacción con bases de datos que NocoBase le proporciona, ofreciendo funcionalidades muy convenientes para aplicaciones no-code y low-code. Actualmente, las bases de datos compatibles son:

- SQLite 3.8.8+
- MySQL 8.0.17+
- PostgreSQL 10.0+

### Conectar a la base de datos

En el constructor de `Database`, puede configurar la conexión a la base de datos pasando el parámetro `options`.

```javascript
const { Database } = require('@nocobase/database');

// Parámetros de configuración para la base de datos SQLite
const database = new Database({
  dialect: 'mysql',
  host: 'localhost',
  port: 3306,
  database: 'nocobase',
  username: 'root',
  password: 'password'
})

// Parámetros de configuración para la base de datos MySQL \ PostgreSQL
const database = new Database({
  dialect: /* 'postgres' o 'mysql' */,
  database: 'database',
  username: 'username',
  password: 'password',
  host: 'localhost',
  port: 'port'
})

```

Para conocer los parámetros de configuración detallados, consulte [Constructor](#constructor).

### Definición del modelo de datos

`Database` define la estructura de la base de datos a través de la **colección**. Un objeto de **colección** representa una tabla en la base de datos.

```javascript
// Definir colección
const UserCollection = database.collection({
  name: 'users',
  fields: [
    {
      name: 'name',
      type: 'string',
    },
    {
      name: 'age',
      type: 'integer',
    },
  ],
});
```

Una vez definida la estructura de la base de datos, puede usar el método `sync()` para sincronizarla.

```javascript
await database.sync();
```

Para un uso más detallado de la **colección**, consulte [Colección](/api/database/collection).

### Lectura y escritura de datos

`Database` opera con los datos a través de `Repository`.

```javascript
const UserRepository = UserCollection.repository();

// Crear
await UserRepository.create({
  name: '张三',
  age: 18,
});

// Consultar
const user = await UserRepository.findOne({
  filter: {
    name: '张三',
  },
});

// Modificar
await UserRepository.update({
  values: {
    age: 20,
  },
});

// Eliminar
await UserRepository.destroy(user.id);
```

Para un uso más detallado de las operaciones CRUD de datos, consulte [Repository](/api/database/repository).

## Constructor

**Firma**

- `constructor(options: DatabaseOptions)`

Crea una instancia de la base de datos.

**Parámetros**

| Parámetro                 | Tipo           | Valor predeterminado | Descripción                                                                                                                |
| ---------------------- | -------------- | ------------- | ------------------------------------------------------------------------------------------------------------------- |
| `options.host`         | `string`       | `'localhost'` | Host de la base de datos                                                                                                          |
| `options.port`         | `number`       | -             | Puerto del servicio de la base de datos, con un puerto predeterminado según la base de datos utilizada                                       |
| `options.username`     | `string`       | -             | Nombre de usuario de la base de datos                                                                                                        |
| `options.password`     | `string`       | -             | Contraseña de la base de datos                                                                                                          |
| `options.database`     | `string`       | -             | Nombre de la base de datos                                                                                                          |
| `options.dialect`      | `string`       | `'mysql'`     | Tipo de base de datos                                                                                                          |
| `options.storage?`     | `string`       | `':memory:'`  | Modo de almacenamiento para SQLite                                                                                                   |
| `options.logging?`     | `boolean`      | `false`       | ¿Habilitar el registro (logging)?                                                                                                        |
| `options.define?`      | `Object`       | `{}`          | Parámetros de definición de tabla predeterminados                                                                                                    |
| `options.tablePrefix?` | `string`       | `''`          | Extensión de NocoBase, prefijo de nombre de tabla                                                                                             |
| `options.migrator?`    | `UmzugOptions` | `{}`          | Extensión de NocoBase, parámetros relacionados con el gestor de migraciones, consulte la implementación de [Umzug](https://github.com/sequelize/umzug/blob/main/src/types.ts#L15). |

## Métodos relacionados con migraciones

### `addMigration()`

Agrega un único archivo de migración.

**Firma**

- `addMigration(options: MigrationItem)`

**Parámetros**

| Parámetro               | Tipo               | Valor predeterminado | Descripción                   |
| -------------------- | ------------------ | ------ | ---------------------- |
| `options.name`       | `string`           | -      | Nombre del archivo de migración           |
| `options.context?`   | `string`           | -      | Contexto del archivo de migración       |
| `options.migration?` | `typeof Migration` | -      | Clase personalizada para el archivo de migración     |
| `options.up`         | `Function`         | -      | Método `up` del archivo de migración   |
| `options.down`       | `Function`         | -      | Método `down` del archivo de migración |

**Ejemplo**

```ts
db.addMigration({
  name: '20220916120411-test-1',
  async up() {
    const queryInterface = this.context.db.sequelize.getQueryInterface();
    await queryInterface.query(/* your migration sqls */);
  },
});
```

### `addMigrations()`

Agrega archivos de migración desde un directorio especificado.

**Firma**

- `addMigrations(options: AddMigrationsOptions): void`

**Parámetros**

| Parámetro               | Tipo       | Valor predeterminado | Descripción             |
| -------------------- | ---------- | -------------- | ---------------- |
| `options.directory`  | `string`   | `''`           | Directorio donde se encuentran los archivos de migración |
| `options.extensions` | `string[]` | `['js', 'ts']` | Extensiones de archivo       |
| `options.namespace?` | `string`   | `''`           | Espacio de nombres         |
| `options.context?`   | `Object`   | `{ db }`       | Contexto del archivo de migración |

**Ejemplo**

```ts
db.addMigrations({
  directory: path.resolve(__dirname, './migrations'),
  namespace: 'test',
});
```

## Métodos de utilidad

### `inDialect()`

Verifica si el tipo de base de datos actual es uno de los tipos especificados.

**Firma**

- `inDialect(dialect: string[]): boolean`

**Parámetros**

| Parámetro    | Tipo       | Valor predeterminado | Descripción                                             |
| --------- | ---------- | ------ | ------------------------------------------------ |
| `dialect` | `string[]` | -      | Tipo de base de datos, los valores posibles son `mysql`/`postgres`/`mariadb` |

### `getTablePrefix()`

Obtiene el prefijo del nombre de la tabla de la configuración.

**Firma**

- `getTablePrefix(): string`

## Configuración de colección

### `collection()`

Define una **colección**. Esta llamada es similar al método `define` de Sequelize, creando la estructura de la tabla solo en memoria. Para persistirla en la base de datos, necesita llamar al método `sync`.

**Firma**

- `collection(options: CollectionOptions): Collection`

**Parámetros**

Todos los parámetros de configuración de `options` son consistentes con el constructor de la clase `Collection`, consulte [Colección](/api/database/collection#constructor).

**Eventos**

- `'beforeDefineCollection'`: Se activa antes de definir una **colección**.
- `'afterDefineCollection'`: Se activa después de definir una **colección**.

**Ejemplo**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
    {
      type: 'float',
      name: 'price',
    },
  ],
});

// sync collection as table to db
await db.sync();
```

### `getCollection()`

Obtiene una **colección** definida.

**Firma**

- `getCollection(name: string): Collection`

**Parámetros**

| Parámetro | Tipo     | Valor predeterminado | Descripción |
| ------ | -------- | ------ | ---- |
| `name` | `string` | -      | Nombre de la **colección** |

**Ejemplo**

```ts
const collection = db.getCollection('books');
```

### `hasCollection()`

Verifica si se ha definido una **colección** específica.

**Firma**

- `hasCollection(name: string): boolean`

**Parámetros**

| Parámetro | Tipo     | Valor predeterminado | Descripción |
| ------ | -------- | ------ | ---- |
| `name` | `string` | -      | Nombre de la **colección** |

**Ejemplo**

```ts
db.collection({ name: 'books' });

db.hasCollection('books'); // true

db.hasCollection('authors'); // false
```

### `removeCollection()`

Elimina una **colección** definida. Solo se elimina de la memoria; para persistir el cambio, necesita llamar al método `sync`.

**Firma**

- `removeCollection(name: string): void`

**Parámetros**

| Parámetro | Tipo     | Valor predeterminado | Descripción |
| ------ | -------- | ------ | ---- |
| `name` | `string` | -      | Nombre de la **colección** |

**Eventos**

- `'beforeRemoveCollection'`: Se activa antes de eliminar una **colección**.
- `'afterRemoveCollection'`: Se activa después de eliminar una **colección**.

**Ejemplo**

```ts
db.collection({ name: 'books' });

db.removeCollection('books');
```

### `import()`

Importa todos los archivos de un directorio como configuraciones de **colección** en memoria.

**Firma**

- `async import(options: { directory: string; extensions?: ImportFileExtension[] }): Promise<Map<string, Collection>>`

**Parámetros**

| Parámetro               | Tipo       | Valor predeterminado | Descripción             |
| -------------------- | ---------- | -------------- | ---------------- |
| `options.directory`  | `string`   | -              | Ruta del directorio a importar |
| `options.extensions` | `string[]` | `['ts', 'js']` | Extensiones de archivo a escanear     |

**Ejemplo**

La **colección** definida en el archivo `./collections/books.ts` es la siguiente:

```ts
export default {
  name: 'books',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
};
```

Importe la configuración relevante cuando se cargue el **plugin**:

```ts
class Plugin {
  async load() {
    await this.app.db.import({
      directory: path.resolve(__dirname, './collections'),
    });
  }
}
```

## Registro y recuperación de extensiones

### `registerFieldTypes()`

Registra tipos de campo personalizados.

**Firma**

- `registerFieldTypes(fieldTypes: MapOf<typeof Field>): void`

**Parámetros**

`fieldTypes` es un par clave-valor donde la clave es el nombre del tipo de campo y el valor es la clase del tipo de campo.

**Ejemplo**

```ts
import { Field } from '@nocobase/database';

class MyField extends Field {
  // ...
}

db.registerFieldTypes({
  myField: MyField,
});
```

### `registerModels()`

Registra clases de modelo de datos personalizadas.

**Firma**

- `registerModels(models: MapOf<ModelStatic<any>>): void`

**Parámetros**

`models` es un par clave-valor donde la clave es el nombre del modelo y el valor es la clase del modelo.

**Ejemplo**

```ts
import { Model } from '@nocobase/database';

class MyModel extends Model {
  // ...
}

db.registerModels({
  myModel: MyModel,
});

db.collection({
  name: 'myCollection',
  model: 'myModel',
});
```

### `registerRepositories()`

Registra clases de repositorio de datos personalizadas.

**Firma**

- `registerRepositories(repositories: MapOf<RepositoryType>): void`

**Parámetros**

`repositories` es un par clave-valor donde la clave es el nombre del repositorio y el valor es la clase del repositorio.

**Ejemplo**

```ts
import { Repository } from '@nocobase/database';

class MyRepository extends Repository {
  // ...
}

db.registerRepositories({
  myRepository: MyRepository,
});

db.collection({
  name: 'myCollection',
  repository: 'myRepository',
});
```

### `registerOperators()`

Registra operadores de consulta de datos personalizados.

**Firma**

- `registerOperators(operators: MapOf<OperatorFunc>)`

**Parámetros**

`operators` es un par clave-valor donde la clave es el nombre del operador y el valor es la función que genera la declaración de comparación.

**Ejemplo**

```ts
db.registerOperators({
  $dateOn(value) {
    return {
      [Op.and]: [
        { [Op.gte]: stringToDate(value) },
        { [Op.lt]: getNextDay(value) },
      ],
    };
  },
});

db.getRepository('books').count({
  filter: {
    createdAt: {
      // registered operator
      $dateOn: '2020-01-01',
    },
  },
});
```

### `getModel()`

Obtiene una clase de modelo de datos definida. Si no se registró previamente ninguna clase de modelo personalizada, se devolverá la clase de modelo predeterminada de Sequelize. El nombre predeterminado es el mismo que el nombre de la **colección**.

**Firma**

- `getModel(name: string): Model`

**Parámetros**

| Parámetro | Tipo     | Valor predeterminado | Descripción           |
| ------ | -------- | ------ | -------------- |
| `name` | `string` | -      | Nombre del modelo registrado |

**Ejemplo**

```ts
db.registerModels({
  books: class MyModel extends Model {},
});

const ModelClass = db.getModel('books');

console.log(ModelClass.prototype instanceof MyModel); // true
```

Nota: La clase de modelo obtenida de una **colección** no es estrictamente igual a la clase de modelo registrada, sino que hereda de ella. Dado que las propiedades de la clase de modelo de Sequelize se modifican durante la inicialización, NocoBase maneja automáticamente esta relación de herencia. Excepto por la desigualdad de clases, todas las demás definiciones se pueden usar normalmente.

### `getRepository()`

Obtiene una clase de repositorio de datos personalizada. Si no se registró previamente ninguna clase de repositorio de datos personalizada, se devolverá la clase de repositorio de datos predeterminada de NocoBase. El nombre predeterminado es el mismo que el nombre de la **colección**.

Las clases de repositorio se utilizan principalmente para operaciones CRUD basadas en modelos de datos, consulte [Repository](/api/database/repository).

**Firma**

- `getRepository(name: string): Repository`
- `getRepository(name: string, relationId?: string | number): Repository`

**Parámetros**

| Parámetro       | Tipo                 | Valor predeterminado | Descripción               |
| ------------ | -------------------- | ------ | ------------------ |
| `name`       | `string`             | -      | Nombre del repositorio registrado |
| `relationId` | `string` \| `number` | -      | Valor de la clave foránea para datos relacionales   |

Cuando el nombre es un nombre de asociación como `'tables.relations'`, se devolverá la clase de repositorio asociada. Si se proporciona el segundo parámetro, el repositorio se basará en el valor de la clave foránea de los datos relacionales cuando se utilice (consultas, actualizaciones, etc.).

**Ejemplo**

Supongamos que existen dos **colecciones**, *posts* y *authors*, y la **colección** de posts tiene una clave foránea que apunta a la **colección** de authors:

```ts
const AuthorsRepo = db.getRepository('authors');
const author1 = AuthorsRepo.create({ name: 'author1' });

const PostsRepo = db.getRepository('authors.posts', author1.id);
const post1 = AuthorsRepo.create({ title: 'post1' });
asset(post1.authorId === author1.id); // true
```

## Eventos de la base de datos

### `on()`

Escucha eventos de la base de datos.

**Firma**

- `on(event: string, listener: (...args: any[]) => void | Promise<void>): void`

**Parámetros**

| Parámetro   | Tipo     | Valor predeterminado | Descripción       |
| -------- | -------- | ------ | ---------- |
| event    | string   | -      | Nombre del evento   |
| listener | Function | -      | Escuchador de eventos |

Los nombres de los eventos admiten los eventos de Modelo de Sequelize de forma predeterminada. Para eventos globales, escuche utilizando el formato `<sequelize_model_global_event>`, y para eventos de Modelo individuales, utilice el formato `<model_name>.<sequelize_model_event>`.

Para descripciones de parámetros y ejemplos detallados de todos los tipos de eventos incorporados, consulte la sección [Eventos incorporados](#内置事件).

### `off()`

Elimina una función de escucha de eventos.

**Firma**

- `off(name: string, listener: Function)`

**Parámetros**

| Parámetro   | Tipo     | Valor predeterminado | Descripción       |
| -------- | -------- | ------ | ---------- |
| name     | string   | -      | Nombre del evento   |
| listener | Function | -      | Escuchador de eventos |

**Ejemplo**

```ts
const listener = async (model, options) => {
  console.log(model);
};

db.on('afterCreate', listener);

db.off('afterCreate', listener);
```

## Operaciones de la base de datos

### `auth()`

Autenticación de la conexión a la base de datos. Se puede utilizar para asegurar que la aplicación ha establecido una conexión con los datos.

**Firma**

- `auth(options: QueryOptions & { retry?: number } = {}): Promise<boolean>`

**Parámetros**

| Parámetro                 | Tipo                  | Valor predeterminado | Descripción               |
| ---------------------- | --------------------- | ------- | ------------------ |
| `options?`             | `Object`              | -       | Opciones de autenticación           |
| `options.retry?`       | `number`              | `10`    | Número de reintentos en caso de fallo de autenticación |
| `options.transaction?` | `Transaction`         | -       | Objeto de transacción           |
| `options.logging?`     | `boolean \| Function` | `false` | ¿Imprimir registros (logs)?       |

**Ejemplo**

```ts
await db.auth();
```

### `reconnect()`

Vuelve a conectar a la base de datos.

**Ejemplo**

```ts
await db.reconnect();
```

### `closed()`

Verifica si la conexión a la base de datos está cerrada.

**Firma**

- `closed(): boolean`

### `close()`

Cierra la conexión a la base de datos. Equivalente a `sequelize.close()`.

### `sync()`

Sincroniza la estructura de la **colección** de la base de datos. Equivalente a `sequelize.sync()`; para los parámetros, consulte la [documentación de Sequelize](https://sequelize.org/api/v6/class/src/sequelize.js~sequelize#instance-method-sync).

### `clean()`

Limpia la base de datos, eliminando todas las **colecciones**.

**Firma**

- `clean(options: CleanOptions): Promise<void>`

**Parámetros**

| Parámetro                | Tipo          | Valor predeterminado | Descripción               |
| --------------------- | ------------- | ------- | ------------------ |
| `options.drop`        | `boolean`     | `false` | ¿Eliminar todas las **colecciones**? |
| `options.skip`        | `string[]`    | -       | Configuración de nombres de **colección** a omitir     |
| `options.transaction` | `Transaction` | -       | Objeto de transacción           |

**Ejemplo**

Elimina todas las **colecciones** excepto la **colección** `users`.

```ts
await db.clean({
  drop: true,
  skip: ['users'],
});
```

## Exportaciones a nivel de paquete

### `defineCollection()`

Crea el contenido de configuración para una **colección**.

**Firma**

- `defineCollection(name: string, config: CollectionOptions): CollectionOptions`

**Parámetros**

| Parámetro              | Tipo                | Valor predeterminado | Descripción                                |
| ------------------- | ------------------- | ------ | ----------------------------------- |
| `collectionOptions` | `CollectionOptions` | -      | Igual que todos los parámetros de `db.collection()` |

**Ejemplo**

Para un archivo de configuración de **colección** que será importado por `db.import()`:

```ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'users',
  fields: [
    {
      type: 'string',
      name: 'name',
    },
  ],
});
```

### `extendCollection()`

Extiende el contenido de configuración de una estructura de **colección** ya en memoria, principalmente para el contenido de archivos importados por el método `import()`. Este método es un método de nivel superior exportado por el paquete `@nocobase/database` y no se llama a través de una instancia de `db`. También se puede usar el alias `extend`.

**Firma**

- `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ExtendedCollectionOptions`

**Parámetros**

| Parámetro              | Tipo                | Valor predeterminado | Descripción                                                           |
| ------------------- | ------------------- | ------ | -------------------------------------------------------------- |
| `collectionOptions` | `CollectionOptions` | -      | Igual que todos los parámetros de `db.collection()`                            |
| `mergeOptions?`     | `MergeOptions`      | -      | Parámetros para el paquete npm [deepmerge](https://npmjs.com/package/deepmerge) |

**Ejemplo**

Definición original de la **colección** books (books.ts):

```ts
export default {
  name: 'books',
  fields: [{ name: 'title', type: 'string' }],
};
```

Definición extendida de la **colección** books (books.extend.ts):

```ts
import { extend } from '@nocobase/database';

// Extender de nuevo
export default extend({
  name: 'books',
  fields: [{ name: 'price', type: 'number' }],
});
```

Si los dos archivos anteriores se importan al llamar a `import()`, después de ser extendidos nuevamente con `extend()`, la **colección** books tendrá los campos `title` y `price`.

Este método es muy útil para extender estructuras de **colección** ya definidas por **plugins** existentes.

## Eventos incorporados

La base de datos activa los siguientes eventos correspondientes en las distintas etapas de su ciclo de vida. Al suscribirse a ellos con el método `on()`, puede realizar un procesamiento específico para satisfacer ciertas necesidades comerciales.

### `'beforeSync'` / `'afterSync'`

Se activa antes y después de que una nueva configuración de estructura de **colección** (campos, índices, etc.) se sincronice con la base de datos. Generalmente se activa cuando se ejecuta `collection.sync()` (llamada interna) y se utiliza para manejar la lógica de extensiones de campos especiales.

**Firma**

```ts
on(eventName: `${string}.beforeSync` | 'beforeSync' | `${string}.afterSync` | 'afterSync', listener: SyncListener): this
```

**Tipo**

```ts
import type { SyncOptions, HookReturn } from 'sequelize/types';

type SyncListener = (options?: SyncOptions) => HookReturn;
```

**Ejemplo**

```ts
const users = db.collection({
  name: 'users',
  fields: [{ type: 'string', name: 'username' }],
});

db.on('beforeSync', async (options) => {
  // hacer algo
});

db.on('users.afterSync', async (options) => {
  // hacer algo
});

await users.sync();
```

### `'beforeValidate'` / `'afterValidate'`

Antes de crear o actualizar datos, existe un proceso de validación basado en las reglas definidas en la **colección**. Los eventos correspondientes se activan antes y después de la validación. Esto se activa cuando se llama a `repository.create()` o `repository.update()`.

**Firma**

```ts
on(eventName: `${string}.beforeValidate` | 'beforeValidate' | `${string}.afterValidate` | 'afterValidate', listener: ValidateListener): this
```

**Tipo**

```ts
import type { ValidationOptions } from 'sequelize/types/lib/instance-validator';
import type { HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

type ValidateListener = (
  model: Model,
  options?: ValidationOptions,
) => HookReturn;
```

**Ejemplo**

```ts
db.collection({
  name: 'tests',
  fields: [
    {
      type: 'string',
      name: 'email',
      validate: {
        isEmail: true,
      },
    },
  ],
});

// todos los modelos
db.on('beforeValidate', async (model, options) => {
  // hacer algo
});
// modelo tests
db.on('tests.beforeValidate', async (model, options) => {
  // hacer algo
});

// todos los modelos
db.on('afterValidate', async (model, options) => {
  // hacer algo
});
// modelo tests
db.on('tests.afterValidate', async (model, options) => {
  // hacer algo
});

const repository = db.getRepository('tests');
await repository.create({
  values: {
    email: 'abc', // verifica el formato del correo electrónico
  },
});
// o
await repository.update({
  filterByTk: 1,
  values: {
    email: 'abc', // verifica el formato del correo electrónico
  },
});
```

### `'beforeCreate'` / `'afterCreate'`

Los eventos correspondientes se activan antes y después de crear un registro. Esto se activa cuando se llama a `repository.create()`.

**Firma**

```ts
on(eventName: `${string}.beforeCreate` | 'beforeCreate' | `${string}.afterCreate` | 'afterCreate', listener: CreateListener): this
```

**Tipo**

```ts
import type { CreateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type CreateListener = (
  model: Model,
  options?: CreateOptions,
) => HookReturn;
```

**Ejemplo**

```ts
db.on('beforeCreate', async (model, options) => {
  // hacer algo
});

db.on('books.afterCreate', async (model, options) => {
  const { transaction } = options;
  const result = await model.constructor.findByPk(model.id, {
    transaction,
  });
  console.log(result);
});
```

### `'beforeUpdate'` / `'afterUpdate'`

Los eventos correspondientes se activan antes y después de actualizar un registro. Esto se activa cuando se llama a `repository.update()`.

**Firma**

```ts
on(eventName: `${string}.beforeUpdate` | 'beforeUpdate' | `${string}.afterUpdate` | 'afterUpdate', listener: UpdateListener): this
```

**Tipo**

```ts
import type { UpdateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type UpdateListener = (
  model: Model,
  options?: UpdateOptions,
) => HookReturn;
```

**Ejemplo**

```ts
db.on('beforeUpdate', async (model, options) => {
  // hacer algo
});

db.on('books.afterUpdate', async (model, options) => {
  // hacer algo
});
```

### `'beforeSave'` / `'afterSave'`

Los eventos correspondientes se activan antes y después de crear o actualizar un registro. Esto se activa cuando se llama a `repository.create()` o `repository.update()`.

**Firma**

```ts
on(eventName: `${string}.beforeSave` | 'beforeSave' | `${string}.afterSave` | 'afterSave', listener: SaveListener): this
```

**Tipo**

```ts
import type { SaveOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type SaveListener = (model: Model, options?: SaveOptions) => HookReturn;
```

**Ejemplo**

```ts
db.on('beforeSave', async (model, options) => {
  // hacer algo
});

db.on('books.afterSave', async (model, options) => {
  // hacer algo
});
```

### `'beforeDestroy'` / `'afterDestroy'`

Los eventos correspondientes se activan antes y después de eliminar un registro. Esto se activa cuando se llama a `repository.destroy()`.

**Firma**

```ts
on(eventName: `${string}.beforeDestroy` | 'beforeDestroy' | `${string}.afterDestroy` | 'afterDestroy', listener: DestroyListener): this
```

**Tipo**

```ts
import type { DestroyOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type DestroyListener = (
  model: Model,
  options?: DestroyOptions,
) => HookReturn;
```

**Ejemplo**

```ts
db.on('beforeDestroy', async (model, options) => {
  // hacer algo
});

db.on('books.afterDestroy', async (model, options) => {
  // hacer algo
});
```

### `'afterCreateWithAssociations'`

Este evento se activa después de crear un registro con datos de asociación jerárquica. Se activa cuando se llama a `repository.create()`.

**Firma**

```ts
on(eventName: `${string}.afterCreateWithAssociations` | 'afterCreateWithAssociations', listener: CreateWithAssociationsListener): this
```

**Tipo**

```ts
import type { CreateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type CreateWithAssociationsListener = (
  model: Model,
  options?: CreateOptions,
) => HookReturn;
```

**Ejemplo**

```ts
db.on('afterCreateWithAssociations', async (model, options) => {
  // hacer algo
});

db.on('books.afterCreateWithAssociations', async (model, options) => {
  // hacer algo
});
```

### `'afterUpdateWithAssociations'`

Este evento se activa después de actualizar un registro con datos de asociación jerárquica. Se activa cuando se llama a `repository.update()`.

**Firma**

```ts
on(eventName: `${string}.afterUpdateWithAssociations` | 'afterUpdateWithAssociations', listener: CreateWithAssociationsListener): this
```

**Tipo**

```ts
import type { UpdateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type UpdateWithAssociationsListener = (
  model: Model,
  options?: UpdateOptions,
) => HookReturn;
```

**Ejemplo**

```ts
db.on('afterUpdateWithAssociations', async (model, options) => {
  // hacer algo
});

db.on('books.afterUpdateWithAssociations', async (model, options) => {
  // hacer algo
});
```

### `'afterSaveWithAssociations'`

Este evento se activa después de crear o actualizar un registro con datos de asociación jerárquica. Se activa cuando se llama a `repository.create()` o `repository.update()`.

**Firma**

```ts
on(eventName: `${string}.afterSaveWithAssociations` | 'afterSaveWithAssociations', listener: SaveWithAssociationsListener): this
```

**Tipo**

```ts
import type { SaveOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type SaveWithAssociationsListener = (
  model: Model,
  options?: SaveOptions,
) => HookReturn;
```

**Ejemplo**

```ts
db.on('afterSaveWithAssociations', async (model, options) => {
  // hacer algo
});

db.on('books.afterSaveWithAssociations', async (model, options) => {
  // hacer algo
});
```

### `'beforeDefineCollection'`

Se activa antes de definir una **colección**, por ejemplo, al llamar a `db.collection()`.

Nota: Este es un evento síncrono.

**Firma**

```ts
on(eventName: 'beforeDefineCollection', listener: BeforeDefineCollectionListener): this
```

**Tipo**

```ts
import type { CollectionOptions } from '@nocobase/database';

export type BeforeDefineCollectionListener = (
  options: CollectionOptions,
) => void;
```

**Ejemplo**

```ts
db.on('beforeDefineCollection', (options) => {
  // hacer algo
});
```

### `'afterDefineCollection'`

Se activa después de definir una **colección**, por ejemplo, al llamar a `db.collection()`.

Nota: Este es un evento síncrono.

**Firma**

```ts
on(eventName: 'afterDefineCollection', listener: AfterDefineCollectionListener): this
```

**Tipo**

```ts
import type { Collection } from '@nocobase/database';

export type AfterDefineCollectionListener = (options: Collection) => void;
```

**Ejemplo**

```ts
db.on('afterDefineCollection', (collection) => {
  // hacer algo
});
```

### `'beforeRemoveCollection'` / `'afterRemoveCollection'`

Se activa antes y después de que una **colección** se elimine de la memoria, por ejemplo, al llamar a `db.removeCollection()`.

Nota: Este es un evento síncrono.

**Firma**

```ts
on(eventName: 'beforeRemoveCollection' | 'afterRemoveCollection', listener: RemoveCollectionListener): this
```

**Tipo**

```ts
import type { Collection } from '@nocobase/database';

export type RemoveCollectionListener = (options: Collection) => void;
```

**Ejemplo**

```ts
db.on('beforeRemoveCollection', (collection) => {
  // hacer algo
});

db.on('afterRemoveCollection', (collection) => {
  // hacer algo
});
```