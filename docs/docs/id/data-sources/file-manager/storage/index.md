:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Gambaran Umum

## Mesin Bawaan

Saat ini, NocoBase mendukung jenis mesin bawaan berikut:

- [Penyimpanan Lokal](./local.md)
- [Alibaba Cloud OSS](./aliyun-oss.md)
- [Amazon S3](./amazon-s3.md)
- [Tencent Cloud COS](./tencent-cos.md)

Saat instalasi sistem, mesin penyimpanan lokal akan otomatis ditambahkan dan dapat langsung digunakan. Anda juga bisa menambahkan mesin baru atau mengedit parameter mesin yang sudah ada.

## Parameter Mesin Umum

Selain parameter khusus untuk setiap jenis mesin, berikut adalah parameter umum (menggunakan penyimpanan lokal sebagai contoh):

![Contoh Konfigurasi Mesin Penyimpanan Berkas](https://static-docs.nocobase.com/20240529115151.png)

### Judul

Nama mesin penyimpanan, digunakan untuk identifikasi manual.

### Nama Sistem

Nama sistem mesin penyimpanan, digunakan untuk identifikasi oleh sistem. Harus unik di seluruh sistem. Jika dibiarkan kosong, sistem akan secara otomatis membuat nama acak.

### URL Dasar Akses

Bagian awalan alamat URL yang dapat diakses secara eksternal untuk berkas ini. Ini bisa berupa URL dasar CDN, contohnya: "`https://cdn.nocobase.com/app`" (tanpa tanda "`/`" di akhir).

### Jalur

Jalur relatif yang digunakan saat menyimpan berkas. Bagian ini juga akan otomatis digabungkan ke URL akhir saat diakses. Contohnya: "`user/avatar`" (tanpa tanda "`/`" di awal atau akhir).

### Batas Ukuran Berkas

Batas ukuran untuk berkas yang diunggah ke mesin penyimpanan ini. Berkas yang melebihi ukuran yang ditetapkan tidak dapat diunggah. Batas default sistem adalah 20MB, dan batas maksimum yang dapat disesuaikan adalah 1GB.

### Jenis Berkas

Anda dapat membatasi jenis berkas yang dapat diunggah, menggunakan format deskripsi sintaks [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types). Contohnya: `image/*` mewakili berkas gambar. Beberapa jenis dapat dipisahkan dengan koma, seperti: `image/*, application/pdf` yang berarti mengizinkan berkas jenis gambar dan PDF.

### Mesin Penyimpanan Default

Setelah dicentang, ini akan ditetapkan sebagai mesin penyimpanan default sistem. Jika kolom lampiran atau **koleksi** berkas tidak menentukan mesin penyimpanan, berkas yang diunggah akan disimpan ke mesin penyimpanan default. Mesin penyimpanan default tidak dapat dihapus.

### Pertahankan Berkas Saat Menghapus Catatan

Setelah dicentang, berkas yang telah diunggah di mesin penyimpanan akan tetap dipertahankan meskipun catatan data di tabel lampiran atau **koleksi** berkas dihapus. Secara default, opsi ini tidak dicentang, yang berarti berkas di mesin penyimpanan akan ikut terhapus bersama catatan.

:::info{title=Tips}
Setelah berkas diunggah, jalur akses akhir akan terbentuk dari gabungan beberapa bagian:

```
<URL Dasar Akses>/<Jalur>/<NamaBerkas><Ekstensi>
```

Contohnya: `https://cdn.nocobase.com/app/user/avatar/20240529115151.png`.
:::