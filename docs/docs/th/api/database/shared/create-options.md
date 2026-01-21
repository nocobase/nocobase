:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


**ประเภท**

```typescript
type WhiteList = string[];
type BlackList = string[];
type AssociationKeysToBeUpdate = string[];

interface CreateOptions extends SequelizeCreateOptions {
  values?: Values;
  whitelist?: WhiteList;
  blacklist?: BlackList;
  updateAssociationValues?: AssociationKeysToBeUpdate;
  context?: any;
}
```

**รายละเอียด**

- `values`: ออบเจกต์ข้อมูลสำหรับเรคคอร์ดที่จะสร้างขึ้น
- `whitelist`: ระบุว่าฟิลด์ใดบ้างในออบเจกต์ข้อมูลของเรคคอร์ดที่จะสร้าง **สามารถเขียนได้** หากไม่ได้ส่งพารามิเตอร์นี้ ระบบจะอนุญาตให้เขียนทุกฟิลด์โดยค่าเริ่มต้นครับ/ค่ะ
- `blacklist`: ระบุว่าฟิลด์ใดบ้างในออบเจกต์ข้อมูลของเรคคอร์ดที่จะสร้าง **ไม่ได้รับอนุญาตให้เขียน** หากไม่ได้ส่งพารามิเตอร์นี้ ระบบจะอนุญาตให้เขียนทุกฟิลด์โดยค่าเริ่มต้นครับ/ค่ะ
- `transaction`: ออบเจกต์ทรานแซกชัน หากไม่ได้ส่งพารามิเตอร์ทรานแซกชัน เมธอดนี้จะสร้างทรานแซกชันภายในขึ้นมาโดยอัตโนมัติครับ/ค่ะ