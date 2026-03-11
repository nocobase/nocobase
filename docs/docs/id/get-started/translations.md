:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/get-started/translations).
:::

# Kontribusi Terjemahan

Bahasa default NocoBase adalah bahasa Inggris. Saat ini, aplikasi utama mendukung bahasa Inggris, Italia, Belanda, Tionghoa Sederhana, dan Jepang. Kami dengan tulus mengundang Anda untuk berkontribusi dalam menerjemahkan bahasa lainnya, sehingga pengguna di seluruh dunia dapat menikmati pengalaman NocoBase yang lebih nyaman.

---

## I. Lokalisasi Sistem

### 1. Terjemahan Antarmuka Sistem dan Plugin

#### 1.1 Cakupan Terjemahan
Hanya berlaku untuk lokalisasi antarmuka sistem NocoBase dan plugin, tidak mencakup konten kustom lainnya (seperti tabel data atau blok Markdown).

![bbb6e0b44aeg](https://static-docs.nocobase.com/img_v3_02kh_8d429938-3aca-44b6-a437-bbb6e0b44aeg.jpg)

![20250319220127](https://static-docs.nocobase.com/20250319220127.png)


#### 1.2 Ringkasan Konten Lokalisasi
NocoBase menggunakan Git untuk mengelola konten lokalisasi. Repositori utamanya adalah:
https://github.com/nocobase/nocobase/tree/main/locales

Setiap bahasa diwakili oleh sebuah berkas JSON yang dinamai sesuai kode bahasa (misalnya de-DE.json, fr-FR.json). Struktur berkas diatur berdasarkan modul plugin, menggunakan pasangan kunci-nilai (key-value pairs) untuk menyimpan terjemahan. Contoh:

```json
{
  // Plugin klien
  "@nocobase/client": {
    "(Fields only)": "(Fields only)",
    "12 hour": "12 hour",
    "24 hour": "24 hour"
    // ...pasangan kunci-nilai lainnya
  },
  "@nocobase/plugin-acl": {
    // Pasangan kunci-nilai untuk plugin ini
  }
  // ...modul plugin lainnya
}
```

Saat menerjemahkan, harap ubah secara bertahap menjadi struktur yang serupa dengan berikut ini:

```json
{
  // Plugin klien
  "@nocobase/client": {
    "(Fields only)": "(Hanya field - diterjemahkan)",
    "12 hour": "12 jam",
    "24 hour": "24 jam"
    // ...pasangan kunci-nilai lainnya
  },
  "@nocobase/plugin-acl": {
    // Pasangan kunci-nilai untuk plugin ini
  }
  // ...modul plugin lainnya
}
```

#### 1.3 Pengujian dan Sinkronisasi Terjemahan
- Setelah menyelesaikan terjemahan, harap uji dan verifikasi apakah semua teks ditampilkan dengan benar.
Kami juga telah merilis plugin verifikasi terjemahan - cari `Locale tester` di pasar plugin.
![20250422233152](https://static-docs.nocobase.com/20250422233152.png)
Setelah instalasi, salin konten JSON dari berkas lokalisasi yang sesuai di repositori git, tempelkan ke dalamnya, lalu klik OK untuk memverifikasi apakah konten terjemahan telah berlaku.
![20250422233950](https://static-docs.nocobase.com/20250422233950.png)

- Setelah dikirimkan, skrip sistem akan secara otomatis menyinkronkan konten lokalisasi ke repositori kode.

#### 1.4 Plugin Lokalisasi NocoBase 2.0

> **Catatan:** Bagian ini sedang dalam pengembangan. Plugin lokalisasi untuk NocoBase 2.0 memiliki beberapa perbedaan dengan versi 1.x. Detail lebih lanjut akan diberikan dalam pembaruan mendatang.

<!-- TODO: Tambahkan detail tentang perbedaan plugin lokalisasi 2.0 -->

## II. Lokalisasi Dokumentasi (NocoBase 2.0)

Dokumentasi untuk NocoBase 2.0 dikelola dengan struktur baru. Berkas sumber dokumentasi terletak di repositori utama NocoBase:

https://github.com/nocobase/nocobase/tree/next/docs

### 2.1 Struktur Dokumentasi

Dokumentasi menggunakan [Rspress](https://rspress.dev/) sebagai generator situs statis dan mendukung 22 bahasa. Strukturnya diatur sebagai berikut:

```
docs/
├── docs/
│   ├── en/                    # Bahasa Inggris (bahasa sumber)
│   ├── cn/                    # Tionghoa Sederhana
│   ├── ja/                    # Jepang
│   ├── ko/                    # Korea
│   ├── de/                    # Jerman
│   ├── fr/                    # Prancis
│   ├── es/                    # Spanyol
│   ├── pt/                    # Portugis
│   ├── ru/                    # Rusia
│   ├── it/                    # Italia
│   ├── tr/                    # Turki
│   ├── uk/                    # Ukraina
│   ├── vi/                    # Vietnam
│   ├── id/                    # Bahasa Indonesia
│   ├── th/                    # Thai
│   ├── pl/                    # Polandia
│   ├── nl/                    # Belanda
│   ├── cs/                    # Ceko
│   ├── ar/                    # Arab
│   ├── he/                    # Ibrani
│   ├── hi/                    # Hindi
│   ├── sv/                    # Swedia
│   └── public/                # Aset bersama (gambar, dll.)
├── theme/                     # Tema kustom
├── rspress.config.ts          # Konfigurasi Rspress
└── package.json
```

### 2.2 Alur Kerja Terjemahan

1. **Sinkronisasi dengan sumber bahasa Inggris**: Semua terjemahan harus didasarkan pada dokumentasi bahasa Inggris (`docs/en/`). Ketika dokumentasi bahasa Inggris diperbarui, terjemahan harus diperbarui sesuai dengan itu.

2. **Strategi Branch**:
   - Gunakan branch `develop` atau `next` sebagai referensi untuk konten bahasa Inggris terbaru
   - Buat branch terjemahan Anda dari branch target tersebut

3. **Struktur Berkas**: Setiap direktori bahasa harus mencerminkan struktur direktori bahasa Inggris. Contoh:
   ```
   docs/en/get-started/index.md    →    docs/id/get-started/index.md
   docs/en/api/acl/acl.md          →    docs/id/api/acl/acl.md
   ```

### 2.3 Berkontribusi dalam Terjemahan

1. Fork repositori: https://github.com/nocobase/nocobase
2. Clone fork Anda dan checkout branch `develop` atau `next`
3. Navigasi ke direktori `docs/docs/`
4. Temukan direktori bahasa yang ingin Anda kontribusikan (misalnya, `id/` untuk Bahasa Indonesia)
5. Terjemahkan berkas markdown, pertahankan struktur berkas yang sama dengan versi bahasa Inggris
6. Uji perubahan Anda secara lokal:
   ```bash
   cd docs
   yarn install
   yarn dev
   ```
7. Kirimkan Pull Request ke repositori utama

### 2.4 Panduan Terjemahan

- **Jaga konsistensi format**: Pertahankan struktur markdown, judul, blok kode, dan tautan yang sama dengan sumbernya
- **Pertahankan frontmatter**: Biarkan YAML frontmatter di bagian atas berkas tidak berubah kecuali jika mengandung konten yang dapat diterjemahkan
- **Referensi gambar**: Gunakan jalur gambar yang sama dari `docs/public/` - gambar dibagikan di semua bahasa
- **Tautan internal**: Perbarui tautan internal untuk mengarah ke jalur bahasa yang benar
- **Contoh kode**: Umumnya, contoh kode tidak boleh diterjemahkan, tetapi komentar di dalam kode dapat diterjemahkan

### 2.5 Konfigurasi Navigasi

Struktur navigasi untuk setiap bahasa ditentukan dalam berkas `_nav.json` dan `_meta.json` di dalam setiap direktori bahasa. Saat menambahkan halaman atau bagian baru, pastikan untuk memperbarui berkas konfigurasi ini.

## III. Lokalisasi Situs Web Resmi

Halaman situs web dan semua konten disimpan di:
https://github.com/nocobase/website

### 3.1 Memulai dan Sumber Daya Referensi

Saat menambahkan bahasa baru, silakan merujuk ke halaman bahasa yang sudah ada:
- Bahasa Inggris: https://github.com/nocobase/website/tree/main/src/pages/en
- Bahasa Tionghoa: https://github.com/nocobase/website/tree/main/src/pages/cn
- Bahasa Jepang: https://github.com/nocobase/website/tree/main/src/pages/ja

![Diagram Lokalisasi Situs Web](https://static-docs.nocobase.com/20250319121600.png)

Modifikasi gaya global terletak di:
- Bahasa Inggris: https://github.com/nocobase/website/blob/main/src/layouts/BaseEN.astro
- Bahasa Tionghoa: https://github.com/nocobase/website/blob/main/src/layouts/BaseCN.astro
- Bahasa Jepang: https://github.com/nocobase/website/blob/main/src/layouts/BaseJA.astro

![Diagram Gaya Global](https://static-docs.nocobase.com/20250319121501.png)

Lokalisasi komponen global situs web tersedia di:
https://github.com/nocobase/website/tree/main/src/components

![Diagram Komponen Situs Web](https://static-docs.nocobase.com/20250319122940.png)

### 3.2 Struktur Konten dan Metode Lokalisasi

Kami menggunakan pendekatan manajemen konten campuran. Konten dan sumber daya bahasa Inggris, Tionghoa, dan Jepang disinkronkan secara berkala dari sistem CMS dan ditimpa, sementara bahasa lain dapat diedit langsung di berkas lokal. Konten lokal disimpan di direktori `content`, diatur sebagai berikut:

```
/content
  /articles        # Artikel blog
    /article-slug
      index.md     # Konten bahasa Inggris (default)
      index.cn.md  # Konten bahasa Tionghoa
      index.ja.md  # Konten bahasa Jepang
      metadata.json # Metadata dan properti lokalisasi lainnya
  /tutorials       # Tutorial
  /releases        # Informasi rilis
  /pages           # Beberapa halaman statis
  /categories      # Informasi kategori
    /article-categories.json  # Daftar kategori artikel
    /category-slug            # Detail kategori individu
      /category.json
  /tags            # Informasi tag
    /article-tags.json        # Daftar tag artikel
    /release-tags.json        # Daftar tag rilis
    /tag-slug                 # Detail tag individu
      /tag.json
  /help-center     # Konten pusat bantuan
    /help-center-tree.json    # Struktur navigasi pusat bantuan
  ....
```

### 3.3 Panduan Terjemahan Konten

- Tentang Terjemahan Konten Markdown

1. Buat berkas bahasa baru berdasarkan berkas default (misalnya, `index.md` menjadi `index.id.md`)
2. Tambahkan properti terlokalisasi di field yang sesuai dalam berkas JSON
3. Jaga konsistensi dalam struktur berkas, tautan, dan referensi gambar

- Terjemahan Konten JSON
Banyak metadata konten disimpan dalam berkas JSON, yang biasanya berisi field multibahasa:

```json
{
  "id": 123,
  "title": "English Title",       // Judul bahasa Inggris (default)
  "title_cn": "中文标题",          // Judul bahasa Tionghoa
  "title_ja": "日本語タイトル",    // Judul bahasa Jepang
  "description": "English description",
  "description_cn": "中文描述",
  "description_ja": "日本語の説明",
  "slug": "article-slug",         // Jalur URL (biasanya tidak diterjemahkan)
  "status": "published",
  "publishedAt": "2025-03-19T12:00:00Z"
}
```

**Catatan Terjemahan:**

1. **Konvensi Penamaan Field**: Field terjemahan biasanya menggunakan format `{field_asli}_{kode_bahasa}`
   - Contoh: title_id (judul bahasa Indonesia), description_id (deskripsi bahasa Indonesia)

2. **Saat Menambahkan Bahasa Baru**:
   - Tambahkan versi akhiran bahasa yang sesuai untuk setiap field yang perlu diterjemahkan
   - Jangan mengubah nilai field asli (seperti title, description, dll.), karena field tersebut berfungsi sebagai konten bahasa default (Inggris)

3. **Mekanisme Sinkronisasi CMS**:
   - Sistem CMS secara berkala memperbarui konten bahasa Inggris, Tionghoa, dan Jepang
   - Sistem hanya akan memperbarui/menimpa konten untuk ketiga bahasa tersebut (beberapa properti dalam JSON), dan **tidak akan menghapus** field bahasa yang ditambahkan oleh kontributor lain
   - Contoh: jika Anda menambahkan terjemahan bahasa Indonesia (title_id), sinkronisasi CMS tidak akan memengaruhi field ini


### 3.4 Mengonfigurasi Dukungan Bahasa Baru

Untuk menambahkan dukungan bahasa baru, Anda perlu memodifikasi konfigurasi `SUPPORTED_LANGUAGES` dalam berkas `src/utils/index.ts`:

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
  id: {
    code: 'id',
    locale: 'id-ID',
    name: 'Indonesian'
  }
};
```

### 3.5 Berkas Tata Letak dan Gaya

Setiap bahasa memerlukan berkas tata letak (layout) yang sesuai:

1. Buat berkas tata letak baru (misalnya, untuk bahasa Indonesia, buat `src/layouts/BaseID.astro`)
2. Anda dapat menyalin berkas tata letak yang sudah ada (seperti `BaseEN.astro`) dan menerjemahkannya
3. Berkas tata letak berisi terjemahan untuk elemen global seperti menu navigasi, footer, dll.
4. Pastikan untuk memperbarui konfigurasi pengalih bahasa agar dapat beralih ke bahasa yang baru ditambahkan dengan benar

### 3.6 Membuat Direktori Halaman Bahasa

Buat direktori halaman independen untuk bahasa baru:

1. Buat folder dengan nama kode bahasa di direktori `src` (misalnya `src/id/`)
2. Salin struktur halaman dari direktori bahasa lain (misalnya `src/en/`)
3. Perbarui konten halaman, terjemahkan judul, deskripsi, dan teks ke dalam bahasa target
4. Pastikan halaman menggunakan komponen tata letak yang benar (misalnya `.layout: '@/layouts/BaseID.astro'`)

### 3.7 Lokalisasi Komponen

Beberapa komponen umum juga perlu diterjemahkan:

1. Periksa komponen di direktori `src/components/`
2. Berikan perhatian khusus pada komponen dengan teks tetap (seperti bilah navigasi, footer, dll.)
3. Komponen mungkin menggunakan rendering kondisional untuk menampilkan konten dalam bahasa yang berbeda:

```astro
{Astro.url.pathname.startsWith('/en') && <p>English content</p>}
{Astro.url.pathname.startsWith('/id') && <p>Konten bahasa Indonesia</p>}
```

### 3.8 Pengujian dan Verifikasi

Setelah menyelesaikan terjemahan, lakukan pengujian menyeluruh:

1. Jalankan situs web secara lokal (biasanya menggunakan `yarn dev`)
2. Periksa tampilan semua halaman dalam bahasa baru
3. Verifikasi apakah fungsi pengalihan bahasa berfungsi dengan baik
4. Pastikan semua tautan mengarah ke halaman versi bahasa yang benar
5. Periksa tata letak responsif untuk memastikan teks terjemahan tidak merusak desain halaman

## IV. Cara Memulai Terjemahan

Jika Anda ingin berkontribusi terjemahan bahasa baru ke NocoBase, silakan ikuti langkah-langkah berikut:

| Komponen | Repositori | Branch | Catatan |
|----------|------------|--------|---------|
| Antarmuka Sistem | https://github.com/nocobase/nocobase/tree/main/locales | main | Berkas lokalisasi JSON |
| Dokumentasi (2.0) | https://github.com/nocobase/nocobase | develop / next | Direktori `docs/docs/<lang>/` |
| Situs Web Resmi | https://github.com/nocobase/website | main | Lihat Bagian III |

Setelah menyelesaikan terjemahan Anda, silakan kirimkan Pull Request ke NocoBase. Bahasa baru akan muncul dalam konfigurasi sistem, memungkinkan Anda untuk memilih bahasa yang ingin ditampilkan.

![Diagram Bahasa yang Diaktifkan](https://static-docs.nocobase.com/20250319123452.png)

## Dokumentasi NocoBase 1.x

Untuk panduan terjemahan NocoBase 1.x, silakan merujuk ke:

https://docs.nocobase.com/welcome/community/translations