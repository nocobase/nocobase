:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Modal Edit

## Pendahuluan

Setiap aksi atau *field* yang dapat membuka modal saat diklik, mendukung konfigurasi mode pembukaan, ukuran, dan lain-lain.

![20251027212617](https://static-docs.nocobase.com/20251027212617.png)

![20251027212800](https://static-docs.nocobase.com/20251027212800.png)

## Mode Pembukaan

- Laci

![20251027212832](https://static-docs.nocobase.com/20251027212832.png)

- Dialog

![20251027212905](https://static-docs.nocobase.com/20251027212905.png)

- Sub-halaman

![20251027212940](https://static-docs.nocobase.com/20251027212940.png)

## Ukuran Modal

- Besar
- Sedang (default)
- Kecil

## UID Modal

`UID Modal` adalah UID komponen yang digunakan untuk membuka modal tersebut. Ini juga sesuai dengan segmen `viewUid` dari `view/:viewUid` di bilah alamat saat ini. Anda dapat dengan cepat mendapatkannya dengan mengeklik `Salin UID Modal` di menu pengaturan *field* atau tombol yang memicu modal.

![popup-copy-uid-20251102](https://static-docs.nocobase.com/popup-copy-uid-20251102.png)

Dengan mengatur UID modal, Anda dapat mencapai efek penggunaan kembali modal.

### Modal Internal (default)
- `UID Modal` sama dengan UID tombol aksi saat ini (secara default, menggunakan UID tombol ini).

### Modal Eksternal (penggunaan kembali modal)
- Isi `UID Modal` dengan UID tombol pemicu (yaitu, UID modal) dari lokasi lain untuk menggunakan kembali modal tersebut.
- Penggunaan umum: beberapa halaman/blok berbagi antarmuka dan logika modal yang sama, menghindari konfigurasi berulang.
- Saat menggunakan modal eksternal, beberapa konfigurasi tidak dapat diubah (lihat di bawah).

## Konfigurasi Terkait Lainnya

- `Data source / Koleksi`: Hanya-baca. Menunjukkan sumber data dan koleksi tempat modal terikat; secara default, ini mengikuti koleksi blok saat ini. Dalam mode modal eksternal, ini mengikuti konfigurasi modal target dan tidak dapat diubah.
- `Nama asosiasi`: Opsional. Digunakan untuk membuka modal dari *field* asosiasi; hanya ditampilkan jika ada nilai default. Dalam mode modal eksternal, ini mengikuti konfigurasi modal target dan tidak dapat diubah.
- `Source ID`: Hanya muncul saat `Nama asosiasi` diatur; secara default menggunakan `sourceId` dari konteks saat ini; dapat diubah menjadi variabel atau nilai tetap sesuai kebutuhan.
- `filterByTk`: Dapat kosong, berupa variabel opsional, atau nilai tetap, digunakan untuk membatasi catatan data modal.

![popup-config-20251102](https://static-docs.nocobase.com/popup-config-20251102.png)