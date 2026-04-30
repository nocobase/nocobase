---
title: "Penyimpanan File: S3 (Pro)"
description: "Storage engine S3 Pro, penyimpanan tingkat enterprise yang kompatibel dengan protokol S3, mendukung Endpoint custom dan konfigurasi lanjutan."
keywords: "S3 Pro,object storage,cloud storage,kompatibel S3,NocoBase"
---

# Penyimpanan File: S3 (Pro)

<PluginInfo commercial="true" name="file-storage-s3-pro"></PluginInfo>

## Pengantar

Berbasis plugin file management, menambahkan dukungan untuk tipe penyimpanan file yang kompatibel dengan protokol S3. Layanan object storage apa pun yang mendukung protokol S3 dapat dengan mudah diintegrasikan, contohnya Amazon S3, Aliyun OSS, Tencent COS, MinIO, Cloudflare R2, dan lainnya, lebih meningkatkan kompatibilitas dan fleksibilitas layanan penyimpanan.

## Karakteristik Fitur

1. Upload Sisi Klien: Proses upload file tidak perlu melalui server NocoBase, langsung terhubung ke layanan penyimpanan file, mewujudkan pengalaman upload yang lebih efisien dan cepat.
    
2. Akses Privat: Saat mengakses file, semua URL adalah alamat otorisasi sementara yang sudah di-sign, memastikan keamanan dan ketepatan waktu akses file.


## Skenario Penggunaan

1. **Manajemen Collection File**: Pengelolaan dan penyimpanan terpusat semua file yang diupload, mendukung berbagai tipe file dan cara penyimpanan, memudahkan klasifikasi dan pencarian file.
    
2. **Penyimpanan Field Lampiran**: Digunakan untuk penyimpanan data lampiran yang diupload dalam form atau record, mendukung relasi dengan record data tertentu.
  

## Konfigurasi Plugin

1. Aktifkan plugin plugin-file-storage-s3-pro
    
2. Klik "Setting-> FileManager" untuk masuk ke pengaturan File Management

3. Klik tombol "Add new", pilih "S3 Pro"

![](https://static-docs.nocobase.com/20250102160704938.png)

4. Setelah floating layer muncul, Anda akan melihat banyak konten form yang perlu diisi. Anda dapat merujuk ke dokumentasi selanjutnya untuk mendapatkan informasi parameter terkait dari layanan file yang sesuai, dan mengisinya dengan benar ke form.

![](https://static-docs.nocobase.com/20250413190828536.png)


## Konfigurasi Penyedia Layanan

### Amazon S3

#### Membuat Bucket

1. Buka https://ap-southeast-1.console.aws.amazon.com/s3/home untuk masuk ke S3 Console
    
2. Klik tombol "Create bucket" di sebelah kanan

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)

2. Isi Bucket Name (Nama Bucket), field lainnya dapat tetap default. Scroll ke bawah halaman, klik tombol **"Create"** untuk menyelesaikan pembuatan.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)

#### Konfigurasi CORS

1. Masuk ke daftar buckets, temukan dan klik Bucket yang baru saja dibuat untuk masuk ke halaman detailnya

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)

2. Klik tab "Permission", lalu scroll ke bawah untuk menemukan bagian konfigurasi CORS

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970303.png)

3. Isi konfigurasi berikut (Anda dapat menyesuaikan konfigurasinya), lalu simpan
    
