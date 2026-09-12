---
title: "Penyimpanan File: S3 (Pro)"
description: "Mesin penyimpanan S3 Pro, penyimpanan tingkat perusahaan yang kompatibel dengan protokol S3, mendukung Endpoint khusus dan konfigurasi lanjutan."
keywords: "S3 Pro,Penyimpanan objek,Penyimpanan cloud,Kompatibel dengan S3,NocoBase"
---

# Penyimpanan File: S3 (Pro)

<PluginInfo commercial="true" name="file-storage-s3-pro"></PluginInfo>

## Pengenalan

Berdasarkan plugin manajemen file, kini ditambahkan dukungan untuk jenis penyimpanan file yang kompatibel dengan protokol S3. Layanan penyimpanan objek apa pun yang mendukung protokol S3 dapat diintegrasikan dengan mudah, seperti Amazon S3, Alibaba Cloud OSS, Tencent Cloud COS, MinIO, Cloudflare R2, dan lainnya, sehingga semakin meningkatkan kompatibilitas dan fleksibilitas layanan penyimpanan.

## Fitur Utama

1. Unggah melalui klien: Proses pengunggahan file tidak perlu melalui server NocoBase, tetapi langsung terhubung ke layanan penyimpanan file, sehingga memberikan pengalaman unggah yang lebih efisien dan cepat.

2. Akses privat: Saat mengakses file, semua URL merupakan alamat otorisasi sementara yang telah ditandatangani, sehingga menjamin keamanan dan ketepatan waktu akses file.


## Skenario Penggunaan

1. **Manajemen tabel file**: Mengelola dan menyimpan semua file yang diunggah secara terpusat, mendukung berbagai jenis file dan metode penyimpanan, serta memudahkan pengelompokan dan pencarian file.

2. **Penyimpanan kolom lampiran**: Digunakan untuk menyimpan data lampiran yang diunggah dalam formulir atau catatan, serta mendukung keterkaitan dengan catatan data tertentu.


## Konfigurasi Plugin

1. Mengaktifkan plugin plugin-file-storage-s3-pro

2. Klik "Setting-> FileManager" untuk masuk ke pengaturan manajemen file

3. Klik tombol "Add new", lalu pilih "S3 Pro"

![](https://static-docs.nocobase.com/20250102160704938.png)

4. Setelah panel pop-up muncul, Anda akan melihat bahwa terdapat banyak formulir yang perlu diisi. Anda dapat merujuk ke dokumentasi berikutnya untuk memperoleh informasi parameter layanan file yang sesuai, lalu mengisinya dengan benar ke dalam formulir.

![](https://static-docs.nocobase.com/20250413190828536.png)


## Konfigurasi Penyedia Layanan

### Amazon S3

#### Pembuatan Bucket

1. Buka https://ap-southeast-1.console.aws.amazon.com/s3/home untuk masuk ke konsol S3

2. Klik tombol "Create bucket" di sebelah kanan

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)

2. Isi Bucket Name (nama bucket), biarkan kolom lainnya menggunakan pengaturan default, gulir ke bagian bawah halaman, lalu klik tombol **"**Create**"** untuk menyelesaikan pembuatan.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)

#### Konfigurasi CORS

1. Masuk ke daftar buckets, temukan dan klik Bucket yang baru saja dibuat untuk masuk ke halaman detailnya

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)

2. Klik tab "Permission", lalu gulir ke bawah untuk menemukan bagian konfigurasi CORS

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970303.png)

3. Masukkan konfigurasi berikut (konfigurasi dapat disesuaikan lebih lanjut), lalu simpan

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

#### Mendapatkan AccessKey dan SecretAccessKey

1. Klik tombol "Security credentials" di sudut kanan atas halaman

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)

2. Gulir ke bawah, temukan bagian "Access Keys", lalu klik tombol "Create Access Key".

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)

3. Klik setuju (contoh ini menggunakan akun utama; untuk lingkungan produksi, disarankan menggunakan IAM).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)

4. Simpan Access key dan Secret access key yang ditampilkan di halaman

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)

#### Mendapatkan dan Mengonfigurasi Parameter

1. AccessKey ID dan AccessKey Secret adalah nilai yang diperoleh pada langkah sebelumnya. Isi dengan tepat

