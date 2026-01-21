:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# การคงอยู่ของ FlowModel (FlowModel Persistence)
FlowEngine มีระบบการคงอยู่ของข้อมูล (persistence system) ที่สมบูรณ์แบบครับ/ค่ะ

![20251008231338](https://static-docs.nocobase.com/20251008231338.png)

## IFlowModelRepository
`IFlowModelRepository` คืออินเทอร์เฟซสำหรับการคงอยู่ของโมเดล (model persistence interface) ของ FlowEngine ครับ/ค่ะ ซึ่งจะกำหนดการทำงานต่างๆ เช่น การโหลด การบันทึก และการลบโมเดลจากระยะไกล (remote) การนำอินเทอร์เฟซนี้ไปใช้งานจะช่วยให้ข้อมูลโมเดลสามารถถูกบันทึกลงในฐานข้อมูลแบ็กเอนด์, API หรือสื่อจัดเก็บข้อมูลอื่นๆ ได้ ทำให้เกิดการซิงโครไนซ์ข้อมูลระหว่างส่วนหน้า (frontend) และส่วนหลัง (backend) ครับ/ค่ะ

### เมธอดหลัก (Main Methods)
- **findOne(query: Query): Promise<FlowModel \| null>**  
  โหลดข้อมูลโมเดลจากแหล่งข้อมูลระยะไกล โดยอ้างอิงจากตัวระบุที่ไม่ซ้ำกัน (unique identifier) `uid` ครับ/ค่ะ
- **save(model: FlowModel): Promise<any\>**  
  บันทึกข้อมูลโมเดลไปยังที่จัดเก็บข้อมูลระยะไกลครับ/ค่ะ
- **destroy(uid: string): Promise<boolean\>**  
  ลบโมเดลออกจากที่จัดเก็บข้อมูลระยะไกล โดยอ้างอิงจาก `uid` ครับ/ค่ะ

### ตัวอย่าง FlowModelRepository
```ts
class FlowModelRepository implements IFlowModelRepository<FlowModel> {
  constructor(private app: Application) {}

  async findOne(query) {
    const { uid, parentId } = query;
    // การนำไปใช้งาน: ดึงโมเดลด้วย uid
    return null;
  }

  async save(model: FlowModel) {
    console.log('Saving model:', model);
    // การนำไปใช้งาน: บันทึกโมเดล
    return model;
  }

  async destroy(uid: string) {
    // การนำไปใช้งาน: ลบโมเดลด้วย uid
    return true;
  }
}
```

### การตั้งค่า FlowModelRepository
```ts
flowEngine.setModelRepository(new FlowModelRepository(this.app));
```

## เมธอดสำหรับการจัดการโมเดลที่ FlowEngine มีให้ใช้งาน

### เมธอดภายใน (Local Methods)
```ts
flowEngine.createModel(options); // สร้างอินสแตนซ์โมเดลภายใน
flowEngine.getModel(uid);        // ดึงอินสแตนซ์โมเดลภายใน
flowEngine.removeModel(uid);     // ลบอินสแตนซ์โมเดลภายใน
```

### เมธอดระยะไกล (Remote Methods) (ที่ถูกนำไปใช้งานโดย ModelRepository)
```ts
await flowEngine.loadModel(uid);     // โหลดโมเดลจากระยะไกล
await flowEngine.saveModel(model);   // บันทึกโมเดลไปยังระยะไกล
await flowEngine.destroyModel(uid);  // ลบโมเดลจากระยะไกล
```

## เมธอดของอินสแตนซ์โมเดล (Model Instance Methods)
```ts
const model = this.flowEngine.createModel({
  use: 'FlowModel',
});
await model.save();     // บันทึกไปยังระยะไกล
await model.destroy();  // ลบจากระยะไกล
```