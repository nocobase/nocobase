---
pkg: '@nocobase/plugin-ai'
title: 'Block AI Chat box'
description: 'Panduan untuk administrator dan pembuat halaman NocoBase tentang cara menambahkan block AI Chat box, mengatur kemampuan percakapan, Work context, riwayat percakapan, dan Actions.'
keywords: 'AI Chat box,Karyawan AI,block halaman,Work context,Scope,Actions,NocoBase'
---

# Block AI Chat box

Di NocoBase, **AI Chat box** adalah block percakapan AI yang dapat ditambahkan langsung ke halaman. Block ini dapat ditempatkan pada halaman bisnis sebagai akses tetap ke asisten AI khusus untuk halaman tersebut.

Setiap block AI Chat box memiliki percakapan aktif dan status input sendiri. Pembuat halaman juga dapat membatasi Karyawan AI, model, upload file, pencarian web, dan konteks kerja yang tersedia agar sesuai dengan skenario bisnis.

:::tip Sebelum memulai

Pertama [konfigurasikan LLM Service](../features/llm-service.md) dan [aktifkan setidaknya satu Karyawan AI](../features/enable-ai-employee.md).

:::

## Menambahkan block AI Chat box

1. Buka halaman yang ingin dikonfigurasi.
2. Klik `UI Editor` di sudut kanan atas untuk masuk ke mode pengeditan halaman.
3. Klik `Add block`.
4. Pada `Other blocks`, pilih `AI chat box`.

