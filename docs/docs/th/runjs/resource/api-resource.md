:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/runjs/resource/api-resource)
:::

# APIResource

**APIResource** เป็นทรัพยากร API ทั่วไปที่ใช้การส่งคำขอผ่าน URL ซึ่งเหมาะสำหรับอินเทอร์เฟซ HTTP ใด ๆ โดยสืบทอดมาจากคลาสพื้นฐาน FlowResource และขยายความสามารถในการกำหนดค่าคำขอรวมถึงฟังก์ชัน `refresh()` ต่างจาก [MultiRecordResource](./multi-record-resource.md) และ [SingleRecordResource](./single-record-resource.md) ตรงที่ APIResource ไม่ขึ้นอยู่กับชื่อทรัพยากร แต่จะส่งคำขอตาม URL โดยตรง จึงเหมาะสำหรับอินเทอร์เฟซที่กำหนดเอง (Custom Interface), API ของบุคคลที่สาม และสถานการณ์อื่น ๆ ครับ

**วิธีการสร้าง**: `ctx.makeResource('APIResource')` หรือ `ctx.initResource('APIResource')` ก่อนใช้งานต้องเรียก `setURL()` สำหรับในบริบทของ RunJS จะมีการแทรก `ctx.api` (APIClient) ให้โดยอัตโนมัติ จึงไม่จำเป็นต้องเรียก `setAPIClient` ด้วยตนเองครับ

---

## สถาณการณ์ที่ใช้งาน

| สถานการณ์ | คำอธิบาย |
|------|------|
| **อินเทอร์เฟซที่กำหนดเอง** | เรียกใช้ API ทรัพยากรที่ไม่เป็นมาตรฐาน (เช่น `/api/custom/stats`, `/api/reports/summary`) |
| **API ของบุคคลที่สาม** | ส่งคำขอไปยังบริการภายนอกผ่าน URL แบบเต็ม (เป้าหมายต้องรองรับ CORS) |
| **การสืบค้นแบบครั้งเดียว** | ดึงข้อมูลชั่วคราวเพื่อใช้งานแล้วทิ้งไป โดยไม่ต้องผูกกับ `ctx.resource` |
| **การเลือกระหว่าง APIResource และ ctx.request** | ใช้ APIResource เมื่อต้องการข้อมูลแบบตอบสนอง (Reactive), เหตุการณ์ (Events) หรือสถานะข้อผิดพลาด; ใช้ `ctx.request()` สำหรับคำขอแบบครั้งเดียวที่เรียบง่าย |

---

## ความสามารถของคลาสพื้นฐาน (FlowResource)

Resource ทั้งหมดมีความสามารถดังนี้:

| วิธีการ | คำอธิบาย |
|------|------|
| `getData()` | รับข้อมูลปัจจุบัน |
| `setData(value)` | ตั้งค่าข้อมูล (เฉพาะในเครื่อง) |
| `hasData()` | ตรวจสอบว่ามีข้อมูลหรือไม่ |
| `getMeta(key?)` / `setMeta(meta)` | อ่าน/เขียนเมทาดาตา |
| `getError()` / `setError(err)` / `clearError()` | จัดการสถานะข้อผิดพลาด |
| `on(event, callback)` / `once` / `off` / `emit` | การติดตามและเรียกใช้เหตุการณ์ |

---

## การกำหนดค่าคำขอ

| วิธีการ | คำอธิบาย |
|------|------|
| `setAPIClient(api)` | ตั้งค่าอินสแตนซ์ APIClient (ใน RunJS มักจะถูกแทรกให้โดยอัตโนมัติ) |
| `getURL()` / `setURL(url)` | URL ของคำขอ |
| `loading` | อ่าน/เขียนสถานะการโหลด (get/set) |
| `clearRequestParameters()` | ล้างพารามิเตอร์คำขอ |
| `setRequestParameters(params)` | รวมและตั้งค่าพารามิเตอร์คำขอ |
| `setRequestMethod(method)` | ตั้งค่าวิธีการส่งคำขอ (เช่น `'get'`, `'post'`, ค่าเริ่มต้นคือ `'get'`) |
| `addRequestHeader(key, value)` / `removeRequestHeader(key)` | ส่วนหัวของคำขอ (Headers) |
| `addRequestParameter(key, value)` / `getRequestParameter(key)` / `removeRequestParameter(key)` | เพิ่ม ลบ หรือค้นหาพารามิเตอร์เดี่ยว |
| `setRequestBody(data)` | เนื้อหาของคำขอ (Request Body - ใช้สำหรับ POST/PUT/PATCH) |
| `setRequestOptions(key, value)` / `getRequestOptions()` | ตัวเลือกคำขอทั่วไป |

---

## รูปแบบ URL

