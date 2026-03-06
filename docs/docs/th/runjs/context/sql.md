:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/runjs/context/sql)
:::

# ctx.sql

`ctx.sql` ให้ความสามารถในการรันและจัดการ SQL มักใช้ใน RunJS (เช่น JSBlock และเวิร์กโฟลว์) เพื่อเข้าถึงฐานข้อมูลโดยตรง รองรับการรัน SQL แบบชั่วคราว, การรันเทมเพลต SQL ที่บันทึกไว้ตาม ID, การผูกพารามิเตอร์ (Parameter Binding), ตัวแปรเทมเพลต (`{{ctx.xxx}}`) และการควบคุมประเภทของผลลัพธ์ครับ

## สถานการณ์ที่ใช้งาน

| สถานการณ์ | คำอธิบาย |
|------|------|
| **JSBlock** | รายงานสถิติแบบกำหนดเอง, รายการตัวกรองที่ซับซ้อน, การคิวรีแบบรวมข้อมูลข้ามตาราง (Cross-table aggregation) |
| **Chart Block** | บันทึกเทมเพลต SQL เพื่อใช้เป็นแหล่งข้อมูลสำหรับแผนภูมิ |
| **เวิร์กโฟลว์ / การเชื่อมโยง (Linkage)** | รัน SQL ที่ตั้งค่าไว้ล่วงหน้าเพื่อดึงข้อมูลไปใช้ในตรรกะถัดไป |
| **SQLResource** | ใช้ร่วมกับ `ctx.initResource('SQLResource')` สำหรับสถานการณ์เช่น รายการที่มีการแบ่งหน้า (Pagination) |

> หมายเหตุ: `ctx.sql` เข้าถึงฐานข้อมูลผ่าน API `flowSql` โปรดตรวจสอบให้แน่ใจว่าผู้ใช้ปัจจุบันมีสิทธิ์ในการรันสำหรับแหล่งข้อมูลที่เกี่ยวข้องครับ

## คำอธิบายสิทธิ์การใช้งาน

| สิทธิ์ | วิธีการ (Method) | คำอธิบาย |
|------|------|------|
| **ผู้ใช้ที่เข้าสู่ระบบ** | `runById` | รันตาม ID ของเทมเพลต SQL ที่กำหนดไว้ |
| **สิทธิ์การกำหนดค่า SQL** | `run`, `save`, `destroy` | รัน SQL ชั่วคราว, บันทึก/อัปเดต/ลบ เทมเพลต SQL |

สำหรับตรรกะฝั่ง Frontend ของผู้ใช้ทั่วไปควรใช้ `ctx.sql.runById(uid, options)` หากต้องการ SQL แบบไดนามิกหรือการจัดการเทมเพลต ต้องตรวจสอบให้แน่ใจว่าบทบาทปัจจุบันมีสิทธิ์การกำหนดค่า SQL ครับ

## การกำหนดประเภท (Type Definition)

```ts
sql: FlowSQLRepository;

interface FlowSQLRepository {
  run<T = any>(
    sql: string,
    options?: {
      bind?: Record<string, any> | any[];
      type?: 'selectRows' | 'selectRow' | 'selectVar';
      dataSourceKey?: string;
      filter?: Record<string, any>;
    },
  ): Promise<T>;

  save(options: { uid: string; sql: string; dataSourceKey?: string }): Promise<void>;

  runById<T = any>(
    uid: string,
    options?: {
      bind?: Record<string, any> | any[];
      type?: 'selectRows' | 'selectRow' | 'selectVar';
      dataSourceKey?: string;
      filter?: Record<string, any>;
    },
  ): Promise<T>;

  destroy(uid: string): Promise<void>;
}
```

## วิธีการที่ใช้บ่อย

