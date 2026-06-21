---
title: "Template Print - Penggunaan Dasar"
description: "Sintaks dasar Template Print: penggantian placeholder, penggantian data, penyisipan data dinamis."
keywords: "Template Print,Placeholder,Sintaks,NocoBase"
---

## Penggunaan Dasar

Plugin Template Print menyediakan berbagai sintaks, dapat menyisipkan data dinamis dan struktur logika secara fleksibel pada Template. Berikut adalah penjelasan sintaks detail dan contoh penggunaan.

### Penggantian Dasar

Gunakan placeholder dengan format `{d.xxx}` untuk mengganti data. Contoh:

- `{d.title}`: Membaca field `title` dari dataset.
- `{d.date}`: Membaca field `date` dari dataset.

**Contoh**:

Konten Template:
```
Pelanggan yang terhormat, halo!

Terima kasih telah membeli Produk kami: {d.productName}.
Nomor Pesanan: {d.orderId}
Tanggal Pesanan: {d.orderDate}

Selamat menggunakan!
```

Dataset:
```json
{
  "productName": "Smart Watch",
  "orderId": "A123456789",
  "orderDate": "2025-01-01"
}
```

Hasil Render:
```
Pelanggan yang terhormat, halo!

Terima kasih telah membeli Produk kami: Smart Watch.
Nomor Pesanan: A123456789
Tanggal Pesanan: 2025-01-01

Selamat menggunakan!
```

### Mengakses Sub-objek

Jika dataset berisi sub-objek, dapat mengakses properti sub-objek melalui notasi titik.

**Sintaks**: `{d.parent.child}`

**Contoh**:

Dataset:
```json
{
  "customer": {
    "name": "Li Lei",
    "contact": {
      "email": "lilei@example.com",
      "phone": "13800138000"
    }
  }
}
```

Konten Template:
```
Nama Pelanggan: {d.customer.name}
Alamat Email: {d.customer.contact.email}
Nomor Telepon: {d.customer.contact.phone}
```

Hasil Render:
```
Nama Pelanggan: Li Lei
Alamat Email: lilei@example.com
Nomor Telepon: 13800138000
```

### Mengakses Array

Jika dataset berisi array, dapat menggunakan keyword reserved `i` untuk mengakses elemen dalam array.

**Sintaks**: `{d.arrayName[i].field}`

**Contoh**:

Dataset:
```json
{
  "staffs": [
    { "firstname": "James", "lastname": "Anderson" },
    { "firstname": "Emily", "lastname": "Roberts" },
    { "firstname": "Michael", "lastname": "Johnson" }
  ]
}
```

Konten Template:
```
Marga karyawan pertama adalah {d.staffs[i=0].lastname}, namanya adalah {d.staffs[i=0].firstname}
```

Hasil Render:
```
Marga karyawan pertama adalah Anderson, namanya adalah James
```


