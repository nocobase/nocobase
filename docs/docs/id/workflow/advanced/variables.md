:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Menggunakan Variabel

## Konsep Inti

Sama seperti variabel dalam bahasa pemrograman, **variabel** dalam sebuah alur kerja adalah alat penting untuk menghubungkan dan mengatur proses.

Saat setiap node dieksekusi setelah sebuah alur kerja terpicu, beberapa item konfigurasi dapat memilih untuk menggunakan variabel. Sumber variabel ini adalah data dari node hulu (upstream) dari node saat ini, termasuk kategori berikut:

-   Data konteks pemicu: Dalam kasus seperti pemicu tindakan atau pemicu koleksi, objek data baris tunggal dapat digunakan sebagai variabel oleh semua node. Spesifikasinya bervariasi tergantung pada implementasi setiap pemicu.
-   Data node hulu: Saat proses mencapai node mana pun, ini adalah data hasil dari node yang telah selesai sebelumnya.
-   Variabel lokal: Saat sebuah node berada dalam beberapa struktur cabang khusus, ia dapat menggunakan variabel lokal spesifik dalam cabang tersebut. Misalnya, dalam struktur perulangan, objek data dari setiap iterasi dapat digunakan.
-   Variabel sistem: Beberapa parameter sistem bawaan, seperti waktu saat ini.

Kami telah menggunakan fitur variabel berkali-kali di [Memulai Cepat](../getting-started.md). Misalnya, di node perhitungan, kita dapat menggunakan variabel untuk mereferensikan data konteks pemicu untuk melakukan perhitungan:

![Node perhitungan menggunakan fungsi dan variabel](https://static-docs.nocobase.com/837e4851a4c70a1932542caadef3431b.png)

Di node pembaruan, gunakan data konteks pemicu sebagai variabel untuk kondisi filter, dan referensikan hasil dari node perhitungan sebagai variabel untuk nilai bidang data yang akan diperbarui:

![Variabel node pembaruan data](https://static-docs.nocobase.com/2e147c9364e7ebc709b9b7ab4f3af8c.png)

## Struktur Data

Secara internal, sebuah variabel adalah struktur JSON, dan Anda biasanya dapat menggunakan bagian tertentu dari data melalui jalur JSON-nya. Karena banyak variabel didasarkan pada struktur koleksi NocoBase, data relasi akan disusun secara hierarkis sebagai properti objek, membentuk struktur seperti pohon. Misalnya, kita dapat memilih nilai dari bidang tertentu dari data relasi dari data yang dikueri. Selain itu, ketika data relasi memiliki struktur *to-many*, variabel tersebut mungkin berupa array.

Saat memilih variabel, Anda paling sering perlu memilih atribut nilai tingkat terakhir, yang biasanya merupakan tipe data sederhana seperti angka atau string. Namun, ketika ada array dalam hierarki variabel, atribut tingkat terakhir juga akan dipetakan menjadi sebuah array. Data array hanya dapat diproses dengan benar jika node yang bersangkutan mendukung array. Misalnya, di node perhitungan, beberapa mesin perhitungan memiliki fungsi khusus untuk menangani array. Contoh lain adalah di node perulangan, di mana objek perulangan juga bisa langsung memilih sebuah array.

Sebagai contoh, ketika sebuah node kueri mengueri beberapa data, hasil node akan berupa array yang berisi beberapa baris data homogen:

```json
[
  {
    "id": 1,
    "title": "Judul 1"
  },
  {
    "id": 2,
    "title": "Judul 2"
  }
]
```

Namun, saat menggunakannya sebagai variabel di node-node berikutnya, jika variabel yang dipilih dalam bentuk `Data node/Node kueri/Judul`, Anda akan mendapatkan array yang dipetakan ke nilai bidang yang sesuai:

```json
["Judul 1", "Judul 2"]
```

Jika itu adalah array multi-dimensi (seperti bidang relasi *many-to-many*), Anda akan mendapatkan array satu dimensi dengan bidang yang sesuai telah diratakan (flattened).

## Variabel Bawaan Sistem

### Waktu Sistem

Mendapatkan waktu sistem pada saat node dieksekusi. Zona waktu dari waktu ini adalah zona waktu yang diatur di server.

### Parameter Rentang Tanggal

Dapat digunakan saat mengonfigurasi kondisi filter bidang tanggal di node kueri, pembaruan, dan penghapusan. Ini hanya didukung untuk perbandingan "sama dengan". Baik waktu mulai maupun waktu berakhir dari rentang tanggal didasarkan pada zona waktu yang diatur di server.

![Parameter rentang tanggal](https://static-docs.nocobase.com/20240817175354.png)