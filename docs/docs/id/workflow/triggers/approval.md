---
pkg: '@nocobase/plugin-workflow-approval'
title: "Persetujuan"
description: "Trigger persetujuan: bekerja dengan alur persetujuan, persetujuan diinisiasi manual, picu Workflow lanjutan saat persetujuan disetujui/ditolak, mewujudkan otomasi berbasis persetujuan."
keywords: "Workflow,Trigger persetujuan,Approval,alur persetujuan,persetujuan manual,NocoBase"
---
# Persetujuan

## Pengantar

Persetujuan adalah bentuk alur khusus yang diinisiasi manual dan diproses manual untuk menentukan status data terkait. Biasanya digunakan untuk otomatisasi kantor atau manajemen alur urusan keputusan manual lainnya, misalnya dapat membuat dan mengelola alur manual untuk skenario seperti "Permohonan Cuti", "Persetujuan Reimburse Biaya", dan "Persetujuan Pembelian Bahan Baku".

Plugin persetujuan menyediakan tipe Workflow khusus (Trigger) "Persetujuan (Event)" dan Node "Persetujuan" khusus untuk alur ini. Dikombinasikan dengan tabel data kustom dan Block kustom yang khas dari NocoBase, dapat dengan cepat dan fleksibel membuat dan mengelola berbagai skenario persetujuan.

## Membuat Alur

Saat membuat Workflow, pilih tipe "Persetujuan", maka dapat membuat alur persetujuan:

