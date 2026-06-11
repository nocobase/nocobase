# Bab 12: Pemesanan Ruang Meeting dan Workflow

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=114048192480747&bvid=BV1PKPuevEH5&cid=28526840811&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Saya yakin sekarang Anda sudah sangat familiar dengan **NocoBase**.

Dalam bab ini, kita akan bersama-sama mengimplementasikan skenario khusus: modul manajemen meeting.

Modul ini mencakup fitur seperti pemesanan ruang meeting dan notifikasi. Dalam proses ini, kita akan secara bertahap membangun modul manajemen meeting dari nol, dimulai dari dasar, dan secara bertahap mengimplementasikan fitur yang lebih kompleks. Mari kita mulai dengan mendesain struktur tabel data dasar dari modul ini.

---

### 12.1 Mendesain Struktur Tabel Data

Struktur tabel data dapat dipahami sebagai kerangka dasar dari modul manajemen meeting. Di sini kita akan fokus memperkenalkan **Tabel Ruang Meeting** dan **Tabel Pemesanan**, serta akan melibatkan beberapa hubungan baru, seperti hubungan [many-to-many](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations/m2m) dengan Pengguna.

![](https://static-docs.nocobase.com/Solution/CRuKbVrnroSgGdxaVrBcvzSMnHd.png)

#### 12.1.1 Tabel Ruang Meeting

Tabel ruang meeting digunakan untuk menyimpan informasi dasar semua ruang meeting, dengan Field meliputi nama ruang meeting, lokasi, kapasitas, konfigurasi, dan sebagainya.

##### Contoh Struktur Tabel

```json
Ruang Meeting (Rooms)
    ID (primary key)
    Nama ruang meeting (name, single line text)
    Lokasi spesifik (location, multi-line text)
    Kapasitas (capacity, integer)
    Konfigurasi (equipment, multi-line text)
```

#### 12.1.2 Tabel Pemesanan

Tabel pemesanan digunakan untuk mencatat semua informasi pemesanan meeting, dengan Field meliputi ruang meeting, pengguna yang berpartisipasi, periode waktu, topik meeting, dan deskripsi.

##### Contoh Struktur Tabel

```json
Pemesanan (Bookings)
    ID (integer, unique primary key)
    Ruang meeting (room, hubungan many-to-one, foreign key room_id terkait dengan ID ruang meeting)
    Pengguna (users, many-to-many, terkait dengan ID Pengguna)
    Waktu mulai (start_time, datetime)
    Waktu selesai (end_time, datetime)
    Judul meeting (title, single line text)
    Deskripsi meeting (description, Markdown)
```

##### [Hubungan Many-to-Many](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations/m2m)

Pada tabel pemesanan, terdapat hubungan "many-to-many": satu Pengguna dapat berpartisipasi dalam beberapa meeting, dan satu meeting dapat melibatkan banyak Pengguna. Hubungan many-to-many di sini perlu dikonfigurasi dengan foreign key. Untuk memudahkan pengelolaan, kita dapat memberi nama tabel perantara sebagai **booking_users**.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211428726.png)

---

### 12.2 Membangun Modul Manajemen Meeting

Setelah struktur tabel data didesain, kita dapat membuat dua tabel sesuai desain dan membangun modul "Manajemen Meeting". Berikut adalah langkah-langkah pembuatan dan konfigurasi:

#### 12.2.1 Membuat [Block Tabel](https://docs-cn.nocobase.com/handbook/ui/blocks/data-blocks/table)

Pertama, tambahkan modul "Manajemen Meeting" di halaman, buat **Block Tabel Ruang Meeting** dan **[Block Tabel](https://docs-cn.nocobase.com/handbook/ui/blocks/data-blocks/table) Tabel Pemesanan** secara terpisah. Kemudian buat [Block Calendar](https://docs-cn.nocobase.com/handbook/calendar) tabel pemesanan, dengan tampilan default kalender diatur sebagai "Hari".

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211428135.png)

##### Mengatur Asosiasi Block Tabel Ruang Meeting

Hubungkan Block tabel ruang meeting dengan dua Block lainnya, sehingga record pemesanan yang sesuai dengan ruang meeting tersebut dapat secara otomatis difilter. Kemudian, Anda dapat mencoba fitur filter, tambah, hapus, dan ubah untuk menguji interaksi dasar modul.

> Tips **Koneksi Block NocoBase (Direkomendasikan!!)**:
>
> Selain Block filter sebelumnya, Block tabel kita juga dapat terhubung dengan Block lain, sehingga merealisasikan efek filter klik.
>
> Seperti gambar di bawah ini, dalam konfigurasi tabel ruang meeting, kita menghubungkan dua Block lain dari tabel pemesanan (Block Tabel Pemesanan, Block Calendar Pemesanan)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211428280.png)

