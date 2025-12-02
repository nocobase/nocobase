:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Registrar FlowModel

## Comenzar con un FlowModel personalizado

```tsx pure
class HelloModel extends FlowModel {
  render() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by HelloModel.</p>
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

## Registrar un FlowModel

```ts
export class PluginHelloClient extends Plugin {
  async load() {
    this.engine.registerModels({ HelloModel });
  }
}
```