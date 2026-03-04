:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/runjs/context/get-model).
:::

# ctx.getModel()

Obtiene una instancia de modelo (como `BlockModel`, `PageModel`, `ActionModel`, etc.) del motor actual o de la pila de vistas basándose en el `uid` del modelo. Se utiliza en RunJS para acceder a otros modelos a través de bloques, páginas o ventanas emergentes.

Si solo necesita el modelo o bloque donde se encuentra el contexto de ejecución actual, priorice el uso de `ctx.model` o `ctx.blockModel` en lugar de `ctx.getModel`.

## Escenarios de uso

| Escenario | Descripción |
|------|------|
| **JSBlock / JSAction** | Obtener modelos de otros bloques basados en un `uid` conocido para leer o escribir en su `resource`, `form`, `setProps`, etc. |
| **RunJS en ventanas emergentes** | Cuando necesite acceder a un modelo en la página que abrió la ventana emergente, pase `searchInPreviousEngines: true`. |
| **Acciones personalizadas** | Localizar formularios o submodelos en el panel de configuración por `uid` a través de las pilas de vistas para leer su configuración o estado. |

## Definición de tipos

```ts
getModel<T extends FlowModel = FlowModel>(
  uid: string,
  searchInPreviousEngines?: boolean
): T | undefined
```

## Parámetros

| Parámetro | Tipo | Descripción |
|------|------|------|
| `uid` | `string` | El identificador único de la instancia del modelo objetivo, especificado durante la configuración o creación (por ejemplo, `ctx.model.uid`). |
| `searchInPreviousEngines` | `boolean` | Opcional, por defecto es `false`. Cuando es `true`, busca desde el motor actual hacia arriba hasta la raíz en la "pila de vistas", permitiendo el acceso a modelos en motores de nivel superior (por ejemplo, la página que abrió una ventana emergente). |

## Valor de retorno

- Devuelve la instancia de la subclase `FlowModel` correspondiente (por ejemplo, `BlockModel`, `FormBlockModel`, `ActionModel`) si se encuentra.
- Devuelve `undefined` si no se encuentra.

## Alcance de búsqueda

- **Por defecto (`searchInPreviousEngines: false`)**: Busca solo dentro del **motor actual** por `uid`. En ventanas emergentes o vistas de varios niveles, cada vista tiene un motor independiente; por defecto, solo busca modelos dentro de la vista actual.
- **`searchInPreviousEngines: true`**: Busca hacia arriba a lo largo de la cadena `previousEngine` comenzando desde el motor actual, devolviendo la primera coincidencia. Esto es útil para acceder a un modelo en la página que abrió la ventana emergente actual.

## Ejemplos

### Obtener otro bloque y refrescar

```ts
const block = ctx.getModel('list-block-uid');
if (block?.resource) {
  await block.resource.refresh();
}
```

### Acceder a un modelo en la página desde una ventana emergente

```ts
// Acceder a un bloque en la página que abrió la ventana emergente actual
const pageBlock = ctx.getModel('page-block-uid', true);
if (pageBlock) {
  pageBlock.rerender?.();
}
```

### Lectura/escritura entre modelos y activar rerender

```ts
const target = ctx.getModel('other-block-uid');
if (target) {
  target.setProps({ loading: true });
  target.rerender?.();
}
```

### Verificación de seguridad

```ts
const model = ctx.getModel(someUid);
if (!model) {
  ctx.message.warning('El modelo objetivo no existe');
  return;
}
```

## Relacionado

- [ctx.model](./model.md): El modelo donde se encuentra el contexto de ejecución actual.
- [ctx.blockModel](./block-model.md): El modelo del bloque padre donde se encuentra el JS actual; generalmente accesible sin necesidad de `getModel`.