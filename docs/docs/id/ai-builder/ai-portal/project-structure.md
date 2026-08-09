---
title: "Struktur Proyek dan Tech Stack"
description: "Tech stack, konvensi direktori, environment variable, dan perintah yang sering dipakai pada template AI Portal, membantu Anda menilai apakah kode yang ditulis AI sudah diletakkan di tempat yang tepat."
keywords: "AI Portal,struktur proyek,tech stack,React,Vite,Refine,Tailwind CSS,shadcn/ui,environment variable"
---

# Struktur Proyek dan Tech Stack

:::tip Prasyarat

Sebelum membaca halaman ini, harap pastikan Anda telah menjalankan Portal pertama Anda sesuai [Mulai Cepat AI Portal](./index.md).

:::

Sebagian besar pengembangan sehari-hari cukup diserahkan kepada AI. Meski begitu, dengan memahami struktur template-nya Anda dapat menilai apakah kode yang ditulis AI sudah diletakkan di tempat yang tepat, dan masalah pun lebih mudah dilacak saat muncul.

## Tech Stack

Template Portal berbasis `@nocobase/portal-template-default`, dengan source di [nocobase/portal-template-default](https://github.com/nocobase/portal-template-default).

| Teknologi | Kegunaan |
| --- | --- |
| React 19 + TypeScript | Framework frontend |
| Vite | Server pengembangan dan tool build |
| [Refine](https://refine.dev/docs/) | Framework lapisan data, menangani resource, routing, formulir, dan Permission |
| Tailwind CSS 4 | Solusi styling |
| [shadcn/ui](https://ui.shadcn.com/) | Fondasi komponen, sourcenya milik proyek |
| lucide | Pustaka ikon |
| pnpm | Package manager |

Kombinasi ini adalah tech stack frontend yang paling dikenal AI saat ini, sehingga tingkat akurasi tulisannya lebih tinggi.

Untuk saat ini Portal adalah proyek frontend murni, dengan logika bisnis diselesaikan melalui API NocoBase, komponen standar, dan sebagainya. Dukungan agar AI Agent juga dapat menulis kode backend Portal akan menyusul.

## Struktur Direktori

```text
src/
├── app/            Routing dan pemuatan ekstensi
├── pages/          Halaman login, registrasi, lupa password, dan lainnya
├── components/     Komponen
│   ├── ui/         Fondasi komponen shadcn/ui
│   ├── app-shell/  Layout, navigasi, status loading
│   ├── auth/       Komponen terkait autentikasi
│   └── ...
├── extensions/     Ekstensi, langsung aktif setelah dipasang
├── lib/            Pembungkus klien NocoBase dan logika ACL
├── providers/      Berbagai provider Refine
├── hooks/          Hook kustom
└── locales/        Teks terlokalisasi
```

Beberapa lokasi penting:

- **`src/app/routes.tsx`** — Struktur routing. Route yang sudah login dan yang belum login terpisah, dan route dari ekstensi otomatis terpasang di sini
- **`src/app/extensions.tsx`** — Logika pemuatan ekstensi, memakai `import.meta.glob` untuk memindai `src/extensions/*/extension.tsx`
- **`src/providers/data.ts`** — Data provider Refine, yang menerjemahkan sintaks query Refine menjadi parameter API NocoBase
- **`src/lib/nocobase/client.ts`** — `NocoBaseClient`, pembungkus tingkat rendah di balik semua request
- **`src/components/ui/`** — Lebih dari 60 komponen shadcn/ui, tinggal pakai

Halaman bisnis biasanya ditulis di bawah `src/extensions/`, satu direktori untuk satu modul fungsional. Selengkapnya lihat [Komponen Standar dan Ekstensi](./components.md).

## File Penting

| File | Fungsi |
| --- | --- |
| `AGENTS.md` | Konvensi pengembangan untuk AI Agent, Anda juga dapat menambahkan aturan proyek Anda sendiri di sini |
| `components.json` | Konfigurasi shadcn/ui, termasuk gaya visual, pustaka ikon, dan alias path |
| `.env` / `.env.local` | Environment variable, disegarkan otomatis oleh `nb portal dev` dan `deploy` |
| `vite.config.ts` | Konfigurasi build, termasuk proxy API saat pengembangan |

## Environment Variable

| Variabel | Deskripsi |
| --- | --- |
| `NOCOBASE_API_URL` | Alamat root REST API NocoBase, **harus diakhiri `/api`**. Untuk deployment same-origin biasanya `/api` |
| `NOCOBASE_PORTAL_BASE` | Path publik tempat Portal dipasang. Gunakan `/` untuk pengembangan lokal, dan path deployment sebenarnya seperti `/x/main/` saat build |
| `NOCOBASE_AUTHENTICATOR` | Nama authenticator, default `basic` |
| `NOCOBASE_API_TOKEN` | Token sementara untuk pengembangan, jangan meng-commit nilai yang sebenarnya |
| `API_CLIENT_STORAGE_PREFIX` | Prefix penyimpanan token, harus disamakan jika sisi server mengustomisasinya |
| `API_CLIENT_STORAGE_TYPE` | Cara penyimpanan token, default `localStorage` |
| `API_CLIENT_SHARE_TOKEN` | Apakah token dibagikan, default `false` |

Beberapa variabel ini akan ditulis otomatis oleh `nb portal dev` dan `nb portal deploy`, sehingga biasanya tidak perlu diubah manual. Tiga variabel terakhir hanya perlu disamakan ketika sisi server telah mengustomisasi cara penyimpanan autentikasi.

Saat pengembangan, jika `NOCOBASE_API_URL` diisi alamat absolut, Vite akan otomatis menyiapkan proxy untuk meneruskan request, sehingga Anda tidak perlu menangani CORS sendiri.

## Perintah yang Sering Dipakai

Hanya beberapa perintah ini yang terpakai dalam pengembangan sehari-hari, sedangkan instalasi dependensi, penyegaran environment variable, dan build semuanya ditangani CLI di belakang layar:

| Perintah | Fungsi |
| --- | --- |
| `nb portal list` | Melihat Portal apa saja yang dimiliki aplikasi saat ini |
| `nb portal info <portal>` | Memeriksa path pengembangan, path deployment, dan alamat akses Portal |
| `nb portal create <portal>` | Membuat workspace pengembangan Portal baru berbasis template |
| `nb portal pull <portal>` | Menarik source Portal dari remote ke workspace pengembangan lokal |
| `nb portal dev <portal>` | Menjalankan server pengembangan lokal, ubah kode dan lihat hasilnya seketika |
| `nb portal push <portal>` | Mendorong perubahan source lokal ke remote |
| `nb portal deploy <portal>` | Build dan deploy, agar perubahan berlaku bagi pengguna |
| `nb portal config <portal>` | Menyesuaikan source storage, konfigurasi Git, dan path workspace pengembangan |
| `nb portal destroy <portal>` | Menghapus record Portal dan file yang sudah di-deploy |

Parameter lengkap setiap perintah lihat [Referensi Perintah `nb portal`](../../api/cli/portal/index.md).

## Di Mana Letak Workspace Pengembangan

Workspace pengembangan Portal secara default diletakkan di direktori tempat Anda menjalankan `nb portal create` atau `nb portal pull`:

```text
./<portal>
```

Saat membuat atau menarik source, Anda dapat menentukan lokasi lain dengan `--path`. Artefak deployment hasil build berada di lokasi berbeda, yaitu di bawah storage aplikasi target, disinkronkan oleh `nb portal deploy`, dan biasanya tidak perlu Anda urus.

Jika tidak yakin di mana workspace pengembangan Portal saat ini, langsung periksa saja:

```bash
nb portal info main
```

## Tautan Terkait

- [Mulai Cepat AI Portal](./index.md) — Jalankan entry frontend pertama yang ditulis AI
- [Komponen Standar dan Ekstensi](./components.md) — Fondasi komponen shadcn/ui dan mekanisme ekstensi
- [Deployment dan Manajemen Source](./deploy.md) — Alur build dan deployment serta source storage
- [Membangun Bersama AI Agent](./agent-workflow.md) — Gerakkan AI menulis halaman dengan bahasa natural
- [`nb portal info`](../../api/cli/portal/info.md) — Melihat lokasi workspace pengembangan Portal
