:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Iniziare con FlowModel

## FlowModel Personalizzato

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

## Classi Base FlowModel Disponibili

| Nome Classe Base        | Descrizione                               |
| ----------------------- | ----------------------------------------- |
| `BlockModel`            | Classe base per tutti i blocchi           |
| `CollectionBlockModel`  | Blocco collezione, eredita da BlockModel |
| `ActionModel`           | Classe base per tutte le azioni           |

## Registrare un FlowModel

```ts
export class PluginHelloClient extends Plugin {
  async load() {
    this.engine.registerModels({ HelloModel });
  }
}
```

## Renderizzare un FlowModel

```tsx pure
<FlowModelRenderer model={model} />
```