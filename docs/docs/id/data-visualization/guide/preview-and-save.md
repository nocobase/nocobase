:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Pratinjau dan Simpan

*   **Pratinjau**: Menampilkan sementara perubahan dari panel konfigurasi ke dalam grafik halaman untuk memverifikasi hasilnya.
*   **Simpan**: Menyimpan perubahan dari panel konfigurasi secara permanen ke dalam database.

## Titik Akses

![clipboard-image-1761479218](https://static-docs.nocobase.com/clipboard-image-1761479218.png)

*   Dalam mode konfigurasi visual (Basic), semua perubahan akan diterapkan ke pratinjau secara otomatis secara *default*.
*   Dalam mode SQL dan Custom, setelah melakukan perubahan, Anda dapat mengeklik tombol **Pratinjau** di sisi kanan untuk menerapkan perubahan ke pratinjau.
*   Tombol "Pratinjau" yang terpadu tersedia di bagian bawah seluruh panel konfigurasi.

## Perilaku Pratinjau
*   Menampilkan konfigurasi sementara di halaman tanpa menyimpannya ke database. Setelah memuat ulang halaman atau membatalkan operasi, hasil pratinjau tidak akan dipertahankan.
*   **Debounce bawaan**: Beberapa pemicu pemuatan ulang dalam waktu singkat hanya akan mengeksekusi yang terakhir untuk menghindari permintaan yang sering.
*   Mengeklik "Pratinjau" lagi akan menimpa hasil pratinjau sebelumnya.

## Pesan Kesalahan
*   **Kesalahan kueri atau kegagalan validasi**: Ditampilkan di area "Lihat Data".
*   **Kesalahan konfigurasi grafik** (pemetaan Basic hilang, pengecualian dari Custom JS): Ditampilkan di area grafik atau konsol sambil menjaga halaman tetap dapat dioperasikan.
*   Konfirmasikan nama kolom dan tipe data di "Lihat Data" sebelum melakukan pemetaan bidang atau menulis kode Custom untuk mengurangi kesalahan secara efektif.

## Simpan dan Batalkan
*   **Simpan**: Menulis perubahan saat ini ke dalam konfigurasi blok dan segera menerapkannya ke halaman.
*   **Batalkan**: Membuang perubahan yang belum disimpan di panel saat ini dan kembali ke status terakhir yang disimpan.
*   **Cakupan Penyimpanan**:
    *   **Kueri Data**: Parameter Builder; dalam mode SQL, teks SQL juga disimpan.
    *   **Opsi Grafik**: Tipe Basic, pemetaan bidang, dan properti; teks JS Custom.
    *   **Event Interaksi**: Teks JS event dan logika pengikatan.
*   Setelah disimpan, blok akan berlaku untuk semua pengunjung (tergantung pada pengaturan izin halaman).

## Alur Kerja yang Direkomendasikan
*   Konfigurasi kueri data → Jalankan kueri → Lihat data untuk mengonfirmasi nama kolom dan tipe → Konfigurasi opsi grafik untuk memetakan bidang inti → Pratinjau untuk validasi → Simpan untuk menerapkan.