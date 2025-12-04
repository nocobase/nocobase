:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Gambaran Umum Koleksi

NocoBase menyediakan DSL unik untuk mendeskripsikan struktur data, yang disebut **koleksi**. Ini menyatukan struktur data dari berbagai sumber, menyediakan fondasi yang andal untuk manajemen, analisis, dan aplikasi data di kemudian hari.

![20240512161522](https://static-docs.nocobase.com/20240512161522.png)

Untuk memudahkan penggunaan berbagai model data, NocoBase mendukung pembuatan berbagai jenis **koleksi**:

-   [**Koleksi** Umum](/data-sources/data-source-main/general-collection): Dilengkapi dengan bidang sistem umum yang sering digunakan;
-   [**Koleksi** Warisan](/data-sources/data-source-main/inheritance-collection): Anda dapat membuat **koleksi** induk, lalu menurunkan **koleksi** anak dari **koleksi** induk tersebut. **Koleksi** anak akan mewarisi struktur **koleksi** induk dan juga dapat mendefinisikan kolomnya sendiri.
-   [**Koleksi** Pohon](/data-sources/collection-tree): **Koleksi** dengan struktur pohon, saat ini hanya mendukung desain daftar kedekatan (adjacency list);
-   [**Koleksi** Kalender](/data-sources/calendar/calendar-collection): Digunakan untuk membuat **koleksi** acara terkait kalender;
-   [**Koleksi** Berkas](/data-sources/file-manager/file-collection): Digunakan untuk manajemen penyimpanan berkas;
-   : Digunakan untuk skenario ekspresi dinamis dalam **alur kerja**;
-   [**Koleksi** SQL](/data-sources/collection-sql): Bukan **koleksi** basis data aktual, melainkan menyajikan kueri SQL secara terstruktur dengan cepat;
-   [**Koleksi** Tampilan](/data-sources/collection-view): Menghubungkan ke tampilan basis data yang sudah ada;
-   [**Koleksi** Eksternal](/data-sources/collection-fdw): Memungkinkan sistem basis data untuk langsung mengakses dan mengkueri data di **sumber data** eksternal, berdasarkan teknologi FDW.