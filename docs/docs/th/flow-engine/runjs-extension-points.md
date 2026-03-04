:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/flow-engine/runjs-extension-points)
:::

# จุดขยายปลั๊กอิน RunJS (เอกสาร ctx / Snippets / การแมปสถานการณ์)

เมื่อปลั๊กอินเพิ่มหรือขยายความสามารถของ RunJS แนะนำให้ลงทะเบียน "การแมปบริบท (Context Mapping) / เอกสาร `ctx` / โค้ดตัวอย่าง" ผ่าน **จุดขยายอย่างเป็นทางการ (Official Extension Points)** เพื่อให้:

- CodeEditor สามารถเติมโค้ดอัตโนมัติ (Auto-completion) สำหรับ `ctx.xxx.yyy` ได้
- การเขียนโค้ดด้วย AI สามารถรับข้อมูลอ้างอิง API ของ `ctx` ที่มีโครงสร้างชัดเจนพร้อมตัวอย่าง

บทนี้จะแนะนำจุดขยายสองจุด ได้แก่:

- `registerRunJSContextContribution(...)`
- `registerRunJSSnippet(...)`

## 1. `registerRunJSContextContribution`

ใช้สำหรับลงทะเบียน "ส่วนร่วม" (contribution) ของ RunJS โดยมีการใช้งานทั่วไปดังนี้:

- เพิ่มหรือเขียนทับการแมป `RunJSContextRegistry` (`modelClass` -> `RunJSContext` รวมถึง `scenes`)
- ขยาย `RunJSDocMeta` (คำอธิบาย/ตัวอย่าง/เทมเพลตการเติมโค้ดของ API `ctx`) สำหรับ `FlowRunJSContext` หรือ RunJSContext ที่กำหนดเอง

### คำอธิบายพฤติกรรม

- Contribution จะถูกเรียกใช้พร้อมกันในช่วง `setupRunJSContexts()`
- หาก `setupRunJSContexts()` เสร็จสิ้นไปแล้ว **การลงทะเบียนภายหลังจะถูกเรียกใช้ทันทีหนึ่งครั้ง** (โดยไม่ต้องรัน setup ใหม่)
- แต่ละ contribution จะถูกเรียกใช้ **ไม่เกินหนึ่งครั้ง** สำหรับแต่ละ `RunJSVersion`

### ตัวอย่าง: การเพิ่มบริบทโมเดลที่สามารถเขียน JS ได้

```ts
import { registerRunJSContextContribution, FlowRunJSContext, RunJSContextRegistry } from '@nocobase/flow-engine';

registerRunJSContextContribution(({ version, FlowRunJSContext: BaseCtx, RunJSContextRegistry: Registry }) => {
  if (version !== 'v1') return;

  class MyPluginRunJSContext extends BaseCtx {}

  // 1) เอกสาร ctx / การเติมโค้ด (RunJSDocMeta)
  MyPluginRunJSContext.define({
    label: 'MyPlugin RunJS context',
    properties: {
      myPlugin: {
        description: 'My plugin namespace',
        detail: 'object',
        properties: {
          hello: {
            description: 'Say hello',
            detail: '(name: string) => string',
            completion: { insertText: `ctx.myPlugin.hello('World')` },
          },
        },
      },
    },
  });

  // 2) การแมป model -> context (scene มีผลต่อการเติมโค้ดใน Editor และการกรอง snippets)
  Registry.register('v1', 'MyPluginJSModel', MyPluginRunJSContext, { scenes: ['block'] });
});
```

## 2. `registerRunJSSnippet`

ใช้สำหรับลงทะเบียนสนิปเพ็ต (snippets) โค้ดตัวอย่างของ RunJS เพื่อใช้สำหรับ:

- การเติมสนิปเพ็ตใน CodeEditor
- เป็นตัวอย่างหรือข้อมูลอ้างอิงสำหรับการเขียนโค้ดด้วย AI (สามารถกรองตามสถานการณ์/เวอร์ชัน/ภาษาได้)

