:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

## Fitur Lanjutan

### Penomoran Halaman

#### 1. Pembaruan Nomor Halaman

##### Sintaks
Cukup sisipkan di perangkat lunak Office Anda.

##### Contoh
Di Microsoft Word:
- Gunakan fungsi "Sisipkan → Nomor Halaman"
Di LibreOffice:
- Gunakan fungsi "Sisipkan → Bidang → Nomor Halaman"

##### Hasil
Dalam laporan yang dihasilkan, nomor halaman di setiap halaman akan diperbarui secara otomatis.

#### 2. Pembuatan Daftar Isi

##### Sintaks
Cukup sisipkan di perangkat lunak Office Anda.

##### Contoh
Di Microsoft Word:
- Gunakan fungsi "Sisipkan → Indeks dan Tabel → Daftar Isi"
Di LibreOffice:
- Gunakan fungsi "Sisipkan → Daftar Isi dan Indeks → Daftar, Indeks, atau Bibliografi"

##### Hasil
Daftar isi laporan yang dihasilkan akan diperbarui secara otomatis berdasarkan konten dokumen.

#### 3. Pengulangan Header Tabel

##### Sintaks
Cukup sisipkan di perangkat lunak Office Anda.

##### Contoh
Di Microsoft Word:
- Klik kanan header tabel → Properti Tabel → Centang "Ulangi sebagai baris judul di bagian atas setiap halaman"
Di LibreOffice:
- Klik kanan header tabel → Properti Tabel → Tab Aliran Teks → Centang "Ulangi judul"

##### Hasil
Ketika tabel membentang beberapa halaman, header akan secara otomatis diulang di bagian atas setiap halaman.

### Internasionalisasi (i18n)

#### 1. Terjemahan Teks Statis

##### Sintaks
Gunakan tag `{t(teks)}` untuk menginternasionalisasi teks statis:
```
{t(meeting)}
```

##### Contoh
Dalam templat:
```
{t(meeting)} {t(apples)}
```
Data JSON atau kamus lokalisasi eksternal (misalnya untuk "fr-fr") menyediakan terjemahan yang sesuai, seperti "meeting" → "rendez-vous", "apples" → "Pommes".

##### Hasil
Saat membuat laporan, teks akan diganti dengan terjemahan yang sesuai berdasarkan bahasa target.

#### 2. Terjemahan Teks Dinamis

##### Sintaks
Untuk konten data, gunakan pemformat `:t`, misalnya:
```
{d.id:ifEQ(2):show({t(monday)}):elseShow({t(tuesday)})}
```

##### Contoh
Dalam templat:
```
{d.id:ifEQ(2):show({t(monday)}):elseShow({t(tuesday)})}
```
Data JSON dan kamus lokalisasi menyediakan terjemahan yang sesuai.

##### Hasil
Berdasarkan kondisi, hasilnya akan berupa "lundi" atau "mardi" (menggunakan bahasa target sebagai contoh).

### Pemetaan Kunci-Nilai

#### 1. Konversi Enum (:convEnum)

##### Sintaks
```
{data:convEnum(namaEnum)}
```
Misalnya:
```
0:convEnum('ORDER_STATUS')
```

##### Contoh
Dalam contoh opsi API, berikut adalah yang disediakan:
```json
{
  "enum": {
    "ORDER_STATUS": ["pending", "sent", "delivered"]
  }
}
```
Dalam templat:
```
0:convEnum('ORDER_STATUS')
```

##### Hasil
Menghasilkan "pending"; jika indeks melebihi rentang enumerasi, nilai asli akan dihasilkan.

### Gambar Dinamis
:::info
Saat ini mendukung tipe file XLSX dan DOCX
:::
Anda dapat menyisipkan "gambar dinamis" dalam templat dokumen, yang berarti gambar placeholder dalam templat akan secara otomatis diganti dengan gambar asli saat rendering berdasarkan data. Proses ini sangat sederhana dan hanya memerlukan:

1. Sisipkan gambar sementara sebagai placeholder

2. Edit "Teks Alternatif (Alt Text)" gambar tersebut untuk mengatur label bidang

3. Render dokumen, dan sistem akan secara otomatis menggantinya dengan gambar asli

Di bawah ini kami akan menjelaskan metode operasi untuk DOCX dan XLSX melalui contoh-contoh spesifik.

#### Menyisipkan Gambar Dinamis dalam File DOCX
##### Penggantian Gambar Tunggal

