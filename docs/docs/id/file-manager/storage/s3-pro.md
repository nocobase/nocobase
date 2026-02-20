---
pkg: '@nocobase/plugin-file-storage-s3-pro'
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Mesin Penyimpanan: S3 (Pro)

## Pendahuluan

Berdasarkan plugin Pengelola Berkas, ini menambahkan dukungan untuk jenis penyimpanan berkas yang kompatibel dengan protokol S3. Layanan penyimpanan objek apa pun yang mendukung protokol S3 dapat dengan mudah diintegrasikan, seperti Amazon S3, Aliyun OSS, Tencent COS, MinIO, Cloudflare R2, dan lainnya, sehingga lebih meningkatkan kompatibilitas dan fleksibilitas layanan penyimpanan.

## Fitur

1. Unggah Sisi Klien: Proses unggah berkas tidak melalui server NocoBase, melainkan langsung terhubung ke layanan penyimpanan berkas, memberikan pengalaman unggah yang lebih efisien dan cepat.
    
2. Akses Privat: Saat mengakses berkas, semua URL adalah alamat sementara yang ditandatangani dan diotorisasi, memastikan keamanan dan ketepatan waktu akses berkas.


## Skenario Penggunaan

1. **Manajemen koleksi Berkas**: Mengelola dan menyimpan semua berkas yang diunggah secara terpusat, mendukung berbagai jenis berkas dan metode penyimpanan untuk klasifikasi dan pengambilan yang mudah.
    
2. **Penyimpanan Bidang Lampiran**: Digunakan untuk penyimpanan data lampiran yang diunggah dalam formulir atau catatan, mendukung asosiasi dengan catatan data tertentu.
  

## Konfigurasi Plugin

1. Aktifkan plugin `plugin-file-storage-s3-pro`.
    
2. Klik "Pengaturan -> Pengelola Berkas" untuk masuk ke pengaturan pengelola berkas.

3. Klik tombol "Tambah baru" dan pilih "S3 Pro".

![](https://static-docs.nocobase.com/20250102160704938.png)

4. Setelah pop-up muncul, Anda akan melihat formulir dengan banyak bidang yang perlu diisi. Anda dapat merujuk ke dokumentasi selanjutnya untuk mendapatkan informasi parameter yang relevan untuk layanan berkas yang sesuai dan mengisinya dengan benar ke dalam formulir.

![](https://static-docs.nocobase.com/20250413190828536.png)


## Konfigurasi Penyedia Layanan

### Amazon S3

#### Pembuatan Bucket

1. Buka https://ap-southeast-1.console.aws.amazon.com/s3/home untuk masuk ke konsol S3.
    
2. Klik tombol "Create bucket" di sebelah kanan.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)

2. Isi Nama Bucket. Bidang lainnya dapat dibiarkan dengan pengaturan default. Gulir ke bawah halaman dan klik tombol **"**Create**"** untuk menyelesaikan pembuatan.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)

#### Konfigurasi CORS

1. Buka daftar bucket, temukan dan klik bucket yang baru saja Anda buat untuk masuk ke halaman detailnya.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)

2. Klik tab "Permission", lalu gulir ke bawah untuk menemukan bagian konfigurasi CORS.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970303.png)

3. Masukkan konfigurasi berikut (Anda dapat menyesuaikannya lebih lanjut) dan simpan.
    
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

1. Klik tombol "Security credentials" di sudut kanan atas halaman.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)

2. Gulir ke bawah ke bagian "Access Keys" dan klik tombol "Create Access Key".

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)

3. Klik untuk menyetujui (ini adalah demonstrasi dengan akun root; disarankan untuk menggunakan IAM di lingkungan produksi).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)

4. Simpan Access key dan Secret access key yang ditampilkan di halaman.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)

#### Mendapatkan dan Mengonfigurasi Parameter

1. AccessKey ID dan AccessKey Secret adalah nilai yang Anda peroleh pada langkah sebelumnya. Harap isi dengan akurat.
    
2. Buka panel properti halaman detail bucket, di mana Anda bisa mendapatkan nama Bucket dan informasi Region (Wilayah).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)

