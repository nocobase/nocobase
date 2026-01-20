:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# HTTP API

การอัปโหลดไฟล์สำหรับฟิลด์แนบไฟล์และคอลเลกชันไฟล์สามารถจัดการได้ผ่าน HTTP API ครับ โดยวิธีการเรียกใช้งานจะแตกต่างกันไปขึ้นอยู่กับสตอเรจเอนจินที่ใช้สำหรับไฟล์แนบหรือคอลเลกชันไฟล์นั้นๆ ครับ

## การอัปโหลดฝั่งเซิร์ฟเวอร์

สำหรับสตอเรจเอนจินโอเพนซอร์สในตัว เช่น S3, OSS และ COS การเรียกใช้ HTTP API จะเหมือนกับการใช้งานฟังก์ชันอัปโหลดผ่านส่วนติดต่อผู้ใช้ (UI) โดยไฟล์จะถูกอัปโหลดผ่านเซิร์ฟเวอร์ครับ การเรียกใช้ API จำเป็นต้องส่งโทเค็น JWT ที่ได้จากการล็อกอินของผู้ใช้ผ่านเฮดเดอร์ `Authorization` ในคำขอ มิฉะนั้นการเข้าถึงจะถูกปฏิเสธครับ

### ฟิลด์แนบไฟล์

เริ่มต้นด้วยการเรียกใช้การดำเนินการ `create` บนทรัพยากร `attachments` (ตารางไฟล์แนบ) โดยส่งคำขอ POST และอัปโหลดเนื้อหาไบนารีผ่านฟิลด์ `file` ครับ หลังจากเรียกใช้แล้ว ไฟล์จะถูกอัปโหลดไปยังสตอเรจเอนจินเริ่มต้น

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

หากต้องการอัปโหลดไฟล์ไปยังสตอเรจเอนจินอื่น คุณสามารถใช้พารามิเตอร์ `attachmentField` เพื่อระบุสตอเรจเอนจินที่กำหนดค่าไว้สำหรับฟิลด์ของคอลเลกชันได้ครับ หากไม่ได้กำหนดค่าไว้ ไฟล์จะถูกอัปโหลดไปยังสตอเรจเอนจินเริ่มต้นครับ

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### คอลเลกชันไฟล์

การอัปโหลดไปยังคอลเลกชันไฟล์จะสร้างบันทึกไฟล์โดยอัตโนมัติครับ โดยเริ่มจากการเรียกใช้การดำเนินการ `create` บนทรัพยากรคอลเลกชันไฟล์ ด้วยการส่งคำขอ POST และอัปโหลดเนื้อหาไบนารีผ่านฟิลด์ `file` ครับ

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

เมื่ออัปโหลดไปยังคอลเลกชันไฟล์ ไม่จำเป็นต้องระบุสตอเรจเอนจินครับ ไฟล์จะถูกอัปโหลดไปยังสตอเรจเอนจินที่กำหนดค่าไว้สำหรับคอลเลกชันนั้นโดยอัตโนมัติครับ

## การอัปโหลดฝั่งไคลเอ็นต์

สำหรับสตอเรจเอนจินที่เข้ากันได้กับ S3 ซึ่งให้บริการผ่านปลั๊กอิน S3-Pro เชิงพาณิชย์ การอัปโหลดด้วย HTTP API จะต้องดำเนินการหลายขั้นตอนครับ

### ฟิลด์แนบไฟล์

1.  รับข้อมูลสตอเรจเอนจิน

    เริ่มต้นด้วยการเรียกใช้การดำเนินการ `getBasicInfo` บนคอลเลกชัน `storages` (ตารางสตอเรจ) พร้อมระบุชื่อสตอเรจ (storage name) เพื่อขอข้อมูลการกำหนดค่าของสตอเรจเอนจินครับ

    ```shell
    curl 'http://localhost:13000/api/storages:getBasicInfo/<storage_name>' \
      -H 'Authorization: Bearer <JWT>'
    ```

    ตัวอย่างข้อมูลการกำหนดค่าสตอเรจเอนจินที่ส่งกลับมา:

    ```json
    {
      "id": 2,
      "title": "xxx",
      "name": "xxx",
      "type": "s3-compatible",
      "rules": { ... }
    }
    ```