![Memilih AI chat box pada menu Add block](https://static-docs.nocobase.com/ai-employees/block/ai-chat-box/2026-07-22/add-ai-chat-box-block-3.png)

## Struktur block

![Block AI Chat box](https://static-docs.nocobase.com/ai-employees/block/ai-chat-box/2026-07-22/ai-chat-box-overview-2.png)

AI Chat box terdiri dari tiga area dari atas ke bawah:

- **Area tindakan atas** — akses daftar percakapan, Actions, tindakan khusus, dan percakapan baru; tombol pesan juga muncul saat area pesan disembunyikan
- **Area pesan** — menampilkan pesan dalam draf atau percakapan aktif
- **Area pengiriman** — kotak input, pemilihan konteks, upload file, pencarian web, pemilihan Karyawan AI, pemilihan model, tombol kirim, dan disclaimer

### Menambahkan konten ke body block

Dalam mode pengeditan halaman, klik `Add block` di dalam AI Chat box untuk menambahkan salah satu block berikut di atas area chat:

- JS block
- Iframe
- Markdown

Block tersebut dapat digunakan untuk menampilkan petunjuk, halaman eksternal, atau informasi pendukung. Menu internal hanya menyediakan tiga jenis block ini dan tidak mengizinkan AI Chat box lain ditambahkan di dalamnya.

## Mengonfigurasi AI Chat box

Arahkan pointer ke block dan buka menu pengaturannya. Klik `Edit chat box` untuk mengatur cakupan percakapan, pesan default, Work context, Karyawan AI, dan model.

![Dialog pengaturan Edit chat box](https://static-docs.nocobase.com/ai-employees/block/ai-chat-box/2026-07-22/edit-chat-box-settings-2.png)

### Pengaturan Edit chat box

| Pengaturan | Deskripsi |
| --- | --- |
| `Scope` | Mengatur AI Chat box mana yang berbagi daftar percakapan. Block baru menggunakan UID block sendiri secara default agar percakapan tetap terpisah. |
| `Background` | Menambahkan system prompt setelah definisi Karyawan AI untuk memberikan peran, tujuan, atau persyaratan jawaban pada halaman aktif. |
| `Default user message` | Mengisi area pengiriman dengan pesan pengguna default saat percakapan baru dimulai. |
| `Work context` | Memilih block halaman yang dimasukkan secara default ke draf baru. |
| `AI employees` | Membatasi Karyawan AI bisnis yang dapat dipilih pada block ini. Biarkan kosong untuk mengizinkan semua Karyawan AI bisnis yang tersedia. |
| `Models` | Membatasi model yang dapat dipilih pada block ini. Biarkan kosong untuk mengizinkan semua model yang tersedia. |

### Pengaturan block lainnya

| Pengaturan | Deskripsi |
| --- | --- |
| `Show messages` | Mengatur apakah area pesan ditampilkan langsung di dalam block. Saat dinonaktifkan, gunakan tombol pesan di bagian atas untuk membuka panel kanan. |
| `Sender placeholder` | Mengubah teks placeholder pada area pengiriman. |
| `Enable add context` | Menampilkan atau menyembunyikan akses pemilihan konteks pada area pengiriman. |
| `Enable upload files` | Menampilkan atau menyembunyikan akses upload file. Saat dinonaktifkan, menempelkan file juga tidak memulai upload. |
| `Enable web search` | Menampilkan atau menyembunyikan switch pencarian web. Menonaktifkannya juga mematikan pencarian web untuk draf aktif. |
| `Enable employee select` | Menampilkan atau menyembunyikan pemilih Karyawan AI. |
| `Enable model select` | Menampilkan atau menyembunyikan pemilih model. |
| `Show disclaimer` | Menampilkan atau menyembunyikan disclaimer AI di bawah area pengiriman. |

## Mengonfigurasi Work context

Pada `Work context` di dalam `Edit chat box`, klik tombol tambah konteks, pilih `Pick block`, lalu pilih block halaman yang ingin diberikan kepada AI. Setelah disimpan, block yang dipilih menjadi konteks kerja default untuk percakapan baru dan dapat dihapus dari area pengiriman sebelum pesan dikirim.

## Menyembunyikan pesan dan menggunakan panel kanan

Setelah `Show messages` dinonaktifkan, body block hanya menampilkan area pengiriman. Tombol pesan muncul di bagian atas; klik tombol tersebut untuk membuka panel pesan dari kanan.

![Panel pesan kanan saat area pesan disembunyikan](https://static-docs.nocobase.com/ai-employees/block/ai-chat-box/2026-07-22/messages-side-panel-2.png)

Saat panel terbuka, bagian block lainnya tertutup overlay. Klik overlay atau klik lagi tombol pesan untuk menutup panel.

Layout ini cocok saat AI Chat box digunakan sebagai akses input ringan pada halaman: biasanya hanya area pengiriman yang ditampilkan, dan panel dibuka saat perlu melihat pesan.

## Mengelola riwayat percakapan

Klik tombol daftar percakapan di sudut kiri atas block untuk melihat riwayat pada Scope aktif.

Perhatikan aturan berikut:

- Beberapa AI Chat box dengan Scope yang sama dapat melihat daftar percakapan yang sama
- Setiap block tetap memiliki percakapan aktif, draf area pengiriman, Karyawan AI, model, lampiran, dan status konteks sendiri
- Chatbox floating global tidak memfilter berdasarkan Scope block, sehingga percakapan yang memiliki Scope tetap ditampilkan
- Setelah Scope dikosongkan, block tidak lagi memfilter daftar berdasarkan Scope dan menampilkan percakapan tanpa Scope serta percakapan yang menggunakan Scope lain

Biasanya, mempertahankan Scope yang dibuat untuk block baru sudah cukup untuk memisahkan riwayat setiap asisten halaman. Gunakan Scope yang sama hanya jika beberapa block perlu berbagi daftar percakapan.

## Menambahkan Actions

Dalam mode pengeditan halaman, klik `Actions` di bagian atas block untuk menambahkan salah satu tindakan berikut:

- JS Action
- AI employee

Setelah menambahkan AI employee, Anda dapat mengatur shortcut task untuk karyawan tersebut.

Pengaturan `Chat box uid` pada shortcut task menentukan AI Chat box tempat task dijalankan. AI employee yang ditambahkan langsung di dalam AI Chat box secara default menunjuk ke UID block aktif.

Jika AI Chat box yang ditentukan tidak terpasang, NocoBase memberi tahu bahwa block target tidak ditemukan dan tidak beralih ke chatbox floating global. Lihat [Shortcut task Karyawan AI](../features/task.md) untuk konfigurasi lebih lanjut.

## Mengonfigurasi asisten khusus halaman

Langkah berikut membuat asisten AI ringan untuk sebuah halaman:

1. Tambahkan block AI Chat box dan pindahkan ke posisi yang sesuai pada halaman.
2. Masukkan Background khusus halaman di `Edit chat box`.
3. Pilih satu atau beberapa Work contexts.
4. Batasi karyawan dan model yang tersedia di `AI employees` dan `Models`.
5. Keluar dari mode pengeditan, masukkan pertanyaan, lalu kirim.

## Catatan

- Block AI Chat box dan chatbox floating global di sudut kanan bawah merupakan akses yang terpisah; percakapan aktif dan status input tidak disinkronkan secara otomatis
- Di dalam AI Chat box, `Add block` hanya dapat menambahkan JS block, Iframe, dan Markdown
- Mengubah Scope memengaruhi cakupan kueri daftar percakapan dan tidak menyalin percakapan atau draf yang sedang terbuka pada block lain
