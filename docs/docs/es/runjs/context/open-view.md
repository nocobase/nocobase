# ctx.openView()

Abre de forma programática una vista especificada (cajón, diálogo, página incrustada, etc.). Proporcionado por `FlowModelContext`, se utiliza para abrir vistas configuradas de `ChildPage` o `PopupAction` en escenarios como `JSBlock`, celdas de tabla y flujos de trabajo.

## Escenarios de uso

| Escenario | Descripción |
|------|------|
| **JSBlock** | Abrir un diálogo de detalle o edición tras hacer clic en un botón, pasando el `filterByTk` de la fila actual. |
| **Celda de tabla** | Renderizar un botón dentro de una celda que abre un diálogo de detalle de fila al hacer clic. |
| **Flujo de trabajo / JSAction** | Abrir la siguiente vista o un diálogo después de una operación exitosa. |
| **Campo de asociación** | Abrir un diálogo de selección o edición a través de `ctx.runAction('openView', params)`. |

> Nota: `ctx.openView` está disponible en un entorno RunJS donde exista un contexto de `FlowModel`. Si el modelo correspondiente al `uid` no existe, se creará y persistirá automáticamente un `PopupActionModel`.

## Firma

```ts
openView(uid: string, options?: OpenViewOptions): Promise<void>
```

## Parámetros

### uid

El identificador único del modelo de vista. Si no existe, se creará y guardará automáticamente. Se recomienda usar un UID estable, como `${ctx.model.uid}-detail`, para que la configuración pueda reutilizarse al abrir el mismo diálogo varias veces.

### Campos comunes de options

| Campo | Tipo | Descripción |
|------|------|------|
| `mode` | `drawer` / `dialog` / `embed` | Método de apertura: cajón (drawer), diálogo (dialog) o incrustado (embed). Por defecto es `drawer`. |
| `size` | `small` / `medium` / `large` | Tamaño del diálogo o cajón. Por defecto es `medium`. |
| `title` | `string` | Título de la vista. |
| `params` | `Record<string, any>` | Parámetros arbitrarios pasados a la vista. |
| `filterByTk` | `any` | Valor de la clave primaria, utilizado para escenarios de detalle o edición de un solo registro. |
| `sourceId` | `string` | ID del registro de origen, utilizado en escenarios de asociación. |
| `dataSourceKey` | `string` | Fuente de datos. |
| `collectionName` | `string` | Nombre de la colección. |
| `associationName` | `string` | Nombre del campo de asociación. |
| `navigation` | `boolean` | Indica si se debe usar la navegación por rutas. Si se proporcionan `defineProperties` o `defineMethods`, se establece forzosamente en `false`. |
| `preventClose` | `boolean` | Indica si se debe evitar el cierre. |
| `defineProperties` | `Record<string, PropertyOptions>` | Inyecta dinámicamente propiedades en el modelo dentro de la vista. |
| `defineMethods` | `Record<string, Function>` | Inyecta dinámicamente métodos en el modelo dentro de la vista. |

## Ejemplos

### Uso básico: Abrir un cajón (drawer)

```ts
const popupUid = `${ctx.model.uid}-detail`;
await ctx.openView(popupUid, {
  mode: 'drawer',
  size: 'medium',
  title: ctx.t('Detalles'),
});
```

### Pasar el contexto de la fila actual

```ts
const primaryKey = ctx.collection?.primaryKey || 'id';
await ctx.openView(`${ctx.model.uid}-1`, {
  mode: 'dialog',
  title: ctx.t('Detalles de la fila'),
  params: {
    filterByTk: ctx.record?.[primaryKey],
    record: ctx.record,
  },
});
```

### Abrir a través de runAction

Cuando un modelo está configurado con una acción `openView` (como campos de asociación o campos clicables), usted puede llamar a:

```ts
await ctx.runAction('openView', {
  navigation: false,
  mode: 'dialog',
  collectionName: 'users',
  filterByTk: ctx.record?.id,
});
```

### Inyectar contexto personalizado

```ts
await ctx.openView(`${ctx.model.uid}-edit`, {
  mode: 'drawer',
  filterByTk: ctx.record?.id,
  defineProperties: {
    onSaved: {
      get: () => () => ctx.resource?.refresh?.(),
      cache: false,
    },
  },
});
```

## Relación con ctx.viewer y ctx.view

| Propósito | Uso recomendado |
|------|----------|
| **Abrir una vista de flujo configurada** | `ctx.openView(uid, options)` |
| **Abrir contenido personalizado (sin flujo)** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` |
| **Operar en la vista abierta actualmente** | `ctx.view.close()`, `ctx.view.inputArgs` |

`ctx.openView` abre una `FlowPage` (`ChildPageModel`), que renderiza internamente una página de flujo completa; `ctx.viewer` abre contenido arbitrario de React.

## Notas

- Se recomienda asociar el `uid` con `ctx.model.uid` (por ejemplo, `${ctx.model.uid}-xxx`) para evitar conflictos entre múltiples bloques.
- Cuando se pasan `defineProperties` o `defineMethods`, `navigation` se fuerza a `false` para evitar la pérdida de contexto tras una actualización.
- Dentro del diálogo, `ctx.view` se refiere a la instancia de la vista actual, y `ctx.view.inputArgs` se puede usar para leer los parámetros pasados durante la apertura.

## Relacionado

- [ctx.view](./view.md): La instancia de la vista abierta actualmente.
- [ctx.model](./model.md): El modelo actual, utilizado para construir un `popupUid` estable.