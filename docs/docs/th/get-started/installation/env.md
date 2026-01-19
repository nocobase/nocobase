:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# ตัวแปรสภาพแวดล้อม

## วิธีการตั้งค่าตัวแปรสภาพแวดล้อม

### การติดตั้งด้วยซอร์สโค้ด Git หรือ `create-nocobase-app`

ตั้งค่าตัวแปรสภาพแวดล้อมในไฟล์ `.env` ที่อยู่ในไดเรกทอรีรากของโปรเจกต์ครับ/ค่ะ หลังจากแก้ไขตัวแปรสภาพแวดล้อมแล้ว คุณจะต้องหยุดการทำงานของแอปพลิเคชัน (kill process) และเริ่มใหม่ครับ/ค่ะ

### การติดตั้งด้วย Docker

แก้ไขการตั้งค่าในไฟล์ `docker-compose.yml` และตั้งค่าตัวแปรสภาพแวดล้อมในพารามิเตอร์ `environment` ครับ/ค่ะ ตัวอย่าง:

```yml
services:
  app:
    image: nocobase/nocobase:latest
    environment:
      - APP_ENV=production
```

หรือจะใช้ `env_file` เพื่อตั้งค่าตัวแปรสภาพแวดล้อมในไฟล์ `.env` ก็ได้ครับ/ค่ะ ตัวอย่าง:

```yml
services:
  app:
    image: nocobase/nocobase:latest
    env_file: .env
```

หลังจากแก้ไขตัวแปรสภาพแวดล้อมแล้ว คุณจะต้องสร้างคอนเทนเนอร์ของแอปพลิเคชันขึ้นมาใหม่ครับ/ค่ะ

```yml
docker compose up -d app
```

## ตัวแปรสภาพแวดล้อมแบบ Global

### TZ

ใช้สำหรับตั้งค่าเขตเวลา (Time Zone) ของแอปพลิเคชัน โดยค่าเริ่มต้นจะเป็นเขตเวลาของระบบปฏิบัติการครับ/ค่ะ

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
การดำเนินการที่เกี่ยวข้องกับเวลาจะถูกประมวลผลตามเขตเวลานี้ การแก้ไขค่า TZ อาจส่งผลต่อค่าวันที่ในฐานข้อมูลได้ครับ/ค่ะ สำหรับรายละเอียดเพิ่มเติม โปรดดูที่ [ภาพรวมวันที่และเวลา](/data-sources/data-modeling/collection-fields/datetime)
:::

### APP_ENV

สภาพแวดล้อมของแอปพลิเคชัน ค่าเริ่มต้นคือ `development` ตัวเลือกได้แก่:

- `production` (สภาพแวดล้อม Production)
- `development` (สภาพแวดล้อม Development)

```bash
APP_ENV=production
```

### APP_KEY

คีย์ลับของแอปพลิเคชัน ใช้สำหรับสร้างโทเค็นของผู้ใช้และอื่น ๆ ควรเปลี่ยนเป็นคีย์ลับของแอปพลิเคชันของคุณเอง และตรวจสอบให้แน่ใจว่าจะไม่รั่วไหลออกไปภายนอกครับ/ค่ะ

:::warning
หากมีการแก้ไข APP_KEY โทเค็นเก่า ๆ จะไม่สามารถใช้งานได้อีกต่อไปครับ/ค่ะ
:::

```bash
APP_KEY=app-key-test
```

### APP_PORT

พอร์ตของแอปพลิเคชัน ค่าเริ่มต้นคือ `13000`

```bash
APP_PORT=13000
```

### API_BASE_PATH

คำนำหน้า URL ของ NocoBase API ค่าเริ่มต้นคือ `/api/`

```bash
API_BASE_PATH=/api/
```

### API_BASE_URL

### CLUSTER_MODE

> `v1.6.0+`

โหมดการทำงานแบบหลายคอร์ (Cluster) หากมีการตั้งค่าตัวแปรนี้ จะถูกส่งผ่านไปยังคำสั่ง `pm2 start` ในฐานะพารามิเตอร์ `-i <instances>` ครับ/ค่ะ ตัวเลือกต่าง ๆ จะสอดคล้องกับพารามิเตอร์ `-i` ของ pm2 (ดู [PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)) ซึ่งได้แก่:

- `max`: ใช้จำนวนคอร์ CPU สูงสุด
- `-1`: ใช้จำนวนคอร์ CPU สูงสุด ลบด้วย 1
- `<number>`: ระบุจำนวนคอร์

ค่าเริ่มต้นคือว่างเปล่า ซึ่งหมายถึงไม่ได้เปิดใช้งานครับ/ค่ะ

:::warning{title="ข้อควรระวัง"}
โหมดนี้จำเป็นต้องใช้งานร่วมกับปลั๊กอินที่เกี่ยวข้องกับโหมด Cluster ครับ/ค่ะ มิฉะนั้นฟังก์ชันการทำงานของแอปพลิเคชันอาจเกิดข้อผิดพลาดได้
:::

