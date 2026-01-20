---
pkg: '@nocobase/plugin-password-policy'
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Kebijakan Kata Sandi

## Pendahuluan

Mengatur aturan kata sandi, masa berlaku kata sandi, dan kebijakan keamanan masuk kata sandi untuk semua pengguna, serta mengelola pengguna yang terkunci.

## Aturan Kata Sandi

![](https://static-docs.nocobase.com/202412281329313.png)

### Panjang Kata Sandi Minimum

Mengatur persyaratan panjang minimum untuk kata sandi, dengan panjang maksimum 64.

### Persyaratan Kompleksitas Kata Sandi

Opsi berikut didukung:

- Harus mengandung huruf dan angka
- Harus mengandung huruf, angka, dan simbol
- Harus mengandung angka, huruf besar dan huruf kecil
- Harus mengandung angka, huruf besar dan huruf kecil, serta simbol
- Harus mengandung setidaknya 3 dari yang berikut: angka, huruf besar, huruf kecil, dan karakter khusus
- Tanpa batasan

![](https://static-docs.nocobase.com/202412281331649.png)

### Kata Sandi Tidak Boleh Mengandung Nama Pengguna

Mengatur apakah kata sandi dapat mengandung nama pengguna dari pengguna saat ini.

### Jumlah Riwayat Kata Sandi

Mengingat jumlah kata sandi yang baru saja digunakan oleh pengguna. Pengguna tidak dapat menggunakan kembali kata sandi ini saat mengubah kata sandi mereka. 0 berarti tanpa batasan, dengan jumlah maksimum 24.

## Konfigurasi Masa Berlaku Kata Sandi

![](https://static-docs.nocobase.com/202412281335588.png)

### Periode Validitas Kata Sandi

Periode validitas kata sandi pengguna. Pengguna harus mengubah kata sandi mereka sebelum kedaluwarsa untuk mengatur ulang periode validitas. Jika kata sandi tidak diubah sebelum kedaluwarsa, pengguna tidak akan dapat masuk dengan kata sandi lama dan memerlukan bantuan administrator untuk meresetnya. Jika metode masuk lainnya dikonfigurasi, pengguna masih dapat masuk menggunakan metode tersebut.

### Saluran Notifikasi Pengingat Masa Berlaku Kata Sandi

Dalam 10 hari menjelang kedaluwarsa kata sandi pengguna, pengingat dikirim setiap kali pengguna masuk. Secara default, pengingat dikirim melalui saluran pesan internal "Pengingat Masa Berlaku Kata Sandi", yang dapat dikelola di bagian manajemen notifikasi.

### Rekomendasi Konfigurasi

Karena kedaluwarsa kata sandi dapat mengakibatkan ketidakmampuan untuk masuk, termasuk untuk akun administrator, disarankan untuk segera mengubah kata sandi dan mengatur beberapa akun dalam sistem yang memiliki wewenang untuk mengubah kata sandi pengguna.

## Keamanan Masuk Kata Sandi

Mengatur batasan percobaan masuk kata sandi yang tidak valid.

![](https://static-docs.nocobase.com/202412281339724.png)

### Jumlah Maksimum Percobaan Masuk Kata Sandi Tidak Valid

Mengatur jumlah maksimum percobaan masuk yang dapat dilakukan pengguna dalam interval waktu yang ditentukan.

### Interval Waktu Maksimum Percobaan Masuk Kata Sandi Tidak Valid (Detik)

Mengatur interval waktu (dalam detik) untuk menghitung jumlah maksimum percobaan masuk tidak valid oleh pengguna.

### Durasi Penguncian (Detik)

Mengatur durasi pengguna dikunci setelah melebihi batas percobaan masuk kata sandi tidak valid (0 berarti tanpa batasan). Selama periode penguncian, pengguna dilarang mengakses sistem melalui metode autentikasi apa pun, termasuk API keys. Jika diperlukan pembukaan kunci secara manual, silakan merujuk ke [Penguncian Pengguna](./lockout.md).

### Skenario

#### Tanpa Batasan

Tidak ada batasan pada jumlah percobaan kata sandi tidak valid oleh pengguna.

![](https://static-docs.nocobase.com/202412281343226.png)

#### Batasi Frekuensi Percobaan, Jangan Kunci Pengguna

Contoh: Pengguna dapat mencoba masuk hingga 5 kali setiap 5 menit.

![](https://static-docs.nocobase.com/202412281344412.png)

#### Kunci Pengguna Setelah Melebihi Batas

Contoh: Jika pengguna melakukan 5 percobaan masuk kata sandi tidak valid secara berurutan dalam 5 menit, pengguna akan dikunci selama 2 jam.

![](https://static-docs.nocobase.com/202412281344952.png)

### Rekomendasi Konfigurasi

- Konfigurasi jumlah percobaan masuk kata sandi tidak valid dan interval waktu biasanya digunakan untuk membatasi percobaan masuk kata sandi frekuensi tinggi dalam waktu singkat, mencegah serangan *brute-force*.
- Apakah akan mengunci pengguna setelah melebihi batas perlu dipertimbangkan berdasarkan skenario penggunaan aktual. Pengaturan durasi penguncian dapat disalahgunakan secara jahat, karena penyerang dapat dengan sengaja memasukkan kata sandi yang salah berkali-kali untuk akun target, memaksa akun terkunci dan membuatnya tidak dapat digunakan. Hal ini dapat diatasi dengan menggabungkan pembatasan IP, batas laju API, dan tindakan lainnya.
- Karena penguncian akun akan mencegah akses ke sistem, termasuk akun administrator, disarankan untuk mengatur beberapa akun dalam sistem yang memiliki wewenang untuk membuka kunci pengguna.