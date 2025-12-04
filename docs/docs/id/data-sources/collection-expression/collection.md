:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Koleksi Ekspresi

## Membuat Koleksi Template "Ekspresi"

Sebelum menggunakan node operasi ekspresi dinamis dalam sebuah alur kerja, Anda perlu membuat koleksi template "Ekspresi" terlebih dahulu melalui alat manajemen koleksi. Koleksi ini berfungsi untuk menyimpan berbagai ekspresi:

![Membuat Koleksi Template Ekspresi](https://static-docs.nocobase.com/33afe3369a1ea7943f12a04d9d4443ce.png)

## Memasukkan Data Ekspresi

Setelah itu, Anda bisa membuat blok tabel dan memasukkan beberapa entri formula ke dalam koleksi template tersebut. Setiap baris data dalam koleksi template "Ekspresi" dapat dipahami sebagai aturan perhitungan yang dirancang untuk model data koleksi tertentu. Anda dapat menggunakan nilai bidang dari model data berbagai koleksi sebagai variabel, lalu membuat ekspresi unik sebagai aturan perhitungan. Tentu saja, Anda juga bisa memanfaatkan mesin perhitungan yang berbeda sesuai kebutuhan.

![Memasukkan Data Ekspresi](https://static-docs.nocobase.com/761047f8daabacccbc6a924a73564093.png)

:::info{title=Tips}
Setelah formula dibuat, Anda perlu mengaitkannya dengan data bisnis. Mengaitkan setiap baris data bisnis secara langsung dengan baris data formula bisa jadi rumit. Oleh karena itu, pendekatan umum adalah menggunakan koleksi metadata, mirip dengan koleksi klasifikasi, untuk membuat hubungan banyak-ke-satu (atau satu-ke-satu) dengan koleksi formula. Kemudian, data bisnis dikaitkan dengan metadata yang diklasifikasikan dalam hubungan banyak-ke-satu. Dengan pendekatan ini, saat membuat data bisnis, Anda cukup menentukan metadata klasifikasi yang relevan, sehingga memudahkan untuk menemukan dan menggunakan data formula yang sesuai melalui jalur asosiasi yang telah dibuat.
:::

## Memuat Data yang Relevan ke dalam Proses

Sebagai contoh, buatlah sebuah alur kerja yang terpicu oleh event koleksi. Saat pesanan dibuat, pemicu ini harus memuat data produk yang terkait dengan pesanan beserta data ekspresi yang berhubungan dengan produk:

![Event Koleksi_Konfigurasi Pemicu](https://static-docs.nocobase.com/f181f75b10007afd5de068f3458d2e04.png)