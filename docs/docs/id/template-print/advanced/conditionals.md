:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

## Pernyataan Kondisional

Pernyataan kondisional memungkinkan Anda untuk mengontrol tampilan atau penyembunyian konten dalam dokumen secara dinamis berdasarkan nilai data. Ada tiga cara utama untuk menulis kondisi:

- **Kondisi Sebaris (Inline)**: Langsung menampilkan teks (atau menggantinya dengan teks lain).
- **Blok Kondisional**: Menampilkan atau menyembunyikan bagian dokumen, cocok untuk beberapa tag, paragraf, tabel, dan lainnya.
- **Kondisi Cerdas**: Langsung menghapus atau mempertahankan elemen target (seperti baris, paragraf, gambar, dll.) dengan satu tag, untuk sintaks yang lebih ringkas.

Semua kondisi dimulai dengan *formatter* evaluasi logis (misalnya, `ifEQ`, `ifGT`, dll.), diikuti oleh *formatter* aksi (seperti `show`, `elseShow`, `drop`, `keep`, dll.).

### Ikhtisar

Operator logis dan *formatter* aksi yang didukung dalam pernyataan kondisional meliputi:

- **Operator Logis**
  - **ifEQ(value)**: Memeriksa apakah data sama dengan nilai yang ditentukan.
  - **ifNE(value)**: Memeriksa apakah data tidak sama dengan nilai yang ditentukan.
  - **ifGT(value)**: Memeriksa apakah data lebih besar dari nilai yang ditentukan.
  - **ifGTE(value)**: Memeriksa apakah data lebih besar dari atau sama dengan nilai yang ditentukan.
  - **ifLT(value)**: Memeriksa apakah data lebih kecil dari nilai yang ditentukan.
  - **ifLTE(value)**: Memeriksa apakah data lebih kecil dari atau sama dengan nilai yang ditentukan.
  - **ifIN(value)**: Memeriksa apakah data terkandung dalam sebuah *array* atau *string*.
  - **ifNIN(value)**: Memeriksa apakah data tidak terkandung dalam sebuah *array* atau *string*.
  - **ifEM()**: Memeriksa apakah data kosong (misalnya, `null`, `undefined`, *string* kosong, *array* kosong, atau objek kosong).
  - **ifNEM()**: Memeriksa apakah data tidak kosong.
  - **ifTE(type)**: Memeriksa apakah tipe data sama dengan tipe yang ditentukan (misalnya, "string", "number", "boolean", dll.).
  - **and(value)**: Logika "dan", digunakan untuk menghubungkan beberapa kondisi.
  - **or(value)**: Logika "atau", digunakan untuk menghubungkan beberapa kondisi.

- **Formatter Aksi**
  - **:show(text) / :elseShow(text)**: Digunakan dalam kondisi sebaris untuk langsung menampilkan teks yang ditentukan.
  - **:hideBegin / :hideEnd** dan **:showBegin / :showEnd**: Digunakan dalam blok kondisional untuk menyembunyikan atau menampilkan bagian dokumen.
  - **:drop(element) / :keep(element)**: Digunakan dalam kondisi cerdas untuk menghapus atau mempertahankan elemen dokumen yang ditentukan.

Bagian-bagian berikut akan memperkenalkan sintaksis terperinci, contoh, dan hasil untuk setiap penggunaan.

### Kondisi Sebaris

#### 1. :show(text) / :elseShow(text)

##### Sintaksis
```
{data:kondisi:show(teks)}
{data:kondisi:show(teks):elseShow(teks alternatif)}
```

##### Contoh
Asumsikan data adalah:
```json
{
  "val2": 2,
  "val5": 5
}
```
Templatnya adalah sebagai berikut:
```
val2 = {d.val2:ifGT(3):show('high')}
val2 = {d.val2:ifGT(3):show('high'):elseShow('low')}
val5 = {d.val5:ifGT(3):show('high')}
```

##### Hasil
```
val2 = 2
val2 = low
val5 = high
```

#### 2. Switch Case (Pernyataan Kondisional Berganda)

##### Sintaksis
Gunakan *formatter* kondisi berurutan untuk membangun struktur yang mirip dengan *switch-case*:
```
{data:ifEQ(nilai1):show(hasil1):ifEQ(nilai2):show(hasil2):elseShow(hasil default)}
```
Atau capai hal yang sama dengan operator `or`:
```
{data:ifEQ(nilai1):show(hasil1):or(data):ifEQ(nilai2):show(hasil2):elseShow(hasil default)}
```

