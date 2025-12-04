---
pkg: "@nocobase/plugin-email-manager"
---
:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::

# การตั้งค่า Microsoft

### ข้อกำหนดเบื้องต้น
เพื่อให้ผู้ใช้สามารถเชื่อมต่อกล่องจดหมาย Outlook เข้ากับ NocoBase ได้ คุณต้องติดตั้ง NocoBase บนเซิร์ฟเวอร์ที่สามารถเข้าถึงบริการของ Microsoft ได้ครับ/ค่ะ เนื่องจากระบบหลังบ้านจะเรียกใช้ Microsoft API

### การลงทะเบียนบัญชี

1. ไปที่ https://azure.microsoft.com/en-us/pricing/purchase-options/azure-account
2. เข้าสู่ระบบด้วยบัญชี Microsoft ของคุณครับ/ค่ะ

![](https://static-docs.nocobase.com/mail-1733818625779.png)

### การสร้าง Tenant

1. ไปที่ https://azure.microsoft.com/zh-cn/pricing/purchase-options/azure-account?icid=azurefreeaccount แล้วเข้าสู่ระบบด้วยบัญชีของคุณครับ/ค่ะ
2. กรอกข้อมูลพื้นฐานและรับรหัสยืนยัน

![](https://static-docs.nocobase.com/mail-1733818625984.png)

3. กรอกข้อมูลอื่น ๆ แล้วดำเนินการต่อ

![](https://static-docs.nocobase.com/mail-1733818626352.png)

4. กรอกข้อมูลบัตรเครดิต (สามารถข้ามขั้นตอนนี้ไปก่อนได้ครับ/ค่ะ)

![](https://static-docs.nocobase.com/mail-1733818626622.png)

### การรับ Client ID

1. คลิกเมนูด้านบน แล้วเลือก "Microsoft Entra ID"

![](https://static-docs.nocobase.com/mail-1733818626871.png)

2. เลือก "App registrations" ทางด้านซ้าย

![](https://static-docs.nocobase.com/mail-1733818627097.png)

3. คลิก "New registration" ที่ด้านบน

![](https://static-docs.nocobase.com/mail-1733818627309.png)

4. กรอกข้อมูลแล้วกดส่ง

ชื่อสามารถตั้งได้ตามต้องการครับ/ค่ะ สำหรับประเภทบัญชี (account types) ให้เลือกตามที่แสดงในรูปภาพด้านล่าง ส่วน Redirect URI สามารถเว้นว่างไว้ก่อนได้ครับ/ค่ะ

![](https://static-docs.nocobase.com/mail-1733818627555.png)

5. คุณจะได้รับ Client ID

![](https://static-docs.nocobase.com/mail-1733818627797.png)

### การอนุญาต API

1. เปิดเมนู "API permissions" ทางด้านซ้าย

![](https://static-docs.nocobase.com/mail-1733818628178.png)

2. คลิกปุ่ม "Add a permission"

![](https://static-docs.nocobase.com/mail-1733818628448.png)

3. คลิก "Microsoft Graph"

![](https://static-docs.nocobase.com/mail-1733818628725.png)

![](https://static-docs.nocobase.com/mail-1733818628927.png)

4. ค้นหาและเพิ่มสิทธิ์ดังต่อไปนี้ ผลลัพธ์สุดท้ายควรเป็นดังภาพด้านล่าง
    
    1. `"email"`
    2. `"offline_access"`
    3. `"IMAP.AccessAsUser.All"`
    4. `"SMTP.Send"`
    5. `"offline_access"`
    6. `"User.Read"` (By default)

![](https://static-docs.nocobase.com/mail-1733818629130.png)

### การรับ Secret

1. คลิก "Certificates & secrets" ทางด้านซ้าย

![](https://static-docs.nocobase.com/mail-1733818629369.png)

2. คลิกปุ่ม "New client secret"

![](https://static-docs.nocobase.com/mail-1733818629554.png)

3. กรอกคำอธิบายและระยะเวลาหมดอายุ แล้วคลิกเพิ่ม

![](https://static-docs.nocobase.com/mail-1733818630292.png)

4. คุณจะได้รับ Secret ID

![](https://static-docs.nocobase.com/mail-1733818630535.png)

5. คัดลอก Client ID และ Client secret แล้วนำไปกรอกในหน้าการตั้งค่าอีเมลครับ/ค่ะ

![](https://static-docs.nocobase.com/mail-1733818630710.png)