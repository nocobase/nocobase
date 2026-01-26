:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# FlowModel: กระแสเหตุการณ์และการกำหนดค่า

FlowModel มีวิธีการที่อิงตาม "กระแสเหตุการณ์ (Flow)" เพื่อใช้ในการกำหนดค่าตรรกะของคอมโพเนนต์ ทำให้พฤติกรรมและการกำหนดค่าของคอมโพเนนต์สามารถขยายและมองเห็นได้ชัดเจนยิ่งขึ้นครับ/ค่ะ

## โมเดลที่กำหนดเอง

คุณสามารถสร้างโมเดลคอมโพเนนต์ที่กำหนดเองได้โดยการสืบทอด (extend) จาก `FlowModel` ครับ/ค่ะ โมเดลจะต้อง implements เมธอด `render()` เพื่อกำหนดตรรกะการเรนเดอร์ของคอมโพเนนต์ครับ/ค่ะ

```ts
class MyModel extends FlowModel {
  render() {
    return <Button {...this.props} />;
  }
}
```

## การลงทะเบียนโฟลว์ (กระแสเหตุการณ์)

แต่ละโมเดลสามารถลงทะเบียน **โฟลว์** ได้ตั้งแต่หนึ่งรายการขึ้นไป ซึ่งใช้เพื่ออธิบายตรรกะการกำหนดค่าและขั้นตอนการโต้ตอบของคอมโพเนนต์ครับ/ค่ะ

```ts
MyModel.registerFlow({
  key: 'buttonSettings',
  title: 'ปุ่มตั้งค่า',
  steps: {
    general: {
      title: 'การกำหนดค่าทั่วไป',
      uiSchema: {
        title: {
          type: 'string',
          title: 'ชื่อปุ่ม',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
      defaultParams: {
        type: 'primary',
      },
      handler(ctx, params) {
        ctx.model.setProps('children', params.title);
        ctx.model.setProps('type', params.type);
      },
    },
  },
});
```

คำอธิบาย

-   `key`: ตัวระบุเฉพาะของโฟลว์ครับ/ค่ะ
-   `title`: ชื่อของโฟลว์ ใช้สำหรับแสดงผลใน UI ครับ/ค่ะ
-   `steps`: กำหนดขั้นตอนการกำหนดค่า (Step) แต่ละขั้นตอนประกอบด้วย:
    -   `title`: ชื่อหัวข้อของขั้นตอน
    -   `uiSchema`: โครงสร้างฟอร์มการกำหนดค่า (รองรับ Formily Schema)
    -   `defaultParams`: พารามิเตอร์เริ่มต้น
    -   `handler(ctx, params)`: จะถูกเรียกเมื่อบันทึก เพื่ออัปเดตสถานะของโมเดลครับ/ค่ะ

## การเรนเดอร์โมเดล

เมื่อเรนเดอร์โมเดลคอมโพเนนต์ คุณสามารถใช้พารามิเตอร์ `showFlowSettings` เพื่อควบคุมว่าจะเปิดใช้งานคุณสมบัติการกำหนดค่าหรือไม่ครับ/ค่ะ หากเปิดใช้งาน `showFlowSettings` คอมโพเนนต์จะแสดงทางเข้าสู่การกำหนดค่า (เช่น ไอคอนการตั้งค่าหรือปุ่ม) ที่มุมขวาบนโดยอัตโนมัติครับ/ค่ะ

```ts
<FlowModelRenderer model={model} showFlowSettings />
```

## การเปิดฟอร์มการกำหนดค่าด้วยตนเองโดยใช้ `openFlowSettings`

นอกจากการเปิดฟอร์มการกำหนดค่าผ่านทางเข้าสู่การโต้ตอบที่มาพร้อมกับระบบแล้ว คุณยังสามารถเรียกใช้ `openFlowSettings()` ด้วยตนเองในโค้ดได้อีกด้วยครับ/ค่ะ

``` ts
flowSettings.open(options: FlowSettingsOpenOptions): Promise<boolean>;
model.openFlowSettings(options?: Omit<FlowSettingsOpenOptions, 'model'>): Promise<boolean>;
```

### คำจำกัดความของพารามิเตอร์

``` ts
interface FlowSettingsOpenOptions {
  model: FlowModel;               // จำเป็นต้องระบุ, อินสแตนซ์ของโมเดลที่เกี่ยวข้อง
  preset?: boolean;               // เรนเดอร์เฉพาะขั้นตอนที่ถูกทำเครื่องหมายเป็น preset=true เท่านั้น (ค่าเริ่มต้นคือ false)
  flowKey?: string;               // ระบุโฟลว์เดียว
  flowKeys?: string[];            // ระบุหลายโฟลว์ (จะถูกละเว้นหากมีการระบุ flowKey ด้วย)
  stepKey?: string;               // ระบุขั้นตอนเดียว (มักใช้ร่วมกับ flowKey)
  uiMode?: 'dialog' | 'drawer';   // คอนเทนเนอร์สำหรับแสดงฟอร์ม, ค่าเริ่มต้นคือ 'dialog'
  onCancel?: () => void;          // ฟังก์ชัน Callback เมื่อคลิกยกเลิก
  onSaved?: () => void;           // ฟังก์ชัน Callback หลังจากบันทึกการกำหนดค่าสำเร็จ
}
```

### ตัวอย่าง: การเปิดฟอร์มการกำหนดค่าของโฟลว์ที่ระบุในโหมด Drawer

``` ts
await model.openFlowSettings({
  flowKey: 'buttonSettings',
  uiMode: 'drawer',
  onSaved: () => {
    console.log('การกำหนดค่าปุ่มถูกบันทึกแล้ว');
  },
});
```