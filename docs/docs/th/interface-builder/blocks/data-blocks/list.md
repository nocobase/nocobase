---
pkg: "@nocobase/plugin-block-list"
---
:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::

# บล็อกรายการ

## แนะนำ

บล็อกรายการใช้สำหรับแสดงข้อมูลในรูปแบบรายการ เหมาะสำหรับสถานการณ์การแสดงข้อมูลต่างๆ เช่น รายการงาน ข่าวสาร และข้อมูลผลิตภัณฑ์ครับ/ค่ะ

## การตั้งค่าบล็อก

![20251023202835](https://static-docs.nocobase.com/20251023202835.png)

### กำหนดขอบเขตข้อมูล

ดังภาพ: กรองคำสั่งซื้อที่มีสถานะเป็น "ยกเลิก" ครับ/ค่ะ

![20251023202927](https://static-docs.nocobase.com/20251023202927.png)

ดูรายละเอียดเพิ่มเติมได้ที่ [กำหนดขอบเขตข้อมูล](/interface-builder/blocks/block-settings/data-scope) ครับ/ค่ะ

### กำหนดกฎการเรียงลำดับ

ดังภาพ: เรียงลำดับตามจำนวนเงินของคำสั่งซื้อจากมากไปน้อยครับ/ค่ะ

![20251023203022](https://static-docs.nocobase.com/20251023203022.png)

ดูรายละเอียดเพิ่มเติมได้ที่ [กำหนดกฎการเรียงลำดับ](/interface-builder/blocks/block-settings/sorting-rule) ครับ/ค่ะ

## การตั้งค่าฟิลด์

### ฟิลด์จากคอลเลกชันนี้

> **หมายเหตุ**: ฟิลด์จากคอลเลกชันที่สืบทอดมา (หรือฟิลด์จากคอลเลกชันแม่) จะถูกรวมและแสดงในรายการฟิลด์ปัจจุบันโดยอัตโนมัติครับ/ค่ะ

![20251023203103](https://static-docs.nocobase.com/20251023203103.png)

### ฟิลด์จากคอลเลกชันที่เกี่ยวข้อง

> **หมายเหตุ**: รองรับการแสดงฟิลด์จากคอลเลกชันที่เกี่ยวข้อง (ปัจจุบันรองรับเฉพาะความสัมพันธ์แบบ One-to-One เท่านั้น) ครับ/ค่ะ

![20251023203611](https://static-docs.nocobase.com/20251023203611.png)

สำหรับการตั้งค่าฟิลด์รายการ สามารถดูได้ที่ [ฟิลด์รายละเอียด](/interface-builder/fields/generic/detail-form-item) ครับ/ค่ะ

## การตั้งค่าการดำเนินการ

### การดำเนินการแบบ Global

![20251023203918](https://static-docs.nocobase.com/20251023203918.png)

- [กรอง](/interface-builder/actions/types/filter)
- [เพิ่ม](/interface-builder/actions/types/add-new)
- [ลบ](/interface-builder/actions/types/delete)
- [รีเฟรช](/interface-builder/actions/types/refresh)
- [นำเข้า](/interface-builder/actions/types/import)
- [ส่งออก](/interface-builder/actions/types/export)
- [พิมพ์จากเทมเพลต](/template-print/index)
- [อัปเดตหลายรายการ](/interface-builder/actions/types/bulk-update)
- [ส่งออกไฟล์แนบ](/interface-builder/actions/types/export-attachments)
- [เรียกใช้เวิร์กโฟลว์](/interface-builder/actions/types/trigger-workflow)
- [JS Action](/interface-builder/actions/types/js-action)
- [AI Employee](/interface-builder/actions/types/ai-employee)

### การดำเนินการระดับแถว

![20251023204329](https://static-docs.nocobase.com/20251023204329.png)

- [แก้ไข](/interface-builder/actions/types/edit)
- [ลบ](/interface-builder/actions/types/delete)
- [ลิงก์](/interface-builder/actions/types/link)
- [ป๊อปอัป](/interface-builder/actions/types/pop-up)
- [อัปเดตเรคคอร์ด](/interface-builder/actions/types/update-record)
- [พิมพ์จากเทมเพลต](/template-print/index)
- [เรียกใช้เวิร์กโฟลว์](/interface-builder/actions/types/trigger-workflow)
- [JS Action](/interface-builder/actions/types/js-action)
- [AI Employee](/interface-builder/actions/types/ai-employee)