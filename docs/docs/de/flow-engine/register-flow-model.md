:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# FlowModel registrieren

## Mit einem benutzerdefinierten FlowModel beginnen

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

## Verfügbare FlowModel-Basisklassen

| Basisklassenname        | Beschreibung                               |
| ----------------------- | ------------------------------------------ |
| `BlockModel`            | Basisklasse für alle Blöcke                |
| `CollectionBlockModel`  | Sammlungsblock, erbt von BlockModel        |
| `ActionModel`           | Basisklasse für alle Aktionen              |

## FlowModel registrieren

```ts
export class PluginHelloClient extends Plugin {
  async load() {
    this.engine.registerModels({ HelloModel });
  }
}
```