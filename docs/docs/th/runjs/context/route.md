:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/runjs/context/route)
:::

# ctx.route

ข้อมูลการจับคู่เส้นทาง (Route Matching) ปัจจุบัน ซึ่งสอดคล้องกับแนวคิด `route` ใน React Router ใช้สำหรับดึงข้อมูลการกำหนดค่าเส้นทาง (Route Configuration), พารามิเตอร์ และข้อมูลอื่น ๆ ที่ตรงกันในปัจจุบัน โดยปกติจะใช้งานร่วมกับ `ctx.router` และ `ctx.location` ครับ

## สถาณการณ์ที่ใช้งาน

| สถานการณ์ | คำอธิบาย |
|------|------|
| **JSBlock / JSField** | ทำ Conditional Rendering หรือแสดงตัวระบุหน้าปัจจุบันโดยพิจารณาจาก `route.pathname` หรือ `route.params` |
| **กฎการเชื่อมโยง (Linkage Rules) / FlowEngine** | อ่านพารามิเตอร์ของเส้นทาง (เช่น `params.name`) เพื่อทำ Logic Branching หรือส่งค่าไปยังคอมโพเนนต์ลูก |
| **การนำทางในมุมมอง (View Navigation)** | เปรียบเทียบ `ctx.route.pathname` กับเส้นทางเป้าหมายภายใน เพื่อตัดสินใจว่าจะเรียกใช้ `ctx.router.navigate` หรือไม่ |

> หมายเหตุ: `ctx.route` จะใช้งานได้เฉพาะในสภาพแวดล้อม RunJS ที่มีบริบทของเส้นทาง (Routing Context) เท่านั้น (เช่น JSBlock ภายในหน้าเพจ, หน้า Flow เป็นต้น) และอาจเป็นค่าว่าง (null) ในบริบทที่เป็นหลังบ้าน (Backend) ล้วน ๆ หรือไม่มีการกำหนดเส้นทาง (เช่น เวิร์กโฟลว์) ครับ

## การนิยามประเภท (Type Definition)

```ts
type RouteOptions = {
  name?: string;   // ตัวระบุเฉพาะของเส้นทาง
  path?: string;   // เทมเพลตเส้นทาง (เช่น /admin/:name)
  params?: Record<string, any>;  // พารามิเตอร์ของเส้นทาง (เช่น { name: 'users' })
  pathname?: string;  // เส้นทางแบบเต็มของเส้นทางปัจจุบัน (เช่น /admin/users)
};
```

## ฟิลด์ที่ใช้งานบ่อย

| ฟิลด์ | ประเภท | คำอธิบาย |
|------|------|------|
| `pathname` | `string` | เส้นทางแบบเต็มของเส้นทางปัจจุบัน ซึ่งตรงกับ `ctx.location.pathname` |
| `params` | `Record<string, any>` | พารามิเตอร์แบบไดนามิกที่แยกมาจากเทมเพลตเส้นทาง เช่น `{ name: 'users' }` |
| `path` | `string` | เทมเพลตเส้นทาง เช่น `/admin/:name` |
| `name` | `string` | ตัวระบุเฉพาะของเส้นทาง มักใช้ในกรณีที่มีหลาย Tab หรือหลายมุมมอง (View) |

## ความสัมพันธ์กับ ctx.router และ ctx.location

| วัตถุประสงค์ | วิธีการใช้งานที่แนะนำ |
|------|----------|
| **อ่านเส้นทางปัจจุบัน** | `ctx.route.pathname` หรือ `ctx.location.pathname` โดยทั้งสองค่าจะตรงกันเมื่อมีการจับคู่เส้นทาง |
| **อ่านพารามิเตอร์เส้นทาง** | `ctx.route.params` เช่น `params.name` ซึ่งแทน UID ของหน้าปัจจุบัน |
| **การนำทาง (Navigation)** | `ctx.router.navigate(path)` |
| **อ่าน Query Parameters, state** | `ctx.location.search`, `ctx.location.state` |

`ctx.route` จะเน้นที่ "การกำหนดค่าเส้นทางที่จับคู่ได้" ในขณะที่ `ctx.location` จะเน้นที่ "ตำแหน่ง URL ปัจจุบัน" ทั้งสองส่วนนี้ทำงานร่วมกันเพื่อให้ข้อมูลสถานะของเส้นทางที่สมบูรณ์ครับ

## ตัวอย่าง

### การอ่าน pathname

```ts
// แสดงเส้นทางปัจจุบัน
ctx.message.info('หน้าปัจจุบัน: ' + ctx.route.pathname);
```

### การทำ Branching ตาม params

```ts
// โดยปกติ params.name จะเป็น UID ของหน้าปัจจุบัน (เช่น ตัวระบุหน้า flow)
if (ctx.route.params?.name === 'users') {
  // ดำเนินการตรรกะเฉพาะในหน้าการจัดการผู้ใช้
}
```

### การแสดงผลในหน้า Flow

```tsx
<div>
  <h1>หน้าปัจจุบัน - {ctx.route.pathname}</h1>
  <p>ตัวระบุเส้นทาง: {ctx.route.params?.name}</p>
</div>
```

## สิ่งที่เกี่ยวข้อง

- [ctx.router](./router.md): การนำทางเส้นทาง เมื่อ `ctx.router.navigate()` เปลี่ยนเส้นทาง `ctx.route` จะอัปเดตตาม
- [ctx.location](./location.md): ตำแหน่ง URL ปัจจุบัน (pathname, search, hash, state) ใช้งานร่วมกับ `ctx.route`