---
pkg: "@nocobase/plugin-email-manager"
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Konfigurasi Microsoft

### Prasyarat
Agar pengguna dapat menghubungkan kotak surat Outlook mereka ke NocoBase, Anda harus menyebarkan NocoBase di server yang dapat mengakses layanan Microsoft. Backend akan memanggil API Microsoft.

### Mendaftar Akun

1. Buka https://azure.microsoft.com/en-us/pricing/purchase-options/azure-account
    
2. Masuk ke akun Microsoft Anda
    
![](https://static-docs.nocobase.com/mail-1733818625779.png)

### Membuat Tenant

1. Buka https://azure.microsoft.com/zh-cn/pricing/purchase-options/azure-account?icid=azurefreeaccount dan masuk ke akun Anda.
    
2. Isi informasi dasar dan dapatkan kode verifikasi.

![](https://static-docs.nocobase.com/mail-1733818625984.png)

3. Isi informasi lainnya dan lanjutkan.

![](https://static-docs.nocobase.com/mail-1733818626352.png)

4. Isi informasi kartu kredit Anda (Anda dapat melewati langkah ini untuk saat ini).

![](https://static-docs.nocobase.com/mail-1733818626622.png)

### Mendapatkan Client ID

1. Klik menu atas dan pilih "Microsoft Entra ID".

![](https://static-docs.nocobase.com/mail-1733818626871.png)

2. Pilih "App registrations" di sisi kiri.

![](https://static-docs.nocobase.com/mail-1733818627097.png)

3. Klik "New registration" di bagian atas.

![](https://static-docs.nocobase.com/mail-1733818627309.png)

4. Isi informasi dan kirimkan.

Nama bisa apa saja. Untuk jenis akun, pilih opsi yang ditunjukkan pada gambar di bawah. Anda dapat membiarkan Redirect URI kosong untuk saat ini.

![](https://static-docs.nocobase.com/mail-1733818627555.png)

5. Dapatkan Client ID.

![](https://static-docs.nocobase.com/mail-1733818627797.png)

### Otorisasi API

1. Buka menu "API permissions" di sisi kiri.

![](https://static-docs.nocobase.com/mail-1733818628178.png)

2. Klik tombol "Add a permission".

![](https://static-docs.nocobase.com/mail-1733818628448.png)

3. Klik "Microsoft Graph".

![](https://static-docs.nocobase.com/mail-1733818628725.png)

![](https://static-docs.nocobase.com/mail-1733818628927.png)

4. Cari dan tambahkan izin berikut. Hasil akhirnya akan terlihat seperti pada gambar di bawah.
    
    1. `"email"`
    2. `"offline_access"`
    3. `"IMAP.AccessAsUser.All"`
    4. `"SMTP.Send"`
    5. `"offline_access"`
    6. `"User.Read"` (By default)

![](https://static-docs.nocobase.com/mail-1733818629130.png)

### Mendapatkan Secret

1. Klik "Certificates & secrets" di sisi kiri.

![](https://static-docs.nocobase.com/mail-1733818629369.png)

2. Klik tombol "New client secret".

![](https://static-docs.nocobase.com/mail-1733818629554.png)

3. Isi deskripsi dan waktu kedaluwarsa, lalu klik Tambah.

![](https://static-docs.nocobase.com/mail-1733818630292.png)

4. Dapatkan Secret ID.

![](https://static-docs.nocobase.com/mail-1733818630535.png)

5. Salin Client ID dan Client secret, lalu tempelkan ke halaman konfigurasi email.

![](https://static-docs.nocobase.com/mail-1733818630710.png)