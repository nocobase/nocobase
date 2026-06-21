---
title: "Event Flow"
description: "Event Flow Interface Builder: konfigurasi logika interaksi Block dan Field, didorong oleh Flow, dirangkai oleh Step, mengimplementasikan orkestrasi logika bisnis tanpa kode."
keywords: "event flow, Event Flow, Flow, Step, logika interaksi, orkestrasi tanpa kode, interface builder, NocoBase"
---

# Event Flow

## Pengantar

Jika Anda ingin memicu beberapa Action kustom ketika Form tertentu berubah, Anda dapat menggunakan event flow untuk mengimplementasikannya. Selain Form, Page, Block, tombol, dan Field semuanya dapat menggunakan event flow untuk mengkonfigurasi beberapa Action kustom.

## Cara Penggunaan

Berikut adalah contoh sederhana untuk menjelaskan cara mengkonfigurasi event flow. Mari kita implementasikan linkage antara dua Table: ketika baris di Table kiri diklik, data Table kanan akan otomatis difilter.

![20251031092211_rec_](https://static-docs.nocobase.com/20251031092211_rec_.gif)

Langkah konfigurasi adalah sebagai berikut:

1. Klik ikon "petir" di sudut kanan atas Block Table kiri untuk membuka antarmuka konfigurasi event flow.
![20251031092425](https://static-docs.nocobase.com/20251031092425.png)
2. Klik "Add event flow", pilih "Row click" untuk "Trigger event", artinya akan dipicu saat baris Table diklik.
![20251031092637](https://static-docs.nocobase.com/20251031092637.png)
3. Konfigurasi "Execution timing", digunakan untuk mengontrol urutan event flow ini relatif terhadap proses bawaan sistem. Umumnya pertahankan default; jika ingin memberikan prompt/jump setelah logika bawaan dieksekusi, dapat memilih "After all flows". Penjelasan lebih lanjut lihat [Execution Timing](#execution-timing) di bawah.
![event-flow-event-flow-20260204](https://static-docs.nocobase.com/event-flow-event-flow-20260204.png)
4. "Trigger condition" digunakan untuk mengkonfigurasi kondisi, event flow akan dipicu hanya ketika kondisi terpenuhi. Di sini kita tidak perlu mengkonfigurasi, event flow akan dipicu setiap kali baris diklik.
![20251031092717](https://static-docs.nocobase.com/20251031092717.png)
5. Hover mouse ke "Add step", Anda dapat menambahkan beberapa langkah operasi. Kita pilih "Set data scope" untuk mengatur cakupan data Table kanan.
![20251031092755](https://static-docs.nocobase.com/20251031092755.png)
6. Salin UID Table kanan, masukkan ke kolom input "Target block UID". Akan langsung muncul antarmuka konfigurasi kondisi di bawah, di sini Anda dapat mengkonfigurasi cakupan data Table kanan.
![20251031092915](https://static-docs.nocobase.com/20251031092915.png)
7. Mari konfigurasi sebuah kondisi seperti gambar di bawah:
![20251031093233](https://static-docs.nocobase.com/20251031093233.png)
8. Setelah cakupan data dikonfigurasi, masih perlu refresh Block agar hasil filter ditampilkan. Selanjutnya mari konfigurasi refresh Block Table kanan. Tambahkan langkah "Refresh target blocks", lalu masukkan UID Table kanan.
![20251031093150](https://static-docs.nocobase.com/20251031093150.png)
![20251031093341](https://static-docs.nocobase.com/20251031093341.png)
9. Terakhir klik tombol simpan di sudut kanan bawah, konfigurasi selesai.

## Detail Event

### Sebelum Render

Event umum yang dapat digunakan di Page, Block, tombol, atau Field. Dalam event ini, Anda dapat melakukan beberapa pekerjaan inisialisasi. Misalnya mengkonfigurasi cakupan data yang berbeda dalam kondisi yang berbeda.

### Row Click (Klik Baris)

Event khusus Block Table. Dipicu saat baris Table diklik. Saat dipicu, akan menambahkan Clicked row record ke konteks, yang dapat digunakan sebagai variabel dalam kondisi dan langkah.

### Form Values Change (Perubahan Nilai Form)

Event khusus Block Form. Dipicu saat nilai Field Form berubah. Anda dapat memperoleh nilai Form melalui variabel "Current form" dalam kondisi dan langkah.

### Click (Klik)

Event khusus tombol. Dipicu saat tombol diklik.

## Execution Timing

Dalam konfigurasi event flow, ada dua konsep yang mudah membingungkan:

- **Trigger event:** kapan eksekusi dimulai (misalnya: sebelum render, klik baris, klik, perubahan nilai Form, dll.).
- **Execution timing:** Setelah trigger event yang sama terjadi, di mana posisi **proses bawaan** event flow **kustom** Anda akan disisipkan untuk dieksekusi.

### Apa itu "Proses Bawaan/Langkah Bawaan"?

Banyak Page, Block, atau Action sendiri memiliki serangkaian proses pemrosesan bawaan sistem (misalnya: submit, buka Popup, request data, dll.). Saat Anda menambahkan event flow kustom untuk event yang sama (misalnya "klik"), "Execution timing" digunakan untuk menentukan:

- Apakah event flow Anda dieksekusi terlebih dahulu, atau logika bawaan dieksekusi terlebih dahulu;
- Atau menyisipkan event flow Anda untuk dieksekusi sebelum/sesudah langkah tertentu dari proses bawaan.

### Bagaimana Memahami Opsi Execution Timing di UI?

- **Sebelum semua flow (default):** Dieksekusi paling awal. Cocok untuk "intercept/persiapan" (misalnya validasi, konfirmasi ganda, inisialisasi variabel, dll.).
- **Setelah semua flow:** Dieksekusi setelah logika bawaan selesai. Cocok untuk "penyelesaian/feedback" (misalnya pesan prompt, refresh Block lain, jump halaman, dll.).
- **Sebelum flow tertentu / Setelah flow tertentu:** Titik penyisipan yang lebih halus. Setelah dipilih, perlu memilih "proses bawaan" tertentu lagi.
- **Sebelum langkah flow tertentu / Setelah langkah flow tertentu:** Titik penyisipan paling halus. Setelah dipilih, perlu memilih "proses bawaan" dan "langkah proses bawaan" secara bersamaan.

> Tips: Jika Anda tidak yakin proses/langkah bawaan mana yang harus dipilih, prioritaskan untuk menggunakan dua opsi pertama ("sebelum / sesudah").

## Detail Langkah

### Custom Variable (Variabel Kustom)

Digunakan untuk mendefinisikan variabel kustom, kemudian digunakan dalam konteks.

#### Cakupan

Variabel kustom memiliki cakupan, misalnya variabel yang didefinisikan di event flow Block hanya dapat digunakan di Block tersebut. Jika ingin digunakan di semua Block dalam Page saat ini, perlu mengkonfigurasi di event flow Page.

#### Form Variable (Variabel Form)

Menggunakan nilai Block Form tertentu sebagai variabel. Konfigurasi spesifik adalah sebagai berikut:

![20251031093516](https://static-docs.nocobase.com/20251031093516.png)

- Variable title: Judul variabel
- Variable identifier: Identifier variabel
- Form UID: UID Form

#### Variabel Lainnya

Variabel lainnya akan didukung secara bertahap, nantikan.

### Set Data Scope (Atur Cakupan Data)

Mengatur cakupan data Block target. Konfigurasi spesifik adalah sebagai berikut:

![20251031093609](https://static-docs.nocobase.com/20251031093609.png)

- Target block UID: UID Block target
- Condition: Kondisi filter

### Refresh Target Blocks (Refresh Block Target)

Refresh Block target, mendukung konfigurasi beberapa Block. Konfigurasi spesifik adalah sebagai berikut:

![20251031093657](https://static-docs.nocobase.com/20251031093657.png)

- Target block UID: UID Block target

### Navigate to URL (Navigasi ke URL)

Jump ke URL tertentu. Konfigurasi spesifik adalah sebagai berikut:

![20251031093742](https://static-docs.nocobase.com/20251031093742.png)

- URL: URL target, mendukung penggunaan variabel
- Search parameters: Parameter query di URL
- Open in new window: Jika dicentang, akan membuka halaman browser baru saat jump

### Show Message (Tampilkan Pesan)

Menampilkan informasi feedback Action secara global.

#### Kapan Digunakan

- Dapat memberikan informasi feedback seperti sukses, peringatan, dan error.
- Ditampilkan di bagian atas tengah dan otomatis menghilang, merupakan cara prompt ringan yang tidak mengganggu Action pengguna.

#### Konfigurasi Spesifik

![20251031093825](https://static-docs.nocobase.com/20251031093825.png)

- Message type: Tipe prompt
- Message content: Konten prompt
- Duration: Durasi tampilan, dalam satuan detik

### Show Notification (Tampilkan Notifikasi)

Menampilkan informasi notifikasi reminder secara global.

#### Kapan Digunakan

Menampilkan informasi notifikasi reminder di empat sudut sistem. Sering digunakan dalam situasi berikut:

- Konten notifikasi yang relatif kompleks.
- Notifikasi dengan interaksi, memberikan titik tindakan langkah selanjutnya kepada pengguna.
- Push aktif sistem.

#### Konfigurasi Spesifik

![20251031093934](https://static-docs.nocobase.com/20251031093934.png)

- Notification type: Tipe notifikasi
- Notification title: Judul notifikasi
- Notification description: Deskripsi notifikasi
- Placement: Posisi, opsi yang tersedia: kiri atas, kanan atas, kiri bawah, kanan bawah

### Execute JavaScript (Jalankan JavaScript)

![20251031094046](https://static-docs.nocobase.com/20251031094046.png)

Menjalankan kode JavaScript.

### Custom Request (Request Kustom)

#### Kapan Digunakan
Saat dalam proses perlu memanggil interface eksternal atau layanan pihak ketiga, Anda dapat memicu HTTP request kustom melalui **Custom request**. Skenario penggunaan umum meliputi:

* Memanggil API sistem eksternal (seperti CRM, layanan AI, dll.)
* Mendapatkan data jarak jauh dan memprosesnya di langkah proses berikutnya
* Mengirim data ke sistem pihak ketiga (Webhook, notifikasi pesan, dll.)
* Memicu proses otomasi layanan internal atau eksternal

Setelah request selesai dieksekusi, data yang dikembalikan dapat terus digunakan di langkah berikutnya, misalnya untuk pemrosesan data, penilaian kondisi, atau penyimpanan.

#### Konfigurasi Spesifik

![](https://static-docs.nocobase.com/Leads-03-16-2026_05_50_PM%20(1).png)

* HTTP method: Metode HTTP request, misalnya `GET`, `POST`, `PUT`, `DELETE`, dll.
* URL: Alamat target request, dapat diisi dengan URL interface lengkap, juga dapat digabungkan secara dinamis melalui variabel.
* Headers: Informasi header request, digunakan untuk mengirim informasi autentikasi atau konfigurasi interface, seperti `Authorization`, `Content-Type`, dll.
* Parameters: Parameter query URL (Query Parameters), biasanya digunakan untuk request `GET`.
* Body: Konten body request, biasanya digunakan untuk request `POST`, `PUT`, dll., dapat diisi dengan JSON, data Form, dll.
* Timeout config: Konfigurasi timeout request, digunakan untuk membatasi durasi maksimum tunggu request, menghindari proses diblokir terlalu lama.
* Response type: Tipe data response request.
  * JSON: Interface mengembalikan data JSON, hasilnya akan diinjeksikan ke konteks proses, dapat diperoleh melalui `ctx.steps` di langkah berikutnya.
  * Stream: Interface mengembalikan data stream (Stream), setelah request berhasil akan otomatis memicu download file.
* Access control: Kontrol akses, digunakan untuk membatasi peran mana yang dapat memicu langkah request ini, memastikan keamanan pemanggilan interface.


## Contoh

### Form: Memanggil API Pihak Ketiga untuk Mengisi Field

Skenario: Memicu event flow di Form, request API pihak ketiga, setelah mendapatkan data otomatis mengisi ke Field Form.

Langkah konfigurasi:

1. Buka konfigurasi event flow di Block Form, tambahkan satu event flow baru;
2. Trigger event pilih "Sebelum render";
3. Execution timing pilih "Setelah semua flow";
4. Tambahkan langkah "Execute JavaScript", paste dan modifikasi kode di bawah sesuai kebutuhan:

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
