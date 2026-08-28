---
pkg: '@nocobase/plugin-file-storage-s3-pro'
title: "Storage Engine: S3 Pro"
description: "S3 Pro kompatibel dengan protokol S3: upload langsung dari client, presigned URL, akses privat, mendukung konfigurasi AWS S3, Aliyun OSS, Tencent COS, MinIO, Cloudflare R2."
keywords: "S3 Pro,Kompatibel S3,Upload langsung dari client,Presigned URL,MinIO,Cloudflare R2,Object storage,NocoBase"
---
# Storage Engine: S3 (Pro)

## Pengantar

Berbasis plugin File Manager, ditambahkan dukungan untuk tipe penyimpanan file yang kompatibel dengan protokol S3. Layanan object storage manapun yang mendukung protokol S3 dapat dengan mudah diintegrasikan, contoh Amazon S3, Aliyun OSS, Tencent COS, MinIO, Cloudflare R2, dan lainnya, sehingga lebih meningkatkan kompatibilitas dan fleksibilitas layanan storage.

## Fitur

1. Upload dari client: proses upload file tidak perlu melewati server NocoBase, langsung terhubung ke layanan storage file, mewujudkan pengalaman upload yang lebih efisien dan cepat.
    
2. Akses privat: secara default menggunakan URL bertanda tangan dengan masa berlaku. URL tanpa tanda tangan juga dapat dibuat untuk bucket publik.


## Skenario Penggunaan

1. **Manajemen Tabel File**: mengelola dan menyimpan secara terpusat semua file yang diunggah, mendukung berbagai tipe file dan cara penyimpanan, memudahkan klasifikasi dan pencarian file.
    
2. **Penyimpanan Field Lampiran**: digunakan untuk menyimpan data lampiran yang diunggah pada form atau record, mendukung asosiasi dengan record data spesifik.
  

## Konfigurasi Plugin

1. Aktifkan plugin plugin-file-storage-s3-pro
    
2. Klik "Setting -> FileManager" untuk masuk ke pengaturan File Manager

3. Klik tombol "Add new", pilih "S3 Pro"

