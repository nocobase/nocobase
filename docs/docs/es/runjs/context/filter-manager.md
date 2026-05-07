:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/runjs/context/filter-manager).
:::

# ctx.filterManager

El gestor de conexiones de filtros se utiliza para administrar las asociaciones de filtrado entre los formularios de filtro (FilterForm) y los bloques de datos (tablas, listas, gráficos, etc.). Es proporcionado por `BlockGridModel` y solo está disponible dentro de su contexto (por ejemplo, bloques de formularios de filtro, bloques de datos).

## Escenarios de uso

| Escenario | Descripción |
|------|------|
| **Bloque de formulario de filtro** | Gestiona las configuraciones de conexión entre los elementos de filtro y los bloques de destino; actualiza los datos de destino cuando cambian los filtros. |
| **Bloque de datos (tabla/lista)** | Actúa como un objetivo de filtrado, vinculando las condiciones de filtro a través de `bindToTarget`. |
| **Reglas de vinculación / FilterModel personalizado** | Llama a `refreshTargetsByFilter` dentro de `doFilter` o `doReset` para activar la actualización de los destinos. |
| **Configuración de campos de conexión** | Utiliza `getConnectFieldsConfig` y `saveConnectFieldsConfig` para mantener el mapeo de campos entre los filtros y los destinos. |

> Nota: `ctx.filterManager` solo está disponible en contextos de RunJS que tengan un `BlockGridModel` (por ejemplo, dentro de una página que contenga un formulario de filtro); es `undefined` en bloques JSBlock normales o páginas independientes. Se recomienda utilizar el encadenamiento opcional (optional chaining) antes de acceder a él.

## Definiciones de tipos

```ts
filterManager: FilterManager;

type FilterConfig = {
  filterId: string;   // UID del modelo de filtro
  targetId: string;   // UID del modelo del bloque de datos de destino
  filterPaths?: string[];  // Rutas de campos del bloque de destino
  operator?: string;  // Operador de filtro
};

type ConnectFieldsConfig = {
  targets: { targetId: string; filterPaths: string[] }[];
};
```

## Métodos comunes

| Método | Descripción |
|------|------|
| `getFilterConfigs()` | Obtiene todas las configuraciones de conexión de filtros actuales. |
| `getConnectFieldsConfig(filterId)` | Obtiene la configuración de campos de conexión para un filtro específico. |
| `saveConnectFieldsConfig(filterId, config)` | Guarda la configuración de campos de conexión para un filtro. |
| `addFilterConfig(config)` | Agrega una configuración de filtro (filterId + targetId + filterPaths). |
| `removeFilterConfig({ filterId?, targetId?, persist? })` | Elimina configuraciones de filtro por filterId, targetId o ambos. |
| `bindToTarget(targetId)` | Vincula la configuración de filtro a un bloque de destino, activando su `resource` para aplicar el filtro. |
| `unbindFromTarget(targetId)` | Desvincula el filtro del bloque de destino. |
| `refreshTargetsByFilter(filterId | filterId[])` | Actualiza los datos de los bloques de destino asociados basándose en los filtros. |

## Conceptos principales

- **FilterModel**: Un modelo que proporciona condiciones de filtrado (por ejemplo, FilterFormItemModel), el cual debe implementar `getFilterValue()` para devolver el valor de filtro actual.
- **TargetModel**: El bloque de datos que está siendo filtrado; su `resource` debe admitir `addFilterGroup`, `removeFilterGroup` y `refresh`.

## Ejemplos

### Agregar configuración de filtro

```ts
await ctx.filterManager?.addFilterConfig({
  filterId: 'filter-form-item-uid',
  targetId: 'table-block-uid',
  filterPaths: ['status', 'createdAt'],
  operator: '$eq',
});
```

### Actualizar bloques de destino

```ts
// En doFilter / doReset de un formulario de filtro
ctx.filterManager?.refreshTargetsByFilter(ctx.model.uid);

// Actualizar destinos asociados con múltiples filtros
ctx.filterManager?.refreshTargetsByFilter(['filter-1', 'filter-2']);
```

### Configuración de campos de conexión

```ts
// Obtener configuración de conexión
const config = ctx.filterManager?.getConnectFieldsConfig(ctx.model.uid);

// Guardar configuración de conexión
await ctx.filterManager?.saveConnectFieldsConfig(ctx.model.uid, {
  targets: [
    { targetId: 'table-uid', filterPaths: ['status'] },
    { targetId: 'chart-uid', filterPaths: ['category'] },
  ],
});
```

### Eliminar configuración

```ts
// Eliminar todas las configuraciones para un filtro específico
await ctx.filterManager?.removeFilterConfig({ filterId: 'filter-uid' });

// Eliminar todas las configuraciones de filtro para un destino específico
await ctx.filterManager?.removeFilterConfig({ targetId: 'table-uid' });
```

## Relacionado

- [ctx.resource](./resource.md): El recurso del bloque de destino debe admitir la interfaz de filtrado.
- [ctx.model](./model.md): Se utiliza para obtener el UID del modelo actual para filterId / targetId.