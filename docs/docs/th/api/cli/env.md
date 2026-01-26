:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# ตัวแปรสภาพแวดล้อมส่วนกลาง

## TZ

ใช้สำหรับตั้งค่าโซนเวลาของแอปพลิเคชัน โดยค่าเริ่มต้นจะใช้โซนเวลาของระบบปฏิบัติการครับ/ค่ะ

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
การดำเนินการที่เกี่ยวข้องกับเวลาทั้งหมดจะถูกประมวลผลตามโซนเวลานี้ครับ/ค่ะ การแก้ไขค่า TZ อาจส่งผลกระทบต่อค่าวันที่ในฐานข้อมูลได้ สำหรับรายละเอียดเพิ่มเติม โปรดดูที่ '[ภาพรวมวันที่และเวลา](#)'
:::

## APP_ENV

สภาพแวดล้อมของแอปพลิเคชัน ค่าเริ่มต้นคือ `development` โดยมีตัวเลือกดังนี้ครับ/ค่ะ:

- `production` - สภาพแวดล้อมการทำงานจริง (Production environment)
- `development` - สภาพแวดล้อมสำหรับการพัฒนา (Development environment)

```bash
APP_ENV=production
```

## APP_KEY

คีย์ลับของแอปพลิเคชัน ใช้สำหรับสร้างโทเค็นของผู้ใช้และอื่นๆ ครับ/ค่ะ โปรดเปลี่ยนเป็นคีย์ลับของแอปพลิเคชันของคุณเอง และตรวจสอบให้แน่ใจว่าจะไม่เปิดเผยออกสู่ภายนอก

:::warning
หากมีการเปลี่ยนแปลง `APP_KEY` โทเค็นเก่าทั้งหมดจะใช้งานไม่ได้ทันทีครับ/ค่ะ
:::

```bash
APP_KEY=app-key-test
```

## APP_PORT

พอร์ตของแอปพลิเคชัน ค่าเริ่มต้นคือ `13000` ครับ/ค่ะ

```bash
APP_PORT=13000
```

## API_BASE_PATH

คำนำหน้า URL ของ NocoBase API ค่าเริ่มต้นคือ `/api/` ครับ/ค่ะ

```bash
API_BASE_PATH=/api/
```

## API_BASE_URL

## CLUSTER_MODE

> `v1.6.0+`

โหมดการเริ่มต้นแบบหลายคอร์ (คลัสเตอร์) ครับ/ค่ะ หากมีการกำหนดตัวแปรนี้ ระบบจะส่งผ่านไปยังคำสั่ง `pm2 start` เป็นพารามิเตอร์ `-i <instances>` โดยตัวเลือกต่างๆ จะสอดคล้องกับพารามิเตอร์ `-i` ของ pm2 (ดู [PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)) ซึ่งรวมถึง:

- `max`: ใช้จำนวนคอร์ CPU สูงสุด
- `-1`: ใช้จำนวนคอร์ CPU สูงสุด ลบด้วย 1
- `<number>`: ระบุจำนวนคอร์ที่ต้องการ

ค่าเริ่มต้นว่างเปล่า ซึ่งหมายถึงไม่ได้เปิดใช้งานโหมดนี้ครับ/ค่ะ

:::warning{title="ข้อควรระวัง"}
โหมดนี้จำเป็นต้องใช้งานร่วมกับปลั๊กอินที่เกี่ยวข้องกับโหมดคลัสเตอร์ครับ/ค่ะ มิฉะนั้นฟังก์ชันการทำงานของแอปพลิเคชันอาจเกิดความผิดปกติได้
:::

