---
pkg: '@nocobase/plugin-verification-totp-authenticator'
---
:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::

# การยืนยันตัวตน: TOTP Authenticator

## บทนำ

TOTP Authenticator ช่วยให้ผู้ใช้สามารถผูก Authenticator ใดๆ ที่เป็นไปตามข้อกำหนด TOTP (Time-based One-Time Password) (<a href="https://www.rfc-editor.org/rfc/rfc6238" target="_blank">RFC-6238</a>) และยืนยันตัวตนโดยใช้รหัสผ่านแบบใช้ครั้งเดียวที่อิงตามเวลา (TOTP) ได้ครับ/ค่ะ

## การตั้งค่าสำหรับผู้ดูแลระบบ

ไปที่หน้าการจัดการการยืนยันตัวตนครับ/ค่ะ

![](https://static-docs.nocobase.com/202502271726791.png)

เพิ่ม - TOTP Authenticator

![](https://static-docs.nocobase.com/202502271745028.png)

นอกเหนือจากตัวระบุเฉพาะ (Unique Identifier) และชื่อเรื่อง (Title) แล้ว TOTP Authenticator ไม่จำเป็นต้องมีการตั้งค่าอื่นๆ เพิ่มเติมครับ/ค่ะ

![](https://static-docs.nocobase.com/202502271746034.png)

## การผูก Authenticator สำหรับผู้ใช้

หลังจากเพิ่ม Authenticator แล้ว ผู้ใช้สามารถผูก TOTP Authenticator ได้ในส่วนการจัดการการยืนยันตัวตนในศูนย์ข้อมูลส่วนตัวครับ/ค่ะ

![](https://static-docs.nocobase.com/202502272252324.png)

:::warning
ปลั๊กอินยังไม่มีกลไกสำหรับรหัสกู้คืน (Recovery Code) ให้ใช้งานในขณะนี้ครับ/ค่ะ ดังนั้น หลังจากผูก TOTP Authenticator แล้ว ผู้ใช้ควรเก็บรักษาไว้อย่างปลอดภัยครับ/ค่ะ หาก Authenticator สูญหายโดยไม่ตั้งใจ ผู้ใช้สามารถใช้วิธีการยืนยันตัวตนแบบอื่นเพื่อยืนยันตัวตนได้ และสามารถยกเลิกการผูก (Unbind) แล้วผูกใหม่ได้โดยใช้วิธีการยืนยันตัวตนแบบอื่นครับ/ค่ะ
:::

## การยกเลิกการผูก Authenticator สำหรับผู้ใช้

การยกเลิกการผูก Authenticator จำเป็นต้องมีการยืนยันตัวตนด้วยวิธีการยืนยันตัวตนที่ผูกไว้แล้วครับ/ค่ะ

![](https://static-docs.nocobase.com/202502282103205.png)