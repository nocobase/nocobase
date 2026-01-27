:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# Logger

## การสร้าง Logger

### `createLogger()`

ใช้สำหรับสร้าง Logger ที่กำหนดเองครับ/ค่ะ

#### รูปแบบการใช้งาน (Signature)

- `createLogger(options: LoggerOptions)`

#### ชนิดข้อมูล (Type)

```ts
interface LoggerOptions
  extends Omit<winston.LoggerOptions, 'transports' | 'format'> {
  dirname?: string;
  filename?: string;
  format?: 'logfmt' | 'json' | 'delimiter' | 'console' | winston.Logform.Format;
  transports?: ('console' | 'file' | 'dailyRotateFile' | winston.transport)[];
}
```

#### รายละเอียด

| คุณสมบัติ    | คำอธิบาย                  |
| :----------- | :----------------------- |
| `dirname`    | ไดเรกทอรีสำหรับบันทึก Log |
| `filename`   | ชื่อไฟล์ Log              |
| `format`     | รูปแบบของ Log             |
| `transports` | วิธีการส่งออก Log         |

### `createSystemLogger()`

ใช้สำหรับสร้าง Log การทำงานของระบบที่พิมพ์ตามวิธีการที่กำหนดไว้ครับ/ค่ะ โปรดดูที่ [Logger - System Log](/log-and-monitor/logger/index.md#system-log)

#### รูปแบบการใช้งาน (Signature)

- `createSystemLogger(options: SystemLoggerOptions)`

#### ชนิดข้อมูล (Type)

```ts
export interface SystemLoggerOptions extends LoggerOptions {
  seperateError?: boolean; // print error seperately, default true
}
```

#### รายละเอียด

| คุณสมบัติ        | คำอธิบาย                                     |
| :-------------- | :------------------------------------------- |
| `seperateError` | กำหนดว่าจะแยก Log ระดับ `error` ออกมาต่างหากหรือไม่ |

### `requestLogger()`

เป็น Middleware สำหรับบันทึก Log การร้องขอ (request) และการตอบกลับ (response) ของ API ครับ/ค่ะ

```ts
app.use(requestLogger(app.name));
```

#### รูปแบบการใช้งาน (Signature)

- `requestLogger(appName: string, options?: RequestLoggerOptions): MiddewareType`

#### ชนิดข้อมูล (Type)

```ts
export interface RequestLoggerOptions extends LoggerOptions {
  skip?: (ctx?: any) => Promise<boolean>;
  requestWhitelist?: string[];
  responseWhitelist?: string[];
}
```

#### รายละเอียด

| คุณสมบัติ            | ชนิดข้อมูล                        | คำอธิบาย                                                                 | ค่าเริ่มต้น                                                                                                                                                 |
| :------------------ | :-------------------------------- | :----------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `skip`              | `(ctx?: any) => Promise<boolean>` | ใช้สำหรับข้ามการบันทึก Log สำหรับบาง request โดยอิงจากบริบทของ request นั้นๆ ครับ/ค่ะ | -                                                                                                                                                       |
| `requestWhitelist`  | `string[]`                        | รายการ Whitelist ของข้อมูล request ที่จะพิมพ์ลงใน Log ครับ/ค่ะ             | `[ 'action', 'header.x-role', 'header.x-hostname', 'header.x-timezone', 'header.x-locale','header.x-authenticator', 'header.x-data-source', 'referer']` |
| `responseWhitelist` | `string[]`                        | รายการ Whitelist ของข้อมูล response ที่จะพิมพ์ลงใน Log ครับ/ค่ะ            | `['status']`                                                                                                                                            |

### app.createLogger()

#### คำนิยาม (Definition)

```ts
class Application {
  createLogger(options: LoggerOptions) {
    const { dirname } = options;
    return createLogger({
      ...options,
      dirname: getLoggerFilePath(this.name || 'main', dirname || ''),
    });
  }
}
```

เมื่อ `dirname` เป็นพาธแบบ Relative (Relative path) ไฟล์ Log จะถูกส่งออกไปยังไดเรกทอรีที่มีชื่อตามชื่อแอปพลิเคชันปัจจุบันครับ/ค่ะ

### plugin.createLogger()

วิธีการใช้งานเหมือนกับ `app.createLogger()` ครับ/ค่ะ

#### คำนิยาม (Definition)

```ts
class Plugin {
  createLogger(options: LoggerOptions) {
    return this.app.createLogger(options);
  }
}
```

## การตั้งค่า Log

### getLoggerLevel()

`getLoggerLevel(): 'debug' | 'info' | 'warn' | 'error'`

ใช้สำหรับดึงระดับ Log ที่ตั้งค่าไว้ในระบบปัจจุบันครับ/ค่ะ

### getLoggerFilePath()

`getLoggerFilePath(...paths: string[]): string`

ใช้สำหรับเชื่อมต่อพาธไดเรกทอรี โดยอิงจากไดเรกทอรี Log ที่ตั้งค่าไว้ในระบบปัจจุบันครับ/ค่ะ

### getLoggerTransports()

`getLoggerTransports(): ('console' | 'file' | 'dailyRotateFile')[]`

ใช้สำหรับดึงวิธีการส่งออก Log ที่ตั้งค่าไว้ในระบบปัจจุบันครับ/ค่ะ

### getLoggerFormat()

`getLoggerFormat(): 'logfmt' | 'json' | 'delimiter' | 'console'`

ใช้สำหรับดึงรูปแบบ Log ที่ตั้งค่าไว้ในระบบปัจจุบันครับ/ค่ะ

## การส่งออก Log

### Transports

วิธีการส่งออก Log ที่กำหนดไว้ล่วงหน้าครับ/ค่ะ

- `Transports.console`
- `Transports.file`
- `Transports.dailyRotateFile`

```ts
import { Transports } from '@nocobase/logger';

const transport = Transports.console({
  //...
});
```

## เอกสารที่เกี่ยวข้อง

- [คู่มือการพัฒนา - Logger](/plugin-development/server/logger)
- [Logger](/log-and-monitor/logger/index.md)