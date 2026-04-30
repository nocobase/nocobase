---
pkg: '@nocobase/plugin-file-manager'
title: "HTTP API Upload File"
description: "Field lampiran dan tabel file mendukung upload melalui HTTP API, termasuk upload sisi server (S3/OSS/COS) dan upload langsung dari client (presigned URL S3-Pro), dengan contoh curl."
keywords: "HTTP API,Upload file,attachments create,Presigned URL,S3-Pro,Upload sisi server,Upload sisi client,NocoBase"
---

# HTTP API

Upload file dari field lampiran maupun tabel file mendukung pemrosesan melalui HTTP API. Tergantung dari storage engine yang digunakan oleh field lampiran atau tabel file, ada cara pemanggilan yang berbeda.

## Upload Sisi Server

Untuk storage engine open source bawaan project seperti S3, OSS, COS, HTTP API memanggil fitur upload yang sama dengan antarmuka pengguna, file diunggah melalui sisi server. Pemanggilan API memerlukan request header `Authorization` dengan JWT token berbasis login pengguna, jika tidak akan ditolak aksesnya.

### Field Lampiran

Lakukan operasi `create` pada resource tabel lampiran (`attachments`), kirim request dengan metode POST, dan unggah konten biner melalui field `file`. Setelah dipanggil, file akan diunggah ke storage engine default.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

Jika Anda perlu mengunggah file ke storage engine yang berbeda, Anda dapat menentukan storage engine yang sudah dikonfigurasi pada field tabel data melalui parameter `attachmentField` (jika tidak dikonfigurasi, akan diunggah ke storage engine default).

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### Tabel File

Upload ke tabel file akan secara otomatis menghasilkan record file. Lakukan operasi `create` pada resource tabel file, kirim request dengan metode POST, dan unggah konten biner melalui field `file`.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

Untuk upload ke tabel file tidak perlu menentukan storage engine, file akan diunggah ke storage engine yang dikonfigurasi pada tabel tersebut.

## Upload Sisi Client

Untuk storage engine yang kompatibel dengan S3 yang disediakan plugin komersial S3-Pro, upload melalui HTTP API perlu dilakukan melalui beberapa langkah.

### Field Lampiran

1.  Mendapatkan informasi storage engine

    Lakukan operasi `getBasicInfo` pada tabel storage (`storages`), dengan menyertakan identifier ruang penyimpanan (storage name), untuk meminta informasi konfigurasi storage engine

    ```shell
    curl 'http://localhost:13000/api/storages:getBasicInfo/<storage_name>' \
      -H 'Authorization: Bearer <JWT>'
    ```

    Contoh informasi konfigurasi storage engine yang dikembalikan:

    ```json
    {
      "id": 2,
      "title": "xxx",
      "name": "xxx",
      "type": "s3-compatible",
      "rules": { ... }
    }
    ```

2.  Mendapatkan informasi presign dari penyedia layanan

    Lakukan operasi `createPresignedUrl` pada resource `fileStorageS3`, kirim request dengan metode POST, dan sertakan informasi terkait file di body, untuk mendapatkan informasi upload presigned

    ```shell
    curl 'http://localhost:13000/api/fileStorageS3:createPresignedUrl' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"name":<name>,"size":<size>,"type":<type>,"storageId":<storageId>,"storageType":<storageType>}'
    ```

    > Penjelasan:
    > 
    > * name: nama file
    > * size: ukuran file (dalam satuan bytes)
    > * type: tipe MIME file, dapat merujuk ke: [Tipe MIME Umum](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/MIME_types/Common_types)
    > * storageId: id dari storage engine (field `id` yang dikembalikan pada langkah pertama)
    > * storageType: tipe storage engine (field `type` yang dikembalikan pada langkah pertama)
    > 
    > Contoh data request:
    > 
    > ```
    > --data-raw '{"name":"a.png","size":4405,"type":"image/png","storageId":2,"storageType":"s3-compatible"}'
    > ```

    Struktur data informasi presigned yang didapat sebagai berikut

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

3.  Upload File

    Gunakan `putUrl` yang dikembalikan untuk melakukan request `PUT`, mengunggah file sebagai body.

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```
    > Penjelasan:
    > * putUrl: field `putUrl` yang dikembalikan pada langkah sebelumnya
    > * file_path: path file lokal yang akan diunggah
    > 
    > Contoh data request:
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  Membuat record baris file

    Setelah upload berhasil, lakukan operasi `create` pada resource tabel lampiran (`attachments`), kirim request dengan metode POST, untuk membuat record file.

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > Penjelasan data dependency dalam data-raw:
    > * title: field `fileInfo.title` yang dikembalikan pada langkah sebelumnya
    > * filename: field `fileInfo.key` yang dikembalikan pada langkah sebelumnya
    > * extname: field `fileInfo.extname` yang dikembalikan pada langkah sebelumnya
    > * path: default kosong
    > * size: field `fileInfo.size` yang dikembalikan pada langkah sebelumnya
    > * url: default kosong
    > * mimetype: field `fileInfo.mimetype` yang dikembalikan pada langkah sebelumnya
    > * meta: field `fileInfo.meta` yang dikembalikan pada langkah sebelumnya
    > * storageId: field `id` yang dikembalikan pada langkah pertama
    > 
    > Contoh data request:
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### Tabel File

Tiga langkah pertama sama dengan upload field lampiran, namun pada langkah keempat perlu membuat record file. Lakukan operasi create pada resource tabel file, kirim request dengan metode POST, dan unggah informasi file melalui body.

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> Penjelasan data dependency dalam data-raw:
> * title: field `fileInfo.title` yang dikembalikan pada langkah sebelumnya
> * filename: field `fileInfo.key` yang dikembalikan pada langkah sebelumnya
> * extname: field `fileInfo.extname` yang dikembalikan pada langkah sebelumnya
> * path: default kosong
> * size: field `fileInfo.size` yang dikembalikan pada langkah sebelumnya
> * url: default kosong
> * mimetype: field `fileInfo.mimetype` yang dikembalikan pada langkah sebelumnya
> * meta: field `fileInfo.meta` yang dikembalikan pada langkah sebelumnya
> * storageId: field `id` yang dikembalikan pada langkah pertama
> 
> Contoh data request:
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```