ดูข้อมูลเพิ่มเติมได้ที่: [โหมดคลัสเตอร์](#)

## PLUGIN_PACKAGE_PREFIX

คำนำหน้าชื่อแพ็กเกจของปลั๊กอินครับ/ค่ะ ค่าเริ่มต้นคือ `@nocobase/plugin-,@nocobase/preset-`

ตัวอย่างเช่น หากต้องการเพิ่มปลั๊กอิน `hello` ไปยังโปรเจกต์ `my-nocobase-app` ชื่อแพ็กเกจเต็มของปลั๊กอินจะเป็น `@my-nocobase-app/plugin-hello`

คุณสามารถกำหนดค่า `PLUGIN_PACKAGE_PREFIX` ได้ดังนี้:

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

ดังนั้น ความสัมพันธ์ระหว่างชื่อปลั๊กอินและชื่อแพ็กเกจจะเป็นดังนี้ครับ/ค่ะ:

- ปลั๊กอิน `users` จะมีชื่อแพ็กเกจเป็น `@nocobase/plugin-users`
- ปลั๊กอิน `nocobase` จะมีชื่อแพ็กเกจเป็น `@nocobase/preset-nocobase`
- ปลั๊กอิน `hello` จะมีชื่อแพ็กเกจเป็น `@my-nocobase-app/plugin-hello`

## DB_DIALECT

ประเภทของฐานข้อมูล โดยมีตัวเลือกดังนี้ครับ/ค่ะ:

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

## DB_HOST

โฮสต์ของฐานข้อมูล (จำเป็นต้องกำหนดค่าเมื่อใช้ฐานข้อมูล MySQL หรือ PostgreSQL)

ค่าเริ่มต้นคือ `localhost` ครับ/ค่ะ

```bash
DB_HOST=localhost
```

## DB_PORT

พอร์ตของฐานข้อมูล (จำเป็นต้องกำหนดค่าเมื่อใช้ฐานข้อมูล MySQL หรือ PostgreSQL)

- พอร์ตเริ่มต้นสำหรับ MySQL และ MariaDB คือ 3306
- พอร์ตเริ่มต้นสำหรับ PostgreSQL คือ 5432

```bash
DB_PORT=3306
```

## DB_DATABASE

ชื่อฐานข้อมูล (จำเป็นต้องกำหนดค่าเมื่อใช้ฐานข้อมูล MySQL หรือ PostgreSQL)

```bash
DB_DATABASE=nocobase
```

## DB_USER

ผู้ใช้ฐานข้อมูล (จำเป็นต้องกำหนดค่าเมื่อใช้ฐานข้อมูล MySQL หรือ PostgreSQL)

```bash
DB_USER=nocobase
```

## DB_PASSWORD

รหัสผ่านฐานข้อมูล (จำเป็นต้องกำหนดค่าเมื่อใช้ฐานข้อมูล MySQL หรือ PostgreSQL)

```bash
DB_PASSWORD=nocobase
```

## DB_TABLE_PREFIX

คำนำหน้าชื่อตาราง

```bash
DB_TABLE_PREFIX=nocobase_
```

## DB_UNDERSCORED

กำหนดว่าจะให้ชื่อตารางและชื่อฟิลด์ในฐานข้อมูลถูกแปลงเป็นรูปแบบ snake case หรือไม่ ค่าเริ่มต้นคือ `false` ครับ/ค่ะ หากคุณใช้ฐานข้อมูล MySQL (MariaDB) และตั้งค่า `lower_case_table_names=1` คุณจะต้องตั้งค่า `DB_UNDERSCORED` เป็น `true`

:::warning
เมื่อตั้งค่า `DB_UNDERSCORED=true` ชื่อตารางและชื่อฟิลด์จริงในฐานข้อมูลจะไม่ตรงกับที่เห็นในอินเทอร์เฟซครับ/ค่ะ ตัวอย่างเช่น `orderDetails` ในฐานข้อมูลจะกลายเป็น `order_details`
:::

## DB_LOGGING

สวิตช์สำหรับเปิด/ปิดการบันทึก Log ของฐานข้อมูล ค่าเริ่มต้นคือ `off` โดยมีตัวเลือกดังนี้ครับ/ค่ะ:

- `on` - เปิดใช้งาน
- `off` - ปิดใช้งาน

```bash
DB_LOGGING=on
```

## LOGGER_TRANSPORT

วิธีการส่งออก Log ครับ/ค่ะ หากมีหลายค่าให้คั่นด้วยเครื่องหมาย `,` ค่าเริ่มต้นในสภาพแวดล้อมการพัฒนาคือ `console` และในสภาพแวดล้อมการทำงานจริงคือ `console,dailyRotateFile` ตัวเลือกต่างๆ มีดังนี้:

- `console` - ส่งออกไปยัง `console.log`
- `file` - ส่งออกไปยังไฟล์
- `dailyRotateFile` - ส่งออกไปยังไฟล์ที่หมุนเวียนรายวัน

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

## LOGGER_BASE_PATH

เส้นทางจัดเก็บ Log แบบไฟล์ ค่าเริ่มต้นคือ `storage/logs` ครับ/ค่ะ

```bash
LOGGER_BASE_PATH=storage/logs
```

## LOGGER_LEVEL

ระดับการส่งออก Log ครับ/ค่ะ ค่าเริ่มต้นในสภาพแวดล้อมการพัฒนาคือ `debug` และในสภาพแวดล้อมการทำงานจริงคือ `info` ตัวเลือกต่างๆ มีดังนี้:

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

ระดับการส่งออก Log ของฐานข้อมูลคือ `debug` ซึ่งถูกควบคุมโดย `DB_LOGGING` ว่าจะส่งออกหรือไม่ โดยไม่ได้รับผลกระทบจาก `LOGGER_LEVEL` ครับ/ค่ะ

## LOGGER_MAX_FILES

จำนวนไฟล์ Log สูงสุดที่จะเก็บไว้ครับ/ค่ะ

- เมื่อ `LOGGER_TRANSPORT` เป็น `file` ค่าเริ่มต้นคือ `10`
- เมื่อ `LOGGER_TRANSPORT` เป็น `dailyRotateFile` ให้ใช้ `[n]d` เพื่อระบุจำนวนวัน ค่าเริ่มต้นคือ `14d`

```bash
LOGGER_MAX_FILES=14d
```

## LOGGER_MAX_SIZE

การหมุนเวียน Log ตามขนาดครับ/ค่ะ

- เมื่อ `LOGGER_TRANSPORT` เป็น `file` หน่วยจะเป็น `byte` และค่าเริ่มต้นคือ `20971520 (20 * 1024 * 1024)`
- เมื่อ `LOGGER_TRANSPORT` เป็น `dailyRotateFile` คุณสามารถใช้ `[n]k`, `[n]m`, `[n]g` ได้ครับ/ค่ะ โดยค่าเริ่มต้นจะไม่มีการกำหนดค่านี้

```bash
LOGGER_MAX_SIZE=20971520
```

## LOGGER_FORMAT

รูปแบบการแสดงผล Log ครับ/ค่ะ ค่าเริ่มต้นในสภาพแวดล้อมการพัฒนาคือ `console` และในสภาพแวดล้อมการทำงานจริงคือ `json` ตัวเลือกต่างๆ มีดังนี้:

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

ดูเพิ่มเติมที่: [รูปแบบ Log](#)

## CACHE_DEFAULT_STORE

ตัวระบุเฉพาะสำหรับวิธีการจัดเก็บแคชครับ/ค่ะ ซึ่งจะระบุวิธีการจัดเก็บแคชเริ่มต้นฝั่งเซิร์ฟเวอร์ ค่าเริ่มต้นคือ `memory` โดยมีตัวเลือกในตัวดังนี้:

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

## CACHE_MEMORY_MAX

จำนวนสูงสุดของรายการในแคชหน่วยความจำ ค่าเริ่มต้นคือ `2000` ครับ/ค่ะ

```bash
CACHE_MEMORY_MAX=2000
```

## CACHE_REDIS_URL

การเชื่อมต่อ Redis ซึ่งเป็นตัวเลือกเสริมครับ/ค่ะ ตัวอย่าง: `redis://localhost:6379`

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

## TELEMETRY_ENABLED

เปิดใช้งานการรวบรวมข้อมูล Telemetry ค่าเริ่มต้นคือ `off` ครับ/ค่ะ

```bash
TELEMETRY_ENABLED=on
```

## TELEMETRY_METRIC_READER

ตัวอ่านเมตริกการตรวจสอบที่เปิดใช้งานครับ/ค่ะ ค่าเริ่มต้นคือ `console` สำหรับค่าอื่นๆ โปรดอ้างอิงชื่อที่ลงทะเบียนของปลั๊กอินตัวอ่านที่เกี่ยวข้อง เช่น `prometheus` หากมีหลายค่าให้คั่นด้วยเครื่องหมาย `,`

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

## TELEMETRY_TRACE_PROCESSOR

ตัวประมวลผลข้อมูล Trace ที่เปิดใช้งานครับ/ค่ะ ค่าเริ่มต้นคือ `console` สำหรับค่าอื่นๆ โปรดอ้างอิงชื่อที่ลงทะเบียนของปลั๊กอินตัวประมวลผลที่เกี่ยวข้อง หากมีหลายค่าให้คั่นด้วยเครื่องหมาย `,`

```bash
TELEMETRY_TRACE_PROCESSOR=console
```