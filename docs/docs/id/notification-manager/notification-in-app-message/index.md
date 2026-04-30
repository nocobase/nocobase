---
pkg: '@nocobase/plugin-notification-in-app-message'
title: "Notifikasi In-App Message"
description: "Channel notifikasi in-app message: penerimaan notifikasi pesan real-time di dalam aplikasi, channel built-in tidak perlu instalasi, mendukung trigger workflow, follow-up marketing leads, dan skenario lainnya."
keywords: "in-app message,In-App Message,notifikasi dalam aplikasi,pesan real-time,notification manager,NocoBase"
---

# Notifikasi: In-App Message

## Pengantar

Mendukung user menerima notifikasi pesan secara real-time di dalam aplikasi NocoBase.

## Instalasi

Plugin ini adalah plugin built-in, tidak perlu diinstal.

## Menambahkan Channel In-App Message

Buka notification manager, klik tombol Add new, pilih In-App Message.
![2024-11-08-08-33-26-20241108083326](https://static-docs.nocobase.com/2024-11-08-08-33-26-20241108083326.png)

Setelah memasukkan nama channel dan deskripsi, klik submit.
![2024-11-08-08-34-32-20241108083431](https://static-docs.nocobase.com/2024-11-08-08-34-32-20241108083431.png)

Channel baru yang sesuai akan ditambahkan di list.

![2024-11-08-08-34-52-20241108083452](https://static-docs.nocobase.com/2024-11-08-08-34-52-20241108083452.png)

## Contoh Skenario Penggunaan

Untuk membantu Anda lebih memahami cara penggunaan in-app message, berikut adalah contoh "Marketing Leads Follow-up".

Asumsikan tim Anda sedang menjalankan kampanye marketing penting, dengan tujuan follow-up feedback dan kebutuhan calon pelanggan. Menggunakan in-app message, Anda dapat:

**Membuat Channel Notifikasi**: Pertama di notification channel management, konfigurasikan channel in-app message dengan nama "Marketing Clue", pastikan anggota tim dapat mengidentifikasi dengan jelas tujuan channel ini.

![2024-11-08-08-34-32-20241108083431](https://static-docs.nocobase.com/2024-11-08-08-34-32-20241108083431.png)

**Konfigurasi Workflow**: Buat workflow yang secara otomatis memicu notifikasi saat ada marketing lead baru. Anda dapat menambahkan node notifikasi di workflow, pilih channel "Marketing Clue" yang dibuat sebelumnya, dan konfigurasikan konten pesan sesuai kebutuhan aktual. Contohnya:

![image-1-2024-10-27-14-07-17](https://static-docs.nocobase.com/image-1-2024-10-27-14-07-17.png)

**Penerimaan Notifikasi Real-time**: Setelah workflow dipicu, semua personnel terkait akan menerima notifikasi secara real-time, memastikan tim dapat merespons dan bertindak dengan cepat.

![image-2-2024-10-27-14-07-22](https://static-docs.nocobase.com/image-2-2024-10-27-14-07-22.png)

**Manajemen dan Tracking Pesan**: In-app message akan dikelompokkan berdasarkan nama channel pengiriman. Anda dapat memfilter berdasarkan status pesan yang sudah dibaca atau belum dibaca, untuk memudahkan melihat informasi penting dengan cepat. Klik tombol "View" untuk berpindah ke halaman link yang dikonfigurasi, untuk pemrosesan lebih lanjut.

![20241027140648-2024-10-27-14-06-51-2024-10-29-13-26-41](https://static-docs.nocobase.com/20241027140648-2024-10-27-14-06-51-2024-10-29-13-26-41.png)
