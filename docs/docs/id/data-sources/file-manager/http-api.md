:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# HTTP API

Unggahan berkas untuk kolom lampiran dan koleksi berkas dapat ditangani melalui HTTP API. Cara pemanggilan berbeda-beda tergantung pada mesin penyimpanan yang digunakan oleh lampiran atau koleksi berkas.

## Unggahan Sisi Server

Untuk mesin penyimpanan sumber terbuka bawaan seperti S3, OSS, dan COS, panggilan HTTP API sama dengan fitur unggahan antarmuka pengguna, di mana berkas diunggah melalui server. Panggilan API memerlukan token JWT berbasis pengguna yang diteruskan dalam header permintaan `Authorization`; jika tidak, akses akan ditolak.

### Kolom Lampiran

Mulai tindakan `create` pada sumber daya lampiran (`attachments`) dengan mengirimkan permintaan POST dan mengunggah konten biner melalui kolom `file`. Setelah panggilan, berkas akan diunggah ke mesin penyimpanan bawaan.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

Untuk mengunggah berkas ke mesin penyimpanan yang berbeda, Anda dapat menggunakan parameter `attachmentField` untuk menentukan mesin penyimpanan yang dikonfigurasi untuk kolom koleksi. Jika tidak dikonfigurasi, berkas akan diunggah ke mesin penyimpanan bawaan.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### koleksi Berkas

Mengunggah ke koleksi berkas akan secara otomatis membuat catatan berkas. Mulai tindakan `create` pada sumber daya koleksi berkas dengan mengirimkan permintaan POST dan mengunggah konten biner melalui kolom `file`.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

Saat mengunggah ke koleksi berkas, tidak perlu menentukan mesin penyimpanan; berkas akan diunggah ke mesin penyimpanan yang dikonfigurasi untuk koleksi tersebut.

## Unggahan Sisi Klien

Untuk mesin penyimpanan yang kompatibel dengan S3 yang disediakan melalui plugin S3-Pro komersial, unggahan HTTP API memerlukan beberapa langkah.

### Kolom Lampiran

1.  Dapatkan informasi mesin penyimpanan

    Mulai tindakan `getBasicInfo` pada koleksi penyimpanan (`storages`), termasuk nama penyimpanan, untuk meminta informasi konfigurasi mesin penyimpanan.

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

2.  Dapatkan URL pra-tanda tangan dari penyedia layanan

    Mulai tindakan `createPresignedUrl` pada sumber daya `fileStorageS3` dengan mengirimkan permintaan POST yang membawa informasi terkait berkas di dalam body untuk mendapatkan informasi unggahan pra-tanda tangan.

    ```shell
    curl 'http://localhost:13000/api/fileStorageS3:createPresignedUrl' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"name":<name>,"size":<size>,"type":<type>,"storageId":<storageId>,"storageType":<storageType>}'
    ```

    > Catatan:
    >
    > *   `name`: Nama berkas
    > *   `size`: Ukuran berkas (dalam byte)
    > *   `type`: Tipe MIME berkas. Anda dapat merujuk ke [Tipe MIME Umum](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/MIME_types/Common_types)
    > *   `storageId`: ID mesin penyimpanan (kolom `id` yang dikembalikan pada langkah 1).
    > *   `storageType`: Tipe mesin penyimpanan (kolom `type` yang dikembalikan pada langkah 1).
    >
    > Contoh data permintaan:
    >
    > ```
    > --data-raw '{"name":"a.png","size":4405,"type":"image/png","storageId":2,"storageType":"s3-compatible"}'
    > ```

    Struktur data informasi pra-tanda tangan yang diperoleh adalah sebagai berikut:

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

3.  Unggah berkas

    Gunakan `putUrl` yang dikembalikan untuk membuat permintaan `PUT`, mengunggah berkas sebagai body.

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```

    > Catatan:
    >
    > *   `putUrl`: Kolom `putUrl` yang dikembalikan pada langkah sebelumnya.
    > *   `file_path`: Jalur lokal berkas yang akan diunggah.
    >
    > Contoh data permintaan:
    >
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  Buat catatan berkas

    Setelah unggahan berhasil, buat catatan berkas dengan memulai tindakan `create` pada sumber daya lampiran (`attachments`) dengan permintaan POST.

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > Penjelasan data dependen dalam `data-raw`:
    >
    > *   `title`: Kolom `fileInfo.title` yang dikembalikan pada langkah sebelumnya.
    > *   `filename`: Kolom `fileInfo.key` yang dikembalikan pada langkah sebelumnya.
    > *   `extname`: Kolom `fileInfo.extname` yang dikembalikan pada langkah sebelumnya.
    > *   `path`: Kosong secara bawaan.
    > *   `size`: Kolom `fileInfo.size` yang dikembalikan pada langkah sebelumnya.
    > *   `url`: Kosong secara bawaan.
    > *   `mimetype`: Kolom `fileInfo.mimetype` yang dikembalikan pada langkah sebelumnya.
    > *   `meta`: Kolom `fileInfo.meta` yang dikembalikan pada langkah sebelumnya.
    > *   `storageId`: Kolom `id` yang dikembalikan pada langkah 1.
    >
    > Contoh data permintaan:
    >
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### koleksi Berkas

Tiga langkah pertama sama dengan unggahan ke kolom lampiran. Namun, pada langkah keempat, Anda perlu membuat catatan berkas dengan memulai tindakan `create` pada sumber daya koleksi berkas dengan permintaan POST, mengunggah informasi berkas di dalam body.

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> Penjelasan data dependen dalam `data-raw`:
>
> *   `title`: Kolom `fileInfo.title` yang dikembalikan pada langkah sebelumnya.
> *   `filename`: Kolom `fileInfo.key` yang dikembalikan pada langkah sebelumnya.
> *   `extname`: Kolom `fileInfo.extname` yang dikembalikan pada langkah sebelumnya.
> *   `path`: Kosong secara bawaan.
> *   `size`: Kolom `fileInfo.size` yang dikembalikan pada langkah sebelumnya.
> *   `url`: Kosong secara bawaan.
> *   `mimetype`: Kolom `fileInfo.mimetype` yang dikembalikan pada langkah sebelumnya.
> *   `meta`: Kolom `fileInfo.meta` yang dikembalikan pada langkah sebelumnya.
> *   `storageId`: Kolom `id` yang dikembalikan pada langkah 1.
>
> Contoh data permintaan:
>
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```