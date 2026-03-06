:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/runjs/resource/multi-record-resource).
:::

# MultiRecordResource

Un recurso (Resource) orientado a colecciones: las solicitudes devuelven un arreglo y soportan paginación, filtrado, ordenamiento y operaciones CRUD. Es adecuado para escenarios de "múltiples registros" como tablas y listas. A diferencia de [APIResource](./api-resource.md), MultiRecordResource especifica el nombre del recurso a través de `setResourceName()`, construye automáticamente URLs como `users:list` y `users:create`, e incluye capacidades integradas para paginación, filtrado y selección de filas.

**Herencia**: FlowResource → APIResource → BaseRecordResource → MultiRecordResource.

**Formas de creación**: `ctx.makeResource('MultiRecordResource')` o `ctx.initResource('MultiRecordResource')`. Antes de usarlo, debe llamar a `setResourceName('nombreDeLaColección')` (por ejemplo, `'users'`); en RunJS, `ctx.api` es inyectado por el entorno de ejecución.

---

## Casos de uso

| Escenario | Descripción |
|------|------|
| **Bloques de tabla** | Los bloques de tabla y lista utilizan MultiRecordResource por defecto, soportando paginación, filtrado y ordenamiento. |
| **Listas en JSBlock** | Cargue datos de colecciones como usuarios o pedidos en un JSBlock y realice un renderizado personalizado. |
| **Operaciones masivas** | Use `getSelectedRows()` para obtener las filas seleccionadas y `destroySelectedRows()` para la eliminación masiva. |
| **Recursos de asociación** | Cargue colecciones asociadas usando formatos como `users.tags`, lo cual requiere `setSourceId(idDelRegistroPadre)`. |

---

## Formato de datos

- `getData()` devuelve un **arreglo de registros**, que corresponde al campo `data` de la respuesta de la API de lista.
- `getMeta()` devuelve metadatos de paginación y otros: `page`, `pageSize`, `count`, `totalPage`, etc.

---

## Nombre del recurso y fuente de datos

| Método | Descripción |
|------|------|
| `setResourceName(name)` / `getResourceName()` | El nombre del recurso, por ejemplo, `'users'`, `'users.tags'` (recurso de asociación). |
| `setSourceId(id)` / `getSourceId()` | El ID del registro padre para recursos de asociación (por ejemplo, para `users.tags`, pase la clave primaria del usuario). |
| `setDataSourceKey(key)` / `getDataSourceKey()` | Identificador de la fuente de datos (utilizado en escenarios de múltiples fuentes de datos). |

---

## Parámetros de solicitud (Filtrado / Campos / Ordenamiento)

| Método | Descripción |
|------|------|
| `setFilterByTk(tk)` / `getFilterByTk()` | Filtrar por clave primaria (para `get` de un solo registro, etc.). |
| `setFilter(filter)` / `getFilter()` / `resetFilter()` | Condiciones de filtrado, soportando operadores como `$eq`, `$ne`, `$in`, etc. |
| `addFilterGroup(key, filter)` / `removeFilterGroup(key)` | Grupos de filtros (para combinar múltiples condiciones). |
| `setFields(fields)` / `getFields()` | Campos solicitados (lista blanca). |
| `setSort(sort)` / `getSort()` | Ordenamiento, por ejemplo, `['-createdAt']` para orden descendente por fecha de creación. |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | Carga de asociaciones (por ejemplo, `['user', 'tags']`). |

---

## Paginación

| Método | Descripción |
|------|------|
| `setPage(page)` / `getPage()` | Página actual (comenzando desde 1). |
| `setPageSize(size)` / `getPageSize()` | Número de elementos por página, por defecto es 20. |
| `getTotalPage()` | Número total de páginas. |
| `getCount()` | Número total de registros (proveniente de los metadatos del servidor). |
| `next()` / `previous()` / `goto(page)` | Cambiar de página y activar `refresh`. |

---

## Filas seleccionadas (escenarios de tabla)

