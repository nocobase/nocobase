---
title: "Template Print - Pemrosesan Loop"
description: "Sintaks loop Template Print: traversal array atau objek untuk render berulang, gunakan {d.array[i]} dan {d.array[i+1]} untuk menandai area loop."
keywords: "Template Print,Loop,loops,Traversal Array,NocoBase"
---

## Pemrosesan Loop

Pemrosesan loop digunakan untuk render berulang data dalam array atau objek, dengan mendefinisikan tag awal dan akhir loop untuk mengidentifikasi konten yang perlu diulang. Berikut diperkenalkan beberapa kasus umum.


### Traversal Array

#### 1. Penjelasan Sintaks

- Gunakan tag `{d.array[i].properti}` untuk mendefinisikan item loop saat ini, dan `{d.array[i+1].properti}` untuk menentukan item berikutnya untuk menandai area loop.
- Saat loop, baris pertama (bagian `[i]`) akan otomatis digunakan sebagai Template untuk pengulangan; di Template hanya perlu menulis satu kali contoh loop.

Format sintaks contoh:
```
{d.namaArray[i].properti}
{d.namaArray[i+1].properti}
```

#### 2. Contoh: Loop Array Sederhana

##### Data
```json
{
  "cars": [
    { "brand": "Toyota", "id": 1 },
    { "brand": "Hyundai", "id": 2 },
    { "brand": "BMW",    "id": 3 },
    { "brand": "Peugeot","id": 4 }
  ]
}
```

##### Template
```
Carsid
{d.cars[i].brand}{d.cars[i].id}
{d.cars[i+1].brand}
```

##### Hasil
```
Carsid
Toyota1
Hyundai2
BMW3
Peugeot4
```


#### 3. Contoh: Loop Array Bersarang

Cocok untuk situasi array di dalam array, dapat bersarang tanpa batas level.

##### Data
```json
[
  {
    "brand": "Toyota",
    "models": [
      { "size": "Prius 4", "power": 125 },
      { "size": "Prius 5", "power": 139 }
    ]
  },
  {
    "brand": "Kia",
    "models": [
      { "size": "EV4", "power": 450 },
      { "size": "EV6", "power": 500 }
    ]
  }
]
```

##### Template
```
{d[i].brand}

Models
{d[i].models[i].size} - {d[i].models[i].power}
{d[i].models[i+1].size}

{d[i+1].brand}
```

##### Hasil
```
Toyota

Models
Prius 4 - 125
Prius 5 - 139

Kia
```


#### 4. Contoh: Loop Dua Arah (Fitur Lanjutan, v4.8.0+)

Loop dua arah dapat melakukan iterasi pada baris dan kolom secara bersamaan, cocok untuk menghasilkan layout kompleks seperti tabel perbandingan (catatan: beberapa format saat ini hanya didukung resmi oleh Template DOCX, HTML, MD).

##### Data
```json
{
  "titles": [
    { "name": "Kia" },
    { "name": "Toyota" },
    { "name": "Hopium" }
  ],
  "cars": [
    { "models": [ "EV3", "Prius 1", "Prototype" ] },
    { "models": [ "EV4", "Prius 2", "" ] },
    { "models": [ "EV6", "Prius 3", "" ] }
  ]
}
```

##### Template
```
{d.titles[i].name}{d.titles[i+1].name}
{d.cars[i].models[i]}{d.cars[i].models[i+1]}
{d.cars[i+1].models[i]}
```

##### Hasil
```
KiaToyotaHopium
EV3Prius 1Prototype
EV4Prius 2
EV6Prius 3
```


#### 5. Contoh: Mengakses Nilai Iterator Loop (v4.0.0+)

Pada loop dapat langsung mengakses nilai indeks iterasi saat ini, memudahkan implementasi kebutuhan format khusus.

##### Contoh Template
```
{d[i].cars[i].other.wheels[i].tire.subObject:add(.i):add(..i):add(...i)}
```

> Catatan: Jumlah titik digunakan untuk mewakili nilai indeks pada level yang berbeda (contoh, `.i` mewakili level saat ini, `..i` mewakili level di atas), saat ini ada masalah urutan terbalik, untuk detail silakan lihat penjelasan resmi.


### Traversal Objek

#### 1. Penjelasan Sintaks

- Untuk properti dalam objek, dapat menggunakan `.att` untuk mendapatkan nama properti, dan `.val` untuk mendapatkan nilai properti.
- Saat iterasi, setiap kali akan men-traverse satu item properti.

Format sintaks contoh:
```
{d.namaObjek[i].att}  // Nama properti
{d.namaObjek[i].val}  // Nilai properti
```

#### 2. Contoh: Traversal Properti Objek

##### Data
```json
{
  "myObject": {
    "paul": "10",
    "jack": "20",
    "bob":  "30"
  }
}
```

##### Template
```
People namePeople age
{d.myObject[i].att}{d.myObject[i].val}
{d.myObject[i+1].att}{d.myObject[i+1].val}
```

##### Hasil
```
People namePeople age
paul10
jack20
bob30
```


### Pemrosesan Sorting

Memanfaatkan fitur sorting dapat langsung melakukan sorting pada data array dalam Template.

#### 1. Penjelasan Sintaks: Sorting Ascending