| วิธีการ | คำอธิบาย | ข้อกำหนดสิทธิ์ |
|------|------|----------|
| `ctx.sql.run(sql, options?)` | รัน SQL ชั่วคราว รองรับการผูกพารามิเตอร์และตัวแปรเทมเพลต | ต้องมีสิทธิ์การกำหนดค่า SQL |
| `ctx.sql.save({ uid, sql, dataSourceKey? })` | บันทึกหรืออัปเดตเทมเพลต SQL ตาม ID เพื่อนำกลับมาใช้ใหม่ | ต้องมีสิทธิ์การกำหนดค่า SQL |
| `ctx.sql.runById(uid, options?)` | รันเทมเพลต SQL ที่บันทึกไว้ตาม ID | ผู้ใช้ที่เข้าสู่ระบบทุกคน |
| `ctx.sql.destroy(uid)` | ลบเทมเพลต SQL ที่ระบุตาม ID | ต้องมีสิทธิ์การกำหนดค่า SQL |

ข้อควรระวัง:

- `run` ใช้สำหรับการดีบัก SQL และต้องมีสิทธิ์การกำหนดค่า
- `save` และ `destroy` ใช้สำหรับการจัดการเทมเพลต SQL และต้องมีสิทธิ์การกำหนดค่า
- `runById` เปิดให้ผู้ใช้ทั่วไปใช้งานได้ โดยสามารถรันได้เฉพาะเทมเพลตที่บันทึกไว้เท่านั้น ไม่สามารถดีบักหรือแก้ไข SQL ได้
- เมื่อมีการเปลี่ยนแปลงเทมเพลต SQL ต้องเรียกใช้ `save` เพื่อบันทึกการเปลี่ยนแปลงครับ

## คำอธิบายพารามิเตอร์

### options สำหรับ run / runById

| พารามิเตอร์ | ประเภท | คำอธิบาย |
|------|------|------|
| `bind` | `Record<string, any>` \| `any[]` | ตัวแปรที่ผูกไว้ แบบ Object ใช้คู่กับ `:name`, แบบ Array ใช้คู่กับ `?` |
| `type` | `'selectRows'` \| `'selectRow'` \| `'selectVar'` | ประเภทผลลัพธ์: หลายแถว, แถวเดียว, ค่าเดียว (ค่าเริ่มต้นคือ `selectRows`) |
| `dataSourceKey` | `string` | ตัวระบุแหล่งข้อมูล (Data Source) ค่าเริ่มต้นคือแหล่งข้อมูลหลัก |
| `filter` | `Record<string, any>` | เงื่อนไขการกรองเพิ่มเติม (ขึ้นอยู่กับการรองรับของอินเทอร์เฟซ) |

### options สำหรับ save

| พารามิเตอร์ | ประเภท | คำอธิบาย |
|------|------|------|
| `uid` | `string` | ตัวระบุเฉพาะของเทมเพลต เมื่อบันทึกแล้วสามารถรันผ่าน `runById(uid, ...)` ได้ |
| `sql` | `string` | เนื้อหา SQL รองรับตัวแปรเทมเพลต `{{ctx.xxx}}` และตัวแทนที่ `:name` / `?` |
| `dataSourceKey` | `string` | (ไม่บังคับ) ตัวระบุแหล่งข้อมูล |

## ตัวแปรเทมเพลต SQL และการผูกพารามิเตอร์

### ตัวแปรเทมเพลต `{{ctx.xxx}}`

ใน SQL สามารถใช้ `{{ctx.xxx}}` เพื่ออ้างอิงตัวแปรบริบท ซึ่งจะถูกแปลงเป็นค่าจริงก่อนการรัน:

```js
// อ้างอิง ctx.user.id
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = {{ctx.user.id}}',
  { type: 'selectRow' }
);
```

แหล่งที่มาของตัวแปรที่อ้างอิงได้จะเหมือนกับ `ctx.getVar()` (เช่น `ctx.user.*`, `ctx.record.*`, การกำหนดเองผ่าน `ctx.defineProperty` เป็นต้น)

### การผูกพารามิเตอร์ (Parameter Binding)

- **พารามิเตอร์แบบระบุชื่อ (Named Parameters)**: ใช้ `:name` ใน SQL และส่ง Object `{ name: value }` ใน `bind`
- **พารามิเตอร์แบบระบุตำแหน่ง (Positional Parameters)**: ใช้ `?` ใน SQL และส่ง Array `[value1, value2]` ใน `bind`