> Setelah berhasil terhubung, klik tabel ruang meeting, Anda akan menemukan dua tabel lainnya juga ikut difilter! Klik kembali item terpilih untuk membatalkan pilihan.
>
> ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211429198.gif)

---

### 12.3 Mendeteksi Status Penggunaan Ruang Meeting

Setelah konfigurasi halaman selesai, kita perlu menambahkan fitur penting: mendeteksi status penggunaan ruang meeting. Fitur ini akan memeriksa apakah ruang meeting target sedang digunakan pada periode waktu yang ditentukan saat membuat atau memperbarui meeting, untuk menghindari konflik pemesanan.

![](https://static-docs.nocobase.com/project-management-cn-er.drawio.svg)

#### 12.3.1 Mengatur [Workflow](https://docs-cn.nocobase.com/handbook/workflow) "Pre-action Event"

Untuk melakukan deteksi saat pemesanan, kita menggunakan jenis workflow khusus yaitu [**"Pre-action Event"**](https://docs-cn.nocobase.com/handbook/workflow-request-interceptor):

- [**Pre-action Event**](https://docs-cn.nocobase.com/handbook/workflow-request-interceptor) (plugin komersial): Menjalankan serangkaian operasi sebelum data ditambah, dihapus, atau diubah. Dapat dijeda kapan saja dan dicegat lebih awal. Cara ini sangat dekat dengan alur development kode sehari-hari!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211429352.png)

#### 12.3.2 Mengkonfigurasi Node

Pada workflow deteksi penggunaan, kita memerlukan beberapa jenis node berikut:

- [**Node Calculation**](https://docs-cn.nocobase.com/handbook/workflow/nodes/calculation) (logika konversi data, untuk menangani kasus modifikasi dan penambahan)
- [**Operasi SQL**](https://docs-cn.nocobase.com/handbook/workflow/nodes/sql) (Menjalankan query SQL)
- [**JSON Query**](https://docs-cn.nocobase.com/handbook/workflow/nodes/json-query) (plugin komersial, untuk parsing data JSON)
- [**Response Message**](https://docs-cn.nocobase.com/handbook/workflow/nodes/response-message) (plugin komersial, untuk mengembalikan pesan informasi)

---

#### 12.3.3 Mengikat Tabel Pemesanan dan Mengkonfigurasi Trigger

Sekarang, kita ikat tabel pemesanan, pilih mode trigger sebagai "Mode Global", dan pilih tipe operasi sebagai membuat record dan memperbarui record.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211429296.png)

---

### 12.4 Mengkonfigurasi [Node Calculation](https://docs-cn.nocobase.com/handbook/workflow/nodes/calculation)

#### 12.4.1 Membuat Node Calculation "Konversi ID Kosong menjadi -1"

Pertama, kita buat node calculation untuk mengkonversi ID kosong menjadi -1. Node calculation dapat mengkonversi variabel sesuai cara yang kita butuhkan, dengan menyediakan tiga bentuk operasi:

- **Math.js** (referensi [Math.js](https://mathjs.org/))
- **Formula.js** (referensi [Formula.js](https://formulajs.info/functions/))
- **String Template** (untuk penggabungan data)

Di sini, kita menggunakan **Formula.js** untuk penilaian numerik:

```html
IF(NUMBERVALUE([Variabel Trigger/Parameter/Object Nilai yang Disubmit/ID], '', '.'), [Variabel Trigger/Parameter/Object Nilai yang Disubmit/ID], -1)
```

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211429134.png)

---

### 12.5. Membuat [Node Operasi SQL](https://docs-cn.nocobase.com/handbook/workflow/nodes/sql)

Selanjutnya, buat node operasi SQL, jalankan query untuk memeriksa ruang meeting yang tersedia:

#### 12.5.1 Query SQL untuk Ruang Meeting yang Tersedia

```sql
-- Query semua ruang meeting yang dapat dipesan
SELECT r.id, r.name
FROM rooms r
LEFT JOIN bookings b ON r.id = b.room_id
  AND b.id <> {{$jobsMapByNodeKey.3a0lsms6tgg}}  -- Eksklusi pemesanan saat ini
  AND b.start_time < '{{$context.params.values.end_time}}' -- Waktu mulai sebelum waktu selesai query
  AND b.end_time > '{{$context.params.values.start_time}}' -- Waktu selesai setelah waktu mulai query
WHERE b.id IS NULL;
```

> Perhatian SQL: Variabel akan langsung disubstitusi ke dalam pernyataan SQL. Periksa variabel dengan teliti untuk menghindari SQL injection. Tambahkan single quote di tempat yang tepat.

Variabel-variabelnya adalah:

{{$jobsMapByNodeKey.3a0lsms6tgg}} mewakili hasil node sebelumnya, [Data Node/Konversi ID Kosong menjadi -1]

{{$context.params.values.end_time}} mewakili [Variabel Trigger/Parameter/Object Nilai yang Disubmit/Waktu Selesai]

{{$context.params.values.start_time}} mewakili [Variabel Trigger/Parameter/Object Nilai yang Disubmit/Waktu Mulai]

#### 12.5.2 Menguji SQL

Tujuan kita adalah meng-query semua ruang meeting yang tidak konflik dengan node waktu target.

Pada saat ini, Anda dapat mengklik "Test run" di bawah, mengubah nilai variabel, dan men-debug SQL.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211437958.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211438641.png)

---

### 12.6 [JSON Query](https://docs-cn.nocobase.com/handbook/workflow/nodes/json-query)

#### 12.6.1 Mengkonfigurasi [Node JSON Query](https://docs-cn.nocobase.com/handbook/workflow/nodes/json-query)

Melalui pengujian langkah sebelumnya, kita dapat mengamati bahwa hasilnya berbentuk seperti berikut. Pada saat ini, perlu mengaktifkan [**plugin JSON query node**](https://docs-cn.nocobase.com/handbook/workflow-json-query):

```json
[
  {
    "id": 2,
    "name": "Ruang Meeting 2"
  },
  {
    "id": 1,
    "name": "Ruang Meeting 1"
  }
]
```

> Cara parsing JSON dibagi menjadi tiga jenis:
> [JMESPath](https://jmespath.org/)
> [JSON Path Plus](https://jsonpath-plus.github.io/JSONPath/docs/ts/)
> [JSONata](https://jsonata.org/)

Di sini kita pilih salah satu, misalnya format [JMESPath](https://jmespath.org/). Karena kita perlu memfilter daftar nama ruang meeting yang tersedia, isi expression:

```sql
[].name
```

Konfigurasi mapping atribut adalah untuk daftar object, saat ini tidak diperlukan dan tidak perlu diisi.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211438250.png)

### 12.7 [Conditional Judgment](https://docs-cn.nocobase.com/handbook/workflow/nodes/condition)

Konfigurasikan node conditional judgment untuk menentukan apakah ruang meeting saat ini ada dalam daftar ruang meeting yang tersedia. Sesuai hasil **Ya** atau **Tidak** dari penilaian, konfigurasikan response message secara terpisah:

Kondisi penilaian, gunakan operasi "Basic" saja:

```json
[Data Node / Daftar Ruang Meeting yang Diparsing] mengandung [Variabel Trigger / Parameter / Object Nilai yang Disubmit / Ruang Meeting / Nama]
```

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211439432.png)

#### 12.7.1 Ya: Konfigurasi Pesan Sukses

Pada saat ini, perlu mengaktifkan [**plugin Workflow: Response message**](https://docs-cn.nocobase.com/handbook/workflow-response-message):

```json
[Variabel Trigger/Parameter/Object Nilai yang Disubmit/Ruang Meeting/Nama] tersedia, pemesanan berhasil!
```

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211439159.png)

#### 12.7.2 Tidak: Konfigurasi Pesan Gagal

```json
Ruang meeting target tidak tersedia, daftar ruang meeting yang tersedia: [Data Node/Daftar Ruang Meeting yang Diparsing]
```

Perhatian, ketika penilaian gagal, kita harus mengkonfigurasi node "Akhiri Flow" untuk mengakhiri flow secara manual.

![202411170606321731794792.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211440377.png)

---

### 12.8 Detail Pengujian Fitur dan Debug

Sekarang kita masuk ke tahap pengujian akhir dari sistem manajemen meeting. Tujuan dari tahap ini adalah memastikan bahwa workflow kita dapat mendeteksi dengan benar dan mencegah pemesanan ruang meeting yang konflik.

#### 12.8.1 Menambahkan Pemesanan dengan Periode Waktu Konflik

Pertama, mari kita coba menambahkan meeting dengan waktu yang konflik dengan pemesanan yang sudah ada, untuk melihat apakah sistem akan mencegah operasi dan menampilkan pesan error.

- Atur periode waktu pemesanan yang konflik

Kita coba menambahkan pemesanan baru di "Ruang Meeting 1" dengan waktu

`2024-11-14 00:00:00 - 2024-11-14 23:00:00`

Rentang waktu ini mencakup seluruh hari, dan kita sengaja membuat konflik dengan waktu pemesanan yang sudah ada.

- Konfirmasikan pemesanan meeting yang sudah ada

Di "Ruang Meeting 1", sudah ada dua periode waktu pemesanan:

1. `2024-11-14 09:00:00 hingga 2024-11-14 12:00:00`
2. `2024-11-14 14:00:00 hingga 2024-11-14 16:30:00`

Kedua periode waktu ini tumpang tindih dengan periode waktu yang akan kita tambahkan

(`2024-11-14 00:00:00 - 2024-11-14 23:00:00`).

Oleh karena itu, berdasarkan logika penilaian, sistem seharusnya mendeteksi konflik waktu dan mencegah pemesanan ini.

- Submit pemesanan dan verifikasi feedback

Kita klik tombol **Submit**, sistem akan menjalankan flow deteksi dalam workflow:

**Feedback sukses:** Setelah submit, sistem menampilkan prompt konflik, menunjukkan bahwa logika deteksi normal. Halaman dengan sukses memberikan feedback bahwa kita tidak dapat menyelesaikan pemesanan ini.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211440141.png)

---

#### 12.8.2 Menambahkan Pemesanan dengan Periode Waktu yang Tidak Konflik

Selanjutnya, mari kita uji pemesanan tanpa konflik~

Pastikan ketika waktu meeting tidak tumpang tindih, kita dapat berhasil memesan ruang meeting!

- Atur periode waktu pemesanan yang tidak konflik

Kita pilih periode waktu yang tidak konflik, misalnya

`2024-11-10 16:00:00 - 2024-11-10 17:00:00`.

Periode waktu ini tidak tumpang tindih dengan waktu pemesanan yang sudah ada, sehingga memenuhi syarat pemesanan ruang meeting.

- Submit pemesanan tanpa konflik

Klik tombol **Submit**, sistem kembali menjalankan logika deteksi workflow:

**Mari kita verifikasi:** Submit berhasil! Sistem menampilkan prompt "Pemesanan berhasil". Ini menunjukkan bahwa fitur pemesanan dalam kondisi tanpa konflik juga bekerja normal.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211440542.png)

#### 12.8.3 Memodifikasi Waktu Pemesanan yang Sudah Ada

Selain menambah pemesanan, teman-teman juga dapat menguji modifikasi waktu pemesanan yang sudah ada.

Misalnya, ubah waktu meeting yang sudah ada menjadi periode waktu lain yang tidak konflik, lalu klik submit lagi.

Langkah ini saya serahkan kepada Anda.

---

### 12.9  Optimasi Dashboard dan Panel Jadwal Pribadi

Setelah semua pengujian fitur lulus, kita dapat lebih lanjut mempercantik dan mengoptimalkan Dashboard untuk meningkatkan pengalaman pengguna.

#### 12.9.1 Menyesuaikan Layout Dashboard

Pada Dashboard, kita dapat mengatur ulang konten halaman sesuai kebiasaan operasi pengguna agar pengguna dapat dengan lebih mudah melihat data sistem.

Untuk lebih meningkatkan pengalaman pengguna, kita dapat membuat panel jadwal meeting pribadi untuk setiap pengguna. Operasi spesifiknya:

1. **Buat Block "Jadwal Pribadi" baru**: Tambahkan Block kalender atau list baru di Dashboard untuk menampilkan jadwal meeting pribadi pengguna.
2. **Atur nilai default anggota**: Atur nilai default anggota sebagai pengguna saat ini, sehingga ketika pengguna membuka Dashboard, akan secara default menampilkan meeting yang berhubungan dengan diri sendiri.

Lebih lanjut mengoptimalkan pengalaman pengguna saat menggunakan modul manajemen meeting.

Setelah konfigurasi ini selesai, fitur dan layout Dashboard menjadi lebih intuitif dan mudah digunakan, fiturnya juga lebih kaya!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211507712.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211507197.png)

Melalui langkah-langkah di atas, kita berhasil mengimplementasikan dan mengoptimalkan fitur utama dari modul manajemen meeting! Kami berharap Anda dapat secara bertahap menguasai fitur inti dari NocoBase melalui operasi ini, dan menikmati keseruan membangun sistem secara modular.

---

Lanjutkan eksplorasi, dan ekspresikan kreativitas Anda sepenuhnya! Jika menemui masalah, jangan lupa Anda dapat selalu merujuk pada [Dokumentasi Resmi NocoBase](https://docs-cn.nocobase.com/) atau bergabung dengan [Komunitas NocoBase](https://forum.nocobase.com/) untuk berdiskusi.
