:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# การอ้างอิง API

## ฝั่งเซิร์ฟเวอร์

API ที่มีให้ใช้งานในโครงสร้างแพ็กเกจฝั่งเซิร์ฟเวอร์แสดงอยู่ในโค้ดด้านล่างนี้ครับ/ค่ะ:

```ts
import PluginWorkflowServer, {
  Trigger,
  Instruction,
  EXECUTION_STATUS,
  JOB_STATUS,
} from '@nocobase/plugin-workflow';
```

### `PluginWorkflowServer`

คลาสปลั๊กอินเวิร์กโฟลว์ครับ/ค่ะ

โดยปกติแล้ว ในระหว่างที่แอปพลิเคชันกำลังทำงานอยู่ คุณสามารถเรียกใช้ `app.pm.get<PluginWorkflowServer>(PluginWorkflowServer)` ได้จากทุกที่ที่คุณสามารถเข้าถึงอินสแตนซ์ของแอปพลิเคชัน (`app`) เพื่อรับอินสแตนซ์ของปลั๊กอินเวิร์กโฟลว์ (ซึ่งจะเรียกสั้นๆ ว่า `plugin` ในส่วนถัดไป) ครับ/ค่ะ

#### `registerTrigger()`

ใช้สำหรับขยายและลงทะเบียนประเภททริกเกอร์ใหม่ครับ/ค่ะ

**รูปแบบการเรียกใช้ (Signature)**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger })`

**พารามิเตอร์**

| พารามิเตอร์      | ประเภท                        | คำอธิบาย             |
| --------- | --------------------------- | ---------------- |
| `type`    | `string`                    | ตัวระบุประเภททริกเกอร์ |
| `trigger` | `typeof Trigger \| Trigger` | ประเภทหรืออินสแตนซ์ของทริกเกอร์ |

**ตัวอย่าง**

```ts
import PluginWorkflowServer, { Trigger } from '@nocobase/plugin-workflow';

function handler(this: MyTrigger, workflow: WorkflowModel, message: string) {
  // trigger workflow
  this.workflow.trigger(workflow, { data: message.data });
}

class MyTrigger extends Trigger {
  messageHandlers: Map<number, WorkflowModel> = new Map();
  on(workflow: WorkflowModel) {
    const messageHandler = handler.bind(this, workflow);
    // listen some event to trigger workflow
    process.on(
      'message',
      this.messageHandlers.set(workflow.id, messageHandler),
    );
  }

  off(workflow: WorkflowModel) {
    const messageHandler = this.messageHandlers.get(workflow.id);
    // remove listener
    process.off('message', messageHandler);
  }
}

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin =
      this.app.pm.get<PluginWorkflowServer>(PluginWorkflowServer);

    // register trigger
    workflowPlugin.registerTrigger('myTrigger', MyTrigger);
  }
}
```

#### `registerInstruction()`

ใช้สำหรับขยายและลงทะเบียนประเภทโหนดใหม่ครับ/ค่ะ

**รูปแบบการเรียกใช้ (Signature)**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction })`

**พารามิเตอร์**

| พารามิเตอร์          | ประเภท                                | คำอธิบาย           |
| ------------- | ----------------------------------- | -------------- |
| `type`        | `string`                            | ตัวระบุประเภทคำสั่ง |
| `instruction` | `typeof Instruction \| Instruction` | ประเภทหรืออินสแตนซ์ของคำสั่ง |

**ตัวอย่าง**

```ts
import PluginWorkflowServer, { Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

class LogInstruction extends Instruction {
  run(node, input, processor) {
    console.log('my instruction runs!');
    return {
      status: JOB_STATUS.RESOVLED,
    };
  },
};

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.pm.get<PluginWorkflowServer>(PluginWorkflowServer);

    // register instruction
    workflowPlugin.registerInstruction('log', LogInstruction);
  }
}
```

#### `trigger()`

