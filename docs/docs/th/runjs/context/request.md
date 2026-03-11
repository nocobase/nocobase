:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/runjs/context/request)
:::

# ctx.request()

ส่งคำขอ HTTP พร้อมการยืนยันตัวตน (Authentication) ภายใน RunJS โดยคำขอจะส่ง `baseURL`, `Token`, `locale`, `role` ฯลฯ ของแอปพลิเคชันปัจจุบันไปให้โดยอัตโนมัติ และจะใช้ตรรกะการดักจับคำขอ (Request Interception) และการจัดการข้อผิดพลาดของแอปพลิเคชันครับ

## สถานการณ์ที่ใช้งาน

สามารถใช้ได้กับทุกสถานการณ์ใน RunJS ที่ต้องการส่งคำขอ HTTP ไปยังเซิร์ฟเวอร์ปลายทาง เช่น JSBlock, JSField, JSItem, JSColumn, เวิร์กโฟลว์ (Workflow), การเชื่อมโยง (Linkage), JSAction เป็นต้นครับ

## การกำหนดประเภท (Type Definition)

```typescript
request(options: RequestOptions): Promise<AxiosResponse<any>>;
```

`RequestOptions` พัฒนาต่อยอดมาจาก `AxiosRequestConfig` ของ Axios:

```typescript
type RequestOptions = AxiosRequestConfig & {
  skipNotify?: boolean | ((error: any) => boolean);  // กำหนดว่าจะข้ามการแสดงข้อความแจ้งเตือนข้อผิดพลาดส่วนกลางเมื่อคำขอล้มเหลวหรือไม่
  skipAuth?: boolean;                                 // กำหนดว่าจะข้ามการเปลี่ยนเส้นทางเพื่อยืนยันตัวตนหรือไม่ (เช่น ไม่เปลี่ยนเส้นทางไปยังหน้าเข้าสู่ระบบเมื่อเกิดข้อผิดพลาด 401)
};
```

## พารามิเตอร์ที่ใช้บ่อย

| พารามิเตอร์ | ประเภท | คำอธิบาย |
|------|------|------|
| `url` | string | URL ของคำขอ รองรับรูปแบบทรัพยากร (เช่น `users:list`, `posts:create`) หรือ URL แบบเต็ม |
| `method` | 'get' \| 'post' \| 'put' \| 'patch' \| 'delete' | วิธีการ HTTP (HTTP Method) ค่าเริ่มต้นคือ `'get'` |
| `params` | object | พารามิเตอร์การสืบค้น (Query parameters) ซึ่งจะถูกแปลงเป็นสตริงต่อท้าย URL |
| `data` | any | เนื้อหาของคำขอ (Request body) สำหรับใช้กับ post/put/patch |
| `headers` | object | ส่วนหัวของคำขอ (Request headers) แบบกำหนดเอง |
| `skipNotify` | boolean \| (error) => boolean | หากเป็น true หรือฟังก์ชันคืนค่าเป็น true จะไม่มีการแสดงข้อความแจ้งเตือนข้อผิดพลาดส่วนกลางเมื่อเกิดความล้มเหลว |
| `skipAuth` | boolean | หากเป็น true ข้อผิดพลาดอย่าง 401 จะไม่กระตุ้นให้เกิดการเปลี่ยนเส้นทางเพื่อยืนยันตัวตน (เช่น การเปลี่ยนเส้นทางไปยังหน้าเข้าสู่ระบบ) |

## URL รูปแบบทรัพยากร (Resource Style URL)

Resource API ของ NocoBase รองรับรูปแบบย่อ `ทรัพยากร:การดำเนินการ` (resource:action) ดังนี้ครับ:

| รูปแบบ | คำอธิบาย | ตัวอย่าง |
|------|------|------|
| `collection:action` | CRUD สำหรับคอลเลกชันเดียว | `users:list`, `users:get`, `users:create`, `posts:update` |
| `collection.relation:action` | ทรัพยากรที่มีความสัมพันธ์กัน (จำเป็นต้องส่ง Primary Key ผ่าน `resourceOf` หรือ URL) | `posts.comments:list` |

เส้นทางแบบสัมพัทธ์ (Relative path) จะถูกนำไปต่อท้าย `baseURL` ของแอปพลิเคชัน (โดยปกติคือ `/api`) สำหรับคำขอข้ามโดเมน (Cross-origin) จะต้องใช้ URL แบบเต็ม และบริการปลายทางต้องได้รับการกำหนดค่า CORS ไว้ครับ

## โครงสร้างการตอบกลับ (Response Structure)

ค่าที่ส่งกลับคือออบเจกต์การตอบกลับของ Axios โดยมีฟิลด์ที่ใช้บ่อยดังนี้:

