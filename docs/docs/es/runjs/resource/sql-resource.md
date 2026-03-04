:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/runjs/resource/sql-resource).
:::

# SQLResource

Resource para ejecutar consultas basadas en **configuraciones SQL guardadas** o **SQL dinámico**, con datos provenientes de interfaces como `flowSql:run` / `flowSql:runById`. Es adecuado para informes, estadísticas, listas SQL personalizadas y otros escenarios. A diferencia de [MultiRecordResource](./multi-record-resource.md), SQLResource no depende de las colecciones; ejecuta consultas SQL directamente y admite paginación, vinculación de parámetros, variables de plantilla (`{{ctx.xxx}}`) y control del tipo de resultado.

**Relación de herencia**: FlowResource → APIResource → BaseRecordResource → SQLResource.

**Formas de creación**: `ctx.makeResource('SQLResource')` o `ctx.initResource('SQLResource')`. Para ejecutar basándose en una configuración guardada, utilice `setFilterByTk(uid)` (el UID de la plantilla SQL); para depuración, utilice `setDebug(true)` + `setSQL(sql)` para ejecutar SQL directamente. En RunJS, `ctx.api` es inyectado por el entorno de ejecución.

---

## Escenarios de uso

| Escenario | Descripción |
|------|------|
| **Informes / Estadísticas** | Agregaciones complejas, consultas entre tablas y métricas estadísticas personalizadas. |
| **Listas personalizadas JSBlock** | Implementación de filtrado, ordenamiento o asociaciones especiales mediante SQL con renderizado personalizado. |
| **Bloques de gráficos** | Impulsa las fuentes de datos de los gráficos con plantillas SQL guardadas, admitiendo paginación. |
| **Elección entre SQLResource y ctx.sql** | Utilice SQLResource cuando se requiera paginación, eventos o datos reactivos; utilice `ctx.sql.run()` / `ctx.sql.runById()` para consultas simples y puntuales. |

---

## Formato de datos

- `getData()` devuelve diferentes formatos según `setSQLType()`:
  - `selectRows` (predeterminado): **Array**, resultados de varias filas.
  - `selectRow`: **Objeto único**.
  - `selectVar`: **Valor escalar** (por ejemplo, COUNT, SUM).
- `getMeta()` devuelve metadatos como la paginación: `page`, `pageSize`, `count`, `totalPage`, etc.

---

## Configuración de SQL y modos de ejecución

| Método | Descripción |
|------|------|
| `setFilterByTk(uid)` | Establece el UID de la plantilla SQL a ejecutar (corresponde a `runById`; debe guardarse primero en la interfaz de administración). |
| `setSQL(sql)` | Establece el SQL sin procesar (se usa para `runBySQL` solo cuando el modo de depuración `setDebug(true)` está habilitado). |
| `setSQLType(type)` | Tipo de resultado: `'selectVar'` / `'selectRow'` / `'selectRows'`. |
| `setDebug(enabled)` | Cuando se establece en `true`, `refresh` llama a `runBySQL()`; de lo contrario, llama a `runById()`. |
| `run()` | Llama a `runBySQL()` o `runById()` según el estado de depuración. |
| `runBySQL()` | Ejecuta utilizando el SQL definido en `setSQL` (requiere `setDebug(true)`). |
| `runById()` | Ejecuta la plantilla SQL guardada utilizando el UID actual. |

---

## Parámetros y contexto

| Método | Descripción |
|------|------|
| `setBind(bind)` | Vincula variables. Utilice un objeto para marcadores `:name` o un array para marcadores `?`. |
| `setLiquidContext(ctx)` | Contexto de la plantilla (Liquid), utilizado para analizar `{{ctx.xxx}}`. |
| `setFilter(filter)` | Condiciones de filtrado adicionales (pasadas en los datos de la solicitud). |
| `setDataSourceKey(key)` | Identificador de la fuente de datos (utilizado en entornos con múltiples fuentes de datos). |

