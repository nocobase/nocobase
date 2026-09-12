---
title: "Siklus Hidup FlowModel"
description: "Siklus hidup FlowModel: mount, init, eksekusi Flow, unmount, memahami alur mounting dan destruksi Component FlowModel."
keywords: "siklus hidup FlowModel,mount,init,unmount,eksekusi Flow,siklus hidup Component,FlowEngine,NocoBase"
---

# Siklus Hidup FlowModel

## Method model

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

## model.emitter

Untuk trigger eksternal

- onSubModelAdded
- onSubModelRemoved
- onSubModelMoved

## Alur

1. Membangun model
    - onInit
2. Merender model
    - onDispatchEventStart
    - dispatchEvent('beforeRender')
    - onDispatchEventEnd
    - render
    - onMount
3. Unmount Component
    - onUnMount
4. Memicu flow
    - onDispatchEventStart
    - onDispatchEventEnd
5. Re-render
  - onUnMount
  - onDispatchEventStart
  - dispatchEvent('beforeRender')
  - onDispatchEventEnd
  - onUnMount
