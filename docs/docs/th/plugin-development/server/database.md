:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# Database

`Database` เป็นส่วนประกอบสำคัญของ `แหล่งข้อมูล` ประเภทฐานข้อมูล (`DataSource`) ครับ/ค่ะ แหล่งข้อมูลประเภทฐานข้อมูลแต่ละรายการจะมีอินสแตนซ์ `Database` ที่เกี่ยวข้อง ซึ่งสามารถเข้าถึงได้ผ่าน `dataSource.db` อินสแตนซ์ `Database` ของแหล่งข้อมูลหลักยังมีชื่อเรียกย่อ (alias) ที่สะดวกคือ `app.db` การทำความคุ้นเคยกับเมธอด (method) ทั่วไปของ `db` ถือเป็นพื้นฐานสำคัญในการเขียนปลั๊กอินฝั่งเซิร์ฟเวอร์ครับ/ค่ะ

## ส่วนประกอบของ Database

`Database` โดยทั่วไปประกอบด้วยส่วนประกอบดังต่อไปนี้ครับ/ค่ะ:

- **คอลเลกชัน**: กำหนดโครงสร้างของตารางข้อมูลครับ/ค่ะ
- **Model**: โมเดลที่สอดคล้องกับ ORM (โดยทั่วไปจัดการโดย Sequelize)
- **Repository**: เลเยอร์ (layer) ที่ทำหน้าที่ห่อหุ้ม (encapsulate) ตรรกะการเข้าถึงข้อมูล และมีเมธอดการทำงานระดับสูงครับ/ค่ะ
- **FieldType**: ประเภทของฟิลด์
- **FilterOperator**: ตัวดำเนินการ (operator) ที่ใช้สำหรับการกรองข้อมูล
- **Event**: เหตุการณ์วงจรชีวิต (lifecycle event) และเหตุการณ์ที่เกี่ยวข้องกับฐานข้อมูล

## ช่วงเวลาที่เหมาะสมในการใช้งานในปลั๊กอิน

### สิ่งที่เหมาะสมจะทำในขั้นตอน beforeLoad

ในขั้นตอนนี้ จะไม่สามารถดำเนินการกับฐานข้อมูลได้ครับ/ค่ะ เหมาะสำหรับการลงทะเบียนคลาสแบบสแตติก (static class registration) หรือการดักจับเหตุการณ์ (event listening)

- `db.registerFieldTypes()` — กำหนดประเภทฟิลด์เอง
- `db.registerModels()` — ลงทะเบียนคลาสโมเดลที่กำหนดเอง
- `db.registerRepositories()` — ลงทะเบียนคลาส Repository ที่กำหนดเอง
- `db.registerOperators()` — ลงทะเบียนตัวดำเนินการกรองที่กำหนดเอง
- `db.on()` — ดักจับเหตุการณ์ที่เกี่ยวข้องกับฐานข้อมูล

### สิ่งที่เหมาะสมจะทำในขั้นตอน load

ในขั้นตอนนี้ การนิยามคลาสและเหตุการณ์ที่จำเป็นทั้งหมดได้ถูกโหลดเรียบร้อยแล้วครับ/ค่ะ ดังนั้น การโหลดตารางข้อมูลในขั้นตอนนี้จะไม่มีส่วนที่ขาดหายไปหรือตกหล่น

- `db.defineCollection()` — กำหนดตารางข้อมูลใหม่
- `db.extendCollection()` — ขยายการตั้งค่าตารางข้อมูลที่มีอยู่

หากเป็นการกำหนดตารางข้อมูลภายในของปลั๊กอิน (built-in tables) ขอแนะนำให้เก็บไว้ในไดเรกทอรี `./src/server/collections` ครับ/ค่ะ ดูรายละเอียดเพิ่มเติมได้ที่ [คอลเลกชัน](./collections.md)

## การดำเนินการกับข้อมูล

`Database` มีวิธีการหลักสองวิธีในการเข้าถึงและดำเนินการกับข้อมูลครับ/ค่ะ:

### การดำเนินการผ่าน Repository

```ts
const repo = db.getRepository('users');
const user = await repo.findOne({ filter: { id: 1 } });
```

เลเยอร์ Repository มักจะใช้เพื่อห่อหุ้มตรรกะทางธุรกิจ (business logic) เช่น การแบ่งหน้า (pagination) การกรองข้อมูล (filtering) การตรวจสอบสิทธิ์ (permission checks) เป็นต้นครับ/ค่ะ

### การดำเนินการผ่าน Model

```ts
const UserModel = db.getModel('users');
const user = await UserModel.findByPk(1);
```

เลเยอร์ Model จะสอดคล้องโดยตรงกับเอนทิตี (entity) ของ ORM ครับ/ค่ะ เหมาะสำหรับการดำเนินการกับฐานข้อมูลในระดับที่ต่ำกว่า

## ขั้นตอนใดบ้างที่สามารถดำเนินการกับฐานข้อมูลได้?

### วงจรชีวิตของปลั๊กอิน

| ขั้นตอน | สามารถดำเนินการกับฐานข้อมูลได้ |
|------|----------------|
| `staticImport` | ไม่ |
| `afterAdd` | ไม่ |
| `beforeLoad` | ไม่ |
| `load` | ไม่ |
| `install` | ได้ |
| `beforeEnable` | ได้ |
| `afterEnable` | ได้ |
| `beforeDisable` | ได้ |
| `afterDisable` | ได้ |
| `remove` | ได้ |
| `handleSyncMessage` | ได้ |

### เหตุการณ์ของแอป (App Events)

| ขั้นตอน | สามารถดำเนินการกับฐานข้อมูลได้ |
|------|----------------|
| `beforeLoad` | ไม่ |
| `afterLoad` | ไม่ |
| `beforeStart` | ได้ |
| `afterStart` | ได้ |
| `beforeInstall` | ไม่ |
| `afterInstall` | ได้ |
| `beforeStop` | ได้ |
| `afterStop` | ไม่ |
| `beforeDestroy` | ได้ |
| `afterDestroy` | ไม่ |
| `beforeLoadPlugin` | ไม่ |
| `afterLoadPlugin` | ไม่ |
| `beforeEnablePlugin` | ได้ |
| `afterEnablePlugin` | ได้ |
| `beforeDisablePlugin` | ได้ |
| `afterDisablePlugin` | ได้ |
| `afterUpgrade` | ได้ |

### เหตุการณ์/ฮุกของ Database

| ขั้นตอน | สามารถดำเนินการกับฐานข้อมูลได้ |
|------|----------------|
| `beforeSync` | ไม่ |
| `afterSync` | ได้ |
| `beforeValidate` | ได้ |
| `afterValidate` | ได้ |
| `beforeCreate` | ได้ |
| `afterCreate` | ได้ |
| `beforeUpdate` | ได้ |
| `afterUpdate` | ได้ |
| `beforeSave` | ได้ |
| `afterSave` | ได้ |
| `beforeDestroy` | ได้ |
| `afterDestroy` | ได้ |
| `afterCreateWithAssociations` | ได้ |
| `afterUpdateWithAssociations` | ได้ |
| `afterSaveWithAssociations` | ได้ |
| `beforeDefineCollection` | ไม่ |
| `afterDefineCollection` | ไม่ |
| `beforeRemoveCollection` | ไม่ |
| `afterRemoveCollection` | ไม่ |