### การตั้งชื่อ ref ที่แนะนำ

แนะนำให้ใช้รูปแบบ: `plugin/<pluginName>/<topic>` ตัวอย่างเช่น:

- `plugin/plugin-my/foo`
- `plugin/plugin-my/api-request-example`

เพื่อหลีกเลี่ยงความขัดแย้งกับ `global/*` หรือ `scene/*` ของระบบหลัก (core)

### กลยุทธ์เมื่อเกิดความขัดแย้ง

- โดยค่าเริ่มต้นจะไม่เขียนทับ `ref` ที่มีอยู่แล้ว (จะคืนค่าเป็น `false` แต่ไม่แสดงข้อผิดพลาด)
- หากต้องการเขียนทับ ให้ส่งพารามิเตอร์ `{ override: true }` อย่างชัดเจน

### ตัวอย่าง: การลงทะเบียนสนิปเพ็ต

```ts
import { registerRunJSSnippet } from '@nocobase/flow-engine';

registerRunJSSnippet('plugin/plugin-my/hello', async () => ({
  default: {
    label: 'Hello (My Plugin)',
    description: 'Minimal example for my plugin',
    prefix: 'my-hello',
    versions: ['v1'],
    scenes: ['block'],
    contexts: ['*'],
    content: `
// My plugin snippet
ctx.message.success('Hello from plugin');
`,
  },
}));
```

## 3. แนวทางปฏิบัติที่ดีที่สุด (Best Practices)

- **แยกการดูแลเอกสารและสนิปเพ็ต**:
  - `RunJSDocMeta`: ใช้สำหรับคำอธิบายและเทมเพลตการเติมโค้ด (สั้นและมีโครงสร้าง)
  - Snippets: ใช้สำหรับตัวอย่างโค้ดขนาดยาว (นำกลับมาใช้ใหม่ได้ และกรองตาม scene/version ได้)
- **หลีกเลี่ยง Prompt ที่ยาวเกินไป**: ตัวอย่างโค้ดไม่ควรมีมากเกินไป ควรเน้นไปที่ "เทมเพลตที่ทำงานได้จริงและเรียบง่ายที่สุด"
- **ลำดับความสำคัญของสถานการณ์ (Scene)**: หากโค้ด JS ของคุณทำงานในสถานการณ์อย่างฟอร์มหรือตารางเป็นหลัก โปรดระบุ `scenes` ให้ถูกต้อง เพื่อเพิ่มความเกี่ยวข้องของการเติมโค้ดและตัวอย่าง

## 4. การซ่อนการเติมโค้ดตาม ctx จริง: `hidden(ctx)`

API ของ `ctx` บางตัวมีความเฉพาะเจาะจงตามสถานการณ์สูง (เช่น `ctx.popup` จะใช้งานได้เมื่อเปิดหน้าต่างป๊อปอัปหรือลิ้นชักเท่านั้น) เมื่อคุณต้องการซ่อน API ที่ใช้งานไม่ได้เหล่านี้ในขณะเติมโค้ด คุณสามารถกำหนด `hidden(ctx)` ใน `RunJSDocMeta` สำหรับรายการที่เกี่ยวข้อง:

- คืนค่า `true`: ซ่อนโหนดปัจจุบันและโหนดย่อยทั้งหมด
- คืนค่า `string[]`: ซ่อนเส้นทางย่อย (sub-path) ที่ระบุภายใต้โหนดปัจจุบัน (รองรับการคืนค่าหลายเส้นทางพร้อมกัน, เส้นทางเป็นแบบสัมพัทธ์, ซ่อนโหนดย่อยตามการจับคู่คำนำหน้า)

`hidden(ctx)` รองรับ `async`: คุณสามารถใช้ `await ctx.getVar('ctx.xxx')` เพื่อตัดสินใจได้ (ขึ้นอยู่กับดุลยพินิจของผู้ใช้) แนะนำให้ทำให้การทำงานรวดเร็วและไม่มีผลข้างเคียง (เช่น ไม่ควรส่งคำขอผ่านเครือข่าย)

