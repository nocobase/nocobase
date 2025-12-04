---
pkg: "@nocobase/plugin-verification"
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::



pkg: '@nocobase/plugin-verification'
---

# Verifikasi

:::info{title=Catatan}
Mulai versi `1.6.0-alpha.30`, fitur "kode verifikasi" yang lama telah ditingkatkan menjadi "Manajemen Verifikasi", yang mendukung pengelolaan dan integrasi berbagai metode verifikasi pengguna. Setelah pengguna mengikat metode verifikasi yang sesuai, mereka dapat melakukan verifikasi identitas saat dibutuhkan. Fitur ini direncanakan akan didukung secara stabil mulai versi `1.7.0`.
:::

## Pendahuluan

**Pusat Manajemen Verifikasi mendukung pengelolaan dan integrasi berbagai metode verifikasi pengguna.** Contohnya:

- Kode Verifikasi SMS – Disediakan secara default oleh plugin verifikasi. Lihat: [Verifikasi: SMS](./sms)
- Autentikator TOTP – Lihat: [Verifikasi: Autentikator TOTP](../verification-totp/)

Pengembang juga dapat memperluas jenis verifikasi lain melalui plugin. Lihat: [Memperluas Jenis Verifikasi](./dev/type)

**Pengguna dapat melakukan verifikasi identitas saat dibutuhkan setelah mengikat metode verifikasi yang sesuai.** Contohnya:

- Login Verifikasi SMS – Lihat: [Autentikasi: SMS](../auth-sms/index.md)
- Autentikasi Dua Faktor (2FA) – Lihat: [Autentikasi Dua Faktor (2FA)](../2fa/)
- Verifikasi Sekunder untuk Operasi Berisiko – Dukungan di masa mendatang

Pengembang juga dapat mengintegrasikan verifikasi identitas ke dalam skenario lain yang diperlukan dengan memperluas plugin. Lihat: [Memperluas Skenario Verifikasi](./dev/scene)

**Perbedaan dan Hubungan antara Modul Verifikasi dan Modul Autentikasi Pengguna:** Modul Autentikasi Pengguna bertanggung jawab utama untuk autentikasi identitas selama skenario login pengguna, dengan proses seperti login SMS dan autentikasi dua faktor yang mengandalkan verifikator yang disediakan oleh Modul Verifikasi; sementara itu, Modul Verifikasi menangani verifikasi identitas untuk berbagai operasi berisiko tinggi, dengan login pengguna sebagai salah satu skenario tersebut.

![](https://static-docs.nocobase.com/202502262315404.png)

![](https://static-docs.nocobase.com/202502262315966.png)