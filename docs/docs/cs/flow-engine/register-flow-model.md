:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Registrace FlowModel

## Začněte s vlastním FlowModel

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

## Dostupné základní třídy FlowModel

| Název základní třídy    | Popis                                      |
| ----------------------- | ------------------------------------------ |
| `BlockModel`            | Základní třída pro všechny bloky           |
| `CollectionBlockModel`  | Blok kolekce, dědí z BlockModel            |
| `ActionModel`           | Základní třída pro všechny akce            |

## Registrace FlowModel

```ts
export class PluginHelloClient extends Plugin {
  async load() {
    this.engine.registerModels({ HelloModel });
  }
}
```