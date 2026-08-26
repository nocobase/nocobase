---
title: "Query Data Mode SQL"
description: "Mode SQL menulis statement query untuk mendapatkan data Chart, mendukung JOIN multi-tabel, VIEW, variabel konteks, pemetaan field, dan preview hasil Table/JSON."
keywords: "query data SQL,mode SQL,data chart,pemetaan field,variabel konteks,NocoBase"
---

# Query Data Mode SQL

Pada panel "Query Data", beralih ke mode SQL, tulis dan jalankan statement query, dan langsung gunakan hasil yang dikembalikan untuk pemetaan dan rendering Chart.

![20251027075805](https://static-docs.nocobase.com/20251027075805.png)

## Tulis Statement SQL
- Pada panel "Query Data" pilih mode "SQL".
- Masukkan SQL, klik "Jalankan Query" untuk eksekusi.
- Mendukung statement SQL lengkap seperti JOIN multi-tabel kompleks, VIEW, dan lainnya.

Contoh: statistik jumlah pesanan per bulan
```sql
SELECT 
  TO_CHAR(order_date, 'YYYY-MM') as mon,
  SUM(total_amount) AS total
FROM "order"
GROUP BY mon
ORDER BY mon ASC
LIMIT 100;
```

## Lihat Hasil
- Klik "Lihat Data" untuk membuka panel preview hasil data.

![20251027080014](https://static-docs.nocobase.com/20251027080014.png)

Data mendukung tampilan dengan paginasi, juga dapat beralih Table/JSON untuk memeriksa nama dan tipe kolom
![20251027080100](https://static-docs.nocobase.com/20251027080100.png)

## Pemetaan Field
- Pada konfigurasi Opsi Chart, selesaikan pemetaan berdasarkan kolom hasil query data.
- Secara default, kolom pertama akan otomatis dijadikan dimensi (sumbu X atau kategori), kolom kedua sebagai ukuran (sumbu Y atau nilai). Jadi perhatikan urutan field pada SQL:

```sql
SELECT 
  TO_CHAR(order_date, 'YYYY-MM') as mon, -- field dimensi diletakkan di kolom pertama
  SUM(total_amount) AS total -- field ukuran diletakkan setelahnya
```

![clipboard-image-1761524022](https://static-docs.nocobase.com/clipboard-image-1761524022.png)

## Menggunakan Variabel Konteks
Klik tombol x di pojok kanan atas editor SQL untuk memilih dan menggunakan variabel konteks.

![20251027081752](https://static-docs.nocobase.com/20251027081752.png)

Setelah dipilih dan dikonfirmasi, ekspresi variabel akan disisipkan pada posisi kursor teks SQL (atau posisi konten yang dipilih).

Misalnya `{{ ctx.user.createdAt }}`, perhatikan jangan menambahkan tanda petik sendiri.

![20251027081957](https://static-docs.nocobase.com/20251027081957.png)

## Contoh Lainnya
Untuk lebih banyak contoh penggunaan, lihat [Demo Aplikasi](https://demo3.sg.nocobase.com/admin/5xrop8s0bui) NocoBase.

**Saran:**
- Lakukan pemetaan Chart setelah nama kolom stabil, untuk menghindari error di kemudian hari.
- Pada tahap debugging atur `LIMIT` untuk mengurangi jumlah baris yang dikembalikan, untuk mempercepat preview.


## Preview, Simpan, dan Rollback
- Klik "Jalankan Query" untuk mengeksekusi permintaan data dan merefresh preview Chart.
- Klik "Simpan" untuk menyimpan teks SQL dan konfigurasi lainnya saat ini ke database.
- Klik "Batal" untuk kembali ke status simpan sebelumnya, membuang perubahan yang belum disimpan saat ini.
