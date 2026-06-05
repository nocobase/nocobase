:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# FlowModel Lebenszyklus

## model Methoden

Interne Aufrufe

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

Für externe Auslöser

- onSubModelAdded
- onSubModelRemoved
- onSubModelMoved

## Ablauf

1. Model erstellen
    - onInit
2. Model rendern
    - onDispatchEventStart
    - dispatchEvent('beforeRender')
    - onDispatchEventEnd
    - render
    - onMount
3. Komponente aushängen
    - onUnMount
4. Ablauf auslösen
    - onDispatchEventStart
    - onDispatchEventEnd
5. Neu rendern
  - onUnMount
  - onDispatchEventStart
  - dispatchEvent('beforeRender')
  - onDispatchEventEnd
  - onUnMount