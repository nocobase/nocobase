---
title: "Komponen Standar dan Ekstensi"
description: "Fondasi komponen AI Portal yang berbasis shadcn/ui, serta mekanisme ekstensi yang langsung aktif setelah dipasang — satu direktori untuk satu ekstensi, ditemukan dan dipasang secara otomatis."
keywords: "AI Portal,shadcn/ui,komponen,ekstensi,AppExtension,Registry,Tailwind CSS"
---

# Komponen Standar dan Ekstensi

:::tip Prasyarat

Sebelum membaca halaman ini, harap pastikan Anda telah menjalankan Portal pertama Anda sesuai [Mulai Cepat AI Portal](./index.md).

:::

UI Portal terdiri dari dua bagian: `src/components/ui` menyediakan komponen dasar, dan `src/extensions` menampung modul bisnis. Halaman ini membahas cara memakai kedua bagian tersebut.

## Fondasi Komponen

Di bawah `src/components/ui` ada lebih dari 60 komponen [shadcn/ui](https://ui.shadcn.com/) — tombol, formulir, dialog, drawer, tabel, grafik, dan komponen umum lainnya tersedia. Gaya visualnya dikonfigurasi di `components.json`, dan ikonnya memakai lucide.

Berbeda dengan memasukkan sebuah pustaka komponen, **source komponen-komponen ini milik proyek Anda**. Semuanya berada di repositori Anda, bebas diubah, dan pembaruan upstream tidak akan menimpanya secara otomatis.

Karena itu, saat mengustomisasi disarankan memakai komposisi alih-alih langsung mengubahnya:

```tsx
// Direkomendasikan: bungkus satu lapis, agar komponen dasarnya tetap dapat diganti
import { Button } from "@/components/ui/button";

export function SubmitButton(props) {
  return <Button variant="default" size="lg" {...props} />;
}
```

Mengubah `src/components/ui/button.tsx` secara langsung juga bisa mencapai tujuan yang sama, tetapi nantinya akan merepotkan saat ingin menyinkronkan perbaikan bug dari upstream. Ketika komponen dasar memang perlu diubah, bandingkan dulu dengan versi upstream lalu gabungkan secara selektif, jangan menimpa seluruh perubahan lokal Anda.

:::warning Perhatian

Jangan memasukkan Ant Design, atau komponen klien NocoBase yang berbasis Ant Design, ke dalam Portal. Sistem styling Portal adalah Tailwind CSS ditambah shadcn/ui, dan mencampurnya akan menyebabkan konflik gaya. Konvensi ini sudah tertulis di `AGENTS.md` template.

:::

## Mekanisme Ekstensi

Fungsi bisnis ditulis sebagai ekstensi dan diletakkan di bawah `src/extensions/`, satu direktori untuk satu modul fungsional:

```text
src/extensions/
├── nocobase-acl/               Komponen Permission
├── nocobase-ai/                Kemampuan percakapan AI
├── nocobase-route-surfaces/    Tiga wadah route: halaman, drawer, dan modal
└── nocobase-users-example/     Contoh manajemen pengguna
```

Di setiap direktori ada satu `extension.tsx` dengan default export berupa `AppExtension`. Template akan memindai dan memuatnya secara otomatis — **cukup letakkan di direktorinya dan langsung aktif, tanpa perlu mengubah kode registrasi apa pun**.

## AppExtension

Sebuah ekstensi dapat menyediakan hal-hal berikut:

| Field | Deskripsi |
| --- | --- |
| `id` | Identifier ekstensi, wajib diisi |
| `priority` | Urutan pemuatan, angka lebih kecil lebih dulu, default 100 |
| `resources` | Definisi resource Refine, menentukan menu navigasi dan pemetaan route |
| `routes` | Elemen route, akan dipasang di bawah pohon route yang sudah login |
| `Provider` | Provider yang membungkus seluruh aplikasi |
| `AuthRuntimeProvider` | Provider runtime autentikasi, aktif bahkan sebelum login |
| `UserMenuItems` | Menambahkan entri ke menu pengguna |
| `authAdapters` | Adapter metode autentikasi |
| `dev` | Resource dan route yang hanya berlaku dalam mode pengembangan |

Sebuah ekstensi paling minimal tampak seperti ini:

```tsx
import type { AppExtension } from "@/app/extension";
import { Route } from "react-router";
import { Package } from "lucide-react";
import { ProductList } from "./list";

const productsExtension: AppExtension = {
  id: "products",
  resources: [
    {
      name: "products",
      list: "/products",
      meta: {
        label: "Products",
        icon: <Package />,
        acl: { type: "collection" }, // Ikut dalam penilaian Permission tabel data NocoBase
      },
    },
  ],
  routes: <Route path="/products" element={<ProductList />} />,
};

export default productsExtension;
```

## Ekstensi Bawaan

Template ini membawa empat ekstensi yang dapat langsung dipakai, sekaligus menjadi acuan terbaik saat menulis kode baru:

**`nocobase-users-example`** — Modul CRUD lengkap berbasis tabel `users` standar NocoBase, dengan tampilan daftar, buat, edit, dan detail. Saat membuat halaman baru, minta AI menulisnya dengan mengacu pada ekstensi ini.

**`nocobase-acl`** — Komponen Permission, mulai dari `CanAccess`, `AclPage`, `AclRegion`, `AclField`, hingga `RoleSwitcher` semuanya ada di sini.

**`nocobase-route-surfaces`** — Tiga wadah route: halaman penuh, drawer, dan modal. Konten yang sama dapat dibuka sebagai halaman mandiri, dapat pula muncul sebagai drawer di dalam halaman daftar, dengan status route yang tersinkronisasi dengan benar.

**`nocobase-ai`** — Menyambungkan kemampuan percakapan AI NocoBase ke frontend, termasuk jendela percakapan, streaming, riwayat percakapan, dan konteks halaman. Dengan ini Anda dapat membuat asisten AI di dalam Portal Anda sendiri.

## Aturan Impor

Saat menulis ekstensi ada dua konvensi path:

- Gunakan alias `@/` untuk merujuk hal-hal dari aplikasi host, misalnya `@/components/ui/button`
- Rujukan relatif di dalam ekstensi jangan sampai keluar dari direktorinya sendiri

Dengan begitu setiap ekstensi bersifat self-contained, sehingga satu direktori utuh dapat disalin ke Portal lain dan tetap dapat dipakai.

## Ekstensi Resmi yang Dapat Dipasang

<!-- Registry 的对外地址和可安装项清单待定，确定后补充这一节：怎么安装、有哪些可选扩展、安装后源码落在哪里 -->

Selain empat ekstensi bawaan tadi, NocoBase juga akan menyediakan sekumpulan ekstensi resmi yang dapat dipasang sesuai kebutuhan. Setelah dipasang, sourcenya akan berada di bawah `src/extensions/` dan menjadi kode milik proyek Anda sendiri seperti halnya ekstensi bawaan, sehingga dapat diubah dan di-commit bersama aplikasi.

## Lokalisasi

Teksnya diletakkan di `src/locales/`, dan template ini sudah membawa bahasa Inggris dan Mandarin. Ekstensi juga dapat memiliki paket bahasanya sendiri, cukup buat direktori `locales/` di dalam direktori ekstensi lalu impor dari `extension.tsx`.

## Tautan Terkait

- [Mulai Cepat AI Portal](./index.md) — Jalankan entry frontend pertama yang ditulis AI
- [Struktur Proyek dan Tech Stack](./project-structure.md) — Konvensi direktori lengkap dan perintah yang sering dipakai
- [Membangun Bersama AI Agent](./agent-workflow.md) — Minta AI menulis modul baru dengan mengacu pada ekstensi bawaan
