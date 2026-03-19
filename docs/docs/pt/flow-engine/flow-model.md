:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Começando com FlowModel

## FlowModel Personalizado

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

## Classes Base de FlowModel Disponíveis

| Nome da Classe Base     | Descrição                                 |
| :---------------------- | :---------------------------------------- |
| `BlockModel`            | Classe base para todos os blocos          |
| `CollectionBlockModel`  | Bloco de coleção, herda de BlockModel     |
| `ActionModel`           | Classe base para todas as ações           |

## Registrando FlowModel

```ts
export class PluginHelloClient extends Plugin {
  async load() {
    this.engine.registerModelLoaders({
      HelloModel: {
        // Importação dinâmica: o módulo do modelo só é carregado quando este modelo é realmente necessário pela primeira vez
        loader: () => import('./HelloModel'),
      },
    });
  }
}
```

## Renderizando FlowModel

```tsx pure
<FlowModelRenderer model={model} />
```