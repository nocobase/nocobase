---
title: "Trigger Workflow - Tugas Terjadwal"
description: "Trigger tugas terjadwal: pemicuan waktu kustom (cron), field waktu tabel data, eksekusi presisi detik, penjadwalan Workflow."
keywords: "Workflow,tugas terjadwal,Schedule,Cron,penjadwalan,NocoBase"
---

# Tugas Terjadwal

## Pengantar

Tugas terjadwal adalah event yang menggunakan waktu sebagai kondisi pemicuan, dibagi menjadi dua mode:

- Waktu Kustom: pemicuan terjadwal mirip cron berdasarkan waktu sistem yang reguler
- Field Waktu Tabel Data: pemicuan ketika nilai field waktu di tabel data tiba

Ketika sistem berjalan ke titik waktu yang memenuhi kondisi pemicuan yang dikonfigurasi (presisi hingga detik), akan memicu Workflow yang sesuai.

## Penggunaan Dasar

### Membuat Tugas Terjadwal

Pada daftar Workflow saat membuat Workflow, pilih tipe "Tugas Terjadwal":

![Buat tugas terjadwal](https://static-docs.nocobase.com/e09b6c9065167875b2ca7de5f5a799a7.png)

### Mode Waktu Kustom

Untuk mode reguler, pertama Anda perlu mengonfigurasi waktu mulai sebagai titik waktu apa pun (presisi hingga detik). Waktu mulai dapat dikonfigurasi sebagai waktu di masa depan, atau juga waktu di masa lalu. Ketika dikonfigurasi sebagai waktu di masa lalu, akan memeriksa apakah sudah waktunya berdasarkan kondisi pengulangan yang dikonfigurasi. Jika tidak ada kondisi pengulangan yang dikonfigurasi, jika waktu mulai adalah waktu masa lalu, Workflow tidak akan dipicu lagi.

Aturan pengulangan memiliki dua cara konfigurasi:

- Berdasarkan Interval Waktu: pemicuan setiap interval waktu tetap setelah waktu mulai, seperti setiap satu jam, setiap 30 menit, dll.
- Mode Lanjutan: yaitu berdasarkan aturan cron, dapat dikonfigurasi sebagai siklus mencapai tanggal waktu aturan tetap.

Setelah aturan pengulangan dikonfigurasi, Anda juga dapat mengonfigurasi kondisi akhir, dapat melalui titik waktu tetap untuk mengakhiri, atau juga melalui pembatasan jumlah eksekusi.

### Mode Field Waktu Tabel Data

Menggunakan field waktu tabel data untuk menentukan waktu mulai adalah mode pemicuan yang menggabungkan tugas terjadwal biasa dan field waktu tabel data. Menggunakan mode ini dapat menyederhanakan Node dalam beberapa alur tertentu, dari segi konfigurasi juga lebih intuitif. Misalnya, perlu mengubah pesanan yang belum dibayar dalam waktu yang lama menjadi status dibatalkan, Anda hanya perlu mengonfigurasi tugas terjadwal mode field waktu tabel data, pilih waktu mulai sebagai 30 menit setelah pesanan dibuat,

## Tips Terkait

### Tugas Terjadwal dalam Status Belum Dimulai atau Berhenti

Jika kondisi waktu yang dikonfigurasi terpenuhi, tetapi seluruh layanan aplikasi NocoBase berada dalam status belum dimulai atau berhenti, maka tugas terjadwal yang seharusnya dipicu pada titik waktu tersebut akan terlewat, dan setelah layanan dimulai ulang, tugas yang sudah terlewat tidak akan dipicu lagi. Jadi saat menggunakan, Anda mungkin perlu mempertimbangkan penanganan situasi yang sesuai, atau langkah cadangan.

### Jumlah Pengulangan

Ketika dikonfigurasi dengan jumlah pengulangan dalam kondisi akhir, yang dihitung adalah total jumlah eksekusi semua versi Workflow yang sama. Misalnya tugas terjadwal yang sudah dieksekusi 10 kali pada versi 1, jika jumlah pengulangan juga diatur ke 10, Workflow tersebut tidak akan dipicu lagi, bahkan jika disalin ke versi baru, juga tidak akan dipicu, kecuali jumlah pengulangan diubah menjadi angka lebih besar dari 10. Tetapi jika disalin sebagai Workflow baru, jumlah eksekusi yang sudah dilakukan akan dihitung ulang dari 0. Tanpa mengubah konfigurasi terkait, Workflow baru akan dapat dipicu 10 kali lagi.

### Perbedaan Antara Interval Waktu dan Mode Lanjutan dalam Aturan Pengulangan

Interval waktu dalam aturan pengulangan adalah relatif terhadap titik waktu pemicuan terakhir (waktu mulai), sedangkan mode lanjutan adalah pemicuan pada titik waktu tetap. Misalnya, dikonfigurasi pemicuan setiap 30 menit, jika pemicuan terakhir adalah 2021-09-01 12:01:23, maka waktu pemicuan berikutnya adalah 2021-09-01 12:31:23. Sedangkan mode lanjutan yaitu mode cron, aturan yang dikonfigurasi semuanya adalah pemicuan pada titik waktu tetap, misalnya, dapat dikonfigurasi pemicuan pada menit 01 dan 31 setiap jam.

## Contoh

Misalkan setiap menit memeriksa pesanan yang dibuat lebih dari 30 menit yang lalu dan belum selesai dibayar, dan secara otomatis mengubahnya ke status dibatalkan. Implementasikan masing-masing menggunakan dua mode.

### Mode Waktu Kustom

Buat sebuah Workflow berbasis tugas terjadwal, pada konfigurasi Trigger pilih mode "Waktu Kustom", waktu mulai pilih titik waktu apa pun yang tidak lebih lambat dari waktu saat ini, aturan pengulangan pilih "Setiap Menit", kondisi akhir kosongkan:

![Tugas terjadwal_konfigurasi Trigger_mode waktu kustom](https://static-docs.nocobase.com/71131e3f2034263f883062389b356cbd.png)

Kemudian konfigurasikan Node lainnya berdasarkan logika alur, hitung waktu 30 menit yang lalu, dan ubah pesanan yang dibuat sebelumnya dan belum dibayar menjadi status dibatalkan:

![Tugas terjadwal_konfigurasi Trigger_mode waktu kustom](https://static-docs.nocobase.com/188bc5287ffa1fb24a4e7baa1de6eb29.png)

Setelah Workflow diaktifkan, mulai dari waktu mulai akan dipicu setiap menit, menghitung waktu 30 menit yang lalu, untuk memperbarui status pesanan yang dibuat sebelum titik waktu tersebut menjadi dibatalkan.

### Mode Field Waktu Tabel Data

Buat sebuah Workflow berbasis tugas terjadwal, pada konfigurasi Trigger pilih mode "Field Waktu Tabel Data", tabel data pilih tabel "Pesanan", waktu mulai pilih 30 menit setelah waktu pembuatan pesanan, aturan pengulangan pilih "Tidak Berulang":

![Tugas terjadwal_konfigurasi Trigger_mode field waktu tabel data_Trigger](https://static-docs.nocobase.com/d40d5aef57f42799d31cc5882dd94246.png)

Kemudian konfigurasikan Node lainnya berdasarkan logika alur, perbarui pesanan dengan ID yang sama dengan ID data pemicu dan statusnya "Belum Dibayar" menjadi status dibatalkan:

![Tugas terjadwal_konfigurasi Trigger_mode field waktu tabel data_Node Perbarui](https://static-docs.nocobase.com/491dde9df8f773f5b14a4fd8ceac9d3e.png)

Berbeda dengan mode waktu kustom, di sini tidak perlu menghitung waktu 30 menit yang lalu, karena konteks data pemicu Workflow sudah mengandung baris data yang sesuai dengan kondisi waktu, jadi dapat langsung memperbarui status pesanan yang sesuai.
