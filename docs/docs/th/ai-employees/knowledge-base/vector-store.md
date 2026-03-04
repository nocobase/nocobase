:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/ai-employees/knowledge-base/vector-store)
:::

# Vector Store

## บทนำ

ในระบบคลังความรู้ (Knowledge Base) การบันทึกเอกสารจะมีการแปลงเอกสารให้เป็นเวกเตอร์ และเมื่อค้นหาเอกสาร ก็จะมีการแปลงคำค้นหาให้เป็นเวกเตอร์เช่นกัน ทั้งสองกระบวนการนี้จำเป็นต้องใช้ `Embedding model` ในการแปลงข้อความต้นฉบับให้เป็นเวกเตอร์ครับ/ค่ะ

ในปลั๊กอิน AI Knowledge Base Vector Store คือการเชื่อมโยง (binding) ระหว่าง `Embedding model` และฐานข้อมูลเวกเตอร์ (Vector Database)

## การจัดการสตอร์เวกเตอร์

ไปที่หน้าการตั้งค่าปลั๊กอิน AI Employees จากนั้นคลิกแท็บ `Vector store` แล้วเลือก `Vector store` เพื่อเข้าสู่หน้าการจัดการ Vector Store

![20251023003023](https://static-docs.nocobase.com/20251023003023.png)

คลิกปุ่ม `Add new` ที่มุมขวาบนเพื่อเพิ่ม Vector Store ใหม่

- ในช่องป้อนข้อมูล `Name` ให้ป้อนชื่อ Vector Store
- ใน `Vector store` ให้เลือกฐานข้อมูลเวกเตอร์ที่ตั้งค่าไว้แล้ว ดูเพิ่มเติมที่: [ฐานข้อมูลเวกเตอร์](/ai-employees/knowledge-base/vector-database)
- ใน `LLM service` ให้เลือกบริการ LLM ที่ตั้งค่าไว้แล้ว ดูเพิ่มเติมที่: [การจัดการบริการ LLM](/ai-employees/features/llm-service)
- ในช่องป้อนข้อมูล `Embedding model` ให้ป้อนชื่อโมเดล `Embedding` ที่ต้องการใช้งาน

คลิกปุ่ม `Submit` เพื่อบันทึกข้อมูล Vector Store

![20251023003121](https://static-docs.nocobase.com/20251023003121.png)