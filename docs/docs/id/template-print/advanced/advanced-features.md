---
title: "Template Print - Fitur Lanjutan"
description: "Fitur lanjutan Template Print: update nomor halaman, generate daftar isi, kontrol pagination, cara penyisipan Word dan LibreOffice."
keywords: "Template Print,Fitur Lanjutan,Nomor Halaman,Daftar Isi,Pagination,NocoBase"
---

## Fitur Lanjutan

### Pagination

#### 1. Update Nomor Halaman

##### Sintaks
Cukup sisipkan di software Office.

##### Contoh
Pada Microsoft Word:
- Gunakan fitur "Insert → Page Number"  
  Pada LibreOffice:
- Gunakan fitur "Insert → Field → Page Number"

##### Hasil
Pada laporan yang dihasilkan, nomor halaman setiap halaman akan diupdate secara otomatis.


#### 2. Generate Daftar Isi

##### Sintaks
Cukup sisipkan di software Office.

##### Contoh
Pada Microsoft Word:
- Gunakan fitur "Insert → Index and Tables → Table of Contents"  
  Pada LibreOffice:
- Gunakan fitur "Insert → Table of Contents and Index → Table of Contents, Index, or Bibliography"

##### Hasil
Daftar isi laporan yang dihasilkan akan diupdate otomatis berdasarkan konten dokumen.


#### 3. Repeat Header Tabel

##### Sintaks
Cukup sisipkan di software Office.

##### Contoh
Pada Microsoft Word:
- Klik kanan header tabel → Table Properties → Centang "Repeat as header row at the top of each page"  
  Pada LibreOffice:
- Klik kanan header tabel → Table Properties → tab Text Flow → Centang "Repeat heading"

##### Hasil
Saat tabel melintasi halaman, header tabel otomatis ditampilkan ulang di bagian atas setiap halaman.


### Internasionalisasi (i18n)

#### 1. Terjemahan Teks Statis

##### Sintaks
Gunakan tag `{t(text)}` untuk internasionalisasi teks statis:
```
{t(meeting)}
```

##### Contoh
Pada Template:
```
{t(meeting)} {t(apples)}
```
Pada data JSON atau kamus localization eksternal (contoh untuk "fr-fr") menyediakan terjemahan yang sesuai, seperti "meeting" → "rendez-vous", "apples" → "Pommes".

##### Hasil
Saat menghasilkan laporan, teks akan diganti dengan terjemahan yang sesuai berdasarkan bahasa target.


#### 2. Terjemahan Teks Dinamis

##### Sintaks
Untuk konten data dapat menggunakan formatter `:t`, contoh:
```
{d.id:ifEQ(2):show({t(monday)}):elseShow({t(tuesday)})}
```

##### Contoh
Pada Template:
```
{d.id:ifEQ(2):show({t(monday)}):elseShow({t(tuesday)})}
```
Data JSON dan kamus localization menyediakan terjemahan yang sesuai.

##### Hasil
Berdasarkan pernyataan kondisi, output "lundi" atau "mardi" (dengan bahasa target sebagai contoh).


### Mapping Key-Value

#### 1. Konversi Enum (:convEnum)

##### Sintaks
```
{data:convEnum(nama enum)}
```
Contoh:
```
0:convEnum('ORDER_STATUS')
```

##### Contoh
Pada API options contoh diteruskan:
```json
{
  "enum": {
    "ORDER_STATUS": ["pending", "sent", "delivered"]
  }
}
```
Pada Template:
```
0:convEnum('ORDER_STATUS')
```

##### Hasil
Output "pending"; jika indeks melebihi rentang enum, maka output nilai asli.


### Gambar Dinamis
:::info
Saat ini mendukung file tipe XLSX, DOCX
:::
Anda dapat menyisipkan "gambar dinamis" pada Template dokumen, yang berarti gambar placeholder pada Template akan otomatis diganti dengan gambar nyata berdasarkan data saat render. Prosesnya sangat sederhana, hanya perlu:

1. Menyisipkan gambar sementara sebagai placeholder

2. Mengedit "alt text" gambar tersebut untuk mengatur label field

3. Render dokumen, sistem otomatis menggantinya dengan gambar aktual

Berikut akan kami jelaskan cara operasi DOCX dan XLSX melalui contoh spesifik.


#### Menyisipkan Gambar Dinamis di File DOCX
##### Penggantian Gambar Tunggal

