:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

## Penggunaan Dasar

Plugin Pencetakan Template menyediakan berbagai sintaks untuk menyisipkan data dinamis dan struktur logis ke dalam template secara fleksibel. Berikut adalah penjelasan sintaks dan contoh penggunaannya secara detail.

### Penggantian Dasar

Gunakan placeholder dalam format `{d.xxx}` untuk penggantian data. Contoh:

- `{d.title}`: Membaca bidang `title` dari dataset.
- `{d.date}`: Membaca bidang `date` dari dataset.

**Contoh**:

Isi Template:
```
Pelanggan yang terhormat,

Terima kasih telah membeli produk kami: {d.productName}.
ID Pesanan: {d.orderId}
Tanggal Pesanan: {d.orderDate}

Semoga Anda menikmati pengalaman menggunakannya!
```

Dataset:
```json
{
  "productName": "智能手表",
  "orderId": "A123456789",
  "orderDate": "2025-01-01"
}
```

Hasil Render:
```
Pelanggan yang terhormat,

Terima kasih telah membeli produk kami: Smart Watch.
ID Pesanan: A123456789
Tanggal Pesanan: 2025-01-01

Semoga Anda menikmati pengalaman menggunakannya!
```

### Mengakses Sub-objek

Jika dataset berisi sub-objek, Anda dapat mengakses properti sub-objek menggunakan notasi titik.

**Sintaks**: `{d.parent.child}`

**Contoh**:

Dataset:
```json
{
  "customer": {
    "name": "李雷",
    "contact": {
      "email": "lilei@example.com",
      "phone": "13800138000"
    }
  }
}
```

Isi Template:
```
Nama Pelanggan: {d.customer.name}
Alamat Email: {d.customer.contact.email}
Nomor Telepon: {d.customer.contact.phone}
```

Hasil Render:
```
Nama Pelanggan: 李雷
Alamat Email: lilei@example.com
Nomor Telepon: 13800138000
```

### Mengakses Array

Jika dataset berisi array, Anda dapat menggunakan kata kunci `i` yang dicadangkan untuk mengakses elemen dalam array.

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

Isi Template:
```
Nama belakang karyawan pertama adalah {d.staffs[i=0].lastname}, dan nama depannya adalah {d.staffs[i=0].firstname}
```

Hasil Render:
```
Nama belakang karyawan pertama adalah Anderson, dan nama depannya adalah James
```