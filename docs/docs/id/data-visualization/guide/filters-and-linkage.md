:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Filter Halaman dan Keterkaitan

Filter halaman (Blok Filter) digunakan untuk menyediakan input kondisi filter yang terpadu di tingkat halaman, kemudian menggabungkannya ke dalam kueri bagan. Ini memungkinkan beberapa bagan difilter secara konsisten dan saling terkait.

## Ikhtisar Fitur
- Tambahkan "Blok Filter" ke halaman untuk menyediakan titik masuk filter yang terpadu bagi semua bagan di halaman tersebut.
- Gunakan tombol "Filter", "Reset", dan "Ciutkan" untuk menerapkan, menghapus, dan menyembunyikan filter.
- Jika filter memilih bidang yang terkait dengan bagan, nilainya akan secara otomatis digabungkan ke dalam permintaan kueri bagan dan memicu pembaruan bagan.
- Filter juga dapat membuat bidang kustom dan mendaftarkannya dalam variabel konteks, sehingga dapat direferensikan di bagan, tabel, formulir, dan blok data lainnya.

![clipboard-image-1761487702](https://static-docs.nocobase.com/clipboard-image-1761487702.png)

Untuk informasi lebih lanjut mengenai penggunaan filter halaman dan keterkaitannya dengan bagan atau blok data lainnya, silakan lihat dokumentasi Filter Halaman.

## Menggunakan Nilai Filter Halaman dalam Kueri Bagan
- Mode Builder (direkomendasikan)
  - Penggabungan Otomatis: Jika sumber data dan koleksi sama, Anda tidak perlu menulis variabel tambahan dalam kueri bagan; filter halaman akan digabungkan menggunakan `$and`.
  - Pilihan Manual: Anda juga dapat secara manual memilih nilai dari "bidang kustom" Blok Filter halaman dalam kondisi filter bagan.

- Mode SQL (melalui injeksi variabel)
  - Dalam pernyataan SQL, gunakan "Pilih variabel" untuk menyisipkan nilai dari "bidang kustom" Blok Filter halaman.