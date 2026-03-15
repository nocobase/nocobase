---
pkg: '@nocobase/plugin-file-previewer-office'
---

:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/file-manager/file-preview/ms-office)
:::

# การแสดงตัวอย่างไฟล์ Office <Badge>v1.8.11+</Badge>

ปลั๊กอินการแสดงตัวอย่างไฟล์ Office ใช้สำหรับแสดงตัวอย่างไฟล์ในรูปแบบ Office เช่น Word, Excel, PowerPoint และอื่น ๆ ภายในแอปพลิเคชัน NocoBase ครับ
ปลั๊กอินนี้ทำงานผ่านบริการออนไลน์สาธารณะของ Microsoft ซึ่งช่วยให้สามารถฝังไฟล์ที่เข้าถึงได้ผ่าน URL สาธารณะลงในหน้าจอแสดงตัวอย่างได้ ทำให้ผู้ใช้สามารถดูไฟล์เหล่านี้ผ่านเบราว์เซอร์ได้โดยตรง โดยไม่จำเป็นต้องดาวน์โหลดหรือใช้แอปพลิเคชัน Office ครับ

## คู่มือการใช้งาน

โดยปกติแล้วปลั๊กอินนี้จะอยู่ในสถานะ **ยังไม่เปิดใช้งาน** คุณสามารถเริ่มใช้งานได้ทันทีหลังจากเปิดใช้งานในตัวจัดการปลั๊กอิน (Plugin Manager) โดยไม่ต้องตั้งค่าเพิ่มเติมครับ

