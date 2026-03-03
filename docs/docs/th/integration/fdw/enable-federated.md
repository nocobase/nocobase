:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/integration/fdw/enable-federated)
:::

# วิธีเปิดใช้งาน Federated Engine ใน MySQL

โดยปกติแล้วฐานข้อมูล MySQL จะไม่ได้เปิดใช้งานโมดูล federated มาให้โดยค่าเริ่มต้น คุณจำเป็นต้องแก้ไขการตั้งค่า `my.cnf` หากคุณใช้งานเวอร์ชัน Docker คุณสามารถจัดการการตั้งค่าเพิ่มเติมได้ผ่าน volumes ครับ:

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

สร้างไฟล์ใหม่ที่ `./storage/mysql-conf/federated.cnf`

```ini
[mysqld]
federated
```

รีสตาร์ท MySQL

```bash
docker compose up -d mysql
```

ตรวจสอบว่า federated ถูกเปิดใช้งานแล้วหรือไม่

```sql
show engines
```

![Alt text](https://static-docs.nocobase.com/ac5d97cf902ad164e141633a41a23e46.png)