:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Bidang Relasi

Di NocoBase, bidang relasi bukanlah bidang yang sebenarnya, melainkan digunakan untuk membangun koneksi antar **koleksi**. Konsep ini setara dengan relasi dalam basis data relasional.

Dalam basis data relasional, jenis-jenis relasi yang paling umum meliputi:

- [Satu-ke-Satu (One-to-one)](./o2o/index.md): Setiap entitas dalam dua **koleksi** hanya dapat berkorespondensi dengan satu entitas di **koleksi** lainnya. Jenis relasi ini biasanya digunakan untuk menyimpan aspek-aspek berbeda dari suatu entitas dalam **koleksi** terpisah untuk mengurangi redundansi dan meningkatkan konsistensi data.
- [Satu-ke-Banyak (One-to-many)](./o2m/index.md): Setiap entitas dalam satu **koleksi** dapat diasosiasikan dengan beberapa entitas di **koleksi** lain. Ini adalah salah satu jenis relasi yang paling umum. Contohnya, satu penulis dapat menulis beberapa artikel, tetapi satu artikel hanya dapat memiliki satu penulis.
- [Banyak-ke-Satu (Many-to-one)](./m2o/index.md): Beberapa entitas dalam satu **koleksi** dapat diasosiasikan dengan satu entitas di **koleksi** lain. Jenis relasi ini juga umum dalam pemodelan data. Misalnya, beberapa siswa dapat termasuk dalam kelas yang sama.
- [Banyak-ke-Banyak (Many-to-many)](./m2m/index.md): Beberapa entitas dalam dua **koleksi** dapat saling diasosiasikan. Jenis relasi ini biasanya memerlukan **koleksi** perantara untuk mencatat asosiasi antar entitas. Contohnya, relasi antara siswa dan mata kuliah—satu siswa dapat mengambil beberapa mata kuliah, dan satu mata kuliah juga dapat diambil oleh beberapa siswa.

Jenis-jenis relasi ini memainkan peran penting dalam desain basis data dan pemodelan data, membantu menjelaskan relasi dan struktur data yang kompleks di dunia nyata.