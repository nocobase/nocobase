---
title: "Resource API"
description: "Referencia de la API Resource de NocoBase FlowEngine: firmas completas de métodos, formato de parámetros y sintaxis de filter de MultiRecordResource y SingleRecordResource."
keywords: "Resource,MultiRecordResource,SingleRecordResource,FlowResource,CRUD,filter,NocoBase"
---

# Resource API

NocoBase FlowEngine proporciona dos clases Resource para gestionar las operaciones de datos en el frontend: `MultiRecordResource` para listas/tablas (múltiples registros) y `SingleRecordResource` para formularios/detalles (un solo registro). Ambas encapsulan llamadas a la API REST y proporcionan una gestión reactiva de datos.

Cadena de herencia: `FlowResource` → `APIResource` → `BaseRecordResource` → `MultiRecordResource` / `SingleRecordResource`

## MultiRecordResource

Se utiliza para escenarios de múltiples registros como listas, tablas, kanban, etc. Se importa desde `@nocobase/flow-engine`.

### Operaciones de datos

| Método | Parámetros | Descripción |
|------|------|------|
| `getData()` | - | Devuelve `TDataItem[]`, valor inicial `[]` |
| `hasData()` | - | Indica si el array de datos no está vacío |
| `create(data, options?)` | `data: object`, `options?: { refresh?: boolean }` | Crea un registro; por defecto refresh automático tras la creación |
| `get(filterByTk)` | `filterByTk: string \| number` | Obtiene un único registro por clave primaria |
| `update(filterByTk, data, options?)` | `filterByTk: string \| number`, `data: object` | Actualiza un registro; refresh automático al finalizar |
| `destroy(filterByTk, options?)` | `filterByTk: string \| number \| Array` | Elimina registros; admite eliminación masiva |
| `destroySelectedRows()` | - | Elimina todas las filas seleccionadas |
| `refresh()` | - | Refresca los datos (invoca la Action `list`); las múltiples llamadas dentro del mismo bucle de eventos se fusionan |

### Paginación

| Método | Descripción |
|------|------|
| `getPage()` | Obtiene el número de página actual |
| `setPage(page)` | Establece el número de página |
| `getPageSize()` | Obtiene el número de registros por página (por defecto 20) |
| `setPageSize(pageSize)` | Establece el número de registros por página |
| `getCount()` | Obtiene el total de registros |
| `getTotalPage()` | Obtiene el número total de páginas |
| `next()` | Página siguiente y refresh |
| `previous()` | Página anterior y refresh |
| `goto(page)` | Salta a la página indicada y refresh |

### Filas seleccionadas

| Método | Descripción |
|------|------|
| `setSelectedRows(rows)` | Establece las filas seleccionadas |
| `getSelectedRows()` | Obtiene las filas seleccionadas |

### Ejemplo: uso en CollectionBlockModel

Al heredar de `CollectionBlockModel`, se debe crear el resource mediante `createResource()` y luego leer los datos en `renderComponent()`:

```tsx
import React from 'react';
import { BlockSceneEnum, CollectionBlockModel } from '@nocobase/client-v2';
import { MultiRecordResource } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class ManyRecordBlockModel extends CollectionBlockModel {
  static scene = BlockSceneEnum.many;

  // Declarar el uso de MultiRecordResource para gestionar los datos
  createResource() {
    return this.context.makeResource(MultiRecordResource);
  }

  get resource() {
    return this.context.resource as MultiRecordResource;
  }

  renderComponent() {
    const data = this.resource.getData();   // TDataItem[]
    const count = this.resource.getCount(); // total de registros

    return (
      <div>
        <h3>Total {count} registros (página {this.resource.getPage()})</h3>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    );
  }
}

ManyRecordBlockModel.define({
  label: tExpr('Many records block'),
});
```

Ejemplo completo en [FlowEngine → Extensión de Block](../../plugin-development/client/flow-engine/block.md).

### Ejemplo: invocar CRUD desde una Action

En el handler de `registerFlow` de un `ActionModel`, se obtiene el resource del Block actual mediante `ctx.blockModel?.resource` y se llama a los métodos CRUD:

```tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { MultiRecordResource } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class NewTodoActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps = {
    type: 'primary',
    children: tExpr('New todo'),
  };
}

NewTodoActionModel.define({
  label: tExpr('New todo'),
});

NewTodoActionModel.registerFlow({
  key: 'newTodoFlow',
  title: tExpr('New todo'),
  on: 'click',
  steps: {
    openForm: {
      async handler(ctx) {
        // Obtener el resource del Block actual
        const resource = ctx.blockModel?.resource as MultiRecordResource;
        if (!resource) return;

        ctx.viewer.dialog({
          title: ctx.t('New todo'),
          content: (view) => (
            <MyForm
              onSubmit={async (values) => {
                // Crear registro; el resource se refrescará automáticamente
                await resource.create(values);
                ctx.message.success(ctx.t('Created successfully'));
                view.close();
              }}
              onCancel={() => view.close()}
            />
          ),
        });
      },
    },
  },
});
```

Ejemplo completo en [Crear un Plugin de gestión de datos con interacción frontend-backend](../../plugin-development/client/examples/fullstack-plugin.md).

### Ejemplo: referencia rápida de operaciones CRUD

```ts
async handler(ctx) {
  const resource = ctx.blockModel?.resource as MultiRecordResource;

  // --- Crear ---
  await resource.create({ title: 'New item', completed: false });
  // Sin refresh automático
  await resource.create({ title: 'Draft' }, { refresh: false });

  // --- Leer ---
  const items = resource.getData();     // TDataItem[]
  const count = resource.getCount();    // total de registros
  const item = await resource.get(1);   // obtener uno por clave primaria

  // --- Actualizar ---
  await resource.update(1, { title: 'Updated' });

  // --- Eliminar ---
  await resource.destroy(1);            // eliminación individual
  await resource.destroy([1, 2, 3]);    // eliminación masiva

  // --- Paginación ---
  resource.setPage(2);
  resource.setPageSize(50);
  await resource.refresh();
  // O usando métodos de atajo
  await resource.goto(3);
  await resource.next();
  await resource.previous();

  // --- Refresh ---
  await resource.refresh();
}
```

## SingleRecordResource

Se utiliza para escenarios de un solo registro como formularios y páginas de detalles. Se importa desde `@nocobase/flow-engine`.

### Operaciones de datos

| Método | Parámetros | Descripción |
|------|------|------|
| `getData()` | - | Devuelve `TData` (un solo objeto), valor inicial `null` |
| `save(data, options?)` | `data: object`, `options?: { refresh?: boolean }` | Guardado inteligente: si `isNewRecord` es true llama a create, de lo contrario llama a update |
| `destroy(options?)` | - | Elimina el registro actual (utilizando el filterByTk previamente establecido) |
| `refresh()` | - | Refresca los datos (invoca la Action `get`); se omite cuando `isNewRecord` es true |

### Propiedades clave

| Propiedad | Descripción |
|------|------|
| `isNewRecord` | Indica si es un nuevo registro. `setFilterByTk()` lo establece automáticamente en `false` |

### Ejemplo: escenario de formulario de detalles

```tsx
import React from 'react';
import { BlockSceneEnum, CollectionBlockModel } from '@nocobase/client-v2';
import { SingleRecordResource } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class DetailBlockModel extends CollectionBlockModel {
  static scene = BlockSceneEnum.one;

  createResource() {
    return this.context.makeResource(SingleRecordResource);
  }

  get resource() {
    return this.context.resource as SingleRecordResource;
  }

  renderComponent() {
    const data = this.resource.getData(); // un objeto o null
    if (!data) return <div>Cargando...</div>;

    return (
      <div>
        <h3>{data.title}</h3>
        <p>{data.content}</p>
      </div>
    );
  }
}

DetailBlockModel.define({
  label: tExpr('Detail block'),
});
```

### Ejemplo: crear y editar registros

```ts
async handler(ctx) {
  const resource = ctx.model.context.resource as SingleRecordResource;

  // --- Crear nuevo registro ---
  resource.isNewRecord = true;
  await resource.save({ name: 'John', age: 30 });
  // save invoca internamente la Action create; refresh automático al finalizar

  // --- Editar registro existente ---
  resource.setFilterByTk(1);  // Establece automáticamente isNewRecord = false
  await resource.refresh();   // Cargar primero los datos actuales
  const data = resource.getData();
  await resource.save({ ...data, name: 'Jane' });
  // save invoca internamente la Action update

  // --- Eliminar el registro actual ---
  await resource.destroy();   // Utiliza el filterByTk previamente establecido
}
```

## Métodos comunes

Los siguientes métodos están disponibles tanto en `MultiRecordResource` como en `SingleRecordResource`:

### Filtrado

