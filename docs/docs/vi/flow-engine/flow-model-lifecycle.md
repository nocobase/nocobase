:::tip Thông báo dịch AI
Tài liệu này đã được dịch tự động bằng AI.
:::


# Vòng đời của FlowModel

## Các phương thức của model

Được gọi nội bộ

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
2. Hiển thị (render) model
    - onDispatchEventStart
    - dispatchEvent('beforeRender')
    - onDispatchEventEnd
    - render
    - onMount
3. Gỡ bỏ (unmount) component
    - onUnMount
4. Kích hoạt luồng
    - onDispatchEventStart
    - onDispatchEventEnd
5. Hiển thị lại (re-render)
  - onUnMount
  - onDispatchEventStart
  - dispatchEvent('beforeRender')
  - onDispatchEventEnd
  - onUnMount