:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/runjs/context/resource).
:::

# ctx.resource

La instancia de **FlowResource** en el contexto actual, utilizada para acceder y operar con datos. En la mayoría de los bloques (formularios, tablas, detalles, etc.) y escenarios de ventanas emergentes, el entorno de ejecución vincula previamente `ctx.resource`. En escenarios como JSBlock, donde no hay un recurso por defecto, primero debe llamar a [ctx.initResource()](./init-resource.md) para inicializarlo antes de usarlo a través de `ctx.resource`.

## Escenarios de uso

Puede utilizar `ctx.resource` en cualquier escenario de RunJS que requiera acceso a datos estructurados (listas, registros únicos, APIs personalizadas, SQL). Los bloques de formulario, tabla, detalles y ventanas emergentes suelen estar vinculados previamente. Para JSBlock, JSField, JSItem, JSColumn, etc., si se requiere la carga de datos, puede llamar primero a `ctx.initResource(type)` y luego acceder a `ctx.resource`.

## Definición de tipo

```ts
resource: FlowResource | undefined;
```

- En contextos con vinculación previa, `ctx.resource` es la instancia del recurso correspondiente.
- En escenarios como JSBlock, donde no hay un recurso por defecto, es `undefined` hasta que se llama a `ctx.initResource(type)`.

## Métodos comunes

Los métodos expuestos por los diferentes tipos de recursos (MultiRecordResource, SingleRecordResource, APIResource, SQLResource) varían ligeramente. A continuación se presentan los métodos universales o de uso frecuente:

| Método | Descripción |
|------|------|
| `getData()` | Obtiene los datos actuales (lista o registro único) |
| `setData(value)` | Establece los datos locales |
| `refresh()` | Inicia una solicitud con los parámetros actuales para actualizar los datos |
| `setResourceName(name)` | Establece el nombre del recurso (por ejemplo, `'users'`, `'users.tags'`) |
| `setFilterByTk(tk)` | Establece el filtro por clave primaria (para `get` de registro único, etc.) |
| `runAction(actionName, options)` | Llama a cualquier acción del recurso (por ejemplo, `create`, `update`) |
| `on(event, callback)` / `off(event, callback)` | Suscribirse/cancelar suscripción a eventos (por ejemplo, `refresh`, `saved`) |

**Específicos de MultiRecordResource**: `getSelectedRows()`, `destroySelectedRows()`, `setPage()`, `next()`, `previous()`, etc.

## Ejemplos

### Datos de lista (requiere initResource primero)

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
```

### Escenario de tabla (vinculado previamente)

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
for (const row of rows) {
  console.log(row);
}

await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('Eliminado'));
```

### Registro único

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### Llamar a una acción personalizada

```js
await ctx.resource.runAction('create', { data: { name: 'Juan Pérez' } });
```

## Relación con ctx.initResource / ctx.makeResource

- **ctx.initResource(type)**: Si `ctx.resource` no existe, lo crea y lo vincula; si ya existe, devuelve la instancia existente. Esto garantiza que `ctx.resource` esté disponible.
- **ctx.makeResource(type)**: Crea una nueva instancia de recurso y la devuelve, pero **no** la escribe en `ctx.resource`. Es adecuado para escenarios que requieren múltiples recursos independientes o un uso temporal.
- **ctx.resource**: Accede al recurso ya vinculado al contexto actual. La mayoría de los bloques/ventanas emergentes están vinculados previamente; de lo contrario, es `undefined` y requiere `ctx.initResource`.

## Notas

- Se recomienda realizar una comprobación de valores nulos antes de su uso: `ctx.resource?.refresh()`, especialmente en escenarios como JSBlock donde la vinculación previa podría no existir.
- Después de la inicialización, debe llamar a `setResourceName(name)` para especificar la colección antes de cargar los datos mediante `refresh()`.
- Para consultar la API completa de cada tipo de recurso, consulte los enlaces a continuación.

## Relacionado

- [ctx.initResource()](./init-resource.md) - Inicializar y vincular un recurso al contexto actual
- [ctx.makeResource()](./make-resource.md) - Crear una nueva instancia de recurso sin vincularla a `ctx.resource`
- [MultiRecordResource](../resource/multi-record-resource.md) - Múltiples registros/Listas
- [SingleRecordResource](../resource/single-record-resource.md) - Registro único
- [APIResource](../resource/api-resource.md) - Recurso de API general
- [SQLResource](../resource/sql-resource.md) - Recurso de consulta SQL