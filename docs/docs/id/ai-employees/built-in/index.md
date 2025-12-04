:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Karyawan AI Bawaan

## Pendahuluan

NocoBase dilengkapi dengan karyawan AI bawaan berikut. Mereka sudah memiliki keterampilan, alat, dan basis pengetahuan yang lengkap. Anda hanya perlu mengonfigurasi LLM untuk mereka agar dapat mulai bekerja.

- `Orin`: Pakar pemodelan data
- `Avery`: Pengisi formulir
- `Viz`: Analis wawasan
- `Lexi`: Penerjemah
- `Nathan`: Insinyur kode frontend
- `Cole`: Asisten NocoBase
- `Vera`: Analis riset
- `Dex`: Pengatur data
- `Ellis`: Pakar email

## Cara Mengaktifkan

Masuk ke halaman konfigurasi plugin Karyawan AI, lalu klik tab `AI employees` untuk masuk ke halaman manajemen karyawan AI.

Anda akan melihat bahwa sistem sudah memiliki beberapa karyawan AI bawaan, tetapi semuanya belum dalam status aktif. Oleh karena itu, Anda belum bisa berkolaborasi dengan karyawan AI ini di halaman aplikasi.

![20251022121248](https://static-docs.nocobase.com/20251022121248.png)

Pilih karyawan AI bawaan yang ingin Anda aktifkan, lalu klik tombol `Edit` untuk masuk ke halaman pengeditan karyawan AI.

Pertama, di tab `Profile`, aktifkan sakelar `Enable`.

![20251022121546](https://static-docs.nocobase.com/20251022121546.png)

Selanjutnya, di tab `Model settings`, atur model untuk karyawan AI bawaan:

- Pilih layanan LLM yang telah kita buat di manajemen layanan LLM;
- Masukkan nama model besar yang ingin Anda gunakan

![20251022121729](https://static-docs.nocobase.com/20251022121729.png)

### Selesaikan Pengaktifan

Setelah mengatur model untuk karyawan AI bawaan, klik tombol `Submit` untuk menyimpan perubahan.

Kemudian, Anda dapat melihat karyawan AI bawaan ini di tombol peluncuran cepat karyawan AI yang berada di pojok kanan bawah halaman.

![20251022121951](https://static-docs.nocobase.com/20251022121951.png)

### Catatan

Beberapa karyawan AI bawaan tidak akan muncul di daftar karyawan AI di pojok kanan bawah setelah diaktifkan. Contohnya, Orin hanya akan muncul di halaman konfigurasi data utama; sedangkan Nathan hanya akan muncul di editor JS.