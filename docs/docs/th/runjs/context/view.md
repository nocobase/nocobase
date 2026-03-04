:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/runjs/context/view)
:::

# ctx.view

คอนโทรลเลอร์ของมุมมอง (View) ที่กำลังเปิดใช้งานอยู่ในปัจจุบัน (เช่น หน้าต่างป๊อปอัป, Drawer, Popover, พื้นที่ฝังตัว ฯลฯ) ใช้สำหรับเข้าถึงข้อมูลและดำเนินการต่าง ๆ ในระดับมุมมอง โดย FlowViewContext เป็นผู้ให้บริการ และจะใช้งานได้เฉพาะภายในเนื้อหาของมุมมองที่เปิดผ่าน `ctx.viewer` หรือ `ctx.openView` เท่านั้นครับ

## สถานการณ์ที่ใช้งาน

| สถานการณ์ | คำอธิบาย |
|------|------|
| **เนื้อหาในหน้าต่างป๊อปอัป/Drawer** | ใช้ `ctx.view.close()` ภายใน `content` เพื่อปิดมุมมองปัจจุบัน หรือใช้ `Header`, `Footer` ในการแสดงผลส่วนหัวและส่วนท้าย |
| **หลังจากส่งแบบฟอร์ม** | เรียกใช้ `ctx.view.close(result)` หลังจากส่งข้อมูลสำเร็จเพื่อปิดมุมมองและส่งผลลัพธ์กลับไป |
| **JSBlock / Action** | ตรวจสอบประเภทของมุมมองปัจจุบันผ่าน `ctx.view.type` หรืออ่านพารามิเตอร์ที่ใช้ในการเปิดจาก `ctx.view.inputArgs` |
| **การเลือกความสัมพันธ์, ตารางย่อย** | อ่านค่า `collectionName`, `filterByTk`, `parentId` ฯลฯ จาก `inputArgs` เพื่อใช้ในการโหลดข้อมูล |

> หมายเหตุ: `ctx.view` จะใช้งานได้เฉพาะในสภาพแวดล้อม RunJS ที่มีบริบทของมุมมองเท่านั้น (เช่น ภายใน `content` ของ `ctx.viewer.dialog()`, แบบฟอร์มในหน้าต่างป๊อปอัป, ภายในตัวเลือกความสัมพันธ์) หากอยู่ในหน้าเพจปกติหรือบริบทของ Backend ค่าจะเป็น `undefined` แนะนำให้ใช้ Optional Chaining ในการตรวจสอบ (`ctx.view?.close?.()`) ครับ

## คำจำกัดความประเภท (Type Definition)

```ts
type FlowView = {
  type: 'drawer' | 'popover' | 'dialog' | 'embed';
  inputArgs: Record<string, any>;
  Header: React.FC<{ title?: React.ReactNode; extra?: React.ReactNode }> | null;
  Footer: React.FC<{ children?: React.ReactNode }> | null;
  close: (result?: any, force?: boolean) => void;
  update: (newConfig: any) => void;
  navigation?: ViewNavigation;
  destroy?: () => void;
  submit?: () => Promise<any>;  // ใช้งานได้ในมุมมองการกำหนดค่าเวิร์กโฟลว์
};
```

## คุณสมบัติและเมธอดที่ใช้บ่อย

| คุณสมบัติ/เมธอด | ประเภท | คำอธิบาย |
|-----------|------|------|
| `type` | `'drawer' \| 'popover' \| 'dialog' \| 'embed'` | ประเภทของมุมมองปัจจุบัน |
| `inputArgs` | `Record<string, any>` | พารามิเตอร์ที่ส่งมาเมื่อเปิดมุมมอง (ดูรายละเอียดด้านล่าง) |
| `Header` | `React.FC \| null` | คอมโพเนนต์ส่วนหัว ใช้สำหรับแสดงชื่อเรื่องหรือพื้นที่ดำเนินการ |
| `Footer` | `React.FC \| null` | คอมโพเนนต์ส่วนท้าย ใช้สำหรับแสดงปุ่มต่าง ๆ |
| `close(result?, force?)` | `void` | ปิดมุมมองปัจจุบัน โดยสามารถส่ง `result` กลับไปยังผู้เรียกได้ |
| `update(newConfig)` | `void` | อัปเดตการตั้งค่ามุมมอง (เช่น ความกว้าง, ชื่อเรื่อง) |
| `navigation` | `ViewNavigation \| undefined` | การนำทางภายในมุมมองของหน้าเพจ รวมถึงการสลับ Tab ฯลฯ |

> ปัจจุบันมีเพียง `dialog` และ `drawer` เท่านั้นที่รองรับ `Header` และ `Footer` ครับ

## ฟิลด์ที่พบบ่อยใน inputArgs

