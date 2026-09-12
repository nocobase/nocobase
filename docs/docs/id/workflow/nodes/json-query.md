---
pkg: '@nocobase/plugin-workflow-json-query'
title: "Node Workflow - Komputasi JSON"
description: "Node Komputasi JSON: melakukan komputasi atau transformasi struktur pada data JSON, mendukung berbagai engine komputasi."
keywords: "Workflow,Komputasi JSON,JSON Query,Transformasi JSON,NocoBase"
---

# Komputasi JSON

## Pengantar

Berdasarkan engine komputasi JSON yang berbeda, melakukan komputasi atau transformasi struktur pada data JSON kompleks yang dihasilkan oleh Node upstream, untuk digunakan oleh Node berikutnya. Misalnya hasil dari Node Operasi SQL dan Node HTTP Request, dapat ditransformasi menjadi format nilai dan variable yang dibutuhkan melalui Node ini, untuk digunakan oleh Node berikutnya.

## Membuat Node

Pada antarmuka konfigurasi workflow, klik tombol plus ("+") pada alur untuk menambahkan Node "Komputasi JSON":

![Membuat Node](https://static-docs.nocobase.com/7de796517539ad9dfc88b7160f1d0dd7.png)

:::info{title=Tips}
Biasanya Node Komputasi JSON dibuat di bawah Node data lainnya, untuk memparse data tersebut.
:::

## Konfigurasi Node

### Engine Parsing

Node Komputasi JSON mendukung sintaks yang berbeda melalui engine parsing yang berbeda, Anda dapat memilih sesuai preferensi Anda dan karakteristik setiap engine. Saat ini mendukung tiga engine parsing:

- [JMESPath](https://jmespath.org/)
- [JSONPath Plus](https://jsonpath-plus.github.io/JSONPath/docs/ts/)
- [JSONata](https://jsonata.org/)

![Pilih Engine](https://static-docs.nocobase.com/29be3b92a62b7d20312d1673e749f2ec.png)

### Sumber Data

Sumber data dapat berupa hasil Node upstream, atau objek data dari konteks alur, biasanya berupa objek data yang tidak terstruktur secara built-in, seperti hasil Node SQL, atau hasil Node HTTP Request.

![Sumber Data](https://static-docs.nocobase.com/f5a97e20693b3d30b3a994a576aa282d.png)

:::info{title=Tips}
Biasanya objek data Node terkait tabel data sudah terstruktur melalui informasi konfigurasi tabel data, umumnya tidak perlu diparse melalui Node Komputasi JSON.
:::

### Expression Parsing

Berdasarkan kebutuhan parsing dan engine parsing yang berbeda, expression parsing yang dibuat juga berbeda.

![Expression Parsing](https://static-docs.nocobase.com/181abd162fd32c09b62f6aa1d1cb3ed4.png)

:::info{title=Tips}
Engine yang berbeda menyediakan sintaks parsing yang berbeda, untuk detailnya silakan merujuk ke dokumentasi pada tautan.
:::

Sejak versi `v1.0.0-alpha.15`, expression mendukung penggunaan variable. Variable akan di-pre-parse sebelum engine spesifik dieksekusi. Sesuai dengan aturan template string, variable diganti dengan nilai string yang spesifik, dan digabungkan dengan string statis lain dari expression menjadi expression final. Fitur ini sangat berguna saat perlu membuat expression secara dinamis, misalnya saat beberapa konten JSON perlu diparse dengan key dinamis.

### Pemetaan Properti

Saat hasil komputasi adalah sebuah objek (atau array objek), Anda dapat memetakan properti yang dibutuhkan menjadi variable sub-level melalui pemetaan properti, untuk digunakan oleh Node berikutnya.

![Pemetaan Properti](https://static-docs.nocobase.com/b876abe4ccf6b4709eb8748f21ef3527.png)

:::info{title=Tips}
Untuk hasil objek (atau array objek), jika tidak melakukan pemetaan properti, maka keseluruhan objek (atau array objek) akan disimpan sebagai satu variable dalam hasil Node, tidak dapat menggunakan nilai properti objek tersebut sebagai variable secara langsung.
:::

## Contoh

Misalkan data yang perlu diparse adalah Node SQL sebelumnya yang digunakan untuk query data, hasilnya berupa sekelompok data pesanan:

```json
[
  {
    "id": 1,
    "products": [
      {
        "id": 1,
        "title": "Product 1",
        "price": 100,
        "quantity": 1
      },
      {
        "id": 2,
        "title": "Product 2",
        "price": 120,
        "quantity": 2
      }
    ]
  },
  {
    "id": 2,
    "products": [
      {
        "id": 3,
        "title": "Product 3",
        "price": 130,
        "quantity": 1
      },
      {
        "id": 4,
        "title": "Product 4",
        "price": 140,
        "quantity": 2
      }
    ]
  }
]
```

Jika kita perlu memparse dan menghitung total harga dari masing-masing dua pesanan dalam data, dan menggabungkannya menjadi objek dengan ID pesanan yang sesuai, untuk meng-update total harga pesanan, dapat dikonfigurasi seperti berikut:

![Contoh-Konfigurasi Parsing SQL](https://static-docs.nocobase.com/e62322a868b26ff98120bfcd6dcdb3bd.png)

1. Pilih engine parsing JSONata;
2. Pilih hasil Node SQL sebagai sumber data;
3. Gunakan expression JSONata `$[0].{"id": id, "total": products.(price * quantity)}` untuk parsing;
4. Pilih pemetaan properti, mapping `id` dan `total` menjadi variable sub-level;

Hasil parsing final adalah sebagai berikut:

```json
[
  {
    "id": 1,
    "total": 340
  },
  {
    "id": 2,
    "total": 410
  }
]
```

Setelah itu lakukan loop pada array pesanan yang sudah lengkap, untuk meng-update total harga pesanan.

![Update Total Harga Pesanan yang Sesuai](https://static-docs.nocobase.com/b3329b0efe4471f5eed1f0673bef740e.png)