1. Buka templat DOCX Anda dan sisipkan gambar sementara (bisa berupa gambar placeholder apa pun, seperti [gambar biru solid](https://static-docs.nocobase.com/solid-color-image-2025-04-14-11-00-26.png))

:::info
**Instruksi Format Gambar**

- Saat ini, gambar placeholder hanya mendukung format PNG. Kami merekomendasikan penggunaan contoh [gambar biru solid](https://static-docs.nocobase.com/solid-color-image-2025-04-14-11-00-26.png) yang kami sediakan.
- Gambar yang akan dirender hanya mendukung format PNG, JPG, JPEG. Tipe gambar lain mungkin gagal dirender.

**Instruksi Ukuran Gambar**

Baik untuk DOCX maupun XLSX, ukuran gambar hasil render akhir akan mengikuti dimensi gambar sementara dalam templat. Artinya, gambar pengganti yang sebenarnya akan secara otomatis diskalakan agar sesuai dengan ukuran gambar placeholder yang Anda sisipkan. Jika Anda ingin ukuran gambar hasil render adalah 150×150, silakan gunakan gambar sementara dalam templat dan sesuaikan ukurannya.
:::

2. Klik kanan pada gambar ini, edit "Teks Alternatif (Alt Text)"-nya, dan isi label bidang gambar yang ingin Anda sisipkan, misalnya `{d.imageUrl}`:
   
![20250414211130-2025-04-14-21-11-31](https://static-docs.nocobase.com/20250414211130-2025-04-14-21-11-31.png)

3. Gunakan data contoh berikut untuk rendering:
```json
{
  "name": "Apple",
  "imageUrl": "https://images.pexels.com/photos/206959/pexels-photo-206959.jpeg",
}
```

4. Dalam hasil rendering, gambar sementara akan diganti dengan gambar asli:

![20250414203444-2025-04-14-20-34-46](https://static-docs.nocobase.com/20250414203444-2025-04-14-20-34-46.png)

##### Penggantian Gambar Berulang (Loop)

Jika Anda ingin menyisipkan sekelompok gambar dalam templat, misalnya daftar produk, Anda juga dapat mengimplementasikannya melalui perulangan. Langkah-langkah spesifiknya adalah sebagai berikut:
1. Asumsikan data Anda adalah sebagai berikut:
```json
{
  "products": [
    {
      "name": "Apple",
      "imageUrl": "https://images.pexels.com/photos/206959/pexels-photo-206959.jpeg",
    },
    {
      "name": "Banana",
      "imageUrl": "https://images.pexels.com/photos/61127/pexels-photo-61127.jpeg",
    },
  ]
}
```

2. Atur area perulangan dalam templat DOCX, dan sisipkan gambar sementara di setiap item perulangan dengan Teks Alternatif diatur ke `{d.products[i].imageUrl}`, seperti yang ditunjukkan di bawah ini:

![20250414205418-2025-04-14-20-54-19](https://static-docs.nocobase.com/20250414205418-2025-04-14-20-54-19.png)

3. Setelah rendering, semua gambar sementara akan diganti dengan gambar data masing-masing:
   
![20250414205503-2025-04-14-20-55-05](https://static-docs.nocobase.com/20250414205503-2025-04-14-20-55-05.png)

#### Menyisipkan Gambar Dinamis dalam File XLSX

Metode operasi dalam templat Excel (XLSX) pada dasarnya sama, hanya perlu diperhatikan beberapa poin berikut:

1. Setelah menyisipkan gambar, pastikan Anda memilih "gambar di dalam sel", bukan gambar yang mengambang di atas sel.

![20250414211643-2025-04-14-21-16-45](https://static-docs.nocobase.com/20250414211643-2025-04-14-21-16-45.png)

2. Setelah memilih sel, klik untuk melihat "Teks Alternatif" untuk mengisi label bidang, seperti `{d.imageUrl}`.

### Kode Batang
:::info
Saat ini mendukung tipe file XLSX dan DOCX
:::

#### Membuat Kode Batang (seperti kode QR)

Pembuatan kode batang bekerja dengan cara yang sama seperti Gambar Dinamis, hanya memerlukan tiga langkah:

1. Sisipkan gambar sementara dalam templat untuk menandai posisi kode batang

2. Edit "Teks Alternatif" gambar dan tuliskan label bidang format kode batang, misalnya `{d.code:barcode(qrcode)}`, di mana `qrcode` adalah tipe kode batang (lihat daftar yang didukung di bawah)

![20250414214626-2025-04-14-21-46-28](https://static-docs.nocobase.com/20250414214626-2025-04-14-21-46-28.png)

3. Setelah rendering, gambar placeholder akan secara otomatis diganti dengan gambar kode batang yang sesuai:
   
![20250414214925-2025-04-14-21-49-26](https://static-docs.nocobase.com/20250414214925-2025-04-14-21-49-26.png)

#### Tipe Kode Batang yang Didukung

| Nama Kode Batang | Tipe   |
| ---------------- | ------ |
| Kode QR          | qrcode |