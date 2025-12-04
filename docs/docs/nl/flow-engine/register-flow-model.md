:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# FlowModel registreren

## Beginnen met een aangepaste FlowModel

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

| Basisklasnaam           | Beschrijving                               |
| ----------------------- | ------------------------------------------ |
| `BlockModel`            | Basisklas voor alle blokken                |
| `CollectionBlockModel`  | Collectieblok, erft over van BlockModel    |
| `ActionModel`           | Basisklas voor alle acties                 |

## FlowModel registreren

```ts
export class PluginHelloClient extends Plugin {
  async load() {
    this.engine.registerModels({ HelloModel });
  }
}
```