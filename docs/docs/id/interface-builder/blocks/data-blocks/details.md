:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Blok Detail

## Pendahuluan

Blok Detail digunakan untuk menampilkan nilai-nilai bidang dari setiap catatan data. Blok ini mendukung tata letak bidang yang fleksibel dan memiliki fungsi tindakan data bawaan, sehingga memudahkan pengguna untuk melihat dan mengelola informasi.

## Pengaturan Blok

![20251029202614](https://static-docs.nocobase.com/20251029202614.png)

### Aturan Keterkaitan Blok

Kontrol perilaku blok (misalnya, apakah akan ditampilkan atau menjalankan JavaScript) melalui aturan keterkaitan.

![20251023195004](https://static-docs.nocobase.com/20251023195004.png)
Untuk detail lebih lanjut, lihat [Aturan Keterkaitan](/interface-builder/linkage-rule)

### Mengatur Cakupan Data

Contoh: Hanya menampilkan pesanan yang sudah dibayar

![20251023195051](https://static-docs.nocobase.com/20251023195051.png)

Untuk detail lebih lanjut, lihat [Mengatur Cakupan Data](/interface-builder/blocks/block-settings/data-scope)

### Aturan Keterkaitan Bidang

Aturan keterkaitan di Blok Detail mendukung pengaturan bidang untuk ditampilkan/disembunyikan secara dinamis.

Contoh: Jangan tampilkan jumlah saat status pesanan adalah "Dibatalkan".

![20251023200739](https://static-docs.nocobase.com/20251023200739.png)

Untuk detail lebih lanjut, lihat [Aturan Keterkaitan](/interface-builder/linkage-rule)

## Mengonfigurasi Bidang

### Bidang dari koleksi ini

> **Catatan**: Bidang dari koleksi yang diwariskan (yaitu, bidang koleksi induk) secara otomatis digabungkan dan ditampilkan dalam daftar bidang saat ini.

![20251023201012](https://static-docs.nocobase.com/20251023201012.png)

### Bidang dari Koleksi Terkait

> **Catatan**: Menampilkan bidang dari koleksi terkait didukung (saat ini hanya untuk hubungan satu-ke-satu).

![20251023201258](https://static-docs.nocobase.com/20251023201258.png)

### Bidang Lainnya
- JS Field
- JS Item
- Pembatas
- Markdown

![20251023201514](https://static-docs.nocobase.com/20251023201514.png)

> **Tips**: Anda dapat menulis JavaScript untuk mengimplementasikan konten tampilan kustom, memungkinkan Anda menampilkan informasi yang lebih kompleks.  
> Misalnya, Anda dapat merender efek tampilan yang berbeda berdasarkan tipe data, kondisi, atau logika yang berbeda.

![20251023202017](https://static-docs.nocobase.com/20251023202017.png)

## Mengonfigurasi Tindakan

![20251023200529](https://static-docs.nocobase.com/20251023200529.png)

- [Edit](/interface-builder/actions/types/edit)
- [Hapus](/interface-builder/actions/types/delete)
- [Tautan](/interface-builder/actions/types/link)
- [Pop-up](/interface-builder/actions/types/pop-up)
- [Perbarui Catatan](/interface-builder/actions/types/update-record)
- [Memicu alur kerja](/interface-builder/actions/types/trigger-workflow)
- [Tindakan JS](/interface-builder/actions/types/js-action)
- [Karyawan AI](/interface-builder/actions/types/ai-employee)