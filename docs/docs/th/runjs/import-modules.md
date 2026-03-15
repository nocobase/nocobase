:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/runjs/import-modules)
:::

# การนำเข้าโมดูล

ใน RunJS คุณสามารถใช้โมดูลได้ 2 ประเภท: **โมดูลในตัว (Built-in modules)** (เข้าถึงได้โดยตรงผ่าน `ctx.libs` โดยไม่ต้อง import) และ **โมดูลภายนอก (External modules)** (โหลดตามความต้องการผ่าน `ctx.importAsync()` หรือ `ctx.requireAsync()`) ครับ

---

## โมดูลในตัว - ctx.libs (ไม่ต้อง import)

RunJS มาพร้อมกับไลบรารีที่ใช้บ่อย ซึ่งสามารถเข้าถึงได้โดยตรงผ่าน `ctx.libs` โดย**ไม่จำเป็น**ต้องใช้ `import` หรือโหลดแบบ Asynchronous ครับ

| คุณสมบัติ | คำอธิบาย |
|------|------|
| **ctx.libs.React** | React หลัก สำหรับใช้กับ JSX และ Hooks |
| **ctx.libs.ReactDOM** | ReactDOM (เช่น หากต้องการใช้ `createRoot` เป็นต้น) |
| **ctx.libs.antd** | ไลบรารีคอมโพเนนต์ Ant Design |
| **ctx.libs.antdIcons** | ไอคอน Ant Design |
| **ctx.libs.math** | [Math.js](https://mathjs.org/): นิพจน์ทางคณิตศาสตร์, การดำเนินการเมทริกซ์ ฯลฯ |
| **ctx.libs.formula** | [Formula.js](https://formulajs.github.io/): สูตรที่คล้ายกับ Excel (SUM, AVERAGE ฯลฯ) |

### ตัวอย่าง: React และ antd

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>คลิก</Button>);
```

### ตัวอย่าง: ctx.libs.math

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');
// result === 14
```

### ตัวอย่าง: ctx.libs.formula

```ts
const values = [1, 2, 3, 4];
const sum = ctx.libs.formula.SUM(values);
const avg = ctx.libs.formula.AVERAGE(values);
```

---

## โมดูลภายนอก

เมื่อต้องการใช้ไลบรารีจากภายนอก (Third-party) ให้เลือกวิธีการโหลดตามรูปแบบของโมดูลดังนี้:

- **โมดูล ESM** → ใช้ `ctx.importAsync()`
- **โมดูล UMD/AMD** → ใช้ `ctx.requireAsync()`

---

### การนำเข้าโมดูล ESM

ใช้ **`ctx.importAsync()`** เพื่อโหลดโมดูล ESM แบบไดนามิกตาม URL ซึ่งเหมาะสำหรับใช้งานใน JS Block, JS Field และ JS Action เป็นต้นครับ

```ts
importAsync<T = any>(url: string): Promise<T>;
```

- **url**: ที่อยู่ของโมดูล ESM รองรับรูปแบบย่อ เช่น `<ชื่อแพ็กเกจ>@<เวอร์ชัน>` หรือระบุเส้นทางย่อย เช่น `<ชื่อแพ็กเกจ>@<เวอร์ชัน>/<เส้นทางไฟล์>` (เช่น `vue@3.4.0`, `lodash@4/lodash.js`) โดยจะมีการเติม Prefix ของ CDN ตามที่ตั้งค่าไว้ นอกจากนี้ยังรองรับ URL แบบเต็มอีกด้วยครับ
- **คืนค่า (Returns)**: ออบเจกต์ Namespace ของโมดูลที่โหลดมา

#### ค่าเริ่มต้นคือ https://esm.sh

หากไม่มีการตั้งค่า รูปแบบย่อจะใช้ **https://esm.sh** เป็น CDN Prefix ตัวอย่างเช่น:

```ts
const Vue = await ctx.importAsync('vue@3.4.0');
// เทียบเท่ากับการโหลดจาก https://esm.sh/vue@3.4.0
```

#### การสร้างบริการ esm.sh ด้วยตนเอง

หากต้องการใช้ในเครือข่ายภายในหรือสร้าง CDN เอง คุณสามารถติดตั้งบริการที่รองรับโปรโตคอล esm.sh และระบุผ่านตัวแปรสภาพแวดล้อม (Environment Variables) ได้ดังนี้:

- **ESM_CDN_BASE_URL**: ที่อยู่พื้นฐานของ ESM CDN (ค่าเริ่มต้นคือ `https://esm.sh`)
- **ESM_CDN_SUFFIX**: ส่วนต่อท้ายที่เลือกได้ (เช่น `/+esm` สำหรับ jsDelivr)

สำหรับการสร้างบริการด้วยตนเอง สามารถอ้างอิงได้ที่: [https://github.com/nocobase/esm-server](https://github.com/nocobase/esm-server)

---

### การนำเข้าโมดูล UMD/AMD

ใช้ **`ctx.requireAsync()`** เพื่อโหลดโมดูล UMD/AMD หรือสคริปต์ที่แนบกับ Global Object แบบ Asynchronous ตาม URL ครับ

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

- **url**: รองรับ 2 รูปแบบ:
  - **เส้นทางแบบย่อ**: `<ชื่อแพ็กเกจ>@<เวอร์ชัน>/<เส้นทางไฟล์>` เช่นเดียวกับ `ctx.importAsync()` โดยจะถูกแปลงตามการตั้งค่า ESM CDN ปัจจุบัน และจะมีการเติม `?raw` ต่อท้ายเพื่อขอไฟล์ต้นฉบับโดยตรง (ซึ่งมักจะเป็น UMD build) ตัวอย่างเช่น `echarts@5/dist/echarts.min.js` จะเป็นการขอไฟล์จาก `https://esm.sh/echarts@5/dist/echarts.min.js?raw` (เมื่อใช้ค่าเริ่มต้นของ esm.sh) ครับ
  - **URL แบบเต็ม**: ที่อยู่เต็มของ CDN ใดๆ (เช่น `https://cdn.jsdelivr.net/npm/xxx`)
- **คืนค่า (Returns)**: ออบเจกต์ของไลบรารีที่โหลดมา (รูปแบบขึ้นอยู่กับวิธีการ Export ของไลบรารีนั้นๆ)

หลังจากการโหลด ไลบรารี UMD หลายตัวจะไปปรากฏอยู่ใน Global Object (เช่น `window.xxx`) ซึ่งคุณสามารถใช้งานได้ตามเอกสารของไลบรารีนั้นๆ ครับ

**ตัวอย่าง**

```ts
// เส้นทางแบบย่อ (ถูกแปลงผ่าน esm.sh เป็น ...?raw)
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// URL แบบเต็ม
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
```

**หมายเหตุ**: หากไลบรารีมีเวอร์ชัน ESM ให้เลือกใช้ `ctx.importAsync()` เป็นอันดับแรก เพื่อประสิทธิภาพของ Module Semantics และ Tree-shaking ที่ดีกว่าครับ