:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Ciclo di vita di FlowModel

## Metodi del modello

Chiamate interne

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

Per attivazioni esterne

- onSubModelAdded
- onSubModelRemoved
- onSubModelMoved

## Processo

1. Costruzione del modello
    - onInit
2. Rendering del modello
    - onDispatchEventStart
    - dispatchEvent('beforeRender')
    - onDispatchEventEnd
    - render
    - onMount
3. Smontaggio del componente
    - onUnMount
4. Attivazione del flusso
    - onDispatchEventStart
    - onDispatchEventEnd
5. Re-rendering
  - onUnMount
  - onDispatchEventStart
  - dispatchEvent('beforeRender')
  - onDispatchEventEnd
  - onUnMount