:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Mengikat Alur Kerja

## Pendahuluan

Pada beberapa tombol aksi, Anda dapat mengonfigurasi pengikatan alur kerja untuk mengaitkan aksi tersebut dengan sebuah alur kerja, sehingga memungkinkan pemrosesan data secara otomatis.

![20251029144822](https://static-docs.nocobase.com/20251029144822.png)

![20251029145017](https://static-docs.nocobase.com/20251029145017.png)

## Aksi dan Jenis Alur Kerja yang Didukung

Tombol aksi dan jenis alur kerja yang saat ini didukung untuk pengikatan adalah sebagai berikut:

| Tombol Aksi \ Jenis Alur Kerja | Kejadian Sebelum Aksi | Kejadian Setelah Aksi | Kejadian Persetujuan | Kejadian Aksi Kustom |
| --- | --- | --- | --- | --- |
| Tombol "Kirim", "Simpan" pada formulir | ✅ | ✅ | ✅ | ❌ |
| Tombol "Perbarui data" pada baris data (Tabel, Daftar, dll.) | ✅ | ✅ | ✅ | ❌ |
| Tombol "Hapus" pada baris data (Tabel, Daftar, dll.) | ✅ | ❌ | ❌ | ❌ |
| Tombol "Picukan alur kerja" | ❌ | ❌ | ❌ | ✅ |

## Mengikat Beberapa Alur Kerja Sekaligus

Satu tombol aksi dapat diikat ke beberapa alur kerja. Ketika beberapa alur kerja diikat, urutan eksekusinya mengikuti aturan berikut:

1.  Untuk alur kerja dengan jenis pemicu yang sama, alur kerja sinkron akan dieksekusi terlebih dahulu, diikuti oleh alur kerja asinkron.
2.  Alur kerja dengan jenis pemicu yang sama dieksekusi sesuai urutan konfigurasi.
3.  Antara alur kerja dengan jenis pemicu yang berbeda:
    1.  Kejadian sebelum aksi selalu dieksekusi sebelum kejadian setelah aksi dan kejadian persetujuan.
    2.  Kejadian setelah aksi dan kejadian persetujuan tidak memiliki urutan tertentu, dan logika bisnis tidak boleh bergantung pada urutan konfigurasi.

## Selengkapnya

Untuk jenis kejadian alur kerja yang berbeda, lihat dokumentasi detail dari plugin terkait:

*   [Kejadian Setelah Aksi]
*   [Kejadian Sebelum Aksi]
*   [Kejadian Persetujuan]
*   [Kejadian Aksi Kustom]