:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# Google Workspace

## ตั้งค่า Google เป็น IdP

ไปที่ [Google Admin Console](https://admin.google.com/) - แอป (Apps) - แอปบนเว็บและอุปกรณ์เคลื่อนที่ (Web and mobile apps)

![](https://static-docs.nocobase.com/0812780b990a97a63c14ea8991959827.png)

หลังจากตั้งค่าแอปเรียบร้อยแล้ว ให้คัดลอก **SSO URL**, **Entity ID** และ **Certificate** เก็บไว้ครับ/ค่ะ

![](https://static-docs.nocobase.com/aafd20a794730e85411c0c8f368637e0.png)

## เพิ่ม Authenticator ใหม่ใน NocoBase

ไปที่ การตั้งค่าปลั๊กอิน (Plugin Settings) - การยืนยันตัวตนผู้ใช้ (User Authentication) - เพิ่ม (Add) - SAML

![](https://static-docs.nocobase.com/5bc18c7952b8f15828e26bb07251a335.png)

จากนั้นให้กรอกข้อมูลที่เราคัดลอกมาเมื่อสักครู่ตามลำดับดังนี้ครับ/ค่ะ:

- SSO URL: (ใส่ SSO URL ที่คัดลอกมา)
- Public Certificate: (ใส่ Certificate ที่คัดลอกมา)
- idP Issuer: (ใส่ Entity ID ที่คัดลอกมา)
- http: หากเป็นการทดสอบบนเครื่องโลคอลด้วย HTTP ให้เลือกช่องนี้ครับ/ค่ะ

จากนั้น ให้คัดลอก SP Issuer/EntityID และ ACS URL จากส่วน Usage ครับ/ค่ะ

## กรอกข้อมูล SP ใน Google

กลับไปที่ Google Console ในหน้า **Service Provider Details** (รายละเอียดผู้ให้บริการ) ให้ป้อน ACS URL และ Entity ID ที่คัดลอกมาเมื่อสักครู่ และเลือกช่อง **Signed Response** (การตอบกลับที่ลงนาม) ครับ/ค่ะ

![](https://static-docs.nocobase.com/1536268bf8df4a5ebc72384317172191.png)

![](https://static-docs.nocobase.com/c7de1f8b84f34a5ebc72384317172191.png)

ในส่วน **Attribute Mapping** (การแมปแอตทริบิวต์) ให้เพิ่มการแมปเพื่อเชื่อมโยงแอตทริบิวต์ที่เกี่ยวข้องครับ/ค่ะ

![](https://static-docs.nocobase.com/27180f2f46480c3fee3016df86d6fdb8.png)