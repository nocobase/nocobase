:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Cykl życia FlowModel

## Metody `model`

Wywołania wewnętrzne

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

Do wyzwalania zdarzeń zewnętrznych:

- onSubModelAdded
- onSubModelRemoved
- onSubModelMoved

## Proces

1.  Konstruowanie modelu
    - onInit
2.  Renderowanie modelu
    - onDispatchEventStart
    - dispatchEvent('beforeRender')
    - onDispatchEventEnd
    - render
    - onMount
3.  Odmontowywanie komponentu
    - onUnMount
4.  Wyzwalanie przepływu
    - onDispatchEventStart
    - onDispatchEventEnd
5.  Ponowne renderowanie
    - onUnMount
    - onDispatchEventStart
    - dispatchEvent('beforeRender')
    - onDispatchEventEnd
    - onUnMount