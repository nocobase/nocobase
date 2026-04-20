:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/runjs/context/model).
:::

# ctx.model

La instancia de `FlowModel` donde se encuentra el contexto de ejecución actual de RunJS. Es el punto de entrada predeterminado para escenarios como JSBlock, JSField y JSAction. El tipo específico varía según el contexto: puede ser una subclase como `BlockModel`, `ActionModel` o `JSEditableFieldModel`.

## Escenarios de aplicación

| Escenario | Descripción |
|------|------|
| **JSBlock** | `ctx.model` es el modelo de bloque actual. Puede acceder a `resource`, `collection`, `setProps`, etc. |
| **JSField / JSItem / JSColumn** | `ctx.model` es el modelo de campo. Puede acceder a `setProps`, `dispatchEvent`, etc. |
| **Eventos de acción / ActionModel** | `ctx.model` es el modelo de acción. Puede leer/escribir parámetros de pasos, emitir eventos, etc. |

> Sugerencia: Si necesita acceder al **bloque padre que contiene el JS actual** (como un bloque de formulario o tabla), utilice `ctx.blockModel`; si necesita acceder a **otros modelos**, utilice `ctx.getModel(uid)`.

## Definición de tipo

```ts
model: FlowModel;
```

`FlowModel` es la clase base; en tiempo de ejecución es una instancia de varias subclases (como `BlockModel`, `FormBlockModel`, `TableBlockModel`, `JSEditableFieldModel`, `ActionModel`, etc.). Las propiedades y métodos disponibles varían según el tipo específico.

## Propiedades comunes

| Propiedad | Tipo | Descripción |
|------|------|------|
| `uid` | `string` | Identificador único del modelo. Puede usarse para `ctx.getModel(uid)` o para la vinculación de UID en ventanas emergentes. |
| `collection` | `Collection` | La colección vinculada al modelo actual (existe cuando el bloque o campo está vinculado a datos). |
| `resource` | `Resource` | Instancia de recurso asociada, utilizada para actualizar, obtener filas seleccionadas, etc. |
| `props` | `object` | Configuración de UI/comportamiento del modelo. Se puede actualizar con `setProps`. |
| `subModels` | `Record<string, FlowModel>` | Colección de submodelos (por ejemplo, campos dentro de un formulario o columnas en una tabla). |
| `parent` | `FlowModel` | Modelo padre (si existe). |

## Métodos comunes

| Método | Descripción |
|------|------|
| `setProps(partialProps: any): void` | Actualiza la configuración del modelo y activa el redibujado (ej. `ctx.model.setProps({ loading: true })`). |
| `dispatchEvent(eventName: string, payload?: any, options?: any): Promise<any[]>` | Emite un evento al modelo, activando los flujos de trabajo configurados en dicho modelo que escuchan ese nombre de evento. El `payload` opcional se pasa al manejador del flujo de trabajo; `options.debounce` permite activar el antirrebotado. |
| `getStepParams?.(flowKey, stepKey)` | Lee los parámetros de los pasos del flujo de configuración (utilizado en paneles de configuración, acciones personalizadas, etc.). |
| `setStepParams?.(flowKey, stepKey, params)` | Escribe los parámetros de los pasos del flujo de configuración. |

## Relación con ctx.blockModel y ctx.getModel

| Necesidad | Uso recomendado |
|------|----------|
| **Modelo del contexto de ejecución actual** | `ctx.model` |
| **Bloque padre del JS actual** | `ctx.blockModel`. Se usa frecuentemente para acceder a `resource`, `form` o `collection`. |
| **Obtener cualquier modelo por UID** | `ctx.getModel(uid)` o `ctx.getModel(uid, true)` (búsqueda a través de pilas de vistas). |

En un JSField, `ctx.model` es el modelo de campo, mientras que `ctx.blockModel` es el bloque de formulario o tabla que contiene dicho campo.

## Ejemplos

### Actualizar el estado de un bloque o acción

```ts
ctx.model.setProps({ loading: true });
await doSomething();
ctx.model.setProps({ loading: false });
```

### Emitir eventos de modelo

```ts
// Emite un evento para activar un flujo de trabajo configurado en este modelo que escuche este nombre de evento
await ctx.model.dispatchEvent('remove');

// Cuando se proporciona un payload, este se pasa al ctx.inputArgs del manejador del flujo de trabajo
await ctx.model.dispatchEvent('customEvent', { id: 123 });
```

### Uso de UID para vinculación de ventanas emergentes o acceso entre modelos

```ts
const myUid = ctx.model.uid;
// En la configuración de una ventana emergente, puede pasar openerUid: myUid para la asociación
const other = ctx.getModel('other-block-uid');
if (other) other.rerender?.();
```

## Relacionado

- [ctx.blockModel](./block-model.md): El modelo de bloque padre donde se encuentra el JS actual.
- [ctx.getModel()](./get-model.md): Obtener otros modelos por UID.