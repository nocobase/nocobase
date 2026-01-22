---
pkg: "@nocobase/plugin-block-grid-card"
---
:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::

# การ์ดกริด

## บทนำ

บล็อกการ์ดกริดจะแสดงข้อมูลสรุปของเรคคอร์ดข้อมูลในรูปแบบการ์ดครับ/ค่ะ รองรับการตั้งค่าจำนวนคอลัมน์สำหรับขนาดหน้าจอที่แตกต่างกัน เพื่อให้มั่นใจว่าการแสดงผลจะเหมาะสมและเป็นมิตรต่อผู้ใช้งานบนอุปกรณ์หลากหลายขนาดครับ/ค่ะ

## การตั้งค่าบล็อก

![20251023205037](https://static-docs.nocobase.com/20251023205037.png)

### ขอบเขตข้อมูล

![20251023205425](https://static-docs.nocobase.com/20251023205425.png)

ดูรายละเอียดเพิ่มเติมได้ที่ [ตั้งค่าขอบเขตข้อมูล](/interface-builder/blocks/block-settings/data-scope) ครับ/ค่ะ

### ตั้งค่าจำนวนคอลัมน์ต่อแถว

![20251023210137](https://static-docs.nocobase.com/20251023210137.gif)

รองรับการตั้งค่าจำนวนคอลัมน์สำหรับขนาดหน้าจอที่แตกต่างกันครับ/ค่ะ

![20251023210303](https://static-docs.nocobase.com/20251023210303.png)

## กำหนดค่าฟิลด์

### ฟิลด์จากคอลเลกชันนี้

![20251023210533](https://static-docs.nocobase.com/20251023210533.png)

### ฟิลด์จากคอลเลกชันที่เกี่ยวข้อง

![20251023210629](https://static-docs.nocobase.com/20251023210629.png)

สำหรับการตั้งค่าฟิลด์ของบล็อกการ์ดกริด สามารถดูรายละเอียดได้ที่ [ฟิลด์รายละเอียด](/interface-builder/fields/generic/detail-form-item) ครับ/ค่ะ

## กำหนดค่าแอคชัน

### แอคชันส่วนกลาง

![20251023211330](https://static-docs.nocobase.com/20251023211330.png)

- [กรองข้อมูล](/interface-builder/actions/types/filter)
- [เพิ่มใหม่](/interface-builder/actions/types/add-new)
- [ลบ](/interface-builder/actions/types/delete)
- [รีเฟรช](/interface-builder/actions/types/refresh)
- [นำเข้า](/interface-builder/actions/types/import)
- [ส่งออก](/interface-builder/actions/types/export)
- [พิมพ์จากเทมเพลต](/template-print/index)
- [อัปเดตจำนวนมาก](/interface-builder/actions/types/bulk-update)
- [ส่งออกไฟล์แนบ](/interface-builder/actions/types/export-attachments)
- [เรียกใช้เวิร์กโฟลว์](/interface-builder/actions/types/trigger-workflow)
- [พนักงาน AI](/interface-builder/actions/types/ai-employee)
- [JS Action](/interface-builder/actions/types/js-action)

### แอคชันต่อแถว

![20251023211054](https://static-docs.nocobase.com/20251023211054.png)

- [แก้ไข](/interface-builder/actions/types/edit)
- [ลบ](/interface-builder/actions/types/delete)
- [ลิงก์](/interface-builder/actions/types/link)
- [ป๊อปอัป](/interface-builder/actions/types/pop-up)
- [อัปเดตเรคคอร์ด](/interface-builder/actions/types/update-record)
- [พิมพ์จากเทมเพลต](/template-print/index)
- [เรียกใช้เวิร์กโฟลว์](/interface-builder/actions/types/trigger-workflow)
- [พนักงาน AI](/interface-builder/actions/types/ai-employee)
- [JS Action](/interface-builder/actions/types/js-action)