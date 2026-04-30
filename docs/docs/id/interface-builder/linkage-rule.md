---
title: "Aturan Linkage"
description: "Aturan Linkage Interface Builder: linkage Block, linkage Field, linkage Action, mengimplementasikan filter, penugasan, tampilan/sembunyi dan linkage data antar komponen."
keywords: "Aturan Linkage, linkage Block, linkage Field, linkage Action, linkage data, interface builder, NocoBase"
---

# Aturan Linkage

## Pengantar

Di NocoBase, aturan linkage adalah mekanisme yang digunakan untuk mengontrol perilaku interaksi elemen antarmuka frontend. Aturan ini memungkinkan pengguna untuk menyesuaikan logika tampilan dan perilaku Block, Field, dan Action di antarmuka berdasarkan kondisi yang berbeda, sehingga menghasilkan pengalaman interaksi yang fleksibel dan low-code. Fitur ini terus dioptimalkan dan diiterasi.

Dengan mengkonfigurasi aturan linkage, Anda dapat melakukan hal seperti:

- Menyembunyikan/menampilkan Block tertentu berdasarkan peran pengguna saat ini, menampilkan Block dengan cakupan data yang berbeda untuk peran yang berbeda, misalnya admin menampilkan Block dengan informasi lengkap; pengguna biasa hanya dapat melihat Block informasi dasar
- Saat memilih opsi tertentu di Form, otomatis mengisi atau mereset nilai Field lainnya.
- Saat memilih opsi tertentu di Form, menonaktifkan beberapa input.
- Saat memilih opsi tertentu di Form, mengatur input tertentu menjadi wajib.
- Mengontrol apakah tombol Action terlihat atau dapat diklik dalam kondisi tertentu.


## Konfigurasi Kondisi

