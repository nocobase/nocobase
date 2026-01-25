:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# ฐานข้อมูลภายนอก

## บทนำ

เราสามารถใช้ฐานข้อมูลภายนอกที่มีอยู่แล้วเป็น **แหล่งข้อมูล** ได้ครับ/ค่ะ ปัจจุบัน NocoBase รองรับฐานข้อมูลภายนอกดังต่อไปนี้: MySQL, MariaDB, PostgreSQL, MSSQL และ Oracle

## วิธีใช้งาน

### การเพิ่มฐานข้อมูลภายนอก

หลังจากเปิดใช้งาน **ปลั๊กอิน** แล้ว คุณจะสามารถเลือกและเพิ่มฐานข้อมูลภายนอกได้จากเมนูแบบเลื่อนลง "เพิ่มใหม่" (Add new) ในส่วนของการจัดการ **แหล่งข้อมูล** ครับ/ค่ะ

![20240507204316](https://static-docs.nocobase.com/20240507204316.png)

กรอกข้อมูลสำหรับฐานข้อมูลที่คุณต้องการเชื่อมต่อครับ/ค่ะ

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

### การซิงค์คอลเลกชัน

หลังจากเชื่อมต่อกับฐานข้อมูลภายนอกแล้ว NocoBase จะอ่าน **คอลเลกชัน** ทั้งหมดใน **แหล่งข้อมูล** โดยตรงครับ/ค่ะ ฐานข้อมูลภายนอกไม่รองรับการเพิ่ม **คอลเลกชัน** หรือการแก้ไขโครงสร้างตารางโดยตรง หากต้องการแก้ไข คุณสามารถดำเนินการผ่านไคลเอนต์ฐานข้อมูล จากนั้นคลิกปุ่ม "รีเฟรช" (Refresh) บนหน้าจอเพื่อซิงค์ข้อมูลครับ/ค่ะ

![20240507204725](https://static-docs.nocobase.com/20240507204725.png)

### การตั้งค่าฟิลด์

ฐานข้อมูลภายนอกจะอ่านและแสดงฟิลด์ของ **คอลเลกชัน** ที่มีอยู่โดยอัตโนมัติครับ/ค่ะ คุณสามารถดูและตั้งค่าชื่อฟิลด์, ชนิดข้อมูล (Field type) และชนิด UI (Field interface) ได้อย่างรวดเร็ว หรือจะคลิกปุ่ม "แก้ไข" (Edit) เพื่อปรับแต่งการตั้งค่าเพิ่มเติมก็ได้ครับ/ค่ะ

![20240507210537](https://static-docs.nocobase.com/20240507210537.png)

เนื่องจากฐานข้อมูลภายนอกไม่รองรับการแก้ไขโครงสร้างตาราง ดังนั้นเมื่อเพิ่มฟิลด์ใหม่ ชนิดฟิลด์ที่เลือกได้จะมีเพียงฟิลด์ความสัมพันธ์เท่านั้นครับ/ค่ะ ฟิลด์ความสัมพันธ์ไม่ใช่ฟิลด์จริง แต่ใช้เพื่อสร้างการเชื่อมต่อระหว่าง **คอลเลกชัน** ครับ/ค่ะ

![20240507220140](https://static-docs.nocobase.com/20240507220140.png)

ดูรายละเอียดเพิ่มเติมได้ที่บท [ฟิลด์ **คอลเลกชัน** / ภาพรวม](/data-sources/data-modeling/collection-fields) ครับ/ค่ะ

### การแมปชนิดฟิลด์

NocoBase จะทำการแมปชนิดฟิลด์จากฐานข้อมูลภายนอกให้เป็นชนิดข้อมูล (Field type) และชนิด UI (Field Interface) ที่สอดคล้องกันโดยอัตโนมัติครับ/ค่ะ

- ชนิดข้อมูล (Field type): ใช้กำหนดประเภท รูปแบบ และโครงสร้างของข้อมูลที่ฟิลด์สามารถจัดเก็บได้ครับ/ค่ะ
- ชนิด UI (Field interface): หมายถึงชนิดของส่วนควบคุมที่ใช้ในส่วนติดต่อผู้ใช้ (User Interface) เพื่อแสดงและป้อนค่าฟิลด์ครับ/ค่ะ

| PostgreSQL | MySQL/MariaDB | ชนิดข้อมูล NocoBase | ชนิด UI NocoBase |
| - | - | - | - |
| BOOLEAN | BOOLEAN<br/>TINYINT(1) | boolean | checkbox <br/> switch |
| SMALLINT<br/>INTEGER<br/>SERIAL<br/>SMALLSERIAL | TINYINT<br/>SMALLINT<br/>MEDIUMINT<br/>INTEGER | integer<br/>boolean<br/>sort | integer<br/>sort<br/>checkbox<br/>switch<br/>select<br/>radioGroup |
| BIGINT<br/>BIGSERIAL | BIGINT | bigInt<br/>sort | integer<br/>sort<br/>checkbox<br/>switch<br/>select<br/>radioGroup<br/>unixTimestamp<br/>createdAt<br/>updatedAt |
| REAL | FLOAT | float | number<br/>percent |
| DOUBLE PRECISION | DOUBLE PRECISION | double | number<br/>percent |
| DECIMAL<br/>NUMERIC | DECIMAL | decimal | number<br/>percent<br/>currency |
| VARCHAR<br/>CHAR | VARCHAR<br/>CHAR | string<br/>password<br/>uuid<br/>nanoid | input<br/>email<br/>phone<br/>password<br/>color<br/>icon<br/>select<br/>radioGroup<br/>uuid<br/>nanoid |
| TEXT | TEXT<br/>TINYTEXT<br/>MEDIUMTEXT<br/>LONGTEXT | text<br/>json | textarea<br/>markdown<br/>vditor<br/>richText<br/>url<br/>json |
| UUID | - | uuid | uuid |
| JSON<br/>JSONB | JSON | json | json |
| TIMESTAMP | DATETIME<br/>TIMESTAMP | date | date<br/>time<br/>createdAt<br/>updatedAt |
| DATE | DATE | dateOnly | datetime |
| TIME | TIME | time | time |
| - | YEAR |  | datetime |
| CIRCLE |  | circle | json<br/>circle |
| PATH<br/>GEOMETRY(LINESTRING) | LINESTRING | lineString | Json<br/>lineString |
| POINT<br/>GEOMETRY(POINT) | POINT | point | json<br/>point |
| POLYGON<br/>GEOMETRY(POLYGON) | POLYGON | polygon | json<br/>polygon |
| GEOMETRY | GEOMETRY |  -  |  -  |
| BLOB | BLOB | blob |  -  |
| ENUM | ENUM | enum | select<br/>radioGroup |
| ARRAY |  -  | array | multipleSelect<br/>checkboxGroup |
| BIT | BIT | - | - |
| SET | SET | set | multipleSelect<br/>checkboxGroup |
| RANGE | - | - | - |

### ชนิดฟิลด์ที่ไม่รองรับ

ชนิดฟิลด์ที่ไม่รองรับจะถูกแสดงแยกต่างหากครับ/ค่ะ ฟิลด์เหล่านี้จะต้องได้รับการปรับปรุงจากนักพัฒนาเพื่อให้สามารถใช้งานได้ในภายหลัง

![20240507221854](https://static-docs.nocobase.com/20240507221854.png)

### คีย์เป้าหมายการกรอง

**คอลเลกชัน** ที่แสดงเป็นบล็อกจะต้องมีการตั้งค่าคีย์เป้าหมายการกรอง (Filter target key) ครับ/ค่ะ คีย์เป้าหมายการกรองนี้ใช้สำหรับกรองข้อมูลตามฟิลด์ที่เฉพาะเจาะจง และค่าของฟิลด์นั้นจะต้องไม่ซ้ำกัน โดยปกติแล้ว คีย์เป้าหมายการกรองจะถูกตั้งค่าเป็นฟิลด์ Primary Key ของ **คอลเลกชัน** แต่หากเป็นวิว (View) หรือ **คอลเลกชัน** ที่ไม่มี Primary Key หรือมี Composite Primary Key คุณจะต้องกำหนดคีย์เป้าหมายการกรองเองครับ/ค่ะ

![20240507210230](https://static-docs.nocobase.com/20240507210230.png)

เฉพาะ **คอลเลกชัน** ที่มีการตั้งค่าคีย์เป้าหมายการกรองเท่านั้นจึงจะสามารถเพิ่มลงในหน้าเพจได้ครับ/ค่ะ

![20240507222827](https://static-docs.nocobase.com/20240507222827.png)