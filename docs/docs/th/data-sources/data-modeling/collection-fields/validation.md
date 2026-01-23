:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# การตรวจสอบความถูกต้องของฟิลด์

เพื่อให้แน่ใจว่าข้อมูลในคอลเลกชันมีความถูกต้อง ปลอดภัย และสอดคล้องกัน NocoBase จึงมีฟังก์ชันการตรวจสอบความถูกต้องของฟิลด์ให้ใช้งานครับ/ค่ะ ฟังก์ชันนี้แบ่งออกเป็นสองส่วนหลักๆ ได้แก่ การตั้งค่ากฎ (Rule Configuration) และการนำกฎไปใช้งาน (Rule Application)

## การตั้งค่ากฎ (Rule Configuration)

![20250819181342](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819181342.png)

ฟิลด์ของระบบ NocoBase ได้รวมกฎของ [Joi](https://joi.dev/api/) เข้าไว้ด้วยกัน โดยรองรับการใช้งานดังนี้ครับ/ค่ะ

### ประเภทสตริง (String Type)
ฟิลด์ประเภทสตริงของ Joi จะตรงกับฟิลด์ประเภทต่างๆ ใน NocoBase ดังนี้ครับ/ค่ะ: ข้อความบรรทัดเดียว (Single Line Text), ข้อความหลายบรรทัด (Long Text), เบอร์โทรศัพท์ (Phone), อีเมล (Email), URL, รหัสผ่าน (Password) และ UUID

#### กฎทั่วไป (Common Rules)
- ความยาวขั้นต่ำ (Min length)
- ความยาวสูงสุด (Max length)
- ความยาวที่กำหนด (Length)
- รูปแบบ (Pattern / Regular Expression)
- ต้องระบุ (Required)

#### อีเมล (Email)
![20250819192011](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192011.png)
[ดูตัวเลือกเพิ่มเติม](https://joi.dev/api/?v=17.13.3#stringemailoptions)

#### URL
![20250819192409](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192409.png)
[ดูตัวเลือกเพิ่มเติม](https://joi.dev/api/?v=17.13.3#stringurioptions)

#### UUID
![20250819192731](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192731.png)
[ดูตัวเลือกเพิ่มเติม](https://joi.dev/api/?v=17.13.3#stringguid---aliases-uuid)

### ประเภทตัวเลข (Number Type)
ฟิลด์ประเภทตัวเลขของ Joi จะตรงกับฟิลด์ประเภทต่างๆ ใน NocoBase ดังนี้ครับ/ค่ะ: จำนวนเต็ม (Integer), ตัวเลข (Number) และเปอร์เซ็นต์ (Percentage)

#### กฎทั่วไป (Common Rules)
- มากกว่า (Greater than)
- น้อยกว่า (Less than)
- ค่าสูงสุด (Max value)
- ค่าต่ำสุด (Min value)
- พหุคูณ (Multiple)

#### จำนวนเต็ม (Integer)
นอกจากกฎทั่วไปแล้ว ฟิลด์ประเภทจำนวนเต็มยังรองรับการ[ตรวจสอบจำนวนเต็ม](https://joi.dev/api/?v=17.13.3#numberinteger) (Integer Validation) และการ[ตรวจสอบจำนวนเต็มที่ไม่ปลอดภัย](https://joi.dev/api/?v=17.13.3#numberunsafeenabled) (Unsafe Integer Validation) เพิ่มเติมอีกด้วยครับ/ค่ะ
![20250819193758](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193758.png)

#### ตัวเลขและเปอร์เซ็นต์ (Number & Percentage)
นอกจากกฎทั่วไปแล้ว ฟิลด์ประเภทตัวเลขและเปอร์เซ็นต์ยังรองรับการ[ตรวจสอบความแม่นยำ](https://joi.dev/api/?v=17.13.3#numberinteger) (Precision Validation) เพิ่มเติมอีกด้วยครับ/ค่ะ
![20250819193954](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193954.png)

### ประเภทวันที่ (Date Type)
ฟิลด์ประเภทวันที่ของ Joi จะตรงกับฟิลด์ประเภทต่างๆ ใน NocoBase ดังนี้ครับ/ค่ะ: วันที่ (พร้อมเขตเวลา) (Date with timezone), วันที่ (ไม่มีเขตเวลา) (Date without timezone), เฉพาะวันที่ (Date only) และ Unix Timestamp

กฎการตรวจสอบที่รองรับ:
- มากกว่า (Greater than)
- น้อยกว่า (Less than)
- ค่าสูงสุด (Max value)
- ค่าต่ำสุด (Min value)
- การตรวจสอบรูปแบบ Timestamp (Timestamp Format Validation)
- ต้องระบุ (Required)

### ฟิลด์ความสัมพันธ์ (Association Fields)
ฟิลด์ความสัมพันธ์รองรับเฉพาะการตรวจสอบแบบ "ต้องระบุ" (Required Validation) เท่านั้นครับ/ค่ะ โปรดทราบว่าการตรวจสอบแบบ "ต้องระบุ" สำหรับฟิลด์ความสัมพันธ์ยังไม่รองรับการใช้งานในสถานการณ์ที่เป็นแบบฟอร์มย่อย (Sub-form) หรือตารางย่อย (Sub-table) ในขณะนี้
![20250819184344](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819184344.png)

## การนำกฎการตรวจสอบไปใช้งาน (Applying Validation Rules)
หลังจากที่คุณตั้งค่ากฎสำหรับฟิลด์แล้ว กฎการตรวจสอบที่เกี่ยวข้องจะถูกเรียกใช้งานเมื่อมีการเพิ่มหรือแก้ไขข้อมูลครับ/ค่ะ
![20250819201027](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819201027.png)

กฎการตรวจสอบยังสามารถใช้ได้กับคอมโพเนนต์ตารางย่อย (Sub-table) และแบบฟอร์มย่อย (Sub-form) ด้วยครับ/ค่ะ
![20250819202514](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202514.png)

![20250819202357](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202357.png)

โปรดทราบว่าในสถานการณ์ที่เป็นแบบฟอร์มย่อย (Sub-form) หรือตารางย่อย (Sub-table) การตรวจสอบแบบ "ต้องระบุ" สำหรับฟิลด์ความสัมพันธ์จะยังไม่ทำงานครับ/ค่ะ
![20250819203016](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203016.png)

## ความแตกต่างจากการตรวจสอบความถูกต้องของฟิลด์ฝั่งไคลเอนต์ (Client-Side Field Validation)
การตรวจสอบความถูกต้องของฟิลด์ฝั่งไคลเอนต์ (Client-Side Field Validation) และฝั่งเซิร์ฟเวอร์ (Server-Side Field Validation) เหมาะสมกับสถานการณ์การใช้งานที่แตกต่างกันครับ/ค่ะ ทั้งสองมีข้อแตกต่างที่สำคัญในด้านวิธีการนำไปใช้และช่วงเวลาที่กฎถูกเรียกใช้งาน ดังนั้นจึงจำเป็นต้องมีการจัดการแยกกัน

### ความแตกต่างของวิธีการตั้งค่า (Configuration Method Differences)
- **การตรวจสอบฝั่งไคลเอนต์ (Client-side validation)**: ตั้งค่ากฎในฟอร์มแก้ไข (Edit Form) (ดังแสดงในภาพด้านล่าง)
- **การตรวจสอบฟิลด์ฝั่งเซิร์ฟเวอร์ (Server-side field validation)**: ตั้งค่ากฎสำหรับฟิลด์ใน แหล่งข้อมูล (Data Source) → การตั้งค่าคอลเลกชัน (Collection Configuration)
![20250819203836](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203836.png)

![20250819203845](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203845.png)

### ความแตกต่างของช่วงเวลาที่เรียกใช้งานการตรวจสอบ (Validation Trigger Timing Differences)
- **การตรวจสอบฝั่งไคลเอนต์ (Client-side validation)**: จะเรียกใช้งานการตรวจสอบแบบเรียลไทม์ทันทีที่ผู้ใช้กรอกข้อมูลในฟิลด์ และแสดงข้อความข้อผิดพลาดทันที
- **การตรวจสอบฟิลด์ฝั่งเซิร์ฟเวอร์ (Server-side field validation)**: จะตรวจสอบข้อมูลที่ฝั่งเซิร์ฟเวอร์ก่อนที่จะบันทึกลงฐานข้อมูล หลังจากที่มีการส่งข้อมูลแล้ว โดยข้อความข้อผิดพลาดจะถูกส่งกลับมาทาง API Response
- **ขอบเขตการใช้งาน (Application scope)**: การตรวจสอบฟิลด์ฝั่งเซิร์ฟเวอร์จะมีผลไม่เพียงแค่ตอนส่งฟอร์มเท่านั้น แต่ยังถูกเรียกใช้งานในทุกสถานการณ์ที่เกี่ยวข้องกับการเพิ่มหรือแก้ไขข้อมูล เช่น เวิร์กโฟลว์ (Workflow) และการนำเข้าข้อมูล (Data Import)
- **ข้อความข้อผิดพลาด (Error messages)**: การตรวจสอบฝั่งไคลเอนต์รองรับการกำหนดข้อความข้อผิดพลาดเองได้ แต่การตรวจสอบฝั่งเซิร์ฟเวอร์ยังไม่รองรับการกำหนดข้อความข้อผิดพลาดเองในขณะนี้