![Trigger persetujuan_buat alur persetujuan](https://static-docs.nocobase.com/f52dda854f46a669e0c1c7fb487a17ea.png)

Kemudian pada antarmuka konfigurasi Workflow, klik Trigger untuk membuka dialog dan melakukan konfigurasi lebih lanjut.

## Konfigurasi Trigger

![20251226102619](https://static-docs.nocobase.com/20251226102619.png)

### Ikat Tabel Data

Plugin persetujuan NocoBase berdasarkan desain fleksibel, dapat digunakan dengan tabel data kustom apa pun, yaitu konfigurasi persetujuan tidak perlu mengonfigurasi ulang model data, tetapi langsung menggunakan kembali tabel data yang sudah dibuat. Jadi setelah masuk ke konfigurasi Trigger, pertama Anda perlu memilih tabel data, untuk menentukan terhadap data tabel data mana alur ini melakukan persetujuan:

![Trigger persetujuan_konfigurasi Trigger_pilih tabel data](https://static-docs.nocobase.com/20251226103223.png)

### Cara Pemicuan

Saat menginisiasi persetujuan untuk data bisnis, dapat memilih dua cara pemicuan berikut:

*   **Sebelum Penyimpanan Data**

    Menginisiasi persetujuan sebelum data yang dikirim disimpan, cocok untuk skenario di mana data baru disimpan setelah persetujuan disetujui. Pada mode ini, data saat persetujuan diinisiasi hanya data sementara, hanya akan disimpan secara resmi ke tabel data yang sesuai setelah persetujuan disetujui.

*   **Setelah Penyimpanan Data**

    Menginisiasi persetujuan setelah data yang dikirim disimpan, cocok untuk skenario di mana data dapat disimpan terlebih dahulu, baru dilakukan persetujuan. Pada mode ini, data saat persetujuan diinisiasi sudah disimpan ke tabel data yang sesuai, modifikasi terhadapnya selama proses persetujuan juga akan disimpan.

### Lokasi Inisiasi Persetujuan

Anda dapat memilih lokasi inisiasi persetujuan dalam sistem:

*   **Hanya Inisiasi di Block Data**

    Anda dapat mengikat operasi Block formulir tabel ini ke Workflow ini untuk menginisiasi persetujuan, dan memproses serta melacak proses persetujuan di Block persetujuan single data. Biasanya cocok untuk data bisnis.

*   **Inisiasi di Block Data dan Pusat Tugas**

    Selain Block data, juga dapat menginisiasi dan memproses persetujuan di Pusat Tugas global, biasanya cocok untuk data administratif.

### Siapa yang Dapat Menginisiasi Persetujuan

Dapat mengonfigurasi izin berdasarkan lingkup pengguna, menentukan pengguna mana yang dapat menginisiasi persetujuan ini:

*   **Semua Pengguna**

    Semua pengguna dalam sistem dapat menginisiasi persetujuan ini.

*   **Hanya Pengguna yang Dipilih**

    Hanya mengizinkan pengguna dalam lingkup yang ditentukan untuk menginisiasi persetujuan ini, dapat memilih beberapa.

    ![20251226114623](https://static-docs.nocobase.com/20251226114623.png)

### Konfigurasi Antarmuka Formulir Inisiasi Persetujuan

Terakhir perlu mengonfigurasi antarmuka formulir penginisiasi, antarmuka ini akan digunakan untuk operasi pengiriman saat menginisiasi dari Block pusat persetujuan dan saat penginisiasi menarik kembali dan menginisiasi ulang. Klik tombol konfigurasi untuk membuka dialog:

![Trigger persetujuan_konfigurasi Trigger_formulir penginisiasi](https://static-docs.nocobase.com/20251226130239.png)

Anda dapat menambahkan formulir pengisian berbasis tabel data yang diikat untuk antarmuka penginisiasi, atau teks penjelasan untuk tip dan panduan (Markdown). Di mana formulir wajib ditambahkan, jika tidak penginisiasi tidak akan dapat melakukan operasi setelah masuk ke antarmuka tersebut.

Setelah menambahkan Block formulir, sama dengan antarmuka konfigurasi formulir biasa, dapat menambahkan komponen field tabel data yang sesuai, dan dapat diatur dengan bebas untuk mengorganisir konten yang perlu diisi formulir:

![Trigger persetujuan_konfigurasi Trigger_formulir penginisiasi_konfigurasi field](https://static-docs.nocobase.com/20251226130339.png)

Berbeda dengan tombol kirim langsung, juga dapat menambahkan tombol operasi "Simpan Draft", untuk mendukung alur pemrosesan penyimpanan sementara:

![Trigger persetujuan_konfigurasi Trigger_formulir penginisiasi_konfigurasi operasi_simpan](https://static-docs.nocobase.com/20251226130512.png)

Jika sebuah alur persetujuan mengizinkan penginisiasi menarik kembali, perlu mengaktifkan tombol "Tarik Kembali" pada konfigurasi antarmuka penginisiasi:

![Trigger persetujuan_konfigurasi Trigger_izinkan tarik kembali](https://static-docs.nocobase.com/20251226130637.png)

Setelah diaktifkan, persetujuan yang diinisiasi alur ini dapat ditarik kembali oleh penginisiasi sebelum penyetuju manapun memproses, tetapi setelah Node persetujuan berikutnya manapun yang dikonfigurasi dengan penyetuju memproses, tidak dapat ditarik kembali lagi.

:::info{title=Tips}
Setelah mengaktifkan atau menghapus tombol tarik kembali, di dialog konfigurasi Trigger, perlu klik simpan untuk mengirim baru dapat berlaku.
:::

### Kartu "Permohonan Saya" <Badge>2.0+</Badge>

Dapat digunakan untuk mengonfigurasi kartu tugas dalam daftar "Permohonan Saya" pusat tugas.

![20260213005957](https://static-docs.nocobase.com/20260213005957.png)

Pada kartu dapat dengan bebas mengonfigurasi field bisnis (kecuali field relasi) yang ingin ditampilkan, atau informasi terkait persetujuan.

Setelah permohonan persetujuan dibuat, daftar pusat tugas dapat melihat kartu tugas kustom:

![20260213010228](https://static-docs.nocobase.com/20260213010228.png)

### Mode Tampilan Record dalam Alur

*   **Snapshot**

    Pada alur persetujuan, status record yang dilihat pemohon dan penyetuju saat masuk, dan setelah dikirim hanya dapat melihat record yang dimodifikasi sendiri—tidak akan melihat pembaruan yang dilakukan orang lain setelahnya.

*   **Terbaru**

    Pada alur persetujuan, pemohon dan penyetuju selalu melihat versi terbaru record di sepanjang alur, terlepas dari status record sebelum mereka mengoperasikan. Setelah alur berakhir, mereka akan melihat versi akhir record.

## Node Persetujuan

Pada alur kerja persetujuan, perlu menggunakan Node "Persetujuan" khusus untuk mengonfigurasi logika operasi pemrosesan (setujui, tolak, atau kembalikan) persetujuan yang diinisiasi untuk penyetuju. Node "Persetujuan" juga hanya dapat digunakan dalam alur persetujuan. Lihat [Node Persetujuan](../nodes/approval.md) untuk detailnya.

:::info{title=Tips}
Jika sebuah alur persetujuan tidak memiliki Node "Persetujuan" sama sekali, alur tersebut akan otomatis disetujui.
:::

## Konfigurasi Inisiasi Persetujuan

Setelah mengonfigurasi alur persetujuan dan mengaktifkan, Anda dapat mengikat alur ini pada tombol kirim formulir tabel data yang sesuai, untuk pengguna menginisiasi persetujuan saat mengirim:

![Inisiasi persetujuan_ikat Workflow](https://static-docs.nocobase.com/20251226110710.png)

Setelah itu pengiriman pengguna terhadap formulir tersebut akan memicu alur persetujuan yang sesuai. Selain disimpan ke tabel data yang sesuai, data yang dikirim juga akan di-snapshot ke alur persetujuan, untuk dilihat dan digunakan oleh penyetuju berikutnya.

:::info{title=Tips}
Tombol untuk menginisiasi persetujuan saat ini hanya mendukung penggunaan tombol "Kirim" (atau "Simpan") dalam formulir tambah atau perbarui, tidak mendukung penggunaan tombol "Picu Workflow" (tombol tersebut hanya dapat diikat dengan "Event Action Kustom").
:::

## Pusat Tugas

Pusat Tugas menyediakan pintu masuk yang terpadu, memudahkan pengguna melihat dan memproses tugas yang harus dilakukan. Persetujuan yang diinisiasi pengguna saat ini dan tugas yang harus dilakukan semuanya dapat dimasuki melalui Pusat Tugas di bilah alat atas, dan melihat tipe tugas yang berbeda melalui navigasi kategori di sebelah kiri.

![20250310161203](https://static-docs.nocobase.com/20250310161203.png)

### Diinisiasi Saya

#### Lihat Persetujuan yang Sudah Diinisiasi

![20250310161609](https://static-docs.nocobase.com/20250310161609.png)

#### Inisiasi Persetujuan Baru Langsung

![20250310161658](https://static-docs.nocobase.com/20250310161658.png)

### Tugas Saya

#### Daftar Tugas

![20250310161934](https://static-docs.nocobase.com/20250310161934.png)

#### Detail Tugas

![20250310162111](https://static-docs.nocobase.com/20250310162111.png)

## HTTP API

### Penginisiasi

#### Inisiasi dari Tabel Data

Inisiasi dari Block data, semua dapat dipanggil seperti ini (contoh tombol buat tabel `posts`):

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

Di mana parameter URL `triggerWorkflows` adalah key Workflow, beberapa Workflow dipisahkan dengan koma. Key tersebut dapat diperoleh dengan hover mouse di nama Workflow di bagian atas kanvas Workflow:

![Workflow_key_cara melihat](https://static-docs.nocobase.com/20240426135108.png)

Setelah panggilan sukses, akan memicu alur persetujuan tabel `posts` yang sesuai.

:::info{title="Tips"}
Karena panggilan eksternal juga perlu berbasis identitas pengguna, jadi saat memanggil melalui API HTTP, sama dengan request yang dikirim antarmuka biasa, perlu menyediakan informasi autentikasi, termasuk request header `Authorization` atau parameter `token` (token yang diperoleh saat login), serta request header `X-Role` (nama peran pengguna saat ini).
:::

Jika perlu memicu event data relasi to-one (to-many belum didukung) dalam operasi tersebut, dapat menggunakan `!` dalam parameter untuk menentukan data pemicu field relasi:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post.",
    "category": {
      "title": "Test category"
    }
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey!category"
```

Setelah panggilan di atas sukses, akan memicu event persetujuan tabel `categories` yang sesuai.

:::info{title="Tips"}
Saat memicu event setelah action melalui panggilan API HTTP, juga perlu memperhatikan status aktivasi Workflow, dan apakah konfigurasi tabel data cocok, jika tidak mungkin tidak akan terpanggil sukses, atau muncul error.
:::

#### Inisiasi dari Pusat Persetujuan

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "collectionName": "<collection name>",
    "workflowId": <workflow id>,
    "data": { "<field>": "<value>" },
    "status": <initial approval status>,
  }'
  "http://localhost:3000/api/approvals:create"
```

**Parameter**

* `collectionName`: nama tabel data target inisiasi persetujuan, wajib.
* `workflowId`: ID Workflow yang digunakan untuk inisiasi persetujuan, wajib.
* `data`: field record tabel data yang dibuat saat inisiasi persetujuan, wajib.
* `status`: status record yang dibuat saat inisiasi persetujuan, wajib. Nilai opsional meliputi:
  * `0`: draft, menyatakan disimpan tetapi tidak mengirim persetujuan.
  * `2`: kirim persetujuan, menyatakan penginisiasi mengirim permohonan persetujuan, masuk ke persetujuan.

#### Simpan dan Kirim

Ketika persetujuan yang diinisiasi (atau ditarik kembali) berada dalam status draft, dapat menyimpan atau mengirim ulang melalui interface berikut:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "data": { "<field>": "<value>" },
    "status": 2
  }'
  "http://localhost:3000/api/approvals:update/<approval id>"
```

#### Dapatkan Daftar Persetujuan yang Sudah Diinisiasi

```bash
curl -X GET -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/approvals:listMine"
```

#### Tarik Kembali

Penginisiasi dapat menarik kembali record yang sedang dalam persetujuan melalui interface berikut:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  "http://localhost:3000/api/approvals:withdraw/<approval id>"
```

**Parameter**

* `<approval id>`: ID record persetujuan yang akan ditarik kembali, wajib.

### Penyetuju

Setelah alur persetujuan masuk ke Node persetujuan, akan dibuat tugas yang harus dilakukan untuk penyetuju saat ini. Penyetuju dapat menyelesaikan tugas persetujuan melalui operasi antarmuka, juga dapat menyelesaikan melalui panggilan API HTTP.

#### Dapatkan Record Pemrosesan Persetujuan

Tugas yang harus dilakukan adalah record pemrosesan persetujuan, dapat melalui interface berikut untuk mendapatkan semua record pemrosesan persetujuan pengguna saat ini:

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:listMine"
```

Di mana `approvalRecords` sebagai resource tabel data, juga dapat menggunakan kondisi kueri umum, seperti `filter`, `sort`, `pageSize`, dan `page`, dll.

#### Dapatkan Single Record Pemrosesan Persetujuan

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:get/<record id>"
```

#### Setujui dan Tolak

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "status": 2,
    "comment": "Looks good to me.",
    "data": { "<field to modify>": "<value>" }
  }'
  "http://localhost:3000/api/approvalRecords:submit/<record id>"
```

**Parameter**

* `<record id>`: ID record yang akan diproses persetujuannya, wajib.
* `status`: field adalah status pemrosesan persetujuan, `2` artinya "Setujui", `-1` artinya "Tolak", wajib.
* `comment`: informasi catatan pemrosesan persetujuan, opsional.
* `data`: menyatakan modifikasi terhadap record tabel data tempat Node persetujuan saat ini berada setelah persetujuan disetujui, opsional (hanya valid saat disetujui).

#### Kembalikan <Badge>v1.9.0+</Badge>

Sebelum versi v1.9.0, kembalikan menggunakan interface yang sama dengan "Setujui" dan "Tolak", menggunakan `"status": 1` untuk merepresentasikan kembalikan.

Mulai versi v1.9.0, kembalikan memiliki interface terpisah:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "returnToNodeKey": "<node key>",
  }'
  "http://localhost:3000/api/approvalRecords:return/<record id>"
```

**Parameter**

* `<record id>`: ID record yang akan diproses persetujuannya, wajib.
* `returnToNodeKey`: key Node target kembalikan, opsional. Ketika dalam Node dikonfigurasi lingkup Node yang dapat dikembalikan, dapat menggunakan parameter ini untuk menentukan dikembalikan ke Node mana. Pada kondisi tidak dikonfigurasi, parameter ini tidak perlu dimasukkan, secara default akan dikembalikan ke titik awal, oleh penginisiasi mengirim ulang.

#### Pemindahan Tanda Tangan

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignee": <user id>,
  }'
  "http://localhost:3000/api/approvalRecords:delegate/<record id>"
```

**Parameter**

* `<record id>`: ID record yang akan diproses persetujuannya, wajib.
* `assignee`: ID pengguna yang dipindahkan tanda tangan, wajib.

#### Penambahan Tanda Tangan

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignees": [<user id>],
    "order": <order>,
  }'
  "http://localhost:3000/api/approvalRecords:add/<record id>"
```

**Parameter**

* `<record id>`: ID record yang akan diproses persetujuannya, wajib.
* `assignees`: daftar ID pengguna yang ditambahkan tanda tangan, wajib.
* `order`: urutan penambahan tanda tangan, `-1` menandai sebelum "saya", `1` menandai setelah "saya".
