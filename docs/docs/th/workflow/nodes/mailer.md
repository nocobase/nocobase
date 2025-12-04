---
pkg: '@nocobase/plugin-workflow-mailer'
---
:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::

# ส่งอีเมล

## บทนำ

ใช้สำหรับส่งอีเมล รองรับเนื้อหาอีเมลทั้งในรูปแบบข้อความ (Text) และ HTML ครับ/ค่ะ

## การสร้างโหนด

ในหน้าจอการตั้งค่าเวิร์กโฟลว์ ให้คลิกปุ่มเครื่องหมายบวก ("+") ในโฟลว์เพื่อเพิ่มโหนด "ส่งอีเมล" ครับ/ค่ะ

![20251031130522](https://static-docs.nocobase.com/20251031130522.png)

## การตั้งค่าโหนด

![20251031131125](https://static-docs.nocobase.com/20251031131125.png)

แต่ละตัวเลือกสามารถใช้ตัวแปรจากบริบทของเวิร์กโฟลว์ได้ครับ/ค่ะ สำหรับข้อมูลที่ละเอียดอ่อน คุณยังสามารถใช้ตัวแปรส่วนกลาง (Global Variables) และคีย์ลับ (Secrets) ได้อีกด้วยครับ/ค่ะ

## คำถามที่พบบ่อย

### ข้อจำกัดความถี่ในการส่งอีเมลของ Gmail

เมื่อส่งอีเมลบางฉบับ คุณอาจพบข้อผิดพลาดดังต่อไปนี้ครับ/ค่ะ

```json
{
  "code": "ECONNECTION",
  "response": "421-4.7.0 Try again later, closing connection. (EHLO)\n421-4.7.0 For more information, go to\n421 4.7.0 About SMTP error messages - Google Workspace Admin Help 3f1490d57ef6-e7f7352f44csm831688276.30 - gsmtp",
  "responseCode": 421,
  "command": "EHLO"
}
```

นี่เป็นเพราะ Gmail มีการจำกัดความถี่ในการส่งคำขอจากโดเมนที่ไม่ได้ระบุไว้ครับ/ค่ะ เมื่อคุณทำการ Deploy แอปพลิเคชัน คุณจำเป็นต้องตั้งค่า hostname ของเซิร์ฟเวอร์ให้เป็นโดเมนที่คุณได้ตั้งค่าไว้ใน Gmail ครับ/ค่ะ ตัวอย่างเช่น ในการ Deploy ด้วย Docker:

```yaml
services:
  app:
    image: nocobase/nocobase
    hostname: <your-custom-hostname> # ตั้งค่าเป็นโดเมนสำหรับส่งอีเมลที่คุณได้ผูกไว้
```

อ้างอิง: [Google SMTP Relay - Intermittent problems](https://forum.nocobase.com/t/google-smtp-relay-intermittent-problems/5483/6)