- Gunakan properti dalam tag loop sebagai dasar sorting, format sintaksnya:
  ```
  {d.array[properti sorting, i].properti}
  {d.array[properti sorting+1, i+1].properti}
  ```
- Jika perlu sorting multi-level, dapat memisahkan beberapa properti sorting dengan koma di dalam kurung siku.

#### 2. Contoh: Sorting Berdasarkan Properti Angka

##### Data
```json
{
  "cars": [
    { "brand": "Ferrari", "power": 3 },
    { "brand": "Peugeot", "power": 1 },
    { "brand": "BMW",     "power": 2 },
    { "brand": "Lexus",   "power": 1 }
  ]
}
```

##### Template
```
Cars
{d.cars[power, i].brand}
{d.cars[power+1, i+1].brand}
```

##### Hasil
```
Cars
Peugeot
Lexus
BMW
Ferrari
```

#### 3. Contoh: Sorting Multi-properti

##### Data
```json
{
  "cars": [
    { "brand": "Ferrari", "power": 3, "sub": { "size": 1 } },
    { "brand": "Aptera",  "power": 1, "sub": { "size": 20 } },
    { "brand": "Peugeot", "power": 1, "sub": { "size": 20 } },
    { "brand": "BMW",     "power": 2, "sub": { "size": 1 } },
    { "brand": "Kia",     "power": 1, "sub": { "size": 10 } }
  ]
}
```

##### Template
```
Cars
{d.cars[power, sub.size, i].brand}
{d.cars[power+1, sub.size+1, i+1].brand}
```

##### Hasil
```
Cars
Kia
Aptera
Peugeot
BMW
Ferrari
```


### Pemrosesan Filter

Pemrosesan filter digunakan untuk memfilter baris data dalam loop berdasarkan kondisi tertentu.

#### 1. Penjelasan Sintaks: Filter Angka

- Tambahkan kondisi pada tag loop (contoh `age > 19`), format sintaks:
  ```
  {d.array[i, kondisi].properti}
  ```

#### 2. Contoh: Filter Angka

##### Data
```json
[
  { "name": "John",   "age": 20 },
  { "name": "Eva",    "age": 18 },
  { "name": "Bob",    "age": 25 },
  { "name": "Charly", "age": 30 }
]
```

##### Template
```
People
{d[i, age > 19, age < 30].name}
{d[i+1, age > 19, age < 30].name}
```

##### Hasil
```
People
John
Bob
```


#### 3. Penjelasan Sintaks: Filter String

- Gunakan tanda kutip tunggal untuk menandai kondisi string, contoh format:
  ```
  {d.array[i, type='rocket'].name}
  ```

#### 4. Contoh: Filter String

##### Data
```json
[
  { "name": "Falcon 9",    "type": "rocket" },
  { "name": "Model S",     "type": "car" },
  { "name": "Model 3",     "type": "car" },
  { "name": "Falcon Heavy","type": "rocket" }
]
```

##### Template
```
People
{d[i, type='rocket'].name}
{d[i+1, type='rocket'].name}
```

##### Hasil
```
People
Falcon 9
Falcon Heavy
```


#### 5. Penjelasan Sintaks: Filter N Item Pertama

- Dapat menggunakan indeks loop `i` untuk memfilter N elemen pertama, contoh sintaks:
  ```
  {d.array[i, i < N].properti}
  ```

#### 6. Contoh: Filter Dua Item Pertama

##### Data
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### Template
```
People
{d[i, i < 2].name}
{d[i+1, i < 2].name}
```

##### Hasil
```
People
Falcon 9
Model S
```


#### 7. Penjelasan Sintaks: Mengecualikan N Item Terakhir

- Melalui indeks negatif `i` mewakili item terbalik, contoh:
  - `{d.array[i=-1].properti}` mendapatkan item terakhir
  - `{d.array[i, i!=-1].properti}` mengecualikan item terakhir

#### 8. Contoh: Mengecualikan Item Terakhir dan Dua Item Terakhir

##### Data
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### Template
```
Item terakhir: {d[i=-1].name}

Mengecualikan item terakhir:
{d[i, i!=-1].name}
{d[i+1, i!=-1].name}

Mengecualikan dua item terakhir:
{d[i, i<-2].name}
{d[i+1, i<-2].name}
```

##### Hasil
```
Item terakhir: Falcon Heavy

Mengecualikan item terakhir:
Falcon 9
Model S
Model 3

Mengecualikan dua item terakhir:
Falcon 9
Model S
```


### Pemrosesan Deduplikasi

#### 1. Penjelasan Sintaks

- Melalui iterator kustom, dapat memperoleh item unik (tidak duplikat) berdasarkan nilai properti tertentu. Sintaksnya mirip dengan loop biasa, tetapi akan otomatis mengabaikan item duplikat.

Format contoh:
```
{d.array[properti].properti}
{d.array[properti+1].properti}
```

#### 2. Contoh: Memilih Data Unik

##### Data
```json
[
  { "type": "car",   "brand": "Hyundai" },
  { "type": "plane", "brand": "Airbus" },
  { "type": "plane", "brand": "Boeing" },
  { "type": "car",   "brand": "Toyota" }
]
```

##### Template
```
Vehicles
{d[type].brand}
{d[type+1].brand}
```

##### Hasil
```
Vehicles
Hyundai
Airbus
```


