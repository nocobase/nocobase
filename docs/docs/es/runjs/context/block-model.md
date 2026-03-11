:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/runjs/context/block-model).
:::

# ctx.blockModel

El modelo del bloque padre (instancia de `BlockModel`) donde se encuentra el campo JS o bloque JS actual. En escenarios como `JSField`, `JSItem` y `JSColumn`, `ctx.blockModel` apunta al bloque de formulario o bloque de tabla que contiene la lógica JS actual. En un `JSBlock` independiente, puede ser `null` o el mismo que `ctx.model`.

## Escenarios de uso

| Escenario | Descripción |
|------|------|
| **JSField** | Acceder a `form`, `colección` y `resource` del bloque de formulario padre dentro de un campo de formulario para implementar vinculación o validación. |
| **JSItem** | Acceder a la información del recurso y de la colección del bloque de tabla o formulario padre dentro de un elemento de subtabla. |
| **JSColumn** | Acceder al `resource` (por ejemplo, `getSelectedRows`) y a la `colección` del bloque de tabla padre dentro de una columna de tabla. |
| **Acciones de formulario / Flujo de trabajo** | Acceder a `form` para validación previa al envío, `resource` para actualizar, etc. |

> Nota: `ctx.blockModel` solo está disponible en contextos de RunJS donde existe un bloque padre. En bloques `JSBlock` independientes (sin un formulario o tabla padre), puede ser `null`. Se recomienda realizar una comprobación de nulidad antes de su uso.

## Definición de tipos

```ts
blockModel: BlockModel | FormBlockModel | TableBlockModel | CollectionBlockModel | DataBlockModel | null;
```

El tipo específico depende del tipo de bloque padre: los bloques de formulario suelen ser `FormBlockModel` o `EditFormModel`, mientras que los bloques de tabla suelen ser `TableBlockModel`.

## Propiedades comunes

| Propiedad | Tipo | Descripción |
|------|------|------|
| `uid` | `string` | Identificador único del modelo de bloque. |
| `collection` | `Collection` | La colección vinculada al bloque actual. |
| `resource` | `Resource` | La instancia de recurso utilizada por el bloque (`SingleRecordResource` / `MultiRecordResource`, etc.). |
| `form` | `FormInstance` | Bloque de formulario: Instancia de Ant Design Form, compatible con `getFieldsValue`, `validateFields`, `setFieldsValue`, etc. |
| `emitter` | `EventEmitter` | Emisor de eventos, utilizado para escuchar `formValuesChange`, `onFieldReset`, etc. |

## Relación con ctx.model y ctx.form

| Necesidad | Uso recomendado |
|------|----------|
| **Bloque padre del JS actual** | `ctx.blockModel` |
| **Leer/escribir campos de formulario** | `ctx.form` (equivalente a `ctx.blockModel?.form`, más conveniente en bloques de formulario) |
| **Modelo del contexto de ejecución actual** | `ctx.model` (Modelo de campo en `JSField`, modelo de bloque en `JSBlock`) |

En un `JSField`, `ctx.model` es el modelo de campo y `ctx.blockModel` es el bloque de formulario o tabla que contiene ese campo; `ctx.form` suele ser `ctx.blockModel.form`.

## Ejemplos

### Tabla: Obtener filas seleccionadas y procesar

```ts
const rows = ctx.blockModel?.resource?.getSelectedRows?.() || [];
if (rows.length === 0) {
  ctx.message.warning('Por favor, seleccione datos primero');
  return;
}
```

### Escenario de formulario: Validar y actualizar

```ts
if (ctx.blockModel?.form) {
  await ctx.blockModel.form.validateFields();
  await ctx.blockModel.resource?.refresh?.();
}
```

### Escuchar cambios en el formulario

```ts
ctx.blockModel?.emitter?.on?.('formValuesChange', (payload) => {
  // Implementar vinculación o redibujado basado en los últimos valores del formulario
});
```

### Activar el redibujado (re-render) del bloque

```ts
ctx.blockModel?.rerender?.();
```

## Notas

- En un **JSBlock independiente** (sin un bloque de formulario o tabla padre), `ctx.blockModel` puede ser `null`. Se recomienda utilizar el encadenamiento opcional (optional chaining) al acceder a sus propiedades: `ctx.blockModel?.resource?.refresh?.()`.
- En **JSField / JSItem / JSColumn**, `ctx.blockModel` se refiere al bloque de formulario o tabla que contiene el campo actual. En un **JSBlock**, puede ser él mismo o un bloque de nivel superior, dependiendo de la jerarquía real.
- `resource` solo existe en bloques de datos; `form` solo existe en bloques de formulario. Los bloques de tabla normalmente no tienen un `form`.

## Relacionado

- [ctx.model](./model.md): El modelo del contexto de ejecución actual.
- [ctx.form](./form.md): Instancia de formulario, comúnmente utilizada en bloques de formulario.
- [ctx.resource](./resource.md): Instancia de recurso (equivalente a `ctx.blockModel?.resource`, úselo directamente si está disponible).
- [ctx.getModel()](./get-model.md): Obtener otros modelos de bloque por UID.