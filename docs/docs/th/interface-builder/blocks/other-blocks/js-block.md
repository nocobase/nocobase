:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# JS Block

## บทนำ

JS Block คือบล็อกสำหรับเรนเดอร์แบบกำหนดเองที่ยืดหยุ่นสูงครับ/ค่ะ ที่รองรับการเขียนสคริปต์ JavaScript ได้โดยตรงเพื่อสร้างส่วนติดต่อผู้ใช้ (UI), ผูกเหตุการณ์ (bind events), เรียกใช้ API ข้อมูล หรือเชื่อมต่อกับไลบรารีภายนอก เหมาะสำหรับสถานการณ์ที่บล็อกในตัวอาจไม่สามารถตอบโจทย์ได้ทั้งหมด เช่น การแสดงผลข้อมูลแบบเฉพาะบุคคล, การทดลองชั่วคราว หรือการขยายฟังก์ชันการทำงานแบบเบาๆ ครับ/ค่ะ

## API ของ Runtime Context

JS Block มีความสามารถที่ใช้บ่อยๆ ถูกฉีดเข้ามาใน Runtime Context ให้พร้อมใช้งานได้ทันทีครับ/ค่ะ:

- `ctx.element`: DOM container ของบล็อก (ถูกห่อหุ้มอย่างปลอดภัยด้วย ElementProxy) รองรับ `innerHTML`, `querySelector`, `addEventListener` และอื่นๆ ครับ/ค่ะ
- `ctx.requireAsync(url)`: โหลดไลบรารี AMD/UMD แบบอะซิงโครนัสผ่าน URL
- `ctx.importAsync(url)`: นำเข้าโมดูล ESM แบบไดนามิกผ่าน URL
- `ctx.openView`: เปิดมุมมองที่กำหนดค่าไว้ (เช่น ป๊อปอัป, ลิ้นชัก, หน้า)
- `ctx.useResource(...)` + `ctx.resource`: เข้าถึงข้อมูลในรูปแบบของทรัพยากร
- `ctx.i18n.t()` / `ctx.t()`: ความสามารถในการรองรับหลายภาษา (internationalization) ในตัว
- `ctx.onRefReady(ctx.ref, cb)`: เรนเดอร์หลังจากคอนเทนเนอร์พร้อมใช้งาน เพื่อหลีกเลี่ยงปัญหาเรื่องลำดับเวลา
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: ไลบรารีทั่วไปที่มาพร้อมในตัว เช่น React, ReactDOM, Ant Design, ไอคอน Ant Design และ dayjs สำหรับการเรนเดอร์ JSX และการจัดการเวลาครับ/ค่ะ (ยังคงเก็บ `ctx.React` / `ctx.ReactDOM` / `ctx.antd` ไว้เพื่อความเข้ากันได้)
- `ctx.render(vnode)`: เรนเดอร์ React element, สตริง HTML หรือ DOM node ไปยังคอนเทนเนอร์เริ่มต้น `ctx.element` ครับ/ค่ะ การเรียกใช้หลายครั้งจะใช้ React Root เดียวกันซ้ำ และจะเขียนทับเนื้อหาที่มีอยู่ในคอนเทนเนอร์

## การเพิ่มบล็อก

คุณสามารถเพิ่ม JS Block ลงในหน้าเพจหรือป๊อปอัปได้ครับ/ค่ะ

