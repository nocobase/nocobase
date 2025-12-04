:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# บันทึก (Logger)

ระบบบันทึก (logging) ของ NocoBase พัฒนาขึ้นโดยใช้ <a href="https://github.com/winstonjs/winston" target="_blank">Winston</a> เป็นพื้นฐานครับ/ค่ะ โดยค่าเริ่มต้น NocoBase จะแบ่งบันทึกออกเป็นบันทึกคำขอ API, บันทึกการทำงานของระบบ และบันทึกการประมวลผล SQL ซึ่งบันทึกคำขอ API และบันทึกการประมวลผล SQL จะถูกสร้างขึ้นภายในแอปพลิเคชัน โดยทั่วไปแล้ว ผู้พัฒนาปลั๊กอินมักจะต้องการบันทึกเฉพาะข้อมูลที่เกี่ยวข้องกับการทำงานของปลั๊กอินเท่านั้นครับ/ค่ะ

เอกสารนี้จะอธิบายถึงวิธีการสร้างและบันทึกข้อมูล (logs) ในระหว่างการพัฒนาปลั๊กอินครับ/ค่ะ

## วิธีการบันทึกข้อมูลเริ่มต้น

NocoBase มีเมธอดสำหรับบันทึกข้อมูลการทำงานของระบบ โดยข้อมูลจะถูกบันทึกตามฟิลด์ที่กำหนดและส่งออกไปยังไฟล์ที่ระบุครับ/ค่ะ

```ts
// เมธอดสำหรับบันทึกข้อมูลเริ่มต้น
app.log.info("message");

// ใช้ใน Middleware
async function (ctx, next) {
  ctx.log.info("message");
}

// ใช้ในปลั๊กอิน
class CustomPlugin extends Plugin {
  async load() {
    this.log.info("message");
  }
}
```

เมธอดทั้งหมดที่กล่าวมาข้างต้นมีรูปแบบการใช้งานดังนี้ครับ/ค่ะ

พารามิเตอร์แรกคือข้อความบันทึก (log message) และพารามิเตอร์ที่สองคืออ็อบเจกต์ metadata ซึ่งเป็นทางเลือก (optional) ที่สามารถเป็นคู่คีย์-ค่า (key-value pairs) ใดก็ได้ โดย `module`, `submodule`, และ `method` จะถูกแยกออกมาเป็นฟิลด์เดี่ยว ๆ ส่วนฟิลด์ที่เหลือจะถูกจัดเก็บไว้ในฟิลด์ `meta` ครับ/ค่ะ

```ts
app.log.info('message', {
  module: 'module',
  submodule: 'submodule',
  method: 'method',
  key1: 'value1',
  key2: 'value2',
});
// => level=info timestamp=2023-12-27 10:30:23 message=message module=module submodule=submodule method=method meta={"key1": "value1", "key2": "value2"}

app.log.debug();
app.log.warn();
app.log.error();
```

## ส่งออกไปยังไฟล์อื่น

หากคุณต้องการใช้เมธอดการบันทึกข้อมูลเริ่มต้นของระบบ แต่ไม่ต้องการให้ส่งออกไปยังไฟล์เริ่มต้น คุณสามารถสร้างอินสแตนซ์ logger ของระบบที่กำหนดเองได้โดยใช้ `createSystemLogger` ครับ/ค่ะ

```ts
import { createSystemLogger } from '@nocobase/logger';

const logger = createSystemLogger({
  dirname: '/pathto/',
  filename: 'xxx',
  seperateError: true, // กำหนดว่าจะให้บันทึกระดับ error แยกไปยังไฟล์ 'xxx_error.log' หรือไม่
});
```

## Logger แบบกำหนดเอง

หากคุณไม่ต้องการใช้เมธอดการบันทึกข้อมูลที่ระบบมีให้ และต้องการใช้เมธอดดั้งเดิมของ Winston คุณสามารถสร้างบันทึกได้ด้วยวิธีต่อไปนี้ครับ/ค่ะ

### `createLogger`

```ts
import { createLogger } from '@nocobase/logger';

const logger = createLogger({
  // options
});
```

`options` ได้รับการขยายความสามารถเพิ่มเติมจาก `winston.LoggerOptions` ดั้งเดิมครับ/ค่ะ

- `transports` - สามารถใช้รูปแบบการส่งออกที่กำหนดไว้ล่วงหน้า เช่น `'console' | 'file' | 'dailyRotateFile'` ได้ครับ/ค่ะ
- `format` - สามารถใช้รูปแบบการบันทึกที่กำหนดไว้ล่วงหน้า เช่น `'logfmt' | 'json' | 'delimiter'` ได้ครับ/ค่ะ

### `app.createLogger`

ในสถานการณ์ที่มีหลายแอปพลิเคชัน บางครั้งเราอาจต้องการกำหนดไดเรกทอรีและไฟล์เอาต์พุตเอง ซึ่งสามารถส่งออกไปยังไดเรกทอรีที่มีชื่อตามแอปพลิเคชันปัจจุบันได้ครับ/ค่ะ

```ts
app.createLogger({
  dirname: '',
  filename: 'custom', // ส่งออกไปยัง /storage/logs/main/custom.log
});
```

### `plugin.createLogger`

กรณีการใช้งานและวิธีการใช้เหมือนกับ `app.createLogger` ครับ/ค่ะ

```ts
class CustomPlugin extends Plugin {
  async load() {
    const logger = this.createLogger({
      // ส่งออกไปยัง /storage/logs/main/custom-plugin/YYYY-MM-DD.log
      dirname: 'custom-plugin',
      filename: '%DATE%.log',
      transports: ['dailyRotateFile'],
    });
  }
}
```