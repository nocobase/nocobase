---
pkg: '@nocobase/plugin-password-policy'
title: "Password Policy"
description: "Password policy: rule password (panjang minimum, kompleksitas, jumlah history), password expiration, lockout login attempt, manajemen user lockout, fitur professional."
keywords: "password policy,rule password,kompleksitas password,password expiration,user lockout,keamanan login,professional,NocoBase"
---

# Password Policy

## Pengantar

Mengatur rule password untuk semua user, password expiration, dan policy keamanan login password, mengelola user yang di-lock.

## Rule Password

![](https://static-docs.nocobase.com/202412281329313.png)

### Panjang Password Minimum

Mengatur persyaratan panjang minimum password, panjang maksimum 64.

### Persyaratan Kompleksitas Password

Mendukung opsi berikut:

- Harus berisi huruf dan angka
- Harus berisi huruf, angka, dan simbol
- Harus berisi angka, huruf besar dan huruf kecil
- Harus berisi angka, huruf besar dan huruf kecil, simbol
- Harus berisi 3 dari karakter berikut: angka, huruf besar, huruf kecil, dan karakter spesial
- Tidak terbatas

![](https://static-docs.nocobase.com/202412281331649.png)

### Password Tidak Boleh Berisi Username

Mengatur apakah password boleh berisi username user saat ini.

### Jumlah History Password

Mengingat sejumlah password terakhir yang digunakan user, user tidak boleh menggunakan ulang saat mengubah password. 0 berarti tidak terbatas, jumlah maksimum 24.

## Konfigurasi Password Expiration

![](https://static-docs.nocobase.com/202412281335588.png)

### Password Validity Period

Periode validitas password user. User harus mengganti password sebelum kadaluarsa, baru periode validitas akan dihitung ulang. Jika tidak mengganti password sebelum kadaluarsa, tidak akan dapat login dengan password lama, perlu bantuan administrator untuk reset. Jika ada konfigurasi metode login lain, user dapat login dengan cara lain.

### Channel Notifikasi Pengingat Password Expired

Dalam 10 hari sebelum password user kadaluarsa, setiap user login, kirim pengingat. Default dikirim ke channel in-app message "Password expiration reminder", channel dapat dikelola di notification manager.

### Saran Konfigurasi

Karena password expired dapat menyebabkan akun tidak dapat login, termasuk akun administrator, mohon segera ubah password, dan atur beberapa akun yang dapat mengubah password user di sistem.

## Keamanan Login Password

Mengatur batas upaya login password invalid.

![](https://static-docs.nocobase.com/202412281339724.png)

### Maksimum Upaya Login Password Invalid

Mengatur jumlah maksimum user dapat mencoba login dalam interval waktu yang ditentukan.

### Maksimum Interval Waktu Login Password Invalid (detik)

Mengatur interval waktu untuk menghitung jumlah maksimum login invalid user, satuan detik.

### Waktu Lockout (detik)

Mengatur waktu lockout user setelah melebihi batas login password invalid (0 berarti tidak terbatas). Selama user di-lock, akan dilarang mengakses sistem dengan metode autentikasi apa pun, termasuk API keys. Jika perlu unlock user secara aktif, lihat [User Lockout](./lockout.md).

### Skenario

#### Tidak Terbatas

Tidak membatasi jumlah upaya password invalid user.

![](https://static-docs.nocobase.com/202412281343226.png)

#### Membatasi Frekuensi Upaya, Tidak Lock User

Contoh: User dapat mencoba login maksimal 5 kali setiap 5 menit.

![](https://static-docs.nocobase.com/202412281344412.png)

#### Lock User Setelah Melebihi Batas

Contoh: User melakukan 5 login password invalid berturut-turut dalam 5 menit, lock user 2 jam.

![](https://static-docs.nocobase.com/202412281344952.png)

### Saran Konfigurasi

- Konfigurasi jumlah dan interval waktu login password invalid biasanya digunakan untuk membatasi upaya login password frekuensi tinggi dalam waktu singkat, mencegah brute force.
- Apakah lock user setelah melebihi batas perlu mempertimbangkan skenario penggunaan aktual. Pengaturan waktu lockout dapat dimanfaatkan secara jahat. Penyerang dapat sengaja memasukkan password salah berkali-kali ke akun target, memaksa akun di-lock dan tidak dapat digunakan secara normal. Dapat dikombinasikan dengan IP restriction, API rate limiting, dan tool lain untuk mencegah serangan seperti ini.
- Karena lockout akun akan menyebabkan tidak dapat masuk sistem, termasuk akun administrator, dapat mengatur beberapa akun yang memiliki izin unlock user di sistem.
