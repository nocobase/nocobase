:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Empezando con FlowModel

## FlowModel personalizado

```tsx pure
class HelloModel extends FlowModel {
  render() {
    return (
      <div>
        <h1>¡Hola, NocoBase!</h1>
        <p>Este es un bloque simple renderizado por HelloModel.</p>
      </div>
    );
  }
}
```

## Clases base de FlowModel disponibles

| Nombre de la clase base         | Descripción                               |
| ----------------------- | ----------------------------------------- |
| `BlockModel`            | Clase base para todos los bloques                 |
| `CollectionBlockModel`  | Bloque de colección, hereda de BlockModel |
| `ActionModel`           | Clase base para todas las acciones                |

## Registrando FlowModel

```ts
export class PluginHelloClient extends Plugin {
  async load() {
    this.engine.registerModels({ HelloModel });
  }
}
```

## Renderizando FlowModel

```tsx pure
<FlowModelRenderer model={model} />
```