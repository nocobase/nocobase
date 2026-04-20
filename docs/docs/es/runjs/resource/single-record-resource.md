:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/runjs/resource/single-record-resource).
:::

# SingleRecordResource

Resource orientado a un **único registro**: los datos consisten en un objeto individual, permitiendo la obtención por clave primaria, creación/actualización (save) y eliminación. Es adecuado para escenarios de "registro único" como bloques de detalles y formularios. A diferencia de [MultiRecordResource](./multi-record-resource.md), el método `getData()` de `SingleRecordResource` devuelve un solo objeto. Usted especifica la clave primaria mediante `setFilterByTk(id)`, y `save()` llamará automáticamente a `create` o `update` basándose en el estado de `isNewRecord`.

**Herencia**: FlowResource → APIResource → BaseRecordResource → SingleRecordResource.

**Formas de creación**: `ctx.makeResource('SingleRecordResource')` o `ctx.initResource('SingleRecordResource')`. Debe llamar a `setResourceName('nombre_de_la_colección')` antes de su uso. Al realizar operaciones por clave primaria, utilice `setFilterByTk(id)`. En RunJS, `ctx.api` es inyectado por el entorno de ejecución.

---

## Escenarios de uso

| Escenario | Descripción |
|------|------|
| **Bloque de detalles** | El bloque de detalles utiliza `SingleRecordResource` por defecto para cargar un único registro mediante su clave primaria. |
| **Bloque de formulario** | Los formularios de creación/edición utilizan `SingleRecordResource`, donde `save()` distingue automáticamente entre `create` y `update`. |
| **Detalles en JSBlock** | Carga un único usuario, pedido, etc., en un JSBlock y personaliza su visualización. |
| **Recursos de asociación** | Carga registros únicos asociados utilizando el formato `users.profile`, lo cual requiere el uso de `setSourceId(ID_del_registro_padre)`. |

---

## Formato de datos

- `getData()` devuelve un **objeto de registro único**, que corresponde al campo `data` de la respuesta de la API `get`.
- `getMeta()` devuelve metainformación (si está disponible).

---

## Nombre del recurso y clave primaria

| Método | Descripción |
|------|------|
| `setResourceName(name)` / `getResourceName()` | Nombre del recurso, por ejemplo, `'users'`, `'users.profile'` (recurso de asociación). |
| `setSourceId(id)` / `getSourceId()` | ID del registro padre para recursos de asociación (por ejemplo, `users.profile` requiere la clave primaria del registro de `users`). |
| `setDataSourceKey(key)` / `getDataSourceKey()` | Identificador de la fuente de datos (utilizado en entornos con múltiples fuentes de datos). |
| `setFilterByTk(tk)` / `getFilterByTk()` | Clave primaria del registro actual; una vez establecida, `isNewRecord` pasa a ser `false`. |

---

## Estado

| Propiedad/Método | Descripción |
|----------|------|
| `isNewRecord` | Indica si se encuentra en estado de "Nuevo" (es `true` si no se ha establecido `filterByTk` o si acaba de ser creado). |

---

## Parámetros de solicitud (Filtros / Campos)

| Método | Descripción |
|------|------|
| `setFilter(filter)` / `getFilter()` | Filtro (disponible cuando no está en estado "Nuevo"). |
| `setFields(fields)` / `getFields()` | Campos solicitados. |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | Carga de asociaciones (appends). |

---

## CRUD

| Método | Descripción |
|------|------|
| `refresh()` | Realiza una solicitud `get` basada en el `filterByTk` actual y actualiza `getData()`; no realiza ninguna acción en estado "Nuevo". |
| `save(data, options?)` | Llama a `create` cuando está en estado "Nuevo", de lo contrario llama a `update`; la opción `{ refresh: false }` evita la actualización automática. |
| `destroy(options?)` | Elimina el registro basado en el `filterByTk` actual y limpia los datos locales. |
| `runAction(actionName, options)` | Llama a cualquier acción (action) del recurso. |

---

## Configuración y eventos

| Método | Descripción |
|------|------|
| `setSaveActionOptions(options)` | Configuración de la solicitud para la acción `save`. |
| `on('refresh', fn)` / `on('saved', fn)` | Se activa tras completar la actualización o después de guardar. |

---

## Ejemplos

### Obtención y actualización básica

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const user = ctx.resource.getData();

// Actualizar
await ctx.resource.save({ name: 'Juan Pérez' });
```

### Crear un nuevo registro

```js
const newRes = ctx.makeResource('SingleRecordResource');
newRes.setResourceName('users');
await newRes.save({ name: 'María García', email: 'mariagarcia@example.com' });
```

### Eliminar un registro

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.destroy();
// Después de destroy, getData() devuelve null
```

### Carga de asociaciones y campos

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
ctx.resource.setFields(['id', 'nickname', 'email']);
ctx.resource.setAppends(['profile', 'roles']);
await ctx.resource.refresh();
const user = ctx.resource.getData();
```

### Recursos de asociación (ej. users.profile)

```js
const res = ctx.makeResource('SingleRecordResource');
res.setResourceName('users.profile');
res.setSourceId(ctx.record?.id); // Clave primaria del registro padre
res.setFilterByTk(profileId);    // filterByTk puede omitirse si profile es una relación hasOne
await res.refresh();
const profile = res.getData();
```

### Guardar sin actualización automática

```js
await ctx.resource.save({ status: 'active' }, { refresh: false });
// getData() conserva el valor antiguo ya que no se activa refresh después de guardar
```

### Escuchar eventos refresh / saved

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<div>Usuario: {data?.nickname}</div>);
});
ctx.resource?.on?.('saved', (savedData) => {
  ctx.message.success('Guardado exitosamente');
});
await ctx.resource?.refresh?.();
```

---

## Notas

- **setResourceName es obligatorio**: Debe llamar a `setResourceName('nombre_de_la_colección')` antes de su uso, de lo contrario no se podrá construir la URL de la solicitud.
- **filterByTk e isNewRecord**: Si no se llama a `setFilterByTk`, `isNewRecord` será `true` y `refresh()` no iniciará ninguna solicitud; `save()` ejecutará una acción `create`.
- **Recursos de asociación**: Cuando el nombre del recurso tiene el formato `padre.hijo` (ej. `users.profile`), debe llamar primero a `setSourceId(clave_primaria_padre)`.
- **getData devuelve un objeto**: El campo `data` devuelto por las API de registro único es un objeto de registro; `getData()` devuelve este objeto directamente. Se convierte en `null` después de ejecutar `destroy()`.

---

## Relacionado

- [ctx.resource](../context/resource.md) - La instancia del recurso en el contexto actual
- [ctx.initResource()](../context/init-resource.md) - Inicializa y vincula a `ctx.resource`
- [ctx.makeResource()](../context/make-resource.md) - Crea una nueva instancia de recurso sin vincularla
- [APIResource](./api-resource.md) - Recurso de API general solicitado por URL
- [MultiRecordResource](./multi-record-resource.md) - Orientado a colecciones/listas, soporta CRUD y paginación