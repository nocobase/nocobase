---
pkg: "@nocobase/plugin-file-storage-s3-pro"
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::



pkg: "@nocobase/plugin-file-storage-s3-pro"
---
# Penyimpanan Berkas: S3 (Pro)

## Pendahuluan

Berdasarkan **plugin** manajemen berkas, versi ini menambahkan dukungan untuk jenis penyimpanan berkas yang kompatibel dengan protokol S3. Setiap layanan penyimpanan objek yang mendukung protokol S3 dapat diintegrasikan dengan mudah, seperti Amazon S3, Alibaba Cloud OSS, Tencent Cloud COS, MinIO, Cloudflare R2, dan lainnya, sehingga meningkatkan kompatibilitas dan fleksibilitas layanan penyimpanan.

## Fitur

1.  **Unggah Klien:** Proses unggah berkas tidak perlu melalui server NocoBase, melainkan langsung terhubung ke layanan penyimpanan berkas, sehingga memberikan pengalaman unggah yang lebih efisien dan cepat.
2.  **Akses Privat:** Saat mengakses berkas, semua URL adalah alamat otorisasi sementara yang telah ditandatangani, memastikan keamanan dan validitas akses berkas.

## Skenario Penggunaan

1.  **Manajemen Tabel Berkas:** Mengelola dan menyimpan semua berkas yang diunggah secara terpusat, mendukung berbagai jenis berkas dan metode penyimpanan untuk memudahkan klasifikasi dan pencarian berkas.
2.  **Penyimpanan Bidang Lampiran:** Digunakan untuk menyimpan data lampiran yang diunggah melalui formulir atau catatan, mendukung keterkaitan dengan catatan data tertentu.

## Konfigurasi Plugin

1.  Aktifkan **plugin** `plugin-file-storage-s3-pro`.
2.  Buka "Setting -> FileManager" untuk mengakses pengaturan manajemen berkas.
3.  Klik tombol "Add new" dan pilih "S3 Pro".

![](https://static-docs.nocobase.com/20250102160704938.png)

4.  Setelah jendela pop-up muncul, Anda akan melihat banyak bidang formulir yang perlu diisi. Anda dapat merujuk ke dokumentasi selanjutnya untuk mendapatkan informasi parameter yang relevan untuk layanan berkas Anda dan mengisinya dengan benar ke dalam formulir.

![](https://static-docs.nocobase.com/20250413190828536.png)

## Konfigurasi Penyedia Layanan

### Amazon S3

#### Pembuatan Bucket

1.  Kunjungi [Konsol Amazon S3](https://ap-southeast-1.console.aws.amazon.com/s3/home).
2.  Klik tombol "Create bucket" di sisi kanan.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)

3.  Isi `Bucket Name` (Nama **Bucket**), biarkan bidang lain sebagai pengaturan bawaan, gulir ke bawah halaman, dan klik tombol **"Create"** untuk menyelesaikan proses.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)

#### Konfigurasi CORS

1.  Dalam daftar **bucket**, temukan dan klik **bucket** yang baru saja Anda buat untuk mengakses detailnya.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)

2.  Buka tab "Permission" dan gulir ke bawah untuk menemukan bagian konfigurasi CORS.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970303.png)

3.  Masukkan konfigurasi berikut (sesuaikan jika diperlukan) dan simpan.

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

#### Pengambilan AccessKey dan SecretAccessKey

1.  Klik tombol "Security credentials" di sudut kanan atas halaman.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)

2.  Gulir ke bawah, temukan bagian "Access Keys", dan klik tombol "Create Access Key".

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)

3.  Setujui persyaratan (penggunaan IAM direkomendasikan untuk lingkungan produksi).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)

4.  Simpan `Access Key` dan `Secret Access Key` yang ditampilkan di halaman.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)

#### Pengambilan dan Konfigurasi Parameter

1.  `AccessKey ID` dan `AccessKey Secret` adalah nilai yang Anda dapatkan pada langkah sebelumnya. Harap isi dengan akurat.
2.  Kunjungi panel properti **bucket** untuk menemukan `Bucket Name` (Nama **Bucket**) dan `Region` (Wilayah).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)

#### Akses Publik (Opsional)

Ini adalah konfigurasi opsional. Konfigurasikan jika Anda perlu membuat berkas yang diunggah sepenuhnya publik.

