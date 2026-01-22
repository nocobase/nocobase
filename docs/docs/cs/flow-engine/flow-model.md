:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Začínáme s FlowModel

## Vlastní FlowModel

```tsx pure
class HelloModel extends FlowModel {
  render() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>Toto je jednoduchý blok vykreslený pomocí HelloModel.</p>
      </div>
    );
  }
}
```

## Dostupné základní třídy FlowModel

| Název základní třídy    | Popis                                  |
| ----------------------- | -------------------------------------- |
| `BlockModel`            | Základní třída pro všechny bloky       |
| `CollectionBlockModel`  | Blok kolekce, dědí z BlockModel        |
| `ActionModel`           | Základní třída pro všechny akce        |

## Registrace FlowModel

```ts
export class PluginHelloClient extends Plugin {
  async load() {
    this.engine.registerModels({ HelloModel });
  }
}
```

## Vykreslování FlowModel

```tsx pure
<FlowModelRenderer model={model} />
```