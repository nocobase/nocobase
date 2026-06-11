---
title: "Panduan Kontribusi Terjemahan NocoBase"
description: "Berkontribusi terjemahan multibahasa untuk NocoBase: lokalisasi antarmuka sistem dan plugin, struktur repository locales, paket bahasa kustom, alur kolaborasi Crowdin."
keywords: "kontribusi terjemahan,multibahasa,lokalisasi,locales,Crowdin,i18n,Internasionalisasi,NocoBase"
---

# Kontribusi Terjemahan

Bahasa default NocoBase adalah bahasa Inggris. Saat ini, aplikasi utama mendukung bahasa Inggris, Italia, Belanda, Tionghoa Sederhana, dan Jepang. Kami dengan tulus mengundang Anda untuk berkontribusi terjemahan dalam bahasa lain, sehingga pengguna global dapat menikmati pengalaman NocoBase yang lebih nyaman.

---

## I. Lokalisasi Sistem

### 1. Terjemahan Antarmuka Sistem dan Plugin

#### 1.1 Cakupan Terjemahan
Hanya berlaku untuk lokalisasi antarmuka sistem NocoBase dan plugin, tidak termasuk konten kustom lainnya (seperti tabel data atau Block Markdown).

![bbb6e0b44aeg](https://static-docs.nocobase.com/img_v3_02kh_8d429938-3aca-44b6-a437-bbb6e0b44aeg.jpg)

![20250319220127](https://static-docs.nocobase.com/20250319220127.png)


#### 1.2 Ikhtisar Konten Lokalisasi
NocoBase menggunakan Git untuk mengelola konten lokalisasi. Repository utamanya adalah:
https://github.com/nocobase/nocobase/tree/main/locales

Setiap bahasa direpresentasikan oleh sebuah file JSON yang dinamai dengan kode bahasanya (misalnya de-DE.json, fr-FR.json). Struktur file diorganisir berdasarkan modul plugin, menggunakan key-value untuk menyimpan terjemahan. Contoh:

```json
{
  // Plugin client
  "@nocobase/client": {
    "(Fields only)": "(Fields only)",
    "12 hour": "12 hour",
    "24 hour": "24 hour"
    // ...key-value lainnya
  },
  "@nocobase/plugin-acl": {
    // key-value untuk plugin ini
  }
  // ...modul plugin lainnya
}
```

Saat menerjemahkan, silakan secara bertahap mengubahnya menjadi struktur seperti berikut:

```json
{
  // Plugin client
  "@nocobase/client": {
    "(Fields only)": "(Hanya Field - sudah diterjemahkan)",
    "12 hour": "12 jam",
    "24 hour": "24 jam"
    // ...key-value lainnya
  },
  "@nocobase/plugin-acl": {
    // key-value untuk plugin ini
  }
  // ...modul plugin lainnya
}
```

#### 1.3 Pengujian dan Sinkronisasi Terjemahan
- Setelah menyelesaikan terjemahan, silakan uji dan verifikasi apakah semua teks ditampilkan dengan benar.
Kami juga merilis plugin verifikasi terjemahan - cari `Locale tester` di marketplace plugin.
![20250422233152](https://static-docs.nocobase.com/20250422233152.png)
Setelah diinstal, salin konten JSON dari file lokalisasi yang sesuai di repository git, tempelkan ke dalamnya, lalu klik OK untuk memverifikasi apakah konten terjemahan berlaku.
![20250422233950](https://static-docs.nocobase.com/20250422233950.png)

- Setelah disubmit, script sistem akan secara otomatis mensinkronisasikan konten lokalisasi ke repository code.

#### 1.4 Plugin Lokalisasi NocoBase 2.0

> **Perhatian:** Bagian ini sedang dalam pengembangan. Plugin lokalisasi NocoBase 2.0 memiliki beberapa perbedaan dengan versi 1.x. Informasi detail akan disediakan dalam pembaruan selanjutnya.

<!-- TODO: Tambahkan informasi detail tentang perbedaan plugin lokalisasi 2.0 -->

## II. Lokalisasi Dokumentasi (NocoBase 2.0)

Dokumentasi NocoBase 2.0 dikelola dengan struktur baru. File source dokumentasi terletak di repository utama NocoBase:

https://github.com/nocobase/nocobase/tree/next/docs

### 2.1 Struktur Dokumentasi

Dokumentasi menggunakan [Rspress](https://rspress.dev/) sebagai static site generator, mendukung 8 bahasa. Strukturnya diorganisir sebagai berikut:

```
docs/
├── docs/
│   ├── en/                    # Bahasa Inggris (bahasa source)
│   ├── cn/                    # Tionghoa Sederhana
│   ├── ja/                    # Jepang
│   ├── de/                    # Jerman
│   ├── fr/                    # Prancis
│   ├── es/                    # Spanyol
│   ├── pt/                    # Portugis
│   ├── ru/                    # Rusia
│   └── public/                # Resource bersama (gambar, dll.)
├── theme/                     # Theme kustom
├── rspress.config.ts          # Konfigurasi Rspress
└── package.json
```

### 2.2 Alur Kerja Terjemahan

1. **Sinkron dengan source bahasa Inggris**: Semua terjemahan harus berbasis pada dokumentasi bahasa Inggris (`docs/en/`). Ketika dokumentasi bahasa Inggris diperbarui, terjemahan juga harus diperbarui sesuai.

2. **Strategi Branch**:
   - Gunakan branch `develop` atau `next` sebagai referensi konten bahasa Inggris terbaru
   - Buat branch terjemahan Anda dari branch target

3. **Struktur File**: Setiap direktori bahasa harus mencerminkan struktur direktori bahasa Inggris. Contoh:
   ```
   docs/en/get-started/index.md    →    docs/ja/get-started/index.md
   docs/en/api/acl/acl.md          →    docs/ja/api/acl/acl.md
   ```

### 2.3 Berkontribusi Terjemahan

1. Fork repository: https://github.com/nocobase/nocobase
2. Clone fork Anda dan checkout branch `develop` atau `next`
3. Navigasi ke direktori `docs/docs/`
4. Temukan direktori bahasa yang ingin Anda kontribusikan (misalnya, `ja/` untuk Jepang)
5. Terjemahkan file markdown, dengan mempertahankan struktur file yang sama dengan versi bahasa Inggris
6. Uji perubahan Anda secara lokal:
   ```bash
   cd docs
   yarn install
   yarn dev
   ```
7. Submit Pull Request ke repository utama

### 2.4 Panduan Terjemahan

- **Pertahankan format yang konsisten**: Pertahankan struktur markdown, judul, code block, dan link yang sama dengan file source
- **Pertahankan frontmatter**: Pertahankan YAML frontmatter di bagian atas file tetap utuh, kecuali jika berisi konten yang dapat diterjemahkan
- **Referensi gambar**: Gunakan path gambar yang sama dari `docs/public/` - gambar dibagi di antara semua bahasa
- **Link internal**: Perbarui link internal untuk mengarah ke path bahasa yang benar
- **Contoh code**: Umumnya, contoh code tidak boleh diterjemahkan, tetapi komentar di dalam code dapat diterjemahkan

### 2.5 Konfigurasi Navigasi

Struktur navigasi setiap bahasa didefinisikan dalam file `_nav.json` dan `_meta.json` di setiap direktori bahasa. Saat menambahkan halaman atau bagian baru, pastikan untuk memperbarui file konfigurasi ini.

## III. Lokalisasi Website Resmi

Halaman website resmi dan semua kontennya disimpan di:
https://github.com/nocobase/website

### 3.1 Sumber Daya untuk Memulai dan Referensi

Saat menambahkan bahasa baru, silakan referensikan halaman bahasa yang sudah ada:
- Bahasa Inggris: https://github.com/nocobase/website/tree/main/src/pages/en
- Tionghoa: https://github.com/nocobase/website/tree/main/src/pages/cn
- Jepang: https://github.com/nocobase/website/tree/main/src/pages/ja

![Ilustrasi Lokalisasi Website Resmi](https://static-docs.nocobase.com/20250319121600.png)

Modifikasi gaya global terletak di:
- Bahasa Inggris: https://github.com/nocobase/website/blob/main/src/layouts/BaseEN.astro
- Tionghoa: https://github.com/nocobase/website/blob/main/src/layouts/BaseCN.astro
- Jepang: https://github.com/nocobase/website/blob/main/src/layouts/BaseJA.astro

![Ilustrasi Gaya Global](https://static-docs.nocobase.com/20250319121501.png)

Lokalisasi komponen global website resmi terletak di:
https://github.com/nocobase/website/tree/main/src/components

![Ilustrasi Komponen Website Resmi](https://static-docs.nocobase.com/20250319122940.png)

### 3.2 Struktur Konten dan Metode Lokalisasi

Kami mengadopsi metode pengelolaan konten hibrida. Konten dan resource untuk bahasa Inggris, Tionghoa, dan Jepang disinkronisasikan secara berkala dari sistem CMS dan ditimpa, sedangkan bahasa lain dapat diedit langsung di file lokal. Konten lokal disimpan di direktori `content`, diorganisir sebagai berikut:

```
/content
  /articles        # Artikel blog
    /article-slug
      index.md     # Konten Inggris (default)
      index.cn.md  # Konten Tionghoa
      index.ja.md  # Konten Jepang
      metadata.json # Metadata dan atribut lokalisasi lainnya
  /tutorials       # Tutorial
  /releases        # Informasi rilis
  /pages           # Beberapa halaman statis
  /categories      # Informasi kategori
    /article-categories.json  # Daftar kategori artikel
    /category-slug            # Detail kategori tunggal
      /category.json
  /tags            # Informasi tag
    /article-tags.json        # Daftar tag artikel
    /release-tags.json        # Daftar tag rilis
    /tag-slug                 # Detail tag tunggal
      /tag.json
  /help-center     # Konten help center
    /help-center-tree.json    # Struktur navigasi help center
  ....
```

### 3.3 Panduan Terjemahan Konten

- Tentang terjemahan konten Markdown

1. Buat file bahasa baru berdasarkan file default (misalnya, `index.md` ke `index.fr.md`)
2. Tambahkan atribut lokalisasi di field yang sesuai pada file JSON
3. Pertahankan konsistensi struktur file, link, dan referensi gambar

- Terjemahan konten JSON
Banyak metadata konten disimpan dalam file JSON, biasanya berisi field multibahasa:

```json
{
  "id": 123,
  "title": "English Title",       // Judul bahasa Inggris (default)
  "title_cn": "中文标题",          // Judul bahasa Tionghoa
  "title_ja": "日本語タイトル",    // Judul bahasa Jepang
  "description": "English description",
  "description_cn": "中文描述",
  "description_ja": "日本語の説明",
  "slug": "article-slug",         // Path URL (biasanya tidak diterjemahkan)
  "status": "published",
  "publishedAt": "2025-03-19T12:00:00Z"
}
```

**Perhatian Terjemahan:**

1. **Konvensi Penamaan Field**: Field terjemahan biasanya menggunakan format `{field_asli}_{kode_bahasa}`
   - Contoh: title_fr (judul bahasa Prancis), description_de (deskripsi bahasa Jerman)

2. **Saat menambahkan bahasa baru**:
   - Tambahkan versi dengan suffix bahasa yang sesuai untuk setiap field yang perlu diterjemahkan
   - Jangan modifikasi nilai field asli (seperti title, description, dll.) karena mereka berfungsi sebagai konten bahasa default (Inggris)

3. **Mekanisme Sinkronisasi CMS**:
   - Sistem CMS memperbarui konten bahasa Inggris, Tionghoa, dan Jepang secara berkala
   - Sistem hanya akan memperbarui/menimpa konten ketiga bahasa tersebut (atribut tertentu di JSON), **tidak akan menghapus** field bahasa yang ditambahkan oleh kontributor lain
   - Contoh: Jika Anda menambahkan terjemahan Prancis (title_fr), sinkronisasi CMS tidak akan memengaruhi field ini


### 3.4 Mengonfigurasi Dukungan Bahasa Baru

Untuk menambahkan dukungan bahasa baru, perlu memodifikasi konfigurasi `SUPPORTED_LANGUAGES` di file `src/utils/index.ts`:

```typescript
export const SUPPORTED_LANGUAGES = {
  en: {
    code: 'en',
    locale: 'en-US',
    name: 'English',
    default: true
  },
  cn: {
    code: 'cn',
    locale: 'zh-CN',
    name: 'Chinese'
  },
  ja: {
    code: 'ja',
    locale: 'ja-JP',
    name: 'Japanese'
  },
  // Contoh menambahkan bahasa baru:
  fr: {
    code: 'fr',
    locale: 'fr-FR',
    name: 'French'
  }
};
```

### 3.5 File Layout dan Styles

Setiap bahasa memerlukan file layout yang sesuai:

1. Buat file layout baru (misalnya, untuk bahasa Prancis, buat `src/layouts/BaseFR.astro`)
2. Anda dapat menyalin file layout yang sudah ada (seperti `BaseEN.astro`) dan menerjemahkannya
3. File layout berisi terjemahan elemen global seperti menu navigasi, footer, dll.
4. Pastikan untuk memperbarui konfigurasi language switcher agar dapat beralih dengan benar ke bahasa yang baru ditambahkan

### 3.6 Membuat Direktori Halaman Bahasa

Buat direktori halaman terpisah untuk bahasa baru:

1. Buat folder yang dinamai dengan kode bahasa di direktori `src` (misalnya `src/fr/`)
2. Salin struktur halaman dari direktori bahasa lain (misalnya `src/en/`)
3. Perbarui konten halaman, terjemahkan judul, deskripsi, dan teks ke bahasa target
4. Pastikan halaman menggunakan komponen layout yang benar (misalnya `.layout: '@/layouts/BaseFR.astro'`)

### 3.7 Lokalisasi Component

Beberapa Component umum juga perlu diterjemahkan:

1. Periksa Component di direktori `src/components/`
2. Berikan perhatian khusus pada Component dengan teks tetap (seperti navbar, footer, dll.)
3. Component mungkin menggunakan rendering kondisional untuk menampilkan konten dalam bahasa yang berbeda:

```astro
{Astro.url.pathname.startsWith('/en') && <p>English content</p>}
{Astro.url.pathname.startsWith('/cn') && <p>中文内容</p>}
{Astro.url.pathname.startsWith('/fr') && <p>Contenu français</p>}
```

### 3.8 Pengujian dan Validasi

Setelah menyelesaikan terjemahan, lakukan pengujian menyeluruh:

1. Jalankan website secara lokal (biasanya menggunakan `yarn dev`)
2. Periksa tampilan semua halaman dalam bahasa baru
3. Verifikasi apakah fungsi pergantian bahasa berjalan dengan benar
4. Pastikan semua link mengarah ke halaman versi bahasa yang benar
5. Periksa layout responsif, pastikan teks terjemahan tidak merusak desain halaman

## IV. Cara Memulai Terjemahan

Jika Anda ingin berkontribusi terjemahan bahasa baru untuk NocoBase, ikuti langkah-langkah berikut:

| Komponen | Repository | Branch | Catatan |
|------|------|------|------|
| Antarmuka Sistem | https://github.com/nocobase/nocobase/tree/main/locales | main | File lokalisasi JSON |
| Dokumentasi (2.0) | https://github.com/nocobase/nocobase | develop / next | Direktori `docs/docs/<lang>/` |
| Website Resmi | https://github.com/nocobase/website | main | Lihat bagian III |

Setelah menyelesaikan terjemahan, silakan submit Pull Request ke NocoBase. Bahasa baru akan muncul di konfigurasi sistem, memungkinkan Anda memilih bahasa yang akan ditampilkan.

![Ilustrasi Pengaktifan Bahasa](https://static-docs.nocobase.com/20250319123452.png)

## Dokumentasi NocoBase 1.x

Untuk panduan terjemahan NocoBase 1.x, silakan referensikan:

https://docs-cn.nocobase.com/welcome/community/translations