ดูรายละเอียดเพิ่มเติมได้ที่: [โหมด Cluster](/cluster-mode)

### PLUGIN_PACKAGE_PREFIX

คำนำหน้าชื่อแพ็กเกจของปลั๊กอิน ค่าเริ่มต้นคือ: `@nocobase/plugin-,@nocobase/preset-` ครับ/ค่ะ

ตัวอย่างเช่น หากต้องการเพิ่มปลั๊กอิน `hello` เข้าไปในโปรเจกต์ `my-nocobase-app` ชื่อแพ็กเกจเต็มของปลั๊กอินจะเป็น `@my-nocobase-app/plugin-hello` ครับ/ค่ะ

สามารถตั้งค่า PLUGIN_PACKAGE_PREFIX ได้ดังนี้:

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

ความสัมพันธ์ระหว่างชื่อปลั๊กอินและชื่อแพ็กเกจมีดังนี้:

- ชื่อแพ็กเกจของปลั๊กอิน `users` คือ `@nocobase/plugin-users`
- ชื่อแพ็กเกจของปลั๊กอิน `nocobase` คือ `@nocobase/preset-nocobase`
- ชื่อแพ็กเกจของปลั๊กอิน `hello` คือ `@my-nocobase-app/plugin-hello`

### DB_DIALECT

ประเภทฐานข้อมูล ตัวเลือกได้แก่:

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

### DB_HOST

โฮสต์ฐานข้อมูล (จำเป็นต้องตั้งค่าเมื่อใช้ฐานข้อมูล MySQL หรือ PostgreSQL)

ค่าเริ่มต้นคือ `localhost`

```bash
DB_HOST=localhost
```

### DB_PORT

พอร์ตฐานข้อมูล (จำเป็นต้องตั้งค่าเมื่อใช้ฐานข้อมูล MySQL หรือ PostgreSQL)

- พอร์ตเริ่มต้นสำหรับ MySQL และ MariaDB คือ 3306
- พอร์ตเริ่มต้นสำหรับ PostgreSQL คือ 5432

```bash
DB_PORT=3306
```

### DB_DATABASE

ชื่อฐานข้อมูล (จำเป็นต้องตั้งค่าเมื่อใช้ฐานข้อมูล MySQL หรือ PostgreSQL)

```bash
DB_DATABASE=nocobase
```

### DB_USER

ผู้ใช้ฐานข้อมูล (จำเป็นต้องตั้งค่าเมื่อใช้ฐานข้อมูล MySQL หรือ PostgreSQL)

```bash
DB_USER=nocobase
```

### DB_PASSWORD

รหัสผ่านฐานข้อมูล (จำเป็นต้องตั้งค่าเมื่อใช้ฐานข้อมูล MySQL หรือ PostgreSQL)

```bash
DB_PASSWORD=nocobase
```

### DB_TABLE_PREFIX

คำนำหน้าชื่อตารางข้อมูล

```bash
DB_TABLE_PREFIX=nocobase_
```

### DB_UNDERSCORED

กำหนดว่าจะให้ชื่อตารางและชื่อฟิลด์ในฐานข้อมูลถูกแปลงเป็นรูปแบบ snake_case หรือไม่ ค่าเริ่มต้นคือ `false` หากใช้ฐานข้อมูล MySQL (MariaDB) และ `lower_case_table_names=1` คุณจะต้องตั้งค่า DB_UNDERSCORED เป็น `true` ครับ/ค่ะ

:::warning
เมื่อ `DB_UNDERSCORED=true` ชื่อตารางและชื่อฟิลด์จริงในฐานข้อมูลจะไม่ตรงกับที่แสดงในหน้าจอครับ/ค่ะ เช่น `orderDetails` ในฐานข้อมูลจะเป็น `order_details`
:::

### DB_LOGGING

สวิตช์บันทึก (Log) ฐานข้อมูล ค่าเริ่มต้นคือ `off` ตัวเลือกได้แก่:

- `on` (เปิด)
- `off` (ปิด)

```bash
DB_LOGGING=on
```

### DB_POOL_MAX

จำนวนการเชื่อมต่อสูงสุดใน Connection Pool ของฐานข้อมูล ค่าเริ่มต้นคือ `5` ครับ/ค่ะ

### DB_POOL_MIN

จำนวนการเชื่อมต่อขั้นต่ำใน Connection Pool ของฐานข้อมูล ค่าเริ่มต้นคือ `0` ครับ/ค่ะ

### DB_POOL_IDLE

ระยะเวลาที่การเชื่อมต่อใน Connection Pool สามารถอยู่ในสถานะว่างได้ ค่าเริ่มต้นคือ `10000` (10 วินาที) ครับ/ค่ะ