ใช้สำหรับทริกเกอร์เวิร์กโฟลว์ที่กำหนดครับ/ค่ะ โดยหลักแล้วจะใช้ในทริกเกอร์แบบกำหนดเอง เพื่อทริกเกอร์เวิร์กโฟลว์ที่เกี่ยวข้องเมื่อมีการตรวจจับเหตุการณ์ที่กำหนดเองนั้นๆ ครับ/ค่ะ

**รูปแบบการเรียกใช้ (Signature)**

`trigger(workflow: Workflow, context: any)`

**พารามิเตอร์**
| พารามิเตอร์ | ประเภท | คำอธิบาย |
| --- | --- | --- |
| `workflow` | `WorkflowModel` | อ็อบเจกต์เวิร์กโฟลว์ที่ต้องการทริกเกอร์ |
| `context` | `object` | ข้อมูลบริบทที่ให้มา ณ เวลาที่ทริกเกอร์ |

:::info{title=เคล็ดลับ}
`context` เป็นพารามิเตอร์ที่จำเป็นในขณะนี้ หากไม่ได้ระบุ เวิร์กโฟลว์จะไม่ถูกทริกเกอร์ครับ/ค่ะ
:::

**ตัวอย่าง**

```ts
import { Trigger } from '@nocobase/plugin-workflow';

class MyTrigger extends Trigger {
  timer: NodeJS.Timeout;

  on(workflow) {
    // register event
    this.timer = setInterval(() => {
      // trigger workflow
      this.plugin.trigger(workflow, { date: new Date() });
    }, workflow.config.interval ?? 60000);
  }
}
```

#### `resume()`

ใช้สำหรับดำเนินการเวิร์กโฟลว์ที่หยุดรออยู่ต่อ โดยใช้โหนดงานที่เฉพาะเจาะจงครับ/ค่ะ

- เฉพาะเวิร์กโฟลว์ที่อยู่ในสถานะรอ (`EXECUTION_STATUS.STARTED`) เท่านั้นที่สามารถดำเนินการต่อได้ครับ/ค่ะ
- เฉพาะโหนดงานที่อยู่ในสถานะรอดำเนินการ (`JOB_STATUS.PENDING`) เท่านั้นที่สามารถดำเนินการต่อได้ครับ/ค่ะ

**รูปแบบการเรียกใช้ (Signature)**

`resume(job: JobModel)`

**พารามิเตอร์**

| พารามิเตอร์  | ประเภท       | คำอธิบาย             |
| ----- | ---------- | ---------------- |
| `job` | `JobModel` | อ็อบเจกต์งานที่อัปเดตแล้ว |

:::info{title=เคล็ดลับ}
อ็อบเจกต์งานที่ส่งเข้ามามักจะเป็นอ็อบเจกต์ที่ได้รับการอัปเดตแล้ว และโดยปกติแล้ว `status` จะถูกอัปเดตเป็นค่าอื่นที่ไม่ใช่ `JOB_STATUS.PENDING` ครับ/ค่ะ มิฉะนั้นจะยังคงอยู่ในสถานะรอต่อไป
:::

**ตัวอย่าง**