![20251029114532](https://static-docs.nocobase.com/20251029114532.png)

### Variabel Sisi Kiri

Variabel sisi kiri kondisi digunakan untuk mendefinisikan "objek penilaian" dalam aturan linkage, yaitu penilaian kondisi dilakukan berdasarkan nilai variabel tersebut, sehingga menentukan apakah perilaku linkage akan dipicu.

Variabel yang dapat dipilih meliputi:

- Field dalam konteks, seperti `「Form saat ini/xxx」`、`「Record saat ini/xxx」`、`「Record popup saat ini/xxx」` dan lainnya;
- Variabel global sistem, seperti `Pengguna saat ini`, `Peran saat ini` dan lainnya, cocok untuk kontrol dinamis berdasarkan informasi identitas pengguna, izin, dan lainnya.
  > Variabel sisi kiri yang dapat dipilih ditentukan oleh konteks tempat Block berada. Gunakan variabel sisi kiri secara bijak sesuai kebutuhan bisnis:
  >
  > - "Pengguna saat ini" merepresentasikan informasi pengguna yang sedang login;
  > - "Form saat ini" merepresentasikan nilai input real-time di Form;
  > - "Record saat ini" merepresentasikan nilai record yang tersimpan, seperti record baris di Table.

### Operator

Operator digunakan untuk menetapkan logika penilaian kondisi, yaitu bagaimana membandingkan variabel sisi kiri dengan nilai sisi kanan. Tipe variabel sisi kiri yang berbeda mendukung operator yang berbeda. Operator umum berdasarkan tipe adalah sebagai berikut:

- **Tipe Teks**: `$includes`, `$eq`, `$ne`, `$empty`, `$notEmpty`, dll.
- **Tipe Numerik**: `$eq`, `$gt`, `$lt`, `$gte`, `$lte`, dll.
- **Tipe Boolean**: `$isTruly`, `$isFalsy`
- **Tipe Array**: `$match`, `$anyOf`, `$empty`, `$notEmpty`, dll.

> Sistem akan secara otomatis merekomendasikan daftar operator yang tersedia berdasarkan tipe variabel sisi kiri, memastikan logika konfigurasi yang tepat.

### Nilai Sisi Kanan

Digunakan untuk dibandingkan dengan variabel sisi kiri, sebagai nilai referensi untuk menentukan apakah kondisi terpenuhi.

Konten yang didukung meliputi:

- Nilai konstan: memasukkan nilai numerik, teks, tanggal yang tetap;
- Variabel konteks: seperti Field lain di Form saat ini, Record saat ini, dll.;
- Variabel sistem: seperti Pengguna saat ini, Waktu saat ini, Peran saat ini, dll.

> Sistem akan secara otomatis menyesuaikan metode input sisi kanan berdasarkan tipe variabel sisi kiri, misalnya:
>
> - Saat sisi kiri adalah "Field opsi", akan ditampilkan selector opsi yang sesuai;
> - Saat sisi kiri adalah "Field tanggal", akan ditampilkan date picker;
> - Saat sisi kiri adalah "Field teks", akan ditampilkan input teks.

> Penggunaan nilai sisi kanan secara fleksibel (terutama variabel dinamis) dapat membangun logika linkage berdasarkan pengguna saat ini, status data saat ini, dan lingkungan konteks, sehingga menghasilkan pengalaman interaksi yang lebih kuat.

## Logika Eksekusi Aturan

### Pemicu Kondisi

Ketika kondisi dalam aturan terpenuhi (tidak wajib), modifikasi atribut di bawah akan dieksekusi secara otomatis. Jika kondisi tidak diatur, secara default aturan dianggap selalu terpenuhi, dan modifikasi atribut akan dieksekusi secara otomatis.

### Beberapa Aturan

Anda dapat mengkonfigurasi beberapa aturan linkage untuk satu Form. Ketika kondisi beberapa aturan terpenuhi secara bersamaan, sistem akan mengeksekusi hasilnya berdasarkan urutan aturan dari depan ke belakang, yaitu hasil terakhir adalah standar eksekusi.
Contoh: Aturan 1 mengatur Field menjadi "dinonaktifkan", Aturan 2 mengatur Field menjadi "dapat diedit". Jika kedua kondisi aturan terpenuhi, maka Field akan menjadi status "dapat diedit".

> Urutan eksekusi beberapa aturan sangat penting. Pastikan untuk memahami prioritas dan hubungan antar aturan saat mendesain agar tidak terjadi konflik aturan.

## Manajemen Aturan

Anda dapat melakukan operasi berikut untuk setiap aturan:

- Penamaan kustom: Tetapkan nama yang mudah dipahami untuk aturan agar mudah dikelola dan dikenali.

- Sort: Sesuaikan urutan berdasarkan prioritas eksekusi aturan, memastikan sistem memproses aturan dalam urutan yang benar.

- Hapus: Hapus aturan yang tidak diperlukan lagi.

- Aktifkan/Nonaktifkan: Nonaktifkan aturan tertentu sementara tanpa harus menghapusnya, cocok untuk skenario di mana aturan perlu dinonaktifkan sementara dalam kondisi tertentu.

- Duplikat aturan: Buat aturan baru dengan menduplikat aturan yang sudah ada untuk menghindari konfigurasi berulang.

## Tentang Variabel

Dalam penugasan Field dan konfigurasi kondisi, tidak hanya konstanta yang didukung, tetapi juga penggunaan variabel. Daftar variabel akan berbeda berdasarkan posisi Block. Memilih dan menggunakan variabel secara bijak dapat lebih fleksibel memenuhi kebutuhan bisnis. Untuk informasi lebih lanjut tentang variabel, silakan lihat [Variabel](/interface-builder/variables).

## Aturan Linkage Block

Aturan Linkage Block memungkinkan kontrol dinamis tampilan Block berdasarkan variabel sistem (seperti pengguna saat ini, peran) atau variabel konteks (seperti record popup saat ini). Misalnya, admin dapat melihat informasi pesanan lengkap, sedangkan peran customer service hanya dapat melihat data pesanan tertentu. Melalui aturan linkage Block, Anda dapat mengkonfigurasi Block sesuai dengan peran, dan mengatur Field, tombol Action, dan cakupan data yang berbeda di Block. Saat peran login adalah peran target, sistem akan menampilkan Block yang sesuai. Perlu diperhatikan bahwa Block secara default ditampilkan, biasanya yang perlu dinilai adalah logika untuk menyembunyikan Block.

Detail: [Block/Aturan Linkage Block](/interface-builder/blocks/block-settings/block-linkage-rule)

## Aturan Linkage Field

Aturan Linkage Field digunakan untuk menyesuaikan status Field dalam Form atau Block detail secara dinamis berdasarkan operasi pengguna, terutama meliputi:

- Mengontrol **tampilan/sembunyi** Field
- Mengatur apakah Field **wajib diisi**
- **Penugasan**
- Menjalankan JavaScript untuk memproses logika bisnis kustom

Detail: [Block/Aturan Linkage Field](/interface-builder/blocks/block-settings/field-linkage-rule)

## Aturan Linkage Action

Aturan Linkage Action saat ini mendukung variabel konteks seperti nilai record saat ini, Form saat ini, dan variabel global untuk mengontrol perilaku Action seperti menyembunyikan/menonaktifkan, dll.

Detail: [Action/Aturan Linkage](/interface-builder/actions/action-settings/linkage-rule)
