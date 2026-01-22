:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# HTTP API

การอัปโหลดไฟล์สำหรับทั้งฟิลด์แนบไฟล์ (Attachment fields) และคอลเลกชันไฟล์ (File collections) รองรับการทำงานผ่าน HTTP API ครับ/ค่ะ โดยวิธีการเรียกใช้งานจะแตกต่างกันไป ขึ้นอยู่กับ Storage Engine ที่ใช้สำหรับฟิลด์แนบไฟล์หรือคอลเลกชันไฟล์นั้นๆ ครับ/ค่ะ

## การอัปโหลดฝั่งเซิร์ฟเวอร์

สำหรับ Storage Engine แบบ Open-source ที่มาพร้อมกับโปรเจกต์ เช่น S3, OSS, และ COS การเรียกใช้ HTTP API จะเหมือนกับการอัปโหลดผ่านหน้า UI เลยครับ/ค่ะ โดยไฟล์จะถูกอัปโหลดผ่านฝั่งเซิร์ฟเวอร์ การเรียกใช้ API จำเป็นต้องส่ง JWT โทเค็นที่ได้จากการล็อกอินของผู้ใช้ผ่าน `Authorization` ในส่วนหัวของคำขอ (Request Header) ครับ/ค่ะ มิฉะนั้นจะถูกปฏิเสธการเข้าถึง

### ฟิลด์แนบไฟล์

เริ่มต้นด้วยการเรียกใช้ `create` บนทรัพยากร `attachments` (ตารางแนบไฟล์) ส่งคำขอแบบ POST และอัปโหลดเนื้อหาไบนารีผ่านฟิลด์ `file` ครับ/ค่ะ หลังจากเรียกใช้ ไฟล์จะถูกอัปโหลดไปยัง Storage Engine เริ่มต้นครับ/ค่ะ

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

หากต้องการอัปโหลดไฟล์ไปยัง Storage Engine อื่น คุณสามารถใช้พารามิเตอร์ `attachmentField` เพื่อระบุ Storage Engine ที่กำหนดค่าไว้สำหรับฟิลด์ของคอลเลกชันนั้นๆ ได้เลยครับ/ค่ะ (หากไม่ได้กำหนดค่าไว้ ไฟล์จะถูกอัปโหลดไปยัง Storage Engine เริ่มต้นครับ/ค่ะ)

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### คอลเลกชันไฟล์

การอัปโหลดไปยังคอลเลกชันไฟล์จะสร้างเรคคอร์ดไฟล์โดยอัตโนมัติครับ/ค่ะ โดยคุณสามารถเรียกใช้ `create` บนทรัพยากรคอลเลกชันไฟล์ ส่งคำขอแบบ POST และอัปโหลดเนื้อหาไบนารีผ่านฟิลด์ `file` ได้เลยครับ/ค่ะ

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

เมื่ออัปโหลดไปยังคอลเลกชันไฟล์ ไม่จำเป็นต้องระบุ Storage Engine ครับ/ค่ะ ไฟล์จะถูกอัปโหลดไปยัง Storage Engine ที่กำหนดค่าไว้สำหรับคอลเลกชันนั้นโดยอัตโนมัติ

## การอัปโหลดฝั่งไคลเอ็นต์

สำหรับ Storage Engine ที่รองรับ S3 ซึ่งให้บริการผ่านปลั๊กอิน S3-Pro (เชิงพาณิชย์) การอัปโหลดผ่าน HTTP API จะต้องทำตามขั้นตอนหลายขั้นตอนครับ/ค่ะ

### ฟิลด์แนบไฟล์

1.  รับข้อมูล Storage Engine

    เรียกใช้ `getBasicInfo` บนคอลเลกชัน `storages` (ตาราง Storage) พร้อมระบุชื่อ Storage (storage name) เพื่อขอข้อมูลการตั้งค่าของ Storage Engine ครับ/ค่ะ

    ```shell
    curl 'http://localhost:13000/api/storages:getBasicInfo/<storage_name>' \
      -H 'Authorization: Bearer <JWT>'
    ```

    ตัวอย่างข้อมูลการตั้งค่า Storage Engine ที่ได้รับกลับมา:

    ```json
    {
      "id": 2,
      "title": "xxx",
      "name": "xxx",
      "type": "s3-compatible",
      "rules": { ... }
    }
    ```

