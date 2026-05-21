---
title: "conditionals"
description: "Pernyataan kondisi memungkinkan pengontrolan dinamis tampilan atau penyembunyian konten dalam dokumen berdasarkan nilai data. Tersedia tiga cara penulisan kondisi utama: - **Kondisi Inline**: Output teks langsung (atau diganti dengan teks lain). - **Blok Kondisi**: Menampilkan atau menyembunyikan area dalam dokumen, cocok untuk beberapa tag, paragraf, tabel, dll."
keywords: "conditionals,NocoBase"
---

## Pernyataan Kondisi

Pernyataan kondisi memungkinkan pengontrolan dinamis tampilan atau penyembunyian konten dalam dokumen berdasarkan nilai data. Tersedia tiga cara penulisan kondisi utama:

- **Kondisi Inline**: Output teks langsung (atau diganti dengan teks lain).
- **Blok Kondisi**: Menampilkan atau menyembunyikan area dalam dokumen, cocok untuk beberapa tag, paragraf, tabel, dll.
- **Kondisi Cerdas**: Menghapus atau mempertahankan elemen target (seperti baris, paragraf, gambar, dll.) langsung melalui satu tag, sintaks lebih ringkas.

Semua kondisi dimulai dengan formatter logika (contoh ifEQ, ifGT, dll.), diikuti dengan formatter Action (seperti show, elseShow, drop, keep, dll.).


### Ikhtisar

Operator logika dan formatter Action yang didukung dalam pernyataan kondisi termasuk:

- **Operator Logika**
  - **ifEQ(value)**: Menentukan apakah data sama dengan nilai yang ditentukan
  - **ifNE(value)**: Menentukan apakah data tidak sama dengan nilai yang ditentukan
  - **ifGT(value)**: Menentukan apakah data lebih besar dari nilai yang ditentukan
  - **ifGTE(value)**: Menentukan apakah data lebih besar dari atau sama dengan nilai yang ditentukan
  - **ifLT(value)**: Menentukan apakah data lebih kecil dari nilai yang ditentukan
  - **ifLTE(value)**: Menentukan apakah data lebih kecil dari atau sama dengan nilai yang ditentukan
  - **ifIN(value)**: Menentukan apakah data terdapat dalam array atau string
  - **ifNIN(value)**: Menentukan apakah data tidak terdapat dalam array atau string
  - **ifEM()**: Menentukan apakah data kosong (seperti null, undefined, string kosong, array kosong, atau objek kosong)
  - **ifNEM()**: Menentukan apakah data tidak kosong
  - **ifTE(type)**: Menentukan apakah tipe data sama dengan tipe yang ditentukan (contoh "string", "number", "boolean", dll.)
  - **and(value)**: Logika "AND", digunakan untuk menghubungkan beberapa kondisi
  - **or(value)**: Logika "OR", digunakan untuk menghubungkan beberapa kondisi

- **Formatter Action**
  - **:show(text) / :elseShow(text)**: Digunakan untuk kondisi inline, output teks langsung
  - **:hideBegin / :hideEnd** dan **:showBegin / :showEnd**: Digunakan untuk blok kondisi, menyembunyikan atau menampilkan blok dokumen
  - **:drop(element) / :keep(element)**: Digunakan untuk kondisi cerdas, menghapus atau mempertahankan elemen dokumen yang ditentukan

Selanjutnya akan dijelaskan sintaks detail, contoh, dan hasil dari setiap penggunaan.


### Kondisi Inline

#### 1. :show(text) / :elseShow(text)

##### Sintaks
```
{data:kondisi:show(teks)}
{data:kondisi:show(teks):elseShow(teks alternatif)}
```

##### Contoh
Misalkan datanya adalah:
```json
{
  "val2": 2,
  "val5": 5
}
```
Template sebagai berikut:
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


#### 2. Switch Case (Pernyataan Kondisi Multi-level)

##### Sintaks
Gunakan formatter kondisi yang berurutan untuk membangun struktur seperti switch-case:
```
{data:ifEQ(nilai1):show(hasil1):ifEQ(nilai2):show(hasil2):elseShow(hasil default)}
```
Atau diimplementasikan dengan operator or:
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
Template:
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


#### 3. Pernyataan Kondisi Multi-variabel

##### Sintaks
Menggunakan operator logika and/or dapat menguji beberapa variabel:
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
Template:
```
and = {d.val2:ifEQ(1):and(.val5):ifEQ(5):show(OK):elseShow(KO)}
or = {d.val2:ifEQ(1):or(.val5):ifEQ(5):show(OK):elseShow(KO)}
```

##### Hasil
```
and = KO
or = OK
```


### Operator Logika dan Formatter

Formatter yang diperkenalkan di setiap bagian berikut menggunakan bentuk kondisi inline, format sintaksnya:
```
{data:formatter(parameter):show(teks):elseShow(teks alternatif)}
```

#### 1. :and(value)

##### Sintaks
```
{data:ifEQ(nilai):and(data atau kondisi baru):ifGT(nilai lain):show(teks):elseShow(teks alternatif)}
```

