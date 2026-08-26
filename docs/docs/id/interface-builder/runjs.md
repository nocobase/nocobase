---
title: "RunJS Tulis dan Jalankan JavaScript Online"
description: "RunJS dalam interface builder memungkinkan Anda menulis dan menjalankan JavaScript secara online, mendukung JS Block, JS Field, JS Action, dan ekstensi logika kustom lainnya."
keywords: "RunJS, tulis JS online, JavaScript, JS Block, JS Field, JS Action, interface builder, NocoBase"
---

# Tulis & Jalankan JS Online

Di NocoBase, **RunJS** menyediakan cara ekstensi yang ringan, cocok untuk skenario **eksperimen cepat, pemrosesan logika sementara**. Tanpa perlu membuat Plugin atau memodifikasi source code, Anda dapat mewujudkan kustomisasi personal antarmuka atau interaksi melalui JavaScript.

Melalui ini, Anda dapat memasukkan kode JS langsung di interface designer untuk mengimplementasikan:

- Render konten kustom (Field, Block, kolom, item, dll.)
- Logika interaksi kustom (klik tombol, linkage event)
- Menggabungkan data konteks untuk implementasi perilaku dinamis

## Skenario yang Didukung

### JS Block

Render Block kustom melalui JS, dapat mengontrol struktur dan style Block sepenuhnya.
Cocok untuk skenario fleksibel tinggi seperti menampilkan komponen kustom, chart statistik, konten pihak ketiga, dll.

![20250916105031](https://static-docs.nocobase.com/20250916105031.png)

Dokumentasi: [JS Block](/interface-builder/blocks/other-blocks/js-block)

### JS Action

Logika klik tombol Action kustom melalui JS, dapat menjalankan operasi frontend atau request API apa pun.
Misalnya: menghitung nilai secara dinamis, submit data kustom, memicu Popup, dll.

![20250916105123](https://static-docs.nocobase.com/20250916105123.png)

Dokumentasi: [JS Action](/interface-builder/actions/types/js-action)

### JS Field

Logika render Field kustom melalui JS. Dapat menampilkan style, konten, atau status berbeda secara dinamis berdasarkan nilai Field.

![20250916105354](https://static-docs.nocobase.com/20250916105354.png)

Dokumentasi: [JS Field](/interface-builder/fields/specific/js-field)

### JS Item

Render item independen melalui JS, tidak terikat dengan Field tertentu. Sering digunakan untuk menampilkan blok informasi kustom.

![20250916104848](https://static-docs.nocobase.com/20250916104848.png)

Dokumentasi: [JS Item](/interface-builder/fields/specific/js-item)

### JS Table Column

Render kolom Table kustom melalui JS.
Dapat mengimplementasikan logika tampilan sel yang kompleks, seperti progress bar, tag status, dll.

![20250916105443](https://static-docs.nocobase.com/20250916105443.png)

Dokumentasi: [JS Table Column](/interface-builder/fields/specific/js-column)

### Linkage Rules (Aturan Linkage)

Mengontrol logika linkage antar Field di Form atau Page melalui JS.
Misalnya: saat satu Field berubah, modifikasi nilai atau visibilitas Field lain secara dinamis.

![20251029114532](https://static-docs.nocobase.com/20251029114532.png)

Dokumentasi: [Aturan Linkage](/interface-builder/linkage-rule)

### Eventflow (Event Flow)

Memicu kondisi dan logika eksekusi Event Flow kustom melalui JS, untuk membangun rantai interaksi frontend yang lebih kompleks.

![](https://static-docs.nocobase.com/20251031092755.png)

Dokumentasi: [Event Flow](/interface-builder/event-flow)