### DB_POOL_ACQUIRE

ระยะเวลารอสูงสุดที่ Connection Pool จะพยายามรับการเชื่อมต่อ ค่าเริ่มต้นคือ `60000` (60 วินาที) ครับ/ค่ะ

### DB_POOL_EVICT

ระยะเวลาสูงสุดที่การเชื่อมต่อใน Connection Pool จะคงอยู่ ค่าเริ่มต้นคือ `1000` (1 วินาที) ครับ/ค่ะ

### DB_POOL_MAX_USES

จำนวนครั้งที่สามารถใช้การเชื่อมต่อได้ ก่อนที่จะถูกทิ้งและสร้างใหม่ ค่าเริ่มต้นคือ `0` (ไม่จำกัด) ครับ/ค่ะ

### LOGGER_TRANSPORT

วิธีการส่งออก Log หากมีหลายค่า ให้คั่นด้วยเครื่องหมาย `,` ครับ/ค่ะ ค่าเริ่มต้นในสภาพแวดล้อม Development คือ `console` และในสภาพแวดล้อม Production คือ `console,dailyRotateFile` ครับ/ค่ะ
ตัวเลือกได้แก่:

- `console` - `console.log`
- `file` - ส่งออกไปยังไฟล์
- `dailyRotateFile` - ส่งออกไปยังไฟล์ที่หมุนเวียนรายวัน

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

### LOGGER_BASE_PATH

พาธสำหรับจัดเก็บ Log แบบไฟล์ ค่าเริ่มต้นคือ `storage/logs` ครับ/ค่ะ

```bash
LOGGER_BASE_PATH=storage/logs
```

### LOGGER_LEVEL

ระดับการส่งออก Log ค่าเริ่มต้นในสภาพแวดล้อม Development คือ `debug` และในสภาพแวดล้อม Production คือ `info` ครับ/ค่ะ ตัวเลือกได้แก่:

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

ระดับการส่งออก Log ของฐานข้อมูลคือ `debug` ซึ่งถูกควบคุมโดย `DB_LOGGING` และไม่ได้รับผลกระทบจาก `LOGGER_LEVEL` ครับ/ค่ะ

### LOGGER_MAX_FILES

จำนวนไฟล์ Log สูงสุดที่จะเก็บไว้

- เมื่อ `LOGGER_TRANSPORT` เป็น `file` ค่าเริ่มต้นคือ `10` ครับ/ค่ะ
- เมื่อ `LOGGER_TRANSPORT` เป็น `dailyRotateFile` ให้ใช้ `[n]d` เพื่อระบุจำนวนวัน ค่าเริ่มต้นคือ `14d` ครับ/ค่ะ

```bash
LOGGER_MAX_FILES=14d
```

### LOGGER_MAX_SIZE

การหมุนเวียน Log ตามขนาด

- เมื่อ `LOGGER_TRANSPORT` เป็น `file` หน่วยจะเป็น `byte` ค่าเริ่มต้นคือ `20971520 (20 * 1024 * 1024)` ครับ/ค่ะ
- เมื่อ `LOGGER_TRANSPORT` เป็น `dailyRotateFile` สามารถใช้ `[n]k`, `[n]m`, `[n]g` ได้ครับ/ค่ะ ค่าเริ่มต้นไม่ได้ตั้งค่าไว้

```bash
LOGGER_MAX_SIZE=20971520
```

### LOGGER_FORMAT

รูปแบบการพิมพ์ Log ค่าเริ่มต้นในสภาพแวดล้อม Development คือ `console` และในสภาพแวดล้อม Production คือ `json` ครับ/ค่ะ ตัวเลือกได้แก่:

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