1.  Di panel Permissions, gulir ke "Object Ownership," klik "Edit," dan aktifkan ACLs.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)

2.  Gulir ke "Block public access," klik "Edit," dan atur agar mengizinkan kontrol ACL.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)

3.  Centang "Public access" di NocoBase.

#### Konfigurasi Gambar Mini (Opsional)

Konfigurasi ini bersifat opsional dan digunakan saat Anda perlu mengoptimalkan ukuran atau efek pratinjau gambar. **Harap diperhatikan, penerapan ini mungkin menimbulkan biaya tambahan. Untuk detail lebih lanjut, silakan merujuk pada syarat dan ketentuan AWS.**

1.  Kunjungi [Dynamic Image Transformation for Amazon CloudFront](https://aws.amazon.com/solutions/implementations/dynamic-image-transformation-for-amazon-cloudfront/?nc1=h_ls).

2.  Klik tombol `Launch in the AWS Console` di bagian bawah halaman untuk memulai penerapan.

![](https://static-docs.nocobase.com/20250221164214117.png)

3.  Ikuti petunjuk untuk menyelesaikan konfigurasi. Beberapa opsi berikut memerlukan perhatian khusus:
    1.  Saat membuat `stack`, Anda perlu menentukan nama **bucket** Amazon S3 yang berisi gambar sumber. Harap masukkan nama **bucket** yang Anda buat sebelumnya.
    2.  Jika Anda memilih untuk menerapkan UI demo, setelah penerapan selesai, Anda dapat menggunakan antarmuka tersebut untuk menguji fungsionalitas pemrosesan gambar. Di konsol AWS CloudFormation, pilih `stack` Anda, buka tab "Outputs", temukan nilai yang sesuai dengan kunci `DemoUrl`, dan klik tautan tersebut untuk membuka antarmuka demo.
    3.  Solusi ini menggunakan pustaka Node.js `sharp` untuk memproses gambar secara efisien. Anda dapat mengunduh kode sumber dari repositori GitHub dan menyesuaikannya sesuai kebutuhan.

![](https://static-docs.nocobase.com/20250221164315472.png)

![](https://static-docs.nocobase.com/20250221164404755.png)

4.  Setelah konfigurasi selesai, tunggu hingga status penerapan berubah menjadi `CREATE_COMPLETE`.

5.  Dalam konfigurasi NocoBase, ada beberapa hal yang perlu diperhatikan:
    1.  `Thumbnail rule`: Isi parameter terkait pemrosesan gambar, seperti `?width=100`. Untuk detailnya, silakan merujuk pada [dokumentasi AWS](https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/use-supported-query-param-edits.html).
    2.  `Access endpoint`: Masukkan nilai dari Outputs -> ApiEndpoint setelah penerapan.
    3.  `Full access URL style`: Perlu dicentang **Ignore** (karena nama **bucket** sudah diisi saat konfigurasi, sehingga tidak diperlukan lagi saat akses).

![](https://static-docs.nocobase.com/20250414152135514.png)

#### Contoh Konfigurasi

![](https://static-docs.nocobase.com/20250414152344959.png)

### Alibaba Cloud OSS

#### Pembuatan Bucket

1.  Buka [Konsol OSS](https://oss.console.aliyun.com/overview).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)

2.  Pilih "Buckets" dari menu kiri dan klik "Create Bucket" untuk mulai membuat **bucket** penyimpanan.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)

3.  Isi detail **bucket** dan klik tombol "Create".
    1.  `Bucket Name`: Pilih sesuai kebutuhan bisnis Anda.
    2.  `Region`: Pilih wilayah terdekat untuk pengguna Anda.
    3.  Pengaturan lain dapat dibiarkan `default` atau disesuaikan sesuai kebutuhan.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)

#### Konfigurasi CORS

1.  Buka halaman detail **bucket** yang baru saja Anda buat.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)

2.  Klik "Content Security -> CORS" di menu tengah.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)

3.  Klik tombol "Create Rule", lengkapi bidang-bidang yang relevan, gulir ke bawah, dan klik "OK". Anda dapat merujuk pada tangkapan layar di bawah ini atau melakukan pengaturan yang lebih detail.

![](https://static-docs.nocobase.com/20250219171042784.png)

#### Pengambilan AccessKey dan SecretAccessKey

1.  Klik "AccessKey" di bawah avatar akun Anda di sudut kanan atas.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)

2.  Untuk tujuan demonstrasi, kami akan membuat `AccessKey` menggunakan akun utama. Dalam lingkungan produksi, disarankan untuk menggunakan RAM untuk membuat `AccessKey`. Untuk instruksi, silakan merujuk pada [dokumentasi Alibaba Cloud](https://www.alibabacloud.com/help/en/ram/user-guide/create-an-accesskey-pair).

3.  Klik tombol "Create AccessKey".

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)

4.  Selesaikan verifikasi akun.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)

5.  Simpan `Access Key` dan `Secret Access Key` yang ditampilkan di halaman.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)

#### Pengambilan dan Konfigurasi Parameter

1.  `AccessKey ID` dan `AccessKey Secret` adalah nilai yang diperoleh pada langkah sebelumnya.

2.  Buka halaman detail **bucket** untuk mendapatkan nama **Bucket**.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)