![หน้าจอการเปิดใช้งานปลั๊กอิน](https://static-docs.nocobase.com/20250731140048.png)

เมื่ออัปโหลดไฟล์ Office (Word / Excel / PowerPoint) ลงในฟิลด์ไฟล์ของคอลเลกชันสำเร็จแล้ว ให้คลิกที่ไอคอนไฟล์หรือลิงก์ที่เกี่ยวข้อง เพื่อดูเนื้อหาไฟล์ในหน้าต่างป๊อปอัปหรือหน้าจอแสดงตัวอย่างที่ฝังไว้ครับ

![ตัวอย่างการแสดงตัวอย่างไฟล์](https://static-docs.nocobase.com/20250731143231.png)

## หลักการทำงาน

การแสดงตัวอย่างที่ฝังอยู่ในปลั๊กอินนี้อาศัยบริการออนไลน์สาธารณะของ Microsoft (Office Web Viewer) โดยมีขั้นตอนหลักดังนี้ครับ:

- ส่วนหน้า (Frontend) จะสร้าง URL ที่สามารถเข้าถึงได้แบบสาธารณะสำหรับไฟล์ที่ผู้ใช้อัปโหลด (รวมถึง URL ที่มีลายเซ็นจาก S3)
- ปลั๊กอินจะโหลดการแสดงตัวอย่างไฟล์ใน iframe โดยใช้ที่อยู่ดังนี้:

  ```
  https://view.officeapps.live.com/op/embed.aspx?src=<URL ไฟล์สาธารณะ>
  ```

- บริการของ Microsoft จะส่งคำขอไปยัง URL ดังกล่าวเพื่อดึงเนื้อหาไฟล์ นำมาประมวลผล (Render) และส่งกลับมาเป็นหน้าที่สามารถดูได้ครับ

## ข้อควรระวัง

- เนื่องจากปลั๊กอินนี้พึ่งพาบริการออนไลน์ของ Microsoft โปรดตรวจสอบให้แน่ใจว่าการเชื่อมต่อเครือข่ายเป็นปกติและสามารถเข้าถึงบริการที่เกี่ยวข้องของ Microsoft ได้ครับ
- Microsoft จะเข้าถึง URL ของไฟล์ที่คุณระบุ และเนื้อหาของไฟล์จะถูกแคชไว้ชั่วคราวบนเซิร์ฟเวอร์ของ Microsoft เพื่อใช้ในการประมวลผลหน้าแสดงตัวอย่าง ดังนั้นจึงมีความเสี่ยงด้านความเป็นส่วนตัวในระดับหนึ่ง หากคุณมีความกังวลในเรื่องนี้ แนะนำว่าไม่ควรใช้ฟังก์ชันการแสดงตัวอย่างจากปลั๊กอินนี้ครับ[^1]
- ไฟล์ที่ต้องการแสดงตัวอย่างต้องเป็น URL ที่เข้าถึงได้แบบสาธารณะ โดยปกติแล้ว ไฟล์ที่อัปโหลดไปยัง NocoBase จะสร้างลิงก์สาธารณะที่เข้าถึงได้โดยอัตโนมัติ (รวมถึง URL ที่มีลายเซ็นซึ่งสร้างโดยปลั๊กอิน S3-Pro) แต่หากไฟล์มีการตั้งค่าสิทธิ์การเข้าถึงหรือจัดเก็บไว้ในสภาพแวดล้อมเครือข่ายภายใน (Intranet) จะไม่สามารถแสดงตัวอย่างได้ครับ[^2]
- บริการนี้ไม่รองรับการยืนยันตัวตนด้วยการเข้าสู่ระบบหรือทรัพยากรที่จัดเก็บแบบส่วนตัว ตัวอย่างเช่น ไฟล์ที่เข้าถึงได้เฉพาะภายในเครือข่ายภายในหรือต้องเข้าสู่ระบบก่อนจึงจะเข้าถึงได้ จะไม่สามารถใช้ฟังก์ชันการแสดงตัวอย่างนี้ได้ครับ
- หลังจากที่เนื้อหาไฟล์ถูกดึงโดยบริการของ Microsoft แล้ว อาจมีการแคชไว้ในช่วงเวลาสั้น ๆ แม้ว่าไฟล์ต้นฉบับจะถูกลบไปแล้ว แต่เนื้อหาการแสดงตัวอย่างอาจยังคงเข้าถึงได้ไประยะหนึ่งครับ
- มีข้อจำกัดขนาดไฟล์ที่แนะนำ: ไฟล์ Word และ PowerPoint ไม่ควรเกิน 10MB และไฟล์ Excel ไม่ควรเกิน 5MB เพื่อให้มั่นใจในความเสถียรของการแสดงตัวอย่างครับ[^3]
- ปัจจุบันบริการนี้ยังไม่มีคำชี้แจงอย่างเป็นทางการที่ชัดเจนเกี่ยวกับสิทธิ์การใช้งานเชิงพาณิชย์ โปรดประเมินความเสี่ยงด้วยตนเองก่อนใช้งานครับ[^4]

## รูปแบบไฟล์ที่รองรับ

ปลั๊กอินรองรับการแสดงตัวอย่างเฉพาะรูปแบบไฟล์ Office ต่อไปนี้ โดยพิจารณาจากประเภท MIME หรือนามสกุลของไฟล์ครับ:

- เอกสาร Word:
  `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (`.docx`) หรือ `application/msword` (`.doc`)
- ตาราง Excel:
  `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (`.xlsx`) หรือ `application/vnd.ms-excel` (`.xls`)
- งานนำเสนอ PowerPoint:
  `application/vnd.openxmlformats-officedocument.presentationml.presentation` (`.pptx`) หรือ `application/vnd.ms-powerpoint` (`.ppt`)
- ข้อความ OpenDocument: `application/vnd.oasis.opendocument.text` (`.odt`)

ไฟล์รูปแบบอื่น ๆ จะไม่สามารถใช้ฟังก์ชันการแสดงตัวอย่างของปลั๊กอินนี้ได้ครับ

[^1]: [What is the status of view.officeapps.live.com?](https://learn.microsoft.com/en-us/answers/questions/5191451/what-is-the-status-of-view-officeapps-live-com)
[^2]: [Microsoft Q&A - Access denied or non-public files cannot be previewed](https://learn.microsoft.com/en-us/answers/questions/1411722/https-view-officeapps-live-com-op-embed-aspx)
[^3]: [Microsoft Q&A - File size limits for Office Web Viewer](https://learn.microsoft.com/en-us/answers/questions/1411722/https-view-officeapps-live-com-op-embed-aspx#file-size-limits)
[^4]: [Microsoft Q&A - Commercial use of Office Web Viewer](https://learn.microsoft.com/en-us/answers/questions/5191451/what-is-the-status-of-view-officeapps-live-com#commercial-use)