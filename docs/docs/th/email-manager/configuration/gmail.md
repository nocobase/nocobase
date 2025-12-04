---
pkg: "@nocobase/plugin-email-manager"
---
:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::

# การตั้งค่า Google

### ข้อกำหนดเบื้องต้น

เพื่อให้ผู้ใช้งานสามารถเชื่อมต่อบัญชี Google Mail เข้ากับ NocoBase ได้ ระบบจะต้องถูกติดตั้งบนเซิร์ฟเวอร์ที่สามารถเข้าถึงบริการของ Google ได้ เนื่องจากส่วนหลังบ้าน (backend) จะมีการเรียกใช้ Google API ครับ/ค่ะ
    
### การลงทะเบียนบัญชี

1. เปิด https://console.cloud.google.com/welcome เพื่อเข้าสู่ Google Cloud ครับ/ค่ะ  
2. ในการเข้าใช้งานครั้งแรก คุณจะต้องยอมรับข้อกำหนดและเงื่อนไขที่เกี่ยวข้องครับ/ค่ะ
    
![](https://static-docs.nocobase.com/mail-1733818617807.png)

### การสร้างแอป

1. คลิก "Select a project" ที่ด้านบนครับ/ค่ะ
    
![](https://static-docs.nocobase.com/mail-1733818618126.png)

2. คลิกปุ่ม "NEW PROJECT" ในหน้าต่างป๊อปอัปที่ปรากฏขึ้นมาครับ/ค่ะ

![](https://static-docs.nocobase.com/mail-1733818618329.png)

3. กรอกข้อมูลโปรเจกต์ครับ/ค่ะ
    
![](https://static-docs.nocobase.com/mail-1733818618510.png)

4. เมื่อสร้างโปรเจกต์เสร็จแล้ว ให้เลือกโปรเจกต์นั้นครับ/ค่ะ

![](https://static-docs.nocobase.com/mail-1733818618828.png)

![](https://static-docs.nocobase.com/mail-1733818619044.png)

### การเปิดใช้งาน Gmail API

1. คลิกปุ่ม "APIs & Services" ครับ/ค่ะ

![](https://static-docs.nocobase.com/mail-1733818619230.png)

2. เข้าสู่หน้าแดชบอร์ด APIs & Services ครับ/ค่ะ

![](https://static-docs.nocobase.com/mail-1733818619419.png)

3. ค้นหาคำว่า "mail" ครับ/ค่ะ

![](https://static-docs.nocobase.com/mail-1733818619810.png)

![](https://static-docs.nocobase.com/mail-1733818620020.png)

4. คลิกปุ่ม "ENABLE" เพื่อเปิดใช้งาน Gmail API ครับ/ค่ะ

![](https://static-docs.nocobase.com/mail-1733818620589.png)

![](https://static-docs.nocobase.com/mail-1733818620885.png)

### การตั้งค่าหน้าจอขอความยินยอม OAuth

1. คลิกเมนู "OAuth consent screen" ทางด้านซ้ายครับ/ค่ะ

![](https://static-docs.nocobase.com/mail-1733818621104.png)

2. เลือก "External" ครับ/ค่ะ

![](https://static-docs.nocobase.com/mail-1733818621322.png)

3. กรอกข้อมูลโปรเจกต์ (ข้อมูลนี้จะแสดงบนหน้าการอนุญาตในภายหลัง) แล้วคลิกบันทึกครับ/ค่ะ

![](https://static-docs.nocobase.com/mail-1733818621538.png)

4. กรอกข้อมูลติดต่อสำหรับนักพัฒนา (Developer contact information) แล้วคลิกดำเนินการต่อครับ/ค่ะ

![](https://static-docs.nocobase.com/mail-1733818621749.png)

5. คลิกดำเนินการต่อครับ/ค่ะ

![](https://static-docs.nocobase.com/mail-1733818622121.png)

6. เพิ่มผู้ใช้ทดสอบ เพื่อใช้ในการทดสอบก่อนที่จะเผยแพร่แอปครับ/ค่ะ

![](https://static-docs.nocobase.com/mail-1733818622332.png)

![](https://static-docs.nocobase.com/mail-1733818622537.png)

7. คลิกดำเนินการต่อครับ/ค่ะ

![](https://static-docs.nocobase.com/mail-1733818622753.png)

8. ตรวจสอบข้อมูลสรุป แล้วกลับไปยังหน้าควบคุม (Dashboard) ครับ/ค่ะ

![](https://static-docs.nocobase.com/mail-1733818622984.png)

### การสร้างข้อมูลรับรอง (Credentials)

1. คลิกเมนู "Credentials" ทางด้านซ้ายครับ/ค่ะ

![](https://static-docs.nocobase.com/mail-1733818623168.png)

2. คลิกปุ่ม "CREATE CREDENTIALS" แล้วเลือก "OAuth client ID" ครับ/ค่ะ

![](https://static-docs.nocobase.com/mail-1733818623386.png)

3. เลือก "Web application" ครับ/ค่ะ

![](https://static-docs.nocobase.com/mail-1733818623758.png)

4. กรอกข้อมูลแอปพลิเคชันครับ/ค่ะ

![](https://static-docs.nocobase.com/mail-1733818623992.png)

5. กรอกโดเมนที่ใช้ในการติดตั้งโปรเจกต์จริง (ตัวอย่างในที่นี้คือที่อยู่ทดสอบของ NocoBase) ครับ/ค่ะ

![](https://static-docs.nocobase.com/mail-1733818624188.png)

6. เพิ่มที่อยู่ URL สำหรับการเปลี่ยนเส้นทางหลังการอนุญาต (Authorized redirect URI) ซึ่งจะต้องเป็น `โดเมน + "/admin/settings/mail/oauth2"` ตัวอย่างเช่น: `https://pr-1-mail.test.nocobase.com/admin/settings/mail/oauth2` ครับ/ค่ะ

![](https://static-docs.nocobase.com/mail-1733818624449.png)

7. คลิกสร้าง (Create) เพื่อดูข้อมูล OAuth ครับ/ค่ะ

![](https://static-docs.nocobase.com/mail-1733818624701.png)

8. คัดลอก Client ID และ Client secret แล้วนำไปกรอกในหน้าการตั้งค่าอีเมลครับ/ค่ะ

![](https://static-docs.nocobase.com/mail-1733818624923.png)

9. คลิกบันทึก (Save) เพื่อเสร็จสิ้นการตั้งค่าครับ/ค่ะ

### การเผยแพร่แอป

เมื่อดำเนินการตามขั้นตอนข้างต้นเสร็จสิ้น และได้ทดสอบฟังก์ชันต่างๆ เช่น การเข้าสู่ระบบด้วยผู้ใช้ทดสอบ การส่งอีเมลเรียบร้อยแล้ว คุณก็สามารถเผยแพร่แอปได้ครับ/ค่ะ

1. คลิกเมนู "OAuth consent screen" ครับ/ค่ะ

![](https://static-docs.nocobase.com/mail-1733818625124.png)

2. คลิกปุ่ม "EDIT APP" จากนั้นคลิกปุ่ม "SAVE AND CONTINUE" ที่ด้านล่างครับ/ค่ะ

![](https://static-docs.nocobase.com/mail-1735633686380.png)

![](https://static-docs.nocobase.com/mail-1735633686750.png)

3. คลิกปุ่ม "ADD OR REMOVE SCOPES" เพื่อเลือกขอบเขตสิทธิ์ของผู้ใช้ครับ/ค่ะ

![](https://static-docs.nocobase.com/mail-1735633687054.png)

4. พิมพ์ "Gmail API" เพื่อค้นหา จากนั้นเลือก "Gmail API" (ตรวจสอบให้แน่ใจว่า Scope value คือ Gmail API ที่มีค่า "https://mail.google.com/") ครับ/ค่ะ

![](https://static-docs.nocobase.com/mail-1735633687283.png)

5. คลิกปุ่ม "UPDATE" ที่ด้านล่างเพื่อบันทึกครับ/ค่ะ

![](https://static-docs.nocobase.com/mail-1735633687536.png)

6. คลิกปุ่ม "SAVE AND CONTINUE" ที่ด้านล่างของแต่ละหน้า และสุดท้ายคลิกปุ่ม "BACK TO DASHBOARD" เพื่อกลับไปยังหน้าแดชบอร์ดครับ/ค่ะ

![](https://static-docs.nocobase.com/mail-1735633687744.png)

![](https://static-docs.nocobase.com/mail-1735633687912.png)

![](https://static-docs.nocobase.com/mail-1735633688075.png)

7. คลิกปุ่ม "PUBLISH APP" จะมีหน้ายืนยันการเผยแพร่ปรากฏขึ้น ซึ่งจะแสดงรายการข้อมูลที่จำเป็นสำหรับการเผยแพร่ จากนั้นคลิกปุ่ม "CONFIRM" ครับ/ค่ะ

![](https://static-docs.nocobase.com/mail-1735633688257.png)

8. กลับมาที่หน้าคอนโซลอีกครั้ง คุณจะเห็นสถานะการเผยแพร่เป็น "In production" ครับ/ค่ะ

![](https://static-docs.nocobase.com/mail-1735633688425.png)

9. คลิกปุ่ม "PREPARE FOR VERIFICATION" กรอกข้อมูลที่จำเป็นให้ครบถ้วน แล้วคลิกปุ่ม "SAVE AND CONTINUE" ครับ/ค่ะ (ข้อมูลในภาพเป็นเพียงตัวอย่างเท่านั้น)

![](https://static-docs.nocobase.com/mail-1735633688634.png)

![](https://static-docs.nocobase.com/mail-1735633688827.png)

10. กรอกข้อมูลที่จำเป็นอื่นๆ ต่อไปครับ/ค่ะ (ข้อมูลในภาพเป็นเพียงตัวอย่างเท่านั้น)

![](https://static-docs.nocobase.com/mail-1735633688993.png)

11. คลิกปุ่ม "SAVE AND CONTINUE" ครับ/ค่ะ

![](https://static-docs.nocobase.com/mail-1735633689159.png)

12. คลิกปุ่ม "SUBMIT FOR VERIFICATION" เพื่อส่งคำขอการยืนยันครับ/ค่ะ

![](https://static-docs.nocobase.com/mail-1735633689318.png)

13. รอผลการอนุมัติครับ/ค่ะ

![](https://static-docs.nocobase.com/mail-1735633689494.png)

14. หากการอนุมัติยังไม่ผ่าน ผู้ใช้สามารถคลิกลิงก์ที่ไม่ปลอดภัย (unsafe link) เพื่ออนุญาตและเข้าสู่ระบบได้ครับ/ค่ะ

![](https://static-docs.nocobase.com/mail-1735633689645.png)