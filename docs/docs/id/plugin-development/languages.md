:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Daftar Bahasa

NocoBase menyediakan dukungan multibahasa (i18n). Berikut adalah daftar bahasa bawaan yang tersedia saat ini.
Setiap konfigurasi bahasa terdiri dari **Kode Lokal (Locale Code)** dan **Nama Tampilan (Label)**.

## Standar Kode Bahasa

* Kode bahasa mengikuti format standar **[IETF BCP 47](https://www.rfc-editor.org/rfc/bcp/bcp47.txt)**:

  ```
  language[-script][-region][-variant]
  ```

  Bentuk umum adalah `bahasa-wilayah`, contohnya:

  * `en-US` → Inggris (Amerika Serikat)
  * `fr-FR` → Prancis (Prancis)
  * `zh-CN` → Mandarin Sederhana

* **Sensitif terhadap huruf besar/kecil**:

  * Bagian bahasa menggunakan huruf kecil (`en`, `fr`, `zh`)
  * Bagian wilayah menggunakan huruf besar (`US`, `FR`, `CN`)

* Satu bahasa dapat memiliki beberapa versi regional, contohnya:

  * `fr-FR` (Prancis Prancis), `fr-CA` (Prancis Kanada)

## Bahasa Bawaan

| Kode Lokal | Nama Tampilan |
| ----- | -------------------- |
| ar-EG | العربية |
| az-AZ | Azərbaycan dili |
| bg-BG | Български |
| bn-BD | Bengali |
| by-BY | Беларускі |
| ca-ES | Сatalà/Espanya |
| cs-CZ | Česky |
| da-DK | Dansk |
| de-DE | Deutsch |
| el-GR | Ελληνικά |
| en-GB | English(GB) |
| en-US | English |
| es-ES | Español |
| et-EE | Estonian (Eesti) |
| fa-IR | فارسی |
| fi-FI | Suomi |
| fr-BE | Français(BE) |
| fr-CA | Français(CA) |
| fr-FR | Français |
| ga-IE | Gaeilge |
| gl-ES | Galego |
| he-IL | עברית |
| hi-IN | हिन्दी |
| hr-HR | Hrvatski jezik |
| hu-HU | Magyar |
| hy-AM | Հայերեն |
| id-ID | Bahasa Indonesia |
| is-IS | Íslenska |
| it-IT | Italiano |
| ja-JP | 日本語 |
| ka-GE | ქართული |
| kk-KZ | Қазақ тілі |
| km-KH | ភាសាខ្មែរ |
| kn-IN | ಕನ್ನಡ |
| ko-KR | 한국어 |
| ku-IQ | کوردی |
| lt-LT | lietuvių |
| lv-LV | Latviešu valoda |
| mk-MK | македонски јазик |
| ml-IN | മലയാളം |
| mn-MN | Монгол хэл |
| ms-MY | بهاس ملايو |
| nb-NO | Norsk bokmål |
| ne-NP | नेपाली |
| nl-BE | Vlaams |
| nl-NL | Nederlands |
| pl-PL | Polski |
| pt-BR | Português brasileiro |
| pt-PT | Português |
| ro-RO | România |
| ru-RU | Русский |
| si-LK | සිංහල |
| sk-SK | Slovenčina |
| sl-SI | Slovenščina |
| sr-RS | српски језик |
| sv-SE | Svenska |
| ta-IN | Tamil |
| th-TH | ภาษาไทย |
| tk-TK | Turkmen |
| tr-TR | Türkçe |
| uk-UA | Українська |
| ur-PK | Oʻzbekcha |
| vi-VN | Tiếng Việt |
| zh-CN | 简体中文 |
| zh-HK | 繁體中文（香港） |
| zh-TW | 繁體中文（台湾） |

## Petunjuk Penggunaan

* Konfigurasi bahasa biasanya digunakan untuk:

  * **Tampilan Antarmuka**: Menampilkan `label` di menu pengganti bahasa.
  * **Pemuatan Berkas Internasionalisasi**: Memuat berkas JSON terjemahan yang sesuai berdasarkan `Kode Lokal`.

* Saat menambahkan bahasa baru, Anda perlu:

  1. Mengikuti standar BCP 47 untuk mendefinisikan Kode Lokal;
  2. Menyediakan nama lokal yang jelas sebagai `label`;
  3. Menyediakan berkas terjemahan yang sesuai.