อ้างอิง: [รูปแบบ Log](/log-and-monitor/logger/index.md#日志格式)

### CACHE_DEFAULT_STORE

ตัวระบุเฉพาะสำหรับวิธีการแคช ใช้เพื่อระบุวิธีการแคชเริ่มต้นของเซิร์ฟเวอร์ ค่าเริ่มต้นคือ `memory` ตัวเลือกในตัวได้แก่:

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

### CACHE_MEMORY_MAX

จำนวนรายการสูงสุดใน Memory Cache ค่าเริ่มต้นคือ `2000` ครับ/ค่ะ

```bash
CACHE_MEMORY_MAX=2000
```

### CACHE_REDIS_URL

การเชื่อมต่อ Redis เป็นทางเลือกครับ/ค่ะ ตัวอย่าง: `redis://localhost:6379`

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

### TELEMETRY_ENABLED

เปิดใช้งานการรวบรวมข้อมูล Telemetry ค่าเริ่มต้นคือ `off` ครับ/ค่ะ

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_METRIC_READER

ตัวรวบรวม Metric สำหรับการมอนิเตอร์ที่เปิดใช้งาน ค่าเริ่มต้นคือ `console` ครับ/ค่ะ ค่าอื่น ๆ ควรดูจากชื่อที่ลงทะเบียนโดยปลั๊กอินตัวรวบรวมที่เกี่ยวข้อง เช่น `prometheus` หากมีหลายค่า ให้คั่นด้วยเครื่องหมาย `,` ครับ/ค่ะ

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

### TELEMETRY_TRACE_PROCESSOR

ตัวประมวลผลข้อมูล Trace ที่เปิดใช้งาน ค่าเริ่มต้นคือ `console` ครับ/ค่ะ ค่าอื่น ๆ ควรดูจากชื่อที่ลงทะเบียนโดยปลั๊กอินตัวประมวลผลที่เกี่ยวข้อง หากมีหลายค่า ให้คั่นด้วยเครื่องหมาย `,` ครับ/ค่ะ

```bash
TELEMETRY_TRACE_PROCESSOR=console
```

## ตัวแปรสภาพแวดล้อมเชิงทดลอง

### APPEND_PRESET_LOCAL_PLUGINS

ใช้สำหรับเพิ่มปลั๊กอินที่ตั้งค่าไว้ล่วงหน้าแต่ยังไม่ได้เปิดใช้งาน ค่าคือชื่อแพ็กเกจของปลั๊กอิน (พารามิเตอร์ `name` ใน `package.json`) หากมีหลายปลั๊กอิน ให้คั่นด้วยเครื่องหมายจุลภาค (comma) ครับ/ค่ะ

:::info
1. ต้องแน่ใจว่าปลั๊กอินได้ถูกดาวน์โหลดลงในเครื่องแล้ว และสามารถพบได้ในไดเรกทอรี `node_modules` ครับ/ค่ะ ดูรายละเอียดเพิ่มเติมได้ที่ [โครงสร้างโปรเจกต์ของปลั๊กอิน](/plugin-development/project-structure)
2. หลังจากเพิ่มตัวแปรสภาพแวดล้อมแล้ว ปลั๊กอินจะปรากฏในหน้าจัดการปลั๊กอินหลังจากที่คุณติดตั้งครั้งแรก (`nocobase install`) หรืออัปเกรด (`nocobase upgrade`) ครับ/ค่ะ
:::

```bash
APPEND_PRESET_LOCAL_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

### APPEND_PRESET_BUILT_IN_PLUGINS

ใช้สำหรับเพิ่มปลั๊กอินที่มาพร้อมกับระบบและติดตั้งโดยค่าเริ่มต้น ค่าคือชื่อแพ็กเกจของปลั๊กอิน (พารามิเตอร์ `name` ใน `package.json`) หากมีหลายปลั๊กอิน ให้คั่นด้วยเครื่องหมายจุลภาค (comma) ครับ/ค่ะ

:::info
1. ต้องแน่ใจว่าปลั๊กอินได้ถูกดาวน์โหลดลงในเครื่องแล้ว และสามารถพบได้ในไดเรกทอรี `node_modules` ครับ/ค่ะ ดูรายละเอียดเพิ่มเติมได้ที่ [โครงสร้างโปรเจกต์ของปลั๊กอิน](/plugin-development/project-structure)
2. หลังจากเพิ่มตัวแปรสภาพแวดล้อมแล้ว ปลั๊กอินจะถูกติดตั้งหรืออัปเกรดโดยอัตโนมัติเมื่อคุณติดตั้งครั้งแรก (`nocobase install`) หรืออัปเกรด (`nocobase upgrade`) ครับ/ค่ะ
:::

```bash
APPEND_PRESET_BUILT_IN_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

## ตัวแปรสภาพแวดล้อมชั่วคราว

เมื่อติดตั้ง NocoBase คุณสามารถตั้งค่าตัวแปรสภาพแวดล้อมชั่วคราวเพื่อช่วยในการติดตั้งได้ครับ/ค่ะ เช่น:

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install

# เท่ากับ
yarn nocobase install \
  --lang=zh-CN  \
  --root-email=demo@nocobase.com \
  --root-password=admin123 \
  --root-nickname="Super Admin"

# เท่ากับ
yarn nocobase install -l zh-CN -e demo@nocobase.com -p admin123 -n "Super Admin"
```

### INIT_APP_LANG

ภาษาที่ใช้ในการติดตั้ง ค่าเริ่มต้นคือ `en-US` ตัวเลือกได้แก่:

- `en-US`
- `zh-CN`

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  nocobase install
```

### INIT_ROOT_EMAIL

อีเมลของผู้ใช้ Root

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  nocobase install
```

### INIT_ROOT_PASSWORD

รหัสผ่านของผู้ใช้ Root

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  nocobase install
```

### INIT_ROOT_NICKNAME

ชื่อเล่นของผู้ใช้ Root

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install
```