ฟิลด์ใน `inputArgs` จะแตกต่างกันไปตามสถานการณ์การเปิด โดยฟิลด์ที่พบบ่อย ได้แก่:

| ฟิลด์ | คำอธิบาย |
|------|------|
| `viewUid` | UID ของมุมมอง |
| `collectionName` | ชื่อคอลเลกชัน |
| `filterByTk` | ตัวกรองด้วยคีย์หลัก (สำหรับรายละเอียดข้อมูลรายการเดียว) |
| `parentId` | ID ของตัวหลัก (สำหรับสถานการณ์ที่มีความสัมพันธ์) |
| `sourceId` | ID ของระเบียนข้อมูลต้นทาง |
| `parentItem` | ข้อมูลของรายการหลัก |
| `scene` | สถานการณ์ (เช่น `create`, `edit`, `select`) |
| `onChange` | Callback หลังจากมีการเลือกหรือเปลี่ยนแปลง |
| `tabUid` | UID ของ Tab ปัจจุบัน (ภายในหน้าเพจ) |

เข้าถึงได้ผ่าน `ctx.getVar('ctx.view.inputArgs.xxx')` หรือ `ctx.view.inputArgs.xxx` ครับ

## ตัวอย่าง

### การปิดมุมมองปัจจุบัน

```ts
// ปิดหน้าต่างป๊อปอัปหลังจากส่งข้อมูลสำเร็จ
await ctx.resource.runAction('create', { data: formData });
ctx.view?.close();

// ปิดและส่งผลลัพธ์กลับไป
ctx.view?.close({ id: newRecord.id, name: newRecord.name });
```

### การใช้ Header / Footer ภายใน content

```tsx
function DialogContent() {
  const ctx = useFlowViewContext();
  const { Header, Footer, close } = ctx.view;
  return (
    <div>
      <Header title="แก้ไข" extra={<Button size="small">ช่วยเหลือ</Button>} />
      <div>เนื้อหาแบบฟอร์ม...</div>
      <Footer>
        <Button onClick={() => close()}>ยกเลิก</Button>
        <Button type="primary" onClick={handleSubmit}>ตกลง</Button>
      </Footer>
    </div>
  );
}
```

### การแยกเงื่อนไขตามประเภทมุมมองหรือ inputArgs

```ts
if (ctx.view?.type === 'embed') {
  // ซ่อนส่วนหัวในมุมมองแบบฝังตัว
  ctx.model.setProps('headerStyle', { display: 'none' });
}

const collectionName = ctx.view?.inputArgs?.collectionName;
if (collectionName === 'users') {
  // สถานการณ์ตัวเลือกผู้ใช้
}
```

## ความสัมพันธ์กับ ctx.viewer และ ctx.openView

| วัตถุประสงค์ | วิธีการใช้งานที่แนะนำ |
|------|----------|
| **เปิดมุมมองใหม่** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` หรือ `ctx.openView()` |
| **ดำเนินการกับมุมมองปัจจุบัน** | `ctx.view.close()`, `ctx.view.update()` |
| **รับพารามิเตอร์การเปิด** | `ctx.view.inputArgs` |

`ctx.viewer` ทำหน้าที่ในการ "เปิด" มุมมอง ในขณะที่ `ctx.view` หมายถึงอินสแตนซ์ของมุมมอง "ปัจจุบัน" ส่วน `ctx.openView` ใช้สำหรับเปิดมุมมองเวิร์กโฟลว์ที่กำหนดค่าไว้แล้วครับ

## ข้อควรระวัง

- `ctx.view` ใช้งานได้เฉพาะภายในมุมมองเท่านั้น ในหน้าเพจปกติจะเป็น `undefined`
- ใช้ Optional Chaining: `ctx.view?.close?.()` เพื่อหลีกเลี่ยงข้อผิดพลาดเมื่อไม่มีบริบทของมุมมอง
- ค่า `result` จาก `close(result)` จะถูกส่งไปยัง Promise ที่ส่งกลับมาจาก `ctx.viewer.open()`

## สิ่งที่เกี่ยวข้อง

- [ctx.openView()](./open-view.md): เปิดมุมมองเวิร์กโฟลว์ที่กำหนดค่าไว้แล้ว
- [ctx.modal](./modal.md): หน้าต่างป๊อปอัปแบบน้ำหนักเบา (ข้อมูล, การยืนยัน ฯลฯ)

> `ctx.viewer` มีเมธอดต่าง ๆ เช่น `dialog()`, `drawer()`, `popover()`, และ `embed()` เพื่อเปิดมุมมอง ซึ่งภายใน `content` ที่เปิดโดยเมธอดเหล่านี้จะสามารถเข้าถึง `ctx.view` ได้ครับ