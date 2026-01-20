:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# ResourceManager การจัดการทรัพยากร

ฟังก์ชันการจัดการทรัพยากรของ NocoBase สามารถแปลงคอลเลกชันและข้อมูลความสัมพันธ์ที่มีอยู่ให้เป็นทรัพยากรได้โดยอัตโนมัติ พร้อมด้วยประเภทการดำเนินการในตัวที่หลากหลาย เพื่อช่วยให้นักพัฒนาสามารถสร้างการดำเนินการทรัพยากร REST API ได้อย่างรวดเร็ว สิ่งที่แตกต่างจาก REST API แบบดั้งเดิมเล็กน้อยคือ การดำเนินการทรัพยากรของ NocoBase ไม่ได้ขึ้นอยู่กับเมธอดการร้องขอ HTTP แต่จะกำหนดการดำเนินการเฉพาะที่จะเรียกใช้ผ่านการระบุ `:action` อย่างชัดเจนครับ/ค่ะ

## การสร้างทรัพยากรโดยอัตโนมัติ

NocoBase จะแปลง `collection` และ `association` ที่กำหนดไว้ในฐานข้อมูลให้เป็นทรัพยากรโดยอัตโนมัติ ตัวอย่างเช่น หากเรากำหนดคอลเลกชัน `posts` และ `tags` สองคอลเลกชันดังนี้:

```ts
db.defineCollection({
  name: 'posts',
  fields: [
    { type: 'belongsToMany', name: 'tags' },
  ],
});

db.defineCollection({
  name: 'tags',
  fields: [],
});
```

สิ่งนี้จะสร้างทรัพยากรต่อไปนี้โดยอัตโนมัติ:

*   ทรัพยากร `posts`
*   ทรัพยากร `tags`
*   ทรัพยากรความสัมพันธ์ `posts.tags`

ตัวอย่างการร้องขอ:

| เมธอด   | พาธ                     | การดำเนินการ      |
| -------- | ---------------------- | -------------- |
| `GET`  | `/api/posts:list`      | สอบถามรายการ     |
| `GET`  | `/api/posts:get/1`     | สอบถามข้อมูลเดี่ยว |
| `POST` | `/api/posts:create`    | เพิ่มใหม่         |
| `POST` | `/api/posts:update/1`  | อัปเดต           |
| `POST` | `/api/posts:destroy/1` | ลบ             |

| เมธอด   | พาธ                     | การดำเนินการ      |
| -------- | ---------------------- | -------------- |
| `GET`  | `/api/tags:list`       | สอบถามรายการ     |
| `GET`  | `/api/tags:get/1`      | สอบถามข้อมูลเดี่ยว |
| `POST` | `/api/tags:create`     | เพิ่มใหม่         |
| `POST` | `/api/tags:update/1`   | อัปเดต           |
| `POST` | `/api/tags:destroy/1`  | ลบ             |

| เมธอด   | พาธ                             | การดำเนินการ                            |
| -------- | ------------------------------ | ------------------------------------ |
| `GET`  | `/api/posts/1/tags:list`       | สอบถามแท็กทั้งหมดที่เชื่อมโยงกับ `post`   |
| `GET`  | `/api/posts/1/tags:get/1`      | สอบถามแท็กเดี่ยวภายใต้ `post`           |
| `POST` | `/api/posts/1/tags:create`     | สร้างแท็กเดี่ยวภายใต้ `post`             |
| `POST` | `/api/posts/1/tags:update/1`   | อัปเดตแท็กเดี่ยวภายใต้ `post`             |
| `POST` | `/api/posts/1/tags:destroy/1`  | ลบแท็กเดี่ยวภายใต้ `post`               |
| `POST` | `/api/posts/1/tags:add`        | เพิ่มแท็กที่เชื่อมโยงกับ `post`           |
| `POST` | `/api/posts/1/tags:remove`     | ลบแท็กที่เชื่อมโยงออกจาก `post`         |
| `POST` | `/api/posts/1/tags:set`        | กำหนดแท็กที่เชื่อมโยงทั้งหมดสำหรับ `post` |
| `POST` | `/api/posts/1/tags:toggle`     | สลับการเชื่อมโยงแท็กสำหรับ `post`       |

