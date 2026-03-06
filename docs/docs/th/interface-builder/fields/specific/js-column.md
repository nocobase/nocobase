:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/interface-builder/fields/specific/js-column)
:::

# คอลัมน์ JS

## บทนำ

คอลัมน์ JS ใช้สำหรับ "คอลัมน์ที่กำหนดเอง" ในตาราง โดยจะเรนเดอร์เนื้อหาของแต่ละเซลล์ในแต่ละแถวด้วย JavaScript ครับ/ค่ะ ไม่ผูกกับฟิลด์ใดฟิลด์หนึ่งโดยเฉพาะ เหมาะสำหรับสถานการณ์ต่างๆ เช่น คอลัมน์ที่ดัดแปลงมาจากข้อมูลอื่น (derived columns), การแสดงผลแบบรวมหลายฟิลด์, ป้ายสถานะ (status badges), ปุ่มดำเนินการ, และการสรุปข้อมูลจากแหล่งข้อมูลระยะไกล

![jscolumn-add-20251029](https://static-docs.nocobase.com/jscolumn-add-20251029.png)

## Runtime Context API

เมื่อเรนเดอร์แต่ละเซลล์ JS Column จะมี API สำหรับบริบท (Context API) ดังต่อไปนี้ให้ใช้งาน:

- `ctx.element`: คอนเทนเนอร์ DOM ของเซลล์ปัจจุบัน (ElementProxy) ซึ่งรองรับ `innerHTML`, `querySelector`, `addEventListener` และอื่นๆ ครับ/ค่ะ
- `ctx.record`: ออบเจกต์บันทึกข้อมูลของแถวปัจจุบัน (อ่านอย่างเดียว) ครับ/ค่ะ
- `ctx.recordIndex`: ดัชนีของแถวภายในหน้าปัจจุบัน (เริ่มต้นจาก 0 และอาจได้รับผลกระทบจากการแบ่งหน้า) ครับ/ค่ะ
- `ctx.collection`: เมตาอินฟอร์เมชันของ Collection ที่ผูกกับตาราง (อ่านอย่างเดียว)
- `ctx.requireAsync(url)`: โหลดไลบรารี AMD/UMD แบบอะซิงโครนัสตาม URL ครับ/ค่ะ
- `ctx.importAsync(url)`: อิมพอร์ตโมดูล ESM แบบไดนามิกตาม URL ครับ/ค่ะ
- `ctx.openView(options)`: เปิดวิว (View) ที่กำหนดค่าไว้ (เช่น ป๊อปอัป/ลิ้นชัก/หน้า) ครับ/ค่ะ
- `ctx.i18n.t()` / `ctx.t()`: สำหรับการทำ Internationalization (การรองรับหลายภาษา) ครับ/ค่ะ
- `ctx.onRefReady(ctx.ref, cb)`: เรนเดอร์หลังจากคอนเทนเนอร์พร้อมใช้งานครับ/ค่ะ
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: ไลบรารีทั่วไปที่มาพร้อมกับระบบ เช่น React, ReactDOM, Ant Design, ไอคอน Ant Design, dayjs, lodash, math.js และ formula.js สำหรับการเรนเดอร์ JSX, การจัดการเวลา, การจัดการข้อมูล และการคำนวณทางคณิตศาสตร์ (ส่วน `ctx.React` / `ctx.ReactDOM` / `ctx.antd` ยังคงมีไว้เพื่อความเข้ากันได้)
- `ctx.render(vnode)`: เรนเดอร์ React element/HTML/DOM ไปยังคอนเทนเนอร์เริ่มต้น `ctx.element` (เซลล์ปัจจุบัน) ครับ/ค่ะ การเรนเดอร์หลายครั้งจะใช้ Root เดิมซ้ำ และจะเขียนทับเนื้อหาที่มีอยู่ในคอนเทนเนอร์ครับ/ค่ะ

## ตัวแก้ไขและโค้ดสนิปเปต

ตัวแก้ไขสคริปต์สำหรับคอลัมน์ JS รองรับการเน้นไวยากรณ์ (syntax highlighting), การแจ้งเตือนข้อผิดพลาด และมีโค้ดสนิปเปต (Snippets) ในตัวครับ/ค่ะ

- `Snippets`: เปิดรายการโค้ดสนิปเปตในตัว คุณสามารถค้นหาและแทรกโค้ดเหล่านั้นไปยังตำแหน่งเคอร์เซอร์ปัจจุบันได้ด้วยคลิกเดียวครับ/ค่ะ
- `Run`: รันโค้ดปัจจุบันได้โดยตรงครับ/ค่ะ บันทึกการทำงานจะแสดงในแผง `Logs` ด้านล่าง ซึ่งรองรับ `console.log/info/warn/error` และการเน้นข้อผิดพลาดเพื่อระบุตำแหน่งครับ/ค่ะ

![jscolumn-toolbars-20251029](https://static-docs.nocobase.com/jscolumn-toolbars-20251029.png)

คุณยังสามารถใช้ AI Employee เพื่อช่วยสร้างโค้ดได้ด้วยครับ/ค่ะ:

- [AI Employee · Nathan: วิศวกรส่วนหน้า (Frontend Engineer)](/ai-employees/features/built-in-employee)

## การใช้งานทั่วไป

### 1) การเรนเดอร์พื้นฐาน (อ่านบันทึกข้อมูลของแถวปัจจุบัน)

```js
ctx.render(<span className="nb-js-col-name">{ctx.record?.name ?? '-'}</span>);
```

### 2) การใช้ JSX เพื่อเรนเดอร์คอมโพเนนต์ React

```js
const { Tag } = ctx.libs.antd;
const status = ctx.record?.status ?? 'unknown';
const color = status === 'active' ? 'green' : status === 'blocked' ? 'red' : 'default';
ctx.render(
  <div style={{ padding: 4 }}>
    <Tag color={color}>{String(status)}</Tag>
  </div>
);
```

### 3) การเปิดป๊อปอัป/ลิ้นชักจากเซลล์ (ดู/แก้ไข)

```js
const tk = ctx.collection?.getFilterByTK?.(ctx.record);
ctx.render(
  <a onClick={async () => {
    await ctx.openView('target-view-uid', {
      navigation: false,
      mode: 'drawer',
      dataSourceKey: ctx.collection?.dataSourceKey,
      collectionName: ctx.collection?.name,
      filterByTk: tk,
    });
  }}>ดู</a>
);
```

### 4) การโหลดไลบรารีภายนอก (AMD/UMD หรือ ESM)

```js
// AMD/UMD
const _ = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/lodash@4/lodash.min.js');
const items = _.take(Object.keys(ctx.record || {}), 3);
ctx.render(<code>{items.join(', ')}</code>);

// ESM
const { default: dayjs } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/dayjs/+esm');
ctx.render(<span>{dayjs().format('YYYY-MM-DD')}</span>);
```

## ข้อควรระวัง

* แนะนำให้ใช้ CDN ที่เชื่อถือได้สำหรับการโหลดไลบรารีภายนอก และควรเตรียมการจัดการกรณีที่เกิดข้อผิดพลาดไว้ด้วยครับ/ค่ะ (เช่น `if (!lib) return;`)
* สำหรับ Selector แนะนำให้ใช้ `class` หรือ `[name=...]` เป็นหลัก และหลีกเลี่ยงการใช้ `id` แบบตายตัว เพื่อป้องกัน `id` ซ้ำกันในหลายบล็อกหรือป๊อปอัปครับ/ค่ะ
* การล้าง Event: แถวในตารางอาจมีการเปลี่ยนแปลงแบบไดนามิกเมื่อมีการแบ่งหน้าหรือรีเฟรช ทำให้เซลล์ถูกเรนเดอร์หลายครั้งครับ/ค่ะ ก่อนที่จะผูก Event ควรล้างหรือตรวจสอบไม่ให้ซ้ำกัน เพื่อหลีกเลี่ยงการทริกเกอร์ซ้ำซ้อนครับ/ค่ะ
* คำแนะนำด้านประสิทธิภาพ: หลีกเลี่ยงการโหลดไลบรารีขนาดใหญ่ซ้ำๆ ในแต่ละเซลล์ครับ/ค่ะ ควรแคชไลบรารีไว้ในระดับที่สูงขึ้น (เช่น ผ่านตัวแปร Global หรือตัวแปรระดับ Collection) เพื่อนำกลับมาใช้ใหม่