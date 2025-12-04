:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Menulis & Menjalankan JS Daring

Di NocoBase, **RunJS** menyediakan metode ekstensi yang ringan, cocok untuk skenario **eksperimen cepat dan pemrosesan logika sementara**. Tanpa perlu membuat plugin atau memodifikasi kode sumber, Anda dapat menyesuaikan antarmuka atau interaksi melalui JavaScript.

Melalui RunJS, Anda dapat langsung memasukkan kode JS di desainer antarmuka untuk mencapai:

-   Kustomisasi konten rendering (bidang, blok, kolom, item, dll.)
-   Logika interaksi kustom (klik tombol, keterkaitan event)
-   Perilaku dinamis yang dikombinasikan dengan data kontekstual

## Skenario yang Didukung

### Blok JS

Dengan JS, Anda dapat menyesuaikan rendering blok, memberikan kontrol penuh atas struktur dan gaya blok.
Ini cocok untuk menampilkan komponen kustom, diagram statistik, konten pihak ketiga, dan skenario lain yang sangat fleksibel.

![20250916105031](https://static-docs.nocobase.com/20250916105031.png)

Dokumentasi: [Blok JS](/interface-builder/blocks/other-blocks/js-block)

### Aksi JS

Dengan JS, Anda dapat menyesuaikan logika klik tombol aksi, memungkinkan Anda untuk mengeksekusi operasi frontend atau permintaan API apa pun.
Contoh: menghitung nilai secara dinamis, mengirim data kustom, memicu pop-up, dll.

![20250916105123](https://static-docs.nocobase.com/20250916105123.png)

Dokumentasi: [Aksi JS](/interface-builder/actions/types/js-action)

### Bidang JS

Dengan JS, Anda dapat menyesuaikan logika rendering bidang. Anda dapat menampilkan gaya, konten, atau status yang berbeda secara dinamis berdasarkan nilai bidang.

![20250916105354](https://static-docs.nocobase.com/20250916105354.png)

Dokumentasi: [Bidang JS](/interface-builder/fields/specific/js-field)

### Item JS

Dengan JS, Anda dapat merender item independen tanpa terikat pada bidang tertentu. Ini umum digunakan untuk menampilkan blok informasi kustom.

![20250916104848](https://static-docs.nocobase.com/20250916104848.png)

Dokumentasi: [Item JS](/interface-builder/fields/specific/js-item)

### Kolom Tabel JS

Dengan JS, Anda dapat menyesuaikan rendering kolom tabel.
Ini dapat mengimplementasikan logika tampilan sel yang kompleks, seperti progress bar, label status, dll.

![20250916105443](https://static-docs.nocobase.com/20250916105443.png)

Dokumentasi: [Kolom Tabel JS](/interface-builder/fields/specific/js-column)

### Aturan Keterkaitan (Linkage Rules)

Dengan JS, Anda dapat mengontrol logika keterkaitan antar bidang dalam formulir atau halaman.
Contoh: ketika satu bidang berubah, secara dinamis memodifikasi nilai atau visibilitas bidang lain.

![20251029114532](https://static-docs.nocobase.com/20251029114532.png)

Dokumentasi: [Aturan Keterkaitan](/interface-builder/linkage-rule)

### Alur Event (Eventflow)

Dengan JS, Anda dapat menyesuaikan kondisi pemicu dan logika eksekusi alur event untuk membangun rantai interaksi frontend yang lebih kompleks.

![](https://static-docs.nocobase.com/20251031092755.png)

Dokumentasi: [Alur Event](/interface-builder/event-flow)