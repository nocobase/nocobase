:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Aturan Keterkaitan

## Pendahuluan

Dalam NocoBase, Aturan Keterkaitan adalah mekanisme yang digunakan untuk mengontrol perilaku interaktif elemen antarmuka (interface) front-end. Aturan ini memungkinkan pengguna untuk menyesuaikan tampilan dan logika perilaku blok, bidang, dan operasi dalam antarmuka berdasarkan kondisi yang berbeda, sehingga menciptakan pengalaman interaktif yang fleksibel dan berkode rendah (low-code). Fitur ini terus diiterasi dan dioptimalkan.

Dengan mengonfigurasi aturan keterkaitan, Anda dapat mencapai hal-hal seperti:

- Menyembunyikan/menampilkan blok tertentu berdasarkan peran pengguna saat ini. Peran yang berbeda dapat melihat blok dengan cakupan data yang berbeda, misalnya, administrator melihat blok dengan informasi lengkap; pengguna biasa hanya dapat melihat blok informasi dasar.
- Saat sebuah opsi dipilih dalam formulir, secara otomatis mengisi atau mengatur ulang nilai bidang lainnya.
- Saat sebuah opsi dipilih dalam formulir, menonaktifkan beberapa item input.
- Saat sebuah opsi dipilih dalam formulir, mengatur beberapa item input menjadi wajib diisi.
- Mengontrol apakah tombol operasi terlihat atau dapat diklik dalam kondisi tertentu.

## Konfigurasi Kondisi