:::tip เคล็ดลับ

การดำเนินการทรัพยากรของ NocoBase ไม่ได้ขึ้นอยู่กับเมธอดการร้องขอโดยตรง แต่จะกำหนดการดำเนินการผ่านการระบุ `:action` อย่างชัดเจนครับ/ค่ะ

:::

## การดำเนินการทรัพยากร

NocoBase มีประเภทการดำเนินการในตัวที่หลากหลาย เพื่อตอบสนองความต้องการทางธุรกิจที่แตกต่างกันครับ/ค่ะ

### การดำเนินการ CRUD พื้นฐาน

| ชื่อการดำเนินการ   | คำอธิบาย                         | ประเภททรัพยากรที่ใช้ได้ | เมธอดการร้องขอ | ตัวอย่างพาธ                |
| ---------------- | -------------------------------- | --------------------- | -------------- | --------------------------- |
| `list`           | สอบถามข้อมูลรายการ               | ทั้งหมด               | GET/POST       | `/api/posts:list`           |
| `get`            | สอบถามข้อมูลเดี่ยว               | ทั้งหมด               | GET/POST       | `/api/posts:get/1`          |
| `create`         | สร้างเรคคอร์ดใหม่                 | ทั้งหมด               | POST           | `/api/posts:create`         |
| `update`         | อัปเดตเรคคอร์ด                   | ทั้งหมด               | POST           | `/api/posts:update/1`       |
| `destroy`        | ลบเรคคอร์ด                       | ทั้งหมด               | POST           | `/api/posts:destroy/1`      |
| `firstOrCreate`  | ค้นหาเรคคอร์ดแรก หากไม่มีให้สร้าง | ทั้งหมด               | POST           | `/api/users:firstOrCreate`  |
| `updateOrCreate` | อัปเดตเรคคอร์ด หากไม่มีให้สร้าง   | ทั้งหมด               | POST           | `/api/users:updateOrCreate` |

### การดำเนินการความสัมพันธ์

| ชื่อการดำเนินการ | คำอธิบาย                 | ประเภทความสัมพันธ์ที่ใช้ได้                     | ตัวอย่างพาธ                   |
| -------------- | ------------------------ | ---------------------------------------- | ------------------------------ |
| `add`          | เพิ่มความสัมพันธ์         | `hasMany`, `belongsToMany`               | `/api/posts/1/tags:add`        |
| `remove`       | ลบความสัมพันธ์           | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo` | `/api/posts/1/comments:remove` |
| `set`          | รีเซ็ตความสัมพันธ์         | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo` | `/api/posts/1/comments:set`    |
| `toggle`       | เพิ่มหรือลบความสัมพันธ์ | `belongsToMany`                          | `/api/posts/1/tags:toggle`     |

### พารามิเตอร์การดำเนินการ

พารามิเตอร์การดำเนินการที่พบบ่อย ได้แก่:

*   `filter`: เงื่อนไขการสอบถาม
*   `values`: ค่าที่จะกำหนด
*   `fields`: ระบุฟิลด์ที่จะส่งคืน
*   `appends`: รวมข้อมูลที่เชื่อมโยง
*   `except`: ยกเว้นฟิลด์
*   `sort`: กฎการเรียงลำดับ
*   `page`、`pageSize`: พารามิเตอร์การแบ่งหน้า
*   `paginate`: เปิดใช้งานการแบ่งหน้าหรือไม่
*   `tree`: ส่งคืนโครงสร้างแบบต้นไม้หรือไม่
*   `whitelist`、`blacklist`: ไวต์ลิสต์/แบล็กลิสต์ฟิลด์
*   `updateAssociationValues`: อัปเดตค่าความสัมพันธ์หรือไม่

---

## การดำเนินการทรัพยากรแบบกำหนดเอง

NocoBase อนุญาตให้ลงทะเบียนการดำเนินการเพิ่มเติมสำหรับทรัพยากรที่มีอยู่ได้ครับ/ค่ะ คุณสามารถใช้ `registerActionHandlers` เพื่อกำหนดการดำเนินการสำหรับทรัพยากรทั้งหมดหรือทรัพยากรเฉพาะได้

### การลงทะเบียนการดำเนินการแบบ Global

