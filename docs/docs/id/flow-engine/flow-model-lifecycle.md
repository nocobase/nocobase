:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Siklus Hidup FlowModel

## Metode `model`

Panggilan internal

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

Untuk pemicu eksternal

- onSubModelAdded
- onSubModelRemoved
- onSubModelMoved

## Proses

1. Membangun model
    - onInit
2. Merender model
    - onDispatchEventStart
    - dispatchEvent('beforeRender')
    - onDispatchEventEnd
    - render
    - onMount
3. Melepas komponen
    - onUnMount
4. Memicu alur
    - onDispatchEventStart
    - onDispatchEventEnd
5. Merender ulang
  - onUnMount
  - onDispatchEventStart
  - dispatchEvent('beforeRender')
  - onDispatchEventEnd
  - onUnMount