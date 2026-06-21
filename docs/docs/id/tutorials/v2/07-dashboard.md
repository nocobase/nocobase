# Bab 7: Dashboard — Lihat Keseluruhan dengan Sekilas

Pada bab sebelumnya kita menggunakan Workflow untuk membuat sistem otomatis mengirim notifikasi dan mencatat waktu. Sistem semakin pintar, tetapi masih kekurangan satu hal — **perspektif global**.

Berapa banyak tiket? Berapa yang sudah diproses? Jenis masalah apa yang paling banyak? Berapa baru setiap hari? Pertanyaan-pertanyaan ini tidak dapat dijawab dengan membalik daftar. Pada bab ini, kita gunakan [Block chart](/data-visualization) (pie chart, line chart, bar chart) dan [Block Markdown](/interface-builder/blocks/other-blocks/markdown) untuk membangun sebuah **Dashboard Data**, mengubah data menjadi gambar yang langsung dapat dimengerti.

## 7.1 Menambahkan Halaman Dashboard

Pertama-tama, mari kita tambahkan satu menu baru di bilah navigasi atas.

Masuk ke [mode konfigurasi](/get-started/how-nocobase-works), pada bilah menu atas klik **"Tambah menu"** (ikon `+`), pilih **"Halaman versi baru (v2)"**, beri nama "Dashboard Data".

