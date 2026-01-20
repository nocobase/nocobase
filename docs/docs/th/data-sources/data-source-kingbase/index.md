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
version: "3"

networks:
  nocobase:
    driver: bridge

  app:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest
    restart: always
    networks:
      - nocobase
    depends_on:
      - postgres
    environment:
      # คีย์ของแอปพลิเคชัน ใช้สำหรับสร้างโทเค็นผู้ใช้ เป็นต้น
      # หาก APP_KEY ถูกแก้ไข โทเค็นเก่าจะใช้งานไม่ได้
      # สามารถเป็นสตริงสุ่มใดก็ได้ และต้องแน่ใจว่าไม่รั่วไหลสู่ภายนอก
      - APP_KEY=your-secret-key
      # ประเภทฐานข้อมูล
      - DB_DIALECT=kingbase
      # โฮสต์ฐานข้อมูล สามารถแทนที่ด้วย IP ของเซิร์ฟเวอร์ฐานข้อมูลที่มีอยู่ได้
      - DB_HOST=kingbase
      # ชื่อฐานข้อมูล
      - DB_DATABASE=kingbase
      # ผู้ใช้ฐานข้อมูล
      - DB_USER=nocobase
      # รหัสผ่านฐานข้อมูล
      - DB_PASSWORD=nocobase
      # เขตเวลา
      - TZ=Asia/Shanghai
    volumes:
      - ./storage:/app/nocobase/storage
    ports:
      - "13000:80"

  # บริการ Kingbase สำหรับการทดสอบเท่านั้น
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
      ENABLE_CI: no # ต้องตั้งค่าเป็น no
      DB_USER: nocobase
      DB_PASSWORD: nocobase
      DB_MODE: pg  # เฉพาะ pg เท่านั้น
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