```js
// พารามิเตอร์แบบระบุชื่อ
const users = await ctx.sql.run(
  'SELECT * FROM users WHERE status = :status AND age > :minAge',
  { bind: { status: 'active', minAge: 18 }, type: 'selectRows' }
);

// พารามิเตอร์แบบระบุตำแหน่ง
const count = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users WHERE city = ? AND status = ?',
  { bind: ['Bangkok', 'active'], type: 'selectVar' }
);
```

## ตัวอย่าง

### การรัน SQL ชั่วคราว (ต้องมีสิทธิ์การกำหนดค่า SQL)

```js
// ผลลัพธ์หลายแถว (ค่าเริ่มต้น)
const rows = await ctx.sql.run('SELECT * FROM users LIMIT 10');

// ผลลัพธ์แถวเดียว
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = :id',
  { bind: { id: 1 }, type: 'selectRow' }
);

// ผลลัพธ์ค่าเดียว (เช่น COUNT, SUM)
const total = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users',
  { type: 'selectVar' }
);
```

### การใช้ตัวแปรเทมเพลต

```js
ctx.defineProperty('minId', { get: () => 1 });

const rows = await ctx.sql.run(
  'SELECT * FROM users WHERE id > {{ctx.minId}}',
  { type: 'selectRows' }
);
```

### การบันทึกเทมเพลตและนำกลับมาใช้ใหม่

```js
// บันทึก (ต้องมีสิทธิ์การกำหนดค่า SQL)
await ctx.sql.save({
  uid: 'active-users-report',
  sql: 'SELECT * FROM users WHERE status = :status ORDER BY created_at DESC',
});

// ผู้ใช้ที่เข้าสู่ระบบทุกคนสามารถรันได้
const users = await ctx.sql.runById('active-users-report', {
  bind: { status: 'active' },
  type: 'selectRows',
});

// ลบเทมเพลต (ต้องมีสิทธิ์การกำหนดค่า SQL)
await ctx.sql.destroy('active-users-report');
```

### รายการแบบแบ่งหน้า (SQLResource)

```js
// เมื่อต้องการการแบ่งหน้าหรือการกรอง สามารถใช้ SQLResource ได้
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('saved-sql-uid');  // ID ของเทมเพลต SQL ที่บันทึกไว้
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta();  // ประกอบด้วย page, pageSize ฯลฯ
```

## ความสัมพันธ์กับ ctx.resource และ ctx.request

| วัตถุประสงค์ | วิธีการที่แนะนำ |
|------|----------|
| **รันการคิวรี SQL** | `ctx.sql.run()` หรือ `ctx.sql.runById()` |
| **รายการ SQL แบบแบ่งหน้า (Block)** | `ctx.initResource('SQLResource')` + `ctx.resource.refresh()` |
| **คำขอ HTTP ทั่วไป** | `ctx.request()` |

`ctx.sql` ครอบคลุม API `flowSql` และออกแบบมาเพื่อสถานการณ์การใช้ SQL โดยเฉพาะ ส่วน `ctx.request` สามารถใช้เรียก API ใดก็ได้ครับ

## ข้อควรระวัง

- ใช้การผูกพารามิเตอร์ (`:name` / `?`) แทนการต่อสตริง เพื่อหลีกเลี่ยง SQL Injection
- เมื่อใช้ `type: 'selectVar'` จะคืนค่าเป็นสเกลาร์ (Scalar value) มักใช้กับ `COUNT`, `SUM` เป็นต้น
- ตัวแปรเทมเพลต `{{ctx.xxx}}` จะถูกประมวลผลก่อนการรัน โปรดตรวจสอบให้แน่ใจว่ามีการกำหนดตัวแปรที่เกี่ยวข้องไว้ในบริบทแล้ว

## สิ่งที่เกี่ยวข้อง

- [ctx.resource](./resource.md): ทรัพยากรข้อมูล โดย SQLResource จะเรียกใช้ API `flowSql` ภายใน
- [ctx.initResource()](./init-resource.md): เริ่มต้นใช้งาน SQLResource สำหรับรายการแบบแบ่งหน้า ฯลฯ
- [ctx.request()](./request.md): การส่งคำขอ HTTP ทั่วไป