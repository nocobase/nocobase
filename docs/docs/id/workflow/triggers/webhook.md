---
pkg: '@nocobase/plugin-workflow-webhook'
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Webhook

## Pendahuluan

Pemicu Webhook menyediakan URL yang dapat dipanggil oleh sistem pihak ketiga melalui permintaan HTTP. Ketika suatu peristiwa pihak ketiga terjadi, permintaan HTTP akan dikirim ke URL ini untuk memicu eksekusi alur kerja. Ini cocok untuk notifikasi yang diprakarsai oleh sistem eksternal, seperti callback pembayaran, pesan, dll.

## Membuat Alur Kerja

Saat membuat alur kerja, pilih jenis "Webhook event":

![20241210105049](https://static-docs.nocobase.com/20241210105049.png)

:::info{title="Catatan"}
Perbedaan antara alur kerja "sinkron" dan "asinkron" adalah bahwa alur kerja sinkron akan menunggu hingga eksekusi alur kerja selesai sebelum mengembalikan respons, sedangkan alur kerja asinkron akan segera mengembalikan respons yang telah dikonfigurasi dalam pemicu dan mengantrekan eksekusi di latar belakang.
:::

## Konfigurasi Pemicu

![20241210105441](https://static-docs.nocobase.com/20241210105441.png)

### URL Webhook

URL untuk pemicu Webhook secara otomatis dihasilkan oleh sistem dan terikat pada alur kerja ini. Anda dapat mengeklik tombol di sebelah kanan untuk menyalinnya dan menempelkannya ke sistem pihak ketiga.

Hanya metode HTTP POST yang didukung; metode lain akan mengembalikan kesalahan `405`.

### Keamanan

Saat ini, Otentikasi Dasar HTTP didukung. Anda dapat mengaktifkan opsi ini dan mengatur nama pengguna serta kata sandi. Sertakan nama pengguna dan kata sandi dalam URL Webhook di sistem pihak ketiga untuk mengimplementasikan otentikasi keamanan untuk Webhook (untuk detail standar, lihat: [MDN: HTTP authentication](https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication#basic_authentication_scheme)).

Ketika nama pengguna dan kata sandi telah diatur, sistem akan memverifikasi apakah nama pengguna dan kata sandi dalam permintaan cocok. Jika tidak disediakan atau tidak cocok, kesalahan `401` akan dikembalikan.

### Mengurai Data Permintaan

Ketika pihak ketiga memanggil Webhook, data yang dibawa dalam permintaan perlu diurai sebelum dapat digunakan dalam alur kerja. Setelah diurai, data tersebut akan menjadi variabel pemicu yang dapat direferensikan di node-node berikutnya.

Penguraian permintaan HTTP dibagi menjadi tiga bagian:

1.  Header Permintaan

    Header permintaan biasanya berupa pasangan kunci-nilai bertipe string sederhana. Bidang header yang perlu digunakan dapat dikonfigurasi secara langsung, seperti `Date`, `X-Request-Id`, dll.

2.  Parameter Permintaan

    Parameter permintaan adalah bagian parameter kueri dalam URL, seperti parameter `query` dalam `http://localhost:13000/api/webhook:trigger/1hfmkioou0d?query=1`. Anda dapat menempelkan contoh URL lengkap atau hanya bagian parameter kueri, lalu mengeklik tombol urai untuk secara otomatis mengurai pasangan kunci-nilai di dalamnya.

    ![20241210111155](https://static-docs.nocobase.com/20241210111155.png)

    Penguraian otomatis akan mengubah bagian parameter URL menjadi struktur JSON dan menghasilkan jalur seperti `query[0]`, `query[0].a` berdasarkan hierarki parameter. Nama jalur ini dapat dimodifikasi secara manual jika tidak sesuai dengan kebutuhan Anda, tetapi biasanya tidak perlu diubah. Alias adalah nama tampilan variabel saat digunakan, yang bersifat opsional. Pada saat yang sama, penguraian akan menghasilkan daftar lengkap parameter dari contoh; Anda dapat menghapus parameter apa pun yang tidak Anda perlukan.

3.  Body Permintaan

    Body permintaan adalah bagian Body dari permintaan HTTP. Saat ini, hanya body permintaan dengan format `Content-Type` `application/json` yang didukung. Anda dapat langsung mengonfigurasi jalur yang akan diurai, atau Anda dapat memasukkan contoh JSON dan mengeklik tombol urai untuk penguraian otomatis.

    ![20241210112529](https://static-docs.nocobase.com/20241210112529.png)

    Penguraian otomatis akan mengubah pasangan kunci-nilai dalam struktur JSON menjadi jalur. Misalnya, `{"a": 1, "b": {"c": 2}}` akan menghasilkan jalur seperti `a`, `b`, dan `b.c`. Alias adalah nama tampilan variabel saat digunakan, yang bersifat opsional. Pada saat yang sama, penguraian akan menghasilkan daftar lengkap parameter dari contoh; Anda dapat menghapus parameter apa pun yang tidak Anda perlukan.

### Pengaturan Respons

Konfigurasi bagian respons Webhook berbeda antara alur kerja sinkron dan asinkron. Untuk alur kerja asinkron, respons dikonfigurasi langsung di pemicu. Setelah menerima permintaan Webhook, sistem akan segera mengembalikan respons yang dikonfigurasi dalam pemicu ke sistem pihak ketiga, lalu mengeksekusi alur kerja. Sementara itu, alur kerja sinkron perlu ditangani dengan menambahkan node respons dalam alur sesuai dengan kebutuhan bisnis (untuk detail, lihat: [Node Respons](#node-respons)).

Biasanya, respons untuk peristiwa Webhook yang dipicu secara asinkron memiliki kode status `200` dan body respons `ok`. Anda juga dapat menyesuaikan kode status respons, header respons, dan body respons sesuai kebutuhan.

![20241210114312](https://static-docs.nocobase.com/20241210114312.png)

## Node Respons

Referensi: [Node Respons](../nodes/response.md)

## Contoh

Dalam alur kerja Webhook, Anda dapat mengembalikan respons yang berbeda berdasarkan kondisi bisnis yang berbeda, seperti yang ditunjukkan pada gambar di bawah ini:

![20241210120655](https://static-docs.nocobase.com/20241210120655.png)

Gunakan node cabang bersyarat untuk menentukan apakah suatu status bisnis terpenuhi. Jika terpenuhi, kembalikan respons sukses; jika tidak, kembalikan respons gagal.