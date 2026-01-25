:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# JS Field

## บทนำ

JS Field ใช้สำหรับปรับแต่งการแสดงผลเนื้อหาในตำแหน่งของฟิลด์ด้วย JavaScript ครับ/ค่ะ ซึ่งมักใช้ในบล็อกรายละเอียด, รายการแบบอ่านอย่างเดียวในฟอร์ม, หรือเป็น "รายการที่กำหนดเองอื่นๆ" ในคอลัมน์ตาราง เหมาะสำหรับการแสดงผลที่ปรับแต่งเฉพาะบุคคล, การรวมข้อมูลที่ได้มา, ป้ายสถานะ, ข้อความ Rich Text หรือแผนภูมิ เป็นต้น

![jsfield-readonly-add-20251029](https://static-docs.nocobase.com/jsfield-readonly-add-20251029.png)

## ประเภท

- **แบบอ่านอย่างเดียว (Read-only)**: ใช้สำหรับการแสดงผลที่ไม่สามารถแก้ไขได้ โดยจะอ่านค่าจาก `ctx.value` เพื่อแสดงผลครับ/ค่ะ
- **แบบแก้ไขได้ (Editable)**: ใช้สำหรับการโต้ตอบการป้อนข้อมูลที่กำหนดเอง โดยมี `ctx.getValue()`/`ctx.setValue(v)` และเหตุการณ์คอนเทนเนอร์ `js-field:value-change` เพื่ออำนวยความสะดวกในการซิงค์ข้อมูลแบบสองทางกับค่าในฟอร์มครับ/ค่ะ

## กรณีการใช้งาน

- **แบบอ่านอย่างเดียว**
  - **บล็อกรายละเอียด**: แสดงเนื้อหาแบบอ่านอย่างเดียว เช่น ผลลัพธ์การคำนวณ, ป้ายสถานะ, ส่วนของ Rich Text หรือแผนภูมิ เป็นต้น
  - **บล็อกตาราง**: ใช้เป็น "คอลัมน์ที่กำหนดเองอื่นๆ > JS Field" สำหรับการแสดงผลแบบอ่านอย่างเดียว (หากต้องการคอลัมน์ที่ไม่ผูกกับฟิลด์ใดๆ โปรดใช้ JS Column ครับ/ค่ะ)

- **แบบแก้ไขได้**
  - **บล็อกฟอร์ม (CreateForm/EditForm)**: ใช้สำหรับควบคุมการป้อนข้อมูลที่กำหนดเอง หรือการป้อนข้อมูลแบบผสม ซึ่งจะถูกตรวจสอบและส่งพร้อมกับฟอร์ม
  - **เหมาะสำหรับสถานการณ์ต่างๆ เช่น**: คอมโพเนนต์อินพุตจากไลบรารีภายนอก, ตัวแก้ไข Rich Text/โค้ด, คอมโพเนนต์ไดนามิกที่ซับซ้อน เป็นต้น

## Runtime Context API

โค้ด JS Field ที่ทำงานอยู่สามารถใช้ความสามารถของ Context ต่อไปนี้ได้โดยตรงครับ/ค่ะ:

- `ctx.element`: คอนเทนเนอร์ DOM ของฟิลด์ (ElementProxy) ซึ่งรองรับ `innerHTML`, `querySelector`, `addEventListener` และอื่นๆ
- `ctx.value`: ค่าฟิลด์ปัจจุบัน (อ่านอย่างเดียว)
- `ctx.record`: ออบเจกต์เรคคอร์ดปัจจุบัน (อ่านอย่างเดียว)
- `ctx.collection`: เมตาอินฟอร์เมชันของคอลเลกชันที่ฟิลด์นี้เป็นส่วนหนึ่ง (อ่านอย่างเดียว)
- `ctx.requireAsync(url)`: โหลดไลบรารี AMD/UMD แบบอะซิงโครนัสด้วย URL
- `ctx.importAsync(url)`: นำเข้าโมดูล ESM แบบไดนามิกด้วย URL
- `ctx.openView(options)`: เปิดวิวที่กำหนดค่าไว้ (ป๊อปอัป/ลิ้นชัก/หน้า)
- `ctx.i18n.t()` / `ctx.t()`: การทำให้เป็นสากล (Internationalization)
- `ctx.onRefReady(ctx.ref, cb)`: แสดงผลหลังจากคอนเทนเนอร์พร้อมใช้งาน
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: ไลบรารีทั่วไปที่มาพร้อมในตัว เช่น React, ReactDOM, Ant Design, ไอคอน Ant Design และ dayjs สำหรับการแสดงผล JSX และการจัดการเวลา (ยังคงเก็บ `ctx.React` / `ctx.ReactDOM` / `ctx.antd` ไว้เพื่อความเข้ากันได้)
- `ctx.render(vnode)`: แสดงผล React element, สตริง HTML หรือ DOM node ลงในคอนเทนเนอร์เริ่มต้น `ctx.element` ครับ/ค่ะ การแสดงผลซ้ำจะใช้ Root เดิมและเขียนทับเนื้อหาที่มีอยู่ในคอนเทนเนอร์

**คุณสมบัติเฉพาะสำหรับแบบแก้ไขได้ (JSEditableField)**:

- `ctx.getValue()`: รับค่าฟอร์มปัจจุบัน (จะใช้สถานะฟอร์มเป็นอันดับแรก หากไม่พบจะกลับไปใช้ props ของฟิลด์)
- `ctx.setValue(v)`: ตั้งค่าฟอร์มและ props ของฟิลด์ เพื่อรักษาการซิงค์ข้อมูลแบบสองทาง
- เหตุการณ์คอนเทนเนอร์ `js-field:value-change`: จะถูกเรียกเมื่อค่าภายนอกมีการเปลี่ยนแปลง เพื่อให้สคริปต์อัปเดตการแสดงผลอินพุตได้ง่ายขึ้น

## ตัวแก้ไขและ Snippets

ตัวแก้ไขสคริปต์ของ JS Field รองรับการเน้นไวยากรณ์ (syntax highlighting), การแจ้งเตือนข้อผิดพลาด และโค้ดสนิปเปต (Snippets) ที่มาพร้อมในตัวครับ/ค่ะ

- `Snippets`: เปิดรายการโค้ดสนิปเปตที่มาพร้อมในตัว สามารถค้นหาและแทรกไปยังตำแหน่งเคอร์เซอร์ปัจจุบันได้ด้วยคลิกเดียว
- `Run`: รันโค้ดปัจจุบันได้โดยตรงครับ/ค่ะ บันทึกการทำงานจะแสดงผลในแผง `Logs` ด้านล่าง ซึ่งรองรับ `console.log/info/warn/error` และการเน้นข้อผิดพลาดเพื่อระบุตำแหน่ง

![jsfield-readonly-toolbars-20251029](https://static-docs.nocobase.com/jsfield-readonly-toolbars-20251029.png)

สามารถสร้างโค้ดร่วมกับ AI Employee ได้ครับ/ค่ะ:

- [AI Employee · Nathan: วิศวกรส่วนหน้า](/ai-employees/built-in/ai-coding)

## การใช้งานทั่วไป

### 1) การแสดงผลพื้นฐาน (อ่านค่าฟิลด์)

```js
ctx.render(<span className="nb-js-field">{String(ctx.value ?? '')}</span>);
```

### 2) การใช้ JSX เพื่อแสดงผลคอมโพเนนต์ React

```js
const { Tag } = ctx.libs.antd;
ctx.render(
  <div style={{ padding: 4 }}>
    <Tag color={ctx.value ? 'green' : 'default'}>{String(ctx.value ?? '')}</Tag>
  </div>
);
```

### 3) การโหลดไลบรารีภายนอก (AMD/UMD หรือ ESM)

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
// แสดงผลอินพุตอย่างง่ายด้วย JSX และซิงค์ค่าฟอร์ม
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

// ซิงค์อินพุตเมื่อค่าภายนอกมีการเปลี่ยนแปลง (ไม่บังคับ)
ctx.element.addEventListener('js-field:value-change', (ev) => {
  const el = ctx.element.querySelector('.nb-js-editable');
  if (el) el.value = ev.detail ?? '';
});

ctx.render(<InputView />);
```

## ข้อควรระวัง

- แนะนำให้ใช้ CDN ที่เชื่อถือได้ในการโหลดไลบรารีภายนอก และเตรียมการรับมือกับสถานการณ์ที่ล้มเหลวไว้ด้วย (เช่น `if (!lib) return;`)
- แนะนำให้ใช้ `class` หรือ `[name=...]` สำหรับ Selector เป็นหลัก และหลีกเลี่ยงการใช้ `id` แบบตายตัว เพื่อป้องกัน `id` ซ้ำกันในบล็อกหรือป๊อปอัปหลายๆ อันครับ/ค่ะ
- **การล้างเหตุการณ์ (Event Cleanup)**: ฟิลด์อาจถูกแสดงผลซ้ำหลายครั้งเนื่องจากการเปลี่ยนแปลงข้อมูลหรือการสลับวิว ก่อนที่จะผูกเหตุการณ์ ควรล้างหรือลบเหตุการณ์ที่ซ้ำซ้อนออก เพื่อหลีกเลี่ยงการเรียกใช้ซ้ำครับ/ค่ะ สามารถทำได้โดย "remove ก่อน แล้วค่อย add"