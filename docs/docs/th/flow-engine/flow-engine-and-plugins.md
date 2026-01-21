:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# ความสัมพันธ์ระหว่าง FlowEngine กับปลั๊กอิน

**FlowEngine** ไม่ใช่ปลั๊กอินครับ แต่เป็น **API หลัก (Core API)** ที่มีไว้ให้ปลั๊กอินต่าง ๆ ใช้ เพื่อเชื่อมโยงความสามารถหลักของระบบเข้ากับการขยายฟังก์ชันการทำงานทางธุรกิจ ใน NocoBase 2.0, API ทั้งหมดจะรวมศูนย์อยู่ที่ FlowEngine ครับ และปลั๊กอินสามารถเข้าถึง FlowEngine ได้ผ่าน `this.engine`

```ts
class PluginHello extends Plugin {
  async load() {
    this.engine.registerModels({ ... });
  }
}
```

## Context: ความสามารถส่วนกลางที่จัดการแบบรวมศูนย์

FlowEngine มี **Context** แบบรวมศูนย์ ที่รวบรวม API ที่จำเป็นสำหรับสถานการณ์ต่าง ๆ ไว้ด้วยกัน เช่น:

```ts
class PluginHello extends Plugin {
  async load() {
    // การขยายเราเตอร์ (Router extension)
    this.engine.context.router;

    // ส่งคำขอ (Make a request)
    this.engine.context.api.request();

    // เกี่ยวกับการรองรับหลายภาษา (i18n related)
    this.engine.context.i18n;
    this.engine.context.t('Hello');
  }
}
```

> **หมายเหตุ**:
> ในเวอร์ชัน 2.0, Context ได้เข้ามาช่วยแก้ปัญหาต่าง ๆ ที่พบในเวอร์ชัน 1.x ดังนี้ครับ:
>
> * Context กระจัดกระจาย ทำให้การเรียกใช้งานไม่เป็นมาตรฐานเดียวกัน
> * Context หายไประหว่าง React render tree ที่แตกต่างกัน
> * สามารถใช้งานได้เฉพาะภายใน React component เท่านั้น
>
> สำหรับรายละเอียดเพิ่มเติม โปรดดูที่ **บท FlowContext** ครับ

## ชื่อเรียกย่อ (Shortcut Aliases) ในปลั๊กอิน

เพื่อความสะดวกในการเรียกใช้งาน FlowEngine ได้จัดเตรียมชื่อเรียกย่อบางส่วนไว้บนอินสแตนซ์ของปลั๊กอินครับ:

* `this.context` → เทียบเท่ากับ `this.engine.context`
* `this.router` → เทียบเท่ากับ `this.engine.context.router`

## ตัวอย่าง: การขยายเราเตอร์ (Router)

```tsx pure
import { createMockClient, Plugin } from '@nocobase/client';

class PluginHelloModel extends Plugin {
  async afterAdd() {}
  async beforeLoad() {}
  async load() {
    this.router.add('root', {
      path: '/',
      element: <div>Hello</div>,
    });
  }
}

// สำหรับตัวอย่างและสถานการณ์การทดสอบ
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

ในตัวอย่างนี้:

* ปลั๊กอินได้ขยายเส้นทาง (route) สำหรับพาธ `/` โดยใช้วิธี `this.router.add` ครับ
* `createMockClient` มีแอปพลิเคชัน Mock ที่สะอาดตา เพื่อความสะดวกในการสาธิตและทดสอบครับ
* `app.getRootComponent()` จะคืนค่าคอมโพเนนต์หลัก (root component) ซึ่งสามารถนำไปติดตั้งบนหน้าเว็บได้โดยตรงครับ