##### Contoh
```
{d.car:ifEQ('delorean'):and(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### Hasil
Jika `d.car` sama dengan `'delorean'` dan `d.speed` lebih besar dari 80, maka output `TravelInTime`; jika tidak output `StayHere`.


#### 2. :or(value)

##### Sintaks
```
{data:ifEQ(nilai):or(data atau kondisi baru):ifGT(nilai lain):show(teks):elseShow(teks alternatif)}
```

##### Contoh
```
{d.car:ifEQ('delorean'):or(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### Hasil
Jika `d.car` sama dengan `'delorean'` atau `d.speed` lebih besar dari 80, maka output `TravelInTime`; jika tidak output `StayHere`.


#### 3. :ifEM()

##### Sintaks
```
{data:ifEM():show(teks):elseShow(teks alternatif)}
```

##### Contoh
```
null:ifEM():show('Result true'):elseShow('Result false')
[]:ifEM():show('Result true'):elseShow('Result false')
```

##### Hasil
Untuk `null` atau array kosong, output `Result true`; jika tidak output `Result false`.


#### 4. :ifNEM()

##### Sintaks
```
{data:ifNEM():show(teks):elseShow(teks alternatif)}
```

##### Contoh
```
0:ifNEM():show('Result true'):elseShow('Result false')
'homer':ifNEM():show('Result true'):elseShow('Result false')
```

##### Hasil
Untuk data tidak kosong (seperti angka 0 atau string 'homer'), output `Result true`; data kosong output `Result false`.


#### 5. :ifEQ(value)

##### Sintaks
```
{data:ifEQ(nilai):show(teks):elseShow(teks alternatif)}
```

##### Contoh
```
100:ifEQ(100):show('Result true'):elseShow('Result false')
'homer':ifEQ('homer'):show('Result true'):elseShow('Result false')
```

##### Hasil
Jika data sama dengan nilai yang ditentukan output `Result true`, jika tidak output `Result false`.


#### 6. :ifNE(value)

##### Sintaks
```
{data:ifNE(nilai):show(teks):elseShow(teks alternatif)}
```

##### Contoh
```
100:ifNE(100):show('Result true'):elseShow('Result false')
100:ifNE(101):show('Result true'):elseShow('Result false')
```

##### Hasil
Contoh pertama output `Result false`, contoh kedua output `Result true`.


#### 7. :ifGT(value)

##### Sintaks
```
{data:ifGT(nilai):show(teks):elseShow(teks alternatif)}
```

##### Contoh
```
1234:ifGT(1):show('Result true'):elseShow('Result false')
-23:ifGT(19):show('Result true'):elseShow('Result false')
```

##### Hasil
Contoh pertama output `Result true`, contoh kedua output `Result false`.


#### 8. :ifGTE(value)

##### Sintaks
```
{data:ifGTE(nilai):show(teks):elseShow(teks alternatif)}
```

##### Contoh
```
50:ifGTE(-29):show('Result true'):elseShow('Result false')
1:ifGTE(768):show('Result true'):elseShow('Result false')
```

##### Hasil
Contoh pertama output `Result true`, contoh kedua output `Result false`.


#### 9. :ifLT(value)

##### Sintaks
```
{data:ifLT(nilai):show(teks):elseShow(teks alternatif)}
```

##### Contoh
```
-23:ifLT(19):show('Result true'):elseShow('Result false')
1290:ifLT(768):show('Result true'):elseShow('Result false')
```

##### Hasil
Contoh pertama output `Result true`, contoh kedua output `Result false`.


#### 10. :ifLTE(value)

##### Sintaks
```
{data:ifLTE(nilai):show(teks):elseShow(teks alternatif)}
```

##### Contoh
```
5:ifLTE(5):show('Result true'):elseShow('Result false')
1290:ifLTE(768):show('Result true'):elseShow('Result false')
```

##### Hasil
Contoh pertama output `Result true`, contoh kedua output `Result false`.


#### 11. :ifIN(value)

##### Sintaks
```
{data:ifIN(nilai):show(teks):elseShow(teks alternatif)}
```

##### Contoh
```
'car is broken':ifIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifIN(2):show('Result true'):elseShow('Result false')
```

##### Hasil
Kedua contoh menghasilkan `Result true` (karena string berisi 'is', array berisi 2).


#### 12. :ifNIN(value)

##### Sintaks
```
{data:ifNIN(nilai):show(teks):elseShow(teks alternatif)}
```

##### Contoh
```
'car is broken':ifNIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifNIN(2):show('Result true'):elseShow('Result false')
```

##### Hasil
Contoh pertama output `Result false` (karena string berisi 'is'), contoh kedua output `Result false` (karena array berisi 2).


#### 13. :ifTE(type)

##### Sintaks
```
{data:ifTE('tipe'):show(teks):elseShow(teks alternatif)}
```

##### Contoh
```
'homer':ifTE('string'):show('Result true'):elseShow('Result false')
10.5:ifTE('number'):show('Result true'):elseShow('Result false')
```

##### Hasil
Contoh pertama output `Result true` ('homer' adalah string), contoh kedua output `Result true` (10.5 adalah angka).


### Blok Kondisi

Blok kondisi digunakan untuk menampilkan atau menyembunyikan area dalam dokumen, sering digunakan untuk membungkus beberapa tag atau seluruh paragraf teks.

#### 1. :showBegin / :showEnd

##### Sintaks
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
Template:
```
Banana{d.toBuy:ifEQ(true):showBegin}
Apple
Pineapple
{d.toBuy:showEnd}Grapes
```

##### Hasil
Saat kondisi terpenuhi, konten di tengah ditampilkan:
```
Banana
Apple
Pineapple
Grapes
```


#### 2. :hideBegin / :hideEnd

##### Sintaks
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
Template:
```
Banana{d.toBuy:ifEQ(true):hideBegin}
Apple
Pineapple
{d.toBuy:hideEnd}Grapes
```

##### Hasil
Saat kondisi terpenuhi, konten di tengah disembunyikan, output:
```
Banana
Grapes
```


