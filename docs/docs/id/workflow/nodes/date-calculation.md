---
pkg: '@nocobase/plugin-workflow-date-calculation'
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Perhitungan Tanggal

## Pendahuluan

Node Perhitungan Tanggal menyediakan sembilan fungsi perhitungan, termasuk menambahkan periode waktu, mengurangi periode waktu, output string waktu yang diformat, dan konversi satuan durasi. Setiap fungsi memiliki tipe nilai input dan output spesifik, serta dapat menerima hasil dari node lain sebagai variabel parameter. Node ini menggunakan alur perhitungan untuk merangkai hasil perhitungan fungsi yang telah dikonfigurasi guna mendapatkan output yang diharapkan.

## Membuat Node

Pada antarmuka konfigurasi alur kerja, klik tombol plus ("+") di alur untuk menambahkan node "Perhitungan Tanggal":

![Node Perhitungan Tanggal_Membuat Node](https://static-docs.nocobase.com/[图片].png)

## Konfigurasi Node

![Node Perhitungan Tanggal_Konfigurasi Node](https://static-docs.nocobase.com/20240817184423.png)

### Nilai Input

Nilai input dapat berupa variabel atau konstanta tanggal. Variabel dapat berupa data yang memicu alur kerja ini atau hasil dari node hulu dalam alur kerja ini. Untuk konstanta, Anda dapat memilih tanggal apa pun.

### Tipe Nilai Input

Mengacu pada tipe nilai input. Ada dua kemungkinan nilai.

*   **Tipe Tanggal:** Berarti nilai input pada akhirnya dapat dikonversi ke tipe tanggal-waktu, seperti timestamp numerik atau string yang merepresentasikan waktu.
*   **Tipe Angka:** Karena tipe nilai input akan memengaruhi pilihan langkah perhitungan waktu berikutnya, penting untuk memilih tipe nilai input dengan benar.

### Langkah Perhitungan

Setiap langkah perhitungan terdiri dari fungsi perhitungan dan konfigurasi parameternya. Node ini mengadopsi desain pipeline, di mana hasil perhitungan dari fungsi sebelumnya akan menjadi nilai input untuk perhitungan fungsi berikutnya. Dengan cara ini, serangkaian perhitungan dan konversi waktu dapat diselesaikan.

Setelah setiap langkah perhitungan, tipe output juga tetap dan akan memengaruhi fungsi yang tersedia untuk langkah perhitungan berikutnya. Perhitungan hanya dapat dilanjutkan jika tipe datanya cocok. Jika tidak, hasil dari suatu langkah akan menjadi output akhir dari node.

## Fungsi Perhitungan

### Menambahkan Periode Waktu

-   Menerima tipe nilai input: Tanggal
-   Parameter
    -   Jumlah yang akan ditambahkan, dapat berupa angka atau variabel bawaan dari node.
    -   Satuan waktu.
-   Tipe nilai output: Tanggal
-   Contoh: Jika nilai input adalah `2024-7-15 00:00:00`, jumlahnya `1`, dan satuannya "hari", maka hasil perhitungannya adalah `2024-7-16 00:00:00`.

### Mengurangi Periode Waktu

-   Menerima tipe nilai input: Tanggal
-   Parameter
    -   Jumlah yang akan dikurangi, dapat berupa angka atau variabel bawaan dari node.
    -   Satuan waktu.
-   Tipe nilai output: Tanggal
-   Contoh: Jika nilai input adalah `2024-7-15 00:00:00`, jumlahnya `1`, dan satuannya "hari", maka hasil perhitungannya adalah `2024-7-14 00:00:00`.

### Menghitung Selisih dengan Waktu Lain

-   Menerima tipe nilai input: Tanggal
-   Parameter
    -   Tanggal yang akan dihitung selisihnya, dapat berupa konstanta tanggal atau variabel dari konteks alur kerja.
    -   Satuan waktu.
    -   Apakah mengambil nilai absolut.
    -   Operasi pembulatan: Pilihan termasuk mempertahankan desimal, pembulatan ke terdekat, pembulatan ke atas, dan pembulatan ke bawah.
-   Tipe nilai output: Angka
-   Contoh: Jika nilai input adalah `2024-7-15 00:00:00`, objek pembanding adalah `2024-7-16 06:00:00`, satuannya "hari", nilai absolut tidak diambil, dan desimal dipertahankan, maka hasil perhitungannya adalah `-1.25`.

:::info{title=Tips}
Ketika nilai absolut dan pembulatan dikonfigurasi secara bersamaan, nilai absolut akan diambil terlebih dahulu, kemudian pembulatan diterapkan.
:::

### Mendapatkan Nilai Waktu dalam Satuan Tertentu

-   Menerima tipe nilai input: Tanggal
-   Parameter
    -   Satuan waktu.
-   Tipe nilai output: Angka
-   Contoh: Jika nilai input adalah `2024-7-15 00:00:00` dan satuannya "hari", maka hasil perhitungannya adalah `15`.

### Mengatur Tanggal ke Awal Satuan Tertentu

-   Menerima tipe nilai input: Tanggal
-   Parameter
    -   Satuan waktu.
-   Tipe nilai output: Tanggal
-   Contoh: Jika nilai input adalah `2024-7-15 14:26:30` dan satuannya "hari", maka hasil perhitungannya adalah `2024-7-15 00:00:00`.

### Mengatur Tanggal ke Akhir Satuan Tertentu

-   Menerima tipe nilai input: Tanggal
-   Parameter
    -   Satuan waktu.
-   Tipe nilai output: Tanggal
-   Contoh: Jika nilai input adalah `2024-7-15 14:26:30` dan satuannya "hari", maka hasil perhitungannya adalah `2024-7-15 23:59:59`.

### Memeriksa Tahun Kabisat

-   Menerima tipe nilai input: Tanggal
-   Parameter
    -   Tanpa parameter
-   Tipe nilai output: Boolean
-   Contoh: Jika nilai input adalah `2024-7-15 14:26:30`, maka hasil perhitungannya adalah `true`.

### Memformat sebagai String

-   Menerima tipe nilai input: Tanggal
-   Parameter
    -   Format, lihat [Day.js: Format](https://day.js.org/docs/en/display/format)
-   Tipe nilai output: String
-   Contoh: Jika nilai input adalah `2024-7-15 14:26:30` dan formatnya `the time is YYYY/MM/DD HH:mm:ss`, maka hasil perhitungannya adalah `the time is 2024/07/15 14:26:30`.

### Mengonversi Satuan

-   Menerima tipe nilai input: Angka
-   Parameter
    -   Satuan waktu sebelum konversi.
    -   Satuan waktu setelah konversi.
    -   Operasi pembulatan, pilihan termasuk mempertahankan desimal, pembulatan ke terdekat, pembulatan ke atas, dan pembulatan ke bawah.
-   Tipe nilai output: Angka
-   Contoh: Jika nilai input adalah `2`, satuan sebelum konversi adalah "minggu", satuan setelah konversi adalah "hari", dan desimal tidak dipertahankan, maka hasil perhitungannya adalah `14`.

## Contoh

![Node Perhitungan Tanggal_Contoh](https://static-docs.nocobase.com/20240817184137.png)

Misalkan ada acara promosi, dan kita ingin menambahkan waktu berakhir promosi pada bidang produk saat setiap produk dibuat. Waktu berakhir ini adalah pukul 23:59:59 pada hari terakhir minggu berikutnya setelah waktu pembuatan produk. Jadi, kita dapat membuat dua fungsi waktu dan menjalankannya dalam mode pipeline:

-   Menghitung waktu untuk minggu berikutnya
-   Mengatur ulang hasil ke pukul 23:59:59 pada hari terakhir minggu tersebut

Dengan cara ini, kita mendapatkan nilai waktu yang diinginkan dan meneruskannya ke node berikutnya, misalnya node modifikasi koleksi, untuk menambahkan waktu berakhir promosi ke dalam koleksi.