---
pkg: "@nocobase/plugin-ai"
title: "Karyawan AI Mengintegrasikan MCP"
description: "Mengintegrasikan layanan MCP untuk Karyawan AI, menguji ketersediaan layanan MCP, dan mengelola Permission pemanggilan tools MCP."
keywords: "Skills Karyawan AI,MCP,Model Context Protocol,tools"
---

# Integrasi MCP

Karyawan AI dapat mengintegrasikan layanan MCP yang mengikuti protokol Model Context Protocol (MCP), setelah mengintegrasikan layanan MCP, Karyawan AI dapat menggunakan tools yang disediakan layanan MCP untuk menyelesaikan tugas.


## Konfigurasi MCP

Masuk ke modul konfigurasi MCP, di sini dapat menambahkan layanan MCP baru, memelihara layanan MCP yang sudah diintegrasikan.

![20260323095943](https://static-docs.nocobase.com/20260323095943.png)


## Menambahkan Layanan MCP

Klik tombol `Tambah` di pojok kanan atas daftar layanan MCP, masukkan informasi integrasi layanan MCP di popup untuk menyelesaikan penambahan layanan MCP.

Mendukung dua protokol transport layanan MCP: Stdio dan HTTP (Streamable / SSE).

![20260323100904](https://static-docs.nocobase.com/20260323100904.png)

Saat menambahkan layanan MCP, perlu memasukkan `nama`, `judul`, `deskripsi`. `nama` adalah identifier unik layanan MCP; `judul` adalah nama yang ditampilkan layanan MCP di sistem; `deskripsi` opsional, digunakan untuk mendeskripsikan secara singkat fungsi yang disediakan layanan MCP.

![20260323101635](https://static-docs.nocobase.com/20260323101635.png)

### Stdio

Saat menambahkan layanan MCP yang mendukung protokol transport stdio, perlu memasukkan `perintah` dan `parameter perintah` untuk menjalankan layanan MCP, sesuai kebutuhan dapat menambahkan `variabel lingkungan` yang dibutuhkan untuk menjalankan perintah layanan MCP.

:::warning
Perintah untuk menjalankan layanan MCP seperti node, npx, uvx, go, dll memerlukan dukungan lingkungan server tempat NocoBase di-deploy untuk dapat digunakan.

Image Docker NocoBase hanya mendukung perintah lingkungan Nodejs seperti node, npx, dll.
:::

![20260323103511](https://static-docs.nocobase.com/20260323103511.png)

### HTTP

Saat menambahkan layanan MCP yang mendukung protokol transport http, perlu memasukkan alamat `URL` layanan MCP, sesuai kebutuhan dapat menambahkan `request header`.

Protokol transport http mendukung dua cara transport: Streamable dan SSE, Streamable adalah cara transport baru yang ditambahkan dalam standar MCP, cara transport SSE akan segera dihapus, harap pilih cara transport spesifik berdasarkan dokumentasi layanan MCP yang digunakan.

![20260323103906](https://static-docs.nocobase.com/20260323103906.png)

### Test Ketersediaan

Saat menambahkan dan mengedit layanan MCP, setelah memasukkan informasi konfigurasi MCP dapat melakukan test ketersediaan terhadap layanan MCP, saat informasi konfigurasi MCP lengkap dan benar serta layanan MCP tersedia, akan mengembalikan informasi test ketersediaan layanan MCP berhasil.

![20260323105608](https://static-docs.nocobase.com/20260323105608.png)

## Melihat Layanan MCP

Klik tombol `Lihat` pada daftar layanan MCP untuk melihat daftar tools yang disediakan layanan MCP.

Pada daftar tools layanan MCP juga dapat mengatur konfigurasi Permission penggunaan tool tersebut oleh Karyawan AI, saat Permission tool diatur sebagai `Ask`, akan tanya apakah mengizinkan pemanggilan sebelum dipanggil; saat diatur sebagai `Allow`, akan langsung memanggil tool saat dibutuhkan.

![20260323111106](https://static-docs.nocobase.com/20260323111106.png)

## Menggunakan Layanan MCP

Setelah mengaktifkan layanan MCP yang akan digunakan di modul konfigurasi MCP, saat berdialog dengan Karyawan AI, Karyawan AI akan secara otomatis menggunakan tools yang disediakan layanan MCP untuk menyelesaikan tugas.

![20260323110535](https://static-docs.nocobase.com/20260323110535.png)
