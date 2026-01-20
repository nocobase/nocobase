:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# RelationRepository

`RelationRepository` เป็นอ็อบเจกต์ `Repository` สำหรับประเภทความสัมพันธ์ครับ/ค่ะ `RelationRepository` ช่วยให้เราสามารถจัดการข้อมูลที่เกี่ยวข้องได้โดยไม่ต้องโหลดความสัมพันธ์นั้นขึ้นมาก่อน โดยอิงจาก `RelationRepository` นี้ ประเภทความสัมพันธ์แต่ละแบบจะมีอิมพลีเมนเทชันที่แตกแขนงออกมาดังนี้ครับ/ค่ะ

- [`HasOneRepository`](#has-one-repository)
- `HasManyRepository`
- `BelongsToRepository`
- `BelongsToManyRepository`

## Constructor

**Signature**

- `constructor(sourceCollection: Collection, association: string, sourceKeyValue: string | number)`

**พารามิเตอร์**

| ชื่อพารามิเตอร์    | ประเภท             | ค่าเริ่มต้น | คำอธิบาย                                                                 |
| :----------------- | :----------------- | :---------- | :------------------------------------------------------------------------ |
| `sourceCollection` | `Collection`       | -           | `คอลเลกชัน` ที่สอดคล้องกับความสัมพันธ์อ้างอิง (referencing relation) ในความสัมพันธ์หลัก |
| `association`      | `string`           | -           | ชื่อความสัมพันธ์                                                          |
| `sourceKeyValue`   | `string \| number` | -           | ค่าคีย์ที่สอดคล้องในความสัมพันธ์อ้างอิง                                   |

## คุณสมบัติของคลาสพื้นฐาน

### `db: Database`

อ็อบเจกต์ฐานข้อมูล

### `sourceCollection`

`คอลเลกชัน` ที่สอดคล้องกับความสัมพันธ์อ้างอิง (referencing relation) ในความสัมพันธ์หลัก

### `targetCollection`

`คอลเลกชัน` ที่สอดคล้องกับความสัมพันธ์ที่ถูกอ้างอิง (referenced relation) ในความสัมพันธ์หลัก

### `association`

อ็อบเจกต์ความสัมพันธ์ใน Sequelize ที่สอดคล้องกับความสัมพันธ์ปัจจุบัน

### `associationField`

ฟิลด์ใน `คอลเลกชัน` ที่สอดคล้องกับความสัมพันธ์ปัจจุบัน

### `sourceKeyValue`

ค่าคีย์ที่สอดคล้องในความสัมพันธ์อ้างอิง