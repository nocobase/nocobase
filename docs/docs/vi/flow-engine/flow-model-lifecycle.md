---
title: "Vòng đời FlowModel"
description: "Vòng đời FlowModel: mount, init, thực thi Flow, unmount, hiểu quy trình mount và destroy của component FlowModel."
keywords: "Vòng đời FlowModel,mount,init,unmount,Thực thi Flow,Vòng đời component,FlowEngine,NocoBase"
---

# Vòng đời FlowModel

## Phương thức model

Gọi nội bộ

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

Dùng để kích hoạt từ bên ngoài

- onSubModelAdded
- onSubModelRemoved
- onSubModelMoved

## Quy trình

1. Xây dựng model
    - onInit
2. Render model
    - onDispatchEventStart
    - dispatchEvent('beforeRender')
    - onDispatchEventEnd
    - render
    - onMount
3. Unmount component
    - onUnMount
4. Kích hoạt Flow
    - onDispatchEventStart
    - onDispatchEventEnd
5. Re-render
  - onUnMount
  - onDispatchEventStart
  - dispatchEvent('beforeRender')
  - onDispatchEventEnd
  - onUnMount