1. Buka Template DOCX Anda, sisipkan gambar sementara (bisa berupa gambar placeholder apa pun, misalnya [gambar biru solid](https://static-docs.nocobase.com/solid-color-image-2025-04-14-11-00-26.png))

:::info
**Penjelasan Format Gambar**

- Saat ini gambar placeholder hanya mendukung tipe PNG, direkomendasikan menggunakan gambar contoh yang kami sediakan [gambar biru solid](https://static-docs.nocobase.com/solid-color-image-2025-04-14-11-00-26.png)
- Gambar render target hanya mendukung gambar PNG, JPG, JPEG, gambar tipe lain mungkin gagal di-render.

**Penjelasan Ukuran Gambar**

Baik DOCX maupun XLSX, ukuran gambar saat render akhir akan mengikuti ukuran gambar sementara di Template. Yaitu, gambar yang sebenarnya diganti akan otomatis di-scale ke ukuran yang sama dengan gambar placeholder yang Anda sisipkan. Jika Anda ingin ukuran gambar setelah render menjadi 150×150, silakan gunakan gambar sementara di Template dan sesuaikan ke ukuran tersebut.
:::

2. Klik kanan gambar ini, edit "Alt Text" -nya, isi label field gambar yang Anda inginkan, contoh `{d.imageUrl}`:
   
![20250414211130-2025-04-14-21-11-31](https://static-docs.nocobase.com/20250414211130-2025-04-14-21-11-31.png)

3. Gunakan data contoh berikut untuk render:
```json
{
  "name": "Apple",
  "imageUrl": "https://images.pexels.com/photos/206959/pexels-photo-206959.jpeg",
}
```

4. Hasil setelah render, gambar sementara akan diganti dengan gambar aktual:

![20250414203444-2025-04-14-20-34-46](https://static-docs.nocobase.com/20250414203444-2025-04-14-20-34-46.png)

##### Penggantian Loop Beberapa Gambar

Jika Anda ingin menyisipkan sekelompok gambar pada Template, contoh daftar Produk, juga dapat diimplementasikan melalui loop, langkah-langkahnya sebagai berikut:
1. Misalkan data Anda sebagai berikut:
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

2. Pada Template DOCX atur area loop, dan sisipkan gambar sementara di setiap item loop, alt text diatur sebagai `{d.products[i].imageUrl}`, sebagai berikut:

![20250414205418-2025-04-14-20-54-19](https://static-docs.nocobase.com/20250414205418-2025-04-14-20-54-19.png)

3. Setelah render, semua gambar sementara akan diganti dengan gambar data masing-masing:
   
![20250414205503-2025-04-14-20-55-05](https://static-docs.nocobase.com/20250414205503-2025-04-14-20-55-05.png)

#### Menyisipkan Gambar Dinamis di File XLSX

Cara operasi pada Template Excel (XLSX) pada dasarnya sama, hanya perhatikan beberapa hal berikut:

1. Setelah menyisipkan gambar, pastikan yang dipilih adalah "gambar dalam sel", bukan gambar yang melayang di atas sel.

![20250414211643-2025-04-14-21-16-45](https://static-docs.nocobase.com/20250414211643-2025-04-14-21-16-45.png)

2. Setelah memilih sel klik untuk melihat "Alt Text" dan isi label field, contoh `{d.imageUrl}`.

### Barcode
:::info
Saat ini mendukung file tipe XLSX, DOCX
:::

#### Generate Barcode (seperti QR Code)

Cara generate barcode sama dengan gambar dinamis, hanya perlu tiga langkah:

1. Sisipkan gambar sementara pada Template, untuk menandai posisi barcode

2. Edit "alt text" gambar, tulis label field format barcode, contoh `{d.code:barcode(qrcode)}`, di mana `qrcode` adalah tipe barcode (lihat daftar dukungan di bawah)

![20250414214626-2025-04-14-21-46-28](https://static-docs.nocobase.com/20250414214626-2025-04-14-21-46-28.png)

3. Setelah render, gambar placeholder akan diganti dengan gambar barcode yang sesuai:
   
![20250414214925-2025-04-14-21-49-26](https://static-docs.nocobase.com/20250414214925-2025-04-14-21-49-26.png)

#### Tipe Barcode yang Didukung

| Nama Barcode | Tipe   |
| -------- | ------ |
| QR Code   | qrcode |



