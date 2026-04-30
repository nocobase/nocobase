---
pkg: '@nocobase/plugin-workflow-webhook'
title: "Trigger Workflow - Webhook"
description: "Trigger Webhook: menyediakan URL HTTP untuk dipanggil pihak ketiga, callback pembayaran, push pesan, dan sistem eksternal lainnya untuk memicu Workflow."
keywords: "Workflow,Webhook,Trigger HTTP,callback pembayaran,panggilan sistem eksternal,NocoBase"
---

# Webhook

## Pengantar

Trigger Webhook digunakan untuk menyediakan URL yang dapat dipanggil sistem pihak ketiga melalui HTTP request. Saat event pihak ketiga terjadi, ia mengirimkan HTTP request ke URL tersebut dan memicu eksekusi alur. Cocok untuk notifikasi yang diinisiasi sistem eksternal, seperti callback pembayaran, pesan, dll.

## Membuat Workflow

Saat membuat Workflow, pilih tipe "Event Webhook":

![20241210105049](https://static-docs.nocobase.com/20241210105049.png)

:::info{title="Tips"}
Perbedaan antara Workflow "Sinkron" dan "Asinkron" adalah, Workflow sinkron akan menunggu eksekusi Workflow selesai sebelum mengembalikan respons, sedangkan Workflow asinkron langsung mengembalikan respons yang sudah dikonfigurasi pada konfigurasi Trigger, dan dieksekusi secara antrian di latar belakang.
:::

## Konfigurasi Trigger

![20241210105441](https://static-docs.nocobase.com/20241210105441.png)

### URL Webhook

URL Trigger Webhook dihasilkan otomatis oleh sistem, dan terikat dengan Workflow ini. Anda dapat mengklik tombol di sebelah kanan untuk menyalin, dan mempaste-nya ke sistem pihak ketiga.

Di mana metode HTTP hanya mendukung POST, metode lainnya akan mengembalikan error `405`.

### Keamanan

Saat ini mendukung HTTP Basic Authentication. Anda dapat mengaktifkan opsi ini dan mengatur username dan password, dalam URL Webhook sistem pihak ketiga sertakan bagian username dan password, untuk mewujudkan autentikasi keamanan untuk Webhook (lihat standar di: [MDN: HTTP authentication](https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication#basic_authentication_scheme)).

Saat sudah mengatur username dan password, sistem akan memvalidasi apakah username dan password dalam request cocok. Jika tidak disediakan atau tidak cocok akan mengembalikan error `401`.

### Parsing Data Request

Saat pihak ketiga memanggil Webhook, data yang dibawa dalam request perlu di-parsing terlebih dahulu sebelum dapat digunakan dalam Workflow. Setelah di-parsing akan menjadi variabel Trigger, dapat dirujuk pada Node berikutnya.

Parsing HTTP request dibagi menjadi tiga bagian:

1.  Header Request

    Header request biasanya merupakan key-value pair tipe string sederhana, field header yang perlu digunakan dapat langsung dikonfigurasi. Seperti `Date`, `X-Request-Id`, dll.

2.  Parameter Request

    Parameter request yaitu bagian query parameter dalam URL, seperti parameter `query` dalam `http://localhost:13000/api/webhook:trigger/1hfmkioou0d?query=1`. Anda dapat mempaste contoh URL lengkap atau hanya bagian contoh query parameter, klik tombol parsing untuk parsing otomatis key-value pair di dalamnya.

    ![20241210111155](https://static-docs.nocobase.com/20241210111155.png)

    Parsing otomatis akan mengonversi bagian parameter dalam URL menjadi struktur JSON, dan menghasilkan path seperti `query[0]`, `query[0].a`, dll. berdasarkan level parameter. Nama path tersebut dapat dimodifikasi manual saat tidak memenuhi kebutuhan, tetapi biasanya tidak perlu dimodifikasi. Alias adalah nama tampilan variabel saat digunakan sebagai variabel, opsional. Sambil parsing akan menghasilkan tabel parameter lengkap dalam contoh, jika ada parameter yang tidak perlu digunakan, dapat dihapus.

3.  Body Request

    Body request yaitu bagian Body HTTP request, saat ini hanya mendukung body request format `Content-Type` `application/json`. Dapat langsung mengonfigurasi path yang perlu di-parsing, atau memasukkan contoh JSON, klik tombol parsing untuk parsing otomatis.

    ![20241210112529](https://static-docs.nocobase.com/20241210112529.png)

    Parsing otomatis akan mengonversi key-value pair dalam struktur JSON menjadi path, seperti `{"a": 1, "b": {"c": 2}}` akan menghasilkan path seperti `a`, `b`, `b.c`, dll. Alias adalah nama tampilan variabel saat digunakan sebagai variabel, opsional. Sambil parsing akan menghasilkan tabel parameter lengkap dalam contoh, jika ada parameter yang tidak perlu digunakan, dapat dihapus.

### Pengaturan Respons

Bagian respons Webhook memiliki cara konfigurasi yang berbeda pada Workflow sinkron dan asinkron. Workflow asinkron langsung dikonfigurasi pada Trigger, setelah menerima Webhook request, akan langsung mengembalikan ke sistem pihak ketiga dengan konfigurasi respons pada Trigger, kemudian baru mengeksekusi Workflow; sedangkan Workflow sinkron perlu menambahkan Node response dalam alur sesuai kebutuhan bisnis untuk memprosesnya (lihat detail: [Node Response](#node-response)).

Biasanya status code respons event Webhook yang dipicu asinkron adalah `200`, dengan body respons `ok`. Anda juga dapat menyesuaikan status code respons, header respons, dan body respons sesuai situasi.

![20241210114312](https://static-docs.nocobase.com/20241210114312.png)

## Node Response

Referensi: [Node Response](../nodes/response.md)

## Contoh

Pada Workflow Webhook, Anda dapat mengembalikan respons yang berbeda berdasarkan kondisi bisnis yang berbeda, seperti gambar di bawah:

![20241210120655](https://static-docs.nocobase.com/20241210120655.png)

Melalui Node cabang kondisi, menentukan apakah suatu status bisnis terpenuhi, jika terpenuhi mengembalikan sukses, jika tidak mengembalikan gagal.
