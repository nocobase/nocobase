:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# การลงทะเบียน FlowModel

## มาเริ่มต้นกับ FlowModel ที่กำหนดเองกันครับ/ค่ะ

```tsx pure
class HelloModel extends FlowModel {
  render() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by HelloModel.</p>
      </div>
    );
  }
}
```

## คลาสพื้นฐาน (Base Class) ของ FlowModel ที่มีให้ใช้งาน

| ชื่อคลาสพื้นฐาน         | คำอธิบาย                               |
| ----------------------- | ----------------------------------------- |
| `BlockModel`            | คลาสพื้นฐานสำหรับบล็อกทั้งหมด                 |
| `CollectionBlockModel`  | บล็อกคอลเลกชัน ซึ่งสืบทอดมาจาก BlockModel |
| `ActionModel`           | คลาสพื้นฐานสำหรับแอคชันทั้งหมด                |

## การลงทะเบียน FlowModel

```ts
export class PluginHelloClient extends Plugin {
  async load() {
    this.engine.registerModels({ HelloModel });
  }
}
```