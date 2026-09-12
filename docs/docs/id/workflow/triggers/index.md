---
title: "Ikhtisar Trigger Workflow"
description: "Trigger Workflow: pintu masuk eksekusi seperti event tabel data, tugas terjadwal, event sebelum/sesudah action, action kustom, persetujuan, Webhook, dll."
keywords: "Trigger Workflow,event tabel data,tugas terjadwal,Webhook,event action,persetujuan,NocoBase"
---

# Ikhtisar

Trigger adalah pintu masuk eksekusi Workflow. Selama proses berjalannya aplikasi, ketika event yang memenuhi kondisi Trigger terjadi, Workflow akan dipicu untuk dieksekusi. Tipe Trigger juga merupakan tipe Workflow, dipilih saat membuat Workflow, dan tidak dapat diubah setelah dibuat. Tipe Trigger yang saat ini didukung adalah sebagai berikut:

- [Event Tabel Data](./collection) (bawaan)
- [Tugas Terjadwal](./schedule) (bawaan)
- [Event Sebelum Action](./pre-action) (disediakan oleh plugin @nocobase/plugin-workflow-request-interceptor)
- [Event Setelah Action](./post-action) (disediakan oleh plugin @nocobase/plugin-workflow-action-trigger)
- [Event Action Kustom](./custom-action) (disediakan oleh plugin @nocobase/plugin-workflow-custom-action-trigger)
- [Persetujuan](./approval) (disediakan oleh plugin @nocobase/plugin-workflow-approval)
- [Webhook](./webhook) (disediakan oleh plugin @nocobase/plugin-workflow-webhook)

Waktu pemicuan masing-masing event seperti yang ditunjukkan pada gambar di bawah:

![Event Workflow](https://static-docs.nocobase.com/20251029221709.png)

Misalnya pengguna mengirimkan formulir, atau data dalam tabel data berubah karena operasi pengguna atau panggilan program, atau tugas terjadwal mencapai waktu eksekusi, semuanya dapat memicu eksekusi Workflow yang sudah dikonfigurasi.

Trigger yang berkaitan dengan data (seperti action, event tabel data) biasanya membawa data konteks pemicuan. Data ini akan menjadi variabel, dapat digunakan oleh Node dalam Workflow sebagai parameter pemrosesan untuk mewujudkan otomasi pemrosesan data. Misalnya ketika pengguna mengirimkan formulir, jika tombol kirim terikat dengan Workflow, Workflow akan dipicu dan dieksekusi. Data yang dikirim akan diinjeksikan ke konteks rencana eksekusi, untuk digunakan oleh Node berikutnya sebagai variabel.

Setelah Workflow dibuat, di halaman tampilan Workflow, Trigger akan ditampilkan sebagai Node entry point pada awal alur. Klik kartu tersebut untuk membuka panel konfigurasi. Berdasarkan tipe Trigger yang berbeda, Anda dapat mengonfigurasi kondisi terkait Trigger.

![Trigger_node entry](https://static-docs.nocobase.com/20251029222231.png)
