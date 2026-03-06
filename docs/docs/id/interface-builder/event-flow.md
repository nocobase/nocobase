:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/interface-builder/event-flow).
:::

# Alur Peristiwa

## Pendahuluan

Jika Anda ingin memicu beberapa operasi kustom saat formulir tertentu berubah, Anda dapat menggunakan alur peristiwa untuk mencapainya. Selain formulir, halaman, blok, tombol, dan bidang juga dapat menggunakan alur peristiwa untuk mengonfigurasi beberapa operasi kustom.

## Cara Penggunaan

Di bawah ini akan dijelaskan cara mengonfigurasi alur peristiwa dengan contoh sederhana. Mari kita implementasikan keterkaitan antara dua tabel, di mana saat mengklik baris tertentu pada tabel kiri, data pada tabel kanan akan difilter secara otomatis.

![20251031092211_rec_](https://static-docs.nocobase.com/20251031092211_rec_.gif)

Langkah-langkah konfigurasi adalah sebagai berikut:

1. Klik ikon "petir" di sudut kanan atas blok tabel kiri untuk membuka antarmuka konfigurasi alur peristiwa.
![20251031092425](https://static-docs.nocobase.com/20251031092425.png)
2. Klik "Tambahkan alur peristiwa (Add event flow)", pilih "Klik baris (Row click)" sebagai "Pemicu peristiwa", yang berarti alur akan terpicu saat baris tabel diklik.
![20251031092637](https://static-docs.nocobase.com/20251031092637.png)
3. Konfigurasi "Waktu eksekusi (Execution timing)", yang digunakan untuk mengontrol urutan alur peristiwa ini relatif terhadap alur bawaan sistem. Umumnya biarkan default; jika Anda ingin memberikan petunjuk/navigasi setelah logika bawaan selesai dieksekusi, pilih "Setelah semua alur (After all flows)". Penjelasan lebih lanjut lihat di bawah [Waktu eksekusi](#waktu-eksekusi).
![event-flow-event-flow-20260204](https://static-docs.nocobase.com/event-flow-event-flow-20260204.png)
4. "Kondisi pemicu (Trigger condition)" digunakan untuk mengonfigurasi kondisi, di mana alur peristiwa hanya akan terpicu jika kondisi terpenuhi. Di sini kita tidak perlu mengonfigurasinya, sehingga setiap klik pada baris akan memicu alur peristiwa.
![20251031092717](https://static-docs.nocobase.com/20251031092717.png)
5. Arahkan kursor ke "Tambahkan langkah (Add step)" untuk menambahkan beberapa langkah operasi. Kita pilih "Atur cakupan data (Set data scope)" untuk mengatur cakupan data tabel kanan.
![20251031092755](https://static-docs.nocobase.com/20251031092755.png)
6. Salin UID tabel kanan, lalu masukkan ke dalam kolom input "UID blok target (Target block UID)". Antarmuka konfigurasi kondisi akan segera muncul di bawahnya, di mana Anda dapat mengonfigurasi cakupan data untuk tabel kanan.
![20251031092915](https://static-docs.nocobase.com/20251031092915.png)
7. Mari kita konfigurasikan sebuah kondisi seperti yang ditunjukkan pada gambar di bawah ini:
![20251031093233](https://static-docs.nocobase.com/20251031093233.png)
8. Setelah mengonfigurasi cakupan data, Anda juga perlu me-refresh blok agar hasil filter ditampilkan. Selanjutnya, mari kita konfigurasikan refresh blok tabel kanan. Tambahkan langkah "Refresh blok target (Refresh target blocks)", lalu masukkan UID tabel kanan.
![20251031093150](https://static-docs.nocobase.com/20251031093150.png)
![20251031093341](https://static-docs.nocobase.com/20251031093341.png)
9. Terakhir, klik tombol simpan di sudut kanan bawah, dan konfigurasi selesai.

## Penjelasan Detail Peristiwa

### Sebelum render (Before render)

Peristiwa universal yang dapat digunakan dalam halaman, blok, tombol, atau bidang. Dalam peristiwa ini, Anda dapat melakukan beberapa pekerjaan inisialisasi. Misalnya, mengonfigurasi cakupan data yang berbeda di bawah kondisi yang berbeda.

### Klik baris (Row click)

Peristiwa khusus untuk blok tabel. Terpicu saat baris tabel diklik. Saat terpicu, `Clicked row record` akan ditambahkan ke dalam konteks, yang dapat digunakan sebagai variabel dalam kondisi dan langkah-langkah.

### Perubahan nilai formulir (Form values change)

Peristiwa khusus untuk blok formulir. Terpicu saat nilai bidang formulir berubah. Anda dapat memperoleh nilai formulir melalui variabel "Current form" dalam kondisi dan langkah-langkah.

### Klik (Click)

Peristiwa khusus untuk tombol. Terpicu saat tombol diklik.

## Waktu Eksekusi

Dalam konfigurasi alur peristiwa, terdapat dua konsep yang mudah membingungkan:

- **Pemicu peristiwa:** Kapan mulai dieksekusi (misalnya: Sebelum render, Klik baris, Klik, Perubahan nilai formulir, dll.).
- **Waktu eksekusi:** Setelah peristiwa pemicu yang sama terjadi, di posisi mana **alur peristiwa kustom** Anda akan disisipkan ke dalam **alur bawaan** untuk dieksekusi.

### Apa itu "Alur bawaan / Langkah bawaan"?

Banyak halaman, blok, atau operasi yang sudah memiliki serangkaian alur pemrosesan bawaan sistem (misalnya: kirim, buka pop-up, minta data, dll.). Saat Anda menambahkan alur peristiwa kustom baru untuk peristiwa yang sama (misalnya "Klik"), "Waktu eksekusi" digunakan untuk menentukan:

- Apakah akan mengeksekusi alur peristiwa Anda terlebih dahulu, atau mengeksekusi logika bawaan terlebih dahulu;
- Atau menyisipkan alur peristiwa Anda sebelum atau sesudah langkah tertentu dalam alur bawaan.

### Bagaimana memahami opsi waktu eksekusi di UI?

- **Sebelum semua alur (Default):** Dieksekusi paling awal. Cocok untuk melakukan "intersepsi/persiapan" (seperti validasi, konfirmasi ulang, inisialisasi variabel, dll.).
- **Setelah semua alur:** Dieksekusi setelah logika bawaan selesai. Cocok untuk melakukan "penyelesaian/umpan balik" (seperti pesan petunjuk, me-refresh blok lain, navigasi halaman, dll.).
- **Sebelum alur tertentu / Setelah alur tertentu:** Titik penyisipan yang lebih presisi. Setelah dipilih, Anda perlu memilih "Alur bawaan" yang spesifik.
- **Sebelum langkah alur tertentu / Setelah langkah alur tertentu:** Titik penyisipan yang paling presisi. Setelah dipilih, Anda perlu memilih "Alur bawaan" dan "Langkah alur bawaan" secara bersamaan.

> Petunjuk: Jika Anda tidak yakin harus memilih alur/langkah bawaan yang mana, prioritaskan penggunaan dua opsi pertama ("Sebelum / Sesudah").

## Penjelasan Detail Langkah

### Variabel kustom (Custom variable)

Digunakan untuk menentukan variabel kustom, lalu menggunakannya dalam konteks.

#### Cakupan

Variabel kustom memiliki cakupan (scope), misalnya variabel yang ditentukan dalam alur peristiwa suatu blok hanya dapat digunakan dalam blok tersebut. Jika ingin dapat digunakan di semua blok dalam halaman saat ini, maka perlu dikonfigurasi dalam alur peristiwa di tingkat halaman.

#### Variabel formulir (Form variable)

Menggunakan nilai dari blok formulir tertentu sebagai variabel. Konfigurasi spesifiknya adalah sebagai berikut:

![20251031093516](https://static-docs.nocobase.com/20251031093516.png)

- Variable title: Judul variabel
- Variable identifier: Pengidentifikasi variabel
- Form UID: UID formulir

#### Variabel lainnya

Variabel lainnya akan didukung secara bertahap di masa mendatang, harap nantikan.

### Atur cakupan data (Set data scope)

Mengatur cakupan data untuk blok target. Konfigurasi spesifiknya adalah sebagai berikut:

![20251031093609](https://static-docs.nocobase.com/20251031093609.png)

- Target block UID: UID blok target
- Condition: Kondisi filter

### Refresh blok target (Refresh target blocks)

Me-refresh blok target, memungkinkan konfigurasi beberapa blok. Konfigurasi spesifiknya adalah sebagai berikut:

![20251031093657](https://static-docs.nocobase.com/20251031093657.png)

- Target block UID: UID blok target

### Navigasi ke URL (Navigate to URL)

Navigasi ke URL tertentu. Konfigurasi spesifiknya adalah sebagai berikut:

![20251031093742](https://static-docs.nocobase.com/20251031093742.png)

- URL: URL target, mendukung penggunaan variabel
- Search parameters: Parameter kueri dalam URL
- Open in new window: Jika dicentang, akan membuka halaman browser baru saat navigasi

### Tampilkan pesan (Show message)

Menampilkan informasi umpan balik operasi secara global.

#### Kapan digunakan

- Dapat memberikan informasi umpan balik seperti sukses, peringatan, dan kesalahan.
- Ditampilkan di tengah atas dan menghilang secara otomatis, merupakan cara petunjuk ringan yang tidak mengganggu operasi pengguna.

#### Konfigurasi spesifik

![20251031093825](https://static-docs.nocobase.com/20251031093825.png)

- Message type: Jenis pesan
- Message content: Konten pesan
- Duration: Berapa lama durasi tampilan, dalam satuan detik

### Tampilkan notifikasi (Show notification)

Menampilkan informasi peringatan notifikasi secara global.

#### Kapan digunakan

Menampilkan informasi peringatan notifikasi di empat sudut sistem. Sering digunakan untuk situasi berikut:

- Konten notifikasi yang relatif kompleks.
- Notifikasi dengan interaksi, memberikan poin tindakan selanjutnya bagi pengguna.
- Dorongan aktif dari sistem.

#### Konfigurasi spesifik

![20251031093934](https://static-docs.nocobase.com/20251031093934.png)

- Notification type: Jenis notifikasi
- Notification title: Judul notifikasi
- Notification description: Deskripsi notifikasi
- Placement: Posisi, opsi yang tersedia: kiri atas, kanan atas, kiri bawah, kanan bawah

### Jalankan JavaScript (Execute JavaScript)

![20251031094046](https://static-docs.nocobase.com/20251031094046.png)

Mengeksekusi kode JavaScript.

## Contoh

### Formulir: Memanggil API pihak ketiga untuk mengisi kembali bidang

Skenario: Memicu alur peristiwa dalam formulir, meminta API pihak ketiga, dan setelah mendapatkan data, secara otomatis mengisinya kembali ke dalam bidang formulir.

Langkah konfigurasi:

1. Buka konfigurasi alur peristiwa dalam blok formulir, tambahkan alur peristiwa baru;
2. Pilih "Sebelum render" sebagai pemicu peristiwa;
3. Pilih "Setelah semua alur" sebagai waktu eksekusi;
4. Tambahkan langkah "Jalankan JavaScript (Execute JavaScript)", tempel dan modifikasi kode berikut sesuai kebutuhan:

```js
const res = await ctx.api.request({
  method: 'get',
  url: 'https://jsonplaceholder.typicode.com/users/2',
  skipNotify: true,
  // Note: ctx.api will include the current NocoBase authentication/custom headers by default
  // Here we override it with an "empty Authorization" to avoid sending the token to a third party
  headers: {
    Authorization: 'Bearer ',
  },
});

const username = res?.data?.username;

// replace it with actual field name
ctx.form.setFieldsValue({ username });
```