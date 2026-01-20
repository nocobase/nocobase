:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Zaczynamy z FlowModel

## Tworzenie własnego FlowModel

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
| `BlockModel`            | Klasa bazowa dla wszystkich bloków.       |
| `CollectionBlockModel`  | Blok kolekcji, dziedziczy z BlockModel.   |
| `ActionModel`           | Klasa bazowa dla wszystkich akcji.        |

## Rejestracja FlowModel

```ts
export class PluginHelloClient extends Plugin {
  async load() {
    this.engine.registerModels({ HelloModel });
  }
}
```

## Renderowanie FlowModel

```tsx pure
<FlowModelRenderer model={model} />
```