3.  Gulir ke bawah untuk mendapatkan `Region` (akhiran ".aliyuncs.com" tidak diperlukan).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)

4.  Dapatkan alamat `endpoint` dan tambahkan prefiks `https://` saat memasukkannya ke NocoBase.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)

#### Konfigurasi Gambar Mini (Opsional)

Konfigurasi ini bersifat opsional dan hanya digunakan saat mengoptimalkan ukuran atau efek pratinjau gambar.

1.  Isi parameter yang relevan untuk `Thumbnail rule`. Untuk pengaturan parameter spesifik, silakan merujuk pada [dokumentasi Alibaba Cloud tentang Pemrosesan Gambar](https://help.aliyun.com/zh/oss/user-guide/img-parameters/?spm=a2c4g.11186623.help-menu-31815.d_4_14_1_1.170243033CdbSm&scm=20140722.H_144582._.OR_help-T_cn~zh-V_1).

2.  Biarkan pengaturan `Full upload URL style` dan `Full access URL style` tetap sama.

#### Contoh Konfigurasi

![](https://static-docs.nocobase.com/20250414152525600.png)

### MinIO

#### Pembuatan Bucket

1.  Klik menu **Buckets** di sebelah kiri -> Klik **Create Bucket** untuk membuka halaman pembuatan.
2.  Masukkan nama **Bucket**, lalu klik tombol **Save**.

#### Pengambilan AccessKey dan SecretAccessKey

1.  Buka **Access Keys** -> Klik tombol **Create access key** untuk membuka halaman pembuatan.

![](https://static-docs.nocobase.com/20250106111922957.png)

2.  Klik tombol **Save**.

![](https://static-docs.nocobase.com/20250106111850639.png)

3.  Simpan `Access Key` dan `Secret Key` dari jendela pop-up untuk konfigurasi selanjutnya.

![](https://static-docs.nocobase.com/20250106112831483.png)

#### Konfigurasi Parameter

1.  Buka halaman **File manager** di NocoBase.

2.  Klik tombol **Add new** dan pilih **S3 Pro**.

3.  Isi formulir:
    -   **AccessKey ID** dan **AccessKey Secret**: Gunakan nilai yang disimpan dari langkah sebelumnya.
    -   **Region**: MinIO yang diterapkan secara privat tidak memiliki konsep `Region`; Anda dapat mengaturnya ke "auto".
    -   **Endpoint**: Masukkan nama domain atau alamat IP layanan yang Anda terapkan.
    -   Atur `Full access URL style` ke `Path-Style`.

#### Contoh Konfigurasi

![](https://static-docs.nocobase.com/20250414152700671.png)

### Tencent COS

Anda dapat merujuk pada konfigurasi untuk layanan berkas di atas. Logikanya serupa.

#### Contoh Konfigurasi

![](https://static-docs.nocobase.com/20250414153252872.png)

### Cloudflare R2

Anda dapat merujuk pada konfigurasi untuk layanan berkas di atas. Logikanya serupa.

#### Contoh Konfigurasi

![](https://static-docs.nocobase.com/20250414154500264.png)

## Panduan Pengguna

Silakan merujuk pada [dokumentasi **plugin** file-manager](/data-sources/file-manager).