```ts
resourceManager.registerActionHandlers({
  customAction: async (ctx) => {
    ctx.body = { resource: ctx.action.resourceName };
  },
});
```

### การลงทะเบียนการดำเนินการสำหรับทรัพยากรเฉพาะ

```ts
resourceManager.registerActionHandlers({
  'posts:publish': async (ctx) => publishPost(ctx),
  'posts.comments:pin': async (ctx) => pinComment(ctx),
});
```

ตัวอย่างการร้องขอ:

```
POST /api/posts:customAction
POST /api/posts:publish
POST /api/posts/1/comments:pin
```

กฎการตั้งชื่อ: `resourceName:actionName` และใช้ไวยากรณ์แบบจุด (`posts.comments`) เมื่อมีการรวมความสัมพันธ์ครับ/ค่ะ

## ทรัพยากรแบบกำหนดเอง

หากคุณต้องการจัดหาทรัพยากรที่ไม่เกี่ยวข้องกับคอลเลกชัน คุณสามารถใช้วิธี `resourceManager.define` เพื่อกำหนดได้ครับ/ค่ะ

```ts
resourceManager.define({
  name: 'app',
  actions: {
    getInfo: async (ctx) => {
      ctx.body = { version: 'v1' };
    },
  },
});
```

เมธอดการร้องขอจะสอดคล้องกับทรัพยากรที่สร้างโดยอัตโนมัติ:

*   `GET /api/app:getInfo`
*   `POST /api/app:getInfo` (รองรับทั้ง GET/POST โดยค่าเริ่มต้น)

## Middleware แบบกำหนดเอง

ใช้วิธี `resourceManager.use()` เพื่อลงทะเบียน middleware แบบ Global ครับ/ค่ะ ตัวอย่างเช่น:

Middleware สำหรับการบันทึก Log แบบ Global

```ts
resourceManager.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(`${ctx.method} ${ctx.path} - ${duration}ms`);
});
```

## คุณสมบัติ Context พิเศษ

การที่สามารถเข้าสู่ middleware หรือ action ในเลเยอร์ `resourceManager` ได้ หมายความว่าทรัพยากรนั้นจะต้องมีอยู่จริงครับ/ค่ะ

### ctx.action

-   `ctx.action.actionName`: ชื่อการดำเนินการ
-   `ctx.action.resourceName`: อาจเป็นคอลเลกชันหรือความสัมพันธ์
-   `ctx.action.params`: พารามิเตอร์การดำเนินการ

### ctx.dataSource

ออบเจกต์แหล่งข้อมูลปัจจุบัน

### ctx.getCurrentRepository()

ออบเจกต์ repository ปัจจุบัน

## วิธีรับออบเจกต์ resourceManager สำหรับแหล่งข้อมูลที่แตกต่างกัน

`resourceManager` เป็นของแหล่งข้อมูล และสามารถลงทะเบียนการดำเนินการแยกกันสำหรับแหล่งข้อมูลที่แตกต่างกันได้ครับ/ค่ะ

### แหล่งข้อมูลหลัก

สำหรับแหล่งข้อมูลหลัก คุณสามารถใช้ `app.resourceManager` ได้โดยตรง:

```ts
app.resourceManager.registerActionHandlers();
```

### แหล่งข้อมูลอื่น ๆ

สำหรับแหล่งข้อมูลอื่น ๆ คุณสามารถรับอินสแตนซ์แหล่งข้อมูลเฉพาะผ่าน `dataSourceManager` และใช้ออบเจกต์ `resourceManager` ของอินสแตนซ์นั้นเพื่อดำเนินการ:

```ts
const dataSource = dataSourceManager.get('external');
dataSource.resourceManager.registerActionHandlers();
```

### วนซ้ำแหล่งข้อมูลทั้งหมด

หากคุณต้องการดำเนินการเดียวกันกับแหล่งข้อมูลทั้งหมดที่เพิ่มเข้ามา คุณสามารถใช้วิธี `dataSourceManager.afterAddDataSource` เพื่อวนซ้ำ เพื่อให้แน่ใจว่า `resourceManager` ของแต่ละแหล่งข้อมูลสามารถลงทะเบียนการดำเนินการที่เกี่ยวข้องได้:

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandlers();
});
```