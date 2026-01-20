:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


## ประเภท

```typescript
interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: Filter;
  filterByTk?: TargetKey | TargetKey[];
  truncate?: boolean;
  context?: any;
}
```

## รายละเอียด

- `filter`: กำหนดเงื่อนไขการกรองสำหรับเรคคอร์ดที่ต้องการลบครับ/ค่ะ สำหรับรายละเอียดการใช้งาน Filter สามารถดูได้จากเมธอด [`find()`](#find) ครับ/ค่ะ
- `filterByTk`: กำหนดเงื่อนไขการกรองสำหรับเรคคอร์ดที่ต้องการลบโดยใช้ TargetKey ครับ/ค่ะ
- `truncate`: ระบุว่าจะล้างข้อมูลในคอลเลกชันหรือไม่ครับ/ค่ะ โดยจะมีผลเมื่อไม่ได้ระบุพารามิเตอร์ `filter` หรือ `filterByTk` เท่านั้น
- `transaction`: อ็อบเจกต์สำหรับจัดการธุรกรรม (transaction) ครับ/ค่ะ หากไม่ได้ส่งพารามิเตอร์ transaction เข้ามา เมธอดนี้จะสร้าง transaction ภายในขึ้นมาโดยอัตโนมัติ