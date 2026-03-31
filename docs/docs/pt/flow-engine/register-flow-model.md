:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Registrar FlowModel

## Comece com um FlowModel personalizado

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

## Classes base de FlowModel disponíveis

| Nome da Classe Base         | Descrição                               |
| ----------------------- | ----------------------------------------- |
| `BlockModel`            | Classe base para todos os blocos                 |
| `CollectionBlockModel`  | Bloco de coleção, herda de BlockModel |
| `ActionModel`           | Classe base para todas as ações                |

## Registrar FlowModel

```ts
export class PluginHelloClient extends Plugin {
  async load() {
    this.engine.registerModels({ HelloModel });
  }
}
```