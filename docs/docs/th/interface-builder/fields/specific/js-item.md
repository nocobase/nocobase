:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# JS Item

## บทนำ

JS Item ใช้สำหรับ "รายการที่กำหนดเอง" (custom items) ในฟอร์ม ซึ่งไม่ได้ผูกกับฟิลด์ใดๆ ครับ คุณสามารถใช้ JavaScript/JSX เพื่อเรนเดอร์เนื้อหาใดๆ ก็ได้ เช่น คำแนะนำ, สถิติ, การแสดงตัวอย่าง, ปุ่มต่างๆ และยังสามารถโต้ตอบกับฟอร์มและบริบทของเรคคอร์ดได้ด้วย เหมาะสำหรับสถานการณ์ที่ต้องการแสดงตัวอย่างแบบเรียลไทม์, คำแนะนำ หรือคอมโพเนนต์แบบโต้ตอบขนาดเล็กครับ

![jsitem-add-20251929](https://static-docs.nocobase.com/jsitem-add-20251929.png)

## Runtime Context API (ที่ใช้บ่อย)

- `ctx.element`: DOM container (ElementProxy) ของรายการปัจจุบัน รองรับ `innerHTML`, `querySelector`, `addEventListener` และอื่นๆ ครับ
- `ctx.form`: AntD Form instance ที่สามารถใช้ `getFieldValue / getFieldsValue / setFieldsValue / validateFields` และอื่นๆ ได้ครับ
- `ctx.blockModel`: โมเดลของบล็อกฟอร์มที่ JS Item อยู่ ซึ่งสามารถฟังเหตุการณ์ `formValuesChange` เพื่อสร้างการทำงานแบบเชื่อมโยง (linkage) ได้ครับ
- `ctx.record` / `ctx.collection`: เรคคอร์ดปัจจุบันและเมตาดาต้าของ คอลเลกชัน (ใช้ได้ในบางสถานการณ์) ครับ
- `ctx.requireAsync(url)`: โหลดไลบรารี AMD/UMD แบบอะซิงโครนัสด้วย URL ครับ
- `ctx.importAsync(url)`: อิมพอร์ตโมดูล ESM แบบไดนามิกด้วย URL ครับ
- `ctx.openView(viewUid, options)`: เปิดวิว (view) ที่ตั้งค่าไว้ (เช่น ลิ้นชัก (drawer), กล่องโต้ตอบ (dialog), หรือหน้าเพจ) ครับ
- `ctx.message` / `ctx.notification`: ข้อความแจ้งเตือนและประกาศแบบ Global ครับ
- `ctx.t()` / `ctx.i18n.t()`: สำหรับการทำ Internationalization ครับ
- `ctx.onRefReady(ctx.ref, cb)`: เรนเดอร์หลังจากคอนเทนเนอร์พร้อมใช้งานแล้วครับ
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: ไลบรารีทั่วไปที่มาพร้อมกับระบบ เช่น React, ReactDOM, Ant Design, Ant Design icons และ dayjs สำหรับการเรนเดอร์ JSX และการจัดการเวลาครับ (ส่วน `ctx.React` / `ctx.ReactDOM` / `ctx.antd` ยังคงเก็บไว้เพื่อความเข้ากันได้)
- `ctx.render(vnode)`: เรนเดอร์ React element/HTML/DOM ไปยังคอนเทนเนอร์เริ่มต้น `ctx.element` ครับ การเรนเดอร์หลายครั้งจะใช้ Root เดิมซ้ำ และเขียนทับเนื้อหาที่มีอยู่ในคอนเทนเนอร์ครับ

## Editor และ Snippets

- `Snippets`: เปิดรายการโค้ด Snippets ที่มาพร้อมกับระบบ ซึ่งคุณสามารถค้นหาและแทรกไปยังตำแหน่งเคอร์เซอร์ปัจจุบันได้ด้วยคลิกเดียวครับ
- `Run`: รันโค้ดปัจจุบันโดยตรง และแสดงผลลัพธ์การทำงานในพาเนล `Logs` ด้านล่างครับ รองรับ `console.log/info/warn/error` และการไฮไลต์ตำแหน่งข้อผิดพลาดด้วยครับ

![jsitem-toolbars-20251029](https://static-docs.nocobase.com/jsitem-toolbars-20251029.png)

- สามารถใช้ร่วมกับ AI Employee เพื่อสร้าง/แก้ไขสคริปต์ได้ครับ: [AI Employee · Nathan: วิศวกร Frontend](/ai-employees/built-in/ai-coding)

## การใช้งานทั่วไป (ตัวอย่างแบบย่อ)

### 1) การแสดงตัวอย่างแบบเรียลไทม์ (อ่านค่าจากฟอร์ม)

```js
const render = () => {
  const { price = 0, quantity = 1, discount = 0 } = ctx.form.getFieldsValue();
  const total = Number(price) * Number(quantity);
  const final = total * (1 - Number(discount || 0));
  ctx.render(
    <div style={{ padding: 8, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}>
      <div style={{ fontWeight: 600, color: '#389e0d' }}>{ctx.t('Payable:')} ¥{(final || 0).toFixed(2)}</div>
    </div>
  );
};
render();
ctx.blockModel?.on?.('formValuesChange', () => render());
```

### 2) เปิดวิว (View) (ลิ้นชัก)

```js
ctx.render(
  <a onClick={async () => {
    const popupUid = ctx.model.uid + '-preview';
    await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Preview'), size: 'large' });
  }}>
    {ctx.t('Open preview')}
  </a>
);
```

### 3) โหลดและเรนเดอร์ไลบรารีภายนอก

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.form.getFieldValue('title') ?? ''))}</span>);
```

## ข้อควรระวัง

- แนะนำให้ใช้ CDN ที่เชื่อถือได้สำหรับการโหลดไลบรารีภายนอกครับ และควรมีกลไกสำรองในกรณีที่เกิดข้อผิดพลาด (เช่น `if (!lib) return;`)
- สำหรับ Selector แนะนำให้ใช้ `class` หรือ `[name=...]` เป็นหลักครับ และหลีกเลี่ยงการใช้ `id` แบบตายตัว เพื่อป้องกัน `id` ซ้ำกันในบล็อกหรือป๊อปอัปหลายๆ อัน
- การจัดการ Event: การเปลี่ยนแปลงค่าในฟอร์มบ่อยครั้งจะทำให้เกิดการเรนเดอร์หลายครั้งครับ ก่อนที่จะผูก Event ควรมีการเคลียร์หรือป้องกันการซ้ำซ้อน (เช่น การ `remove` ก่อนแล้วค่อย `add`, การใช้ `{ once: true }`, หรือการใช้ `dataset` เพื่อทำเครื่องหมายป้องกันการซ้ำ)

## เอกสารที่เกี่ยวข้อง

- [ตัวแปรและ Context](/interface-builder/variables)
- [กฎการเชื่อมโยง (Linkage Rules)](/interface-builder/linkage-rule)
- [วิว (Views) และป๊อปอัป](/interface-builder/actions/types/view)