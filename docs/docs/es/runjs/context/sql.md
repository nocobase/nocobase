:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/runjs/context/sql).
:::

# ctx.sql

`ctx.sql` proporciona capacidades de ejecución y gestión de SQL, comúnmente utilizado en RunJS (como JSBlock y flujos de trabajo) para acceder directamente a la base de datos. Soporta la ejecución de SQL temporal, la ejecución de plantillas SQL guardadas por ID, vinculación de parámetros, variables de plantilla (`{{ctx.xxx}}`) y control del tipo de resultado.

## Escenarios de uso

| Escenario | Descripción |
|------|------|
| **JSBlock** | Informes estadísticos personalizados, listas con filtros complejos y consultas de agregación entre tablas. |
| **Bloque de gráfico** | Guardado de plantillas SQL para alimentar fuentes de datos de gráficos. |
| **Flujo de trabajo / Vinculación** | Ejecución de SQL preestablecido para obtener datos y participar en la lógica posterior. |
| **SQLResource** | Se utiliza junto con `ctx.initResource('SQLResource')` para escenarios como listas paginadas. |

> Nota: `ctx.sql` accede a la base de datos a través de la API `flowSql`. Asegúrese de que el usuario actual tenga permisos de ejecución para la fuente de datos correspondiente.

## Permisos

| Permiso | Método | Descripción |
|------|------|------|
| **Usuario autenticado** | `runById` | Ejecutar según un ID de plantilla SQL configurado. |
| **Permiso de configuración de SQL** | `run`, `save`, `destroy` | Ejecutar SQL temporal o guardar/actualizar/eliminar plantillas SQL. |

La lógica del frontend destinada a usuarios regulares debe usar `ctx.sql.runById(uid, options)`. Cuando se requiera SQL dinámico o gestión de plantillas, asegúrese de que el rol actual posea permisos de configuración de SQL.

## Definición de tipos

```ts
sql: FlowSQLRepository;

interface FlowSQLRepository {
  run<T = any>(
    sql: string,
    options?: {
      bind?: Record<string, any> | any[];
      type?: 'selectRows' | 'selectRow' | 'selectVar';
      dataSourceKey?: string;
      filter?: Record<string, any>;
    },
  ): Promise<T>;

  save(options: { uid: string; sql: string; dataSourceKey?: string }): Promise<void>;

  runById<T = any>(
    uid: string,
    options?: {
      bind?: Record<string, any> | any[];
      type?: 'selectRows' | 'selectRow' | 'selectVar';
      dataSourceKey?: string;
      filter?: Record<string, any>;
    },
  ): Promise<T>;

  destroy(uid: string): Promise<void>;
}
```

## Métodos comunes

| Método | Descripción | Requisito de permiso |
|------|------|----------|
| `ctx.sql.run(sql, options?)` | Ejecuta SQL temporal; soporta vinculación de parámetros y variables de plantilla. | Permiso de configuración de SQL |
| `ctx.sql.save({ uid, sql, dataSourceKey? })` | Guarda o actualiza una plantilla SQL por ID para su reutilización. | Permiso de configuración de SQL |
| `ctx.sql.runById(uid, options?)` | Ejecuta una plantilla SQL previamente guardada por su ID. | Cualquier usuario autenticado |
| `ctx.sql.destroy(uid)` | Elimina una plantilla SQL especificada por ID. | Permiso de configuración de SQL |

Nota:

- `run` se utiliza para depurar SQL y requiere permisos de configuración.
- `save` y `destroy` se utilizan para gestionar plantillas SQL y requieren permisos de configuración.
- `runById` está abierto a usuarios regulares; solo puede ejecutar plantillas guardadas y no puede depurar ni modificar el SQL.
- Cuando se modifica una plantilla SQL, se debe llamar a `save` para persistir los cambios.

## Parámetros

### options para run / runById

| Parámetro | Tipo | Descripción |
|------|------|------|
| `bind` | `Record<string, any>` \| `any[]` | Variables de vinculación. Use un objeto para marcadores de posición `:name` o un arreglo para marcadores `?`. |
| `type` | `'selectRows'` \| `'selectRow'` \| `'selectVar'` | Tipo de resultado: múltiples filas, una sola fila o un solo valor. Por defecto es `selectRows`. |
| `dataSourceKey` | `string` | Identificador de la fuente de datos. Por defecto utiliza la fuente de datos principal. |
| `filter` | `Record<string, any>` | Condiciones de filtrado adicionales (dependiendo del soporte de la interfaz). |

