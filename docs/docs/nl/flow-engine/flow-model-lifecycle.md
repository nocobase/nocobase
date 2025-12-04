:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# FlowModel Levenscyclus

## model Methoden

Interne aanroepen

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

## model.emitter

Voor externe triggers

- onSubModelAdded
- onSubModelRemoved
- onSubModelMoved

## Proces

1. Model bouwen
    - onInit
2. Model renderen
    - onDispatchEventStart
    - dispatchEvent('beforeRender')
    - onDispatchEventEnd
    - render
    - onMount
3. Component ontkoppelen
    - onUnMount
4. Flow activeren
    - onDispatchEventStart
    - onDispatchEventEnd
5. Opnieuw renderen
  - onUnMount
  - onDispatchEventStart
  - dispatchEvent('beforeRender')
  - onDispatchEventEnd
  - onUnMount