![20251029114532](https://static-docs.nocobase.com/20251029114532.png)

### Variabel Sisi Kiri

Variabel sisi kiri dalam kondisi digunakan untuk mendefinisikan "objek penilaian" dalam aturan keterkaitan. Artinya, penilaian kondisi dilakukan berdasarkan nilai variabel ini untuk menentukan apakah tindakan keterkaitan akan dipicu.

Variabel yang dapat dipilih meliputi:

- Bidang dalam konteks, seperti `「Formulir Saat Ini/xxx」`, `「Catatan Saat Ini/xxx」`, `「Catatan Pop-up Saat Ini/xxx」`, dll.
- Variabel global sistem, seperti `Pengguna Saat Ini`, `Peran Saat Ini`, dll., cocok untuk kontrol dinamis berdasarkan identitas pengguna, izin, dan informasi lainnya.
  > ✅ Opsi yang tersedia untuk variabel sisi kiri ditentukan oleh konteks blok. Gunakan variabel sisi kiri secara bijak sesuai kebutuhan bisnis:
  >
  > - `「Pengguna Saat Ini」` merepresentasikan informasi pengguna yang sedang masuk.
  > - `「Formulir Saat Ini」` merepresentasikan nilai input real-time dalam formulir.
  > - `「Catatan Saat Ini」` merepresentasikan nilai catatan yang tersimpan, seperti catatan baris dalam tabel.

### Operator

Operator digunakan untuk mengatur logika penilaian kondisi, yaitu bagaimana membandingkan variabel sisi kiri dengan nilai sisi kanan. Variabel sisi kiri dengan tipe yang berbeda mendukung operator yang berbeda. Operator tipe umum adalah sebagai berikut:

- **Tipe Teks**: `$includes`, `$eq`, `$ne`, `$empty`, `$notEmpty`, dll.
- **Tipe Angka**: `$eq`, `$gt`, `$lt`, `$gte`, `$lte`, dll.
- **Tipe Boolean**: `$isTruly`, `$isFalsy`
- **Tipe Array**: `$match`, `$anyOf`, `$empty`, `$notEmpty`, dll.

> ✅ Sistem akan secara otomatis merekomendasikan daftar operator yang tersedia berdasarkan tipe variabel sisi kiri untuk memastikan logika konfigurasi yang masuk akal.

### Nilai Sisi Kanan

Digunakan untuk perbandingan dengan variabel sisi kiri, ini adalah nilai referensi untuk menentukan apakah kondisi terpenuhi.

Konten yang didukung meliputi:

- Nilai konstanta: Masukkan angka, teks, tanggal, dll. yang tetap;
- Variabel konteks: seperti bidang lain dalam formulir saat ini, catatan saat ini, dll.;
- Variabel sistem: seperti pengguna saat ini, waktu saat ini, peran saat ini, dll.

> ✅ Sistem akan secara otomatis menyesuaikan metode input untuk nilai sisi kanan berdasarkan tipe variabel sisi kiri, misalnya:
>
> - Ketika sisi kiri adalah "bidang pilihan", pemilih opsi yang sesuai akan ditampilkan;
> - Ketika sisi kiri adalah "bidang tanggal", pemilih tanggal akan ditampilkan;
> - Ketika sisi kiri adalah "bidang teks", kotak input teks akan ditampilkan.

> 💡 Penggunaan nilai sisi kanan yang fleksibel (terutama variabel dinamis) memungkinkan Anda untuk membangun logika keterkaitan berdasarkan pengguna saat ini, status data saat ini, dan lingkungan konteks, sehingga mencapai pengalaman interaktif yang lebih kuat.

## Logika Eksekusi Aturan

### Pemicu Kondisi

Ketika kondisi dalam suatu aturan terpenuhi (opsional), operasi modifikasi properti di bawahnya akan secara otomatis dieksekusi. Jika tidak ada kondisi yang diatur, aturan tersebut secara default dianggap selalu terpenuhi, dan operasi modifikasi properti akan dieksekusi secara otomatis.

### Beberapa Aturan

Anda dapat mengonfigurasi beberapa aturan keterkaitan untuk sebuah formulir. Ketika kondisi dari beberapa aturan terpenuhi secara bersamaan, sistem akan mengeksekusi hasilnya secara berurutan dari yang pertama hingga terakhir, yang berarti hasil terakhir akan menjadi standar eksekusi akhir.
Contoh: Aturan 1 mengatur bidang menjadi "Dinonaktifkan", dan Aturan 2 mengatur bidang menjadi "Dapat Diedit". Jika kondisi untuk kedua aturan terpenuhi, bidang akan menjadi status "Dapat Diedit".

> Urutan eksekusi beberapa aturan sangat penting. Saat merancang aturan, pastikan untuk memperjelas prioritas dan hubungan timbal balik di antaranya untuk menghindari konflik aturan.

## Manajemen Aturan

Operasi berikut dapat dilakukan pada setiap aturan:

- Penamaan Kustom: Atur nama yang mudah dipahami untuk aturan agar mudah dikelola dan diidentifikasi.
- Pengurutan: Sesuaikan urutan berdasarkan prioritas eksekusi aturan untuk memastikan sistem memprosesnya dalam urutan yang benar.
- Hapus: Hapus aturan yang tidak lagi diperlukan.
- Aktifkan/Nonaktifkan: Nonaktifkan sementara suatu aturan tanpa menghapusnya, cocok untuk skenario di mana suatu aturan perlu dinonaktifkan sementara dalam situasi tertentu.
- Duplikasi Aturan: Buat aturan baru dengan menyalin aturan yang sudah ada untuk menghindari konfigurasi berulang.

## Tentang Variabel

Dalam penetapan nilai bidang dan konfigurasi kondisi, tidak hanya konstanta yang didukung, tetapi juga variabel. Daftar variabel akan bervariasi tergantung pada lokasi blok. Memilih dan menggunakan variabel secara bijak dapat memenuhi kebutuhan bisnis dengan lebih fleksibel. Untuk informasi lebih lanjut tentang variabel, silakan lihat [Variabel](/interface-builder/variables).

## Aturan Keterkaitan Blok

Aturan keterkaitan blok memungkinkan kontrol dinamis tampilan blok berdasarkan variabel sistem (seperti pengguna saat ini, peran) atau variabel konteks (seperti catatan pop-up saat ini). Misalnya, seorang administrator dapat melihat informasi pesanan lengkap, sementara peran layanan pelanggan hanya dapat melihat data pesanan tertentu. Melalui aturan keterkaitan blok, Anda dapat mengonfigurasi blok yang sesuai berdasarkan peran, dan mengatur bidang, tombol operasi, serta cakupan data yang berbeda di dalam blok tersebut. Ketika peran yang masuk adalah peran target, sistem akan menampilkan blok yang sesuai. Penting untuk dicatat bahwa blok secara default ditampilkan, jadi Anda biasanya perlu mendefinisikan logika untuk menyembunyikan blok.

👉 Untuk detail, lihat: [Blok/Aturan Keterkaitan Blok](/interface-builder/blocks/block-settings/block-linkage-rule)

## Aturan Keterkaitan Bidang

Aturan keterkaitan bidang digunakan untuk menyesuaikan status bidang dalam formulir atau blok detail secara dinamis berdasarkan tindakan pengguna, yang utamanya meliputi:

- Mengontrol status **Tampil/Sembunyi** suatu bidang
- Mengatur apakah suatu bidang **Wajib Diisi**
- **Menetapkan nilai**
- Mengeksekusi JavaScript untuk menangani logika bisnis kustom

👉 Untuk detail, lihat: [Blok/Aturan Keterkaitan Bidang](/interface-builder/blocks/block-settings/field-linkage-rule)

## Aturan Keterkaitan Operasi

Aturan keterkaitan operasi saat ini mendukung kontrol perilaku operasi, seperti menyembunyikan/menonaktifkan, berdasarkan variabel konteks seperti nilai catatan saat ini dan formulir saat ini, serta variabel global.

👉 Untuk detail, lihat: [Operasi/Aturan Keterkaitan](/interface-builder/actions/action-settings/linkage-rule)