| Método | Descripción |
|------|------|
| `setFilter(filter)` | Establece directamente el objeto filter |
| `addFilterGroup(key, filter)` | Añade un grupo de filtros con nombre (recomendado, combinable y eliminable) |
| `removeFilterGroup(key)` | Elimina un grupo de filtros con nombre |
| `getFilter()` | Obtiene el filter agregado; los múltiples grupos se combinan automáticamente con `$and` |

### Control de campos

| Método | Descripción |
|------|------|
| `setFields(fields)` | Establece los campos devueltos |
| `setAppends(appends)` | Establece los appends de campos relacionados |
| `addAppends(appends)` | Añade appends (con deduplicación) |
| `setSort(sort)` | Establece el orden, por ejemplo `['-createdAt', 'name']` |
| `setFilterByTk(value)` | Establece el filtrado por clave primaria |

### Configuración del Resource

| Método | Descripción |
|------|------|
| `setResourceName(name)` | Establece el nombre del recurso, por ejemplo `'users'` o un recurso relacionado `'users.tags'` |
| `setSourceId(id)` | Establece el ID del registro padre del recurso relacionado |
| `setDataSourceKey(key)` | Establece la fuente de datos (añade el header de petición `X-Data-Source`) |

### Metadatos y estado

| Método | Descripción |
|------|------|
| `getMeta(key?)` | Obtiene los metadatos; sin pasar key devuelve el objeto meta completo |
| `loading` | Indica si está cargando (getter) |
| `getError()` | Obtiene la información de error |
| `clearError()` | Limpia el error |

### Eventos

| Evento | Momento de activación |
|------|----------|
| `'refresh'` | Tras obtener correctamente los datos con `refresh()` |
| `'saved'` | Tras una operación exitosa de `create` / `update` / `save` |

```ts
resource.on('saved', (data) => {
  console.log('Registro guardado:', data);
});
```

## Sintaxis de Filter

NocoBase utiliza una sintaxis de filtrado al estilo JSON, con operadores que comienzan con `$`:

```ts
// Igual a
{ status: { $eq: 'active' } }

// No igual a
{ status: { $ne: 'deleted' } }

// Mayor que
{ age: { $gt: 18 } }

// Contiene (coincidencia parcial)
{ name: { $includes: 'test' } }

// Combinación de condiciones
{
  $and: [
    { status: { $eq: 'active' } },
    { age: { $gt: 18 } },
  ]
}

// Condición OR
{
  $or: [
    { status: { $eq: 'active' } },
    { role: { $eq: 'admin' } },
  ]
}
```

En el Resource se recomienda gestionar las condiciones de filtrado con `addFilterGroup`:

```ts
// Añadir varios grupos de filtros
resource.addFilterGroup('status', { status: { $eq: 'active' } });
resource.addFilterGroup('age', { age: { $gt: 18 } });
// getFilter() agrega automáticamente como: { $and: [...] }

// Eliminar un grupo de filtros
resource.removeFilterGroup('status');

// Refrescar para aplicar el filtro
await resource.refresh();
```

## Comparación entre MultiRecordResource y SingleRecordResource

| Característica | MultiRecordResource | SingleRecordResource |
|------|-------|-------|
| Retorno de getData() | `TDataItem[]` (array) | `TData` (un solo objeto) |
| Action de refresh por defecto | `list` | `get` |
| Paginación | Sí | No |
| Filas seleccionadas | Sí | No |
| Crear | `create(data)` | `save(data)` + `isNewRecord=true` |
| Actualizar | `update(filterByTk, data)` | `save(data)` + `setFilterByTk(id)` |
| Eliminar | `destroy(filterByTk)` | `destroy()` |
| Escenario típico | Listas, tablas, kanban | Formularios, páginas de detalles |

## Enlaces relacionados

- [Crear un Plugin de gestión de datos con interacción frontend-backend](../../plugin-development/client/examples/fullstack-plugin.md) — Ejemplo completo: uso real de `resource.create()` en una Action personalizada
- [FlowEngine → Extensión de Block](../../plugin-development/client/flow-engine/block.md) — Uso de `createResource()` y `resource.getData()` en CollectionBlockModel
- [ResourceManager Gestión de recursos (servidor)](../../plugin-development/server/resource-manager.md) — Definición de Resources REST API en el servidor; el Resource del cliente invoca estas interfaces
- [FlowContext API](./flow-context.md) — Descripción de métodos como `ctx.makeResource()`, `ctx.initResource()`, etc.
