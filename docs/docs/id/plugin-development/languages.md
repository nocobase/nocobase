---
title: "Daftar Bahasa yang Didukung Plugin"
description: "Daftar kode bahasa yang didukung untuk internasionalisasi plugin NocoBase, digunakan untuk konfigurasi locales."
keywords: "Daftar Bahasa,locales,Internasionalisasi,i18n,Multibahasa,NocoBase"
---

# Daftar Bahasa

NocoBase menyediakan dukungan multibahasa (i18n), berikut adalah daftar bahasa built-in saat ini. Setiap konfigurasi bahasa terdiri dari **Kode Bahasa (Locale Code)** dan **Nama Tampilan (Label)**.

## Spesifikasi Kode Bahasa

* Kode bahasa menggunakan format standar **[IETF BCP 47](https://www.rfc-editor.org/rfc/bcp/bcp47.txt)**:

  ```
  language[-script][-region][-variant]
  ```

  Bentuk umum adalah `bahasa-region`, contoh:

  * `en-US` → Bahasa Inggris (Amerika)
  * `fr-FR` → Bahasa Prancis (Prancis)
  * `zh-CN` → Bahasa Tionghoa Sederhana

* **Case sensitive**:

  * Bagian bahasa huruf kecil (`en`, `fr`, `zh`)
  * Bagian region huruf besar (`US`, `FR`, `CN`)

* Bahasa yang sama mungkin memiliki beberapa versi region, contoh:

  * `fr-FR` (Prancis Prancis), `fr-CA` (Prancis Kanada)

## Bahasa Built-in

| Kode Bahasa  | Nama Tampilan                 |
| ----- | -------------------- |
| ar-EG | العربية              |
| az-AZ | Azərbaycan dili      |
| bg-BG | Български            |
| bn-BD | Bengali              |
| by-BY | Беларускі            |
| ca-ES | Сatalà/Espanya       |
| cs-CZ | Česky                |
| da-DK | Dansk                |
| de-DE | Deutsch              |
| el-GR | Ελληνικά             |
| en-GB | English(GB)          |
| en-US | English              |
| es-ES | Español              |
| et-EE | Estonian (Eesti)     |
| fa-IR | فارسی                |
| fi-FI | Suomi                |
| fr-BE | Français(BE)         |
| fr-CA | Français(CA)         |
| fr-FR | Français             |
| ga-IE | Gaeilge              |
| gl-ES | Galego               |
| he-IL | עברית                |
| hi-IN | हिन्दी               |
| hr-HR | Hrvatski jezik       |
| hu-HU | Magyar               |
| hy-AM | Հայերեն              |
| id-ID | Bahasa Indonesia     |
| is-IS | Íslenska             |
| it-IT | Italiano             |
| ja-JP | 日本語                  |
| ka-GE | ქართული              |
| kk-KZ | Қазақ тілі           |
| km-KH | ភាសាខ្មែរ            |
| kn-IN | ಕನ್ನಡ                |
| ko-KR | 한국어                  |
| ku-IQ | کوردی                |
| lt-LT | lietuvių             |
| lv-LV | Latviešu valoda      |
| mk-MK | македонски јазик     |
| ml-IN | മലയാളം               |
| mn-MN | Монгол хэл           |
| ms-MY | بهاس ملايو           |
| nb-NO | Norsk bokmål         |
| ne-NP | नेपाली               |
| nl-BE | Vlaams               |
| nl-NL | Nederlands           |
| pl-PL | Polski               |
| pt-BR | Português brasileiro |
| pt-PT | Português            |
| ro-RO | România              |
| ru-RU | Русский              |
| si-LK | සිංහල                |
| sk-SK | Slovenčina           |
| sl-SI | Slovenščina          |
| sr-RS | српски језик         |
| sv-SE | Svenska              |
| ta-IN | Tamil                |
| th-TH | ภาษาไทย              |
| tk-TK | Turkmen              |
| tr-TR | Türkçe               |
| uk-UA | Українська           |
| ur-PK | Oʻzbekcha            |
| vi-VN | Tiếng Việt           |
| zh-CN | 简体中文                 |
| zh-HK | 繁體中文（香港）             |
| zh-TW | 繁體中文（台湾）             |

## Petunjuk Penggunaan

Konfigurasi bahasa biasanya digunakan untuk:

- **Tampilan UI** — Menampilkan `label` di menu "Pergantian Bahasa"
- **Loading File Internasionalisasi** — Memuat file JSON terjemahan yang sesuai berdasarkan kode bahasa

Jika Anda perlu menambahkan bahasa baru:

1. Ikuti standar BCP 47 untuk mendefinisikan kode bahasa
2. Berikan nama lokal yang jelas sebagai `label`
3. Sediakan file terjemahan yang sesuai

## Tautan Terkait

- [Internasionalisasi Server](./server/i18n.md) — Konfigurasi dan penggunaan multibahasa i18n di server
- [Ikhtisar Pengembangan Plugin](./index.md) — Pengantar keseluruhan pengembangan plugin
- [Menulis Plugin Pertama Anda](./write-your-first-plugin.md) — Membuat plugin dari nol