2.  รับข้อมูล URL ที่ลงนามล่วงหน้า (Presigned URL) จากผู้ให้บริการ

    เริ่มต้นด้วยการเรียกใช้การดำเนินการ `createPresignedUrl` บนทรัพยากร `fileStorageS3` โดยส่งคำขอ POST พร้อมข้อมูลที่เกี่ยวข้องกับไฟล์ในส่วน Body เพื่อรับข้อมูลการอัปโหลดที่ลงนามล่วงหน้าครับ

    ```shell
    curl 'http://localhost:13000/api/fileStorageS3:createPresignedUrl' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"name":<name>,"size":<size>,"type":<type>,"storageId":<storageId>,"storageType":<storageType>}'
    ```

    > หมายเหตุ:
    >
    > *   `name`: ชื่อไฟล์
    > *   `size`: ขนาดไฟล์ (หน่วยเป็นไบต์)
    > *   `type`: ชนิด MIME ของไฟล์ สามารถดูเพิ่มเติมได้ที่: [ชนิด MIME ทั่วไป](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/MIME_types/Common_types)
    > *   `storageId`: ID ของสตอเรจเอนจิน (คือฟิลด์ `id` ที่ส่งกลับมาในขั้นตอนที่ 1)
    > *   `storageType`: ชนิดของสตอเรจเอนจิน (คือฟิลด์ `type` ที่ส่งกลับมาในขั้นตอนที่ 1)
    >
    > ตัวอย่างข้อมูลคำขอ:
    >
    > ```
    > --data-raw '{"name":"a.png","size":4405,"type":"image/png","storageId":2,"storageType":"s3-compatible"}'
    > ```

    โครงสร้างข้อมูลของข้อมูลที่ลงนามล่วงหน้าที่ได้รับจะเป็นดังนี้ครับ

    ```json
    {
      "putUrl": "https://xxxxxxx",
      "fileInfo": {
        "key": "xxx",
        "title": "xxx",
        "filename": "xxx",
        "extname": ".png",
        "size": 4405,
        "mimetype": "image/png",
        "meta": {},
        "url": ""
      }
    }
    ```

3.  อัปโหลดไฟล์

    ใช้ `putUrl` ที่ได้รับกลับมาเพื่อส่งคำขอ `PUT` โดยอัปโหลดไฟล์เป็นส่วน Body ครับ

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```
    > หมายเหตุ:
    > *   `putUrl`: ฟิลด์ `putUrl` ที่ส่งกลับมาในขั้นตอนก่อนหน้า
    > *   `file_path`: พาธ (path) โลคัลของไฟล์ที่จะอัปโหลด
    >
    > ตัวอย่างข้อมูลคำขอ:
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  สร้างบันทึกไฟล์

    หลังจากอัปโหลดสำเร็จ ให้สร้างบันทึกไฟล์โดยเริ่มจากการเรียกใช้การดำเนินการ `create` บนทรัพยากร `attachments` (ตารางไฟล์แนบ) ด้วยคำขอ POST ครับ

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > คำอธิบายข้อมูลที่เกี่ยวข้องใน `data-raw`:
    > *   `title`: ฟิลด์ `fileInfo.title` ที่ส่งกลับมาในขั้นตอนก่อนหน้า
    > *   `filename`: ฟิลด์ `fileInfo.key` ที่ส่งกลับมาในขั้นตอนก่อนหน้า
    > *   `extname`: ฟิลด์ `fileInfo.extname` ที่ส่งกลับมาในขั้นตอนก่อนหน้า
    > *   `path`: ค่าว่างโดยปริยาย
    > *   `size`: ฟิลด์ `fileInfo.size` ที่ส่งกลับมาในขั้นตอนก่อนหน้า
    > *   `url`: ค่าว่างโดยปริยาย
    > *   `mimetype`: ฟิลด์ `fileInfo.mimetype` ที่ส่งกลับมาในขั้นตอนก่อนหน้า
    > *   `meta`: ฟิลด์ `fileInfo.meta` ที่ส่งกลับมาในขั้นตอนก่อนหน้า
    > *   `storageId`: ฟิลด์ `id` ที่ส่งกลับมาในขั้นตอนที่ 1
    >
    > ตัวอย่างข้อมูลคำขอ:
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### คอลเลกชันไฟล์

สามขั้นตอนแรกจะเหมือนกับการอัปโหลดไปยังฟิลด์แนบไฟล์ครับ อย่างไรก็ตาม ในขั้นตอนที่สี่ คุณจะต้องสร้างบันทึกไฟล์โดยเริ่มจากการเรียกใช้การดำเนินการ `create` บนทรัพยากรคอลเลกชันไฟล์ ด้วยคำขอ POST และอัปโหลดข้อมูลไฟล์ในส่วน Body ครับ

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> คำอธิบายข้อมูลที่เกี่ยวข้องใน `data-raw`:
> *   `title`: ฟิลด์ `fileInfo.title` ที่ส่งกลับมาในขั้นตอนก่อนหน้า
> *   `filename`: ฟิลด์ `fileInfo.key` ที่ส่งกลับมาในขั้นตอนก่อนหน้า
> *   `extname`: ฟิลด์ `fileInfo.extname` ที่ส่งกลับมาในขั้นตอนก่อนหน้า
> *   `path`: ค่าว่างโดยปริยาย
> *   `size`: ฟิลด์ `fileInfo.size` ที่ส่งกลับมาในขั้นตอนก่อนหน้า
> *   `url`: ค่าว่างโดยปริยาย
> *   `mimetype`: ฟิลด์ `fileInfo.mimetype` ที่ส่งกลับมาในขั้นตอนก่อนหน้า
> *   `meta`: ฟิลด์ `fileInfo.meta` ที่ส่งกลับมาในขั้นตอนก่อนหน้า
> *   `storageId`: ฟิลด์ `id` ที่ส่งกลับมาในขั้นตอนที่ 1
>
> ตัวอย่างข้อมูลคำขอ:
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```