- `response.data`: เนื้อหาการตอบกลับ (Response body)
- อินเทอร์เฟซรายการ (List) มักจะส่งคืน `data.data` (อาร์เรย์ของระเบียน) + `data.meta` (ข้อมูลการแบ่งหน้า ฯลฯ)
- อินเทอร์เฟซสำหรับระเบียนเดียว/สร้าง/อัปเดต มักจะส่งคืนระเบียนใน `data.data`

## ตัวอย่าง

### การสืบค้นรายการ

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 10, page: 1 },
});

const rows = Array.isArray(data?.data) ? data.data : [];
const meta = data?.meta; // ข้อมูลการแบ่งหน้าและข้อมูลอื่น ๆ
```

### การส่งข้อมูล

```javascript
const res = await ctx.request({
  url: 'users:create',
  method: 'post',
  data: { nickname: 'สมชาย', email: 'somchai@example.com' },
});

const newRecord = res?.data?.data;
```

### การใช้งานร่วมกับตัวกรองและการเรียงลำดับ

```javascript
const res = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: {
    pageSize: 20,
    sort: ['-createdAt'],
    filter: { status: 'active' },
  },
});
```

### การข้ามการแจ้งเตือนข้อผิดพลาด

```javascript
const res = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: true,  // ไม่แสดงข้อความแจ้งเตือนส่วนกลางเมื่อล้มเหลว
});

// หรือตัดสินใจว่าจะข้ามตามประเภทของข้อผิดพลาด
const res2 = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: (err) => err?.name === 'CanceledError',
});
```

### คำขอข้ามโดเมน (Cross-Origin Request)

เมื่อใช้ URL แบบเต็มเพื่อขอข้อมูลจากโดเมนอื่น บริการปลายทางต้องได้รับการกำหนดค่า CORS เพื่ออนุญาตให้แอปพลิเคชันปัจจุบันเข้าถึงได้ หากอินเทอร์เฟซปลายทางต้องการ Token ของตัวเอง สามารถส่งผ่าน headers ได้ดังนี้ครับ:

```javascript
const res = await ctx.request({
  url: 'https://api.example.com/v1/data',
  method: 'get',
});

const res2 = await ctx.request({
  url: 'https://api.other.com/items',
  method: 'get',
  headers: {
    Authorization: 'Bearer <Token ของบริการปลายทาง>',
  },
});
```

### การใช้งานร่วมกับ ctx.render เพื่อแสดงผล

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 5 },
});
const rows = Array.isArray(data?.data) ? data.data : [];

ctx.render([
  '<div style="padding:12px">',
  '<h4>' + ctx.t('รายการผู้ใช้') + '</h4>',
  '<ul>',
  ...rows.map((r) => '<li>' + (r.nickname ?? r.username ?? '') + '</li>'),
  '</ul>',
  '</div>',
].join(''));
```

## ข้อควรระวัง

- **การจัดการข้อผิดพลาด**: หากคำขอล้มเหลวจะมีการโยนข้อผิดพลาด (Exception) ออกมา และจะมีการแสดงข้อความแจ้งเตือนข้อผิดพลาดส่วนกลางโดยค่าเริ่มต้น คุณสามารถใช้ `skipNotify: true` เพื่อดักจับและจัดการด้วยตนเองได้ครับ
- **การยืนยันตัวตน**: คำขอในโดเมนเดียวกันจะส่ง Token, locale และ role ของผู้ใช้ปัจจุบันไปให้โดยอัตโนมัติ สำหรับคำขอข้ามโดเมน ปลายทางจำเป็นต้องรองรับ CORS และต้องส่ง Token ผ่าน headers ตามความจำเป็นครับ
- **สิทธิ์การเข้าถึงทรัพยากร**: คำขอจะอยู่ภายใต้ข้อจำกัดของ ACL และสามารถเข้าถึงได้เฉพาะทรัพยากรที่ผู้ใช้ปัจจุบันได้รับอนุญาตเท่านั้นครับ

## สิ่งที่เกี่ยวข้อง

- [ctx.message](./message.md) - แสดงข้อความแจ้งเตือนแบบเบาหลังจากคำขอเสร็จสิ้น
- [ctx.notification](./notification.md) - แสดงการแจ้งเตือนหลังจากคำขอเสร็จสิ้น
- [ctx.render](./render.md) - เรนเดอร์ผลลัพธ์ของคำขอไปยังหน้าอินเทอร์เฟซ
- [ctx.makeResource](./make-resource.md) - สร้างออบเจกต์ทรัพยากรสำหรับการโหลดข้อมูลแบบต่อเนื่อง (เป็นทางเลือกนอกเหนือจากการใช้ `ctx.request` โดยตรง)