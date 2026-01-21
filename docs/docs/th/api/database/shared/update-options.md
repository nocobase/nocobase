:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


## ประเภท

```typescript
interface UpdateOptions extends Omit<SequelizeUpdateOptions, 'where'> {
  values: Values;
  filter?: Filter;
  filterByTk?: TargetKey;
  whitelist?: WhiteList;
  blacklist?: BlackList;
  updateAssociationValues?: AssociationKeysToBeUpdate;
  context?: any;
}
```

## รายละเอียด

- `values`: อ็อบเจกต์ข้อมูลสำหรับเรคคอร์ดที่ต้องการอัปเดตครับ/ค่ะ
- `filter`: กำหนดเงื่อนไขการกรอง (filter conditions) สำหรับเรคคอร์ดที่ต้องการอัปเดตครับ/ค่ะ สำหรับการใช้งาน `Filter` โดยละเอียด สามารถดูได้จากเมธอด [`find()`](#find) ครับ/ค่ะ
- `filterByTk`: กำหนดเงื่อนไขการกรองสำหรับเรคคอร์ดที่ต้องการอัปเดต โดยใช้ `TargetKey` ครับ/ค่ะ
- `whitelist`: รายการ `whitelist` สำหรับฟิลด์ใน `values` ครับ/ค่ะ เฉพาะฟิลด์ที่อยู่ในรายการนี้เท่านั้นที่จะถูกเขียน
- `blacklist`: รายการ `blacklist` สำหรับฟิลด์ใน `values` ครับ/ค่ะ ฟิลด์ที่อยู่ในรายการนี้จะไม่ถูกเขียน
- `transaction`: อ็อบเจกต์ `transaction` ครับ/ค่ะ หากไม่ได้ส่งพารามิเตอร์ `transaction` เข้ามา เมธอดนี้จะสร้าง `transaction` ภายในขึ้นมาโดยอัตโนมัติครับ/ค่ะ

ต้องส่งค่า `filterByTk` หรือ `filter` อย่างน้อยหนึ่งตัวครับ/ค่ะ