:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/ai-employees/features/llm-service)
:::

# กำหนดค่าบริการ LLM

ก่อนที่จะใช้งาน AI Employee จำเป็นต้องกำหนดค่าบริการ LLM ที่พร้อมใช้งานก่อนครับ

ปัจจุบันรองรับ OpenAI, Gemini, Claude, DeepSeek, Qwen, Kimi และโมเดลท้องถิ่น (Local models) ของ Ollama ครับ

## สร้างบริการใหม่

ไปที่ `การตั้งค่าระบบ (System Settings) -> AI Employee -> บริการ LLM (LLM service)`

1. คลิก `Add New` เพื่อเปิดหน้าต่างป๊อปอัปสำหรับสร้างใหม่
2. เลือก `ผู้ให้บริการ (Provider)`
3. กรอก `ชื่อ (Title)`, `API Key` และ `Base URL` (ไม่บังคับ)
4. กำหนดค่า `โมเดลที่เปิดใช้งาน (Enabled Models)`:
   - `Recommended models`: ใช้โมเดลที่แนะนำอย่างเป็นทางการ
   - `Select models`: เลือกจากรายการที่ผู้ให้บริการ (Provider) ส่งกลับมา
   - `Manual input`: กรอก ID ของโมเดลและชื่อที่ต้องการแสดงด้วยตนเอง
5. คลิก `Submit` เพื่อบันทึกครับ

![llm-service-create-provider-enabled-models.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-create-provider-enabled-models.png)

## การเปิดใช้งานและการจัดเรียงบริการ

ในรายการบริการ LLM คุณสามารถดำเนินการได้โดยตรงดังนี้:

- ใช้สวิตช์ `Enabled` เพื่อเปิดหรือปิดการใช้งานบริการ
- ลากและวางเพื่อจัดเรียงลำดับบริการ (ซึ่งจะส่งผลต่อลำดับการแสดงผลของโมเดล)

![llm-service-list-enabled-and-sort.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-list-enabled-and-sort.png)

## การทดสอบความพร้อมใช้งาน

ใช้ปุ่ม `Test flight` ที่ด้านล่างของหน้าต่างกำหนดค่าบริการเพื่อทดสอบความพร้อมใช้งานของบริการและโมเดลครับ

แนะนำให้ทำการทดสอบก่อนนำไปใช้งานจริงในธุรกิจครับ