```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "POST",
            "PUT"
        ],
        "AllowedOrigins": [
            "*"
        ],
        "ExposeHeaders": [
            "ETag"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970494.png)

#### Mendapatkan AccessKey, SecretAccessKey

1. Klik tombol "Security credentials" di sudut kanan atas halaman

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)

2. Scroll ke bawah, temukan bagian "Access Keys", klik tombol "Create Access Key".

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)

3. Klik setuju (di sini contoh dengan akun utama, disarankan untuk menggunakan IAM dalam environment formal).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)

4. Simpan Access key dan Secret access key yang ditampilkan di halaman

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)

#### Mendapatkan Parameter dan Konfigurasi

1. AccessKey ID dan AccessKey Secret adalah nilai yang sesuai yang Anda dapatkan pada operasi sebelumnya. Harap isi dengan benar.
    
2. Masuk ke panel properties halaman detail bucket, Anda dapat mendapatkan informasi nama Bucket dan Region (region) di dalamnya.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)

#### Akses Publik (Opsional)

Ini bukan konfigurasi wajib. Saat Anda perlu membuat file upload sepenuhnya publik, lakukan konfigurasi

1. Masuk ke panel Permissions, scroll ke bawah ke Object Ownership, klik edit, aktifkan ACLs

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)

2. Scroll ke Block public access, klik edit, atur untuk mengizinkan kontrol ACLs

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)

3. Centang Public access di NocoBase


#### Konfigurasi Thumbnail (Opsional)

Konfigurasi ini opsional, digunakan untuk mengoptimalkan ukuran atau efek pratinjau gambar. **Perhatikan, skema deployment ini mungkin menghasilkan biaya tambahan. Untuk biaya spesifik harap lihat ketentuan terkait AWS.**

1. Akses [Dynamic Image Transformation for Amazon CloudFront](https://aws.amazon.com/solutions/implementations/dynamic-image-transformation-for-amazon-cloudfront/?nc1=h_ls).

2. Klik tombol `Launch in the AWS Console` di bagian bawah halaman, untuk memulai deployment skema.
   ![](https://static-docs.nocobase.com/20250221164214117.png)

3. Selesaikan konfigurasi sesuai petunjuk. Beberapa opsi berikut perlu perhatian khusus:
   1. Saat membuat stack, Anda perlu menentukan nama Bucket Amazon S3 yang berisi gambar sumber. Harap isi nama bucket yang sudah Anda buat sebelumnya.
   2. Jika Anda memilih untuk men-deploy demo UI, setelah deployment selesai, Anda dapat menguji fungsi pemrosesan gambar melalui antarmuka tersebut. Di AWS CloudFormation Console, pilih stack Anda, masuk ke tab "Outputs", temukan nilai yang sesuai dengan kunci DemoUrl, klik link tersebut untuk membuka antarmuka demo.
   3. Skema ini menggunakan library Node.js `sharp` untuk memproses gambar secara efisien. Anda dapat mengunduh source code dari repository GitHub, dan menyesuaikan sesuai kebutuhan.
   
   ![](https://static-docs.nocobase.com/20250221164315472.png)
   ![](https://static-docs.nocobase.com/20250221164404755.png)

4. Setelah konfigurasi selesai, tunggu hingga status deployment menjadi `CREATE_COMPLETE`.

5. Dalam konfigurasi NocoBase, ada beberapa hal yang perlu diperhatikan:
   1. `Thumbnail rule`: Isi parameter terkait pemrosesan gambar, contohnya `?width=100`. Untuk lebih spesifik, dapat merujuk ke [dokumentasi AWS](https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/use-supported-query-param-edits.html).
   2. `Access endpoint`: Isi nilai Outputs -> ApiEndpoint setelah deployment.
   3. `Full access URL style`: Perlu mencentang **Ignore** (karena saat konfigurasi sudah mengisi nama bucket, saat akses tidak perlu lagi).
   
   ![](https://static-docs.nocobase.com/20250414152135514.png)

#### Contoh Konfigurasi

![](https://static-docs.nocobase.com/20250414152344959.png)


### Aliyun OSS

#### Membuat Bucket

1. Buka OSS Console https://oss.console.aliyun.com/overview

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)

2. Klik "Buckets" di menu kiri, lalu klik tombol "Create Bucket" untuk mulai membuat bucket

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)

3. Isi informasi terkait bucket, akhirnya klik tombol Create
    
    1. Bucket Name sesuai dengan bisnis Anda, nama bebas
        
    2. Region pilih region yang paling dekat dengan pengguna Anda
        
    3. Konten lainnya dapat default, atau dikonfigurasi sendiri sesuai kebutuhan

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)


#### Konfigurasi CORS

1. Masuk ke halaman detail bucket yang dibuat pada langkah sebelumnya

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)

2. Klik "Content Security -> CORS" di menu tengah

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)

3. Klik tombol "Create Rule", dan isi konten terkait, scroll ke bawah klik "OK". Dapat merujuk ke screenshot di bawah, atau lakukan pengaturan yang lebih detail

![](https://static-docs.nocobase.com/20250219171042784.png)

#### Mendapatkan AccessKey, SecretAccessKey

1. Klik "AccessKey" di bawah avatar di sudut kanan atas

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)

2. Di sini untuk kemudahan demo, menggunakan akun utama untuk membuat AccessKey. Untuk skenario penggunaan formal, disarankan menggunakan RAM untuk membuatnya, dapat merujuk ke https://help.aliyun.com/zh/ram/user-guide/create-an-accesskey-pair-1?spm=5176.28366559.0.0.1b5c3c2fUI9Ql8#section-rjh-18m-7kp
    
3. Klik tombol "Create AccessKey"

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)

4. Lakukan verifikasi akun

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)

5. Simpan Access key dan Secret access key yang ditampilkan di halaman

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)


#### Mendapatkan Parameter dan Konfigurasi

1. AccessKey ID dan AccessKey Secret adalah nilai yang didapatkan pada operasi sebelumnya
    
2. Masuk ke halaman detail bucket, dapatkan Bucket

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)

3. Scroll ke bawah, dapatkan Region (".aliyuncs.com" di belakang tidak diperlukan)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)

4. Dapatkan alamat endpoint, saat diisi ke NocoBase perlu menambahkan prefix https://

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)

#### Konfigurasi Thumbnail (Opsional)

Konfigurasi ini opsional, hanya digunakan saat perlu mengoptimalkan ukuran atau efek pratinjau gambar.

1. Isi parameter terkait `Thumbnail rule`. Untuk pengaturan parameter spesifik, dapat merujuk ke [Parameter Pemrosesan Gambar](https://help.aliyun.com/zh/oss/user-guide/img-parameters/?spm=a2c4g.11186623.help-menu-31815.d_4_14_1_1.170243033CdbSm&scm=20140722.H_144582._.OR_help-T_cn~zh-V_1).

2. `Full upload URL style` dan `Full access URL style` pertahankan tetap sama.

#### Contoh Konfigurasi

![](https://static-docs.nocobase.com/20250414152525600.png)


### MinIO

#### Membuat Bucket

1. Klik menu Buckets di kiri -> klik Create Bucket, masuk ke halaman pembuatan
2. Setelah mengisi nama Bucket, klik tombol simpan
#### Mendapatkan AccessKey, SecretAccessKey

1. Masuk ke Access Keys -> klik tombol Create access key, masuk ke halaman pembuatan

![](https://static-docs.nocobase.com/20250106111922957.png)

2. Klik tombol simpan

![](https://static-docs.nocobase.com/20250106111850639.png)

1. Simpan Access Key dan Secret Key dalam popup, untuk konfigurasi selanjutnya

![](https://static-docs.nocobase.com/20250106112831483.png)

#### Konfigurasi Parameter

1. Masuk ke halaman NocoBase -> File manager

2. Klik tombol Add new, pilih S3 Pro

3. Isi form
   - **AccessKey ID** dan **AccessKey Secret** adalah teks yang disimpan di langkah sebelumnya
   - **Region**: MinIO yang di-deploy secara private tidak memiliki konsep Region, dapat dikonfigurasi sebagai "auto"
   - **Endpoint**: Isi domain layanan atau alamat ip yang di-deploy
   - Atur Full access URL style menjadi Path-Style

#### Contoh Konfigurasi

![](https://static-docs.nocobase.com/20250414152700671.png)


### Tencent COS

Dapat merujuk ke konfigurasi layanan file di atas, logikanya serupa

#### Contoh Konfigurasi

![](https://static-docs.nocobase.com/20250414153252872.png)


### Cloudflare R2

Dapat merujuk ke konfigurasi layanan file di atas, logikanya serupa

#### Contoh Konfigurasi

![](https://static-docs.nocobase.com/20250414154500264.png)


## Penggunaan Pengguna

Mengacu pada penggunaan plugin file-manager https://docs.nocobase.com/data-sources/file-manager/