![](https://static-docs.nocobase.com/20250102160704938.png)

4. Setelah panel muncul, Anda akan melihat banyak isian form yang perlu diisi. Anda dapat merujuk ke dokumentasi berikutnya untuk mendapatkan informasi parameter dari layanan file yang sesuai, dan mengisinya dengan benar pada form.

![](https://static-docs.nocobase.com/20250413190828536.png)

## Konfigurasi URL

Selain opsi umum File Manager "URL NocoBase", "URL asli", dan "Izinkan akses publik", S3 Pro dapat mengkonfigurasi format URL upload dan akses secara terpisah serta menentukan apakah URL bertanda tangan digunakan. Lihat [Ikhtisar Storage Engine](./index.md#url-file-dan-kontrol-akses) untuk penjelasan opsi umum.

Opsi ini mengontrol tahap yang berbeda:

- "URL NocoBase / URL asli" mengontrol alamat yang dikembalikan oleh record file
- "Izinkan akses publik" mengontrol apakah izin melihat record file diperiksa saat URL NocoBase diakses
- "Jangan gunakan URL bertanda tangan" mengontrol apakah object storage memvalidasi tanda tangan URL

Konfigurasi ini dapat dikombinasikan secara independen. Default yang direkomendasikan adalah menggunakan URL NocoBase, tidak mencentang "Izinkan akses publik", dan tetap menggunakan URL bertanda tangan.

![Konfigurasi URL S3 Pro](https://static-docs.nocobase.com/20260723221441.png)

### Cara memilih

| Skenario penggunaan | URL file | Izinkan akses publik | Jangan gunakan URL bertanda tangan |
| --- | --- | --- | --- |
| File harus mengikuti izin role dan data sementara bucket tetap privat | URL NocoBase | Tidak dicentang | Tidak dicentang |
| Diperlukan alamat file NocoBase publik sementara bucket tetap privat | URL NocoBase | Dicentang | Tidak dicentang |
| Service eksternal membutuhkan akses sementara ke alamat storage | URL asli | Tidak berlaku | Tidak dicentang; konfigurasi Access URL expiration |
| Bucket publik atau CDN membutuhkan alamat asli tanpa tanda tangan | URL asli | Tidak berlaku | Dicentang |

### Format URL unggahan

"Format URL unggahan" mengontrol URL S3 yang digunakan client saat upload file. Pilih format yang didukung service storage. Form konfigurasi menampilkan contoh berdasarkan Endpoint, Bucket, dan path saat ini:

- "Bucket as subdomain": `https://bucket-name.s3.example.com/path/to/object`
- "Bucket as subpath": `https://s3.example.com/bucket-name/path/to/object`
- "Ignore bucket": `https://upload.example.com/path/to/object`

### Format URL akses

"Format URL akses" mengontrol apakah Bucket muncul pada domain, path, atau tidak muncul sama sekali saat S3 Pro membuat alamat akses file. Tersedia tiga format yang sama dengan URL upload, tetapi dapat dikonfigurasi secara terpisah—contohnya upload menggunakan S3 Endpoint sementara akses menggunakan domain CDN tanpa Bucket.

Opsi ini memengaruhi URL asli dan alamat storage yang menjadi tujuan akhir pengalihan URL NocoBase, tetapi tidak mengubah format URL NocoBase itu sendiri.

### Jangan gunakan URL bertanda tangan

S3 Pro menggunakan URL bertanda tangan secara default. URL asli yang dibuat berisi parameter tanda tangan, contohnya:

```text
https://bucket-name.s3.example.com/path/to/object?X-Amz-Signature=xxxx
```

URL bertanda tangan berlaku selama waktu yang dikonfigurasi pada "Access URL expiration", dan bucket dapat tetap privat. Saat URL NocoBase digunakan, NocoBase membuat atau mengalihkan ke alamat bertanda tangan setelah pemeriksaan izin berhasil.

Saat "Jangan gunakan URL bertanda tangan" dicentang, S3 Pro membuat alamat tanpa parameter tanda tangan. Bucket dan object yang di-upload harus mengizinkan baca publik, dan "Access URL expiration" tidak lagi berlaku.

"Jangan gunakan URL bertanda tangan" hanya mengontrol validasi tanda tangan oleh service storage dan tidak mengubah izin record NocoBase. Jika URL NocoBase dipilih dan "Izinkan akses publik" tidak dicentang, request tetap harus melewati pemeriksaan izin NocoBase terlebih dahulu.


## Konfigurasi Penyedia Layanan

### Amazon S3

#### Pembuatan Bucket

1. Buka https://ap-southeast-1.console.aws.amazon.com/s3/home untuk masuk ke S3 Console
    
2. Klik tombol "Create bucket" di sebelah kanan

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)

2. Isi Bucket Name, field lainnya dapat dibiarkan default. Scroll ke bawah halaman, klik tombol **"Create"** untuk menyelesaikan pembuatan.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)

#### Konfigurasi CORS

1. Masuk ke daftar buckets, cari dan klik bucket yang baru saja dibuat untuk masuk ke halaman detailnya

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)

2. Klik tab "Permission", lalu scroll ke bawah untuk menemukan bagian konfigurasi CORS

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970303.png)

3. Isi konfigurasi berikut (Anda dapat menyesuaikan konfigurasi lebih detail), lalu simpan
    
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

1. Klik tombol "Security credentials" di pojok kanan atas halaman

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)

2. Scroll ke bawah, cari bagian "Access Keys", klik tombol "Create Access Key".

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)

3. Klik setuju (di sini menggunakan akun utama untuk demonstrasi, untuk lingkungan produksi disarankan menggunakan IAM).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)

4. Simpan Access key dan Secret access key yang ditampilkan pada halaman

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)

#### Mendapatkan dan Mengkonfigurasi Parameter

1. AccessKey ID dan AccessKey Secret adalah nilai yang Anda dapatkan pada langkah sebelumnya, harap isi dengan akurat
    
2. Masuk ke panel properties pada halaman detail bucket, Anda dapat memperoleh informasi nama Bucket dan Region (region).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)

