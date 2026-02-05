:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Banyak-ke-Satu

Dalam sebuah basis data perpustakaan, terdapat dua entitas: buku dan penulis. Seorang penulis dapat menulis beberapa buku, tetapi setiap buku biasanya hanya memiliki satu penulis. Dalam kasus ini, hubungan antara penulis dan buku adalah banyak-ke-satu. Beberapa buku dapat dikaitkan dengan penulis yang sama, tetapi setiap buku hanya dapat memiliki satu penulis.

Diagram ER:

![alt text](https://static-docs.nocobase.com/eaeeac974844db05c75cf0deeedf3652.png)

Konfigurasi Kolom:

![alt text](https://static-docs.nocobase.com/3b4484ebb98d82f832f3dbf752bd84c9.png)

## Deskripsi Parameter

### Koleksi Sumber

Koleksi sumber, yaitu koleksi tempat kolom saat ini berada.

### Koleksi Target

Koleksi target, yaitu koleksi yang akan dikaitkan.

### Kunci Asing

Kolom di koleksi sumber yang digunakan untuk membangun kaitan antara kedua koleksi.

### Kunci Target

Kolom di koleksi target yang direferensikan oleh kunci asing. Kolom ini harus unik.

### ON DELETE

ON DELETE mengacu pada aturan yang diterapkan pada referensi kunci asing di koleksi anak terkait ketika catatan di koleksi induk dihapus. Ini adalah opsi yang digunakan saat mendefinisikan batasan kunci asing. Opsi ON DELETE yang umum meliputi:

- **CASCADE**: Ketika sebuah catatan di koleksi induk dihapus, semua catatan terkait di koleksi anak akan otomatis dihapus.
- **SET NULL**: Ketika sebuah catatan di koleksi induk dihapus, nilai kunci asing di catatan koleksi anak yang terkait akan diatur menjadi NULL.
- **RESTRICT**: Opsi bawaan, ini mencegah penghapusan catatan koleksi induk jika ada catatan terkait di koleksi anak.
- **NO ACTION**: Serupa dengan RESTRICT, ini mencegah penghapusan catatan koleksi induk jika ada catatan terkait di koleksi anak.