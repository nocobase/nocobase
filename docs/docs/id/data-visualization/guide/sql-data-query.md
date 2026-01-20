:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Kueri Data dalam Mode SQL

Di panel "Kueri Data", beralihlah ke mode SQL, tulis dan jalankan pernyataan kueri, lalu gunakan hasil yang dikembalikan secara langsung untuk pemetaan dan rendering bagan.

![20251027075805](https://static-docs.nocobase.com/20251027075805.png)

## Menulis Pernyataan SQL
- Di panel "Kueri Data", pilih mode "SQL".
- Masukkan SQL dan klik "Jalankan Kueri" untuk mengeksekusinya.
- Mendukung pernyataan SQL lengkap yang kompleks, termasuk JOIN multi-tabel dan VIEW.

Contoh: Jumlah pesanan per bulan
```sql
SELECT 
  TO_CHAR(order_date, 'YYYY-MM') as mon,
  SUM(total_amount) AS total
FROM "order"
GROUP BY mon
ORDER BY mon ASC
LIMIT 100;
```

## Melihat Hasil
- Klik "Lihat Data" untuk membuka panel pratinjau hasil data.

![20251027080014](https://static-docs.nocobase.com/20251027080014.png)

Data mendukung tampilan berhalaman; Anda juga dapat beralih antara Table/JSON untuk memeriksa nama dan tipe kolom.
![20251027080100](https://static-docs.nocobase.com/20251027080100.png)

## Pemetaan Bidang
- Di konfigurasi "Opsi Bagan", selesaikan pemetaan berdasarkan kolom hasil data kueri.
- Secara default, kolom pertama akan otomatis digunakan sebagai dimensi (sumbu X atau kategori), dan kolom kedua sebagai ukuran (sumbu Y atau nilai). Jadi, perhatikan urutan bidang dalam SQL:

```sql
SELECT 
  TO_CHAR(order_date, 'YYYY-MM') as mon, -- bidang dimensi di kolom pertama
  SUM(total_amount) AS total -- bidang ukuran setelahnya
```

![clipboard-image-1761524022](https://static-docs.nocobase.com/clipboard-image-1761524022.png)

## Menggunakan Variabel Konteks
Klik tombol x di pojok kanan atas editor SQL untuk memilih variabel konteks.

![20251027081752](https://static-docs.nocobase.com/20251027081752.png)

Setelah konfirmasi, ekspresi variabel akan disisipkan pada posisi kursor (atau posisi teks yang dipilih) di teks SQL.

Contohnya, `{{ ctx.user.createdAt }}`. Perhatikan agar tidak menambahkan tanda kutip tambahan secara manual.

![20251027081957](https://static-docs.nocobase.com/20251027081957.png)

## Contoh Lain
Untuk contoh penggunaan lebih lanjut, Anda bisa merujuk ke [aplikasi Demo](https://demo3.sg.nocobase.com/admin/5xrop8s0bui) NocoBase.

**Saran:**
- Stabilkan nama kolom sebelum melakukan pemetaan ke bagan untuk menghindari kesalahan di kemudian hari.
- Selama tahap debugging, atur `LIMIT` untuk mengurangi jumlah baris yang dikembalikan dan mempercepat pratinjau.

## Pratinjau, Simpan, dan Kembalikan
- Klik "Jalankan Kueri" untuk mengeksekusi permintaan data dan menyegarkan pratinjau bagan.
- Klik "Simpan" untuk menyimpan teks SQL saat ini dan konfigurasi terkait ke database.
- Klik "Batal" untuk kembali ke status terakhir yang disimpan dan membuang perubahan yang belum disimpan saat ini.