#### Akses publik tanpa tanda tangan (opsional)

Konfigurasikan ini hanya jika URL tanpa tanda tangan diperlukan, karena Bucket dan object yang di-upload harus mengizinkan baca publik. Jika hanya ingin membagikan URL NocoBase publik, centang "Izinkan akses publik" dan tetap gunakan URL bertanda tangan; Bucket tidak perlu dibuat publik.

1. Masuk ke panel Permissions, scroll ke bawah ke Object Ownership, klik edit, aktifkan ACLs

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)

2. Scroll ke Block public access, klik edit, atur agar mengizinkan kontrol ACLs

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)

3. Centang "Jangan gunakan URL bertanda tangan" di NocoBase


#### Konfigurasi Thumbnail (Opsional)

Konfigurasi ini opsional, digunakan untuk mengoptimalkan ukuran atau efek pratinjau gambar. **Perhatian, solusi deployment ini mungkin menimbulkan biaya tambahan, untuk biaya spesifik silakan merujuk ke ketentuan AWS.**

1. Akses [Dynamic Image Transformation for Amazon CloudFront](https://aws.amazon.com/solutions/implementations/dynamic-image-transformation-for-amazon-cloudfront/?nc1=h_ls).

2. Klik tombol `Launch in the AWS Console` di bagian bawah halaman untuk memulai deployment solusi.
   ![](https://static-docs.nocobase.com/20250221164214117.png)

3. Ikuti petunjuk untuk menyelesaikan konfigurasi. Beberapa opsi berikut perlu diperhatikan:
   1. Saat membuat stack, Anda perlu menentukan nama bucket Amazon S3 yang berisi gambar sumber. Harap isi nama bucket yang Anda buat sebelumnya.
   2. Jika Anda memilih untuk men-deploy demo UI, setelah deployment selesai Anda dapat menguji fitur image processing melalui antarmuka tersebut. Pada AWS CloudFormation Console, pilih stack Anda, masuk ke tab "Outputs", cari nilai key DemoUrl, klik link tersebut untuk membuka antarmuka demo.
   3. Solusi ini menggunakan library `sharp` Node.js untuk memproses gambar secara efisien. Anda dapat mengunduh source code dari repository GitHub dan melakukan kustomisasi sesuai kebutuhan.
   
   ![](https://static-docs.nocobase.com/20250221164315472.png)
   ![](https://static-docs.nocobase.com/20250221164404755.png)

4. Setelah konfigurasi selesai, tunggu hingga status deployment menjadi `CREATE_COMPLETE`.

5. Pada konfigurasi NocoBase, ada beberapa hal yang perlu diperhatikan:
   1. `Thumbnail rule`: isi parameter image processing, contoh `?width=100`. Untuk detail lihat [dokumentasi AWS](https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/use-supported-query-param-edits.html).
   2. `Access endpoint`: isi nilai dari Outputs -> ApiEndpoint setelah deployment.
   3. "Format URL akses": pilih "Ignore bucket" karena nama bucket sudah disertakan dalam konfigurasi dan tidak diperlukan pada URL akses.
   
   ![](https://static-docs.nocobase.com/20250414152135514.png)

#### Contoh Konfigurasi

![](https://static-docs.nocobase.com/20250414152344959.png)


### Aliyun OSS

#### Pembuatan Bucket

1. Buka OSS Console https://oss.console.aliyun.com/overview

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)

2. Klik "Buckets" di menu sebelah kiri, lalu klik tombol "Create Bucket" untuk mulai membuat bucket

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)

3. Isi informasi terkait bucket, terakhir klik tombol Create
    
    1. Bucket Name disesuaikan dengan bisnis Anda, nama bebas
        
    2. Region pilih region terdekat dengan pengguna Anda
        
    3. Konten lainnya dapat dibiarkan default, atau dikonfigurasi sesuai kebutuhan    

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)


#### Konfigurasi CORS

1. Masuk ke halaman detail bucket yang dibuat pada langkah sebelumnya

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)

2. Klik "Content Security -> CORS" di menu tengah

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)

3. Klik tombol "Create Rule", isi konten yang sesuai lalu scroll ke bawah dan klik "OK". Anda dapat merujuk ke screenshot di bawah, atau melakukan pengaturan yang lebih detail

![](https://static-docs.nocobase.com/20250219171042784.png)

#### Mendapatkan AccessKey, SecretAccessKey

1. Klik "AccessKey" di bawah avatar pojok kanan atas

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)

2. Untuk demonstrasi, di sini menggunakan akun utama untuk membuat AccessKey. Untuk skenario produksi disarankan menggunakan RAM, Anda dapat merujuk ke https://help.aliyun.com/zh/ram/user-guide/create-an-accesskey-pair-1?spm=5176.28366559.0.0.1b5c3c2fUI9Ql8#section-rjh-18m-7kp
    
3. Klik tombol "Create AccessKey"

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)

