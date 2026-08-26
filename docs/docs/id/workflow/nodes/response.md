---
pkg: "@nocobase/plugin-workflow-response-message"
title: "Node Workflow - HTTP Response"
description: "Node HTTP Response: response yang dikembalikan ke sistem pihak ketiga pada Webhook sinkron, alur berhenti setelah dieksekusi."
keywords: "Workflow,HTTP Response,Response,response Webhook,NocoBase"
---

# HTTP Response

## Pengantar

Hanya didukung dalam workflow Webhook mode sinkron, digunakan untuk mengembalikan response kepada sistem pihak ketiga. Misalnya pada proses callback pembayaran, jika ada hasil bisnis yang tidak diharapkan (seperti error, gagal, dll.), Anda dapat menggunakan Node Response untuk mengembalikan response yang menyatakan error kepada sistem pihak ketiga, sehingga beberapa sistem pihak ketiga dapat mencoba ulang nanti berdasarkan status tersebut.

Selain itu, eksekusi Node Response akan menghentikan eksekusi workflow, Node berikutnya tidak akan dieksekusi lagi. Jika seluruh workflow tidak dikonfigurasi dengan Node Response, sistem akan secara otomatis merespon berdasarkan status eksekusi alur, eksekusi sukses mengembalikan `200`, eksekusi gagal mengembalikan `500`.

## Membuat Node Response

Pada antarmuka konfigurasi workflow, klik tombol plus ("+") pada alur untuk menambahkan Node "Response":

![20241210115120](https://static-docs.nocobase.com/20241210115120.png)

## Konfigurasi Response

![20241210115500](https://static-docs.nocobase.com/20241210115500.png)

Body response dapat menggunakan variable konteks workflow.
