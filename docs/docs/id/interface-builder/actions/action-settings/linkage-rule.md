:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Aturan Keterkaitan Aksi

## Pendahuluan

Aturan keterkaitan aksi memungkinkan pengguna untuk mengontrol status aksi secara dinamis (seperti menampilkan, mengaktifkan, menyembunyikan, menonaktifkan, dll.) berdasarkan kondisi tertentu. Dengan mengonfigurasi aturan ini, pengguna dapat menghubungkan perilaku tombol aksi dengan rekaman saat ini, peran pengguna, atau data kontekstual.

![20251029150224](https://static-docs.nocobase.com/20251029150224.png)

## Cara Menggunakan

Ketika kondisi terpenuhi (secara default akan lolos jika tidak ada kondisi yang diatur), ini akan memicu eksekusi pengaturan properti atau JavaScript. Konstanta dan variabel didukung dalam penilaian kondisi.

![20251030224601](https://static-docs.nocobase.com/20251030224601.png)

Aturan ini mendukung modifikasi properti tombol.

![20251029150452](https://static-docs.nocobase.com/20251029150452.png)

## Konstanta

Contoh: Pesanan yang sudah dibayar tidak dapat diedit.

![20251029150638](https://static-docs.nocobase.com/20251029150638.png)

## Variabel

### Variabel Sistem

![20251029150014](https://static-docs.nocobase.com/20251029150014.png)

Contoh 1: Mengontrol visibilitas tombol berdasarkan jenis perangkat saat ini.

![20251029151057](https://static-docs.nocobase.com/20251029151057.png)

Contoh 2: Tombol pembaruan massal pada header tabel blok pesanan hanya tersedia untuk peran Admin; peran lain tidak dapat melakukan aksi ini.

![20251029151209](https://static-docs.nocobase.com/20251029151209.png)

### Variabel Kontekstual

Contoh: Tombol Tambah pada peluang pesanan (blok relasi) hanya diaktifkan ketika status pesanan adalah "Menunggu Pembayaran" atau "Draf". Pada status lain, tombol akan dinonaktifkan.

![20251029151520](https://static-docs.nocobase.com/20251029151520.png)

![20251029152200](https://static-docs.nocobase.com/20251029152200.png)

Untuk informasi lebih lanjut tentang variabel, lihat [Variabel](/interface-builder/variables).