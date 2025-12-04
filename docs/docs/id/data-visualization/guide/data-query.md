:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Kueri Data

Panel konfigurasi bagan secara keseluruhan terbagi menjadi tiga bagian: Kueri Data, Opsi Bagan, dan Event Interaksi, ditambah tombol Batalkan, Pratinjau, dan Simpan di bagian bawah.

Mari kita lihat panel "Kueri Data" terlebih dahulu untuk memahami dua mode kueri (Builder/SQL) dan fitur-fitur umumnya.

## Struktur Panel
![clipboard-image-1761466636](https://static-docs.nocobase.com/clipboard-image-1761466636.png)

> Tips: Untuk mengonfigurasi konten saat ini dengan lebih mudah, Anda bisa melipat panel lain terlebih dahulu.

Bagian paling atas adalah bilah aksi:
- Mode: Builder (grafis, sederhana, dan nyaman) / SQL (pernyataan tulisan tangan, lebih fleksibel).
- Jalankan Kueri: Klik untuk mengeksekusi permintaan kueri data.
- Lihat Hasil: Membuka panel hasil data, tempat Anda dapat beralih antara tampilan Tabel/JSON. Klik lagi untuk melipat panel.

Dari atas ke bawah secara berurutan:
- Sumber Data dan koleksi: Wajib diisi. Pilih sumber data dan tabel data.
- Ukuran (Measures): Wajib diisi. Bidang numerik yang akan ditampilkan.
- Dimensi (Dimensions): Kelompokkan berdasarkan bidang (misalnya, tanggal, kategori, wilayah).
- Filter: Atur kondisi filter (misalnya, =, ≠, >, <, berisi, rentang). Beberapa kondisi dapat digabungkan.
- Urutkan: Pilih bidang untuk diurutkan dan urutan (naik/turun).
- Paginasi: Kontrol rentang data dan urutan pengembalian.

## Mode Builder

### Pilih sumber data dan koleksi
- Di panel "Kueri Data", atur mode ke "Builder".
- Pilih sumber data dan koleksi (tabel data). Jika koleksi tidak dapat dipilih atau kosong, periksa terlebih dahulu izin dan apakah koleksi sudah dibuat.

### Konfigurasi Ukuran (Measures)
- Pilih satu atau lebih bidang numerik dan atur agregasi: `Sum`, `Count`, `Avg`, `Max`, `Min`.
- Kasus penggunaan umum: `Count` untuk menghitung catatan, `Sum` untuk menghitung total.

### Konfigurasi Dimensi (Dimensions)
- Pilih satu atau lebih bidang sebagai dimensi pengelompokan.
- Bidang tanggal dan waktu dapat diformat (misalnya, `YYYY-MM`, `YYYY-MM-DD`) untuk memfasilitasi pengelompokan berdasarkan bulan atau hari.

### Filter, Urutkan, dan Paginasi
- Filter: Tambahkan kondisi (misalnya, =, ≠, berisi, rentang). Beberapa kondisi dapat digabungkan.
- Urutkan: Pilih bidang dan urutan pengurutan (naik/turun).
- Paginasi: Atur `Limit` dan `Offset` untuk mengontrol jumlah baris yang dikembalikan. Disarankan untuk mengatur `Limit` yang kecil saat melakukan debug.

### Jalankan Kueri dan Lihat Hasil
- Klik "Jalankan Kueri" untuk mengeksekusi. Setelah kembali, beralihlah antara `Tabel / JSON` di "Lihat Hasil" untuk memeriksa kolom dan nilai.
- Sebelum memetakan bidang bagan, konfirmasikan nama kolom dan tipenya di sini untuk menghindari bagan kosong atau error di kemudian hari.

![20251026174338](https://static-docs.nocobase.com/20251026174338.png)

### Pemetaan Bidang Selanjutnya

Selanjutnya, saat mengonfigurasi "Opsi Bagan", Anda akan memetakan bidang berdasarkan bidang dari sumber data dan koleksi yang dipilih.

## Mode SQL

### Tulis Kueri
- Beralih ke mode "SQL", masukkan pernyataan kueri Anda, dan klik "Jalankan Kueri".
- Contoh (jumlah total pesanan berdasarkan tanggal):
```sql
SELECT 
  TO_CHAR(order_date, 'YYYY-MM') as mon,
  SUM(total_amount) AS total
FROM "order"
GROUP BY mon
ORDER BY mon ASC
LIMIT 100;
```

![20251026175952](https://static-docs.nocobase.com/20251026175952.png)

### Jalankan Kueri dan Lihat Hasil

- Klik "Jalankan Kueri" untuk mengeksekusi. Setelah kembali, beralihlah antara `Tabel / JSON` di "Lihat Hasil" untuk memeriksa kolom dan nilai.
- Sebelum memetakan bidang bagan, konfirmasikan nama kolom dan tipenya di sini untuk menghindari bagan kosong atau error di kemudian hari.

### Pemetaan Bidang Selanjutnya

Selanjutnya, saat mengonfigurasi "Opsi Bagan", Anda akan memetakan bidang berdasarkan kolom dari hasil kueri.

> [!TIP]
> Untuk informasi lebih lanjut tentang mode SQL, silakan lihat [Penggunaan Lanjutan — Kueri Data dalam Mode SQL](#).