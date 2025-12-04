:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Tingkat Lanjut

## Pendahuluan

Karyawan AI dapat diikatkan ke halaman atau blok. Setelah diikatkan, Anda dapat mengonfigurasi tugas-tugas khusus untuk bisnis saat ini, sehingga pengguna dapat dengan cepat memanfaatkan Karyawan AI untuk memproses tugas-tugas tersebut di halaman atau blok.

## Mengikatkan Karyawan AI ke Halaman

Setelah halaman masuk ke mode edit UI, tanda '+' akan muncul di samping tombol akses cepat Karyawan AI di sudut kanan bawah. Arahkan kursor ke tanda '+' tersebut, dan daftar Karyawan AI akan muncul. Pilih satu Karyawan AI untuk mengikatkannya ke halaman saat ini.

![20251022134656](https://static-docs.nocobase.com/20251022134656.png)

Setelah pengikatan selesai, setiap kali Anda masuk ke halaman, Karyawan AI yang terikat dengan halaman tersebut akan ditampilkan di sudut kanan bawah.

![20251022134903](https://docs.nocobase.com/20251022134903.png)

## Mengikatkan Karyawan AI ke Blok

Setelah halaman masuk ke mode edit UI, pada blok yang mendukung pengaturan `Actions`, pilih menu `AI employees` di bawah `Actions`, lalu pilih satu Karyawan AI untuk mengikatkannya ke blok saat ini.

![20251022135306](https://static-docs.nocobase.com/20251022135306.png)

Setelah pengikatan selesai, setiap kali Anda masuk ke halaman, Karyawan AI yang terikat dengan blok saat ini akan ditampilkan di area `Actions` blok tersebut.

![20251022135438](https://static-docs.nocobase.com/20251022135438.png)

## Mengonfigurasi Tugas

Setelah halaman masuk ke mode edit UI, arahkan kursor ke ikon Karyawan AI yang terikat dengan halaman atau blok. Sebuah tombol menu akan muncul. Pilih `Edit tasks` untuk masuk ke halaman pengaturan tugas.

![20251022135710](https://static-docs.nocobase.com/20251022135710.png)

Setelah masuk ke halaman pengaturan tugas, Anda dapat menambahkan beberapa tugas untuk Karyawan AI saat ini.

Setiap tab mewakili tugas yang independen. Klik tanda '+' di sebelahnya untuk menambahkan tugas baru.

![20251022140058](https://static-docs.nocobase.com/20251022140058.png)

Formulir pengaturan tugas:

- Pada kolom input `Title`, masukkan judul tugas. Jelaskan konten tugas secara singkat. Judul ini akan muncul di daftar tugas Karyawan AI.
- Pada kolom input `Background`, masukkan konten utama tugas. Konten ini akan digunakan sebagai *prompt* sistem saat berinteraksi dengan Karyawan AI.
- Pada kolom input `Default user message`, masukkan pesan pengguna bawaan yang akan dikirim. Pesan ini akan secara otomatis terisi di kolom input pengguna setelah tugas dipilih.
- Pada `Work context`, pilih informasi konteks aplikasi bawaan yang akan dikirim ke Karyawan AI. Operasi ini sama dengan yang dilakukan di dalam dialog.
- Kotak pilihan `Skills` menampilkan keterampilan yang dimiliki Karyawan AI saat ini. Anda dapat membatalkan pilihan keterampilan tertentu agar Karyawan AI mengabaikan dan tidak menggunakan keterampilan tersebut saat menjalankan tugas ini.
- Kotak centang `Send default user message automatically` mengonfigurasi apakah pesan pengguna bawaan akan dikirim secara otomatis setelah mengklik untuk menjalankan tugas.

![20251022140805](https://static-docs.nocobase.com/20251022140805.png)

## Daftar Tugas

Setelah mengonfigurasi tugas untuk Karyawan AI, tugas-tugas ini akan ditampilkan di pop-up profil Karyawan AI dan dalam pesan sapaan sebelum percakapan dimulai. Klik tugas untuk menjalankannya.

![20251022141231](https://static-docs.nocobase.com/20251022141231.png)