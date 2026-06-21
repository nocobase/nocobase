---
pkg: "@nocobase/plugin-email-manager"
title: "Konfigurasi Outlook"
description: "Integrasi email Outlook: registrasi Azure, Microsoft Entra ID, App registrations, Client ID/Secret, konfigurasi OAuth callback URL."
keywords: "konfigurasi Outlook,email Microsoft,Azure,Microsoft Entra ID,OAuth,NocoBase"
---
# Konfigurasi Microsoft

### Prasyarat
Agar user dapat mengintegrasikan email Outlook ke NocoBase, harus di-deploy di server yang mendukung akses ke layanan Microsoft. Backend akan memanggil API Microsoft.

### Registrasi Akun

1. Buka https://azure.microsoft.com/en-us/pricing/purchase-options/azure-account
    
2. Login ke akun Microsoft
    
![](https://static-docs.nocobase.com/mail-1733818625779.png)

### Buat Tenant

1. Buka https://azure.microsoft.com/en/pricing/purchase-options/azure-account?icid=azurefreeaccount, dan login akun
    
2. Isi informasi dasar, dan dapatkan verification code

![](https://static-docs.nocobase.com/mail-1733818625984.png)

3. Isi informasi lainnya dan lanjutkan

![](https://static-docs.nocobase.com/mail-1733818626352.png)

4. Isi informasi terkait kartu kredit (dapat tidak dibuat dahulu)

![](https://static-docs.nocobase.com/mail-1733818626622.png)

### Dapatkan Client ID

1. Klik menu atas, pilih **Microsoft Entra ID**

![](https://static-docs.nocobase.com/mail-1733818626871.png)

2. Pilih **App registrations** di sebelah kiri

![](https://static-docs.nocobase.com/mail-1733818627097.png)

3. Klik **New registration** di bagian atas

![](https://static-docs.nocobase.com/mail-1733818627309.png)

4. Isi informasi dan submit

Nama bebas, account types pilih sesuai gambar di bawah, Redirect URI dapat tidak diisi dahulu

![](https://static-docs.nocobase.com/mail-1733818627555.png)

5. Dapatkan Client ID

![](https://static-docs.nocobase.com/mail-1733818627797.png)

### Otorisasi API

1. Buka menu **API permissions** di sebelah kanan

![](https://static-docs.nocobase.com/mail-1733818628178.png)

2. Klik tombol **Add a permission**

![](https://static-docs.nocobase.com/mail-1733818628448.png)

3. Klik **Microsoft Graph**

![](https://static-docs.nocobase.com/mail-1733818628725.png)

![](https://static-docs.nocobase.com/mail-1733818628927.png)

4. Cari dan tambahkan izin berikut, hasil akhir seperti gambar di bawah
    
    1. `"email"`
    2. `"offline_access"`
    3. `"IMAP.AccessAsUser.All"`
    4. `"SMTP.Send"`
    5. `"offline_access"`
    6. `"User.Read"` (By default)

![](https://static-docs.nocobase.com/mail-1733818629130.png)

### Dapatkan Secret

1. Klik **Certificates & secrets** di sebelah kiri

![](https://static-docs.nocobase.com/mail-1733818629369.png)

2. Klik tombol **New client secret**

![](https://static-docs.nocobase.com/mail-1733818629554.png)

3. Isi description dan expiration time, lalu add

![](https://static-docs.nocobase.com/mail-1733818630292.png)

4. Dapatkan Secret ID

![](https://static-docs.nocobase.com/mail-1733818630535.png)

5. Salin Client ID dan Client secret masing-masing dan isi ke halaman konfigurasi email

![](https://static-docs.nocobase.com/mail-1733818630710.png)