##### Contoh
Data:
```json
{
  "val1": 1,
  "val2": 2,
  "val3": 3
}
```
Templat:
```
val1 = {d.val1:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
val2 = {d.val2:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
val3 = {d.val3:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
```

##### Hasil
```
val1 = A
val2 = B
val3 = C
```

#### 3. Pernyataan Kondisional Multivariabel

##### Sintaksis
Gunakan operator logis `and`/`or` untuk menguji beberapa variabel:
```
{data1:ifEQ(kondisi1):and(.data2):ifEQ(kondisi2):show(hasil):elseShow(hasil alternatif)}
{data1:ifEQ(kondisi1):or(.data2):ifEQ(kondisi2):show(hasil):elseShow(hasil alternatif)}
```

##### Contoh
Data:
```json
{
  "val2": 2,
  "val5": 5
}
```
Templat:
```
and = {d.val2:ifEQ(1):and(.val5):ifEQ(5):show(OK):elseShow(KO)}
or = {d.val2:ifEQ(1):or(.val5):ifEQ(5):show(OK):elseShow(KO)}
```

##### Hasil
```
and = KO
or = OK
```

### Operator Logis dan Formatter

Dalam bagian-bagian berikut, *formatter* yang dijelaskan menggunakan sintaksis kondisi sebaris dengan format berikut:
```
{data:formatter(parameter):show(teks):elseShow(teks alternatif)}
```

#### 1. :and(value)

##### Sintaksis
```
{data:ifEQ(nilai):and(data baru atau kondisi):ifGT(nilai lain):show(teks):elseShow(teks alternatif)}
```

