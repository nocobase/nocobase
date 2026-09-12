---
title: "HTTP API Manajer File"
description: "Field lampiran dan tabel file mengunggah file melalui HTTP API, unggah sisi server (S3/OSS/COS), unggah langsung sisi klien, mendukung autentikasi JWT dan penentuan mesin penyimpanan."
keywords: "unggah file HTTP API,attachments create,unggah sisi server,unggah langsung sisi klien,NocoBase"
---
<!-- translation-inline-code: `Authorization` `attachments` `create` `file` `attachmentField` `create` `file` `storages` `getBasicInfo` `fileStorageS3` `createPresignedUrl` `id` `type` `putUrl` `PUT` `putUrl` `attachments` `create` `fileInfo.title` `fileInfo.key` `fileInfo.extname` `fileInfo.size` `fileInfo.mimetype` `fileInfo.meta` `id` `fileInfo.title` `fileInfo.key` `fileInfo.extname` `fileInfo.size` `fileInfo.mimetype` `fileInfo.meta` `id` -->

# HTTP API

Unggah file untuk field lampiran dan tabel file dapat diproses melalui HTTP API. Bergantung pada mesin penyimpanan yang digunakan oleh lampiran atau tabel file, terdapat metode pemanggilan yang berbeda.

## Unggah sisi server

Untuk mesin penyimpanan sumber terbuka bawaan seperti S3, OSS, dan COS, HTTP API menggunakan fungsi unggah yang sama dengan antarmuka pengguna, dan semua file diunggah melalui server. Pemanggilan antarmuka harus meneruskan token JWT berbasis login pengguna melalui header permintaan , jika tidak, akses akan ditolak.

### Field lampiran

Kirim operasi  ke resource tabel lampiran (), kirim permintaan dalam bentuk POST, dan unggah konten biner melalui field file. Setelah dipanggil, file akan diunggah ke mesin penyimpanan default.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

Jika perlu mengunggah file ke mesin penyimpanan yang berbeda, Anda dapat menentukan mesin penyimpanan yang telah dikonfigurasi untuk field tabel data terkait melalui parameter attachmentField (jika tidak dikonfigurasi, file diunggah ke mesin penyimpanan default).

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### Tabel file

Unggahan ke tabel file akan otomatis membuat catatan file. Kirim operasi  ke resource tabel file, kirim permintaan dalam bentuk POST, dan unggah konten biner melalui field file.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

Untuk unggahan ke tabel file, mesin penyimpanan tidak perlu ditentukan; file akan diunggah ke mesin penyimpanan yang dikonfigurasi untuk tabel tersebut.

## Unggah sisi klien

Untuk mesin penyimpanan kompatibel S3 yang disediakan melalui plugin komersial S3-Pro, unggahan HTTP API perlu dilakukan dalam beberapa langkah.

### Field lampiran

1.  Memperoleh informasi mesin penyimpanan

    Kirim operasi getBasicInfo ke tabel penyimpanan (storages), sekaligus sertakan identitas ruang penyimpanan (storage name), untuk meminta informasi konfigurasi mesin penyimpanan

    ```shell
    curl 'http://localhost:13000/api/storages:getBasicInfo/<storage_name>' \
      -H 'Authorization: Bearer <JWT>'
    ```

    Contoh informasi konfigurasi mesin penyimpanan yang dikembalikan:

    ```json
    {
      "id": 2,
      "title": "xxx",
      "name": "xxx",
      "type": "s3-compatible",
      "rules": { ... }
    }
    ```

2.  Memperoleh informasi prapenandatanganan penyedia layanan

    Kirim operasi createPresignedUrl ke resource fileStorageS3, kirim permintaan dalam bentuk POST, dan sertakan informasi terkait file di body untuk memperoleh informasi unggahan prapenandatanganan

    ```shell
    curl 'http://localhost:13000/api/fileStorageS3:createPresignedUrl' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"name":<name>,"size":<size>,"type":<type>,"storageId":<storageId>,"storageType":<storageType>}'
    ```

    > Keterangan:
    >
    > * name: Nama file
    > * size: Ukuran file (dalam bytes)
    > * type: Tipe MIME file, dapat merujuk ke: [Tipe MIME umum](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/MIME_types/Common_types)
    > * storageId: id mesin penyimpanan (field  yang dikembalikan pada langkah pertama)
    > * storageType: Tipe mesin penyimpanan (field type yang dikembalikan pada langkah pertama)
    >
    > Contoh data permintaan:
    >
    > ```
    > --data-raw '{"name":"a.png","size":4405,"type":"image/png","storageId":2,"storageType":"s3-compatible"}'
    > ```

    Struktur data informasi prapenandatanganan yang diperoleh adalah sebagai berikut

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

3.  Unggah file

    Gunakan putUrl yang dikembalikan untuk mengirim permintaan PUT, lalu unggah file sebagai body.

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```
    > Keterangan:
    > * putUrl：Field putUrl yang dikembalikan pada langkah sebelumnya
    > * file_path：Jalur file lokal yang perlu diunggah
    >
    > Contoh data permintaan:
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  Membuat catatan baris file

    Setelah unggahan berhasil, kirim operasi create ke resource tabel lampiran (attachments), kirim permintaan dalam bentuk POST, untuk membuat catatan file.

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > Keterangan data dependen dalam data-raw:
    > * title: Field  yang dikembalikan pada langkah sebelumnya
    > * filename: Field  yang dikembalikan pada langkah sebelumnya
    > * extname: Field  yang dikembalikan pada langkah sebelumnya
    > * path: Kosong secara default
    > * size: Field  yang dikembalikan pada langkah sebelumnya
    > * url: Kosong secara default
    > * mimetype: Field  yang dikembalikan pada langkah sebelumnya
    > * meta: Field  yang dikembalikan pada langkah sebelumnya
    > * storageId: Field  yang dikembalikan pada langkah pertama
    >
    > Contoh data permintaan:
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### Tabel file

Tiga langkah pertama sama dengan unggahan field lampiran, tetapi pada langkah keempat perlu membuat catatan file. Kirim operasi create ke resource tabel file, kirim permintaan dalam bentuk POST, dan unggah informasi file melalui body.

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> Keterangan data dependen dalam data-raw:
> * title: Field fileInfo.title yang dikembalikan pada langkah sebelumnya
> * filename: Field fileInfo.key yang dikembalikan pada langkah sebelumnya
> * extname: Field fileInfo.extname yang dikembalikan pada langkah sebelumnya
> * path: Kosong secara default
> * size: Field fileInfo.size yang dikembalikan pada langkah sebelumnya
> * url: Kosong secara default
> * mimetype: Field fileInfo.mimetype yang dikembalikan pada langkah sebelumnya
> * meta: Field fileInfo.meta yang dikembalikan pada langkah sebelumnya
> * storageId: Field id yang dikembalikan pada langkah pertama
>
> Contoh data permintaan:
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```