:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Rejestrowanie FlowModel

## Zacznijmy od niestandardowego FlowModel

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

## Dostępne klasy bazowe FlowModel

| Nazwa klasy bazowej         | Opis                                      |
| ----------------------- | ----------------------------------------- |
| `BlockModel`            | Klasa bazowa dla wszystkich bloków        |
| `CollectionBlockModel`  | Blok kolekcji, dziedziczy z BlockModel    |
| `ActionModel`           | Klasa bazowa dla wszystkich akcji         |

## Rejestrowanie FlowModel

```ts
export class PluginHelloClient extends Plugin {
  async load() {
    this.engine.registerModelLoaders({
      HelloModel: {
        // Import dynamiczny: moduł modelu zostanie załadowany dopiero wtedy, gdy ten model będzie po raz pierwszy rzeczywiście potrzebny
        loader: () => import('./HelloModel'),
      },
    });
  }
}
```