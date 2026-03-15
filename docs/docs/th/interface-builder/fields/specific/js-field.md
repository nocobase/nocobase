:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/interface-builder/fields/specific/js-field)
:::

# JS Field

## บทนำ

JS Field ใช้สำหรับปรับแต่งการแสดงผลเนื้อหาด้วย JavaScript ในตำแหน่งฟิลด์ มักพบในบล็อกรายละเอียด, รายการแบบอ่านอย่างเดียวของฟอร์ม หรือ "รายการที่กำหนดเองอื่น ๆ" ในคอลัมน์ตาราง เหมาะสำหรับการแสดงผลแบบเฉพาะตัว, การรวมข้อมูลที่สืบทอดมา, ป้ายสถานะ, Rich Text หรือการเรนเดอร์แผนภูมิ เป็นต้นครับ/ค่ะ

![jsfield-readonly-add-20251029](https://static-docs.nocobase.com/jsfield-readonly-add-20251029.png)

## ประเภท

- ประเภทอ่านอย่างเดียว: ใช้สำหรับการแสดงผลที่แก้ไขไม่ได้ โดยอ่าน `ctx.value` เพื่อเรนเดอร์เอาต์พุตครับ/ค่ะ
- ประเภทแก้ไขได้: ใช้สำหรับการโต้ตอบอินพุตที่กำหนดเอง โดยมี `ctx.getValue()`/`ctx.setValue(v)` และเหตุการณ์คอนเทนเนอร์ `js-field:value-change` เพื่อความสะดวกในการซิงโครไนซ์ค่าฟอร์มแบบสองทางครับ/ค่ะ

## กรณีการใช้งาน

- ประเภทอ่านอย่างเดียว
  - บล็อกรายละเอียด: แสดงผลลัพธ์การคำนวณ, ป้ายสถานะ, ส่วนของ Rich Text, แผนภูมิ และเนื้อหาอ่านอย่างเดียวอื่น ๆ ครับ/ค่ะ
  - บล็อกตาราง: ใช้เป็น "คอลัมน์ที่กำหนดเองอื่น ๆ > JS Field" สำหรับการแสดงผลแบบอ่านอย่างเดียว (หากต้องการคอลัมน์ที่ไม่ผูกกับฟิลด์ โปรดใช้ JS Column ครับ/ค่ะ)

- ประเภทแก้ไขได้
  - บล็อกฟอร์ม (CreateForm/EditForm): ใช้สำหรับตัวควบคุมอินพุตที่กำหนดเองหรืออินพุตแบบผสม ซึ่งจะถูกตรวจสอบและส่งไปพร้อมกับฟอร์มครับ/ค่ะ
  - สถานการณ์ที่เหมาะสม: คอมโพเนนต์อินพุตจากไลบรารีภายนอก, ตัวแก้ไข Rich Text/โค้ด, คอมโพเนนต์ไดนามิกที่ซับซ้อน เป็นต้นครับ/ค่ะ

## Runtime Context API

โค้ดรันไทม์ของ JS Field สามารถใช้ความสามารถของบริบท (Context) ต่อไปนี้ได้โดยตรงครับ/ค่ะ:

- `ctx.element`: คอนเทนเนอร์ DOM ของฟิลด์ (ElementProxy) รองรับ `innerHTML`, `querySelector`, `addEventListener` เป็นต้นครับ/ค่ะ
- `ctx.value`: ค่าฟิลด์ปัจจุบัน (อ่านอย่างเดียว) ครับ/ค่ะ
- `ctx.record`: ออบเจกต์เรคคอร์ดปัจจุบัน (อ่านอย่างเดียว) ครับ/ค่ะ
- `ctx.collection`: เมตาข้อมูลของคอลเลกชันที่ฟิลด์สังกัดอยู่ (อ่านอย่างเดียว) ครับ/ค่ะ
- `ctx.requireAsync(url)`: โหลดไลบรารี AMD/UMD แบบอะซิงโครนัสตาม URL ครับ/ค่ะ
- `ctx.importAsync(url)`: นำเข้าโมดูล ESM แบบไดนามิกตาม URL ครับ/ค่ะ
- `ctx.openView(options)`: เปิดมุมมองที่กำหนดค่าไว้ (ป๊อปอัป/ลิ้นชัก/หน้า) ครับ/ค่ะ
- `ctx.i18n.t()` / `ctx.t()`: การทำให้เป็นสากลครับ/ค่ะ
- `ctx.onRefReady(ctx.ref, cb)`: เรนเดอร์หลังจากคอนเทนเนอร์พร้อมแล้วครับ/ค่ะ
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: ไลบรารีในตัว เช่น React / ReactDOM / Ant Design / Ant Design Icons / dayjs / lodash / math.js / formula.js สำหรับการเรนเดอร์ JSX, การจัดการเวลา, การดำเนินการข้อมูล และการคำนวณทางคณิตศาสตร์ครับ/ค่ะ (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` ยังคงถูกเก็บไว้เพื่อความเข้ากันได้ครับ/ค่ะ)
- `ctx.render(vnode)`: เรนเดอร์องค์ประกอบ React, สตริง HTML หรือโหนด DOM ไปยังคอนเทนเนอร์เริ่มต้น `ctx.element` การเรนเดอร์ซ้ำจะใช้ Root เดิมและเขียนทับเนื้อหาที่มีอยู่ในคอนเทนเนอร์ครับ/ค่ะ

คุณสมบัติเฉพาะของประเภทแก้ไขได้ (JSEditableField):

- `ctx.getValue()`: รับค่าฟอร์มปัจจุบัน (ลำดับความสำคัญคือสถานะฟอร์มก่อน แล้วจึงย้อนกลับไปที่ props ของฟิลด์) ครับ/ค่ะ
- `ctx.setValue(v)`: ตั้งค่าฟอร์มและ props ของฟิลด์ เพื่อรักษาการซิงโครไนซ์แบบสองทางครับ/ค่ะ
- เหตุการณ์คอนเทนเนอร์ `js-field:value-change`: ทริกเกอร์เมื่อค่าภายนอกเปลี่ยนแปลง เพื่อให้สคริปต์อัปเดตการแสดงผลอินพุตได้ง่ายขึ้นครับ/ค่ะ

## ตัวแก้ไขและสนิปเปต

ตัวแก้ไขสคริปต์ของ JS Field รองรับการเน้นไวยากรณ์, การแจ้งเตือนข้อผิดพลาด และโค้ดสนิปเปต (Snippets) ในตัวครับ/ค่ะ

- `Snippets`: เปิดรายการโค้ดสนิปเปตในตัว สามารถค้นหาและแทรกไปยังตำแหน่งเคอร์เซอร์ปัจจุบันได้ในคลิกเดียวครับ/ค่ะ
- `Run`: รันโค้ดปัจจุบันโดยตรง บันทึกการรันจะแสดงที่แผง `Logs` ด้านล่าง รองรับ `console.log/info/warn/error` และการเน้นตำแหน่งข้อผิดพลาดครับ/ค่ะ

![jsfield-readonly-toolbars-20251029](https://static-docs.nocobase.com/jsfield-readonly-toolbars-20251029.png)

สามารถใช้ร่วมกับพนักงาน AI เพื่อสร้างโค้ดได้ครับ/ค่ะ:

- [พนักงาน AI · Nathan: วิศวกรส่วนหน้า](/ai-employees/features/built-in-employee)

## การใช้งานทั่วไป

### 1) การเรนเดอร์พื้นฐาน (อ่านค่าฟิลด์)

```js
ctx.render(<span className="nb-js-field">{String(ctx.value ?? '')}</span>);
```

### 2) ใช้ JSX เรนเดอร์คอมโพเนนต์ React

```js
const { Tag } = ctx.libs.antd;
ctx.render(
  <div style={{ padding: 4 }}>
    <Tag color={ctx.value ? 'green' : 'default'}>{String(ctx.value ?? '')}</Tag>
  </div>
);
```

### 3) โหลดไลบรารีภายนอก (AMD/UMD หรือ ESM)

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.value ?? ''))}</span>);
```

### 4) คลิกเพื่อเปิดป๊อปอัป/ลิ้นชัก (openView)

```js
ctx.element.innerHTML = `<a class="open-detail">ดูรายละเอียด</a>`;
const a = ctx.element.querySelector('.open-detail');
const tk = ctx.collection?.getFilterByTK?.(ctx.record);
a?.addEventListener('click', async () => {
  await ctx.openView('target-view-uid', {
    navigation: false,
    mode: 'drawer',
    dataSourceKey: ctx.collection?.dataSourceKey,
    collectionName: ctx.collection?.name,
    filterByTk: tk,
  });
});
```

### 5) อินพุตที่แก้ไขได้ (JSEditableFieldModel)

```js
// เรนเดอร์อินพุตอย่างง่ายด้วย JSX และซิงโครไนซ์ค่าฟอร์ม
function InputView() {
  return (
    <input
      className="nb-js-editable"
      style={{ width: '100%', padding: '4px 8px' }}
      defaultValue={String(ctx.getValue() ?? '')}
      onInput={(e) => ctx.setValue(e.currentTarget.value)}
    />
  );
}

// ซิงโครไนซ์อินพุตเมื่อค่าภายนอกเปลี่ยนแปลง (ไม่บังคับ)
ctx.element.addEventListener('js-field:value-change', (ev) => {
  const el = ctx.element.querySelector('.nb-js-editable');
  if (el) el.value = ev.detail ?? '';
});

ctx.render(<InputView />);
```

## ข้อควรระวัง

- แนะนำให้ใช้ CDN ที่เชื่อถือได้สำหรับการโหลดไลบรารีภายนอก และเตรียมแผนสำรองสำหรับกรณีที่ล้มเหลว (เช่น `if (!lib) return;`) ครับ/ค่ะ
- แนะนำให้ใช้ `class` หรือ `[name=...]` สำหรับ Selector และหลีกเลี่ยงการใช้ `id` ที่ตายตัว เพื่อป้องกัน `id` ซ้ำซ้อนในหลายบล็อกหรือป๊อปอัปครับ/ค่ะ
- การล้างเหตุการณ์: ฟิลด์อาจถูกเรนเดอร์ซ้ำหลายครั้งเนื่องจากการเปลี่ยนแปลงข้อมูลหรือการสลับมุมมอง ควรล้างหรือลบเหตุการณ์ที่ซ้ำซ้อนก่อนผูกเหตุการณ์ เพื่อหลีกเลี่ยงการทริกเกอร์ซ้ำ สามารถ "remove ก่อนแล้วค่อย add" ครับ/ค่ะ