---
pkg: '@nocobase/plugin-workflow-sql'
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Operasi SQL

## Pendahuluan

Dalam beberapa skenario khusus, node aksi koleksi sederhana yang disebutkan di atas mungkin tidak dapat menangani operasi yang kompleks. Dalam kasus seperti itu, Anda dapat langsung menggunakan node SQL agar basis data dapat mengeksekusi pernyataan SQL yang kompleks untuk manipulasi data.

Perbedaannya dengan menghubungkan langsung ke basis data untuk operasi SQL di luar aplikasi adalah bahwa di dalam sebuah alur kerja, Anda dapat menggunakan variabel dari konteks proses sebagai parameter dalam pernyataan SQL.

## Instalasi

Plugin bawaan, tidak memerlukan instalasi.

## Membuat Node

Pada antarmuka konfigurasi alur kerja, klik tombol plus ("+") pada alur untuk menambahkan node "Operasi SQL":

![Menambahkan Operasi SQL](https://static-docs.nocobase.com/0ce40a226d7a5bf3717813e27da40e62.png)

## Konfigurasi Node

![Node SQL_Konfigurasi Node](https://static-docs.nocobase.com/20240904002334.png)

### Sumber Data

Pilih sumber data untuk mengeksekusi SQL.

Sumber data harus bertipe basis data, seperti sumber data utama, PostgreSQL, atau sumber data lain yang kompatibel dengan Sequelize.

### Konten SQL

Edit pernyataan SQL. Saat ini, hanya satu pernyataan SQL yang didukung.

Sisipkan variabel yang diperlukan menggunakan tombol variabel di sudut kanan atas editor. Sebelum eksekusi, variabel-variabel ini akan diganti dengan nilai-nilai yang sesuai melalui substitusi teks. Teks yang dihasilkan kemudian akan digunakan sebagai pernyataan SQL akhir dan dikirim ke basis data untuk kueri.

## Hasil Eksekusi Node

Sejak `v1.3.15-beta`, hasil eksekusi node SQL adalah sebuah array yang terdiri dari data murni. Sebelumnya, itu adalah struktur pengembalian asli Sequelize yang berisi metadata kueri (lihat: [`sequelize.query()`](https://sequelize.org/api/v6/class/src/sequelize.js~sequelize#instance-method-query)).

Sebagai contoh, kueri berikut:

```sql
select count(id) from posts;
```

Hasil sebelum `v1.3.15-beta`:

```json
[
    [
        { "count": 1 }
    ],
    {
        // meta
    }
]
```

Hasil setelah `v1.3.15-beta`:

```json
[
    { "count": 1 }
]
```

## Pertanyaan Umum

### Bagaimana cara menggunakan hasil dari node SQL?

Jika pernyataan `SELECT` digunakan, hasil kueri akan disimpan dalam node dalam format JSON Sequelize. Ini dapat diurai dan digunakan dengan [plugin JSON-query](./json-query.md).

### Apakah operasi SQL akan memicu event koleksi?

**Tidak**. Operasi SQL langsung mengirimkan pernyataan SQL ke basis data untuk diproses. Operasi `CREATE` / `UPDATE` / `DELETE` yang terkait terjadi di basis data, sedangkan event koleksi terjadi pada lapisan aplikasi Node.js (ditangani oleh ORM), sehingga event koleksi tidak akan terpicu.