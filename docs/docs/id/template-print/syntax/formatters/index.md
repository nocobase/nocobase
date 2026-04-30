---
title: "Formatter Template Print"
description: "Formatter Template Print: mengkonversi data mentah menjadi teks yang dapat dibaca, sintaks colon, chaining, parameter konstan dan dinamis."
keywords: "Formatter Template,formatters,Template Print,NocoBase"
---

## Alat Format

Formatter digunakan untuk mengkonversi data mentah menjadi teks yang mudah dibaca. Formatter diterapkan ke data melalui colon (:), dapat di-chain, output setiap formatter akan menjadi input dari formatter berikutnya. Beberapa formatter mendukung parameter konstan atau parameter dinamis.


### Ikhtisar

#### 1. Penjelasan Sintaks
Bentuk pemanggilan dasar formatter adalah:
```
{d.properti:formatter1:formatter2(...)}
```  
Contoh, dalam contoh konversi string `"JOHN"` menjadi `"John"`, pertama menggunakan `lowerCase` untuk mengkonversi semua huruf menjadi huruf kecil, lalu menggunakan `ucFirst` untuk mengkapitalisasi huruf pertama.

#### 2. Contoh
Data:
```json
{
  "name": "JOHN",
  "birthday": "2000-01-31"
}
```
Template:
```
My name is {d.name:lowerCase:ucFirst}. I was born on {d.birthday:formatD(LL)}.
```

#### 3. Hasil
Setelah render output:
```
My name is John. I was born on January 31, 2000.
```


### Parameter Konstan

#### 1. Penjelasan Sintaks
Banyak formatter mendukung satu atau beberapa parameter konstan, dipisahkan dengan koma, dan ditempatkan dalam tanda kurung untuk memodifikasi output. Contoh, `:prepend(myPrefix)` akan menambahkan "myPrefix" sebelum teks.  
Perhatian: Jika parameter berisi koma atau spasi, harus dibungkus dengan tanda kutip tunggal, contoh `prepend('my prefix')`.

#### 2. Contoh
Contoh Template (lihat penggunaan formatter spesifik).

#### 3. Hasil
Output akan menambahkan prefix yang ditentukan sebelum teks.


### Parameter Dinamis

#### 1. Penjelasan Sintaks
Formatter mendukung parameter dinamis, parameter dimulai dengan titik (.) dan tanpa tanda kutip.  
Dapat menggunakan dua cara:
- **Path JSON Absolut**: Dimulai dengan `d.` atau `c.` (data root atau data tambahan).
- **Path JSON Relatif**: Dimulai dengan satu titik (.), berarti mencari properti dari objek parent saat ini.

Contoh:
```
{d.subObject.qtyB:add(d.subObject.qtyC)}
```
Juga dapat ditulis sebagai path relatif:
```
{d.subObject.qtyB:add(.qtyC)}
```
Jika perlu mengakses data level di atas atau lebih tinggi, dapat menggunakan beberapa titik:
```
{d.subObject.qtyB:add(..qtyA):add(.qtyC)}
```

#### 2. Contoh
Data:
```json
{
  "id": 10,
  "qtyA": 20,
  "subObject": {
    "qtyB": 5,
    "qtyC": 3
  },
  "subArray": [{
    "id": 1000,
    "qtyE": 3
  }]
}
```
Pada Template digunakan:
```
{d.subObject.qtyB:add(d.subObject.qtyC)}      // Hasil: 8 (5 + 3)
{d.subObject.qtyB:add(.qtyC)}                   // Hasil: 8
{d.subObject.qtyB:add(..qtyA):add(.qtyC)}        // Hasil: 28 (5 + 20 + 3)
{d.subArray[0].qtyE:add(..subObject.qtyC)}       // Hasil: 6 (3 + 3)
```

#### 3. Hasil
Setiap contoh masing-masing menghasilkan 8, 8, 28, 6.

> **Perhatian:** Menggunakan iterator kustom atau filter array sebagai parameter dinamis tidak diperbolehkan, seperti:
> ```
> {d.subObject.qtyB:add(..subArray[i].qtyE)}
> {d.subObject.qtyB:add(d.subArray[i].qtyE)}
> ```


