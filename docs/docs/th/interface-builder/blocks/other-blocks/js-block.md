:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/interface-builder/blocks/other-blocks/js-block)
:::

# JS Block

## บทนำ

JS Block เป็น "บล็อกการเรนเดอร์แบบกำหนดเอง" ที่มีความยืดหยุ่นสูง รองรับการเขียนสคริปต์ JavaScript โดยตรงเพื่อสร้างอินเทอร์เฟซ, ผูกเหตุการณ์, เรียกใช้พอร์ตข้อมูล หรือรวมไลบรารีภายนอก เหมาะสำหรับสถานการณ์ที่บล็อกในตัวเข้าถึงได้ยาก เช่น การแสดงผลข้อมูลเฉพาะตัว, การทดลองชั่วคราว และการขยายระบบแบบน้ำหนักเบาครับ/ค่ะ

## API ของ Runtime Context

Runtime Context ของ JS Block ได้รับการฉีดความสามารถที่ใช้บ่อยเพื่อให้สามารถใช้งานได้โดยตรงครับ/ค่ะ:

- `ctx.element`: คอนเทนเนอร์ DOM ของบล็อก (มีการห่อหุ้มเพื่อความปลอดภัย ElementProxy) รองรับ `innerHTML`, `querySelector`, `addEventListener` เป็นต้นครับ/ค่ะ
- `ctx.requireAsync(url)`: โหลดไลบรารี AMD/UMD แบบอะซิงโครนัสตาม URL ครับ/ค่ะ
- `ctx.importAsync(url)`: นำเข้าโมดูล ESM แบบไดนามิกตาม URL ครับ/ค่ะ
- `ctx.openView`: เปิดมุมมองที่กำหนดค่าไว้ (หน้าต่างป๊อปอัป/ลิ้นชัก/หน้าเพจ) ครับ/ค่ะ
- `ctx.useResource(...)` + `ctx.resource`: เข้าถึงข้อมูลในรูปแบบทรัพยากรครับ/ค่ะ
- `ctx.i18n.t()` / `ctx.t()`: ความสามารถด้านภาษา (i18n) ในตัวครับ/ค่ะ
- `ctx.onRefReady(ctx.ref, cb)`: เรนเดอร์หลังจากคอนเทนเนอร์พร้อม เพื่อหลีกเลี่ยงปัญหาลำดับเวลาครับ/ค่ะ
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: ไลบรารีทั่วไปในตัว เช่น React / ReactDOM / Ant Design / Ant Design Icons / dayjs / lodash / math.js / formula.js สำหรับการเรนเดอร์ JSX, การจัดการเวลา, การจัดการข้อมูล และการคำนวณทางคณิตศาสตร์ครับ/ค่ะ (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` ยังคงถูกเก็บไว้เพื่อความเข้ากันได้)
- `ctx.render(vnode)`: เรนเดอร์องค์ประกอบ React, สตริง HTML หรือโหนด DOM ไปยังคอนเทนเนอร์เริ่มต้น `ctx.element` การเรียกใช้หลายครั้งจะใช้ React Root เดิมซ้ำและเขียนทับเนื้อหาที่มีอยู่ของคอนเทนเนอร์ครับ/ค่ะ

## การเพิ่มบล็อก

- สามารถเพิ่ม JS Block ในหน้าเพจหรือหน้าต่างป๊อปอัปได้ครับ/ค่ะ
![jsblock-add-20251029](https://static-docs.nocobase.com/jsblock-add-20251029.png)

## ตัวแก้ไขและ Snippets

ตัวแก้ไขสคริปต์ของ JS Block รองรับการเน้นไวยากรณ์ (syntax highlighting), การแจ้งเตือนข้อผิดพลาด และส่วนโค้ดในตัว (Snippets) ช่วยให้แทรกตัวอย่างทั่วไปได้อย่างรวดเร็ว เช่น การเรนเดอร์แผนภูมิ, การผูกเหตุการณ์ปุ่ม, การโหลดไลบรารีภายนอก, การเรนเดอร์คอมโพเนนต์ React/Vue, ไทม์ไลน์, การ์ดข้อมูล เป็นต้นครับ/ค่ะ

- `Snippets`: เปิดรายการส่วนโค้ดในตัว สามารถค้นหาและแทรกส่วนที่เลือกลงในตำแหน่งเคอร์เซอร์ปัจจุบันในพื้นที่แก้ไขโค้ดได้ในคลิกเดียวครับ/ค่ะ
- `Run`: รันโค้ดในตัวแก้ไขโดยตรง และส่งออกบันทึกการรันไปยังแผง `Logs` ด้านล่าง รองรับการแสดง `console.log/info/warn/error` ข้อผิดพลาดจะถูกเน้นและสามารถระบุตำแหน่งแถวและคอลัมน์ได้ครับ/ค่ะ

![jsblock-toolbars-20251029](https://static-docs.nocobase.com/jsblock-toolbars-20251029.png)

นอกจากนี้ ที่มุมขวาบนของตัวแก้ไขสามารถเรียกใช้พนักงาน AI "Frontend Engineer · Nathan" เพื่อให้เขาช่วยเขียนหรือแก้ไขสคริปต์ตามบริบทปัจจุบัน และคลิก "Apply to editor" เพื่อนำไปใช้ในตัวแก้ไขก่อนรันเพื่อดูผลลัพธ์ได้ครับ/ค่ะ ดูรายละเอียดเพิ่มเติมได้ที่:

- [AI Employee · Nathan: Frontend Engineer](/ai-employees/features/built-in-employee)

## สภาพแวดล้อมการทำงานและความปลอดภัย

- คอนเทนเนอร์: ระบบจัดเตรียมคอนเทนเนอร์ DOM ที่ปลอดภัย `ctx.element` (ElementProxy) ให้กับสคริปต์ ซึ่งส่งผลเฉพาะกับบล็อกปัจจุบันและไม่รบกวนพื้นที่อื่นของหน้าเพจครับ/ค่ะ
- แซนด์บ็อกซ์: สคริปต์ทำงานในสภาพแวดล้อมที่ถูกควบคุม `window`/`document`/`navigator` ใช้พร็อกซีออบเจกต์ที่ปลอดภัย API ทั่วไปสามารถใช้งานได้ แต่พฤติกรรมที่มีความเสี่ยงจะถูกจำกัดครับ/ค่ะ
- การเรนเดอร์ซ้ำ: เมื่อบล็อกถูกซ่อนแล้วแสดงใหม่จะมีการเรนเดอร์ซ้ำโดยอัตโนมัติ (เพื่อหลีกเลี่ยงการทำงานซ้ำซ้อนในการติดตั้งครั้งแรก) ครับ/ค่ะ

## การใช้งานทั่วไป (ตัวอย่างแบบย่อ)

### 1) การเรนเดอร์ React (JSX)

```js
const { Button } = ctx.libs.antd;
ctx.render(
  <div style={{ padding: 12 }}>
    <Button type="primary" onClick={() => ctx.message.success(ctx.t('Clicked!'))}>
      {ctx.t('Click')}
    </Button>
  </div>
);
```

### 2) เทมเพลตการเรียกใช้ API

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 3) การโหลด ECharts และการเรนเดอร์

```js
const container = document.createElement('div');
container.style.height = '360px';
container.style.width = '100%';
ctx.element.replaceChildren(container);
const echarts = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js');
if (!echarts) throw new Error('ECharts not loaded');
const chart = echarts.init(container);
chart.setOption({ title: { text: ctx.t('ECharts') }, xAxis: {}, yAxis: {}, series: [{ type: 'bar', data: [5, 12, 9] }] });
chart.resize();
```

### 4) การเปิดมุมมอง (ลิ้นชัก)

```js
const popupUid = ctx.model.uid + '-1';
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Sample drawer'), size: 'large' });
```

### 5) การอ่านทรัพยากรและการเรนเดอร์ JSON

```js
const resource = ctx.createResource('SingleRecordResource');
resource.setDataSourceKey('main');
resource.setResourceName('users');
await resource.refresh();
ctx.render(`<pre style="padding:12px;background:#f5f5f5;border-radius:6px;">${JSON.stringify(resource.getData(), null, 2)}</pre>`);
```

## ข้อควรระวัง

- แนะนำให้ใช้ CDN ที่เชื่อถือได้สำหรับการโหลดไลบรารีภายนอกครับ/ค่ะ
- คำแนะนำในการใช้ตัวเลือก (Selector): ควรใช้ `class` หรือแอตทริบิวต์ `[name=...]` เป็นหลัก หลีกเลี่ยงการใช้ `id` ที่คงที่ เพื่อป้องกันปัญหา `id` ซ้ำซ้อนในหลายบล็อกหรือหน้าต่างป๊อปอัปซึ่งอาจทำให้สไตล์หรือเหตุการณ์ขัดแย้งกันครับ/ค่ะ
- การล้างเหตุการณ์: บล็อกอาจมีการเรนเดอร์ซ้ำหลายครั้ง ก่อนผูกเหตุการณ์ควรล้างหรือลบรายการที่ซ้ำเพื่อหลีกเลี่ยงการทริกเกอร์ซ้ำ สามารถใช้วิธี "ลบก่อนแล้วค่อยเพิ่ม" หรือใช้ตัวฟังเหตุการณ์แบบครั้งเดียว หรือเพิ่มเครื่องหมายป้องกันการทำซ้ำครับ/ค่ะ

## เอกสารที่เกี่ยวข้อง

- [ตัวแปรและ Context](/interface-builder/variables)
- [กฎการเชื่อมโยง](/interface-builder/linkage-rule)
- [มุมมองและหน้าต่างป๊อปอัป](/interface-builder/actions/types/view)