2. Masuk ke panel properties pada halaman detail bucket. Di sana Anda dapat memperoleh informasi Bucket dan Region (wilayah).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)

#### Akses publik (opsional)

Konfigurasi ini tidak wajib. Lakukan konfigurasi ini jika Anda ingin membuat file yang diunggah sepenuhnya dapat diakses publik

1. Masuk ke panel Permissions, gulir ke bawah ke Object Ownership, klik edit, lalu aktifkan ACLs

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)

2. Gulir ke Block public access, klik edit, lalu atur agar kontrol ACLs diizinkan

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)

3. C centang Public access di NocoBase


#### Konfigurasi Thumbnail (opsional)

Konfigurasi ini bersifat opsional dan digunakan saat perlu mengoptimalkan ukuran atau kualitas pratinjau gambar. **Harap diperhatikan bahwa solusi penerapan ini dapat menimbulkan biaya tambahan. Untuk informasi biaya selengkapnya, lihat ketentuan terkait dari AWS.**

1. Akses [Dynamic Image Transformation for Amazon CloudFront](https://aws.amazon.com/solutions/implementations/dynamic-image-transformation-for-amazon-cloudfront/?nc1=h_ls).

2. Klik tombol `Launch in the AWS Console` di bagian bawah halaman untuk mulai menerapkan solusi.
   ![](https://static-docs.nocobase.com/20250221164214117.png)

3. Selesaikan konfigurasi sesuai petunjuk. Beberapa opsi berikut perlu mendapat perhatian khusus:
   1. Saat membuat stack, Anda perlu menentukan nama bucket Amazon S3 yang berisi gambar sumber. Isi dengan nama bucket yang telah dibuat sebelumnya.
   2. Jika Anda memilih untuk menerapkan UI demo, setelah penerapan selesai Anda dapat menguji fungsi pemrosesan gambar melalui antarmuka tersebut. Di konsol AWS CloudFormation, pilih stack Anda, buka tab “Output”, temukan nilai yang terkait dengan kunci DemoUrl, lalu klik tautan tersebut untuk membuka antarmuka demo.
   3. S solusi ini menggunakan pustaka `sharp` Node.js untuk memproses gambar secara efisien. Anda dapat mengunduh kode sumber dari repositori GitHub dan menyesuaikannya sesuai kebutuhan.

   ![](https://static-docs.nocobase.com/20250221164315472.png)
   ![](https://static-docs.nocobase.com/20250221164404755.png)

4. Setelah konfigurasi selesai, tunggu hingga status penerapan berubah menjadi `CREATE_COMPLETE`.

5. Dalam konfigurasi NocoBase, perhatikan hal-hal berikut:
   1. `Thumbnail rule`: Isi parameter terkait pemrosesan gambar, misalnya `?width=100`. Lihat [dokumentasi AWS](https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/use-supported-query-param-edits.html) untuk detailnya.
   2. `Access endpoint`: Isi nilai Outputs -> ApiEndpoint setelah penerapan.
   3. `Full access URL style`: Centang **Ignore** (karena nama bucket telah diisi saat konfigurasi, sehingga tidak perlu lagi saat mengakses).

   ![](https://static-docs.nocobase.com/20250414152135514.png)

#### Contoh Konfigurasi

![](https://static-docs.nocobase.com/20250414152344959.png)


### Alibaba Cloud OSS

#### Pembuatan Bucket

1. Buka konsol OSS https://oss.console.aliyun.com/overview

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)

2. Buka menu "Buckets" di sebelah kiri, lalu klik tombol "Create Bucket" untuk mulai membuat bucket

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)

3. Isi informasi bucket yang relevan, lalu klik tombol Create

    1. Bucket Name disesuaikan dengan kebutuhan bisnis Anda; namanya bebas

    2. Pilih Region yang paling dekat dengan pengguna Anda

    3. Kolom lainnya dapat dibiarkan menggunakan nilai default atau dikonfigurasi sesuai kebutuhan

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)


#### Konfigurasi CORS

1. Masuk ke halaman detail bucket yang dibuat pada langkah sebelumnya

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)

2. Klik "Content Security -> CORS" pada menu tengah

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)

3. Klik tombol "Create Rule", isi informasi yang relevan, gulir ke bawah, lalu klik "OK". Anda dapat merujuk pada tangkapan layar di bawah atau melakukan pengaturan yang lebih terperinci

![](https://static-docs.nocobase.com/20250219171042784.png)

#### Mendapatkan AccessKey dan SecretAccessKey

1. Klik "AccessKey" di bawah avatar di sudut kanan atas

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)

2. Untuk memudahkan demonstrasi, AccessKey dibuat menggunakan akun utama. Untuk penggunaan resmi, disarankan menggunakan RAM. Lihat https://help.aliyun.com/zh/ram/user-guide/create-an-accesskey-pair-1?spm=5176.28366559.0.0.1b5c3c2fUI9Ql8#section-rjh-18m-7kp

3. Klik tombol "Create AccessKey"

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)

