:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Basis Data Eksternal

## Pendahuluan

Anda dapat menggunakan basis data eksternal yang sudah ada sebagai **sumber data**. Saat ini, basis data eksternal yang didukung meliputi MySQL, MariaDB, PostgreSQL, MSSQL, dan Oracle.

## Petunjuk Penggunaan

### Menambahkan Basis Data Eksternal

Setelah mengaktifkan **plugin**, Anda dapat memilih dan menambahkannya dari menu *dropdown* "Add new" di manajemen **sumber data**.

![20240507204316](https://static-docs.nocobase.com/20240507204316.png)

Isi informasi untuk basis data yang ingin Anda hubungkan.

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

### Sinkronisasi Koleksi

Setelah koneksi dengan basis data eksternal berhasil dibuat, semua **koleksi** di dalam **sumber data** akan langsung dibaca. Basis data eksternal tidak mendukung penambahan **koleksi** atau modifikasi struktur tabel secara langsung. Jika diperlukan modifikasi, Anda dapat melakukannya melalui klien basis data, lalu klik tombol "Refresh" di antarmuka untuk melakukan sinkronisasi.

![20240507204725](https://static-docs.nocobase.com/20240507204725.png)

### Mengonfigurasi Bidang

Basis data eksternal akan secara otomatis membaca dan menampilkan bidang-bidang dari **koleksi** yang sudah ada. Anda dapat dengan cepat melihat dan mengonfigurasi judul bidang, tipe data (*Field type*), dan tipe UI (*Field interface*). Anda juga dapat mengklik tombol "Edit" untuk mengubah konfigurasi lebih lanjut.

![20240507210537](https://static-docs.nocobase.com/20240507210537.png)

Karena basis data eksternal tidak mendukung modifikasi struktur tabel, satu-satunya tipe yang tersedia saat menambahkan bidang baru adalah bidang relasi. Bidang relasi bukanlah bidang aktual, melainkan digunakan untuk membangun koneksi antar **koleksi**.

![20240507220140](https://static-docs.nocobase.com/20240507220140.png)

Untuk detail lebih lanjut, lihat bab [Bidang Koleksi/Ikhtisar](/data-sources/data-modeling/collection-fields).

### Pemetaan Tipe Bidang

NocoBase secara otomatis memetakan tipe bidang dari basis data eksternal ke tipe data (*Field type*) dan tipe UI (*Field Interface*) yang sesuai.

- Tipe data (*Field type*): Digunakan untuk mendefinisikan jenis, format, dan struktur data yang dapat disimpan oleh suatu bidang;
- Tipe UI (*Field interface*): Mengacu pada jenis kontrol yang digunakan dalam antarmuka pengguna untuk menampilkan dan memasukkan nilai bidang.

| PostgreSQL | MySQL/MariaDB | NocoBase Data Type | NocoBase Interface Type |
| - | - | - | - |
| BOOLEAN | BOOLEAN<br/>TINYINT(1) | boolean | checkbox <br/> switch |
| SMALLINT<br/>INTEGER<br/>SERIAL<br/>SMALLSERIAL | TINYINT<br/>SMALLINT<br/>MEDIUMINT<br/>INTEGER | integer<br/>boolean<br/>sort | integer<br/>sort<br/>checkbox<br/>switch<br/>select<br/>radioGroup |
| BIGINT<br/>BIGSERIAL | BIGINT | bigInt<br/>sort | integer<br/>sort<br/>checkbox<br/>switch<br/>select<br/>radioGroup<br/>unixTimestamp<br/>createdAt<br/>updatedAt |
| REAL | FLOAT | float | number<br/>percent |
| DOUBLE PRECISION | DOUBLE PRECISION | double | number<br/>percent |
| DECIMAL<br/>NUMERIC | DECIMAL | decimal | number<br/>percent<br/>currency |
| VARCHAR<br/>CHAR | VARCHAR<br/>CHAR | string<br/>password<br/>uuid<br/>nanoid | input<br/>email<br/>phone<br/>password<br/>color<br/>icon<br/>select<br/>radioGroup<br/>uuid<br/>nanoid |
| TEXT | TEXT<br/>TINYTEXT<br/>MEDIUMTEXT<br/>LONGTEXT | text<br/>json | textarea<br/>markdown<br/>vditor<br/>richText<br/>url<br/>json |
| UUID | - | uuid | uuid |
| JSON<br/>JSONB | JSON | json | json |
| TIMESTAMP | DATETIME<br/>TIMESTAMP | date | date<br/>time<br/>createdAt<br/>updatedAt |
| DATE | DATE | dateOnly | datetime |
| TIME | TIME | time | time |
| - | YEAR |  | datetime |
| CIRCEL |  | circle | json<br/>circle |
| PATH<br/>GEOMETRY(LINESTRING) | LINESTRING | lineString | Json<br/>lineString |
| POINT<br/>GEOMETRY(POINT) | POINT | point | json<br/>point |
| POLYGON<br/>GEOMETRY(POLYGON) | POLYGON | polygon | json<br/>polygon |
| GEOMETRY | GEOMETRY |  -  |  -  |
| BLOB | BLOB | blob |  -  |
| ENUM | ENUM | enum | select<br/>radioGroup |
| ARRAY |  -  | array | multipleSelect<br/>checkboxGroup |
| BIT | BIT | - | - |
| SET | SET | set | multipleSelect<br/>checkboxGroup |
| RANGE | - | - | - |

### Tipe Bidang yang Tidak Didukung

Tipe bidang yang tidak didukung akan ditampilkan secara terpisah. Bidang-bidang ini memerlukan adaptasi pengembangan sebelum dapat digunakan.

![20240507221854](https://static-docs.nocobase.com/20240507221854.png)

### Kunci Target Filter

**Koleksi** yang ditampilkan sebagai blok harus memiliki Kunci Target Filter (*Filter target key*) yang dikonfigurasi. Kunci target filter digunakan untuk memfilter data berdasarkan bidang tertentu, dan nilai bidang harus bersifat unik. Secara *default*, kunci target filter adalah bidang kunci utama **koleksi**. Untuk *view*, **koleksi** tanpa kunci utama, atau **koleksi** dengan kunci utama komposit, Anda perlu mendefinisikan kunci target filter kustom.

![20240507210230](https://static-docs.nocobase.com/20240507210230.png)

Hanya **koleksi** yang memiliki Kunci Target Filter yang dikonfigurasi yang dapat ditambahkan ke halaman.

![20240507222827](https://static-docs.nocobase.com/20240507222827.png)