:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/interface-builder/actions/types/js-action)
:::

# JS Action

## 介绍 (Introduction)

JS Action ใช้สำหรับรัน JavaScript เมื่อคลิกปุ่ม เพื่อปรับแต่งพฤติกรรมทางธุรกิจตามต้องการครับ/ค่ะ สามารถใช้ในตำแหน่งต่างๆ เช่น แถบเครื่องมือของฟอร์ม, แถบเครื่องมือของตาราง (ระดับคอลเลกชัน), แถวของตาราง (ระดับเรคคอร์ด) เพื่อดำเนินการตรวจสอบ, การแจ้งเตือน, การเรียกใช้ API, การเปิดหน้าต่างป๊อปอัป/ลิ้นชัก, และการรีเฟรชข้อมูลครับ/ค่ะ

![jsaction-add-20251029](https://static-docs.nocobase.com/jsaction-add-20251029.png)

## 运行时上下文 API（常用） (Runtime Context API - Commonly Used)

- `ctx.api.request(options)`: ส่งคำขอ HTTP ครับ/ค่ะ
- `ctx.openView(viewUid, options)`: เปิด View ที่กำหนดค่าไว้ (ลิ้นชัก/กล่องโต้ตอบ/หน้าเพจ) ครับ/ค่ะ
- `ctx.message` / `ctx.notification`: การแจ้งเตือนและข้อความทั่วโลกครับ/ค่ะ
- `ctx.t()` / `ctx.i18n.t()`: การรองรับหลายภาษา (Internationalization) ครับ/ค่ะ
- `ctx.resource`: ทรัพยากรข้อมูลในบริบทระดับคอลเลกชัน (เช่น แถบเครื่องมือตาราง ประกอบด้วย `getSelectedRows()`, `refresh()` เป็นต้น) ครับ/ค่ะ
- `ctx.record`: เรคคอร์ดของแถวปัจจุบันในบริบทระดับเรคคอร์ด (เช่น ปุ่มในแถวตาราง) ครับ/ค่ะ
- `ctx.form`: อินสแตนซ์ AntD Form ในบริบทระดับฟอร์ม (เช่น ปุ่มในแถบเครื่องมือฟอร์ม) ครับ/ค่ะ
- `ctx.collection`: ข้อมูลเมตาของคอลเลกชันปัจจุบันครับ/ค่ะ
- ตัวแก้ไขโค้ดรองรับ `Snippets` และการรันล่วงหน้า `Run` (ดูด้านล่าง) ครับ/ค่ะ


- `ctx.requireAsync(url)`: โหลดไลบรารี AMD/UMD แบบอะซิงโครนัสตาม URL ครับ/ค่ะ
- `ctx.importAsync(url)`: นำเข้าโมดูล ESM แบบไดนามิกตาม URL ครับ/ค่ะ
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: ไลบรารีในตัว เช่น React / ReactDOM / Ant Design / Ant Design Icons / dayjs / lodash / math.js / formula.js สำหรับการเรนเดอร์ JSX, การจัดการเวลา, การจัดการข้อมูล และการคำนวณทางคณิตศาสตร์ครับ/ค่ะ

> ตัวแปรที่ใช้งานได้จริงจะแตกต่างกันไปตามตำแหน่งของปุ่ม ข้อมูลข้างต้นเป็นภาพรวมของความสามารถทั่วไปครับ/ค่ะ

## 编辑器与片段 (Editor and Snippets)

- `Snippets`: เปิดรายการโค้ดตัวอย่างในตัว สามารถค้นหาและแทรกไปยังตำแหน่งเคอร์เซอร์ได้ในคลิกเดียวครับ/ค่ะ
- `Run`: รันโค้ดปัจจุบันโดยตรง และแสดงบันทึกการรันในแผง `Logs` ด้านล่าง รองรับ `console.log/info/warn/error` และการระบุตำแหน่งข้อผิดพลาดด้วยไฮไลต์ครับ/ค่ะ

![jsaction-toolbars-20251029](https://static-docs.nocobase.com/jsaction-toolbars-20251029.png)

- สามารถใช้ร่วมกับพนักงาน AI เพื่อสร้าง/แก้ไขสคริปต์: [พนักงาน AI · Nathan: วิศวกรฟรอนต์เอนด์](/ai-employees/features/built-in-employee)

## 常见用法（精简示例） (Common Usage - Simplified Examples)

### 1) 接口请求与提示 (API Request and Notification)

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 2) 集合按钮：校验选择并处理 (Collection Button: Validate Selection and Process)

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (!rows.length) {
  ctx.message.warning(ctx.t('Please select records'));
  return;
}
// TODO: 执行业务逻辑…
ctx.message.success(ctx.t('Selected {n} items', { n: rows.length }));
```

### 3) 记录按钮：读取当前行记录 (Record Button: Read Current Row Record)

```js
if (!ctx.record) {
  ctx.message.error(ctx.t('No record'));
} else {
  ctx.message.success(ctx.t('Record ID: {id}', { id: ctx.record.id }))
}
```

### 4) 打开视图（抽屉/对话框） (Open View - Drawer/Dialog)

```js
const popupUid = ctx.model.uid + '-open'; // 绑定到当前按钮，保持稳定
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Details'), size: 'large' });
```

### 5) 提交后刷新数据 (Refresh Data After Submission)

```js
// 通用刷新：优先表格/列表资源，其次表单所在区块资源
if (ctx.resource?.refresh) await ctx.resource.refresh();
else if (ctx.blockModel?.resource?.refresh) await ctx.blockModel.resource.refresh();
```


## 注意事项 (Notes)

- ความเป็น Idempotent: หลีกเลี่ยงการส่งข้อมูลซ้ำจากการคลิกหลายครั้ง โดยสามารถเพิ่มการสลับสถานะหรือปิดใช้งานปุ่มในตรรกะได้ครับ/ค่ะ
- การจัดการข้อผิดพลาด: เพิ่ม try/catch สำหรับการเรียกใช้ API และแสดงการแจ้งเตือนแก่ผู้ใช้ครับ/ค่ะ
- การเชื่อมโยง View: เมื่อเปิดป๊อปอัป/ลิ้นชักผ่าน `ctx.openView` แนะนำให้ส่งพารามิเตอร์อย่างชัดเจน และรีเฟรชทรัพยากรหลักหลังจากส่งข้อมูลสำเร็จหากจำเป็นครับ/ค่ะ

## 相关文档 (Related Documents)

- [ตัวแปรและบริบท](/interface-builder/variables)
- [กฎการเชื่อมโยง](/interface-builder/linkage-rule)
- [View และป๊อปอัป](/interface-builder/actions/types/view)