ดูรายละเอียดเพิ่มเติมได้ที่[ซอร์สโค้ด](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-manual/src/server/actions.ts#L99) ครับ/ค่ะ

### `Trigger`

คลาสพื้นฐานสำหรับทริกเกอร์ ใช้สำหรับขยายประเภททริกเกอร์ที่กำหนดเองครับ/ค่ะ

| พารามิเตอร์          | ประเภท                                                        | คำอธิบาย                   |
| ------------- | ----------------------------------------------------------- | ---------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Trigger` | คอนสตรักเตอร์               |
| `on?`         | `(workflow: WorkflowModel): void`                           | ตัวจัดการเหตุการณ์หลังจากเปิดใช้งานเวิร์กโฟลว์ |
| `off?`        | `(workflow: WorkflowModel): void`                           | ตัวจัดการเหตุการณ์หลังจากปิดใช้งานเวิร์กโฟลว์ |

`on`/`off` ใช้สำหรับลงทะเบียน/ยกเลิกการลงทะเบียนตัวฟังเหตุการณ์เมื่อมีการเปิด/ปิดใช้งานเวิร์กโฟลว์ครับ/ค่ะ พารามิเตอร์ที่ส่งเข้ามาคืออินสแตนซ์ของเวิร์กโฟลว์ที่เกี่ยวข้องกับทริกเกอร์ ซึ่งสามารถประมวลผลได้ตามการตั้งค่าที่เกี่ยวข้องครับ/ค่ะ ทริกเกอร์บางประเภทที่ได้มีการฟังเหตุการณ์แบบ Global อยู่แล้ว อาจไม่จำเป็นต้องใช้เมธอดทั้งสองนี้ครับ/ค่ะ ตัวอย่างเช่น ในทริกเกอร์แบบตั้งเวลา คุณสามารถลงทะเบียนตัวจับเวลาใน `on` และยกเลิกการลงทะเบียนใน `off` ได้ครับ/ค่ะ

### `Instruction`

คลาสพื้นฐานสำหรับประเภทคำสั่ง ใช้สำหรับขยายประเภทคำสั่งที่กำหนดเองครับ/ค่ะ

| พารามิเตอร์          | ประเภท                                                            | คำอธิบาย                               |
| ------------- | --------------------------------------------------------------- | ---------------------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Instruction` | คอนสตรักเตอร์                           |
| `run`         | `Runner`                                                        | ตรรกะการทำงานเมื่อเข้าสู่โหนดเป็นครั้งแรก             |
| `resume?`     | `Runner`                                                        | ตรรกะการทำงานเมื่อเข้าสู่โหนดหลังจากหยุดชะงักและกลับมาทำงานต่อ |
| `getScope?`   | `(node: FlowNodeModel, data: any, processor: Processor): any`   | ให้เนื้อหาตัวแปรโลคัลสำหรับ Branch ที่สร้างโดยโหนดที่เกี่ยวข้อง |

**ประเภทที่เกี่ยวข้อง**

```ts
export type Job =
  | {
      status: JOB_STATUS[keyof JOB_STATUS];
      result?: unknown;
      [key: string]: unknown;
    }
  | JobModel
  | null;

export type InstructionResult = Job | Promise<Job>;

export type Runner = (
  node: FlowNodeModel,
  input: JobModel,
  processor: Processor,
) => InstructionResult;

export class Instruction {
  run: Runner;
  resume?: Runner;
}
```

สำหรับ `getScope` คุณสามารถอ้างอิง[การนำไปใช้ของโหนด Loop](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-loop/src/server/LoopInstruction.ts#L83) ได้ครับ/ค่ะ ซึ่งใช้สำหรับให้เนื้อหาตัวแปรโลคัลสำหรับ Branch ต่างๆ ครับ/ค่ะ

### `EXECUTION_STATUS`

ตารางค่าคงที่สำหรับสถานะของแผนการทำงานเวิร์กโฟลว์ ใช้เพื่อระบุสถานะปัจจุบันของแผนการทำงานที่เกี่ยวข้องครับ/ค่ะ

| ชื่อค่าคงที่                          | ความหมาย                 |
| ------------------------------- | -------------------- |
| `EXECUTION_STATUS.QUEUEING`     | กำลังรอคิว               |
| `EXECUTION_STATUS.STARTED`      | กำลังทำงาน               |
| `EXECUTION_STATUS.RESOLVED`     | สำเร็จ                   |
| `EXECUTION_STATUS.FAILED`       | ล้มเหลว                 |
| `EXECUTION_STATUS.ERROR`        | เกิดข้อผิดพลาดในการทำงาน             |
| `EXECUTION_STATUS.ABORTED`      | ถูกยุติ               |
| `EXECUTION_STATUS.CANCELED`     | ถูกยกเลิก               |
| `EXECUTION_STATUS.REJECTED`     | ถูกปฏิเสธ               |
| `EXECUTION_STATUS.RETRY_NEEDED` | ทำงานไม่สำเร็จ ต้องลองใหม่ |

ยกเว้นสามสถานะแรก สถานะอื่นๆ ทั้งหมดแสดงถึงสถานะที่ล้มเหลว แต่สามารถใช้เพื่ออธิบายสาเหตุความล้มเหลวที่แตกต่างกันได้ครับ/ค่ะ

### `JOB_STATUS`

ตารางค่าคงที่สำหรับสถานะของงานโหนดเวิร์กโฟลว์ ใช้เพื่อระบุสถานะปัจจุบันของงานโหนดที่เกี่ยวข้องครับ/ค่ะ สถานะที่โหนดสร้างขึ้นจะส่งผลต่อสถานะของแผนการทำงานทั้งหมดด้วยครับ/ค่ะ

| ชื่อค่าคงที่                    | ความหมาย                                     |
| ------------------------- | ---------------------------------------- |
| `JOB_STATUS.PENDING`      | รอดำเนินการ: ทำงานมาถึงโหนดนี้แล้ว แต่คำสั่งต้องการให้หยุดรอ |
| `JOB_STATUS.RESOLVED`     | สำเร็จ                                 |
| `JOB_STATUS.FAILED`       | ล้มเหลว: การทำงานของโหนดนี้ไม่เป็นไปตามเงื่อนไขที่กำหนด         |
| `JOB_STATUS.ERROR`        | ข้อผิดพลาด: เกิดข้อผิดพลาดที่ไม่ได้ถูกจัดการในระหว่างการทำงานของโหนดนี้   |
| `JOB_STATUS.ABORTED`      | ถูกยุติ: โหนดนี้ถูกยุติการทำงานโดยตรรกะอื่นหลังจากอยู่ในสถานะรอ   |
| `JOB_STATUS.CANCELED`     | ถูกยกเลิก: โหนดนี้ถูกยกเลิกการทำงานด้วยตนเองหลังจากอยู่ในสถานะรอ       |
| `JOB_STATUS.REJECTED`     | ถูกปฏิเสธ: โหนดนี้ถูกปฏิเสธการทำงานต่อด้วยตนเองหลังจากอยู่ในสถานะรอ       |
| `JOB_STATUS.RETRY_NEEDED` | ทำงานไม่สำเร็จ ต้องลองใหม่                     |

## ฝั่งไคลเอ็นต์

API ที่มีให้ใช้งานในโครงสร้างแพ็กเกจฝั่งไคลเอ็นต์แสดงอยู่ในโค้ดด้านล่างนี้ครับ/ค่ะ:

```ts
import PluginWorkflowClient, {
  Trigger,
  Instruction,
} from '@nocobase/plugin-workflow/client';
```

### `PluginWorkflowClient`

#### `registerTrigger()`

ใช้สำหรับลงทะเบียนแผงการตั้งค่าสำหรับประเภททริกเกอร์ครับ/ค่ะ

**รูปแบบการเรียกใช้ (Signature)**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger): void`

**พารามิเตอร์**

| พารามิเตอร์      | ประเภท                        | คำอธิบาย                                 |
| --------- | --------------------------- | ------------------------------------ |
| `type`    | `string`                    | ตัวระบุประเภททริกเกอร์ ซึ่งต้องตรงกับตัวระบุที่ใช้ในการลงทะเบียน |
| `trigger` | `typeof Trigger \| Trigger` | ประเภทหรืออินสแตนซ์ของทริกเกอร์                     |

#### `registerInstruction()`

ใช้สำหรับลงทะเบียนแผงการตั้งค่าสำหรับประเภทโหนดครับ/ค่ะ

**รูปแบบการเรียกใช้ (Signature)**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction): void`

**พารามิเตอร์**

| พารามิเตอร์          | ประเภท                                | คำอธิบาย                               |
| ------------- | ----------------------------------- | ---------------------------------- |
| `type`        | `string`                            | ตัวระบุประเภทโหนด ซึ่งต้องตรงกับตัวระบุที่ใช้ในการลงทะเบียน |
| `instruction` | `typeof Instruction \| Instruction` | ประเภทหรืออินสแตนซ์ของโหนด                     |

#### `registerInstructionGroup()`

ใช้สำหรับลงทะเบียนกลุ่มประเภทโหนดครับ/ค่ะ NocoBase มีกลุ่มประเภทโหนดเริ่มต้นให้ 4 กลุ่มดังนี้ครับ/ค่ะ:

* `'control'` : กลุ่มควบคุม
* `'collection'` : กลุ่มการดำเนินการคอลเลกชัน
* `'manual'` : กลุ่มการประมวลผลด้วยตนเอง
* `'extended'` : กลุ่มส่วนขยายอื่นๆ

หากคุณต้องการขยายกลุ่มอื่นๆ สามารถใช้วิธีนี้ในการลงทะเบียนได้ครับ/ค่ะ

**รูปแบบการเรียกใช้ (Signature)**

`registerInstructionGroup(type: string, group: { label: string }): void`

**พารามิเตอร์**

| พารามิเตอร์      | ประเภท               | คำอธิบาย                           |
| --------- | ----------------- | ----------------------------- |
| `type`    | `string`          | ตัวระบุกลุ่มโหนด ซึ่งต้องตรงกับตัวระบุที่ใช้ในการลงทะเบียน |
| `group` | `{ label: string }` | ข้อมูลกลุ่ม ซึ่งปัจจุบันมีเพียงชื่อเรื่องเท่านั้น         |

**ตัวอย่าง**

```js
export default class YourPluginClient extends Plugin {
  load() {
    const pluginWorkflow = this.app.pm.get(PluginWorkflowClient);

    pluginWorkflow.registerInstructionGroup('ai', { label: `{{t("AI", { ns: "${NAMESPACE}" })}}` });
  }
}
```

### `Trigger`

คลาสพื้นฐานสำหรับทริกเกอร์ ใช้สำหรับขยายประเภททริกเกอร์ที่กำหนดเองครับ/ค่ะ

| พารามิเตอร์            | ประเภท                                                             | คำอธิบาย                               |
| --------------- | ---------------------------------------------------------------- | ---------------------------------- |
| `title`         | `string`                                                         | ชื่อประเภททริกเกอร์                     |
| `fieldset`      | `{ [key: string]: ISchema }`                                     | ชุดรายการตั้งค่าทริกเกอร์                   |
| `scope?`        | `{ [key: string]: any }`                                         | ชุดอ็อบเจกต์ที่อาจใช้ใน Schema ของรายการตั้งค่า |
| `components?`   | `{ [key: string]: React.FC }`                                    | ชุดคอมโพเนนต์ที่อาจใช้ใน Schema ของรายการตั้งค่า |
| `useVariables?` | `(config: any, options: UseVariableOptions ) => VariableOptions` | ตัวเข้าถึงค่าสำหรับข้อมูลบริบทของทริกเกอร์           |

- หากไม่ได้ตั้งค่า `useVariables` หมายความว่าทริกเกอร์ประเภทนี้ไม่มีฟังก์ชันการดึงค่า และข้อมูลบริบทของทริกเกอร์จะไม่สามารถเลือกได้ในโหนดของเวิร์กโฟลว์ครับ/ค่ะ

### `Instruction`

คลาสพื้นฐานสำหรับคำสั่ง ใช้สำหรับขยายประเภทโหนดที่กำหนดเองครับ/ค่ะ

| พารามิเตอร์                 | ประเภท                                                    | คำอธิบาย                                                                           |
| -------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `group`              | `string`                                                | ตัวระบุกลุ่มประเภทโหนด ปัจจุบันเลือกได้: `'control'`/`'collection'`/`'manual'`/`'extended'` |
| `fieldset`           | `Record<string, ISchema>`                               | ชุดรายการตั้งค่าโหนด                                                                 |
| `scope?`             | `Record<string, Function>`                              | ชุดอ็อบเจกต์ที่อาจใช้ใน Schema ของรายการตั้งค่า                                             |
| `components?`        | `Record<string, React.FC>`                              | ชุดคอมโพเนนต์ที่อาจใช้ใน Schema ของรายการตั้งค่า                                             |
| `Component?`         | `React.FC`                                              | คอมโพเนนต์สำหรับเรนเดอร์โหนดแบบกำหนดเอง                                                             |
| `useVariables?`      | `(node, options: UseVariableOptions) => VariableOption` | เมธอดสำหรับโหนดเพื่อระบุตัวเลือกตัวแปรโหนด                                                     |
| `useScopeVariables?` | `(node, options?) => VariableOptions`                   | เมธอดสำหรับโหนดเพื่อระบุตัวเลือกตัวแปรโลคัลของ Branch                                                 |
| `useInitializers?`   | `(node) => SchemaInitializerItemType`                   | เมธอดสำหรับโหนดเพื่อระบุตัวเลือก Initializer                                                  |
| `isAvailable?`       | `(ctx: NodeAvailableContext) => boolean`                | เมธอดสำหรับตรวจสอบว่าโหนดพร้อมใช้งานหรือไม่                                                         |

**ประเภทที่เกี่ยวข้อง**

```ts
export type NodeAvailableContext = {
  workflow: object;
  upstream: object;
  branchIndex: number;
};
```

- หากไม่ได้ตั้งค่า `useVariables` หมายความว่าโหนดประเภทนี้ไม่มีฟังก์ชันการดึงค่า และข้อมูลผลลัพธ์ของโหนดประเภทนี้จะไม่สามารถเลือกได้ในโหนดของเวิร์กโฟลว์ครับ/ค่ะ หากค่าผลลัพธ์เป็นค่าเดียว (ไม่สามารถเลือกได้) คุณสามารถส่งคืนเนื้อหาแบบ Static ที่แสดงข้อมูลที่เกี่ยวข้องได้เลยครับ/ค่ะ (ดูตัวอย่าง: [ซอร์สโค้ดโหนดการคำนวณ](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/calculation.tsx#L68)) หากต้องการให้เลือกได้ (เช่น คุณสมบัติบางอย่างใน Object) คุณสามารถกำหนดเอาต์พุตคอมโพเนนต์การเลือกที่เกี่ยวข้องได้เองครับ/ค่ะ (ดูตัวอย่าง: [ซอร์สโค้ดโหนดสร้างข้อมูล](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/create.tsx#L41))
- `Component` คือคอมโพเนนต์สำหรับเรนเดอร์โหนดแบบกำหนดเองครับ/ค่ะ เมื่อการเรนเดอร์โหนดเริ่มต้นไม่เพียงพอ สามารถใช้ `Component` นี้เพื่อแทนที่และเรนเดอร์มุมมองโหนดแบบกำหนดเองได้อย่างสมบูรณ์ครับ/ค่ะ ตัวอย่างเช่น หากคุณต้องการเพิ่มปุ่มการทำงานหรือการโต้ตอบอื่นๆ ให้กับโหนดเริ่มต้นของประเภท Branch คุณจะต้องใช้วิธีนี้ครับ/ค่ะ (ดูตัวอย่าง: [ซอร์สโค้ด Parallel Branch](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-parallel/src/client/ParallelInstruction.tsx))
- `useInitializers` ใช้สำหรับระบุเมธอดในการเริ่มต้นบล็อกครับ/ค่ะ ตัวอย่างเช่น ในโหนด Manual คุณสามารถเริ่มต้นบล็อกผู้ใช้ที่เกี่ยวข้องได้โดยอิงจากโหนด Upstream ครับ/ค่ะ หากมีการระบุเมธอดนี้ จะสามารถใช้งานได้เมื่อเริ่มต้นบล็อกในการตั้งค่าอินเทอร์เฟซของโหนด Manual ครับ/ค่ะ (ดูตัวอย่าง: [ซอร์สโค้ดโหนดสร้างข้อมูล](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/create.tsx#L71))
- `isAvailable` ใช้หลักๆ เพื่อตรวจสอบว่าโหนดสามารถใช้งาน (เพิ่ม) ได้ในสภาพแวดล้อมปัจจุบันหรือไม่ครับ/ค่ะ สภาพแวดล้อมปัจจุบันประกอบด้วยเวิร์กโฟลว์ปัจจุบัน โหนด Upstream และดัชนี Branch ปัจจุบัน เป็นต้นครับ/ค่ะ