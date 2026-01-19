:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Enregistrer un FlowModel

## Commencer avec un FlowModel personnalisé

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

## Classes de base FlowModel disponibles

| Nom de la classe de base        | Description                               |
| ----------------------- | ----------------------------------------- |
| `BlockModel`            | Classe de base pour tous les blocs        |
| `CollectionBlockModel`  | Bloc de collection, hérite de BlockModel |
| `ActionModel`           | Classe de base pour toutes les actions    |

## Enregistrer un FlowModel

```ts
export class PluginHelloClient extends Plugin {
  async load() {
    this.engine.registerModels({ HelloModel });
  }
}
```