2.  รับข้อมูล Presigned จากผู้ให้บริการ

    เรียกใช้ `createPresignedUrl` บนทรัพยากร `fileStorageS3` ส่งคำขอแบบ POST พร้อมแนบข้อมูลที่เกี่ยวข้องกับไฟล์ในส่วน Body เพื่อรับข้อมูลการอัปโหลดแบบ Presigned ครับ/ค่ะ

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
    > * name: ชื่อไฟล์
    > * size: ขนาดไฟล์ (หน่วยเป็น bytes)
    > * type: ชนิด MIME ของไฟล์ สามารถดูเพิ่มเติมได้ที่: [ชนิด MIME ทั่วไป](https://developer.mozilla.org/docs/Web/HTTP/MIME_types/Common_types)
    > * storageId: ID ของ Storage Engine (ฟิลด์ `id` ที่ได้จากขั้นตอนแรก)
    > * storageType: ชนิดของ Storage Engine (ฟิลด์ `type` ที่ได้จากขั้นตอนแรก)
    >
    > ตัวอย่างข้อมูลคำขอ:
    >
    > ```
    > --data-raw '{"name":"a.png","size":4405,"type":"image/png","storageId":2,"storageType":"s3-compatible"}'
    > ```

    โครงสร้างข้อมูลของ Presigned Information ที่ได้รับมีดังนี้ครับ/ค่ะ

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

    ใช้ `putUrl` ที่ได้รับกลับมาเพื่อส่งคำขอแบบ `PUT` โดยอัปโหลดไฟล์เป็นส่วน Body ครับ/ค่ะ

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```
    > หมายเหตุ:
    > * putUrl: ฟิลด์ `putUrl` ที่ได้จากขั้นตอนก่อนหน้า
    > * file_path: พาธของไฟล์ในเครื่องที่ต้องการอัปโหลด
    >
    > ตัวอย่างข้อมูลคำขอ:
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  สร้างเรคคอร์ดไฟล์

    หลังจากอัปโหลดสำเร็จ ให้เรียกใช้ `create` บนทรัพยากร `attachments` (ตารางแนบไฟล์) โดยส่งคำขอแบบ POST เพื่อสร้างเรคคอร์ดไฟล์ครับ/ค่ะ

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > คำอธิบายข้อมูลที่จำเป็นใน data-raw:
    > * title: ฟิลด์ `fileInfo.title` ที่ได้จากขั้นตอนก่อนหน้า
    > * filename: ฟิลด์ `fileInfo.key` ที่ได้จากขั้นตอนก่อนหน้า
    > * extname: ฟิลด์ `fileInfo.extname` ที่ได้จากขั้นตอนก่อนหน้า
    > * path: ค่าเริ่มต้นเป็นค่าว่าง
    > * size: ฟิลด์ `fileInfo.size` ที่ได้จากขั้นตอนก่อนหน้า
    > * url: ค่าเริ่มต้นเป็นค่าว่าง
    > * mimetype: ฟิลด์ `fileInfo.mimetype` ที่ได้จากขั้นตอนก่อนหน้า
    > * meta: ฟิลด์ `fileInfo.meta` ที่ได้จากขั้นตอนก่อนหน้า
    > * storageId: ฟิลด์ `id` ที่ได้จากขั้นตอนแรก
    >
    > ตัวอย่างข้อมูลคำขอ:
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### คอลเลกชันไฟล์

สามขั้นตอนแรกจะเหมือนกับการอัปโหลดสำหรับฟิลด์แนบไฟล์ครับ/ค่ะ แต่ในขั้นตอนที่สี่ คุณจะต้องสร้างเรคคอร์ดไฟล์โดยการเรียกใช้ `create` บนทรัพยากรคอลเลกชันไฟล์ ส่งคำขอแบบ POST และอัปโหลดข้อมูลไฟล์ผ่านส่วน Body ครับ/ค่ะ

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> คำอธิบายข้อมูลที่จำเป็นใน data-raw:
> * title: ฟิลด์ `fileInfo.title` ที่ได้จากขั้นตอนก่อนหน้า
> * filename: ฟิลด์ `fileInfo.key` ที่ได้จากขั้นตอนก่อนหน้า
> * extname: ฟิลด์ `fileInfo.extname` ที่ได้จากขั้นตอนก่อนหน้า
> * path: ค่าเริ่มต้นเป็นค่าว่าง
> * size: ฟิลด์ `fileInfo.size` ที่ได้จากขั้นตอนก่อนหน้า
> * url: ค่าเริ่มต้นเป็นค่าว่าง
> * mimetype: ฟิลด์ `fileInfo.mimetype` ที่ได้จากขั้นตอนก่อนหน้า
> * meta: ฟิลด์ `fileInfo.meta` ที่ได้จากขั้นตอนก่อนหน้า
> * storageId: ฟิลด์ `id` ที่ได้จากขั้นตอนแรก
>
> ตัวอย่างข้อมูลคำขอ:
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```