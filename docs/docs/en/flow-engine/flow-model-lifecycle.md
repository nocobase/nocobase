# FlowModel Lifecycle

## model Methods

Internal calls

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

For external triggers

- onSubModelAdded
- onSubModelRemoved
- onSubModelMoved

## Process

1. Construct model
    - onInit
2. Render model
    - onDispatchEventStart
    - dispatchEvent('beforeRender')
    - onDispatchEventEnd
    - render
    - onMount
3. Unmount component
    - onUnMount
4. Trigger flow
    - onDispatchEventStart
    - onDispatchEventEnd
5. Re-render
  - onUnMount
  - onDispatchEventStart
  - dispatchEvent('beforeRender')
  - onDispatchEventEnd
  - onUnMount