#### Akses Publik (Opsional)

Ini adalah konfigurasi opsional. Konfigurasikan jika Anda perlu menjadikan berkas yang diunggah sepenuhnya publik.

1. Buka panel Permissions, gulir ke bawah ke Object Ownership, klik edit, dan aktifkan ACLs.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)

2. Gulir ke Block public access, klik edit, dan atur agar mengizinkan kontrol ACLs.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)

3. Centang Akses publik di NocoBase.


#### Konfigurasi Gambar Mini (Opsional)

Konfigurasi ini bersifat opsional dan digunakan untuk mengoptimalkan ukuran atau efek pratinjau gambar. **Harap dicatat bahwa solusi deployment ini dapat menimbulkan biaya tambahan. Untuk biaya spesifik, silakan merujuk pada ketentuan AWS yang relevan.**

1. Kunjungi [Transformasi Gambar Dinamis untuk Amazon CloudFront](https://aws.amazon.com/solutions/implementations/dynamic-image-transformation-for-amazon-cloudfront/?nc1=h_ls).

2. Klik tombol `Launch in the AWS Console` di bagian bawah halaman untuk mulai menerapkan solusi.
   ![](https://static-docs.nocobase.com/20250221164214117.png)

3. Ikuti petunjuk untuk menyelesaikan konfigurasi. Perhatikan secara khusus opsi-opsi berikut:
   1. Saat membuat stack, Anda perlu menentukan nama bucket Amazon S3 yang berisi gambar sumber. Harap masukkan nama bucket yang Anda buat sebelumnya.
   2. Jika Anda memilih untuk menerapkan UI demo, Anda dapat menguji fitur pemrosesan gambar melalui antarmuka ini setelah penerapan. Di konsol AWS CloudFormation, pilih stack Anda, buka tab "Outputs", temukan nilai yang sesuai dengan kunci DemoUrl, dan klik tautan untuk membuka antarmuka demo.
   3. Solusi ini menggunakan pustaka Node.js `sharp` untuk pemrosesan gambar yang efisien. Anda dapat mengunduh kode sumber dari repositori GitHub dan menyesuaikannya sesuai kebutuhan.
   
   ![](https://static-docs.nocobase.com/20250221164315472.png)
   ![](https://static-docs.nocobase.com/20250221164404755.png)

4. Setelah konfigurasi selesai, tunggu hingga status penerapan berubah menjadi `CREATE_COMPLETE`.

5. Dalam konfigurasi NocoBase, ada beberapa hal yang perlu diperhatikan:
   1. `Aturan gambar mini`: Isi parameter terkait pemrosesan gambar, misalnya, `?width=100`. Untuk detailnya, lihat [dokumentasi AWS](https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/use-supported-query-param-edits.html).
   2. `Endpoint akses`: Isi nilai Outputs -> ApiEndpoint setelah penerapan.
   3. `Gaya URL akses penuh`: Anda perlu mencentang **Abaikan** (karena nama bucket sudah diisi saat konfigurasi, sehingga tidak lagi diperlukan untuk akses).
   
   ![](https://static-docs.nocobase.com/20250414152135514.png)

#### Contoh Konfigurasi

![](https://static-docs.nocobase.com/20250414152344959.png)


### Aliyun OSS

#### Pembuatan Bucket

1. Buka konsol OSS https://oss.console.aliyun.com/overview

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)

2. Klik "Buckets" di menu kiri, lalu klik tombol "Create Bucket" untuk mulai membuat bucket.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)

3. Isi informasi terkait bucket dan terakhir klik tombol Create.
    
    1. Nama Bucket harus sesuai dengan kebutuhan bisnis Anda; nama bisa bebas.
        
    2. Pilih Region (Wilayah) terdekat dengan pengguna Anda.
        
    3. Pengaturan lain dapat dibiarkan default atau dikonfigurasi berdasarkan kebutuhan Anda.    

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)


#### Konfigurasi CORS

1. Buka halaman detail bucket yang dibuat pada langkah sebelumnya.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)

2. Klik "Content Security -> CORS" di menu tengah.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)

3. Klik tombol "Create Rule", isi konten yang relevan, gulir ke bawah, dan klik "OK". Anda dapat merujuk pada tangkapan layar di bawah atau mengonfigurasi pengaturan yang lebih detail.

![](https://static-docs.nocobase.com/20250219171042784.png)

#### Mendapatkan AccessKey dan SecretAccessKey

1. Klik "AccessKey" di bawah gambar profil Anda di sudut kanan atas.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)

2. Untuk tujuan demonstrasi, kami membuat AccessKey menggunakan akun utama. Di lingkungan produksi, disarankan untuk menggunakan RAM untuk membuatnya. Anda dapat merujuk ke https://www.alibabacloud.com/help/en/ram/user-guide/create-an-accesskey-pair
    
3. Klik tombol "Create AccessKey". 

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)

