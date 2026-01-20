---
pkg: '@nocobase/plugin-workflow-json-variable-mapping'
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Pemetaan Variabel JSON

> v1.6.0

## Pendahuluan

Digunakan untuk memetakan struktur JSON kompleks dari hasil node hulu menjadi variabel, agar dapat digunakan di node selanjutnya. Misalnya, hasil dari node Aksi SQL dan Permintaan HTTP, setelah dipetakan, nilai propertinya dapat digunakan di node selanjutnya.

:::info{title=Tips}
Berbeda dengan node Perhitungan JSON, node Pemetaan Variabel JSON tidak mendukung ekspresi kustom dan tidak berbasis pada mesin pihak ketiga. Node ini hanya digunakan untuk memetakan nilai properti dalam struktur JSON, namun lebih mudah digunakan.
:::

## Membuat Node

Pada antarmuka konfigurasi alur kerja, klik tombol plus ('+') pada alur kerja untuk menambahkan node 'Pemetaan Variabel JSON'.

![Membuat Node](https://static-docs.nocobase.com/20250113173635.png)

## Konfigurasi Node

### Sumber Data

Sumber data dapat berupa hasil dari node hulu, atau objek data dalam konteks proses. Biasanya, ini adalah objek data yang tidak terstruktur secara bawaan, misalnya hasil dari node SQL atau node Permintaan HTTP.

![Sumber Data](https://static-docs.nocobase.com/20250113173720.png)

### Memasukkan Data Contoh

Dengan menempelkan data contoh dan mengklik tombol 'Parse' (Urai), daftar variabel akan secara otomatis dihasilkan.

![Memasukkan Data Contoh](https://static-docs.nocobase.com/20250113182327.png)

Jika ada variabel yang tidak diperlukan dalam daftar yang dihasilkan secara otomatis, Anda dapat mengklik tombol 'Hapus' untuk menghapusnya.

:::info{title=Tips}
Data contoh bukanlah hasil eksekusi akhir; data ini hanya digunakan untuk membantu menghasilkan daftar variabel.
:::

### Jalur Mencakup Indeks Array

Jika tidak dicentang, konten array akan dipetakan sesuai dengan metode penanganan variabel default alur kerja NocoBase. Misalnya, masukkan contoh berikut:

```json
{
  "a": 1,
  "b": [
    {
      "c": 2
    },
    {
      "c": 3
    }
  ]
}
```

Dalam variabel yang dihasilkan, `b.c` akan merepresentasikan array `[2, 3]`.

Jika opsi ini dicentang, jalur variabel akan mencakup indeks array, misalnya `b.0.c` dan `b.1.c`.

![20250113184056](https://static-docs.nocobase.com/20250113184056.png)

Saat menyertakan indeks array, Anda perlu memastikan bahwa indeks array dalam data masukan konsisten; jika tidak, akan menyebabkan kesalahan penguraian.

## Penggunaan di Node Selanjutnya

Dalam konfigurasi node selanjutnya, Anda dapat menggunakan variabel yang dihasilkan oleh node Pemetaan Variabel JSON:

![20250113203658](https://static-docs.nocobase.com/20250113203658.png)

Meskipun struktur JSON bisa sangat kompleks, namun setelah dipetakan, Anda hanya perlu memilih variabel untuk jalur yang sesuai.