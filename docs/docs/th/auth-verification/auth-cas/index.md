---
pkg: '@nocobase/plugin-auth-cas'
---
:::tip ประกาศการแปลด้วย AI
เอกสารนี้ได้รับการแปลโดยอัตโนมัติโดย AI
:::

# การยืนยันตัวตน: CAS

## บทนำ

ปลั๊กอินการยืนยันตัวตน: CAS รองรับมาตรฐานโปรโตคอล CAS (Central Authentication Service) ซึ่งช่วยให้ผู้ใช้สามารถเข้าสู่ระบบ NocoBase โดยใช้บัญชีที่ผู้ให้บริการยืนยันตัวตนภายนอก (IdP) จัดหาให้ได้ครับ/ค่ะ

## การติดตั้ง

## คู่มือการใช้งาน

### เปิดใช้งานปลั๊กอิน

![](https://static-docs.nocobase.com/469c48d9f2e8d41a088092c34ddb41f5.png)

### เพิ่มการยืนยันตัวตน CAS

ไปที่หน้าการจัดการการยืนยันตัวตนผู้ใช้

http://localhost:13000/admin/settings/auth/authenticators

เพิ่มวิธีการยืนยันตัวตน CAS

![](https://static-docs.nocobase.com/a268500c5008d3b90e57ff1e2ea41aca.png)

กำหนดค่า CAS และเปิดใช้งาน

![](https://static-docs.nocobase.com/2518b3fcc80d8a41391f3b629a510a02.png)

### ไปที่หน้าเข้าสู่ระบบ

http://localhost:13000/signin

![](https://static-docs.nocobase.com/49116aafbb2ed7218306f929ac8af967.png)