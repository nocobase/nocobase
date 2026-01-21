---
pkg: "@nocobase/plugin-data-source-kingbase"
---
:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::

# แหล่งข้อมูล - KingbaseES

## บทนำ

ฐานข้อมูล KingbaseES สามารถใช้เป็นแหล่งข้อมูลได้ ทั้งในฐานะฐานข้อมูลหลักและฐานข้อมูลภายนอกครับ/ค่ะ

:::warning
ปัจจุบันรองรับเฉพาะฐานข้อมูล KingbaseES ที่ทำงานในโหมด pg เท่านั้นครับ/ค่ะ
:::

## การติดตั้ง

### การใช้งานเป็นฐานข้อมูลหลัก

ขั้นตอนการติดตั้งอ้างอิงจากเอกสารการติดตั้งครับ/ค่ะ โดยความแตกต่างหลักจะอยู่ที่ตัวแปรสภาพแวดล้อม

#### ตัวแปรสภาพแวดล้อม

แก้ไขไฟล์ .env เพื่อเพิ่มหรือแก้ไขการตั้งค่าตัวแปรสภาพแวดล้อมที่เกี่ยวข้องดังต่อไปนี้ครับ/ค่ะ

```bash
# ปรับพารามิเตอร์ DB ตามความเหมาะสม
DB_DIALECT=kingbase
DB_HOST=localhost
DB_PORT=54321
DB_DATABASE=kingbase
DB_USER=nocobase
DB_PASSWORD=nocobase
```

#### การติดตั้งด้วย Docker

```yml
networks:
  nocobase:
    driver: bridge

services:
  app:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest
    restart: always
    networks:
      - nocobase
    depends_on:
      - kingbase
    environment:
      # Application key for generating user tokens, etc.
      # Changing APP_KEY invalidates old tokens
      # Use a random string and keep it confidential
      - APP_KEY=your-secret-key
      # Database type
      - DB_DIALECT=kingbase
      # Database host, replace with existing database server IP if needed
      - DB_HOST=kingbase
      - DB_PORT=54321
      # Database name
      - DB_DATABASE=kingbase
      # Database user
      - DB_USER=nocobase
      # Database password
      - DB_PASSWORD=nocobase
      # Timezone
      - TZ=UTC
    volumes:
      - ./storage:/app/nocobase/storage
    ports:
      - "11000:80"

  # Kingbase service for testing purposes only
  kingbase:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/kingbase:v009r001c001b0030_single_x86
    platform: linux/amd64
    restart: always
    privileged: true
    networks:
      - nocobase
    volumes:
      - ./storage/db/kingbase:/home/kingbase/userdata
    environment:
      ENABLE_CI: no # Must be set to no
      DB_USER: nocobase
      DB_PASSWORD: nocobase
      DB_MODE: pg  # pg only
      NEED_START: yes
    command: ["/usr/sbin/init"]
```

#### การติดตั้งโดยใช้ create-nocobase-app

```bash
yarn create nocobase-app my-nocobase-app -d kingbase \
   -e DB_HOST=localhost \
   -e DB_PORT=54321 \
   -e DB_DATABASE=kingbase \
   -e DB_USER=nocobase \
   -e DB_PASSWORD=nocobase \
   -e TZ=Asia/Shanghai
```

### การใช้งานเป็นฐานข้อมูลภายนอก

รันคำสั่งติดตั้งหรืออัปเกรด

```bash
yarn nocobase install
# หรือ
yarn nocobase upgrade
```

เปิดใช้งานปลั๊กอิน

![20241024121815](https://static-docs.nocobase.com/20241024121815.png)

## คู่มือการใช้งาน

- ฐานข้อมูลหลัก: โปรดดูที่ [แหล่งข้อมูลหลัก](/data-sources/data-source-main/)
- ฐานข้อมูลภายนอก: โปรดดูที่ [แหล่งข้อมูล / ฐานข้อมูลภายนอก](/data-sources/data-source-manager/external-database)