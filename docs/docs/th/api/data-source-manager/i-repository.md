:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# IRepository

`Repository` อินเทอร์เฟซกำหนดชุดของเมธอดสำหรับดำเนินการกับโมเดล เพื่อปรับใช้กับการดำเนินการ CRUD ของแหล่งข้อมูลครับ/ค่ะ

## API

### find()

คืนค่ารายการโมเดลที่ตรงกับพารามิเตอร์การค้นหาครับ/ค่ะ

#### Signature

- `find(options?: any): Promise<IModel[]>`

### findOne()

คืนค่าโมเดลที่ตรงกับพารามิเตอร์การค้นหาครับ/ค่ะ หากมีโมเดลที่ตรงกันหลายรายการ จะคืนค่าเฉพาะรายการแรกเท่านั้น

#### Signature

- `findOne(options?: any): Promise<IModel>`

### count()

คืนค่าจำนวนโมเดลที่ตรงกับพารามิเตอร์การค้นหาครับ/ค่ะ

#### Signature

- `count(options?: any): Promise<Number>`

### findAndCount()

คืนค่ารายการและจำนวนโมเดลที่ตรงกับพารามิเตอร์การค้นหาครับ/ค่ะ

#### Signature

- `findAndCount(options?: any): Promise<[IModel[], Number]>`

### create()

สร้างออบเจกต์ข้อมูลโมเดลใหม่ครับ/ค่ะ

#### Signature

- `create(options: any): void`

### update()

อัปเดตออบเจกต์ข้อมูลโมเดลตามเงื่อนไขการค้นหาครับ/ค่ะ

#### Signature

- `update(options: any): void`

### destroy()

ลบออบเจกต์ข้อมูลโมเดลตามเงื่อนไขการค้นหาครับ/ค่ะ

#### Signature

- `destroy(options: any): void`