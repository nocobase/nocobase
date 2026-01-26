---
pkg: '@nocobase/plugin-workflow-json-query'
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Perhitungan JSON

## Pendahuluan

Berdasarkan berbagai mesin perhitungan JSON, node ini menghitung atau mengubah struktur data JSON kompleks yang dihasilkan oleh node sebelumnya agar dapat digunakan oleh node selanjutnya. Misalnya, hasil dari operasi SQL dan node permintaan HTTP dapat diubah menjadi nilai dan format variabel yang diperlukan melalui node ini untuk digunakan oleh node selanjutnya.

## Membuat Node

Di antarmuka konfigurasi alur kerja, klik tombol plus ("+") di dalam alur untuk menambahkan node "Perhitungan JSON":

![Membuat Node](https://static-docs.nocobase.com/7de796517539ad9dfc88b7160f1d0dd7.png)

:::info{title=Catatan}
Biasanya, node Perhitungan JSON dibuat di bawah node data lainnya untuk memparsingnya.
:::

## Konfigurasi Node

### Mesin Parsing

Node Perhitungan JSON mendukung berbagai sintaks melalui mesin parsing yang berbeda. Anda dapat memilih berdasarkan preferensi dan fitur masing-masing mesin. Saat ini, tiga mesin parsing didukung:

- [JMESPath](https://jmespath.org/)
- [JSONPath Plus](https://jsonpath-plus.github.io/JSONPath/docs/ts/)
- [JSONata](https://jsonata.org/)

![Pilihan Mesin](https://static-docs.nocobase.com/29be3b92a62b7d20312d1673e749f2ec.png)

### Sumber Data

Sumber data bisa berupa hasil dari node sebelumnya atau objek data dalam konteks alur kerja. Biasanya, ini adalah objek data tanpa struktur bawaan, seperti hasil dari node SQL atau node permintaan HTTP.

![Sumber Data](https://static-docs.nocobase.com/f5a97e20693b3d30b3a994a576aa282d.png)

:::info{title=Catatan}
Biasanya, objek data dari node terkait koleksi sudah terstruktur melalui informasi konfigurasi koleksi dan umumnya tidak perlu diparsing oleh node Perhitungan JSON.
:::

### Ekspresi Parsing

Ekspresi parsing kustom berdasarkan kebutuhan parsing dan mesin parsing yang dipilih.

![Ekspresi Parsing](https://static-docs.nocobase.com/181abd162fd32c09b62f6aa1d1cb3ed4.png)

:::info{title=Catatan}
Mesin yang berbeda menyediakan sintaks parsing yang berbeda. Untuk detailnya, silakan merujuk ke dokumentasi di tautan.
:::

Mulai versi `v1.0.0-alpha.15`, ekspresi mendukung penggunaan variabel. Variabel akan dipra-parsing sebelum mesin tertentu dieksekusi, mengganti variabel dengan nilai string spesifik sesuai aturan template string, dan menggabungkannya dengan string statis lainnya dalam ekspresi untuk membentuk ekspresi akhir. Fitur ini sangat berguna ketika Anda perlu membangun ekspresi secara dinamis, misalnya, ketika beberapa konten JSON memerlukan kunci dinamis untuk parsing.

### Pemetaan Properti

Ketika hasil perhitungan adalah sebuah objek (atau array objek), Anda dapat lebih lanjut memetakan properti yang diperlukan ke variabel anak melalui pemetaan properti untuk digunakan oleh node selanjutnya.

![Pemetaan Properti](https://static-docs.nocobase.com/b876abe4ccf6b4709eb8748f21ef3527.png)

:::info{title=Catatan}
Untuk hasil objek (atau array objek), jika pemetaan properti tidak dilakukan, seluruh objek (atau array objek) akan disimpan sebagai variabel tunggal dalam hasil node, dan nilai properti objek tidak dapat digunakan langsung sebagai variabel.
:::

## Contoh

Misalkan data yang perlu diparsing berasal dari node SQL sebelumnya yang digunakan untuk mengkueri data, dan hasilnya adalah kumpulan data pesanan:

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

Jika kita perlu memparsing dan menghitung total harga masing-masing dari dua pesanan dalam data, dan menggabungkannya dengan ID pesanan yang sesuai ke dalam sebuah objek untuk memperbarui total harga pesanan, kita dapat mengkonfigurasinya sebagai berikut:

![Contoh - Konfigurasi Parsing SQL](https://static-docs.nocobase.com/e62322a868b26ff98120bfcd6dcdb3bd.png)

1.  Pilih mesin parsing JSONata;
2.  Pilih hasil dari node SQL sebagai sumber data;
3.  Gunakan ekspresi JSONata `$[0].{"id": id, "total": products.(price * quantity)}` untuk parsing;
4.  Pilih pemetaan properti untuk memetakan `id` dan `total` ke variabel anak;

Hasil parsing akhirnya adalah sebagai berikut:

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

Setelah itu, lakukan perulangan pada array pesanan yang dihasilkan untuk memperbarui total harga pesanan.

![Perbarui total harga pesanan yang sesuai](https://static-docs.nocobase.com/b3329b0efe4471f5eed1f0673bef740e.png)