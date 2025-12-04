:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Banyak-ke-Banyak

Dalam sistem pemilihan mata kuliah, terdapat dua entitas: mahasiswa dan mata kuliah. Seorang mahasiswa dapat mengambil beberapa mata kuliah, dan satu mata kuliah dapat diambil oleh beberapa mahasiswa, yang membentuk hubungan banyak-ke-banyak. Dalam basis data relasional, untuk menggambarkan hubungan banyak-ke-banyak antara mahasiswa dan mata kuliah, biasanya digunakan sebuah koleksi perantara, seperti koleksi pendaftaran. Koleksi ini dapat mencatat mata kuliah mana saja yang dipilih oleh setiap mahasiswa, dan mahasiswa mana saja yang mengambil setiap mata kuliah. Desain seperti ini dapat menggambarkan hubungan banyak-ke-banyak antara mahasiswa dan mata kuliah dengan efektif.

Diagram ER:

![alt text](https://static-docs.nocobase.com/0e9921228e1ee375dc639431bb89782c.png)

Konfigurasi Bidang:

![alt text](https://static-docs.nocobase.com/8e2739ac5d44fb46f30e2da42ca87a82.png)

## Deskripsi Parameter

### Koleksi Sumber

Koleksi sumber adalah koleksi tempat bidang saat ini berada.

### Koleksi Target

Koleksi target adalah koleksi yang akan dihubungkan.

### Koleksi Perantara

Koleksi perantara digunakan ketika terdapat hubungan banyak-ke-banyak antara dua entitas. Koleksi perantara memiliki dua kunci asing yang berfungsi untuk menjaga asosiasi antara kedua entitas.

### Kunci Sumber

Bidang dalam koleksi sumber yang direferensikan oleh kunci asing. Bidang ini harus bersifat unik.

### Kunci Asing 1

Bidang dalam koleksi perantara yang membangun asosiasi dengan koleksi sumber.

### Kunci Asing 2

Bidang dalam koleksi perantara yang membangun asosiasi dengan koleksi target.

### Kunci Target

Bidang dalam koleksi target yang direferensikan oleh kunci asing. Bidang ini harus bersifat unik.

### ON DELETE

ON DELETE mengacu pada aturan yang diterapkan pada referensi kunci asing dalam koleksi anak terkait ketika rekaman dalam koleksi induk dihapus. Ini adalah opsi yang digunakan saat mendefinisikan batasan kunci asing. Opsi ON DELETE yang umum meliputi:

- **CASCADE**: Ketika sebuah rekaman dalam koleksi induk dihapus, semua rekaman terkait dalam koleksi anak akan dihapus secara otomatis.
- **SET NULL**: Ketika sebuah rekaman dalam koleksi induk dihapus, nilai kunci asing dalam rekaman koleksi anak yang terkait akan diatur menjadi NULL.
- **RESTRICT**: Opsi bawaan, mencegah penghapusan rekaman koleksi induk jika terdapat rekaman terkait dalam koleksi anak.
- **NO ACTION**: Mirip dengan RESTRICT, mencegah penghapusan rekaman koleksi induk jika terdapat rekaman terkait dalam koleksi anak.