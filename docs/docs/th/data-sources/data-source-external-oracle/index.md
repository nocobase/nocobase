---
pkg: "@nocobase/plugin-data-source-external-oracle"
---
:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::

# แหล่งข้อมูลภายนอก - Oracle

## บทนำ

ปลั๊กอินนี้ช่วยให้คุณสามารถใช้ฐานข้อมูล Oracle ภายนอกเป็นแหล่งข้อมูลได้ครับ/ค่ะ ปัจจุบันรองรับ Oracle เวอร์ชัน 11g ขึ้นไป

## การติดตั้ง

### ติดตั้ง Oracle Client

สำหรับ Oracle Server เวอร์ชันที่ต่ำกว่า 12.1 คุณจำเป็นต้องติดตั้ง Oracle Client ครับ/ค่ะ

![การติดตั้ง Oracle Client](https://static-docs.nocobase.com/20241204164359.png)

ตัวอย่างสำหรับ Linux:

```bash
apt-get update
apt-get install -y unzip wget libaio1
wget https://download.oracle.com/otn_software/linux/instantclient/1925000/instantclient-basic-linux.x64-19.25.0.0.0dbru.zip
unzip instantclient-basic-linux.x64-19.25.0.0.0dbru.zip -d /opt/
echo /opt/instantclient_19_25 > /etc/ld.so.conf.d/oracle-instantclient.conf
ldconfig
```

หากคุณไม่ได้ติดตั้ง Client ตามที่กล่าวมาข้างต้น คุณจะต้องระบุพาธของ Client ครับ/ค่ะ (สำหรับรายละเอียดเพิ่มเติม โปรดดูเอกสาร [node-oracledb](https://node-oracledb.readthedocs.io/en/latest/user_guide/initialization.html))

![การกำหนดค่าพาธ Oracle Client](https://static-docs.nocobase.com/20241204165940.png)

### ติดตั้งปลั๊กอิน

โปรดดู

## วิธีใช้งาน

ดูรายละเอียดได้ที่ส่วน [แหล่งข้อมูล / ฐานข้อมูลภายนอก](/data-sources/data-source-manager/external-database) ครับ/ค่ะ