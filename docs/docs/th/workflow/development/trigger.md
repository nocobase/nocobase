:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# การขยายประเภททริกเกอร์

เวิร์กโฟลว์ทุกรายการต้องมีการกำหนดค่าทริกเกอร์เฉพาะ ซึ่งทำหน้าที่เป็นจุดเริ่มต้นในการเรียกใช้งานกระบวนการครับ

ประเภทของทริกเกอร์มักจะหมายถึงเหตุการณ์เฉพาะในสภาพแวดล้อมของระบบครับ ในช่วงวงจรการทำงานของแอปพลิเคชัน ส่วนใดก็ตามที่สามารถให้เหตุการณ์ที่สามารถสมัครรับได้ (subscribable events) สามารถนำมาใช้กำหนดประเภททริกเกอร์ได้ครับ เช่น การรับคำขอ, การดำเนินการกับคอลเลกชัน, งานที่ตั้งเวลาไว้ เป็นต้น

ประเภททริกเกอร์จะถูกลงทะเบียนในตารางทริกเกอร์ของปลั๊กอิน โดยใช้ตัวระบุที่เป็นสตริงครับ ปลั๊กอินเวิร์กโฟลว์มีทริกเกอร์ในตัวหลายประเภท ได้แก่:

- `'collection'`: ทริกเกอร์เมื่อมีการดำเนินการกับคอลเลกชัน
- `'schedule'`: ทริกเกอร์ตามงานที่ตั้งเวลาไว้
- `'action'`: ทริกเกอร์หลังจากเหตุการณ์การดำเนินการ

การขยายประเภททริกเกอร์จำเป็นต้องมั่นใจว่าตัวระบุ (identifier) มีความเป็นเอกลักษณ์ (unique) ครับ โดยการลงทะเบียนการสมัครรับ (subscribe) และยกเลิกการสมัครรับ (unsubscribe) ทริกเกอร์จะทำที่ฝั่งเซิร์ฟเวอร์ และการลงทะเบียนการกำหนดค่าอินเทอร์เฟซจะทำที่ฝั่งไคลเอนต์ครับ

## ฝั่งเซิร์ฟเวอร์

ทริกเกอร์ใดๆ จำเป็นต้องสืบทอดมาจากคลาสพื้นฐาน `Trigger` และต้องมีการ implement เมธอด `on`/`off` ซึ่งใช้สำหรับการสมัครรับ (subscribing) และยกเลิกการสมัครรับ (unsubscribing) เหตุการณ์เฉพาะของสภาพแวดล้อมตามลำดับครับ ในเมธอด `on` คุณจะต้องเรียกใช้ `this.workflow.trigger()` ภายในฟังก์ชัน callback ของเหตุการณ์เฉพาะ เพื่อให้ทริกเกอร์เหตุการณ์ในที่สุดครับ นอกจากนี้ ในเมธอด `off` คุณจะต้องดำเนินการทำความสะอาดที่เกี่ยวข้องกับการยกเลิกการสมัครรับด้วยครับ

โดย `this.workflow` คืออินสแตนซ์ของปลั๊กอินเวิร์กโฟลว์ที่ถูกส่งผ่านเข้ามาใน constructor ของคลาสพื้นฐาน `Trigger` ครับ

```ts
import { Trigger } from '@nocobase/plugin-workflow';

class MyTrigger extends Trigger {
  timer: NodeJS.Timeout;

  on(workflow) {
    // register event
    this.timer = setInterval(() => {
      // trigger workflow
      this.workflow.trigger(workflow, { date: new Date() });
    }, workflow.config.interval ?? 60000);
  }

  off(workflow) {
    // unregister event
    clearInterval(this.timer);
  }
}
```

จากนั้น ในปลั๊กอินที่ขยายเวิร์กโฟลว์ ให้ลงทะเบียนอินสแตนซ์ทริกเกอร์กับเอนจินเวิร์กโฟลว์ดังนี้ครับ:

```ts
import WorkflowPlugin from '@nocobase/plugin-workflow';

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.pm.get(WorkflowPlugin) as WorkflowPlugin;

    // register trigger
    workflowPlugin.registerTrigger('interval', MyTrigger);
  }
}
```

หลังจากที่เซิร์ฟเวอร์เริ่มต้นและโหลดเสร็จแล้ว ทริกเกอร์ประเภท `'interval'` ก็จะสามารถถูกเพิ่มและเรียกใช้งานได้ครับ

## ฝั่งไคลเอนต์

ส่วนของฝั่งไคลเอนต์จะเน้นการจัดเตรียมอินเทอร์เฟซการกำหนดค่าตามรายการการกำหนดค่าที่ประเภททริกเกอร์ต้องการครับ ทริกเกอร์แต่ละประเภทก็จำเป็นต้องลงทะเบียนการกำหนดค่าประเภทที่เกี่ยวข้องกับปลั๊กอินเวิร์กโฟลว์ด้วยครับ

ตัวอย่างเช่น สำหรับทริกเกอร์ที่ทำงานตามเวลาที่กำหนดไว้ข้างต้น ให้กำหนดรายการการกำหนดค่าช่วงเวลา (`interval`) ที่จำเป็นในฟอร์มอินเทอร์เฟซการกำหนดค่าดังนี้ครับ:

```ts
import { Trigger } from '@nocobase/workflow/client';

class MyTrigger extends Trigger {
  title = 'Interval timer trigger';
  // fields of trigger config
  fieldset = {
    interval: {
      type: 'number',
      title: 'Interval',
      name: 'config.interval',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      default: 60000,
    },
  };
}
```

จากนั้น ให้ลงทะเบียนประเภททริกเกอร์นี้กับอินสแตนซ์ของปลั๊กอินเวิร์กโฟลว์ภายในปลั๊กอินที่ขยายดังนี้ครับ:

```ts
import { Plugin } from '@nocobase/client';
import WorkflowPlugin from '@nocobase/plugin-workflow/client';

import MyTrigger from './MyTrigger';

export default class extends Plugin {
  // You can get and modify the app instance here
  async load() {
    const workflow = this.app.pm.get(WorkflowPlugin) as WorkflowPlugin;
    workflow.registerTrigger('interval', MyTrigger);
  }
}
```

หลังจากนั้น คุณก็จะเห็นประเภททริกเกอร์ใหม่ในอินเทอร์เฟซการกำหนดค่าของเวิร์กโฟลว์ครับ

:::info{title=คำแนะนำ}
ตัวระบุของประเภททริกเกอร์ที่ลงทะเบียนที่ฝั่งไคลเอนต์จะต้องตรงกับที่ฝั่งเซิร์ฟเวอร์ครับ มิฉะนั้นจะทำให้เกิดข้อผิดพลาดได้
:::

สำหรับรายละเอียดอื่นๆ เกี่ยวกับการกำหนดประเภททริกเกอร์ โปรดดูที่ส่วน [การอ้างอิง API ของเวิร์กโฟลว์](./api#pluginregisterTrigger) ครับ