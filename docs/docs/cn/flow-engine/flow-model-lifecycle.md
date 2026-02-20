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

