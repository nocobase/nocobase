:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# สร้าง FlowModel

## ในฐานะโหนดหลัก (Root Node)

### สร้างอินสแตนซ์ FlowModel

คุณสามารถสร้างอินสแตนซ์ในเครื่องได้ดังนี้ครับ/ค่ะ

```ts
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### บันทึก FlowModel

หากอินสแตนซ์ที่คุณสร้างขึ้นมานั้นต้องการบันทึกข้อมูลแบบถาวร คุณสามารถใช้เมธอด `save` เพื่อบันทึกได้เลยครับ/ค่ะ

```ts
await model.save();
```

### โหลด FlowModel จากที่เก็บระยะไกล

สำหรับโมเดลที่บันทึกไว้แล้ว คุณสามารถโหลดได้โดยใช้เมธอด `loadModel` ซึ่งเมธอดนี้จะโหลดโครงสร้างโมเดลทั้งหมด (รวมถึงโหนดลูก) ครับ/ค่ะ

```ts
await engine.loadModel(uid);
```

### โหลดหรือสร้าง FlowModel

หากโมเดลมีอยู่แล้ว ระบบจะทำการโหลดขึ้นมาใช้งาน แต่ถ้ายังไม่มี ระบบจะสร้างและบันทึกโมเดลนั้นให้ครับ/ค่ะ

```ts
await engine.loadOrCreateModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### แสดงผล FlowModel

```tsx pure
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
const model = await engine.loadModel(uid);
const model = await engine.loadOrCreateModel(options);

<FlowModelRenderer model={model} />
```

## ในฐานะโหนดลูก (Child Node)

เมื่อคุณต้องการจัดการคุณสมบัติและพฤติกรรมของส่วนประกอบย่อยหรือโมดูลหลายรายการภายในโมเดลเดียว คุณจะต้องใช้ `SubModel` ครับ/ค่ะ เช่น ในสถานการณ์ที่มีการจัดวางแบบซ้อนกัน (nested layouts) หรือการแสดงผลแบบมีเงื่อนไข (conditional rendering) เป็นต้น

### สร้าง SubModel

เราขอแนะนำให้ใช้ `<AddSubModelButton />` ครับ/ค่ะ

คอมโพเนนต์นี้จะช่วยจัดการปัญหาต่างๆ เช่น การเพิ่ม, การผูก (binding), และการจัดเก็บ Child Model ให้โดยอัตโนมัติ สำหรับรายละเอียดเพิ่มเติม โปรดดูที่ [คู่มือการใช้งาน AddSubModelButton](https://pr-7056.client.docs-cn.nocobase.com/core/flow-engine/flow-sub-models/add-sub-model) ครับ/ค่ะ

### แสดงผล SubModel

```tsx pure
model.mapSubModels('subKey', (subModel) => {
  return <FlowModelRenderer model={subModel} />;
});
```

## ในฐานะ ForkModel

`Fork` มักจะใช้ในสถานการณ์ที่คุณต้องการแสดงผลเทมเพลตโมเดลเดียวกันในหลายๆ ตำแหน่ง (แต่มีสถานะที่เป็นอิสระต่อกัน) ครับ/ค่ะ ตัวอย่างเช่น การแสดงผลแต่ละแถวในตาราง

### สร้าง ForkModel

```tsx pure
const fork1 = model.createFork('key1', {});
const fork2 = model.createFork('key2', {});
```

### แสดงผล ForkModel

```tsx pure
<FlowModelRenderer model={fork1} />
<FlowModelRenderer model={fork2} />
```