---

pkg: '@nocobase/plugin-action-duplicate'

---

:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/interface-builder/actions/types/duplicate).
:::

# Duplikasi

## Pengenalan

Tindakan Duplikasi memungkinkan pengguna untuk membuat catatan baru dengan cepat berdasarkan data yang sudah ada. Fitur ini mendukung dua mode duplikasi: **Duplikasi langsung** dan **Duplikasi ke formulir dan lanjutkan pengisian**.

## Instalasi

Plugin bawaan, tidak memerlukan instalasi tambahan.

## Mode Duplikasi

![20260209224344](https://static-docs.nocobase.com/20260209224344.png)

### Duplikasi langsung

![20260209224506](https://static-docs.nocobase.com/20260209224506.png)

- Secara default dijalankan dengan cara "Duplikasi langsung";
- **Bidang templat**: Menentukan bidang yang akan diduplikasi, dapat memilih semua, wajib diisi.

![20260209225910](https://static-docs.nocobase.com/20260209225910.gif)

Setelah konfigurasi selesai, klik tombol untuk menduplikasi data.

### Duplikasi ke formulir dan lanjutkan pengisian

Bidang templat yang dikonfigurasi akan diisi ke dalam formulir sebagai **nilai default**. Pengguna dapat mengubah nilai tersebut sebelum mengirimkan formulir untuk menyelesaikan duplikasi.

![20260209224704](https://static-docs.nocobase.com/20260209224704.png)

**Konfigurasi bidang templat**: Hanya bidang yang dicentang yang akan dibawa dan digunakan sebagai nilai default.

![20260209225148](https://static-docs.nocobase.com/20260209225148.png)

#### Sinkronisasi bidang formulir

- Secara otomatis mengurai bidang yang telah dikonfigurasi dalam blok formulir saat ini sebagai bidang templat;
- Jika bidang blok formulir diubah di kemudian hari (misalnya penyesuaian komponen bidang relasi), Anda perlu membuka kembali konfigurasi templat dan mengeklik **Sinkronisasi bidang formulir** untuk memastikan konsistensi.

![20260209225450](https://static-docs.nocobase.com/20260209225450.gif)

Data templat akan diisi sebagai nilai default formulir, dan pengguna dapat mengirimkannya setelah melakukan perubahan untuk menyelesaikan duplikasi.


### Catatan Tambahan

#### Duplikasi, Referensi, Preload

Tipe bidang yang berbeda (tipe relasi) memiliki logika pemrosesan yang berbeda: **Duplikasi / Referensi / Preload**. **Komponen bidang** dari bidang relasi juga memengaruhi logika pemrosesan ini:

- Select / Record picker: Digunakan untuk **Referensi**
- Sub-form / Sub-table: Digunakan untuk **Duplikasi**

**Duplikasi**

- Bidang biasa akan diduplikasi;
- `hasOne` / `hasMany` hanya bisa diduplikasi (relasi jenis ini tidak boleh menggunakan komponen bidang pilihan seperti pilihan dropdown atau pemilih rekaman; sebaliknya, gunakan komponen sub-formulir atau sub-tabel);
- Perubahan komponen untuk `hasOne` / `hasMany` **tidak akan** mengubah logika pemrosesan (tetap sebagai Duplikasi);
- Untuk bidang relasi yang diduplikasi, semua sub-bidang dapat dipilih.

**Referensi**

- `belongsTo` / `belongsToMany` diperlakukan sebagai Referensi;
- Jika komponen bidang diubah dari "Pilihan dropdown" menjadi "Sub-formulir", relasi akan berubah dari **Referensi menjadi Duplikasi** (setelah menjadi Duplikasi, semua sub-bidang menjadi dapat dipilih).

**Preload**

- Bidang relasi di bawah bidang Referensi diperlakukan sebagai Preload;
- Bidang Preload mungkin berubah menjadi Referensi atau Duplikasi setelah perubahan komponen.

#### Pilih Semua

- Akan mencentang semua **bidang Duplikasi** dan **bidang Referensi**.

#### Rekaman yang dipilih sebagai templat data akan memfilter bidang-bidang berikut:

- Kunci utama (primary key) dari data relasi yang diduplikasi akan difilter; kunci utama untuk Referensi dan Preload tidak difilter;
- Kunci asing (foreign key);
- Bidang yang tidak mengizinkan duplikat (Unik);
- Bidang pengurutan (sort);
- Bidang penomoran otomatis (sequence);
- Kata sandi;
- Dibuat oleh, Tanggal dibuat;
- Terakhir diperbarui oleh, Tanggal pembaruan terakhir.

#### Sinkronisasi bidang formulir

- Secara otomatis mengurai bidang yang dikonfigurasi dalam blok formulir saat ini menjadi bidang templat;
- Setelah mengubah bidang blok formulir (misalnya penyesuaian komponen bidang relasi), Anda harus melakukan sinkronisasi lagi untuk memastikan konsistensi.