### options para save

| Parámetro | Tipo | Descripción |
|------|------|------|
| `uid` | `string` | Identificador único para la plantilla. Una vez guardada, puede ejecutarse mediante `runById(uid, ...)`. |
| `sql` | `string` | Contenido SQL. Soporta variables de plantilla `{{ctx.xxx}}` y marcadores de posición `:name` / `?`. |
| `dataSourceKey` | `string` | Opcional. Identificador de la fuente de datos. |

## Variables de plantilla SQL y vinculación de parámetros

### Variables de plantilla `{{ctx.xxx}}`

Puede usar `{{ctx.xxx}}` en SQL para referenciar variables de contexto. Estas se analizan en valores reales antes de la ejecución:

```js
// Referencia a ctx.user.id
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = {{ctx.user.id}}',
  { type: 'selectRow' }
);
```

Las fuentes de variables referenciables son las mismas que `ctx.getVar()` (por ejemplo, `ctx.user.*`, `ctx.record.*`, `ctx.defineProperty` personalizado, etc.).

### Vinculación de parámetros

- **Parámetros con nombre**: Use `:name` en SQL y pase un objeto `{ name: value }` en `bind`.
- **Parámetros posicionales**: Use `?` en SQL y pase un arreglo `[value1, value2]` en `bind`.

```js
// Parámetros con nombre
const users = await ctx.sql.run(
  'SELECT * FROM users WHERE status = :status AND age > :minAge',
  { bind: { status: 'active', minAge: 18 }, type: 'selectRows' }
);

// Parámetros posicionales
const count = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users WHERE city = ? AND status = ?',
  { bind: ['Madrid', 'active'], type: 'selectVar' }
);
```

## Ejemplos

### Ejecución de SQL temporal (Requiere permiso de configuración de SQL)

```js
// Múltiples filas (por defecto)
const rows = await ctx.sql.run('SELECT * FROM users LIMIT 10');

// Una sola fila
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = :id',
  { bind: { id: 1 }, type: 'selectRow' }
);

// Un solo valor (ej. COUNT, SUM)
const total = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users',
  { type: 'selectVar' }
);
```

### Uso de variables de plantilla

```js
ctx.defineProperty('minId', { get: () => 1 });

const rows = await ctx.sql.run(
  'SELECT * FROM users WHERE id > {{ctx.minId}}',
  { type: 'selectRows' }
);
```

### Guardado y reutilización de plantillas

```js
// Guardar (Requiere permiso de configuración de SQL)
await ctx.sql.save({
  uid: 'active-users-report',
  sql: 'SELECT * FROM users WHERE status = :status ORDER BY created_at DESC',
});

// Cualquier usuario autenticado puede ejecutar esto
const users = await ctx.sql.runById('active-users-report', {
  bind: { status: 'active' },
  type: 'selectRows',
});

// Eliminar plantilla (Requiere permiso de configuración de SQL)
await ctx.sql.destroy('active-users-report');
```

### Lista paginada (SQLResource)

```js
// Use SQLResource cuando se necesite paginación o filtrado
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('saved-sql-uid');  // ID de la plantilla SQL guardada
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta();  // Incluye page, pageSize, etc.
```

## Relación con ctx.resource y ctx.request

| Propósito | Uso recomendado |
|------|----------|
| **Ejecutar consulta SQL** | `ctx.sql.run()` o `ctx.sql.runById()` |
| **Lista paginada SQL (Bloque)** | `ctx.initResource('SQLResource')` + `ctx.resource.refresh()` |
| **Solicitud HTTP general** | `ctx.request()` |

`ctx.sql` envuelve la API `flowSql` y está especializada para escenarios SQL; `ctx.request` puede usarse para llamar a cualquier API.

## Notas

- Use la vinculación de parámetros (`:name` / `?`) en lugar de la concatenación de cadenas para evitar la inyección de SQL.
- `type: 'selectVar'` devuelve un valor escalar, típicamente usado para `COUNT`, `SUM`, etc.
- Las variables de plantilla `{{ctx.xxx}}` se resuelven antes de la ejecución; asegúrese de que las variables correspondientes estén definidas en el contexto.

## Relacionado

- [ctx.resource](./resource.md): Recursos de datos; SQLResource llama internamente a la API `flowSql`.
- [ctx.initResource()](./init-resource.md): Inicializa SQLResource para listas paginadas, etc.
- [ctx.request()](./request.md): Solicitudes HTTP generales.