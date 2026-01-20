:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# FlowModel-livscykel

## `model`-metoder

Interna anrop

```ts
class MyModel extends FlowModel {
  onInit() {}
  onMount() {}
  useHooksBeforeRender() {}
  render() {}
  onUnMount() {}
  onDispatchEventStart() {}
  onDispatchEventEnd() {}
  onDispatchEventError() {}
}
```

## `model.emitter`

För externa utlösare

- `onSubModelAdded`
- `onSubModelRemoved`
- `onSubModelMoved`

## Process

1. Konstruera `model`
    - `onInit`
2. Rendera `model`
    - `onDispatchEventStart`
    - `dispatchEvent('beforeRender')`
    - `onDispatchEventEnd`
    - `render`
    - `onMount`
3. Avmontera komponent
    - `onUnMount`
4. Utlös flöde
    - `onDispatchEventStart`
    - `onDispatchEventEnd`
5. Rendera om
  - `onUnMount`
  - `onDispatchEventStart`
  - `dispatchEvent('beforeRender')`
  - `onDispatchEventEnd`
  - `onUnMount`