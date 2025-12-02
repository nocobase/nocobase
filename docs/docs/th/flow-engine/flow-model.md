:::tip ประกาศการแปลด้วย AI
เอกสารนี้ได้รับการแปลโดยอัตโนมัติโดย AI
:::


# เริ่มต้นใช้งาน FlowModel

## การสร้าง FlowModel แบบกำหนดเอง

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

## คลาสพื้นฐาน FlowModel ที่มีให้ใช้งาน

| ชื่อคลาสพื้นฐาน         | คำอธิบาย                               |
| ----------------------- | ----------------------------------------- |
| `BlockModel`            | คลาสพื้นฐานสำหรับบล็อกทั้งหมด                 |
| `CollectionBlockModel`  | บล็อกคอลเลกชัน (Collection block) ซึ่งสืบทอดมาจาก BlockModel |
| `ActionModel`           | คลาสพื้นฐานสำหรับการดำเนินการ (Action) ทั้งหมด                |

## การลงทะเบียน FlowModel

```ts
export class PluginHelloClient extends Plugin {
  async load() {
    this.engine.registerModels({ HelloModel });
  }
}
```

## การเรนเดอร์ FlowModel

```tsx pure
<FlowModelRenderer model={model} />
```