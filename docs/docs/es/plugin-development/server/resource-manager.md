:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# ResourceManager: Gestión de Recursos

La funcionalidad de gestión de recursos de NocoBase puede convertir automáticamente las `colecciones` (tablas de datos) y `asociaciones` existentes en recursos. Incluye varios tipos de operaciones para ayudar a los desarrolladores a construir rápidamente operaciones de recursos para APIs REST. A diferencia de las APIs REST tradicionales, las operaciones de recursos de NocoBase no dependen de los métodos de solicitud HTTP, sino que determinan la operación específica a ejecutar mediante la definición explícita de `:action`.

## Generación automática de recursos

NocoBase convierte automáticamente las `colecciones` y `asociaciones` definidas en la base de datos en recursos. Por ejemplo, si define dos `colecciones`, `posts` y `tags`:

```ts
db.defineCollection({
  name: 'posts',
  fields: [
    { type: 'belongsToMany', name: 'tags' },
  ],
});

db.defineCollection({
  name: 'tags',
  fields: [],
});
```

Esto generará automáticamente los siguientes recursos:

*   Recurso `posts`
*   Recurso `tags`
*   Recurso de asociación `posts.tags`

Ejemplos de solicitud:

| Método | Ruta                     | Operación                 |
| -------- | ---------------------- | ------------------------- |
| `GET`  | `/api/posts:list`      | Consultar lista           |
| `GET`  | `/api/posts:get/1`     | Consultar un solo registro |
| `POST` | `/api/posts:create`    | Crear                     |
| `POST` | `/api/posts:update/1`  | Actualizar                |
| `POST` | `/api/posts:destroy/1` | Eliminar                  |

| Método | Ruta                   | Operación                 |
| -------- | ---------------------- | ------------------------- |
| `GET`  | `/api/tags:list`       | Consultar lista           |
| `GET`  | `/api/tags:get/1`      | Consultar un solo registro |
| `POST` | `/api/tags:create`     | Crear                     |
| `POST` | `/api/tags:update/1`   | Actualizar                |
| `POST` | `/api/tags:destroy/1`  | Eliminar                  |

| Método | Ruta                             | Operación                                   |
| -------- | ------------------------------ | ------------------------------------------- |
| `GET`  | `/api/posts/1/tags:list`       | Consultar todas las `tags` asociadas a un `post` |
| `GET`  | `/api/posts/1/tags:get/1`      | Consultar una sola `tag` de un `post`       |
| `POST` | `/api/posts/1/tags:create`     | Crear una sola `tag` para un `post`         |
| `POST` | `/api/posts/1/tags:update/1`   | Actualizar una sola `tag` de un `post`      |
| `POST` | `/api/posts/1/tags:destroy/1`  | Eliminar una sola `tag` de un `post`        |
| `POST` | `/api/posts/1/tags:add`        | Añadir `tags` asociadas a un `post`         |
| `POST` | `/api/posts/1/tags:remove`     | Eliminar `tags` asociadas de un `post`      |
| `POST` | `/api/posts/1/tags:set`        | Establecer todas las `tags` asociadas para un `post` |
| `POST` | `/api/posts/1/tags:toggle`     | Alternar la asociación de `tags` para un `post` |

:::tip Sugerencia

Las operaciones de recursos de NocoBase no dependen directamente de los métodos de solicitud, sino que determinan las operaciones mediante definiciones explícitas de `:action`.

:::

## Operaciones de Recursos

NocoBase ofrece una amplia variedad de tipos de operaciones integradas para satisfacer diversas necesidades de negocio.

### Operaciones CRUD Básicas

| Nombre de la operación | Descripción                         | Tipos de recursos aplicables | Método de solicitud | Ruta de ejemplo                |
| -------------------- | ----------------------------------- | ---------------------------- | ------------------- | ------------------------------ |
| `list`               | Consultar datos de la lista         | Todos                        | GET/POST            | `/api/posts:list`              |
| `get`                | Consultar un solo registro de datos | Todos                        | GET/POST            | `/api/posts:get/1`             |
| `create`             | Crear un nuevo registro             | Todos                        | POST                | `/api/posts:create`            |
| `update`             | Actualizar un registro              | Todos                        | POST                | `/api/posts:update/1`          |
| `destroy`            | Eliminar un registro                | Todos                        | POST                | `/api/posts:destroy/1`         |
| `firstOrCreate`      | Buscar el primer registro, crear si no existe | Todos                        | POST                | `/api/users:firstOrCreate`     |
| `updateOrCreate`     | Actualizar un registro, crear si no existe | Todos                        | POST                | `/api/users:updateOrCreate`    |