ตัวอย่าง: แสดงการเติมโค้ด `ctx.popup.*` เฉพาะเมื่อมี `popup.uid` อยู่จริง

```ts
FlowRunJSContext.define({
  properties: {
    popup: {
      description: 'Popup context (async)',
      hidden: async (ctx) => !(await ctx.getVar('ctx.popup'))?.uid,
      properties: {
        uid: 'Popup uid',
      },
    },
  },
});
```

ตัวอย่าง: popup ใช้งานได้แต่ซ่อนบางเส้นทางย่อย (เฉพาะเส้นทางสัมพัทธ์ เช่น ซ่อน `record` และ `parent.record`)

```ts
FlowRunJSContext.define({
  properties: {
    popup: {
      description: 'Popup context (async)',
      hidden: async (ctx) => {
        const popup = await ctx.getVar('ctx.popup');
        if (!popup?.uid) return true;
        const hidden: string[] = [];
        if (!popup?.record) hidden.push('record');
        if (!popup?.parent?.record) hidden.push('parent.record');
        return hidden;
      },
      properties: {
        uid: 'Popup uid',
        record: 'Popup record',
        parent: {
          properties: {
            record: 'Parent record',
          },
        },
      },
    },
  },
});
```

หมายเหตุ: CodeEditor จะเปิดใช้งานการกรองการเติมโค้ดตาม `ctx` จริงเสมอ (แบบ fail-open คือไม่แสดงข้อผิดพลาดหากล้มเหลว)

## 5. ข้อมูล `info/meta` ขณะรันไทม์ และ API ข้อมูลบริบท (สำหรับเติมโค้ดและ AI)

นอกจากการดูแลเอกสาร `ctx` แบบคงที่ (static) ผ่าน `FlowRunJSContext.define()` แล้ว คุณยังสามารถแทรก **info/meta** ในขณะรันไทม์ผ่าน `FlowContext.defineProperty/defineMethod` และส่งออกข้อมูลบริบทที่ **สามารถทำเป็นซีเรียลไลซ์ (serializable)** ผ่าน API ต่อไปนี้ เพื่อให้ CodeEditor หรือ AI ใช้งานได้:

- `await ctx.getApiInfos(options?)`: ข้อมูล API แบบคงที่
- `await ctx.getVarInfos(options?)`: ข้อมูลโครงสร้างตัวแปร (มาจาก `meta`, รองรับการขยายตาม path/maxDepth)
- `await ctx.getEnvInfos()`: ภาพรวม (snapshot) ของสภาพแวดล้อมขณะรันไทม์

### 5.1 `defineMethod(name, fn, info?)`

`info` รองรับฟิลด์ต่อไปนี้ (ทั้งหมดเป็นทางเลือก):

- `description` / `detail` / `examples`
- `ref: string | { url: string; title?: string }`
- `params` / `returns` (คล้ายกับ JSDoc)

> หมายเหตุ: ผลลัพธ์จาก `getApiInfos()` คือเอกสาร API แบบคงที่ และจะไม่รวมฟิลด์อย่าง `deprecated` / `disabled` / `disabledReason`

ตัวอย่าง: การระบุลิงก์เอกสารสำหรับ `ctx.refreshTargets()`

```ts
ctx.defineMethod('refreshTargets', async () => {
  // ...
}, {
  description: 'รีเฟรชข้อมูลของบล็อกเป้าหมาย',
  detail: '() => Promise<void>',
  ref: { url: 'https://docs.nocobase.com/', title: 'Docs' },
});
```

### 5.2 `defineProperty(key, { meta?, info? })`

- `meta`: ใช้สำหรับ UI ตัวเลือกตัวแปร (`getPropertyMetaTree` / `FlowContextSelector`) เพื่อกำหนดการแสดงผล, โครงสร้างต้นไม้, การปิดใช้งาน ฯลฯ (รองรับฟังก์ชัน/async)
  - ฟิลด์ที่ใช้บ่อย: `title` / `type` / `properties` / `sort` / `hidden` / `disabled` / `disabledReason` / `buildVariablesParams`
