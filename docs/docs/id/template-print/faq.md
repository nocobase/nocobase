:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

## Pertanyaan Umum dan Solusi

### 1. Kolom dan Sel Kosong di Template Excel Hilang dalam Hasil Render

**Deskripsi Masalah**: Dalam template Excel, jika sebuah sel tidak memiliki konten atau gaya, sel tersebut mungkin akan dihapus saat proses render, menyebabkan sel tersebut hilang dari dokumen akhir.

**Solusi**:

- **Isi Warna Latar Belakang**: Terapkan warna latar belakang pada sel-sel kosong di area target untuk memastikan sel tetap terlihat selama proses render.
- **Sisipkan Spasi**: Sisipkan karakter spasi pada sel-sel kosong untuk mempertahankan struktur sel meskipun tidak ada konten aktual.
- **Atur Batas (Border)**: Tambahkan gaya batas pada tabel untuk memperkuat batas sel dan mencegah sel menghilang saat render.

**Contoh**:

Dalam template Excel, atur latar belakang abu-abu muda untuk semua sel target dan sisipkan spasi pada sel-sel kosong.

### 2. Sel Gabungan Tidak Berfungsi dalam Output

**Deskripsi Masalah**: Saat menggunakan fungsionalitas perulangan untuk menghasilkan tabel, sel gabungan dalam template dapat menyebabkan hasil render yang tidak normal, seperti efek penggabungan yang hilang atau data yang tidak sejajar.

**Solusi**:

- **Hindari Penggunaan Sel Gabungan**: Usahakan untuk menghindari penggunaan sel gabungan dalam tabel output perulangan untuk memastikan render data yang benar.
- **Gunakan "Pusatkan di Seluruh Pilihan"**: Jika Anda perlu memusatkan teks secara horizontal di beberapa sel, gunakan fitur "Pusatkan di Seluruh Pilihan" (Center Across Selection) alih-alih menggabungkan sel.
- **Batasi Posisi Sel Gabungan**: Jika sel gabungan memang diperlukan, gabungkan sel hanya di bagian atas atau kanan tabel. Hindari menggabungkan sel di bagian bawah atau kiri untuk mencegah hilangnya efek penggabungan saat render.

### 3. Konten di Bawah Area Render Perulangan Menyebabkan Format Berantakan

**Deskripsi Masalah**: Dalam template Excel, jika ada konten lain (misalnya, ringkasan pesanan, catatan) di bawah area perulangan yang tumbuh secara dinamis berdasarkan item data (misalnya, detail pesanan), maka saat render, baris data yang dihasilkan oleh perulangan akan meluas ke bawah, langsung menimpa atau mendorong konten statis di bawahnya. Hal ini menyebabkan format dokumen akhir menjadi berantakan dan konten saling tumpang tindih.

**Solusi**:

  * **Sesuaikan Tata Letak, Posisikan Area Perulangan di Bagian Bawah**: Ini adalah metode yang paling direkomendasikan. Tempatkan area tabel yang perlu dirender secara berulang di bagian paling bawah lembar kerja. Pindahkan semua informasi yang semula berada di bawahnya (ringkasan, tanda tangan, dll.) ke atas area perulangan. Dengan demikian, data perulangan dapat meluas ke bawah dengan bebas tanpa memengaruhi elemen lain.
  * **Sediakan Baris Kosong yang Cukup**: Jika konten harus ditempatkan di bawah area perulangan, Anda dapat memperkirakan jumlah maksimum baris yang mungkin dihasilkan oleh perulangan. Kemudian, sisipkan baris kosong yang cukup secara manual sebagai penyangga antara area perulangan dan konten di bawahnya. Namun, metode ini memiliki risiko; jika data aktual melebihi jumlah baris yang diperkirakan, masalah akan muncul kembali.
  * **Gunakan Template Word**: Jika persyaratan tata letak rumit dan tidak dapat diselesaikan dengan menyesuaikan struktur Excel, pertimbangkan untuk menggunakan dokumen Word sebagai template. Tabel di Word secara otomatis akan mendorong konten di bawahnya saat jumlah baris bertambah, tanpa masalah tumpang tindih konten, sehingga lebih cocok untuk pembuatan dokumen dinamis semacam ini.

**Contoh**:

**Pendekatan yang Salah**: Menempatkan informasi "Ringkasan Pesanan" tepat di bawah tabel "Detail Pesanan" yang berulang.
![20250820080712](https://static-docs.nocobase.com/20250820080712.png)

**Pendekatan yang Benar 1 (Sesuaikan Tata Letak)**: Pindahkan informasi "Ringkasan Pesanan" ke atas tabel "Detail Pesanan", menjadikan area perulangan sebagai elemen terbawah halaman.
![20250820082226](https://static-docs.nocobase.com/20250820082226.png)

**Pendekatan yang Benar 2 (Sediakan Baris Kosong)**: Sediakan banyak baris kosong antara "Detail Pesanan" dan "Ringkasan Pesanan" untuk memastikan konten perulangan memiliki ruang ekspansi yang cukup.
![20250820081510](https://static-docs.nocobase.com/20250820081510.png)

**Pendekatan yang Benar 3**: Gunakan template Word.

### 4. Pesan Error Muncul Saat Render Template

**Deskripsi Masalah**: Selama proses render template, sistem menampilkan pesan error yang menyebabkan render gagal.

**Kemungkinan Penyebab**:

- **Error Placeholder**: Nama placeholder tidak cocok dengan bidang dataset atau terdapat kesalahan sintaks.
- **Data Hilang**: Dataset tidak memiliki bidang yang direferensikan dalam template.
- **Penggunaan Formatter yang Tidak Tepat**: Parameter formatter salah atau jenis format yang tidak didukung.

**Solusi**:

- **Periksa Placeholder**: Pastikan nama placeholder dalam template cocok dengan nama bidang dalam dataset dan memiliki sintaks yang benar.
- **Validasi Dataset**: Konfirmasikan bahwa dataset berisi semua bidang yang direferensikan dalam template dengan format data yang sesuai.
- **Sesuaikan Formatter**: Periksa metode penggunaan formatter, pastikan parameter sudah benar, dan gunakan jenis format yang didukung.

**Contoh**:

**Template yang Salah**:
```
订单编号：{d.orderId}
订单日期：{d.orderDate:format('YYYY/MM/DD')}
总金额：{d.totalAmount:format('0.00')}
```

**Dataset**:
```json
{
  "orderId": "A123456789",
  "orderDate": "2025-01-01T10:00:00Z"
  // Bidang totalAmount hilang
}
```

**Solusi**: Tambahkan bidang `totalAmount` ke dataset atau hapus referensi ke `totalAmount` dari template.