- **รูปแบบทรัพยากร**: รองรับการเขียนย่อแบบทรัพยากรของ NocoBase เช่น `users:list`, `posts:get` ซึ่งจะถูกนำไปเชื่อมต่อกับ `baseURL`
- **เส้นทางสัมพัทธ์ (Relative Path)**: เช่น `/api/custom/endpoint` จะถูกนำไปเชื่อมต่อกับ `baseURL` ของแอปพลิเคชัน
- **URL แบบเต็ม**: ใช้ที่อยู่แบบเต็มสำหรับการส่งคำขอข้ามโดเมน โดยปลายทางต้องมีการกำหนดค่า CORS

---

## การดึงข้อมูล

| วิธีการ | คำอธิบาย |
|------|------|
| `refresh()` | เริ่มส่งคำขอตาม URL, method, params, headers และ data ปัจจุบัน โดยจะเขียนข้อมูลที่ตอบกลับลงใน `setData(data)` และทริกเกอร์เหตุการณ์ `'refresh'` หากล้มเหลวจะตั้งค่า `setError(err)` และโยน `ResourceError` ออกมา โดยไม่ทริกเกอร์เหตุการณ์ `refresh` ทั้งนี้ต้องมีการตั้งค่า `api` และ URL ไว้ก่อนแล้ว |

---

## ตัวอย่าง

### การส่งคำขอ GET พื้นฐาน

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/endpoint');
res.setRequestParameters({ page: 1, pageSize: 10 });
await res.refresh();
const data = res.getData();
```

### URL รูปแบบทรัพยากร

```js
const res = ctx.makeResource('APIResource');
res.setURL('users:list');
res.setRequestParameters({ pageSize: 20, sort: ['-createdAt'] });
await res.refresh();
const rows = res.getData()?.data ?? [];
```

### คำขอ POST (พร้อม Request Body)

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/submit');
res.setRequestMethod('post');
res.setRequestBody({ name: 'ทดสอบ', type: 'report' });
await res.refresh();
const result = res.getData();
```

### การฟังเหตุการณ์ refresh

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/stats');
res.on('refresh', () => {
  const data = res.getData();
  ctx.render(<div>สถิติ: {JSON.stringify(data)}</div>);
});
await res.refresh();
```

### การจัดการข้อผิดพลาด

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/may-fail');
try {
  await res.refresh();
  const data = res.getData();
} catch (e) {
  const err = res.getError();
  ctx.message.error(err?.message ?? 'คำขอล้มเหลว');
}
```

### ส่วนหัวของคำขอที่กำหนดเอง

```js
const res = ctx.makeResource('APIResource');
res.setURL('https://api.example.com/data');
res.addRequestHeader('X-Custom-Header', 'value');
res.addRequestParameter('key', 'xxx');
await res.refresh();
```

---

## ข้อควรระวัง

- **การพึ่งพา ctx.api**: ใน RunJS `ctx.api` จะถูกแทรกโดยสภาพแวดล้อมการทำงาน ปกติไม่จำเป็นต้องเรียก `setAPIClient` เอง หากใช้งานในสถานการณ์ที่ไม่มีบริบท (Context) คุณต้องตั้งค่าด้วยตนเองครับ
- **refresh คือการส่งคำขอ**: `refresh()` จะส่งคำขอตามการกำหนดค่าปัจจุบัน ดังนั้น method, params, data ฯลฯ ต้องถูกกำหนดให้เรียบร้อยก่อนเรียกใช้งาน
- **ข้อผิดพลาดจะไม่ล้างข้อมูล**: เมื่อคำขอล้มเหลว `getData()` จะยังคงค่าเดิมไว้ สามารถดูข้อมูลข้อผิดพลาดได้ผ่าน `getError()`
- **เปรียบเทียบกับ ctx.request**: ใช้ `ctx.request()` สำหรับคำขอแบบครั้งเดียวที่เรียบง่าย; ใช้ APIResource เมื่อต้องการการจัดการข้อมูลแบบตอบสนอง, เหตุการณ์ และสถานะข้อผิดพลาดครับ

---

## สิ่งที่เกี่ยวข้อง

- [ctx.resource](../context/resource.md) - อินสแตนซ์ resource ในบริบทปัจจุบัน
- [ctx.initResource()](../context/init-resource.md) - เริ่มต้นใช้งานและผูกกับ ctx.resource
- [ctx.makeResource()](../context/make-resource.md) - สร้างอินสแตนซ์ resource ใหม่โดยไม่ผูกมัด
- [ctx.request()](../context/request.md) - คำขอ HTTP ทั่วไป เหมาะสำหรับการเรียกใช้แบบครั้งเดียวที่เรียบง่าย
- [MultiRecordResource](./multi-record-resource.md) - สำหรับคอลเลกชัน/รายการ รองรับ CRUD และการแบ่งหน้า
- [SingleRecordResource](./single-record-resource.md) - สำหรับข้อมูลรายการเดียว