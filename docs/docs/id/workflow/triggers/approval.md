---
pkg: '@nocobase/plugin-workflow-approval'
---

:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/workflow/triggers/approval).
:::

# Persetujuan

## Pendahuluan

Persetujuan adalah jenis alur kerja yang dirancang khusus untuk dimulai secara manual dan diproses secara manual untuk memutuskan status data terkait. Biasanya digunakan untuk manajemen alur kerja otomatisasi kantor atau urusan pengambilan keputusan manual lainnya, misalnya dapat membuat dan mengelola alur kerja manual untuk skenario seperti "pengajuan cuti", "persetujuan penggantian biaya", dan "persetujuan pengadaan bahan baku".

Plugin persetujuan menyediakan jenis alur kerja (pemicu) khusus "Persetujuan (event)" dan node "Persetujuan" khusus untuk alur kerja tersebut. Dikombinasikan dengan koleksi kustom dan blok kustom unik NocoBase, Anda dapat dengan cepat dan fleksibel membuat serta mengelola berbagai skenario persetujuan.

## Membuat alur kerja

Pilih jenis "Persetujuan" saat membuat alur kerja untuk membuat alur kerja persetujuan:

![Pemicu Persetujuan_Membuat alur kerja persetujuan](https://static-docs.nocobase.com/f52dda854f46a669e0c1c7fb487a17ea.png)

Setelah itu, klik pemicu pada antarmuka konfigurasi alur kerja untuk membuka jendela sembul guna melakukan konfigurasi lebih lanjut.

## Konfigurasi pemicu

![20251226102619](https://static-docs.nocobase.com/20251226102619.png)

### Mengikat koleksi

Plugin persetujuan NocoBase dirancang berdasarkan fleksibilitas dan dapat digunakan dengan koleksi kustom apa pun, yang berarti konfigurasi persetujuan tidak perlu mengonfigurasi ulang model data, melainkan langsung menggunakan kembali koleksi yang telah dibuat. Oleh karena itu, setelah masuk ke konfigurasi pemicu, pertama-tama Anda perlu memilih koleksi untuk menentukan data dari koleksi mana yang akan diproses oleh alur kerja ini:

![Pemicu Persetujuan_Konfigurasi pemicu_Pilih koleksi](https://static-docs.nocobase.com/20251226103223.png)

### Metode pemicu

Saat memulai persetujuan untuk data bisnis, Anda dapat memilih dua metode pemicu berikut:

*   **Sebelum data disimpan**

    Memulai persetujuan sebelum data yang dikirimkan disimpan, cocok untuk skenario di mana data hanya boleh disimpan setelah persetujuan diberikan. Dalam mode ini, data saat persetujuan dimulai hanya bersifat sementara, dan hanya akan disimpan secara resmi ke koleksi terkait setelah persetujuan diberikan.

*   **Setelah data disimpan**

    Memulai persetujuan setelah data yang dikirimkan disimpan, cocok untuk skenario di mana data dapat disimpan terlebih dahulu baru kemudian dilakukan persetujuan. Dalam mode ini, data saat persetujuan dimulai sudah disimpan di koleksi terkait, dan modifikasi selama proses persetujuan juga akan disimpan.

### Lokasi inisiasi persetujuan

Anda dapat memilih lokasi untuk memulai persetujuan di dalam sistem:

*   **Hanya dimulai di blok data**

    Dapat mengikat tindakan dari blok formulir apa pun pada tabel ini ke alur kerja tersebut untuk memulai persetujuan, serta memproses dan melacak proses persetujuan di blok persetujuan data tunggal, biasanya cocok untuk data bisnis.

*   **Dapat dimulai di blok data dan pusat tugas**

    Selain blok data, persetujuan juga dapat dimulai dan diproses di pusat tugas global, yang biasanya cocok untuk data administratif.

### Siapa yang dapat memulai persetujuan

Dapat mengonfigurasi izin berdasarkan cakupan pengguna untuk menentukan pengguna mana yang dapat memulai persetujuan tersebut:

*   **Semua pengguna**

    Semua pengguna dalam sistem dapat memulai persetujuan tersebut.

*   **Hanya pengguna yang dipilih**

    Hanya mengizinkan pengguna dalam cakupan yang ditentukan untuk memulai persetujuan tersebut, dapat memilih lebih dari satu.

    ![20251226114623](https://static-docs.nocobase.com/20251226114623.png)

### Konfigurasi antarmuka formulir pemrakarsa

Terakhir, perlu mengonfigurasi antarmuka formulir pemrakarsa, antarmuka ini akan digunakan untuk operasi pengiriman saat memulai dari blok pusat persetujuan dan saat mengirim ulang setelah pengguna menarik kembali. Klik tombol konfigurasi untuk membuka jendela sembul:

![Pemicu Persetujuan_Konfigurasi pemicu_Formulir pemrakarsa](https://static-docs.nocobase.com/20251226130239.png)

Dapat menambahkan formulir pengisian berdasarkan koleksi yang terikat untuk antarmuka pemrakarsa, atau teks penjelasan (Markdown) untuk petunjuk dan panduan. Formulir wajib ditambahkan, jika tidak pemrakarsa tidak akan dapat beroperasi setelah masuk ke antarmuka tersebut.

Setelah menambahkan blok formulir, sama seperti antarmuka konfigurasi formulir biasa, Anda dapat menambahkan komponen bidang dari koleksi terkait, dan dapat mengaturnya secara bebas untuk mengatur konten yang perlu diisi dalam formulir:

![Pemicu Persetujuan_Konfigurasi pemicu_Formulir pemrakarsa_Konfigurasi bidang](https://static-docs.nocobase.com/20251226130339.png)

Berbeda dengan tombol pengiriman langsung, Anda juga dapat menambahkan tombol operasi "Simpan draf" untuk mendukung alur pemrosesan penyimpanan sementara:

![Pemicu Persetujuan_Konfigurasi pemicu_Formulir pemrakarsa_Konfigurasi operasi_Simpan](https://static-docs.nocobase.com/20251226130512.png)

Jika alur kerja persetujuan mengizinkan pemrakarsa untuk menarik kembali, perlu mengaktifkan tombol "Tarik kembali" dalam konfigurasi antarmuka pemrakarsa:

![Pemicu Persetujuan_Konfigurasi pemicu_Izinkan tarik kembali](https://static-docs.nocobase.com/20251226130637.png)

Setelah diaktifkan, persetujuan yang dimulai oleh alur kerja ini dapat ditarik kembali oleh pemrakarsa sebelum diproses oleh pemberi persetujuan mana pun, tetapi setelah diproses oleh pemberi persetujuan yang dikonfigurasi pada node persetujuan berikutnya, maka tidak dapat ditarik kembali lagi.

:::info{title=Petunjuk}
Setelah mengaktifkan atau menghapus tombol tarik kembali, Anda perlu mengklik simpan dan kirim pada jendela sembul konfigurasi pemicu agar perubahan berlaku.
:::

### Kartu "Pengajuan Saya" <Badge>2.0+</Badge>

Dapat digunakan untuk mengonfigurasi kartu tugas dalam daftar "Pengajuan Saya" di pusat tugas.

![20260213005957](https://static-docs.nocobase.com/20260213005957.png)

Dalam kartu, Anda dapat secara bebas mengonfigurasi bidang bisnis yang ingin ditampilkan (kecuali bidang relasi), atau informasi terkait persetujuan.

Setelah pengajuan persetujuan dibuat, kartu tugas kustom dapat dilihat di daftar pusat tugas:

![20260213010228](https://static-docs.nocobase.com/20260213010228.png)

### Mode tampilan catatan dalam alur kerja

*   **Snapshot**

    Dalam alur kerja persetujuan, status catatan yang dilihat oleh pemohon dan pemberi persetujuan saat masuk, dan setelah pengiriman hanya dapat melihat catatan yang mereka modifikasi sendiri—tidak akan melihat pembaruan yang dilakukan oleh orang lain setelahnya.

*   **Terbaru**

    Dalam alur kerja persetujuan, pemohon dan pemberi persetujuan selalu melihat versi terbaru dari catatan di sepanjang alur kerja, terlepas dari status catatan sebelum mereka beroperasi. Setelah alur kerja selesai, mereka akan melihat versi final dari catatan tersebut.

## Node persetujuan

Dalam alur kerja persetujuan, perlu menggunakan node "Persetujuan" khusus untuk mengonfigurasi logika operasi bagi pemberi persetujuan guna memproses (menyetujui, menolak, atau mengembalikan) persetujuan yang dimulai, node "Persetujuan" juga hanya dapat digunakan dalam alur kerja persetujuan. Lihat [Node Persetujuan](../nodes/approval.md) untuk detail lebih lanjut.

:::info{title=Petunjuk}
Jika sebuah alur kerja persetujuan tidak memiliki node "Persetujuan" apa pun, alur kerja tersebut akan disetujui secara otomatis.
:::

## Konfigurasi inisiasi persetujuan

Setelah mengonfigurasi dan mengaktifkan alur kerja persetujuan, Anda dapat mengikat alur kerja tersebut ke tombol pengiriman formulir dari koleksi terkait, agar pengguna dapat memulai persetujuan saat mengirimkan:

![Inisiasi Persetujuan_Ikat alur kerja](https://static-docs.nocobase.com/20251226110710.png)

Setelah itu, pengiriman formulir oleh pengguna akan memicu alur kerja persetujuan terkait, data yang dikirimkan selain disimpan di koleksi terkait, juga akan diambil snapshot-nya ke dalam alur persetujuan untuk ditinjau oleh personel persetujuan berikutnya.

:::info{title=Petunjuk}
Tombol untuk memulai persetujuan saat ini hanya mendukung penggunaan tombol "Kirim" (atau "Simpan") dalam formulir tambah atau perbarui, tidak mendukung penggunaan tombol "Picu alur kerja" (tombol tersebut hanya dapat diikat ke "Event operasi kustom").
:::

## Pusat tugas

Pusat tugas menyediakan pintu masuk terpadu untuk memudahkan pengguna melihat dan memproses tugas, persetujuan yang dimulai oleh pengguna saat ini dan tugas yang harus dilakukan dapat diakses melalui pusat tugas di bilah alat atas, dan berbagai jenis tugas dapat dilihat melalui navigasi kategori di sebelah kiri.

![20250310161203](https://static-docs.nocobase.com/20250310161203.png)

### Pengajuan saya

#### Melihat persetujuan yang telah dimulai

![20250310161609](https://static-docs.nocobase.com/20250310161609.png)

#### Memulai persetujuan baru secara langsung

![20250310161658](https://static-docs.nocobase.com/20250310161658.png)

### Tugas saya

#### Daftar tugas

![20250310161934](https://static-docs.nocobase.com/20250310161934.png)

#### Detail tugas

![20250310162111](https://static-docs.nocobase.com/20250310162111.png)

## HTTP API

### Pemrakarsa

#### Inisiasi koleksi

Memulai dari blok data, dapat dipanggil seperti ini (contoh menggunakan tombol buat pada tabel `posts`):

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

Di mana parameter URL `triggerWorkflows` adalah key dari alur kerja, beberapa alur kerja dipisahkan dengan koma. Key tersebut dapat diperoleh dengan mengarahkan kursor ke nama alur kerja di bagian atas kanvas alur kerja:

![Alur kerja_key_Cara melihat](https://static-docs.nocobase.com/20240426135108.png)

Setelah panggilan berhasil, alur kerja persetujuan untuk tabel `posts` terkait akan dipicu.

:::info{title="Petunjuk"}
Karena panggilan eksternal juga perlu didasarkan pada identitas pengguna, saat memanggil melalui HTTP API, sama seperti permintaan yang dikirim dari antarmuka biasa, informasi autentikasi harus disediakan, termasuk header `Authorization` atau parameter `token` (token yang diperoleh saat login), serta header `X-Role` (nama peran pengguna saat ini).
:::

Jika perlu memicu event untuk data relasi satu-ke-satu (satu-ke-banyak belum didukung) dalam operasi tersebut, Anda dapat menggunakan `!` dalam parameter untuk menentukan data pemicu bidang relasi:

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

Setelah panggilan di atas berhasil, event persetujuan untuk tabel `categories` terkait akan dipicu.

:::info{title="Petunjuk"}
Saat memicu event setelah operasi melalui panggilan HTTP API, perhatikan juga status aktif alur kerja, serta apakah konfigurasi koleksi cocok, jika tidak panggilan mungkin tidak berhasil atau terjadi kesalahan.
:::

#### Inisiasi pusat persetujuan

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

* `collectionName`: Nama koleksi target untuk memulai persetujuan, wajib diisi.
* `workflowId`: ID alur kerja yang digunakan untuk memulai persetujuan, wajib diisi.
* `data`: Bidang catatan koleksi yang dibuat saat memulai persetujuan, wajib diisi.
* `status`: Status catatan yang dibuat saat memulai persetujuan, wajib diisi. Nilai yang tersedia meliputi:
  * `0`: Draf, menunjukkan penyimpanan tetapi tidak mengajukan persetujuan.
  * `2`: Mengajukan persetujuan, menunjukkan pemrakarsa mengajukan permohonan persetujuan, masuk ke proses persetujuan.

#### Simpan dan kirim

Saat persetujuan yang dimulai (atau ditarik kembali) berada dalam status draf, Anda dapat menyimpan atau mengirimkannya kembali melalui antarmuka berikut:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "data": { "<field>": "<value>" },
    "status": 2
  }'
  "http://localhost:3000/api/approvals:update/<approval id>"
```

#### Mendapatkan daftar persetujuan yang telah dimulai

```bash
curl -X GET -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/approvals:listMine"
```

#### Tarik kembali

Pemrakarsa dapat menarik kembali catatan yang saat ini sedang dalam persetujuan melalui antarmuka berikut:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  "http://localhost:3000/api/approvals:withdraw/<approval id>"
```

**Parameter**

* `<approval id>`: ID catatan persetujuan yang akan ditarik kembali, wajib diisi.

### Pemberi persetujuan

Setelah alur kerja persetujuan masuk ke node persetujuan, tugas yang harus dilakukan akan dibuat untuk pemberi persetujuan saat ini. Pemberi persetujuan dapat menyelesaikan tugas persetujuan melalui operasi antarmuka, atau melalui panggilan HTTP API.

#### Mendapatkan catatan pemrosesan persetujuan

Tugas yang harus dilakukan adalah catatan pemrosesan persetujuan, Anda dapat memperoleh semua catatan pemrosesan persetujuan pengguna saat ini melalui antarmuka berikut:

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:listMine"
```

Di mana `approvalRecords` sebagai sumber daya koleksi, juga dapat menggunakan kondisi kueri umum, seperti `filter`, `sort`, `pageSize`, dan `page`.

#### Mendapatkan catatan pemrosesan persetujuan tunggal

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:get/<record id>"
```

#### Setuju dan tolak

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

* `<record id>`: ID catatan yang akan diproses persetujuannya, wajib diisi.
* `status`: Bidang untuk status pemrosesan persetujuan, `2` menunjukkan "Setuju", `-1` menunjukkan "Tolak", wajib diisi.
* `comment`: Catatan pemrosesan persetujuan, opsional.
* `data`: Menunjukkan modifikasi pada catatan koleksi di node persetujuan saat ini setelah persetujuan diberikan, opsional (hanya berlaku saat setuju).

#### Kembali <Badge>v1.9.0+</Badge>

Sebelum versi v1.9.0, kembali menggunakan antarmuka yang sama dengan "Setuju" dan "Tolak", menggunakan `"status": 1` untuk mewakili kembali.

Mulai versi v1.9.0, kembali memiliki antarmuka terpisah:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "returnToNodeKey": "<node key>",
  }'
  "http://localhost:3000/api/approvalRecords:return/<record id>"
```

**Parameter**

* `<record id>`: ID catatan yang akan diproses persetujuannya, wajib diisi.
* `returnToNodeKey`: Key node target untuk dikembalikan, opsional. Saat cakupan node yang dapat dikembalikan dikonfigurasi dalam node, parameter ini dapat digunakan untuk menentukan pengembalian ke node mana. Jika tidak dikonfigurasi, parameter ini tidak perlu dikirim, secara default akan kembali ke titik awal untuk dikirim ulang oleh pemrakarsa.

#### Transfer

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignee": <user id>,
  }'
  "http://localhost:3000/api/approvalRecords:delegate/<record id>"
```

**Parameter**

* `<record id>`: ID catatan yang akan diproses persetujuannya, wajib diisi.
* `assignee`: ID pengguna tujuan transfer, wajib diisi.

#### Tambah penanda tangan

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignees": [<user id>],
    "order": <order>,
  }'
  "http://localhost:3000/api/approvalRecords:add/<record id>"
```

**Parameter**

* `<record id>`: ID catatan yang akan diproses persetujuannya, wajib diisi.
* `assignees`: Daftar ID pengguna yang ditambahkan sebagai penanda tangan, wajib diisi.
* `order`: Urutan penambahan penanda tangan, `-1` menunjukkan sebelum "saya", `1` menunjukkan setelah "saya".