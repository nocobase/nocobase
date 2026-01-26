:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Wajib Diisi

## Pendahuluan

"Wajib Diisi" adalah aturan umum untuk validasi formulir. Anda dapat mengaktifkannya langsung di konfigurasi kolom, atau secara dinamis menetapkan kolom sebagai wajib diisi melalui aturan keterkaitan formulir.

## Di Mana Mengatur Kolom sebagai Wajib Diisi

### Pengaturan Kolom Koleksi

Ketika sebuah kolom koleksi diatur sebagai wajib diisi, ini akan memicu validasi *backend*, dan *frontend* juga akan menampilkannya sebagai wajib diisi secara *default* (tidak dapat diubah).
![20251025175418](https://static-docs.nocobase.com/20251025175418.png)

### Pengaturan Kolom

Atur langsung kolom sebagai wajib diisi. Ini cocok untuk kolom yang selalu harus diisi oleh pengguna, seperti nama pengguna, kata sandi, dll.

![20251028222818](https://static-docs.nocobase.com/20251028222818.png)

### Aturan Keterkaitan

Atur kolom sebagai wajib diisi berdasarkan kondisi melalui aturan keterkaitan kolom pada blok formulir.

Contoh: Nomor pesanan wajib diisi ketika tanggal pesanan tidak kosong.

![20251028223004](https://static-docs.nocobase.com/20251028223004.png)

### Alur Kerja