### Operaciones de Relación

| Nombre de la operación | Descripción               | Tipos de relación aplicables                      | Ruta de ejemplo                   |
| -------------------- | ------------------------- | ------------------------------------------------- | --------------------------------- |
| `add`                | Añadir asociación         | `hasMany`, `belongsToMany`                        | `/api/posts/1/tags:add`           |
| `remove`             | Eliminar asociación       | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo` | `/api/posts/1/comments:remove`    |
| `set`                | Restablecer asociación    | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo` | `/api/posts/1/comments:set`       |
| `toggle`             | Añadir o eliminar asociación | `belongsToMany`                                   | `/api/posts/1/tags:toggle`        |

### Parámetros de Operación

Los parámetros de operación comunes incluyen:

*   `filter`: Condiciones de consulta
*   `values`: Valores a establecer
*   `fields`: Campos a devolver
*   `appends`: Incluir datos asociados
*   `except`: Excluir campos
*   `sort`: Reglas de ordenación
*   `page`, `pageSize`: Parámetros de paginación
*   `paginate`: Si habilitar la paginación
*   `tree`: Si devolver una estructura de árbol
*   `whitelist`, `blacklist`: Lista blanca/negra de campos
*   `updateAssociationValues`: Si actualizar los valores de asociación

---

## Operaciones de Recursos Personalizadas

NocoBase permite registrar operaciones adicionales para recursos existentes. Puede usar `registerActionHandlers` para personalizar operaciones para todos los recursos o para recursos específicos.

### Registrar Operaciones Globales

```ts
resourceManager.registerActionHandlers({
  customAction: async (ctx) => {
    ctx.body = { resource: ctx.action.resourceName };
  },
});
```

### Registrar Operaciones Específicas de Recursos

```ts
resourceManager.registerActionHandlers({
  'posts:publish': async (ctx) => publishPost(ctx),
  'posts.comments:pin': async (ctx) => pinComment(ctx),
});
```

Ejemplos de solicitud:

```
POST /api/posts:customAction
POST /api/posts:publish
POST /api/posts/1/comments:pin
```

Regla de nomenclatura: `resourceName:actionName`. Use la sintaxis de puntos (`posts.comments`) cuando incluya asociaciones.

## Recursos Personalizados

Si necesita proporcionar recursos que no están relacionados con las `colecciones` (tablas de datos), puede definirlos utilizando el método `resourceManager.define`:

```ts
resourceManager.define({
  name: 'app',
  actions: {
    getInfo: async (ctx) => {
      ctx.body = { version: 'v1' };
    },
  },
});
```

Los métodos de solicitud son consistentes con los recursos generados automáticamente:

*   `GET /api/app:getInfo`
*   `POST /api/app:getInfo` (admite GET/POST por defecto)

## Middleware Personalizado

Utilice el método `resourceManager.use()` para registrar middleware global. Por ejemplo:

Middleware de registro global

```ts
resourceManager.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(`${ctx.method} ${ctx.path} - ${duration}ms`);
});
```

## Propiedades Especiales del Contexto

Poder acceder al middleware o a la acción de la capa `resourceManager` significa que el recurso debe existir.

### ctx.action

-   `ctx.action.actionName`: Nombre de la operación
-   `ctx.action.resourceName`: Puede ser una `colección` o una asociación
-   `ctx.action.params`: Parámetros de la operación

### ctx.dataSource

El objeto de la `fuente de datos` actual.

### ctx.getCurrentRepository()

El objeto de repositorio actual.

## Cómo obtener objetos `resourceManager` para diferentes `fuentes de datos`

El `resourceManager` pertenece a una `fuente de datos`, y las operaciones se pueden registrar por separado para diferentes `fuentes de datos`.

### Fuente de Datos Principal

Para la `fuente de datos` principal, puede usar directamente `app.resourceManager` para operar:

```ts
app.resourceManager.registerActionHandlers();
```

### Otras Fuentes de Datos

Para otras `fuentes de datos`, puede obtener una instancia específica de `fuente de datos` a través de `dataSourceManager` y usar el `resourceManager` de esa instancia para operar:

```ts
const dataSource = dataSourceManager.get('external');
dataSource.resourceManager.registerActionHandlers();
```

### Iterar Todas las Fuentes de Datos

Si necesita realizar las mismas operaciones en todas las `fuentes de datos` añadidas, puede usar el método `dataSourceManager.afterAddDataSource` para iterar, asegurándose de que el `resourceManager` de cada `fuente de datos` pueda registrar las operaciones correspondientes:

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandlers();
});
```