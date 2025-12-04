---
pkg: "@nocobase/plugin-api-doc"
---
:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::



# เอกสารประกอบ API

## บทนำ

ปลั๊กอินนี้สร้างเอกสารประกอบ HTTP API ของ NocoBase โดยอิงตาม Swagger ครับ/ค่ะ

## การติดตั้ง

ปลั๊กอินนี้เป็นปลั๊กอินในตัว ไม่จำเป็นต้องติดตั้งครับ/ค่ะ เพียงแค่เปิดใช้งานก็สามารถใช้งานได้เลย

## วิธีการใช้งาน

### การเข้าถึงหน้าเอกสารประกอบ API

http://localhost:13000/admin/settings/api-doc/documentation

![](https://static-docs.nocobase.com/8db51cf50e3c666aba5a850a0fb664a0.png)

### ภาพรวมเอกสารประกอบ

![](https://static-docs.nocobase.com/5bb4d3e5bba6c6fdfcd830592e72385b.png)

- เอกสารประกอบ API ทั้งหมด: `/api/swagger:get`
- เอกสารประกอบ Core API: `/api/swagger:get?ns=core`
- เอกสารประกอบ API ของปลั๊กอินทั้งหมด: `/api/swagger:get?ns=plugins`
- เอกสารประกอบของแต่ละปลั๊กอิน: `/api/swagger:get?ns=plugins/{name}`
- เอกสารประกอบ API สำหรับคอลเลกชันที่ผู้ใช้กำหนดเอง: `/api/swagger:get?ns=collections`
- ทรัพยากร `${collection}` ที่ระบุและทรัพยากรที่เกี่ยวข้อง `${collection}.${association}`: `/api/swagger:get?ns=collections/{name}`

## คู่มือสำหรับนักพัฒนา

### วิธีการเขียนเอกสารประกอบ Swagger สำหรับปลั๊กอิน

ให้เพิ่มไฟล์ `swagger/index.ts` ในโฟลเดอร์ `src` ของปลั๊กอิน โดยมีเนื้อหาดังนี้ครับ/ค่ะ:

```typescript
export default {
  info: {
    title: 'NocoBase API - Auth plugin',
  },
  tags: [],
  paths: {},
  components: {
    schemas: {},
  },
};
```

สำหรับกฎการเขียนโดยละเอียด โปรดดู [เอกสารประกอบอย่างเป็นทางการของ Swagger](https://swagger.io/docs/specification/about/) ครับ/ค่ะ