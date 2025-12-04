---
pkg: '@nocobase/plugin-workflow-subflow'
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Memanggil Alur Kerja

## Pendahuluan

Digunakan untuk memanggil alur kerja lain dari dalam suatu alur kerja. Anda dapat menggunakan variabel dari alur kerja saat ini sebagai input untuk alur kerja anak, dan menggunakan output dari alur kerja anak sebagai variabel dalam alur kerja saat ini untuk digunakan pada node-node berikutnya.

Proses pemanggilan alur kerja ditunjukkan pada gambar di bawah ini:

![20241230134634](https://static-docs.nocobase.com/20241230134634.png)

Dengan memanggil alur kerja, Anda dapat menggunakan kembali logika proses umum, seperti mengirim email, SMS, dll., atau memecah alur kerja yang kompleks menjadi beberapa alur kerja anak untuk manajemen dan pemeliharaan yang lebih mudah.

Pada dasarnya, suatu alur kerja tidak membedakan apakah suatu proses adalah alur kerja anak atau bukan. Setiap alur kerja dapat dipanggil sebagai alur kerja anak oleh alur kerja lain, dan juga dapat memanggil alur kerja lain. Semua alur kerja setara; hanya ada hubungan memanggil dan dipanggil.

Demikian pula, penggunaan pemanggilan alur kerja terjadi di dua tempat:

1.  **Di alur kerja utama:** Sebagai pemanggil, ia memanggil alur kerja lain melalui node "Memanggil Alur Kerja".
2.  **Di alur kerja anak:** Sebagai pihak yang dipanggil, ia menyimpan variabel yang perlu di-output dari alur kerja saat ini melalui node "Output Alur Kerja", yang dapat digunakan oleh node-node berikutnya di alur kerja yang memanggilnya.

## Membuat Node

Di antarmuka konfigurasi alur kerja, klik tombol plus ("+") di alur kerja untuk menambahkan node "Memanggil Alur Kerja":

![Add Invoke Workflow Node](https://static-docs.nocobase.com/20241230001323.png)

## Mengonfigurasi Node

### Memilih Alur Kerja

Pilih alur kerja yang akan dipanggil. Anda dapat menggunakan kotak pencarian untuk pencarian cepat:

![Select Workflow](https://static-docs.nocobase.com/20241230001534.png)

:::info{title=Tips}
*   Alur kerja yang dinonaktifkan juga dapat dipanggil sebagai alur kerja anak.
*   Ketika alur kerja saat ini dalam mode sinkron, ia hanya dapat memanggil alur kerja anak yang juga dalam mode sinkron.
:::

### Mengonfigurasi Variabel Pemicu Alur Kerja

Setelah memilih alur kerja, Anda juga perlu mengonfigurasi variabel pemicu sebagai data input untuk memicu alur kerja anak. Anda dapat langsung memilih data statis atau memilih variabel dari alur kerja saat ini:

![Configure Trigger Variables](https://static-docs.nocobase.com/20241230162722.png)

Jenis pemicu yang berbeda memerlukan variabel yang berbeda, yang dapat dikonfigurasi pada formulir sesuai kebutuhan.

## Node Output Alur Kerja

Lihat konten node [Output Alur Kerja](./output.md) untuk mengonfigurasi variabel output dari alur kerja anak.

## Menggunakan Output Alur Kerja

Kembali ke alur kerja utama, di node-node lain di bawah node Memanggil Alur Kerja, ketika Anda ingin menggunakan nilai output dari alur kerja anak, Anda dapat memilih hasil dari node Memanggil Alur Kerja. Jika alur kerja anak meng-output nilai sederhana, seperti string, angka, nilai boolean, tanggal (tanggal adalah string dalam format UTC), dll., nilai tersebut dapat langsung digunakan; jika itu adalah objek kompleks (seperti objek dari koleksi), perlu dipetakan terlebih dahulu melalui node Parse JSON sebelum propertinya dapat digunakan; jika tidak, ia hanya dapat digunakan sebagai objek utuh.

Jika alur kerja anak tidak mengonfigurasi node Output Alur Kerja, atau jika tidak memiliki nilai output, maka ketika menggunakan hasil dari node Memanggil Alur Kerja di alur kerja utama, Anda hanya akan mendapatkan nilai null (`null`).