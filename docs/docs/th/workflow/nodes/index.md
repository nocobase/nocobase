:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


## ภาพรวม
เวิร์กโฟลว์โดยทั่วไปจะประกอบด้วยขั้นตอนการทำงานหลายขั้นตอนที่เชื่อมโยงกันครับ แต่ละโหนดจะแทนขั้นตอนการทำงานหนึ่งขั้นตอน และเป็นหน่วยตรรกะพื้นฐานในกระบวนการทำงาน เช่นเดียวกับในภาษาโปรแกรม โหนดประเภทต่างๆ จะแทนคำสั่งที่แตกต่างกัน ซึ่งกำหนดการทำงานของโหนดนั้นๆ เมื่อเวิร์กโฟลว์ทำงาน ระบบจะเข้าสู่แต่ละโหนดตามลำดับและดำเนินการตามคำสั่งของโหนดนั้นๆ ครับ

:::info{title=ข้อแนะนำ}
ทริกเกอร์ของเวิร์กโฟลว์ไม่ใช่โหนดนะครับ แต่จะแสดงเป็นจุดเริ่มต้นในผังงานเท่านั้น ซึ่งเป็นแนวคิดที่แตกต่างจากโหนด หากต้องการรายละเอียดเพิ่มเติม โปรดดูเนื้อหาในส่วน [ทริกเกอร์](../triggers/index.md) ครับ
:::

จากมุมมองด้านฟังก์ชันการทำงาน โหนดที่ถูกนำมาใช้ในปัจจุบันสามารถแบ่งออกได้เป็นหลายประเภทหลักๆ ครับ (ทั้งหมด 29 ชนิดโหนด):

- ปัญญาประดิษฐ์
  - [โมเดลภาษาขนาดใหญ่](../../ai-employees/workflow/nodes/llm/chat.md) (มีให้โดยปลั๊กอิน @nocobase/plugin-workflow-llm)
- การควบคุมโฟลว์
  - [เงื่อนไข](./condition.md)
  - [เงื่อนไขหลายทาง](./multi-conditions.md)
  - [วนซ้ำ](./loop.md) (มีให้โดยปลั๊กอิน @nocobase/plugin-workflow-loop)
  - [ตัวแปร](./variable.md) (มีให้โดยปลั๊กอิน @nocobase/plugin-workflow-variable)
  - [แยกแบบขนาน](./parallel.md) (มีให้โดยปลั๊กอิน @nocobase/plugin-workflow-parallel)
  - [เรียกใช้เวิร์กโฟลว์](./subflow.md) (มีให้โดยปลั๊กอิน @nocobase/plugin-workflow-subflow)
  - [ผลลัพธ์เวิร์กโฟลว์](./output.md) (มีให้โดยปลั๊กอิน @nocobase/plugin-workflow-subflow)
  - [การแมปตัวแปร JSON](./json-variable-mapping.md) (มีให้โดยปลั๊กอิน @nocobase/plugin-workflow-json-variable-mapping)
  - [หน่วงเวลา](./delay.md) (มีให้โดยปลั๊กอิน @nocobase/plugin-workflow-delay)
  - [สิ้นสุดเวิร์กโฟลว์](./end.md)
- การคำนวณ
  - [คำนวณ](./calculation.md)
  - [คำนวณวันที่](./date-calculation.md) (มีให้โดยปลั๊กอิน @nocobase/plugin-workflow-date-calculation)
  - [คำนวณ JSON](./json-query.md) (มีให้โดยปลั๊กอิน @nocobase/plugin-workflow-json-query)
- การดำเนินการกับคอลเลกชัน
  - [สร้างข้อมูล](./create.md)
  - [อัปเดตข้อมูล](./update.md)
  - [ลบข้อมูล](./destroy.md)
  - [สอบถามข้อมูล](./query.md)
  - [สอบถามแบบรวม](./aggregate.md) (มีให้โดยปลั๊กอิน @nocobase/plugin-workflow-aggregate)
  - [ดำเนินการ SQL](./sql.md) (มีให้โดยปลั๊กอิน @nocobase/plugin-workflow-sql)
- การจัดการด้วยตนเอง
  - [จัดการด้วยตนเอง](./manual.md) (มีให้โดยปลั๊กอิน @nocobase/plugin-workflow-manual)
  - [อนุมัติ](./approval.md) (มีให้โดยปลั๊กอิน @nocobase/plugin-workflow-approval)
  - [สำเนาถึง (CC)](./cc.md) (มีให้โดยปลั๊กอิน @nocobase/plugin-workflow-cc)
- ส่วนขยายอื่นๆ
  - [คำขอ HTTP](./request.md) (มีให้โดยปลั๊กอิน @nocobase/plugin-workflow-request)
  - [JavaScript](./javascript.md) (มีให้โดยปลั๊กอิน @nocobase/plugin-workflow-javascript)
  - [ส่งอีเมล](./mailer.md) (มีให้โดยปลั๊กอิน @nocobase/plugin-workflow-mailer)
  - [การแจ้งเตือน](../../notification-manager/index.md#工作流通知节点) (มีให้โดยปลั๊กอิน @nocobase/plugin-workflow-notification)
  - [การตอบกลับ](./response.md) (มีให้โดยปลั๊กอิน @nocobase/plugin-workflow-webhook)
  - [ข้อความตอบกลับ](./response-message.md) (มีให้โดยปลั๊กอิน @nocobase/plugin-workflow-response-message)