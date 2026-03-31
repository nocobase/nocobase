---
title: "FlowModel 生命周期"
description: "FlowModel 生命周期：mount、init、Flow 执行、unmount，理解 FlowModel 组件挂载与销毁流程。"
keywords: "FlowModel 生命周期,mount,init,unmount,Flow 执行,组件生命周期,FlowEngine,NocoBase"
---

# FlowModel 生命周期

## model 方法

内部调用

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

用于外部触发

- onSubModelAdded
- onSubModelRemoved
- onSubModelMoved

## 流程

1. 构建 model
    - onInit
2. 渲染 model
    - onDispatchEventStart
    - dispatchEvent('beforeRender')
    - onDispatchEventEnd
    - render
    - onMount
3. 卸载组件
    - onUnMount
4. 触发流
    - onDispatchEventStart
    - onDispatchEventEnd
5. 重渲染
  - onUnMount
  - onDispatchEventStart
  - dispatchEvent('beforeRender')
  - onDispatchEventEnd
  - onUnMount

