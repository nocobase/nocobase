:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Penyimpanan Lokal
File yang diunggah akan disimpan di direktori lokal pada server. Ini cocok untuk skenario di mana jumlah total file yang dikelola oleh sistem relatif kecil atau untuk tujuan eksperimen.

## Opsi Konfigurasi

![Contoh Opsi Mesin Penyimpanan File](https://static-docs.nocobase.com/20240529115151.png)

:::info{title=Catatan}
Bagian ini hanya membahas parameter khusus untuk mesin penyimpanan lokal. Untuk parameter umum, silakan lihat [Parameter Mesin Umum](./index.md#parameter-mesin-umum).
:::

### Jalur
Jalur ini merepresentasikan jalur relatif file yang disimpan di server dan juga jalur akses URL. Contohnya, "`user/avatar`" (tanpa tanda "`/`" di awal dan akhir) merepresentasikan:

1. Jalur relatif file yang diunggah saat disimpan di server: `/path/to/nocobase-app/storage/uploads/user/avatar`.
2. Prefiks URL untuk mengakses file: `http://localhost:13000/storage/uploads/user/avatar`.