:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/runjs/context/require-async)
:::

# ctx.requireAsync()

โหลดสคริปต์แบบ **UMD/AMD** หรือสคริปต์ที่ติดตั้งไว้ในระดับ Global รวมถึง **CSS** ตาม URL แบบอะซิงโครนัส (Asynchronously) เหมาะสำหรับสถานการณ์การใช้ RunJS ที่ต้องการไลบรารี UMD/AMD เช่น ECharts, Chart.js, FullCalendar (เวอร์ชัน UMD) หรือปลั๊กอิน jQuery หากไลบรารีมีเวอร์ชัน ESM ให้เลือกใช้ [ctx.importAsync()](./import-async.md) เป็นอันดับแรกครับ

## สถานการณ์ที่ใช้งาน

สามารถใช้ได้ในทุกสถานการณ์ของ RunJS ที่ต้องการโหลดสคริปต์ UMD/AMD/global หรือ CSS ตามความต้องการ เช่น JSBlock, JSField, JSItem, JSColumn, เวิร์กโฟลว์, JSAction เป็นต้น ตัวอย่างการใช้งานทั่วไป: กราฟ ECharts, Chart.js, FullCalendar (UMD), dayjs (UMD), ปลั๊กอิน jQuery เป็นต้น

## การกำหนดประเภท (Type Definition)

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

## พารามิเตอร์

| พารามิเตอร์ | ประเภท | คำอธิบาย |
|-----------|------|-------------|
| `url` | `string` | ที่อยู่ของสคริปต์หรือ CSS รองรับการเขียนแบบ**ย่อ** `<ชื่อแพ็กเกจ>@<เวอร์ชัน>/<เส้นทางไฟล์>` (จะมีการเติม `?raw` เพื่อดึงไฟล์ UMD ต้นฉบับเมื่อประมวลผลผ่าน ESM CDN) หรือ **URL แบบเต็ม** หากส่งค่าเป็น `.css` จะทำการโหลดและแทรกสไตล์ลงในหน้าเว็บ |

## ค่าที่ส่งกลับ

- ออบเจ็กต์ของไลบรารีที่โหลดมา (ค่าโมดูลแรกจากการเรียกกลับของ UMD/AMD) ไลบรารี UMD หลายตัวจะแนบตัวเองเข้ากับ `window` (เช่น `window.echarts`) ดังนั้นค่าที่ส่งกลับอาจเป็น `undefined` ในกรณีนี้ให้เข้าถึงตัวแปร Global ตามเอกสารของไลบรารีนั้นๆ
- ส่งกลับผลลัพธ์ของ `loadCSS` เมื่อมีการส่งค่าเป็นไฟล์ `.css`

## คำอธิบายรูปแบบ URL

- **เส้นทางแบบย่อ (Shorthand path)**: เช่น `echarts@5/dist/echarts.min.js` ภายใต้ ESM CDN เริ่มต้น (esm.sh) จะมีการเรียกไปยัง `https://esm.sh/echarts@5/dist/echarts.min.js?raw` โดยพารามิเตอร์ `?raw` ใช้เพื่อดึงไฟล์ UMD ดั้งเดิมแทนที่จะเป็น ESM wrapper
- **URL แบบเต็ม (Full URL)**: สามารถใช้ที่อยู่ CDN ใดก็ได้โดยตรง เช่น `https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js`
- **CSS**: URL ที่ลงท้ายด้วย `.css` จะถูกโหลดและแทรกเข้าไปในหน้าเว็บ

## ความแตกต่างจาก ctx.importAsync()

- **ctx.requireAsync()**: โหลดสคริปต์แบบ **UMD/AMD/global** เหมาะสำหรับ ECharts, Chart.js, FullCalendar (UMD), ปลั๊กอิน jQuery เป็นต้น ไลบรารีมักจะแนบเข้ากับ `window` หลังจากโหลดเสร็จ ค่าที่ส่งกลับอาจเป็นออบเจ็กต์ของไลบรารีหรือ `undefined`
- **ctx.importAsync()**: โหลด **ESM modules** และส่งกลับโมดูลเนมสเปซ หากไลบรารีมี ESM ให้ใช้ `ctx.importAsync()` เพื่อประสิทธิภาพของโมดูลและ Tree-shaking ที่ดีกว่าครับ

## ตัวอย่าง

### การใช้งานพื้นฐาน

```javascript
// เส้นทางแบบย่อ (ประมวลผลผ่าน ESM CDN เป็น ...?raw)
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// URL แบบเต็ม
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');

// โหลด CSS และแทรกเข้าไปในหน้าเว็บ
await ctx.requireAsync('https://cdn.example.com/theme.css');
```

### กราฟ ECharts

```javascript
const container = document.createElement('div');
container.style.height = '400px';
container.style.width = '100%';
ctx.render(container);

const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');
if (!echarts) throw new Error('ECharts library not loaded');

const chart = echarts.init(container);
chart.setOption({
  title: { text: ctx.t('ภาพรวมการขาย') },
  series: [{ type: 'pie', data: [{ value: 1, name: ctx.t('A') }] }],
});
chart.resize();
```

### กราฟแท่ง Chart.js

```javascript
async function renderChart() {
  const loaded = await ctx.requireAsync('chart.js@4.4.0/dist/chart.umd.min.js');
  const Chart = loaded?.Chart || loaded?.default?.Chart || loaded?.default;
  if (!Chart) throw new Error('Chart.js not loaded');

  const container = document.createElement('canvas');
  ctx.render(container);

  new Chart(container, {
    type: 'bar',
    data: {
      labels: ['A', 'B', 'C'],
      datasets: [{ label: ctx.t('จำนวน'), data: [12, 19, 3] }],
    },
  });
}
await renderChart();
```

### dayjs (UMD)

```javascript
const dayjs = await ctx.requireAsync('dayjs@1/dayjs.min.js');
console.log(dayjs?.default || dayjs);
```

## ข้อควรระวัง

- **รูปแบบของค่าที่ส่งกลับ**: วิธีการ Export ของ UMD แตกต่างกันไป ค่าที่ส่งกลับอาจเป็นออบเจ็กต์ของไลบรารีหรือ `undefined` หากเป็น `undefined` ให้เข้าถึงผ่าน `window` ตามเอกสารของไลบรารีครับ
- **การพึ่งพาเครือข่าย**: จำเป็นต้องเข้าถึง CDN ในสภาพแวดล้อมเครือข่ายภายใน (Internal network) สามารถกำหนดค่า **ESM_CDN_BASE_URL** ให้ชี้ไปยังบริการที่สร้างขึ้นเองได้
- **การเลือกระหว่าง importAsync**: หากไลบรารีมีทั้ง ESM และ UMD ให้เลือกใช้ `ctx.importAsync()` ก่อนครับ

## สิ่งที่เกี่ยวข้อง

- [ctx.importAsync()](./import-async.md) - โหลดโมดูล ESM เหมาะสำหรับ Vue, dayjs (ESM) เป็นต้น
- [ctx.render()](./render.md) - เรนเดอร์กราฟและส่วนประกอบอื่นๆ ลงในคอนเทนเนอร์
- [ctx.libs](./libs.md) - ไลบรารีในตัว เช่น React, antd, dayjs ฯลฯ โดยไม่ต้องโหลดแบบอะซิงโครนัส