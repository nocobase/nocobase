---
pkg: "@nocobase/plugin-logger"
---
:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::



# บันทึก (Logs)

## บทนำ

บันทึก (Logs) เป็นเครื่องมือสำคัญที่ช่วยให้เราสามารถระบุปัญหาของระบบได้ครับ/ค่ะ บันทึกของเซิร์ฟเวอร์ NocoBase จะประกอบด้วยบันทึกการร้องขอ (request logs) ของ API และบันทึกการทำงานของระบบ (system operation logs) ซึ่งสามารถตั้งค่าระดับของบันทึก (log level), กลยุทธ์การหมุนเวียน (rolling strategy), ขนาด, และรูปแบบการแสดงผลได้ เอกสารฉบับนี้จะแนะนำรายละเอียดเกี่ยวกับบันทึกของเซิร์ฟเวอร์ NocoBase รวมถึงวิธีการใช้งานฟังก์ชันการบีบอัดและดาวน์โหลดบันทึกของเซิร์ฟเวอร์ที่ปลั๊กอินบันทึกมีให้ครับ/ค่ะ

## การตั้งค่าบันทึก

สามารถตั้งค่าพารามิเตอร์ที่เกี่ยวข้องกับบันทึก เช่น ระดับของบันทึก, วิธีการส่งออก, และรูปแบบการแสดงผล ได้ผ่าน [ตัวแปรสภาพแวดล้อม](/get-started/installation/env.md#logger_transport) ครับ/ค่ะ

## รูปแบบบันทึก

NocoBase รองรับการตั้งค่ารูปแบบบันทึกที่แตกต่างกัน 4 แบบครับ/ค่ะ

### `console`

เป็นรูปแบบเริ่มต้นในสภาพแวดล้อมการพัฒนา โดยข้อความจะแสดงผลด้วยสีที่เน้นให้เห็นชัดเจนครับ/ค่ะ

```
2023-12-30 22:40:06 [info]  response                                     method=GET path=/api/uiSchemas:getJsonSchema/nocobase-admin-menu res={"status":200} action={"actionName":"getJsonSchema","resourceName":"uiSchemas","params":{"filterByTk":"nocobase-admin-menu","resourceName":"uiSchemas","resourceIndex":"nocobase-admin-menu","actionName":"getJsonSchema"}} userId=1 status=200 cost=5 app=main reqId=ccf4e3bd-beb0-4350-af6e-b1fc1d9b6c3f
2023-12-30 22:43:12 [debug] Database dialect: mysql                      module=application method=install app=main reqId=31ffa8b5-f377-456b-a295-0c8a28938228
2023-12-30 22:43:12 [warn]  app is installed                             module=application method=install app=main reqId=31ffa8b5-f377-456b-a295-0c8a28938228
```

### `json`

เป็นรูปแบบเริ่มต้นในสภาพแวดล้อมการใช้งานจริง (production) ครับ/ค่ะ

```json
{
  "level": "info",
  "timestamp": "2023-12-26 22:04:56",
  "reqId": "7612ef42-58e8-4c35-bac2-2e6c9d8ec96e",
  "message": "response",
  "method": "POST",
  "path": "/api/authenticators:publicList",
  "res": { "status": 200 },
  "action": {
    "actionName": "publicList",
    "resourceName": "authenticators",
    "params": { "resourceName": "authenticators", "actionName": "publicList" }
  },
  "status": 200,
  "cost": 16
}
```

### `logfmt`

> https://brandur.org/logfmt.

```
level=info timestamp=2023-12-21 14:18:02 reqId=8b59a40d-68ee-4c97-8001-71a47a92805a
message=response method=POST path=/api/authenticators:publicList res={"status":200}
action={"actionName":"publicList","resourceName":"authenticators","params":{"resourceName":"authenticators","actionName":"publicList"}}
userId=undefined status=200 cost=14
```

### `delimiter`

คั่นด้วยตัวคั่น (delimiter) `|` ครับ/ค่ะ

```
info|2023-12-26 22:07:09|13cd16f0-1568-418d-ac37-6771ee650e14|response|POST|/api/authenticators:publicList|{"status":200}|{"actionName":"publicList","resourceName":"authenticators","params":{"resourceName":"authenticators","actionName":"publicList"}}||200|25
```

## ไดเรกทอรีบันทึก

โครงสร้างไดเรกทอรีหลักของไฟล์บันทึก NocoBase มีดังนี้ครับ/ค่ะ

- `storage/logs` - ไดเรกทอรีสำหรับส่งออกบันทึก
  - `main` - ชื่อแอปพลิเคชันหลัก
    - `request_YYYY-MM-DD.log` - บันทึกการร้องขอ
    - `system_YYYY-MM-DD.log` - บันทึกระบบ
    - `system_error_YYYY-MM-DD.log` - บันทึกข้อผิดพลาดของระบบ
    - `sql_YYYY-MM-DD.log` - บันทึกการทำงานของ SQL
    - ...
  - `sub-app` - ชื่อแอปพลิเคชันย่อย
    - `request_YYYY-MM-DD.log`
    - ...

## ไฟล์บันทึก

### บันทึกการร้องขอ

`request_YYYY-MM-DD.log` เป็นบันทึกการร้องขอและตอบกลับของ API ครับ/ค่ะ

| ฟิลด์         | คำอธิบาย                               |
| ------------- | -------------------------------------- |
| `level`       | ระดับของบันทึก                         |
| `timestamp`   | เวลาที่บันทึกถูกสร้าง `YYYY-MM-DD hh:mm:ss` |
| `message`     | `request` หรือ `response`              |
| `userId`      | มีเฉพาะใน `response`                   |
| `method`      | เมธอดการร้องขอ                         |
| `path`        | พาธการร้องขอ                           |
| `req` / `res` | เนื้อหาการร้องขอ/ตอบกลับ               |
| `action`      | ทรัพยากรและพารามิเตอร์ที่ร้องขอ        |
| `status`      | รหัสสถานะการตอบกลับ                    |
| `cost`        | ระยะเวลาที่ใช้ในการร้องขอ              |
| `app`         | ชื่อแอปพลิเคชันปัจจุบัน                |
| `reqId`       | ID การร้องขอ                           |

:::info{title=ข้อแนะนำ}
`reqId` จะถูกส่งไปยังฝั่ง Front-end ผ่านเฮดเดอร์การตอบกลับ `X-Request-Id` ครับ/ค่ะ
:::

### บันทึกระบบ

`system_YYYY-MM-DD.log` เป็นบันทึกการทำงานของระบบ เช่น แอปพลิเคชัน, มิดเดิลแวร์, ปลั๊กอิน เป็นต้น โดยบันทึกระดับ `error` จะถูกพิมพ์แยกไปยัง `system_error_YYYY-MM-DD.log` ครับ/ค่ะ

| ฟิลด์         | คำอธิบาย                               |
| ----------- | -------------------------------------- |
| `level`     | ระดับของบันทึก                         |
| `timestamp` | เวลาที่บันทึกถูกสร้าง `YYYY-MM-DD hh:mm:ss` |
| `message`   | ข้อความบันทึก                          |
| `module`    | โมดูล                                  |
| `submodule` | ซับโมดูล                               |
| `method`    | เมธอดที่ถูกเรียก                       |
| `meta`      | ข้อมูลอื่นๆ ที่เกี่ยวข้อง, รูปแบบ JSON |
| `app`       | ชื่อแอปพลิเคชันปัจจุบัน                |
| `reqId`     | ID การร้องขอ                           |

### บันทึกการทำงานของ SQL

`sql_YYYY-MM-DD.log` เป็นบันทึกการทำงานของ SQL ในฐานข้อมูลครับ/ค่ะ โดยคำสั่ง `INSERT INTO` จะเก็บไว้เพียง 2000 ตัวอักษรแรกเท่านั้น

| ฟิลด์         | คำอธิบาย                               |
| ----------- | -------------------------------------- |
| `level`     | ระดับของบันทึก                         |
| `timestamp` | เวลาที่บันทึกถูกสร้าง `YYYY-MM-DD hh:mm:ss` |
| `sql`       | คำสั่ง SQL                             |
| `app`       | ชื่อแอปพลิเคชันปัจจุบัน                |
| `reqId`     | ID การร้องขอ                           |

## การบีบอัดและดาวน์โหลดบันทึก

1. ไปที่หน้าการจัดการบันทึกครับ/ค่ะ
2. เลือกไฟล์บันทึกที่ต้องการดาวน์โหลดครับ/ค่ะ
3. คลิกปุ่มดาวน์โหลด (Download) ครับ/ค่ะ

![2024-04-10_10-50-50](https://static-docs.nocobase.com/2024-04-10_10-50-50.png)

## เอกสารที่เกี่ยวข้อง

- [การพัฒนาปลั๊กอิน - เซิร์ฟเวอร์ - บันทึก](/plugin-development/server/logger)
- [การอ้างอิง API - @nocobase/logger](/api/logger/logger)