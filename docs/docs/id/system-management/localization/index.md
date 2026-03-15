:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/system-management/localization/index).
:::

# Manajemen Lokalisasi

## Pendahuluan

Plugin manajemen lokalisasi digunakan untuk mengelola dan mengimplementasikan sumber daya lokalisasi NocoBase, dapat menerjemahkan menu sistem, koleksi, bidang, serta semua plugin untuk menyesuaikan dengan bahasa dan budaya wilayah tertentu.

## Instalasi

Plugin ini adalah plugin bawaan, tidak memerlukan instalasi tambahan.

## Petunjuk Penggunaan

### Mengaktifkan Plugin

![](https://static-docs.nocobase.com/d16f6ecd6bfb8d1e8acff38f23ad37f8.png)

### Masuk ke Halaman Manajemen Lokalisasi

<img src="https://static-docs.nocobase.com/202404202134187.png"/>

### Sinkronisasi Entri Terjemahan

<img src="https://static-docs.nocobase.com/202404202134850.png"/>

Saat ini mendukung sinkronisasi konten berikut:

- Paket bahasa lokal sistem dan plugin
- Judul koleksi, judul bidang, dan label opsi bidang
- Judul menu

Setelah sinkronisasi selesai, sistem akan mencantumkan semua entri yang dapat diterjemahkan untuk bahasa saat ini.

<img src="https://static-docs.nocobase.com/202404202136567.png"/>

:::info{title=Petunjuk}
Modul yang berbeda mungkin memiliki entri teks asli yang sama, sehingga perlu diterjemahkan secara terpisah.
:::

### Membuat Entri Secara Otomatis

Saat mengedit halaman, teks kustom di setiap blok akan secara otomatis membuat entri yang sesuai, dan secara sinkron menghasilkan konten terjemahan untuk bahasa saat ini.

![](https://static-docs.nocobase.com/Localization-02-12-2026_08_39_AM.png)

![](https://static-docs.nocobase.com/Localization-NocoBase-02-12-2026_08_39_AM.png)

:::info{title=Petunjuk}
Saat mendefinisikan teks dalam kode, perlu menentukan ns (namespace) secara manual, seperti: `${ctx.i18n.t('My custom js block', { ns: 'lm-flow-engine' })}`
:::


### Mengedit Konten Terjemahan

<img src="https://static-docs.nocobase.com/202404202142836.png"/>

### Menerbitkan Terjemahan

Setelah terjemahan selesai, perlu mengeklik tombol "Terbitkan" agar perubahan dapat berlaku.

<img src="https://static-docs.nocobase.com/202404202143135.png"/>

### Menerjemahkan Bahasa Lain

Aktifkan bahasa lain di "Pengaturan Sistem", misalnya, Bahasa Mandarin Sederhana.

![](https://static-docs.nocobase.com/618830967aaeb643c892fce355d59a73.png)

Beralih ke lingkungan bahasa tersebut.

<img src="https://static-docs.nocobase.com/202404202144789.png"/>

Sinkronisasi entri.

<img src="https://static-docs.nocobase.com/202404202145877.png"/>

Terjemahkan dan terbitkan.

<img src="https://static-docs.nocobase.com/202404202143135.png"/>