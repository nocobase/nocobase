:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# JS Action

## บทนำ

JS Action ใช้สำหรับรัน JavaScript เมื่อมีการคลิกปุ่ม เพื่อให้คุณสามารถปรับแต่งพฤติกรรมการทำงานทางธุรกิจได้ตามต้องการครับ/ค่ะ สามารถใช้งานได้ในหลายตำแหน่ง เช่น แถบเครื่องมือของฟอร์ม, แถบเครื่องมือของตาราง (ระดับคอลเลกชัน), แถวของตาราง (ระดับเรคคอร์ด) เพื่อดำเนินการต่างๆ เช่น การตรวจสอบข้อมูล, การแสดงข้อความแจ้งเตือน, การเรียกใช้ API, การเปิดหน้าต่างป๊อปอัป/ลิ้นชัก (drawer) และการรีเฟรชข้อมูลครับ/ค่ะ

![jsaction-add-20251029](https://static-docs.nocobase.com/jsaction-add-20251029.png)

## Runtime Context API (ที่ใช้บ่อย)

- `ctx.api.request(options)`: ใช้สำหรับส่งคำขอ HTTP ครับ/ค่ะ
- `ctx.openView(viewUid, options)`: ใช้สำหรับเปิด View ที่กำหนดค่าไว้ (เช่น ลิ้นชัก (drawer), กล่องโต้ตอบ (dialog) หรือหน้าเพจ) ครับ/ค่ะ
- `ctx.message` / `ctx.notification`: ใช้สำหรับแสดงข้อความแจ้งเตือนและการแจ้งเตือนแบบทั่วทั้งระบบครับ/ค่ะ
- `ctx.t()` / `ctx.i18n.t()`: ใช้สำหรับจัดการเรื่อง Internationalization (การรองรับหลายภาษา) ครับ/ค่ะ
- `ctx.resource`: แหล่งข้อมูลสำหรับบริบทระดับคอลเลกชัน (เช่น แถบเครื่องมือของตาราง ซึ่งรวมถึงเมธอดอย่าง `getSelectedRows()` และ `refresh()` เป็นต้น) ครับ/ค่ะ
- `ctx.record`: เรคคอร์ดของแถวปัจจุบันสำหรับบริบทระดับเรคคอร์ด (เช่น ปุ่มในแถวของตาราง) ครับ/ค่ะ
- `ctx.form`: อินสแตนซ์ของ AntD Form สำหรับบริบทระดับฟอร์ม (เช่น ปุ่มในแถบเครื่องมือของฟอร์ม) ครับ/ค่ะ
- `ctx.collection`: เมตาอินฟอร์เมชันของคอลเลกชันปัจจุบันครับ/ค่ะ
- ตัวแก้ไขโค้ดรองรับ `Snippets` (โค้ดตัวอย่าง) และ `Run` (การรันโค้ดล่วงหน้า) ครับ/ค่ะ (ดูรายละเอียดด้านล่าง)

- `ctx.requireAsync(url)`: ใช้สำหรับโหลดไลบรารี AMD/UMD แบบอะซิงโครนัสจาก URL ครับ/ค่ะ
- `ctx.importAsync(url)`: ใช้สำหรับนำเข้าโมดูล ESM แบบไดนามิกจาก URL ครับ/ค่ะ

> ตัวแปรที่ใช้งานได้จริงอาจแตกต่างกันไปขึ้นอยู่กับตำแหน่งของปุ่มครับ/ค่ะ รายการด้านบนเป็นภาพรวมของความสามารถที่พบบ่อยเท่านั้น

## ตัวแก้ไขและ Snippets

- `Snippets`: เปิดรายการโค้ดตัวอย่าง (snippets) ที่มีมาให้ในระบบ คุณสามารถค้นหาและแทรกโค้ดเหล่านั้นไปยังตำแหน่งเคอร์เซอร์ปัจจุบันได้ด้วยการคลิกเพียงครั้งเดียวครับ/ค่ะ
- `Run`: รันโค้ดปัจจุบันได้โดยตรง และจะแสดงผลลัพธ์ (logs) การทำงานที่แผง `Logs` ด้านล่างครับ/ค่ะ รองรับ `console.log/info/warn/error` และมีการไฮไลต์ตำแหน่งข้อผิดพลาดด้วยครับ/ค่ะ

![jsaction-toolbars-20251029](https://static-docs.nocobase.com/jsaction-toolbars-20251029.png)

- คุณสามารถใช้ AI Employee เพื่อสร้าง/แก้ไขสคริปต์ได้ครับ/ค่ะ: [AI Employee · Nathan: วิศวกร Frontend](/ai-employees/built-in/ai-coding)

## การใช้งานทั่วไป (ตัวอย่างแบบย่อ)

### 1) การเรียกใช้ API และการแจ้งเตือน

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 2) ปุ่มคอลเลกชัน: ตรวจสอบการเลือกและประมวลผล

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (!rows.length) {
  ctx.message.warning(ctx.t('Please select records'));
  return;
}
// TODO: Implement business logic...
ctx.message.success(ctx.t('Selected {n} items', { n: rows.length }));
```

### 3) ปุ่มเรคคอร์ด: อ่านเรคคอร์ดของแถวปัจจุบัน

```js
if (!ctx.record) {
  ctx.message.error(ctx.t('No record'));
} else {
  ctx.message.success(ctx.t('Record ID: {id}', { id: ctx.record.id }))
}
```

### 4) การเปิด View (ลิ้นชัก/กล่องโต้ตอบ)

```js
const popupUid = ctx.model.uid + '-open'; // ผูกกับปุ่มปัจจุบันเพื่อให้คงที่
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Details'), size: 'large' });
```

### 5) การรีเฟรชข้อมูลหลังจากการส่ง

```js
// การรีเฟรชทั่วไป: ให้ความสำคัญกับแหล่งข้อมูลของตาราง/รายการก่อน จากนั้นจึงเป็นแหล่งข้อมูลของบล็อกที่ฟอร์มอยู่
if (ctx.resource?.refresh) await ctx.resource.refresh();
else if (ctx.blockModel?.resource?.refresh) await ctx.blockModel.resource.refresh();
```

## ข้อควรระวัง

- **การทำงานแบบ Idempotent**: เพื่อป้องกันการส่งข้อมูลซ้ำหลายครั้งจากการคลิกซ้ำ คุณสามารถเพิ่มสถานะ (state flag) ในโค้ดหรือปิดใช้งานปุ่มได้ครับ/ค่ะ
- **การจัดการข้อผิดพลาด**: ควรเพิ่มบล็อก try/catch สำหรับการเรียกใช้ API และแสดงข้อความแจ้งเตือนที่เป็นมิตรต่อผู้ใช้ครับ/ค่ะ
- **การทำงานร่วมกันของ View**: เมื่อเปิดหน้าต่างป๊อปอัป/ลิ้นชัก (drawer) ด้วย `ctx.openView` ขอแนะนำให้ส่งพารามิเตอร์อย่างชัดเจน และหากจำเป็น ให้รีเฟรชแหล่งข้อมูลหลัก (parent resource) ด้วยตนเองหลังจากส่งข้อมูลสำเร็จครับ/ค่ะ

## เอกสารที่เกี่ยวข้อง

- [ตัวแปรและบริบท](/interface-builder/variables)
- [กฎการเชื่อมโยง](/interface-builder/linkage-rule)
- [Views และหน้าต่างป๊อปอัป](/interface-builder/actions/types/view)