---
pkg: '@nocobase/plugin-api-keys'
---
:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::

# คีย์ API

## บทนำ

## วิธีการใช้งาน

http://localhost:13000/admin/settings/api-keys/configuration

![](https://static-docs.nocobase.com/d64ccbdc8a512a0224e9f81dfe14a0a8.png)

### เพิ่มคีย์ API

![](https://static-docs.nocobase.com/46141872fc0ad9a96fa5b14e97fcba12.png)

**ข้อควรทราบ**

- คีย์ API ที่เพิ่มเข้ามาจะสร้างขึ้นสำหรับผู้ใช้ปัจจุบัน และมีบทบาทตามที่ผู้ใช้คนนั้นสังกัดอยู่ครับ/ค่ะ
- โปรดตรวจสอบให้แน่ใจว่าได้ตั้งค่าตัวแปรสภาพแวดล้อม `APP_KEY` เรียบร้อยแล้ว และเก็บเป็นความลับ หาก `APP_KEY` มีการเปลี่ยนแปลง คีย์ API ที่เพิ่มไว้ทั้งหมดจะใช้งานไม่ได้ครับ/ค่ะ

### วิธีการตั้งค่า APP_KEY

สำหรับเวอร์ชัน Docker ให้แก้ไขไฟล์ `docker-compose.yml` ครับ/ค่ะ

```diff
services:
  app:
    image: nocobase/nocobase:main
    environment:
+     - APP_KEY=4jAokvLKTJgM0v_JseUkJ
```

สำหรับการติดตั้งจากซอร์สโค้ด หรือผ่าน `create-nocobase-app` คุณสามารถแก้ไข `APP_KEY` ในไฟล์ `.env` ได้โดยตรงเลยครับ/ค่ะ

```bash
APP_KEY=4jAokvLKTJgM0v_JseUkJ
```