| Método | Descripción |
|------|------|
| `setSelectedRows(rows)` / `getSelectedRows()` | Datos de las filas actualmente seleccionadas, utilizados para eliminación masiva y otras operaciones. |

---

## CRUD y operaciones de lista

| Método | Descripción |
|------|------|
| `refresh()` | Solicita la lista con los parámetros actuales, actualiza `getData()` y los metadatos de paginación, y activa el evento `'refresh'`. |
| `get(filterByTk)` | Solicita un solo registro y lo devuelve (no escribe en `getData`). |
| `create(data, options?)` | Crea un registro. La opción `{ refresh: false }` evita la actualización automática. Activa `'saved'`. |
| `update(filterByTk, data, options?)` | Actualiza un registro mediante su clave primaria. |
| `destroy(target)` | Elimina registros; `target` puede ser una clave primaria, un objeto de fila o un arreglo de claves primarias/objetos de fila (eliminación masiva). |
| `destroySelectedRows()` | Elimina las filas actualmente seleccionadas (lanza un error si no hay ninguna seleccionada). |
| `setItem(index, item)` | Reemplaza localmente una fila específica de datos (no inicia una solicitud). |
| `runAction(actionName, options)` | Llama a cualquier acción del recurso (por ejemplo, acciones personalizadas). |

---

## Configuración y eventos

| Método | Descripción |
|------|------|
| `setRefreshAction(name)` | La acción llamada durante la actualización, por defecto es `'list'`. |
| `setCreateActionOptions(options)` / `setUpdateActionOptions(options)` | Configuración de la solicitud para crear/actualizar. |
| `on('refresh', fn)` / `on('saved', fn)` | Se activa tras completar la actualización o después de guardar. |

---

## Ejemplos

### Lista básica

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();
const rows = ctx.resource.getData();
const total = ctx.resource.getCount();
```

### Filtrado y ordenamiento

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilter({ status: 'active' });
ctx.resource.setSort(['-createdAt']);
ctx.resource.setFields(['id', 'nickname', 'email']);
await ctx.resource.refresh();
```

### Carga de asociaciones

```js
ctx.resource.setResourceName('orders');
ctx.resource.setAppends(['user', 'items']);
await ctx.resource.refresh();
const orders = ctx.resource.getData();
```

### Creación y paginación

```js
await ctx.resource.create({ name: 'Juan Pérez', email: 'juan.perez@example.com' });

await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### Eliminación masiva de filas seleccionadas

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (rows.length === 0) {
  ctx.message.warning('Por favor, seleccione datos primero');
  return;
}
await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('Eliminado'));
```

### Escuchar el evento refresh

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

### Recurso de asociación (subtabla)

```js
const res = ctx.makeResource('MultiRecordResource');
res.setResourceName('users.roles');
res.setSourceId(ctx.record?.id);
await res.refresh();
const roles = res.getData();
```

---

## Notas importantes

- **setResourceName es obligatorio**: Debe llamar a `setResourceName('nombreDeLaColección')` antes de su uso, de lo contrario, no se podrá construir la URL de la solicitud.
- **Recursos de asociación**: Cuando el nombre del recurso tiene el formato `padre.hijo` (por ejemplo, `users.tags`), debe llamar primero a `setSourceId(clavePrimariaPadre)`.
- **Anti-rebote (Debouncing) de refresh**: Múltiples llamadas a `refresh()` dentro del mismo ciclo de eventos solo ejecutarán la última para evitar solicitudes redundantes.
- **getData devuelve un arreglo**: Los datos devueltos por la API de lista son un arreglo de registros, y `getData()` devuelve este arreglo directamente.

---

## Relacionado

- [ctx.resource](../context/resource.md) - La instancia de recurso en el contexto actual
- [ctx.initResource()](../context/init-resource.md) - Inicializar y vincular a ctx.resource
- [ctx.makeResource()](../context/make-resource.md) - Crear una nueva instancia de recurso sin vincular
- [APIResource](./api-resource.md) - Recurso de API general solicitado por URL
- [SingleRecordResource](./single-record-resource.md) - Orientado a un solo registro