4. Lakukan verifikasi akun

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)

5. Simpan Access key dan Secret access key yang ditampilkan pada halaman

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)


#### Mendapatkan dan Mengkonfigurasi Parameter

1. AccessKey ID dan AccessKey Secret adalah nilai yang didapat pada langkah sebelumnya
    
2. Masuk ke halaman detail bucket, dapatkan Bucket

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)

3. Scroll ke bawah, dapatkan Region (".aliyuncs.com" di belakang tidak diperlukan)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)

4. Dapatkan alamat endpoint, saat diisi ke NocoBase perlu menambahkan prefix https://

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)

#### Konfigurasi Thumbnail (Opsional)

Konfigurasi ini opsional, hanya digunakan saat perlu mengoptimalkan ukuran atau efek pratinjau gambar.

1. Isi parameter terkait `Thumbnail rule`. Untuk pengaturan parameter spesifik dapat merujuk ke [Parameter Image Processing](https://help.aliyun.com/zh/oss/user-guide/img-parameters/?spm=a2c4g.11186623.help-menu-31815.d_4_14_1_1.170243033CdbSm&scm=20140722.H_144582._.OR_help-T_cn~zh-V_1).

2. "Format URL unggahan" dan "Format URL akses" dapat menggunakan pengaturan yang sama.

#### Contoh Konfigurasi

![](https://static-docs.nocobase.com/20250414152525600.png)


### MinIO

#### Pembuatan Bucket

1. Klik menu Buckets di sebelah kiri -> klik Create Bucket, masuk ke halaman pembuatan
2. Setelah mengisi nama Bucket, klik tombol simpan

#### Mendapatkan AccessKey, SecretAccessKey

1. Masuk ke Access Keys -> klik tombol Create access key, masuk ke halaman pembuatan

![](https://static-docs.nocobase.com/20250106111922957.png)

2. Klik tombol simpan

![](https://static-docs.nocobase.com/20250106111850639.png)

1. Simpan Access Key dan Secret Key dari popup, untuk konfigurasi selanjutnya

![](https://static-docs.nocobase.com/20250106112831483.png)

#### Konfigurasi Parameter

1. Masuk ke halaman NocoBase -> File manager

2. Klik tombol Add new, pilih S3 Pro

3. Isi form
   - **AccessKey ID** dan **AccessKey Secret** adalah teks yang disimpan pada langkah sebelumnya
   - **Region**: MinIO yang di-deploy privat tidak memiliki konsep Region, dapat dikonfigurasi sebagai "auto"
   - **Endpoint**: isi domain atau alamat IP layanan yang di-deploy
   - Atur "Format URL akses" menjadi "Bucket as subpath"

#### Contoh Konfigurasi

![](https://static-docs.nocobase.com/20250414152700671.png)


### Tencent COS

Anda dapat merujuk ke konfigurasi layanan file di atas, logikanya serupa

#### Contoh Konfigurasi

![](https://static-docs.nocobase.com/20250414153252872.png)


### Cloudflare R2

Anda dapat merujuk ke konfigurasi layanan file di atas, logikanya serupa

#### Contoh Konfigurasi

![](https://static-docs.nocobase.com/20250414154500264.png)
