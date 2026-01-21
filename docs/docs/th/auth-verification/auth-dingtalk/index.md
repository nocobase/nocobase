---
pkg: '@nocobase/plugin-auth-dingtalk'
---
:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::

# การยืนยันตัวตน: DingTalk

## บทนำ

ปลั๊กอินการยืนยันตัวตน: DingTalk ช่วยให้ผู้ใช้สามารถเข้าสู่ระบบ NocoBase โดยใช้บัญชี DingTalk ได้ครับ/ค่ะ

## การเปิดใช้งานปลั๊กอิน

![](https://static-docs.nocobase.com/202406120929356.png)

## การขอสิทธิ์ API ใน DingTalk Developer Console

โปรดดู <a href="https://open.dingtalk.com/document/orgapp/tutorial-obtaining-user-personal-information" target="_blank">DingTalk Open Platform - การเข้าสู่ระบบเว็บไซต์ภายนอก</a> เพื่อสร้างแอปพลิเคชันครับ/ค่ะ

ไปที่หน้าจัดการแอปพลิเคชัน และเปิดใช้งาน "ข้อมูลเบอร์โทรศัพท์ส่วนตัว" (Personal Phone Number Information) และ "สิทธิ์การอ่านข้อมูลส่วนตัวในสมุดรายชื่อ" (Address Book Personal Information Read Permission) ครับ/ค่ะ

![](https://static-docs.nocobase.com/202406120006620.png)

## การรับข้อมูลรับรองจาก DingTalk Developer Console

คัดลอก Client ID และ Client Secret ครับ/ค่ะ

![](https://static-docs.nocobase.com/202406120000595.png)

## การเพิ่มการยืนยันตัวตน DingTalk ใน NocoBase

ไปที่หน้าจัดการปลั๊กอินการยืนยันตัวตนผู้ใช้ครับ/ค่ะ

![](https://static-docs.nocobase.com/202406112348051.png)

เพิ่ม - DingTalk

![](https://static-docs.nocobase.com/202406112349664.png)

### การตั้งค่า

![](https://static-docs.nocobase.com/202406120016896.png)

- **Sign up automatically when the user does not exist** - เลือกตัวเลือกนี้เพื่อสร้างผู้ใช้ใหม่โดยอัตโนมัติ หากไม่พบบัญชีผู้ใช้เดิมที่ตรงกับเบอร์โทรศัพท์ครับ/ค่ะ
- **Client ID และ Client Secret** - กรอกข้อมูลที่คัดลอกไว้จากขั้นตอนก่อนหน้าครับ/ค่ะ
- **Redirect URL** - นี่คือ Callback URL ให้คัดลอก URL นี้แล้วดำเนินการในขั้นตอนถัดไปครับ/ค่ะ

## การตั้งค่า Callback URL ใน DingTalk Developer Console

วาง Callback URL ที่คัดลอกไว้ลงใน DingTalk Developer Console ครับ/ค่ะ

![](https://static-docs.nocobase.com/202406120012221.png)

## การเข้าสู่ระบบ

ไปที่หน้าเข้าสู่ระบบ แล้วคลิกปุ่มด้านล่างแบบฟอร์มการเข้าสู่ระบบ เพื่อเริ่มการเข้าสู่ระบบด้วยบัญชีภายนอกครับ/ค่ะ

![](https://static-docs.nocobase.com/202406120014539.png)