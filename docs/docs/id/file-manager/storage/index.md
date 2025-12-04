:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Ikhtisar

## Pendahuluan

Mesin penyimpanan digunakan untuk menyimpan berkas ke layanan tertentu, termasuk penyimpanan lokal (disimpan ke hard drive server), penyimpanan cloud, dan lainnya.

Sebelum mengunggah berkas apa pun, Anda perlu mengonfigurasi mesin penyimpanan terlebih dahulu. Sistem akan secara otomatis menambahkan mesin penyimpanan lokal saat instalasi, yang dapat langsung Anda gunakan. Anda juga dapat menambahkan mesin baru atau mengedit parameter mesin yang sudah ada.

## Jenis Mesin Penyimpanan

Saat ini, NocoBase mendukung jenis mesin berikut secara bawaan:

- [Penyimpanan Lokal](./local)
- [Amazon S3](./amazon-s3)
- [Aliyun OSS](./aliyun-oss)
- [Tencent COS](./tencent-cos)
- [S3 Pro](./s3-pro)

Sistem akan secara otomatis menambahkan mesin penyimpanan lokal saat instalasi, yang dapat langsung Anda gunakan. Anda juga dapat menambahkan mesin baru atau mengedit parameter mesin yang sudah ada.

## Parameter Umum

Selain parameter khusus untuk setiap jenis mesin, berikut adalah parameter umum (menggunakan penyimpanan lokal sebagai contoh):

![Contoh konfigurasi mesin penyimpanan berkas](https://static-docs.nocobase.com/20240529115151.png)

### Judul

Nama mesin penyimpanan, digunakan untuk identifikasi manual.

### Nama Sistem

Nama sistem mesin penyimpanan, digunakan untuk identifikasi oleh sistem. Nama ini harus unik dalam sistem. Jika dikosongkan, sistem akan secara otomatis menghasilkan nama acak.

### Prefiks URL Akses Publik

Bagian prefiks dari alamat URL yang dapat diakses publik untuk berkas. Ini bisa berupa URL dasar CDN, seperti: "`https://cdn.nocobase.com/app`" (tidak perlu menyertakan tanda garis miring "/" di akhir).

### Jalur

Jalur relatif yang digunakan saat menyimpan berkas. Bagian ini juga akan secara otomatis ditambahkan ke URL akhir saat diakses. Contoh: "`user/avatar`" (tidak perlu menyertakan tanda garis miring "/" di awal atau akhir).

### Batas Ukuran Berkas

Batas ukuran untuk berkas yang diunggah ke mesin penyimpanan ini. Berkas yang melebihi ukuran yang ditetapkan tidak akan dapat diunggah. Batas default sistem adalah 20MB, dan dapat disesuaikan hingga maksimum 1GB.

### Jenis Berkas

Anda dapat membatasi jenis berkas yang dapat diunggah, menggunakan format deskripsi sintaks [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types). Contoh: `image/*` mewakili berkas gambar. Beberapa jenis dapat dipisahkan dengan koma, seperti: `image/*, application/pdf` yang berarti mengizinkan berkas gambar dan PDF.

### Mesin Penyimpanan Default

Setelah dicentang, ini akan diatur sebagai mesin penyimpanan default sistem. Ketika bidang lampiran atau **koleksi** berkas tidak menentukan mesin penyimpanan, berkas yang diunggah akan disimpan ke mesin penyimpanan default. Mesin penyimpanan default tidak dapat dihapus.

### Pertahankan Berkas Saat Rekaman Dihapus

Setelah dicentang, berkas yang sudah diunggah di mesin penyimpanan akan tetap dipertahankan meskipun rekaman data di tabel lampiran atau **koleksi** berkas dihapus. Secara default, opsi ini tidak dicentang, yang berarti berkas di mesin penyimpanan akan dihapus bersamaan dengan rekaman.

:::info{title=Tips}
Setelah berkas diunggah, jalur akses akhirnya akan terbentuk dari gabungan beberapa bagian:

```
<Prefiks URL Akses Publik>/<Jalur>/<Nama Berkas><Ekstensi>
```

Contoh: `https://cdn.nocobase.com/app/user/avatar/20240529115151.png`.
:::