:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Satu-ke-Banyak

Hubungan antara kelas dan siswa adalah contoh hubungan satu-ke-banyak: satu kelas dapat memiliki banyak siswa, tetapi setiap siswa hanya dapat menjadi anggota satu kelas.

Diagram ER:

![alt text](https://static-docs.nocobase.com/9475f044d123d28ac8e56a077411f8dc.png)

Konfigurasi Kolom:

![alt text](https://static-docs.nocobase.com/a608ce54821172dad7e8ab760107ff4e.png)

## Deskripsi Parameter

### Koleksi Sumber

Koleksi sumber, yaitu koleksi tempat kolom ini berada.

### Koleksi Target

Koleksi target, yaitu koleksi yang akan dihubungkan.

### Kunci Sumber

Kolom di koleksi sumber yang direferensikan oleh kunci asing. Kolom ini harus unik.

### Kunci Asing

Kolom di koleksi target yang digunakan untuk membangun hubungan antara kedua koleksi.

### Kunci Target

Kolom di koleksi target yang digunakan untuk melihat setiap catatan baris dalam blok hubungan, biasanya merupakan kolom yang unik.

### ON DELETE

ON DELETE mengacu pada aturan yang diterapkan pada referensi kunci asing di koleksi anak terkait saat catatan di koleksi induk dihapus. Ini adalah opsi yang digunakan saat mendefinisikan batasan kunci asing. Opsi ON DELETE yang umum meliputi:

- **CASCADE**: Saat catatan di koleksi induk dihapus, semua catatan terkait di koleksi anak akan otomatis dihapus.
- **SET NULL**: Saat catatan di koleksi induk dihapus, nilai kunci asing di catatan koleksi anak yang terkait akan diatur menjadi NULL.
- **RESTRICT**: Opsi default, ini mencegah penghapusan catatan koleksi induk jika ada catatan terkait di koleksi anak.
- **NO ACTION**: Mirip dengan RESTRICT, ini mencegah penghapusan catatan koleksi induk jika ada catatan terkait di koleksi anak.