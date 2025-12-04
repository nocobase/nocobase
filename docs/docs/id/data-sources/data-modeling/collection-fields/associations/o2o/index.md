:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Satu-ke-Satu

Dalam hubungan antara karyawan dan profil pribadi, setiap karyawan hanya dapat memiliki satu catatan profil pribadi, dan setiap catatan profil pribadi hanya dapat berkorespondensi dengan satu karyawan. Dalam kasus ini, hubungan antara karyawan dan profil pribadi adalah satu-ke-satu.

Kunci asing dalam hubungan satu-ke-satu dapat ditempatkan di koleksi sumber atau koleksi target. Jika merepresentasikan "memiliki satu", kunci asing lebih tepat ditempatkan di koleksi target; jika merepresentasikan "milik", maka kunci asing lebih baik ditempatkan di koleksi sumber.

Sebagai contoh, dalam kasus yang disebutkan di atas, di mana seorang karyawan hanya memiliki satu profil pribadi dan profil pribadi tersebut milik karyawan, maka tepat untuk menempatkan kunci asing di koleksi profil pribadi.

## Satu-ke-Satu (Memiliki Satu)

Ini menunjukkan bahwa seorang karyawan memiliki catatan profil pribadi.

Relasi ER

![alt text](https://static-docs.nocobase.com/4359e128936bbd7c9ff51bcff1d646dd.png)

Konfigurasi Bidang

![alt text](https://static-docs.nocobase.com/765a87e094b4fb50c9426a108f87105.png)

## Satu-ke-Satu (Milik)

Ini menunjukkan bahwa profil pribadi milik karyawan tertentu.

Relasi ER

![](https://static-docs.nocobase.com/31e7cc3e630220cf1e98753ca24ac72d.png)

Konfigurasi Bidang

![alt text](https://static-docs.nocobase.com/4f09eeb3c7717d61a3498242da43c187c.png)

## Deskripsi Parameter

### Koleksi Sumber

Koleksi sumber adalah koleksi tempat bidang saat ini berada.

### Koleksi Target

Koleksi target adalah koleksi yang sedang dihubungkan.

### Kunci Asing

Digunakan untuk membangun hubungan antara dua koleksi. Dalam hubungan satu-ke-satu, kunci asing dapat ditempatkan di koleksi sumber atau koleksi target. Jika merepresentasikan "memiliki satu", kunci asing lebih tepat ditempatkan di koleksi target; jika merepresentasikan "milik", maka kunci asing lebih baik ditempatkan di koleksi sumber.

### Kunci Sumber <- Kunci Asing (Kunci Asing di Koleksi Target)

Bidang yang direferensikan oleh batasan kunci asing harus unik. Ketika kunci asing ditempatkan di koleksi target, ini menunjukkan "memiliki satu".

### Kunci Target <- Kunci Asing (Kunci Asing di Koleksi Sumber)

Bidang yang direferensikan oleh batasan kunci asing harus unik. Ketika kunci asing ditempatkan di koleksi sumber, ini menunjukkan "milik".

### ON DELETE

ON DELETE mengacu pada aturan tindakan untuk referensi kunci asing di koleksi anak terkait saat menghapus catatan dari koleksi induk. Ini adalah opsi yang ditentukan saat membuat batasan kunci asing. Opsi ON DELETE yang umum meliputi:

- CASCADE: Ketika catatan di koleksi induk dihapus, secara otomatis hapus semua catatan terkait di koleksi anak.
- SET NULL: Ketika catatan di koleksi induk dihapus, atur nilai kunci asing di koleksi anak terkait menjadi NULL.
- RESTRICT: Opsi default, di mana penghapusan catatan koleksi induk ditolak jika ada catatan terkait di koleksi anak.
- NO ACTION: Mirip dengan RESTRICT, penghapusan catatan koleksi induk ditolak jika ada catatan terkait di koleksi anak.