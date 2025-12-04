:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

## Formatter

Formatter digunakan untuk mengubah data mentah menjadi teks yang mudah dibaca. Formatter diterapkan pada data menggunakan titik dua (`:`) dan dapat dirangkai sehingga keluaran dari setiap formatter menjadi masukan untuk formatter berikutnya. Beberapa formatter mendukung parameter konstan atau parameter dinamis.

### Gambaran Umum

#### 1. Penjelasan Sintaks
Bentuk dasar pemanggilan formatter adalah sebagai berikut:
```
{d.property:formatter1:formatter2(...)}
```  
Sebagai contoh, dalam kasus mengubah string `"JOHN"` menjadi `"John"`, formatter `lowerCase` digunakan terlebih dahulu untuk mengubah semua huruf menjadi huruf kecil, kemudian `ucFirst` digunakan untuk membuat huruf pertama menjadi kapital.

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
Setelah dirender, hasilnya adalah:
```
My name is John. I was born on January 31, 2000.
```

### Parameter Konstan

#### 1. Penjelasan Sintaks
Banyak formatter mendukung satu atau lebih parameter konstan, yang dipisahkan oleh koma dan diapit dalam tanda kurung untuk memodifikasi keluaran. Sebagai contoh, `:prepend(myPrefix)` akan menambahkan "myPrefix" di depan teks.  
**Catatan:** Jika parameter berisi koma atau spasi, parameter tersebut harus diapit dalam tanda kutip tunggal, misalnya: `prepend('my prefix')`.

#### 2. Contoh
Contoh template (lihat penggunaan formatter spesifik untuk detailnya).

#### 3. Hasil
Keluaran akan memiliki awalan yang ditentukan yang ditambahkan di depan teks.

### Parameter Dinamis

#### 1. Penjelasan Sintaks
Formatter juga mendukung parameter dinamis. Parameter ini dimulai dengan titik (`.`) dan tidak diapit dalam tanda kutip.  
Ada dua metode untuk menentukan parameter dinamis:
- **Jalur JSON Absolut**: Dimulai dengan `d.` atau `c.` (merujuk pada data root atau data tambahan).
- **Jalur JSON Relatif**: Dimulai dengan satu titik (`.`), menunjukkan bahwa properti dicari dari objek induk saat ini.

Sebagai contoh:
```
{d.subObject.qtyB:add(d.subObject.qtyC)}
```
Ini juga dapat ditulis sebagai jalur relatif:
```
{d.subObject.qtyB:add(.qtyC)}
```
Jika Anda perlu mengakses data dari level yang lebih tinggi (induk atau di atasnya), Anda dapat menggunakan beberapa titik:
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
Penggunaan dalam Template:
```
{d.subObject.qtyB:add(d.subObject.qtyC)}      // Hasil: 8 (5 + 3)
{d.subObject.qtyB:add(.qtyC)}                   // Hasil: 8
{d.subObject.qtyB:add(..qtyA):add(.qtyC)}        // Hasil: 28 (5 + 20 + 3)
{d.subArray[0].qtyE:add(..subObject.qtyC)}       // Hasil: 6 (3 + 3)
```

#### 3. Hasil
Contoh-contoh tersebut menghasilkan 8, 8, 28, dan 6 secara berurutan.

> **Catatan:** Penggunaan iterator kustom atau filter array sebagai parameter dinamis tidak diizinkan, misalnya:
> ```
> {d.subObject.qtyB:add(..subArray[i].qtyE)}
> {d.subObject.qtyB:add(d.subArray[i].qtyE)}
> ```