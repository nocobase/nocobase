:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# HTTP API

Unggahan berkas untuk bidang lampiran dan koleksi berkas didukung melalui HTTP API. Metode pemanggilan berbeda-beda tergantung pada mesin penyimpanan yang digunakan oleh bidang lampiran atau koleksi berkas.

## Unggahan Sisi Server

Untuk mesin penyimpanan sumber terbuka bawaan dalam proyek, seperti S3, OSS, dan COS, panggilan HTTP API sama dengan fungsi unggah antarmuka pengguna, dan berkas diunggah melalui server. Memanggil API memerlukan pengiriman token JWT berbasis login pengguna melalui header permintaan `Authorization`; jika tidak, akses akan ditolak.

### Bidang Lampiran

Lakukan operasi `create` pada sumber daya lampiran (`attachments`), kirim permintaan POST, dan unggah konten biner melalui bidang `file`. Setelah panggilan, berkas akan diunggah ke mesin penyimpanan bawaan.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

Untuk mengunggah berkas ke mesin penyimpanan yang berbeda, Anda dapat menggunakan parameter `attachmentField` untuk menentukan mesin penyimpanan yang telah dikonfigurasi untuk bidang koleksi (jika tidak dikonfigurasi, berkas akan diunggah ke mesin penyimpanan bawaan).

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### Koleksi Berkas

Mengunggah ke koleksi berkas akan secara otomatis membuat catatan berkas. Lakukan operasi `create` pada sumber daya koleksi berkas, kirim permintaan POST, dan unggah konten biner melalui bidang `file`.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

Saat mengunggah ke koleksi berkas, tidak perlu menentukan mesin penyimpanan; berkas akan diunggah ke mesin penyimpanan yang dikonfigurasi untuk koleksi tersebut.

## Unggahan Sisi Klien

Untuk mesin penyimpanan yang kompatibel dengan S3 yang disediakan melalui plugin komersial S3-Pro, unggahan HTTP API perlu dipanggil dalam beberapa langkah.

### Bidang Lampiran

1.  Dapatkan Informasi Mesin Penyimpanan

    Lakukan operasi `getBasicInfo` pada koleksi penyimpanan (`storages`), sertakan nama penyimpanan, untuk meminta informasi konfigurasi mesin penyimpanan.

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

2.  Dapatkan Informasi Pra-tanda Tangan dari Penyedia Layanan

    Lakukan operasi `createPresignedUrl` pada sumber daya `fileStorageS3`, kirim permintaan POST, dan sertakan informasi terkait berkas dalam *body* untuk mendapatkan informasi unggahan pra-tanda tangan.

    ```shell
    curl 'http://localhost:13000/api/fileStorageS3:createPresignedUrl' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"name":<name>,"size":<size>,"type":<type>,"storageId":<storageId>,"storageType":<storageType>}'
    ```

    > Catatan:
    > * name: Nama berkas
    > * size: Ukuran berkas (dalam byte)
    > * type: Tipe MIME berkas. Anda dapat merujuk ke: [Tipe MIME Umum](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/MIME_types/Common_types)
    > * storageId: ID mesin penyimpanan (bidang `id` yang dikembalikan pada langkah pertama)
    > * storageType: Tipe mesin penyimpanan (bidang `type` yang dikembalikan pada langkah pertama)
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

3.  Unggah Berkas

    Gunakan `putUrl` yang dikembalikan untuk melakukan permintaan `PUT` dan unggah berkas sebagai *body*.

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```
    > Catatan:
    > * putUrl: Bidang `putUrl` yang dikembalikan pada langkah sebelumnya
    > * file_path: Jalur lokal berkas yang akan diunggah
    >
    > Contoh data permintaan:
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  Buat Catatan Berkas

    Setelah unggahan berhasil, lakukan operasi `create` pada sumber daya lampiran (`attachments`) dengan mengirimkan permintaan POST untuk membuat catatan berkas.

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > Penjelasan data yang bergantung pada `data-raw`:
    > * title: Bidang `fileInfo.title` yang dikembalikan pada langkah sebelumnya
    > * filename: Bidang `fileInfo.key` yang dikembalikan pada langkah sebelumnya
    > * extname: Bidang `fileInfo.extname` yang dikembalikan pada langkah sebelumnya
    > * path: Kosong secara bawaan
    > * size: Bidang `fileInfo.size` yang dikembalikan pada langkah sebelumnya
    > * url: Kosong secara bawaan
    > * mimetype: Bidang `fileInfo.mimetype` yang dikembalikan pada langkah sebelumnya
    > * meta: Bidang `fileInfo.meta` yang dikembalikan pada langkah sebelumnya
    > * storageId: Bidang `id` yang dikembalikan pada langkah pertama
    >
    > Contoh data permintaan:
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### Koleksi Berkas

Tiga langkah pertama sama dengan unggahan bidang lampiran, tetapi pada langkah keempat, Anda perlu membuat catatan berkas dengan melakukan operasi `create` pada sumber daya koleksi berkas, mengirimkan permintaan POST, dan mengunggah informasi berkas melalui *body*.

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> Penjelasan data yang bergantung pada `data-raw`:
> * title: Bidang `fileInfo.title` yang dikembalikan pada langkah sebelumnya
> * filename: Bidang `fileInfo.key` yang dikembalikan pada langkah sebelumnya
> * extname: Bidang `fileInfo.extname` yang dikembalikan pada langkah sebelumnya
> * path: Kosong secara bawaan
> * size: Bidang `fileInfo.size` yang dikembalikan pada langkah sebelumnya
> * url: Kosong secara bawaan
> * mimetype: Bidang `fileInfo.mimetype` yang dikembalikan pada langkah sebelumnya
> * meta: Bidang `fileInfo.meta` yang dikembalikan pada langkah sebelumnya
> * storageId: Bidang `id` yang dikembalikan pada langkah pertama
>
> Contoh data permintaan:
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```