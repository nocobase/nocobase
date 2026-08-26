---
title: "Template Print - FAQ"
description: "FAQ Template Print: solusi sel kosong Excel hilang, merge cell tidak berfungsi, format kacau saat render loop, dll."
keywords: "Template Print,FAQ,NocoBase"
---

## FAQ dan Solusi

### 1. Kolom Kosong dan Sel Kosong di Template Excel Hilang dalam Hasil Render

**Deskripsi Masalah**: Pada Template Excel, jika sel tertentu tidak memiliki konten atau gaya, mungkin akan dihilangkan saat render, menyebabkan sel tersebut hilang di dokumen akhir.

**Solusi**:

- **Isi Background Color**: Isi warna latar untuk sel kosong di area target, memastikan sel tetap terlihat selama proses render.
- **Sisipkan Spasi**: Sisipkan karakter spasi pada sel kosong, meskipun tidak ada konten aktual, dapat mempertahankan struktur sel.
- **Atur Border**: Tambahkan style border pada tabel, memperkuat batas sel, menghindari sel hilang saat render.

**Contoh**:

Pada Template Excel, atur background abu-abu muda untuk semua sel target, dan sisipkan spasi pada sel kosong.

### 2. Merge Cell Tidak Berfungsi Saat Output

**Deskripsi Masalah**: Saat menggunakan fitur loop untuk output tabel, jika ada merge cell pada Template, mungkin akan menyebabkan hasil render tidak normal, seperti efek merge hilang atau data tidak align.

**Solusi**:

- **Hindari Merge Cell**: Sebisa mungkin hindari menggunakan merge cell pada tabel yang di-loop, untuk memastikan data ter-render dengan benar.
- **Gunakan Center Across Selection**: Jika perlu teks yang center horizontal di beberapa sel, gunakan fitur "Center Across Selection", bukan merge cell.
- **Batasi Posisi Merge Cell**: Jika harus menggunakan merge cell, lakukan merge hanya di bagian atas atau kanan tabel, hindari merge di bawah atau kiri, untuk mencegah efek merge hilang saat render.



### 3. Konten di Bawah Area Loop Render Menyebabkan Format Kacau

**Deskripsi Masalah**: Pada Template Excel, jika di bawah area loop yang akan tumbuh secara dinamis berdasarkan data (misalnya, detail Pesanan), masih ada konten lain (misalnya, ringkasan Pesanan, catatan), maka saat render, baris data yang dihasilkan loop akan diperluas ke bawah, langsung menutupi atau mendorong konten statis di bawah, menyebabkan format dokumen akhir kacau, konten tumpang tindih.

**Solusi**:

  * **Sesuaikan Layout, Letakkan Area Loop di Bagian Bawah**: Ini adalah metode yang paling direkomendasikan. Letakkan area tabel yang perlu di-loop di bagian bawah seluruh worksheet. Pindahkan informasi seperti ringkasan, tanda tangan, dll. yang awalnya di bawah ke atas area loop. Dengan begitu, data loop dapat dengan bebas diperluas ke bawah, tanpa memengaruhi elemen lain.
  * **Sediakan Baris Kosong yang Cukup**: Jika harus menempatkan konten di bawah area loop, perkirakan jumlah baris maksimum yang mungkin dihasilkan loop, dan sisipkan baris kosong yang cukup secara manual antara area loop dan konten di bawahnya sebagai buffer. Tetapi metode ini ada risikonya, jika data aktual melebihi perkiraan, masalah akan muncul lagi.
  * **Gunakan Template Word**: Jika persyaratan layout kompleks dan tidak dapat diselesaikan dengan menyesuaikan struktur Excel, dapat mempertimbangkan menggunakan dokumen Word sebagai Template. Tabel di Word akan secara otomatis mendorong konten di bawah saat baris bertambah, tidak akan terjadi konten yang tertutup, lebih cocok untuk generate dokumen dinamis seperti ini.

**Contoh**:

**Cara yang Salah**: Menempatkan informasi "Ringkasan Pesanan" tepat di bawah tabel "Detail Pesanan" yang di-loop.
![20250820080712](https://static-docs.nocobase.com/20250820080712.png)

**Cara Benar 1 (Sesuaikan Layout)**: Pindahkan informasi "Ringkasan Pesanan" ke atas tabel "Detail Pesanan", biarkan area loop menjadi elemen di bagian bawah halaman.
![20250820082226](https://static-docs.nocobase.com/20250820082226.png)

**Cara Benar 2 (Sediakan Baris Kosong)**: Sediakan banyak baris kosong antara "Detail Pesanan" dan "Ringkasan Pesanan", memastikan konten loop memiliki ruang ekspansi yang cukup.
![20250820081510](https://static-docs.nocobase.com/20250820081510.png)

**Cara Benar 3**: Gunakan Template Word.




### 4. Muncul Pesan Error Saat Template Render

**Deskripsi Masalah**: Selama proses render Template, sistem menampilkan pesan error, menyebabkan render gagal.

**Kemungkinan Penyebab**:

- **Kesalahan Placeholder**: Nama placeholder tidak cocok dengan field dataset atau ada kesalahan sintaks.
- **Data Hilang**: Dataset tidak memiliki field yang direferensikan dalam Template.
- **Penggunaan Formatter yang Tidak Tepat**: Parameter formatter salah atau tipe Format yang tidak didukung.

**Solusi**:

- **Periksa Placeholder**: Pastikan nama placeholder dalam Template cocok dengan nama field dalam dataset, dan sintaksnya benar.
- **Verifikasi Dataset**: Konfirmasi dataset berisi semua field yang direferensikan dalam Template, dan format datanya sesuai persyaratan.
- **Sesuaikan Formatter**: Periksa cara penggunaan formatter, pastikan parameter benar, dan gunakan tipe Format yang didukung.

**Contoh**:

**Template yang Salah**:
```
Nomor Pesanan: {d.orderId}
Tanggal Pesanan: {d.orderDate:format('YYYY/MM/DD')}
Total Jumlah: {d.totalAmount:format('0.00')}
```

**Dataset**:
```json
{
  "orderId": "A123456789",
  "orderDate": "2025-01-01T10:00:00Z"
  // Tidak ada field totalAmount
}
```

**Solusi**: Tambahkan field `totalAmount` ke dataset, atau hapus referensi ke `totalAmount` dari Template.