4. Lakukan verifikasi akun

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)

5. Simpan Access key dan Secret access key yang ditampilkan di halaman

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)


#### Mendapatkan dan Mengonfigurasi Parameter

1. AccessKey ID dan AccessKey Secret adalah nilai yang diperoleh pada langkah sebelumnya

2. Masuk ke halaman detail bucket untuk mendapatkan Bucket

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)

3. Gulir ke bawah untuk mendapatkan Region (bagian ".aliyuncs.com" di belakangnya tidak diperlukan)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)

4. Dapatkan alamat endpoint. Saat mengisinya di NocoBase, tambahkan awalan https://

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)

#### Konfigurasi Thumbnail (opsional)

Konfigurasi ini bersifat opsional dan hanya digunakan saat perlu mengoptimalkan ukuran atau kualitas pratinjau gambar.

1. Isi parameter terkait `Thumbnail rule`. Untuk pengaturan parameter secara spesifik, lihat [Parameter pemrosesan gambar](https://help.aliyun.com/zh/oss/user-guide/img-parameters/?spm=a2c4g.11186623.help-menu-31815.d_4_14_1_1.170243033CdbSm&scm=20140722.H_144582._.OR_help-T_cn~zh-V_1).

2. `Full upload URL style` dan `Full access URL style` dapat diatur sama.

#### Contoh Konfigurasi

![](https://static-docs.nocobase.com/20250414152525600.png)


### MinIO

#### Pembuatan Bucket

1. Klik menu Buckets di sebelah kiri -> klik Create Bucket untuk masuk ke halaman pembuatan
2. Isi nama Bucket, lalu klik tombol simpan
#### Mendapatkan AccessKey dan SecretAccessKey

1. Masuk ke Access Keys -> klik tombol Create access key untuk masuk ke halaman pembuatan

![](https://static-docs.nocobase.com/20250106111922957.png)

2. Klik tombol simpan

![](https://static-docs.nocobase.com/20250106111850639.png)

1. Simpan Access Key dan Secret Key pada jendela pop-up untuk digunakan dalam konfigurasi berikutnya

![](https://static-docs.nocobase.com/20250106112831483.png)

#### Konfigurasi Parameter

1. Masuk ke halaman NocoBase -> File manager

2. Klik tombol Add new, lalu pilih S3 Pro

3. Isi formulir
   - **AccessKey ID** dan **AccessKey Secret** adalah teks yang disimpan pada langkah sebelumnya
   - **Region**: MinIO yang di-deploy secara privat tidak memiliki konsep Region, sehingga dapat diatur menjadi "auto"
   - **Endpoint**: Isi dengan domain layanan atau alamat IP yang di-deploy
   - Atur Full access URL style menjadi Path-Style

#### Contoh Konfigurasi

![](https://static-docs.nocobase.com/20250414152700671.png)


### Tencent COS

Konfigurasinya dapat mengacu pada layanan file di atas karena logikanya serupa

#### Contoh Konfigurasi

![](https://static-docs.nocobase.com/20250414153252872.png)


### Cloudflare R2

Konfigurasinya dapat mengacu pada layanan file di atas karena logikanya serupa

#### Contoh Konfigurasi

![](https://static-docs.nocobase.com/20250414154500264.png)


## Penggunaan oleh Pengguna

Gunakan plugin file-manager sebagai referensi https://docs.nocobase.com/data-sources/file-manager/.