- `info`: ใช้สำหรับเอกสาร API แบบคงที่ (`getApiInfos`) และคำอธิบายสำหรับ AI โดยไม่ส่งผลต่อ UI ตัวเลือกตัวแปร (รองรับฟังก์ชัน/async)
  - ฟิลด์ที่ใช้บ่อย: `title` / `type` / `interface` / `description` / `examples` / `ref` / `params` / `returns`

เมื่อระบุเฉพาะ `meta` (โดยไม่ได้ระบุ `info`):

- `getApiInfos()` จะไม่คืนค่าคีย์นี้ (เนื่องจากเอกสาร API แบบคงที่จะไม่คาดการณ์จาก `meta`)
- `getVarInfos()` จะสร้างโครงสร้างตัวแปรตาม `meta` (ใช้สำหรับตัวเลือกตัวแปร/ต้นไม้ตัวแปรแบบไดนามิก)

### 5.3 API ข้อมูลบริบท

ใช้สำหรับส่งออก "ข้อมูลความสามารถของบริบทที่ใช้งานได้"

```ts
type FlowContextInfosEnvNode = {
  description?: string;
  getVar?: string; // สามารถใช้ใน await ctx.getVar(getVar) ได้โดยตรง แนะนำให้ขึ้นต้นด้วย "ctx."
  value?: any; // ค่าคงที่ที่ถูกประมวลผลแล้ว (serializable, จะคืนค่าเฉพาะเมื่อสามารถคาดการณ์ได้)
  properties?: Record<string, FlowContextInfosEnvNode>;
};

type FlowContextApiInfos = Record<string, any>; // เอกสารแบบคงที่ (ระดับบนสุด)
type FlowContextVarInfos = Record<string, any>; // โครงสร้างตัวแปร (ขยายตาม path/maxDepth ได้)
type FlowContextEnvInfos = {
  popup?: FlowContextInfosEnvNode;
  block?: FlowContextInfosEnvNode;
  flowModel?: FlowContextInfosEnvNode;
  resource?: FlowContextInfosEnvNode;
  record?: FlowContextInfosEnvNode;
  currentViewBlocks?: FlowContextInfosEnvNode;
};
```

พารามิเตอร์ที่ใช้บ่อย:

- `getApiInfos({ version })`: เวอร์ชันเอกสาร RunJS (ค่าเริ่มต้นคือ `v1`)
- `getVarInfos({ path, maxDepth })`: การตัดทอนและระดับการขยายสูงสุด (ค่าเริ่มต้นคือ 3)

หมายเหตุ: ผลลัพธ์ที่ได้จาก API ข้างต้นจะไม่มีฟังก์ชันรวมอยู่ด้วย จึงเหมาะสำหรับการทำเป็นซีเรียลไลซ์เพื่อส่งให้ AI โดยตรง

### 5.4 `await ctx.getVar(path)`

เมื่อคุณมีเพียง "สตริงเส้นทางตัวแปร" (เช่น จากการตั้งค่าหรือการป้อนข้อมูลของผู้ใช้) และต้องการรับค่ารันไทม์ของตัวแปรนั้นโดยตรง สามารถใช้ `getVar` ได้:

- ตัวอย่าง: `const v = await ctx.getVar('ctx.record.roles.id')`
- `path` คือเส้นทางนิพจน์ที่ขึ้นต้นด้วย `ctx.` (เช่น `ctx.record.id` / `ctx.record.roles[0].id`)

นอกจากนี้: เมธอดหรือคุณสมบัติที่ขึ้นต้นด้วยเครื่องหมายขีดล่าง `_` จะถูกถือว่าเป็นสมาชิกส่วนตัว (private members) และจะไม่ปรากฏในผลลัพธ์ของ `getApiInfos()` หรือ `getVarInfos()` ครับ