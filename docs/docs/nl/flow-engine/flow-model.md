:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Aan de slag met FlowModel

## Aangepaste FlowModel

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

## Beschikbare FlowModel basisklassen

| Basisklasnaam                   | Beschrijving                               |
| ------------------------------- | ------------------------------------------ |
| `BlockModel`                    | Basisklasse voor alle blokken              |
| `CollectionBlockModel`          | Collectieblok, erft van BlockModel         |
| `ActionModel`                   | Basisklasse voor alle acties               |

## FlowModel registreren

```ts
export class PluginHelloClient extends Plugin {
  async load() {
    this.engine.registerModels({ HelloModel });
  }
}
```

## FlowModel renderen

```tsx pure
<FlowModelRenderer model={model} />
```