![07-dashboard-2026-03-15-21-39-35](https://static-docs.nocobase.com/07-dashboard-2026-03-15-21-39-35.png)

Halaman ini khusus untuk menempatkan chart, ini adalah panggung utama dashboard kita.

## 7.2 Pie Chart: Distribusi Status Tiket

Chart pertama, kita gunakan pie chart untuk menampilkan "Menunggu, Sedang Diproses, Selesai" masing-masing berapa.

Pada halaman dashboard data, klik **Buat [Block](/interface-builder/blocks) (Add block) → [Chart](/data-visualization)**.

Setelah ditambahkan, klik tombol **Konfigurasi** di pojok kanan atas Block, panel konfigurasi chart akan terbuka di sebelah kanan.

### Mengonfigurasi Query Data

- **[Tabel Data](/data-sources/data-modeling/collection)**: pilih "Tiket"
- **Measures**: pilih [field](/data-sources/data-modeling/collection-fields) unik apa pun (misalnya ID), metode agregasi pilih **Count**
- **Dimensions**: pilih field "Status"

![07-dashboard-2026-03-15-21-44-32](https://static-docs.nocobase.com/07-dashboard-2026-03-15-21-44-32.png)

Klik **Eksekusi Query**, dapat melihat preview data yang dikembalikan di bawah.

### Mengonfigurasi Opsi Chart

- **Tipe Chart**: pilih **Pie Chart**
- **Pemetaan Field**: Category pilih "Status", Value pilih nilai count
- **Label**: aktifkan switch

Pada halaman di sebelah kiri seharusnya sudah muncul pie chart yang cantik. Setiap sektor mewakili satu status, secara default menampilkan jumlah konkret dan persentase.

![07-dashboard-2026-03-15-21-45-40](https://static-docs.nocobase.com/07-dashboard-2026-03-15-21-45-40.png)

Klik **Simpan**, chart pertama selesai.

## 7.3 Line Chart: Tren Tiket Baru Harian

Pie chart melihat "distribusi saat ini", line chart melihat "tren perubahan".

Pada halaman tambah satu Block chart lagi, konfigurasi sebagai berikut:

### Query Data

- **Tabel Data**: pilih "Tiket"
- **Measures**: ID, Count
- **Dimensions**: pilih field "Waktu Pembuatan", format atur sebagai **YYYY-MM-DD** (group berdasarkan hari)

> **Tips**: Format dimension tanggal sangat penting. Memilih `YYYY-MM-DD` adalah statistik harian, memilih `YYYY-MM` menjadi statistik bulanan. Pilih granularitas yang sesuai dengan volume data Anda.

### Opsi Chart

- **Tipe Chart**: pilih **Line Chart**
- **Pemetaan Field**: xField pilih "Waktu Pembuatan", yField pilih nilai count

![07-dashboard-2026-03-15-21-48-33](https://static-docs.nocobase.com/07-dashboard-2026-03-15-21-48-33.png)

Setelah disimpan, Anda dapat melihat kurva perubahan jumlah tiket dari waktu ke waktu. Jika suatu hari mendadak melonjak tinggi, berarti hari itu ada masalah, perlu diperhatikan.

## 7.4 Bar Chart: Jumlah Tiket per Kategori

Chart ketiga, kita lihat kategori mana yang memiliki tiket paling banyak. Di sini gunakan **bar chart horizontal** bukan column chart vertikal — ketika kategori banyak, label X-axis column chart vertikal mudah tumpang tindih dan tersembunyi, tampilan horizontal lebih jelas.

Tambahkan Block chart ketiga:

### Query Data

- **Tabel Data**: pilih "Tiket"
- **Measures**: Count ID
- **Dimensions**: pilih field asosiasi "Kategori" (pilih field nama kategori)

### Opsi Chart

- **Tipe Chart**: pilih **Bar Chart**
- **Pemetaan Field**: xField pilih nilai count (Count ID), yField pilih "Nama Kategori"

![07-dashboard-2026-03-15-22-05-11](https://static-docs.nocobase.com/07-dashboard-2026-03-15-22-05-11.png)

Setelah disimpan, kategori mana paling banyak terlihat sekilas. Jika "Gangguan Jaringan" jauh lebih panjang dari kategori lain, mungkin saatnya mempertimbangkan upgrade peralatan jaringan.

## 7.5 Block Tabel: Tiket Belum Selesai

Chart memberikan perspektif ringkasan, tetapi administrator biasanya juga perlu melihat detail konkret. Kita tambahkan tabel **Tiket Belum Selesai**, langsung menampilkan semua tiket yang belum selesai diproses.

Pada halaman tambah satu **Block Tabel**, tabel data pilih "Tiket".

### Mengonfigurasi Kondisi Filter

Klik konfigurasi di pojok kanan atas Block tabel, temukan **Atur Data Scope**, tambahkan satu kondisi [filter](/interface-builder/blocks/filter-blocks/form):

- **Status** tidak sama dengan **Selesai**

Dengan demikian tabel hanya menampilkan tiket yang belum selesai, satu yang selesai akan otomatis menghilang dari list.

### Mengonfigurasi Field

Pilih kolom yang akan ditampilkan: judul, status, prioritas, penangani, waktu pembuatan.

![07-dashboard-2026-03-15-22-20-11](https://static-docs.nocobase.com/07-dashboard-2026-03-15-22-20-11.png)

> **Tips**: Anda juga bisa menambahkan **sorting default** (descending berdasarkan waktu pembuatan), agar tiket terbaru di paling depan.

## 7.6 Block Markdown: Pengumuman Sistem

Selain chart, kita juga dapat menempatkan informasi teks di dashboard.

Tambahkan satu **[Block Markdown](/interface-builder/blocks/other-blocks/markdown)**, tulis pengumuman sistem atau panduan penggunaan:

```markdown
## Sistem Tiket IT

Selamat datang! Jika ada masalah silakan kirim tiket, tim teknis akan segera memprosesnya.

**Masalah mendesak** silakan langsung hubungi IT Hotline: 8888
```

![07-dashboard-2026-03-15-21-53-54](https://static-docs.nocobase.com/07-dashboard-2026-03-15-21-53-54.png)

Block Markdown diletakkan di bagian atas dashboard, sebagai informasi selamat datang sekaligus papan pengumuman. Konten dapat dimodifikasi kapan saja, sangat fleksibel.

![07-dashboard-2026-03-15-22-30-57](https://static-docs.nocobase.com/07-dashboard-2026-03-15-22-30-57.png)

## 7.7 Block JS: Banner Selamat Datang Personal

Format Markdown relatif tetap, jika ingin efek yang lebih kaya bagaimana? NocoBase menyediakan **Block JS (JavaScript Block)**, dapat menggunakan kode untuk kustomisasi konten tampilan secara bebas.

Kita gunakan untuk membuat banner selamat datang gaya bisnis — berdasarkan pengguna login saat ini dan waktu, menampilkan sapaan personal.

Pada halaman tambah satu **Block JS** (Buat Block → Block Lainnya → Block JS).

![07-dashboard-2026-03-15-22-33-24](https://static-docs.nocobase.com/07-dashboard-2026-03-15-22-33-24.png)

Pada Block JS dapat mendapatkan username pengguna login saat ini melalui `ctx.getVar("ctx.user.username")`, di bawah adalah banner selamat datang gaya bisnis sederhana:

```js
const uname = await ctx.getVar("ctx.user.username")
const name = uname || 'Pengguna';
const hour = new Date().getHours();
const hi = hour < 12 ? 'Selamat Pagi' : hour < 18 ? 'Selamat Siang' : 'Selamat Malam';

const d = new Date();
const date = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const week = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][d.getDay()];

ctx.render(`
<div style="padding: 24px 32px; background: #f7f8fa; border-radius: 8px;">
  <div style="display: flex; justify-content: space-between; align-items: flex-end;">
    <div>
      <div style="font-size: 22px; font-weight: 600; color: #1d2129;">${hi}, ${name}</div>
      <div style="font-size: 14px; color: #86909c; margin-top: 4px;">Selamat datang kembali di Sistem Tiket IT</div>
    </div>
    <div style="font-size: 14px; color: #86909c;">${date}　${week}</div>
  </div>
</div>`);
```

![07-dashboard-2026-03-15-22-51-27](https://static-docs.nocobase.com/07-dashboard-2026-03-15-22-51-27.png)

Efeknya adalah kartu dengan latar abu-abu muda, sapaan di kiri, tanggal di kanan. Bersih, praktis, tidak mendominasi.

> **Tips**: `ctx.getVar("ctx.user.xxx")` adalah cara mendapatkan informasi pengguna saat ini di Block JS, field yang sering digunakan termasuk `nickname` (nickname), `username` (username), `email`, dan lainnya. Block JS juga dapat memanggil API untuk query data, selanjutnya Anda bisa menggunakannya untuk membuat lebih banyak konten kustom.

## 7.8 Action Panel: Entry Point Cepat + Reuse Popup

Dashboard tidak hanya tempat melihat data, tetapi juga harus menjadi titik awal operasi. Kita tambahkan satu **Action Panel**, agar pengguna dapat langsung mengirim tiket dari halaman home, melompat ke daftar tiket.

Pada halaman tambah satu Block **Action Panel** (Buat Block → Block Lainnya → Action Panel), kemudian tambahkan dua [Action](/interface-builder/actions) di Action Panel:

![07-dashboard-2026-03-15-22-54-06](https://static-docs.nocobase.com/07-dashboard-2026-03-15-22-54-06.png)

1. **Link: Lompat ke Daftar Tiket** — tambahkan satu Action "Link", konfigurasi URL mengarah ke halaman daftar tiket (seperti `/admin/camcwbox2uc`)

![07-dashboard-2026-03-15-22-57-49](https://static-docs.nocobase.com/07-dashboard-2026-03-15-22-57-49.png)

2. **Tombol: Tambah Tiket** — tambahkan satu tombol Action "Popup", judul ubah menjadi "Tambah Tiket"

![07-dashboard-2026-03-15-23-00-36](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-00-36.png)

Tetapi setelah tombol "Tambah Tiket" diklik popup-nya kosong, kita perlu mengonfigurasi konten popup. Membangun ulang form tambah baru terlalu merepotkan — di sini muncul fitur yang sangat praktis: **Reuse Popup**.

### Menyimpan Template Popup

> Perhatian: Template popup di sini tidak sama dengan "Block Template" di Bab 4. Block template menyimpan field dan layout dari satu Block form, sedangkan template popup menyimpan **seluruh popup** termasuk semua Block, field, tombol Action di dalamnya.

1. Masuk ke **Halaman Daftar Tiket**, temukan tombol "Tambah Tiket"
2. Klik konfigurasi tombol, temukan **"Simpan sebagai Template"**, simpan popup saat ini
3. Beri nama template (seperti "Popup Tambah Tiket Baru")

![07-dashboard-2026-03-15-23-05-17](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-05-17.png)

### Reuse Popup di Halaman Home

1. Kembali ke halaman dashboard data, klik konfigurasi tombol "Tambah Tiket" di action panel
2. Temukan **"Pengaturan Popup"**, pilih template "Popup Tambah Tiket Baru" yang baru saja disimpan
3. Setelah disimpan, klik tombol akan langsung membuka popup form tambah baru yang sama persis dengan daftar tiket

![07-dashboard-2026-03-15-23-06-33](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-06-33.png)

![07-dashboard-2026-03-15-23-07-20](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-07-20.gif)

### Klik Judul untuk Buka Popup Detail

Dengan cara yang sama, kita juga dapat membuat judul tabel tiket belum selesai dapat diklik, langsung membuka detail tiket:

1. Pertama ke **Halaman Daftar Tiket**, temukan konfigurasi tombol "Lihat", juga **"Simpan sebagai Template"** (seperti "Popup Detail Tiket")

![07-dashboard-2026-03-15-23-08-02](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-08-02.png)

2. Kembali ke halaman dashboard data, di tabel tiket belum selesai, klik konfigurasi field "Judul"
3. Buka switch **"Aktifkan Klik untuk Buka"** — saat ini akan muncul opsi "Pengaturan Popup"
4. Pada pengaturan popup pilih template "Popup Detail Tiket" yang baru saja disimpan

![07-dashboard-2026-03-15-23-11-24](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-11-24.png)

Sekarang, pengguna pada dashboard mengklik judul tiket dapat langsung melihat detail, tidak perlu melompat ke halaman daftar tiket. Seluruh dashboard menjadi lebih kompak dan efisien.

![07-dashboard-2026-03-15-23-12-36](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-12-36.png)

> **Manfaat reuse popup**: Template popup yang sama dapat digunakan di banyak halaman, setelah modifikasi template semua referensi akan terupdate secara sinkron. Ini mirip dengan ide mode "Reference" di Bab 4 — pemeliharaan di satu tempat, berlaku di mana-mana.

## 7.9 Menyesuaikan Layout

Sekarang halaman sudah memiliki 6 Block (banner selamat datang JS + action panel + 3 chart + tabel tiket), mari kita sesuaikan layout agar lebih menarik.

Pada mode konfigurasi, Anda dapat menyesuaikan posisi dan ukuran setiap Block dengan **drag**:

Saran referensi layout:

- **Baris pertama**: Banner selamat datang JS (kiri) + Action Panel (kanan)
- **Baris kedua**: Pie chart (kiri) + Tabel tiket (kanan)
- **Baris ketiga**: Line chart (kiri) + Bar chart (kanan)

![07-dashboard-2026-03-15-23-14-19](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-14-19.png)

Perhatikan, Anda mungkin menemukan tinggi Block tidak rata, saat itu Anda dapat menyesuaikan secara manual di Pengaturan Block > Tinggi Block, contohnya saya menyesuaikan kedua Block di baris kedua menjadi 500px.

Drag tepi dapat menyesuaikan lebar Block, agar dua chart masing-masing memakan setengah. Coba beberapa kali untuk menemukan susunan yang paling nyaman.

![07-dashboard-2026-03-15-23-18-57](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-18-57.png)

## Ringkasan

Pada bab ini kita membangun dashboard data yang kaya dan praktis dengan 6 Block:

- **Banner Selamat Datang JS**: menampilkan sapaan personal berdasarkan pengguna saat ini dan waktu
- **Action Panel**: lompat cepat ke daftar tiket, satu klik tambah tiket (reuse popup)
- **Pie Chart**: melihat proporsi distribusi status tiket sekilas
- **Line Chart**: melacak tren perubahan jumlah tiket dari waktu ke waktu
- **Bar Chart**: membandingkan jumlah tiket setiap kategori secara horizontal, kategori banyak juga tidak takut label tumpang tindih
- **Tabel Tiket Belum Selesai**: ikhtisar semua tiket yang belum diproses, klik judul langsung lihat detail (reuse popup)

Sekaligus kita belajar **Reuse Popup**, teknik penting ini — menyimpan popup dari satu halaman sebagai template, langsung merujuk di halaman lain, menghindari konfigurasi berulang.

Visualisasi data adalah Plugin bawaan NocoBase, tidak perlu instalasi tambahan. Cara konfigurasi sama mudahnya dengan membangun halaman — pilih data, pilih tipe chart, pemetaan field, tiga langkah selesai.

## Pratinjau Selanjutnya

Sampai di sini, fitur sistem tiket kita sudah sangat lengkap: pemodelan data, pembangunan halaman, input form, kontrol izin, Workflow otomasi, dashboard data, semuanya sudah ada. Selanjutnya kami berencana merilis **tutorial pembangunan versi AI Agent** — menggunakan AI Agent untuk secara otomatis menyelesaikan pembangunan sistem secara lokal, nantikan!

## Sumber Daya Terkait

- [Visualisasi Data](/data-visualization) — Detail konfigurasi chart
- [Block Markdown](/interface-builder/blocks/other-blocks/markdown) — Penggunaan Block Markdown
- [Layout Block](/interface-builder/blocks) — Layout halaman dan konfigurasi Block
