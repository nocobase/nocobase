:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Životní cyklus FlowModelu

## Metody modelu

Interní volání

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

Pro externí spouštění

- onSubModelAdded
- onSubModelRemoved
- onSubModelMoved

## Proces

1. Vytvoření modelu
    - onInit
2. Vykreslení modelu
    - onDispatchEventStart
    - dispatchEvent('beforeRender')
    - onDispatchEventEnd
    - render
    - onMount
3. Odpojení komponenty
    - onUnMount
4. Spuštění toku
    - onDispatchEventStart
    - onDispatchEventEnd
5. Znovu vykreslení
  - onUnMount
  - onDispatchEventStart
  - dispatchEvent('beforeRender')
  - onDispatchEventEnd
  - onUnMount