##### Contoh
```
{d.car:ifEQ('delorean'):and(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### Hasil
Jika `d.car` sama dengan `'delorean'` dan `d.speed` lebih besar dari 80, hasilnya adalah `TravelInTime`; jika tidak, hasilnya adalah `StayHere`.

#### 2. :or(value)

##### Sintaksis
```
{data:ifEQ(nilai):or(data baru atau kondisi):ifGT(nilai lain):show(teks):elseShow(teks alternatif)}
```

##### Contoh
```
{d.car:ifEQ('delorean'):or(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### Hasil
Jika `d.car` sama dengan `'delorean'` atau `d.speed` lebih besar dari 80, hasilnya adalah `TravelInTime`; jika tidak, hasilnya adalah `StayHere`.

#### 3. :ifEM()

##### Sintaksis
```
{data:ifEM():show(teks):elseShow(teks alternatif)}
```

##### Contoh
```
null:ifEM():show('Result true'):elseShow('Result false')
[]:ifEM():show('Result true'):elseShow('Result false')
```

##### Hasil
Untuk `null` atau *array* kosong, hasilnya adalah `Result true`; jika tidak, hasilnya adalah `Result false`.

#### 4. :ifNEM()

##### Sintaksis
```
{data:ifNEM():show(teks):elseShow(teks alternatif)}
```

##### Contoh
```
0:ifNEM():show('Result true'):elseShow('Result false')
'homer':ifNEM():show('Result true'):elseShow('Result false')
```

##### Hasil
Untuk data yang tidak kosong (seperti angka 0 atau *string* 'homer'), hasilnya adalah `Result true`; untuk data kosong, hasilnya adalah `Result false`.

#### 5. :ifEQ(value)

##### Sintaksis
```
{data:ifEQ(nilai):show(teks):elseShow(teks alternatif)}
```

##### Contoh
```
100:ifEQ(100):show('Result true'):elseShow('Result false')
'homer':ifEQ('homer'):show('Result true'):elseShow('Result false')
```

##### Hasil
Jika data sama dengan nilai yang ditentukan, hasilnya adalah `Result true`; jika tidak, hasilnya adalah `Result false`.

#### 6. :ifNE(value)

##### Sintaksis
```
{data:ifNE(nilai):show(teks):elseShow(teks alternatif)}
```

##### Contoh
```
100:ifNE(100):show('Result true'):elseShow('Result false')
100:ifNE(101):show('Result true'):elseShow('Result false')
```

##### Hasil
Contoh pertama menghasilkan `Result false`, sedangkan contoh kedua menghasilkan `Result true`.

#### 7. :ifGT(value)

##### Sintaksis
```
{data:ifGT(nilai):show(teks):elseShow(teks alternatif)}
```

##### Contoh
```
1234:ifGT(1):show('Result true'):elseShow('Result false')
-23:ifGT(19):show('Result true'):elseShow('Result false')
```

##### Hasil
Contoh pertama menghasilkan `Result true`, dan contoh kedua menghasilkan `Result false`.

#### 8. :ifGTE(value)

##### Sintaksis
```
{data:ifGTE(nilai):show(teks):elseShow(teks alternatif)}
```

##### Contoh
```
50:ifGTE(-29):show('Result true'):elseShow('Result false')
1:ifGTE(768):show('Result true'):elseShow('Result false')
```

##### Hasil
Contoh pertama menghasilkan `Result true`, sedangkan contoh kedua menghasilkan `Result false`.

#### 9. :ifLT(value)

##### Sintaksis
```
{data:ifLT(nilai):show(teks):elseShow(teks alternatif)}
```

##### Contoh
```
-23:ifLT(19):show('Result true'):elseShow('Result false')
1290:ifLT(768):show('Result true'):elseShow('Result false')
```

##### Hasil
Contoh pertama menghasilkan `Result true`, dan contoh kedua menghasilkan `Result false`.

#### 10. :ifLTE(value)

##### Sintaksis
```
{data:ifLTE(nilai):show(teks):elseShow(teks alternatif)}
```

##### Contoh
```
5:ifLTE(5):show('Result true'):elseShow('Result false')
1290:ifLTE(768):show('Result true'):elseShow('Result false')
```

##### Hasil
Contoh pertama menghasilkan `Result true`, dan contoh kedua menghasilkan `Result false`.

#### 11. :ifIN(value)

##### Sintaksis
```
{data:ifIN(nilai):show(teks):elseShow(teks alternatif)}
```

##### Contoh
```
'car is broken':ifIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifIN(2):show('Result true'):elseShow('Result false')
```

##### Hasil
Kedua contoh menghasilkan `Result true` (karena *string* tersebut mengandung 'is', dan *array* tersebut mengandung 2).

#### 12. :ifNIN(value)

##### Sintaksis
```
{data:ifNIN(nilai):show(teks):elseShow(teks alternatif)}
```

##### Contoh
```
'car is broken':ifNIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifNIN(2):show('Result true'):elseShow('Result false')
```

##### Hasil
Contoh pertama menghasilkan `Result false` (karena *string* tersebut mengandung 'is'), dan contoh kedua menghasilkan `Result false` (karena *array* tersebut mengandung 2).

#### 13. :ifTE(type)

##### Sintaksis
```
{data:ifTE('tipe'):show(teks):elseShow(teks alternatif)}
```

##### Contoh
```
'homer':ifTE('string'):show('Result true'):elseShow('Result false')
10.5:ifTE('number'):show('Result true'):elseShow('Result false')
```

##### Hasil
Contoh pertama menghasilkan `Result true` (karena 'homer' adalah *string*), dan contoh kedua menghasilkan `Result true` (karena 10.5 adalah angka).

### Blok Kondisional

Blok kondisional digunakan untuk menampilkan atau menyembunyikan bagian dokumen, biasanya untuk menyertakan beberapa tag atau seluruh blok teks.

#### 1. :showBegin / :showEnd

##### Sintaksis
```
{data:ifEQ(kondisi):showBegin}
Konten blok dokumen
{data:showEnd}
```

##### Contoh
Data:
```json
{
  "toBuy": true
}
```
Templat:
```
Banana{d.toBuy:ifEQ(true):showBegin}
Apple
Pineapple
{d.toBuy:showEnd}Grapes
```

##### Hasil
Ketika kondisi terpenuhi, konten di antaranya ditampilkan:
```
Banana
Apple
Pineapple
Grapes
```

#### 2. :hideBegin / :hideEnd

##### Sintaksis
```
{data:ifEQ(kondisi):hideBegin}
Konten blok dokumen
{data:hideEnd}
```

##### Contoh
Data:
```json
{
  "toBuy": true
}
```
Templat:
```
Banana{d.toBuy:ifEQ(true):hideBegin}
Apple
Pineapple
{d.toBuy:hideEnd}Grapes
```

##### Hasil
Ketika kondisi terpenuhi, konten di antaranya disembunyikan, menghasilkan:
```
Banana
Grapes
```