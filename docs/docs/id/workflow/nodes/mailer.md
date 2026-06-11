---
pkg: '@nocobase/plugin-workflow-mailer'
title: "Node Workflow - Kirim Email"
description: "Node Kirim Email: mengirim email, mendukung konten format teks dan HTML."
keywords: "Workflow,Kirim Email,Mailer,Email,notifikasi,NocoBase"
---

# Kirim Email

## Pengantar

Digunakan untuk mengirim email, mendukung konten email dengan format teks dan HTML.

## Membuat Node

Pada antarmuka konfigurasi workflow, klik tombol plus ("+") pada alur untuk menambahkan Node "Kirim Email":

![20251031130522](https://static-docs.nocobase.com/20251031130522.png)

## Konfigurasi Node

![20251031131125](https://static-docs.nocobase.com/20251031131125.png)

Setiap opsi dapat menggunakan variable dari konteks alur. Untuk informasi sensitif, Anda juga dapat menggunakan variable global dan secret.

## Pertanyaan Umum

### Pembatasan Frekuensi Pengiriman Gmail

Beberapa email saat dikirim mungkin akan menemui error berikut:

```json
{
  "code": "ECONNECTION",
  "response": "421-4.7.0 Try again later, closing connection. (EHLO)\n421-4.7.0 For more information, go to\n421 4.7.0 About SMTP error messages - Google Workspace Admin Help 3f1490d57ef6-e7f7352f44csm831688276.30 - gsmtp",
  "responseCode": 421,
  "command": "EHLO"
}
```

Ini disebabkan Gmail melakukan pembatasan frekuensi pada request pengiriman dari domain yang tidak ditandai. Anda perlu mengkonfigurasi hostname server saat deploy aplikasi sebagai domain pengiriman yang terdaftar di Gmail. Misalnya saat deploy dengan Docker:

```yaml
services:
  app:
    image: nocobase/nocobase
    hostname: <your-custom-hostname> # Atur sebagai domain pengiriman yang sudah terdaftar
```

Referensi: [Google SMTP Relay - Intermittent problems](https://forum.nocobase.com/t/google-smtp-relay-intermittent-problems/5483/6)
