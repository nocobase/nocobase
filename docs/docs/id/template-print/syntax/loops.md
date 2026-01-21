:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

## Pemrosesan Perulangan

Pemrosesan perulangan digunakan untuk merender data berulang kali dari array atau objek, dengan mendefinisikan penanda awal dan akhir perulangan untuk mengidentifikasi konten yang perlu diulang. Berikut adalah beberapa skenario umum.

### Mengulang Array

#### 1. Penjelasan Sintaksis

- Gunakan tag `{d.array[i].properti}` untuk mendefinisikan item perulangan saat ini, dan gunakan `{d.array[i+1].properti}` untuk menentukan item berikutnya guna menandai area perulangan.
- Saat perulangan, baris pertama (bagian `[i]`) akan secara otomatis digunakan sebagai template untuk pengulangan; Anda hanya perlu menulis contoh perulangan sekali dalam template.

Format sintaksis contoh:
```
{d.namaArray[i].properti}
{d.namaArray[i+1].properti}
```

#### 2. Contoh: Perulangan Array Sederhana

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

#### 3. Contoh: Perulangan Array Bertingkat

Cocok untuk kasus di mana sebuah array berisi array bertingkat; penumpukan bisa dilakukan pada level tak terbatas.

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

#### 4. Contoh: Perulangan Dua Arah (Fitur Lanjutan, v4.8.0+)

Perulangan dua arah memungkinkan iterasi pada baris dan kolom secara bersamaan, cocok untuk menghasilkan tabel perbandingan dan tata letak kompleks lainnya (catatan: saat ini, beberapa format hanya didukung secara resmi pada template DOCX, HTML, dan MD).

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

#### 5. Contoh: Mengakses Nilai Iterator Perulangan (v4.0.0+)

Dalam perulangan, Anda dapat langsung mengakses nilai indeks iterasi saat ini, yang membantu memenuhi persyaratan format khusus.

##### Contoh Template
```
{d[i].cars[i].other.wheels[i].tire.subObject:add(.i):add(..i):add(...i)}
```

> Catatan: Jumlah titik menunjukkan level indeks yang berbeda (misalnya, `.i` mewakili level saat ini, sedangkan `..i` mewakili level sebelumnya). Saat ini ada masalah dengan urutan terbalik; silakan lihat dokumentasi resmi untuk detailnya.

### Mengulang Objek

#### 1. Penjelasan Sintaksis

- Untuk properti dalam objek, Anda dapat menggunakan `.att` untuk mendapatkan nama properti dan `.val` untuk mendapatkan nilai properti.
- Selama iterasi, setiap item properti akan dilalui satu per satu.

Format sintaksis contoh:
```
{d.namaObjek[i].att}  // nama properti
{d.namaObjek[i].val}  // nilai properti
```

#### 2. Contoh: Iterasi Properti Objek

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

### Pengurutan

Dengan fitur pengurutan, Anda dapat langsung mengurutkan data array dalam template.

#### 1. Penjelasan Sintaksis: Pengurutan Urutan Menaik

- Gunakan atribut sebagai kriteria pengurutan dalam tag perulangan. Format sintaksisnya adalah:
  ```
  {d.array[atributPengurutan, i].properti}
  {d.array[atributPengurutan+1, i+1].properti}
  ```
- Jika Anda memerlukan beberapa kriteria pengurutan, pisahkan atribut dengan koma di dalam tanda kurung siku.

#### 2. Contoh: Pengurutan Berdasarkan Atribut Numerik

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

#### 3. Contoh: Pengurutan Multi-Atribut

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

### Pemfilteran

Pemfilteran digunakan untuk menyaring baris data dalam perulangan berdasarkan kondisi tertentu.

#### 1. Penjelasan Sintaksis: Pemfilteran Numerik

- Tambahkan kondisi dalam tag perulangan (misalnya, `age > 19`). Format sintaksisnya:
  ```
  {d.array[i, kondisi].properti}
  ```

#### 2. Contoh: Pemfilteran Numerik

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

#### 3. Penjelasan Sintaksis: Pemfilteran String

- Tentukan kondisi string menggunakan tanda kutip tunggal. Contoh format:
  ```
  {d.array[i, type='rocket'].name}
  ```

#### 4. Contoh: Pemfilteran String

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

#### 5. Penjelasan Sintaksis: Memfilter N Item Pertama

- Anda dapat menggunakan indeks perulangan `i` untuk memfilter N elemen pertama. Contoh sintaksis:
  ```
  {d.array[i, i < N].properti}
  ```

#### 6. Contoh: Memfilter Dua Item Pertama

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

#### 7. Penjelasan Sintaksis: Mengecualikan N Item Terakhir

- Gunakan pengindeksan negatif `i` untuk merepresentasikan item dari akhir. Misalnya:
  - `{d.array[i=-1].properti}` mengambil item terakhir.
  - `{d.array[i, i!=-1].properti}` mengecualikan item terakhir.

#### 8. Contoh: Mengecualikan Satu dan Dua Item Terakhir

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

#### 9. Penjelasan Sintaksis: Pemfilteran Cerdas

- Menggunakan blok kondisi cerdas, Anda dapat menyembunyikan seluruh baris berdasarkan kondisi kompleks. Contoh format:
  ```
  {d.array[i].properti:ifIN('kataKunci'):drop(row)}
  ```

#### 10. Contoh: Pemfilteran Cerdas

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
{d[i].name}
{d[i].name:ifIN('Falcon'):drop(row)}
{d[i+1].name}
```

##### Hasil
```
People
Model S
Model 3
```
(Catatan: Baris yang berisi "Falcon" dalam template dihapus oleh kondisi pemfilteran cerdas.)

### Penghapusan Duplikasi

#### 1. Penjelasan Sintaksis

- Menggunakan iterator kustom, Anda dapat memperoleh item unik (tidak duplikat) berdasarkan nilai properti. Sintaksisnya mirip dengan perulangan biasa tetapi secara otomatis mengabaikan item duplikat.

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