![jsblock-add-20251029](https://static-docs.nocobase.com/jsblock-add-20251029.png)

## ตัวแก้ไขและ Snippets

ตัวแก้ไขสคริปต์ของ JS Block รองรับการเน้นไวยากรณ์ (syntax highlighting), คำแนะนำข้อผิดพลาด และมี Snippets (โค้ดตัวอย่าง) ในตัวครับ/ค่ะ ช่วยให้คุณสามารถแทรกตัวอย่างที่ใช้บ่อยได้อย่างรวดเร็ว เช่น การเรนเดอร์แผนภูมิ, การผูกเหตุการณ์ปุ่ม, การโหลดไลบรารีภายนอก, การเรนเดอร์คอมโพเนนต์ React/Vue, ไทม์ไลน์, การ์ดข้อมูล และอื่นๆ

- `Snippets`: เปิดรายการโค้ด Snippets ที่มีในตัว คุณสามารถค้นหาและแทรก Snippet ที่เลือกไปยังตำแหน่งเคอร์เซอร์ปัจจุบันในพื้นที่แก้ไขโค้ดได้ด้วยคลิกเดียว
- `Run`: เรียกใช้โค้ดในตัวแก้ไขปัจจุบันโดยตรง และแสดงบันทึกการทำงานออกไปยังแผง `Logs` ด้านล่างครับ/ค่ะ รองรับการแสดง `console.log/info/warn/error` โดยข้อผิดพลาดจะถูกเน้นและสามารถระบุตำแหน่งบรรทัดและคอลัมน์ที่แน่นอนได้

![jsblock-toolbars-20251029](https://static-docs.nocobase.com/jsblock-toolbars-20251029.png)

นอกจากนี้ คุณยังสามารถเรียกใช้ AI Employee “Frontend Engineer · Nathan” ได้โดยตรงจากมุมขวาบนของตัวแก้ไขครับ/ค่ะ Nathan จะช่วยคุณเขียนหรือแก้ไขสคริปต์ตามบริบทปัจจุบันได้ จากนั้นคุณสามารถคลิก “Apply to editor” เพื่อนำไปใช้ในตัวแก้ไขและรันเพื่อดูผลลัพธ์ได้เลยครับ/ค่ะ ดูรายละเอียดเพิ่มเติมได้ที่:

- [AI Employee · Nathan: Frontend Engineer](/ai-employees/built-in/ai-coding)

## สภาพแวดล้อมการทำงานและความปลอดภัย

- **คอนเทนเนอร์**: ระบบจะจัดเตรียม DOM container ที่ปลอดภัย `ctx.element` (ElementProxy) สำหรับสคริปต์ครับ/ค่ะ ซึ่งจะส่งผลกระทบเฉพาะบล็อกปัจจุบันเท่านั้น และไม่รบกวนส่วนอื่นๆ ของหน้าเพจ
- **แซนด์บ็อกซ์**: สคริปต์จะทำงานในสภาพแวดล้อมที่ถูกควบคุมครับ/ค่ะ โดย `window`/`document`/`navigator` จะใช้ proxy object ที่ปลอดภัย ทำให้สามารถใช้ API ทั่วไปได้ แต่จะจำกัดพฤติกรรมที่มีความเสี่ยง
- **การเรนเดอร์ซ้ำ**: บล็อกจะถูกเรนเดอร์ซ้ำโดยอัตโนมัติเมื่อถูกซ่อนแล้วแสดงขึ้นมาอีกครั้งครับ/ค่ะ (เพื่อหลีกเลี่ยงการรันซ้ำเมื่อมีการเมาท์ครั้งแรก)

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
- **คำแนะนำการใช้ Selector**: ควรให้ความสำคัญกับการใช้ `class` หรือ attribute selector อย่าง `[name=...]` ครับ/ค่ะ หลีกเลี่ยงการใช้ `id` แบบตายตัว เพื่อป้องกันปัญหา `id` ซ้ำกันในบล็อก/ป๊อปอัปหลายแห่ง ซึ่งอาจนำไปสู่ความขัดแย้งของสไตล์หรือเหตุการณ์ได้
- **การล้างเหตุการณ์**: เนื่องจากบล็อกอาจมีการเรนเดอร์ซ้ำหลายครั้ง ควรล้างหรือลบเหตุการณ์ที่ซ้ำกันออกก่อนที่จะผูกเหตุการณ์ใหม่ เพื่อหลีกเลี่ยงการทริกเกอร์ซ้ำครับ/ค่ะ คุณสามารถใช้วิธี “remove ก่อนแล้วค่อย add” หรือใช้ตัวฟังเหตุการณ์แบบครั้งเดียว หรือเพิ่มแฟล็กเพื่อป้องกันการซ้ำซ้อนได้

## เอกสารที่เกี่ยวข้อง

- [ตัวแปรและ Context](/interface-builder/variables)
- [กฎการเชื่อมโยง](/interface-builder/linkage-rule)
- [มุมมองและป๊อปอัป](/interface-builder/actions/types/view)