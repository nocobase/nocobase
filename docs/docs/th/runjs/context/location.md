:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/runjs/context/location)
:::

# ctx.location

ข้อมูลตำแหน่งเส้นทาง (Route location) ปัจจุบัน ซึ่งเทียบเท่ากับออบเจ็กต์ `location` ของ React Router โดยปกติจะใช้ร่วมกับ `ctx.router` และ `ctx.route` เพื่ออ่านค่าเส้นทางปัจจุบัน (Path), Query string, Hash และ State ที่ส่งผ่านการกำหนดเส้นทาง (Route) ครับ

## สถาณการณ์ที่ใช้งาน

| สถานการณ์ | คำอธิบาย |
|------|------|
| **JSBlock / JSField** | ทำการแสดงผลตามเงื่อนไข (Conditional rendering) หรือแยกตรรกะการทำงานตามเส้นทางปัจจุบัน, พารามิเตอร์การค้นหา (Query parameters) หรือ Hash ครับ |
| **กฎการเชื่อมโยง (Linkage Rules) / กระแสเหตุการณ์ (Event Flow)** | อ่านพารามิเตอร์การค้นหาจาก URL เพื่อใช้ในการกรองข้อมูลแบบเชื่อมโยง หรือตรวจสอบแหล่งที่มาตาม `location.state` ครับ |
| **การจัดการหลังการเปลี่ยนเส้นทาง** | รับข้อมูลที่ส่งมาจากหน้าก่อนหน้าผ่าน `ctx.router.navigate` โดยใช้ `ctx.location.state` ในหน้าปลายทางครับ |

> หมายเหตุ: `ctx.location` จะใช้งานได้เฉพาะในสภาพแวดล้อม RunJS ที่มีบริบทของเส้นทาง (Routing context) เท่านั้น (เช่น JSBlock ภายในหน้าเพจ, กระแสเหตุการณ์ เป็นต้น) แต่อาจเป็นค่าว่างในบริบทของ Backend บริสุทธิ์หรือบริบทที่ไม่มีการกำหนดเส้นทาง (เช่น เวิร์กโฟลว์) ครับ

## การนิยามประเภท (Type Definition)

```ts
location: Location;
```

`Location` มาจาก `react-router-dom` ซึ่งสอดคล้องกับค่าที่ส่งกลับจาก `useLocation()` ของ React Router ครับ

## ฟิลด์ที่ใช้งานบ่อย

| ฟิลด์ | ประเภท | คำอธิบาย |
|------|------|------|
| `pathname` | `string` | เส้นทางปัจจุบัน เริ่มต้นด้วย `/` (เช่น `/admin/users`) |
| `search` | `string` | Query string เริ่มต้นด้วย `?` (เช่น `?page=1&status=active`) |
| `hash` | `string` | ส่วนของ Hash เริ่มต้นด้วย `#` (เช่น `#section-1`) |
| `state` | `any` | ข้อมูลใดๆ ที่ส่งผ่าน `ctx.router.navigate(path, { state })` ซึ่งจะไม่แสดงใน URL |
| `key` | `string` | ตัวระบุเฉพาะ (Unique identifier) สำหรับตำแหน่งนี้ โดยหน้าเริ่มต้นจะเป็น `"default"` |

## ความสัมพันธ์กับ ctx.router และ ctx.urlSearchParams

| วัตถุประสงค์ | วิธีการที่แนะนำ |
|------|----------|
| **อ่านเส้นทาง, hash, state** | `ctx.location.pathname` / `ctx.location.hash` / `ctx.location.state` |
| **อ่านพารามิเตอร์การค้นหา (ในรูปแบบออบเจ็กต์)** | `ctx.urlSearchParams` ซึ่งจะได้รับออบเจ็กต์ที่ถูกแยกส่วน (Parsed) แล้วโดยตรง |
| **แยกส่วน search string** | `new URLSearchParams(ctx.location.search)` หรือใช้ `ctx.urlSearchParams` โดยตรง |

`ctx.urlSearchParams` ถูกแยกส่วนมาจาก `ctx.location.search` หากคุณต้องการเพียงพารามิเตอร์การค้นหา การใช้ `ctx.urlSearchParams` จะสะดวกกว่าครับ

## ตัวอย่าง

### การแยกตรรกะตามเส้นทาง

```ts
if (ctx.location.pathname.startsWith('/admin/users')) {
  ctx.message.info('ปัจจุบันอยู่ที่หน้าจัดการผู้ใช้');
}
```

### การแยกส่วนพารามิเตอร์การค้นหา

```ts
// วิธีที่ 1: ใช้ ctx.urlSearchParams (แนะนำ)
const page = ctx.urlSearchParams.page || 1;
const status = ctx.urlSearchParams.status;

// วิธีที่ 2: ใช้ URLSearchParams เพื่อแยกส่วน search
const params = new URLSearchParams(ctx.location.search);
const page = params.get('page') || '1';
const status = params.get('status');
```

### การรับ state ที่ส่งผ่านการนำทางเส้นทาง

```ts
// เมื่อเปลี่ยนหน้าจากหน้าก่อนหน้า: ctx.router.navigate('/users/123', { state: { from: 'dashboard' } })
const prevState = ctx.location.state;
if (prevState?.from === 'dashboard') {
  ctx.message.info('เปลี่ยนหน้ามาจากแดชบอร์ด');
}
```

### การระบุตำแหน่ง Anchor ตาม hash

```ts
const hash = ctx.location.hash; // เช่น "#edit"
if (hash === '#edit') {
  // เลื่อนไปยังส่วนการแก้ไขหรือดำเนินการตามตรรกะที่เกี่ยวข้อง
}
```

## สิ่งที่เกี่ยวข้อง

- [ctx.router](./router.md): การนำทางเส้นทาง (Route navigation) โดย `state` จาก `ctx.router.navigate` สามารถรับได้ผ่าน `ctx.location.state` ในหน้าปลายทาง
- [ctx.route](./route.md): ข้อมูลการจับคู่เส้นทางปัจจุบัน (พารามิเตอร์, การตั้งค่า ฯลฯ) มักใช้ร่วมกับ `ctx.location`