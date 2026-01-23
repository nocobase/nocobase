:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# ลงชื่อเข้าใช้ด้วย Google

> https://developers.google.com/identity/openid-connect/openid-connect

## รับข้อมูลรับรอง Google OAuth 2.0

[Google Cloud Console](https://console.cloud.google.com/apis/credentials) - สร้างข้อมูลรับรอง - OAuth Client ID

![](https://static-docs.nocobase.com/0f2946c8643565ecc4ac13249882638c.png)

ไปที่หน้าการตั้งค่า แล้วกรอก Authorized Redirect URL ครับ/ค่ะ โดย Redirect URL นี้สามารถดูได้เมื่อเพิ่ม Authenticator ใน NocoBase ซึ่งโดยปกติแล้วจะเป็น `http(s)://host:port/api/oidc:redirect` ครับ/ค่ะ ดูรายละเอียดเพิ่มเติมได้ที่ส่วน [คู่มือผู้ใช้ - การตั้งค่า](../index.md#configuration)

![](https://static-docs.nocobase.com/24078bf52ec966a16334894cb3d9d126.png)

## เพิ่ม Authenticator ใหม่ใน NocoBase

การตั้งค่าปลั๊กอิน - การยืนยันตัวตนผู้ใช้ - เพิ่ม - OIDC

![](https://static-docs.nocobase.com/0e4b1acdef6335aaee2139ae6629977b.png)

อ้างอิงพารามิเตอร์ที่อธิบายไว้ใน [คู่มือผู้ใช้ - การตั้งค่า](../index.md#configuration) เพื่อตั้งค่า Authenticator ให้เสร็จสมบูรณ์ได้เลยครับ/ค่ะ