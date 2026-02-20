:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Mesin Penyimpanan: Penyimpanan Lokal

File yang diunggah akan disimpan di direktori lokal pada hard drive server. Ini cocok untuk skenario di mana volume total file yang diunggah yang dikelola oleh sistem relatif kecil, atau untuk tujuan eksperimental.

## Parameter Konfigurasi

![Contoh konfigurasi mesin penyimpanan file](https://static-docs.nocobase.com/20240529115151.png)

:::info{title=Catatan}
Bagian ini hanya memperkenalkan parameter khusus untuk mesin penyimpanan lokal. Untuk parameter umum, silakan lihat [Parameter Mesin Umum](./index.md#parameter-mesin-umum).
:::

### Jalur

Menggambarkan jalur relatif untuk penyimpanan file di server dan jalur akses URL. Contohnya, "`user/avatar`" (tanpa garis miring di awal atau akhir) mewakili:

1.  Jalur relatif di server tempat file yang diunggah disimpan: `/path/to/nocobase-app/storage/uploads/user/avatar`.
2.  Prefiks URL untuk mengakses file: `http://localhost:13000/storage/uploads/user/avatar`.