:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# วงจรชีวิตของ FlowModel

## เมธอดของ model

การเรียกใช้ภายใน

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

ใช้สำหรับทริกเกอร์จากภายนอก

- onSubModelAdded
- onSubModelRemoved
- onSubModelMoved

## ขั้นตอนการทำงาน

1.  สร้าง model
    - onInit
2.  เรนเดอร์ model
    - onDispatchEventStart
    - dispatchEvent('beforeRender')
    - onDispatchEventEnd
    - render
    - onMount
3.  ยกเลิกการเมาท์คอมโพเนนต์
    - onUnMount
4.  ทริกเกอร์โฟลว์
    - onDispatchEventStart
    - onDispatchEventEnd
5.  เรนเดอร์ใหม่
    - onUnMount
    - onDispatchEventStart
    - dispatchEvent('beforeRender')
    - onDispatchEventEnd
    - onUnMount