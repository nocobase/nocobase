---
title: "Izin Action"
description: "Izin Action: mengkonfigurasi visibilitas dan izin eksekusi Action, mendukung kontrol berdasarkan peran dan cakupan data."
keywords: "izin Action, permission, izin peran, visibilitas, interface builder, NocoBase"
---

# Izin Action

## Pengantar

Di NocoBase 2.0, izin Action saat ini terutama dikontrol oleh izin resource Collection:

- **Izin Resource Collection**: digunakan untuk mengontrol secara seragam izin Action dasar berbagai peran terhadap Collection seperti Create, View, Update, Delete. Izin ini berlaku untuk seluruh Collection di bawah data source, memastikan peran memiliki izin Action yang konsisten terhadap Collection tersebut di Block yang berbeda dalam Page atau Popup yang berbeda.
<!-- - **Izin Action Independen**: digunakan untuk kontrol detail Action yang dapat dilihat oleh peran yang berbeda, cocok untuk manajemen izin Action tertentu, seperti trigger workflow, custom request, link eksternal, dll. Izin ini cocok untuk kontrol izin level Action, memungkinkan peran yang berbeda untuk menjalankan Action tertentu, tanpa mempengaruhi konfigurasi izin seluruh Collection. -->

### Izin Resource Collection

Dalam sistem izin NocoBase, izin Action Collection pada dasarnya dibagi berdasarkan dimensi CRUD untuk memastikan konsistensi dan standardisasi manajemen izin. Misalnya:

- **Izin Tambah (Create)**: Mengontrol semua Action terkait tambah pada Collection ini, termasuk Action tambah baru, Action duplikat, dll. Selama peran memiliki izin tambah pada Collection ini, maka Action tambah baru dan Action duplikat pada Collection ini akan terlihat di semua Page atau Popup.
- **Izin Hapus (Delete)**: Mengontrol Action hapus pada Collection ini, baik Action hapus batch pada Block Table maupun Action hapus record tunggal pada Block Detail, izinnya tetap konsisten.
- **Izin Update (Update)**: Mengontrol Action tipe update pada Collection ini, seperti Action edit, Action update record.
- **Izin Lihat (View)**: Mengontrol visibilitas data Collection. Hanya ketika peran memiliki izin lihat pada Collection ini, Block data terkait (Table, List, Detail, dll.) akan terlihat.

Cara manajemen izin umum ini cocok untuk kontrol izin data standar, memastikan di `Page, Popup, Block yang berbeda`, terhadap `Action yang sama` pada `Collection yang sama` memiliki aturan izin yang `konsisten`, memiliki keseragaman dan kemudahan pemeliharaan.

#### Izin Global

Izin Action global berlaku untuk semua Collection di bawah data source ini, dibagi berdasarkan tipe resource sebagai berikut

![20250306204756](https://static-docs.nocobase.com/20250306204756.png)

#### Izin Action Collection Tertentu

Izin Action Collection tertentu lebih tinggi dari izin umum data source, lebih lanjut memperinci izin Action, dapat melakukan konfigurasi izin kustom untuk akses resource Collection tertentu. Izin ini dibagi menjadi dua aspek:

1. Izin Action: Izin Action meliputi Action tambah, lihat, edit, hapus, ekspor, dan impor. Izin ini dikonfigurasi berdasarkan dimensi cakupan data:

   - Semua data: Memungkinkan pengguna untuk menjalankan Action pada semua record di Collection.
   - Data sendiri: Membatasi pengguna untuk hanya menjalankan Action pada record data yang dibuat sendiri.

2. Izin Field: Izin Field memungkinkan konfigurasi izin untuk setiap Field dalam Action yang berbeda. Misalnya, Field tertentu dapat dikonfigurasi hanya untuk dilihat tanpa diizinkan untuk diedit.

![20250306205042](https://static-docs.nocobase.com/20250306205042.png)

<!-- ### Izin Action Independen

> **Perhatian**: Fitur ini **didukung mulai dari versi v1.6.0-beta.13**

Berbeda dengan izin Action terpadu, izin Action independen hanya mengontrol Action itu sendiri, memungkinkan Action yang sama memiliki konfigurasi izin yang berbeda di lokasi yang berbeda.

Cara izin ini cocok untuk Action personal, misalnya:

Action trigger workflow mungkin perlu memanggil workflow yang berbeda di Page atau Block yang berbeda, sehingga memerlukan kontrol izin independen.
Action kustom di lokasi yang berbeda menjalankan logika bisnis tertentu, cocok untuk manajemen izin terpisah.

Saat ini mendukung konfigurasi izin independen untuk Action berikut

- Popup (mengontrol visibilitas dan izin Action Popup)
- Link (membatasi apakah peran dapat mengakses link eksternal atau internal)
- Trigger Workflow (memanggil workflow yang berbeda untuk Page yang berbeda)
- Action di Action Panel (misalnya scan, Action Popup, trigger workflow, link eksternal)
- Custom Request (mengirim request ke pihak ketiga)

Melalui konfigurasi izin Action independen, izin Action peran yang berbeda dapat dikelola dengan lebih halus, membuat kontrol izin lebih fleksibel.

![20250306215749](https://static-docs.nocobase.com/20250306215749.png)

Jika tidak ada peran yang ditetapkan, secara default semua peran terlihat.

![20250306215854](https://static-docs.nocobase.com/20250306215854.png) -->

## Dokumentasi Terkait

[Konfigurasi Izin]
<!-- (/users-and-permissions) -->
