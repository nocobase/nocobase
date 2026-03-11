:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/runjs/context/logger)
:::

# ctx.logger

การห่อหุ้ม (wrapper) การบันทึก log ที่อ้างอิงจาก [pino](https://github.com/pinojs/pino) ซึ่งให้ log ในรูปแบบ JSON ที่มีโครงสร้างและประสิทธิภาพสูง แนะนำให้ใช้ `ctx.logger` แทน `console` เพื่อให้ง่ายต่อการรวบรวมและวิเคราะห์ log ครับ

## สถานการณ์ที่ใช้งาน

สามารถใช้ `ctx.logger` ได้ในทุกสถานการณ์ของ RunJS สำหรับการดีบั๊ก (debugging), การติดตามข้อผิดพลาด (error tracking), การวิเคราะห์ประสิทธิภาพ (performance analysis) และอื่น ๆ ครับ

## การกำหนดประเภท (Type Definition)

```ts
logger: pino.Logger;
```

`ctx.logger` คืออินสแตนซ์ของ `engine.logger.child({ module: 'flow-engine' })` ซึ่งเป็น pino child logger ที่มีบริบท (context) ของ `module` ครับ

## ระดับของ Log

pino รองรับระดับต่าง ๆ ดังนี้ (จากสูงไปต่ำ):

| ระดับ | วิธีการ (Method) | คำอธิบาย |
|------|------|------|
| `fatal` | `ctx.logger.fatal()` | ข้อผิดพลาดร้ายแรง มักส่งผลให้โปรเซสหยุดทำงาน |
| `error` | `ctx.logger.error()` | ข้อผิดพลาด แสดงว่าคำขอหรือการดำเนินการล้มเหลว |
| `warn` | `ctx.logger.warn()` | คำเตือน แสดงถึงความเสี่ยงที่อาจเกิดขึ้นหรือสถานการณ์ที่ผิดปกติ |
| `info` | `ctx.logger.info()` | ข้อมูลการทำงานทั่วไป |
| `debug` | `ctx.logger.debug()` | ข้อมูลการดีบั๊ก ใช้สำหรับการพัฒนา |
| `trace` | `ctx.logger.trace()` | การติดตามรายละเอียด ใช้สำหรับการวินิจฉัยเชิงลึก |

## รูปแบบการเขียนที่แนะนำ

แนะนำให้ใช้รูปแบบ `level(msg, meta)` โดยใส่ข้อความ (message) ไว้ข้างหน้า และตามด้วยออบเจกต์ข้อมูลเมตา (metadata object) ที่เป็นตัวเลือกเสริมครับ

```ts
ctx.logger.info('โหลดบล็อกเสร็จสิ้น');
ctx.logger.info('ดำเนินการสำเร็จ', { recordId: 456 });
ctx.logger.warn('คำเตือนด้านประสิทธิภาพ', { duration: 5000 });
ctx.logger.error('ดำเนินการล้มเหลว', { userId: 123, action: 'create' });
ctx.logger.error('คำขอไม่สำเร็จ', { err });
```

นอกจากนี้ pino ยังรองรับ `level(meta, msg)` (ออบเจกต์อยู่หน้า) หรือ `level({ msg, ...meta })` (ออบเจกต์เดียว) ซึ่งสามารถเลือกใช้ได้ตามความเหมาะสมครับ

## ตัวอย่าง

### การใช้งานพื้นฐาน

```ts
ctx.logger.info('โหลดบล็อกเสร็จสิ้น');
ctx.logger.warn('คำขอไม่สำเร็จ กำลังใช้ข้อมูลจากแคช', { err });
ctx.logger.debug('กำลังบันทึก', { recordId: ctx.record?.id });
```

### การสร้าง Child Logger ด้วย child()

```ts
// สร้าง child logger พร้อมบริบทสำหรับตรรกะปัจจุบัน
const log = ctx.logger.child({ scope: 'myBlock' });
log.info('กำลังดำเนินการขั้นตอนที่ 1');
log.debug('กำลังดำเนินการขั้นตอนที่ 2', { step: 2 });
```

### ความสัมพันธ์กับ console

แนะนำให้ใช้ `ctx.logger` โดยตรงเพื่อให้ได้ log แบบ JSON ที่มีโครงสร้าง หากคุณคุ้นเคยกับการใช้ `console` สามารถเทียบเคียงได้ดังนี้: `console.log` → `ctx.logger.info`, `console.error` → `ctx.logger.error`, `console.warn` → `ctx.logger.warn` ครับ

## รูปแบบ Log

pino จะแสดงผลเป็น JSON ที่มีโครงสร้าง โดยแต่ละรายการจะประกอบด้วย:

- `level`: ระดับของ log (ตัวเลข)
- `time`: การประทับเวลา (มิลลิวินาที)
- `msg`: ข้อความ log
- `module`: กำหนดค่าคงที่เป็น `flow-engine`
- ฟิลด์ที่กำหนดเองอื่น ๆ (ส่งผ่านออบเจกต์)

## ข้อควรระวัง

- Log เป็น JSON ที่มีโครงสร้าง ซึ่งสะดวกต่อการรวบรวม ค้นหา และวิเคราะห์
- Child logger ที่สร้างผ่าน `child()` แนะนำให้ใช้รูปแบบ `level(msg, meta)` เช่นกัน
- สภาพแวดล้อมการทำงานบางอย่าง (เช่น เวิร์กโฟลว์) อาจใช้วิธีการแสดงผล log ที่แตกต่างกัน

## สิ่งที่เกี่ยวข้อง

- [pino](https://github.com/pinojs/pino) — ไลบรารีการบันทึก log พื้นฐาน