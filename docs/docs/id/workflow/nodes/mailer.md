---
pkg: '@nocobase/plugin-workflow-mailer'
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Mengirim Email

## Pendahuluan

Digunakan untuk mengirim email. Mendukung konten dalam format teks dan HTML.

## Membuat Node

Di antarmuka konfigurasi **alur kerja**, klik tombol plus ("+") pada alur untuk menambahkan node "Mengirim Email":

![20251031130522](https://static-docs.nocobase.com/20251031130522.png)

## Konfigurasi Node

![20251031131125](https://static-docs.nocobase.com/20251031131125.png)

Setiap opsi dapat menggunakan variabel dari konteks **alur kerja**. Untuk informasi sensitif, variabel global dan rahasia juga dapat digunakan.

## Pertanyaan Umum

### Batas Frekuensi Pengiriman Gmail

Saat mengirim beberapa email, Anda mungkin mengalami kesalahan berikut:

```json
{
  "code": "ECONNECTION",
  "response": "421-4.7.0 Try again later, closing connection. (EHLO)\n421-4.7.0 For more information, go to\n421 4.7.0 About SMTP error messages - Google Workspace Admin Help 3f1490d57ef6-e7f7352f44csm831688276.30 - gsmtp",
  "responseCode": 421,
  "command": "EHLO"
}
```

Hal ini karena Gmail membatasi frekuensi permintaan pengiriman dari domain yang tidak ditentukan. Saat menerapkan aplikasi, Anda perlu mengonfigurasi nama host server agar sesuai dengan domain pengiriman yang telah Anda ikat di Gmail. Contoh, dalam penerapan Docker:

```yaml
services:
  app:
    image: nocobase/nocobase
    hostname: <your-custom-hostname> # Atur ke domain pengiriman yang telah Anda ikat
```

Referensi: [Google SMTP Relay - Intermittent problems](https://forum.nocobase.com/t/google-smtp-relay-intermittent-problems/5483/6)