4. Lakukan verifikasi akun.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)

5. Simpan Access key dan Secret access key yang ditampilkan di halaman.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)


#### Mendapatkan dan Mengonfigurasi Parameter

1. AccessKey ID dan AccessKey Secret adalah nilai yang diperoleh pada langkah sebelumnya.
    
2. Buka halaman detail bucket untuk mendapatkan nama Bucket.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)

3. Gulir ke bawah untuk mendapatkan Region (Wilayah) (akhiran ".aliyuncs.com" tidak diperlukan).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)

4. Dapatkan alamat endpoint, dan tambahkan prefiks https:// saat mengisinya ke NocoBase.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)

#### Konfigurasi Gambar Mini (Opsional)

Konfigurasi ini bersifat opsional dan hanya boleh digunakan saat Anda perlu mengoptimalkan ukuran atau efek pratinjau gambar.

1. Isi parameter terkait `Aturan gambar mini`. Untuk pengaturan parameter spesifik, lihat [Parameter Pemrosesan Gambar](https://www.alibabacloud.com/help/en/object-storage-service/latest/process-images).

2. `Gaya URL unggah penuh` dan `Gaya URL akses penuh` dapat dibiarkan sama.

#### Contoh Konfigurasi

![](https://static-docs.nocobase.com/20250414152525600.png)


### MinIO

#### Pembuatan Bucket

1. Klik menu Buckets di sebelah kiri -> klik Create Bucket untuk masuk ke halaman pembuatan.
2. Isi nama Bucket dan klik tombol simpan.
#### Mendapatkan AccessKey dan SecretAccessKey

1. Buka Access Keys -> klik tombol Create access key untuk masuk ke halaman pembuatan.

![](https://static-docs.nocobase.com/20250106111922957.png)

2. Klik tombol simpan.

![](https://static-docs.nocobase.com/20250106111850639.png)

3. Simpan Access Key dan Secret Key dari jendela pop-up untuk konfigurasi selanjutnya.

![](https://static-docs.nocobase.com/20250106112831483.png)

#### Konfigurasi Parameter

1. Buka halaman NocoBase -> Pengelola Berkas.

2. Klik tombol Tambah baru dan pilih S3 Pro.

3. Isi formulir:
   - **AccessKey ID** dan **AccessKey Secret** adalah nilai yang disimpan pada langkah sebelumnya.
   - **Region (Wilayah)**: MinIO yang di-host sendiri tidak memiliki konsep Region, sehingga dapat dikonfigurasi sebagai "auto".
   - **Endpoint**: Isi nama domain atau alamat IP deployment Anda.
   - Gaya URL akses penuh harus diatur ke Path-Style.

#### Contoh Konfigurasi

![](https://static-docs.nocobase.com/20250414152700671.png)


### Tencent COS

Anda dapat merujuk pada konfigurasi layanan berkas yang disebutkan di atas, karena logikanya serupa.

#### Contoh Konfigurasi

![](https://static-docs.nocobase.com/20250414153252872.png)


### Cloudflare R2

Anda dapat merujuk pada konfigurasi layanan berkas yang disebutkan di atas, karena logikanya serupa.

#### Contoh Konfigurasi

![](https://static-docs.nocobase.com/20250414154500264.png)