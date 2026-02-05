---
pkg: "@nocobase/plugin-data-visualization"
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Gambaran Umum

Plugin visualisasi data NocoBase menyediakan kueri data visual dan beragam komponen bagan. Dengan konfigurasi sederhana, Anda dapat dengan cepat membangun panel visualisasi, menampilkan insight data, serta mendukung analisis dan tampilan data multi-dimensi.

![clipboard-image-1761749573](https://static-docs.nocobase.com/clipboard-image-1761749573.png)

## Konsep Dasar
- Blok Bagan: Sebuah komponen bagan yang dapat dikonfigurasi pada halaman, mendukung kueri data, opsi bagan, dan event interaksi.
- Kueri Data (Builder / SQL): Konfigurasi secara visual menggunakan Builder, atau tulis SQL untuk mengambil data.
- Ukuran (Measures) dan Dimensi (Dimensions): Ukuran digunakan untuk agregasi numerik; Dimensi digunakan untuk mengelompokkan data (misalnya, tanggal, kategori, wilayah).
- Pemetaan Bidang: Memetakan kolom hasil kueri ke bidang inti bagan seperti `xField`, `yField`, `seriesField`, atau `Category / Value`.
- Opsi Bagan (Dasar / Kustom): Dasar mengonfigurasi properti umum secara visual; Kustom mengembalikan objek `option` ECharts lengkap melalui JS.
- Jalankan Kueri: Jalankan kueri dan ambil data di panel konfigurasi; Anda dapat beralih ke Tabel / JSON untuk melihat data yang dikembalikan.
- Pratinjau dan Simpan: Pratinjau bersifat sementara; mengklik "Simpan" akan menulis konfigurasi ke database dan menerapkannya secara resmi.
- Variabel Konteks: Menggunakan kembali informasi konteks halaman, pengguna, dan filter (misalnya, `{{ ctx.user.id }}`) dalam kueri dan konfigurasi bagan.
- Filter dan Keterkaitan: "Blok filter" tingkat halaman mengumpulkan kondisi terpadu, secara otomatis digabungkan ke dalam kueri bagan, dan menyegarkan bagan yang terkait.
- Event Interaksi: Daftarkan event melalui `chart.on` untuk mengaktifkan perilaku seperti penyorotan, navigasi, dan drill-down.

## Instalasi
Visualisasi data adalah plugin bawaan NocoBase; siap pakai tanpa perlu instalasi terpisah.