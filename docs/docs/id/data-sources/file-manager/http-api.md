---
title: "HTTP API File Manager"
description: "Field Lampiran dan Collection File mengupload file melalui HTTP API, upload sisi server (S3/OSS/COS), upload langsung sisi klien, mendukung autentikasi JWT dan penentuan storage engine."
keywords: "HTTP API upload file,attachments create,upload sisi server,upload langsung sisi klien,NocoBase"
---

# HTTP API

Upload file Field Lampiran dan Collection File mendukung pemrosesan melalui HTTP API. Berdasarkan storage engine berbeda yang digunakan oleh field lampiran atau Collection File, ada cara pemanggilan yang berbeda.

## Upload Sisi Server

Untuk storage engine open-source bawaan dalam proyek seperti S3, OSS, COS, dan lainnya, HTTP API sama dengan fungsi upload antarmuka pengguna, file diupload melalui server. Pemanggilan endpoint perlu meneruskan token JWT berbasis login pengguna melalui header request `Authorization`, atau akan ditolak aksesnya.

### Field Lampiran

Lakukan operasi `create` ke resource Collection lampiran (`attachments`), kirim request dalam bentuk POST, dan upload konten biner melalui field `file`. Setelah dipanggil, file akan diupload ke storage engine default.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

Jika perlu mengupload file ke storage engine berbeda, dapat ditentukan storage engine yang sudah dikonfigurasi pada field Collection terkait melalui parameter `attachmentField` (jika tidak dikonfigurasi, akan diupload ke storage engine default).

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### Collection File

Upload ke Collection File akan otomatis menghasilkan record file. Lakukan operasi `create` ke resource Collection File, kirim request dalam bentuk POST, dan upload konten biner melalui field `file`.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

Upload ke Collection File tidak perlu menentukan storage engine, file akan diupload ke storage engine yang dikonfigurasi pada Collection tersebut.

## Upload Sisi Klien

Untuk storage engine yang kompatibel S3 yang disediakan oleh plugin komersial S3-Pro, upload HTTP API perlu dipanggil dalam beberapa langkah.

### Field Lampiran

1.  Mendapatkan informasi storage engine

    Lakukan operasi `getBasicInfo` pada Collection storage (`storages`), sambil membawa identifier storage space (storage name), untuk meminta informasi konfigurasi storage engine

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

2.  Mendapatkan informasi pre-signed dari penyedia layanan

    Lakukan operasi `createPresignedUrl` pada resource `fileStorageS3`, kirim request dalam bentuk POST, dan bawa informasi terkait file dalam body, untuk mendapatkan informasi upload pre-signed

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
    > * name: Nama file
    > * size: Ukuran file (dalam bytes)
    > * type: Tipe MIME file, dapat merujuk ke: [Tipe MIME Umum](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/MIME_types/Common_types)
    > * storageId: id storage engine (field `id` yang dikembalikan pada langkah pertama)
    > * storageType: Tipe storage engine (field `type` yang dikembalikan pada langkah pertama)
    > 
    > Contoh data request:
    > 
    > ```
    > --data-raw '{"name":"a.png","size":4405,"type":"image/png","storageId":2,"storageType":"s3-compatible"}'
    > ```

    Struktur data informasi pre-signed yang didapatkan sebagai berikut

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

    Gunakan `putUrl` yang dikembalikan untuk melakukan request `PUT`, mengupload file sebagai body.

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```
    > Penjelasan:
    > * putUrl: Field `putUrl` yang dikembalikan pada langkah sebelumnya
    > * file_path: Path file lokal yang akan diupload
    > 
    > Contoh data request:
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  Membuat Record Baris File

    Setelah upload berhasil, lakukan operasi `create` pada resource Collection lampiran (`attachments`), kirim request dalam bentuk POST, untuk membuat record file.

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > Penjelasan data dependency dalam data-raw:
    > * title: Field `fileInfo.title` yang dikembalikan pada langkah sebelumnya
    > * filename: Field `fileInfo.key` yang dikembalikan pada langkah sebelumnya
    > * extname: Field `fileInfo.extname` yang dikembalikan pada langkah sebelumnya
    > * path: Default kosong
    > * size: Field `fileInfo.size` yang dikembalikan pada langkah sebelumnya
    > * url: Default kosong
    > * mimetype: Field `fileInfo.mimetype` yang dikembalikan pada langkah sebelumnya
    > * meta: Field `fileInfo.meta` yang dikembalikan pada langkah sebelumnya
    > * storageId: Field `id` yang dikembalikan pada langkah pertama
    > 
    > Contoh data request:
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### Collection File

Tiga langkah pertama sama dengan upload field lampiran, tetapi pada langkah keempat perlu membuat record file. Lakukan operasi create pada resource Collection File, kirim request dalam bentuk POST, dan upload informasi file melalui body.

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> Penjelasan data dependency dalam data-raw:
> * title: Field `fileInfo.title` yang dikembalikan pada langkah sebelumnya
> * filename: Field `fileInfo.key` yang dikembalikan pada langkah sebelumnya
> * extname: Field `fileInfo.extname` yang dikembalikan pada langkah sebelumnya
> * path: Default kosong
> * size: Field `fileInfo.size` yang dikembalikan pada langkah sebelumnya
> * url: Default kosong
> * mimetype: Field `fileInfo.mimetype` yang dikembalikan pada langkah sebelumnya
> * meta: Field `fileInfo.meta` yang dikembalikan pada langkah sebelumnya
> * storageId: Field `id` yang dikembalikan pada langkah pertama
> 
> Contoh data request:
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```
