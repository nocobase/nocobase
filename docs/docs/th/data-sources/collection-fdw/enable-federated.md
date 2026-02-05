:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# วิธีเปิดใช้งาน Federated Engine ใน MySQL

โดยปกติแล้ว ฐานข้อมูล MySQL จะไม่ได้เปิดใช้งานโมดูล federated ไว้ตั้งแต่ต้นครับ/ค่ะ คุณจะต้องแก้ไขไฟล์คอนฟิกูเรชัน `my.cnf` หากคุณใช้งาน MySQL เวอร์ชัน Docker คุณสามารถจัดการการตั้งค่าเพิ่มเติมนี้ได้ผ่าน `volumes` ดังนี้ครับ/ค่ะ

```yml
mysql:
  image: mysql:8.1.0
  volumes:
    - ./storage/mysql-conf:/etc/mysql/conf.d
  environment:
    MYSQL_DATABASE: nocobase
    MYSQL_USER: nocobase
    MYSQL_PASSWORD: nocobase
    MYSQL_ROOT_PASSWORD: nocobase
  restart: always
  networks:
    - nocobase
```

สร้างไฟล์ใหม่ชื่อ `./storage/mysql-conf/federated.cnf` ครับ/ค่ะ

```ini
[mysqld]
federated
```

รีสตาร์ท MySQL ครับ/ค่ะ

```bash
docker compose up -d mysql
```

ตรวจสอบว่า federated เปิดใช้งานแล้วหรือยังครับ/ค่ะ

```sql
show engines
```

![Alt text](https://static-docs.nocobase.com/ac5d97cf902ad164e141633a41a23e46.png)