---
pkg: '@nocobase/plugin-workflow-approval'
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Persetujuan

## Pendahuluan

Persetujuan adalah bentuk alur kerja yang dirancang khusus untuk dimulai dan diproses secara manual oleh manusia guna memutuskan status data terkait. Umumnya digunakan untuk manajemen alur kerja otomatisasi kantor atau tugas pengambilan keputusan manual lainnya, misalnya Anda dapat membuat dan mengelola alur kerja manual untuk skenario seperti "pengajuan cuti", "persetujuan penggantian biaya", dan "persetujuan pengadaan bahan baku".

**Plugin** Persetujuan menyediakan jenis **alur kerja** (pemicu) khusus "Persetujuan (event)" dan node "Persetujuan" khusus untuk **alur kerja** ini. Dikombinasikan dengan **koleksi** kustom dan blok kustom unik NocoBase, Anda dapat dengan cepat dan fleksibel membuat dan mengelola berbagai skenario persetujuan.

## Membuat Alur Kerja

Saat membuat **alur kerja**, pilih jenis "Persetujuan" untuk membuat **alur kerja** persetujuan:

![Approval Trigger_Create Approval Workflow](https://static-docs.nocobase.com/f52dda854f46a669e0c1c7fb487a17ea.png)

Setelah itu, di antarmuka konfigurasi **alur kerja**, klik pemicu untuk membuka dialog guna konfigurasi lebih lanjut.

## Konfigurasi Pemicu

### Mengikat Koleksi

**Plugin** Persetujuan NocoBase dirancang untuk fleksibilitas dan dapat digunakan dengan **koleksi** kustom apa pun. Ini berarti konfigurasi persetujuan tidak perlu mengonfigurasi ulang model data, melainkan langsung menggunakan kembali **koleksi** yang sudah ada. Oleh karena itu, setelah masuk ke konfigurasi pemicu, pertama-tama Anda perlu memilih **koleksi** untuk menentukan pembuatan atau pembaruan data **koleksi** mana yang akan memicu **alur kerja** ini:

![Approval Trigger_Trigger Configuration_Select Collection](https://static-docs.nocobase.com/8732a4854f46a669e0c1c7fb487a17ea.png)

Kemudian, dalam formulir untuk membuat (atau mengedit) data untuk **koleksi** yang sesuai, ikat **alur kerja** ini ke tombol kirim:

![Initiate Approval_Bind Workflow](https://static-docs.nocobase.com/2872ff108c61d7bf6d0bfb19886774c6.png)

Setelah itu, ketika pengguna mengirimkan formulir ini, **alur kerja** persetujuan yang sesuai akan terpicu. Data yang dikirimkan tidak hanya disimpan di **koleksi** yang sesuai, tetapi juga akan diambil snapshot-nya ke dalam alur persetujuan untuk ditinjau dan digunakan oleh pemberi persetujuan berikutnya.

### Tarik Kembali

Jika sebuah **alur kerja** persetujuan memungkinkan pemrakarsa untuk menariknya kembali, Anda perlu mengaktifkan tombol "Tarik Kembali" dalam konfigurasi antarmuka pemrakarsa:

![Approval Trigger_Trigger Configuration_Allow Withdraw](https://static-docs.nocobase.com/20251029232544.png)

Setelah diaktifkan, persetujuan yang dimulai oleh **alur kerja** ini dapat ditarik kembali oleh pemrakarsa sebelum diproses oleh pemberi persetujuan mana pun. Namun, setelah diproses oleh pemberi persetujuan di node persetujuan berikutnya, persetujuan tersebut tidak dapat lagi ditarik kembali.

:::info{title=Catatan}
Setelah mengaktifkan atau menghapus tombol tarik kembali, Anda perlu mengklik simpan dan kirim di dialog konfigurasi pemicu agar perubahan berlaku.
:::

### Konfigurasi Antarmuka Formulir Pemrakarsa Persetujuan

Terakhir, Anda perlu mengonfigurasi antarmuka formulir pemrakarsa. Antarmuka ini akan digunakan untuk tindakan pengiriman saat memulai dari blok pusat persetujuan dan saat memulai kembali setelah penarikan. Klik tombol konfigurasi untuk membuka dialog:

![Approval Trigger_Trigger Configuration_Initiator Form](https://static-docs.nocobase.com/ca8b7e362d912138cf7d73bb60b37ac1.png)

Anda dapat menambahkan formulir pengisian untuk antarmuka pemrakarsa berdasarkan **koleksi** yang terikat, atau menambahkan teks deskriptif (Markdown) untuk petunjuk dan panduan. Formulir ini wajib ditambahkan; jika tidak, pemrakarsa tidak akan dapat melakukan tindakan apa pun setelah masuk ke antarmuka ini.

Setelah menambahkan blok formulir, sama seperti di antarmuka konfigurasi formulir biasa, Anda dapat menambahkan komponen bidang dari **koleksi** yang sesuai dan mengaturnya sesuai kebutuhan untuk mengatur konten yang akan diisi dalam formulir.

![Approval Trigger_Trigger Configuration_Initiator Form_Field Configuration](https://static-docs.nocobase.com/5a1e7f9c9d8de092c7b55585dad7d633.png)

Selain tombol kirim langsung, Anda juga dapat menambahkan tombol tindakan "Simpan sebagai Draf" untuk mendukung proses penyimpanan sementara:

![Approval Trigger_Trigger Configuration_Initiator Form_Action Configuration](https://static-docs.nocobase.com/2f4850d2078e94538995a9df70d3d2d1.png)

## Node Persetujuan

Dalam **alur kerja** persetujuan, Anda perlu menggunakan node "Persetujuan" khusus untuk mengonfigurasi logika operasional bagi pemberi persetujuan untuk memproses (menyetujui, menolak, atau mengembalikan) persetujuan yang dimulai. Node "Persetujuan" hanya dapat digunakan dalam **alur kerja** persetujuan. Lihat [Node Persetujuan](../nodes/approval.md) untuk detail lebih lanjut.

## Konfigurasi Pemrakarsaan Persetujuan

Setelah mengonfigurasi dan mengaktifkan **alur kerja** persetujuan, Anda dapat mengikatnya ke tombol kirim formulir **koleksi** yang sesuai, memungkinkan pengguna untuk memulai persetujuan saat pengiriman:

![Initiate Approval_Bind Workflow](https://static-docs.nocobase.com/2872ff108c61d7bf6d0bfb19886774c6.png)

Setelah mengikat **alur kerja**, ketika pengguna mengirimkan formulir saat ini, persetujuan akan dimulai.

:::info{title=Catatan}
Saat ini, tombol untuk memulai persetujuan hanya mendukung tombol 'Kirim' (atau 'Simpan') dalam formulir buat atau perbarui. Tombol ini tidak mendukung tombol 'Kirim ke **alur kerja**' (yang hanya dapat diikat ke 'Event setelah tindakan').
:::

## Pusat Tugas

Pusat Tugas menyediakan titik masuk terpadu bagi pengguna untuk melihat dan memproses tugas-tugas mereka. Persetujuan yang dimulai oleh pengguna saat ini dan tugas-tugas yang tertunda dapat diakses melalui Pusat Tugas di bilah alat atas, dan berbagai jenis tugas yang harus dilakukan dapat dilihat melalui navigasi di sebelah kiri.

![20250310161203](https://static-docs.nocobase.com/20250310161203.png)

### Pengajuan Saya

#### Melihat Persetujuan yang Diajukan

![20250310161609](https://static-docs.nocobase.com/20250310161609.png)

#### Langsung Memulai Persetujuan Baru

![20250310161658](https://static-docs.nocobase.com/20250310161658.png)

### Tugas Saya

#### Daftar Tugas

![20250310161934](https://static-docs.nocobase.com/20250310161934.png)

#### Detail Tugas

![20250310162111](https://static-docs.nocobase.com/20250310162111.png)

## API HTTP

### Pemrakarsa

#### Memulai dari Koleksi

Untuk memulai dari blok data, Anda dapat melakukan panggilan seperti ini (menggunakan tombol buat **koleksi** `posts` sebagai contoh):

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

Di sini, parameter URL `triggerWorkflows` adalah kunci **alur kerja**; beberapa kunci **alur kerja** dipisahkan oleh koma. Kunci ini dapat diperoleh dengan mengarahkan kursor mouse ke nama **alur kerja** di bagian atas kanvas **alur kerja**:

![Workflow_Key_View_Method](https://static-docs.nocobase.com/20240426135108.png)

Setelah panggilan berhasil, **alur kerja** persetujuan untuk **koleksi** `posts` yang sesuai akan terpicu.

:::info{title="Catatan"}
Karena panggilan eksternal juga perlu didasarkan pada identitas pengguna, saat memanggil melalui API HTTP, sama seperti permintaan yang dikirim dari antarmuka biasa, informasi autentikasi harus disediakan, termasuk header `Authorization` atau parameter `token` (token yang diperoleh saat masuk), dan header `X-Role` (nama peran pengguna saat ini).
:::

Jika Anda perlu memicu event untuk data terkait satu-ke-satu dalam tindakan ini (satu-ke-banyak belum didukung), Anda dapat menggunakan `!` dalam parameter untuk menentukan data pemicu untuk bidang asosiasi:

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

Setelah panggilan di atas berhasil, event persetujuan untuk **koleksi** `categories` yang sesuai akan terpicu.

:::info{title="Catatan"}
Saat memicu event setelah tindakan melalui API HTTP, Anda juga perlu memperhatikan status aktif **alur kerja** dan apakah konfigurasi **koleksi** cocok; jika tidak, panggilan mungkin tidak berhasil atau dapat menyebabkan kesalahan.
:::

#### Memulai dari Pusat Persetujuan

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

*   `collectionName`: Nama **koleksi** target untuk memulai persetujuan. Wajib diisi.
*   `workflowId`: ID **alur kerja** yang digunakan untuk memulai persetujuan. Wajib diisi.
*   `data`: Bidang-bidang catatan **koleksi** yang dibuat saat memulai persetujuan. Wajib diisi.
*   `status`: Status catatan yang dibuat saat memulai persetujuan. Wajib diisi. Nilai yang mungkin termasuk:
    *   `0`: Draf, menunjukkan penyimpanan tanpa pengajuan persetujuan.
    *   `1`: Ajukan persetujuan, menunjukkan pemrakarsa mengajukan permintaan persetujuan, memasuki proses persetujuan.

#### Simpan dan Kirim

Ketika persetujuan yang dimulai (atau ditarik kembali) berada dalam status draf, Anda dapat menyimpan atau mengirimkannya lagi melalui API berikut:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "data": { "<field>": "<value>" },
    "status": 2
  }'
  "http://localhost:3000/api/approvals:update/<approval id>"
```

#### Mendapatkan Daftar Persetujuan yang Diajukan

```bash
curl -X GET -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/approvals:listMine"
```

#### Tarik Kembali

Pemrakarsa dapat menarik kembali catatan yang sedang dalam persetujuan melalui API berikut:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  "http://localhost:3000/api/approvals:withdraw/<approval id>"
```

**Parameter**

*   `<approval id>`: ID catatan persetujuan yang akan ditarik kembali. Wajib diisi.

### Pemberi Persetujuan

Setelah **alur kerja** persetujuan masuk ke node persetujuan, tugas yang harus dilakukan akan dibuat untuk pemberi persetujuan saat ini. Pemberi persetujuan dapat menyelesaikan tugas persetujuan melalui antarmuka atau dengan memanggil API HTTP.

#### Mendapatkan Catatan Pemrosesan Persetujuan

Tugas yang harus dilakukan adalah catatan pemrosesan persetujuan. Anda dapat memperoleh semua catatan pemrosesan persetujuan pengguna saat ini melalui API berikut:

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:listMine"
```

Di sini, `approvalRecords` sebagai sumber daya **koleksi**, juga dapat menggunakan kondisi kueri umum seperti `filter`, `sort`, `pageSize`, dan `page`.

#### Mendapatkan Satu Catatan Pemrosesan Persetujuan

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:get/<record id>"
```

#### Menyetujui dan Menolak

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

*   `<record id>`: ID catatan yang akan diproses persetujuannya. Wajib diisi.
*   `status`: Bidang untuk status pemrosesan persetujuan. `2` berarti "Setuju", `-1` berarti "Tolak". Wajib diisi.
*   `comment`: Informasi catatan untuk pemrosesan persetujuan. Opsional.
*   `data`: Modifikasi pada catatan **koleksi** di node persetujuan saat ini setelah persetujuan. Opsional (hanya berlaku saat disetujui).

#### Kembalikan <Badge>v1.9.0+</Badge>

Sebelum versi v1.9.0, pengembalian menggunakan API yang sama dengan 'Setuju' dan 'Tolak', dengan `"status": 1` mewakili pengembalian.

Mulai dari versi v1.9.0, pengembalian memiliki API terpisah:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "returnToNodeKey": "<node key>",
  }'
  "http://localhost:3000/api/approvalRecords:return/<record id>"
```

**Parameter**

*   `<record id>`: ID catatan yang akan diproses persetujuannya. Wajib diisi.
*   `returnToNodeKey`: Kunci node target untuk dikembalikan. Opsional. Ketika rentang node yang dapat dikembalikan dikonfigurasi dalam node, parameter ini dapat digunakan untuk menentukan node mana yang akan dikembalikan. Jika tidak dikonfigurasi, parameter ini tidak perlu diteruskan, dan secara default akan kembali ke titik awal untuk diajukan ulang oleh pemrakarsa.

#### Delegasikan

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignee": <user id>,
  }'
  "http://localhost:3000/api/approvalRecords:delegate/<record id>"
```

**Parameter**

*   `<record id>`: ID catatan yang akan diproses persetujuannya. Wajib diisi.
*   `assignee`: ID pengguna yang akan didelegasikan. Wajib diisi.

#### Tambah Penanda Tangan

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignees": [<user id>],
    "order": <order>,
  }'
  "http://localhost:3000/api/approvalRecords:add/<record id>"
```

**Parameter**

*   `<record id>`: ID catatan yang akan diproses persetujuannya. Wajib diisi.
*   `assignees`: Daftar ID pengguna yang akan ditambahkan sebagai penanda tangan. Wajib diisi.
*   `order`: Urutan penanda tangan yang ditambahkan. `-1` berarti sebelum "saya", `1` berarti setelah "saya".