---

## Paginación

| Método | Descripción |
|------|------|
| `setPage(page)` / `getPage()` | Página actual (por defecto es 1). |
| `setPageSize(size)` / `getPageSize()` | Elementos por página (por defecto es 20). |
| `next()` / `previous()` / `goto(page)` | Navega por las páginas y activa `refresh`. |

En SQL, puede utilizar `{{ctx.limit}}` y `{{ctx.offset}}` para hacer referencia a los parámetros de paginación. SQLResource inyecta automáticamente `limit` y `offset` en el contexto.

---

## Obtención de datos y eventos

| Método | Descripción |
|------|------|
| `refresh()` | Ejecuta el SQL (`runById` o `runBySQL`), escribe el resultado en `setData(data)`, actualiza los metadatos y activa el evento `'refresh'`. |
| `runAction(actionName, options)` | Llama a acciones subyacentes (por ejemplo, `getBind`, `run`, `runById`). |
| `on('refresh', fn)` / `on('loading', fn)` | Se activa cuando se completa la actualización o cuando comienza la carga. |

---

## Ejemplos

### Ejecución mediante plantilla guardada (runById)

```js
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('active-users-report'); // UID de la plantilla SQL guardada
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta(); // page, pageSize, count, etc.
```

### Modo de depuración: Ejecución de SQL directamente (runBySQL)

```js
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE status = :status LIMIT {{ctx.limit}}');
res.setBind({ status: 'active' });
await res.refresh();
const data = res.getData();
```

### Paginación y navegación

```js
ctx.resource.setFilterByTk('user-list-sql');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();

// Navegación
await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### Tipos de resultados

```js
// Múltiples filas (predeterminado)
ctx.resource.setSQLType('selectRows');
const rows = ctx.resource.getData(); // [{...}, {...}]

// Fila única
ctx.resource.setSQLType('selectRow');
const row = ctx.resource.getData(); // {...}

// Valor único (ej. COUNT)
ctx.resource.setSQLType('selectVar');
const total = ctx.resource.getData(); // 42
```

### Uso de variables de plantilla

```js
ctx.defineProperty('minId', { get: () => 10 });
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE id > {{ctx.minId}} LIMIT {{ctx.limit}}');
await res.refresh();
```

### Escuchar el evento refresh

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

---

## Notas

- **runById requiere guardar la plantilla primero**: El UID utilizado en `setFilterByTk(uid)` debe ser un ID de plantilla SQL ya guardado en la interfaz de administración. Puede guardarlo a través de `ctx.sql.save({ uid, sql })`.
- **El modo de depuración requiere permisos**: `setDebug(true)` utiliza `flowSql:run`, lo que requiere que el rol actual tenga permisos de configuración de SQL. `runById` solo requiere que el usuario haya iniciado sesión.
- **Antirrebote (Debouncing) de Refresh**: Múltiples llamadas a `refresh()` dentro del mismo ciclo de eventos solo ejecutarán la última para evitar solicitudes redundantes.
- **Vinculación de parámetros para prevención de inyecciones**: Utilice `setBind()` con marcadores `:name` o `?` en lugar de la concatenación de cadenas para evitar la inyección de SQL.

---

## Relacionado

- [ctx.sql](../context/sql.md) - Ejecución y gestión de SQL; `ctx.sql.runById` es adecuado para consultas simples y puntuales.
- [ctx.resource](../context/resource.md) - La instancia del recurso en el contexto actual.
- [ctx.initResource()](../context/init-resource.md) - Inicializa y vincula a `ctx.resource`.
- [ctx.makeResource()](../context/make-resource.md) - Crea una nueva instancia de recurso sin vincularla.
- [APIResource](./api-resource.md) - Recurso de API general.
- [MultiRecordResource](./multi-record-resource.md) - Diseñado para colecciones y listas.