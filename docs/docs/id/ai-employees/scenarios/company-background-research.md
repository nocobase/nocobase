---
title: "Alur kerja + AI bagi karyawan untuk menyelesaikan otomatisasi penelitian latar belakang perusahaan"
description: "Melalui formulir informasi perusahaan, catatan investigasi latar belakang, alur kerja, dan karyawan AI, proses investigasi latar belakang perusahaan dapat dipicu, dipertahankan, dan didukung secara otomatis untuk peninjauan manual."
keywords: "NocoBase, karyawan AI, alur kerja, penelitian latar belakang perusahaan, uji tuntas, otomatisasi, praktik bisnis"
---

# Alur kerja + AI bagi karyawan untuk menyelesaikan otomatisasi penelitian latar belakang perusahaan

Di NocoBase, Anda dapat mengubah penelitian latar belakang perusahaan menjadi alur tugas otomatis yang dapat dilacak. Staf bisnis masih bekerja di halaman informasi perusahaan yang sudah dikenal, sementara alur kerja dan staf AI bertanggung jawab untuk melengkapi informasi latar belakang, mencatat proses pemrosesan, dan menyimpan setiap laporan yang dihasilkan.

![](https://static-docs.nocobase.com/202607121806356.png)

Skenario ini cocok untuk mengatasi masalah umum: informasi latar belakang perusahaan bukanlah bidang statis yang berakhir setelah dimasukkan satu kali. Informasi publik akan berubah, peristiwa regulasi akan terjadi, dan status kerja sama akan terus disesuaikan seiring kemajuan bisnis. Jika Anda hanya mengandalkan pencatatan tambahan manual secara rutin, akan mudah untuk dilewatkan; jika Anda membiarkan AI meliput informasi perusahaan secara langsung, akan sulit menjelaskan "bagaimana keputusan ini terjadi". Pendekatannya di sini adalah memisahkan dan menyimpan data saat ini dan proses penelitian - catatan perusahaan menyimpan versi yang digunakan oleh personel bisnis, dan catatan pemeriksaan latar belakang menyimpan status, keluaran, dan riwayat setiap survei AI.

## Mari kita lihat kedua tabelnya terlebih dahulu

Formulir informasi perusahaan memberikan informasi dasar tentang objek penelitian, dan formulir catatan penyelidikan latar belakang bertanggung jawab untuk melakukan setiap tugas penelitian. Yang satu menyimpan informasi yang tersedia saat ini, dan yang lainnya menyimpan proses pemrosesan dan hasil historis.

### `companies`: Tabel informasi perusahaan

| Bidang inti               | memengaruhi                                                           |
| ---------------------- | -------------------------------------------------------------- |
| Company name           | Informasi pengidentifikasi utama objek penelitian.                                   |
| Website                | Memberikan petunjuk situs resmi untuk mengurangi kesalahan penilaian yang disebabkan oleh perusahaan dengan nama atau singkatan yang sama.                   |
| Address                | Membantu dalam menentukan wilayah, entitas dan ruang lingkup bisnis.                                 |
| Company type           | Tandai hubungan bisnis seperti pelanggan, pemasok, mitra, dll. untuk memfasilitasi penilaian selanjutnya dan prioritas tindak lanjut. |
| Background information | Simpan laporan latar belakang perusahaan yang sedang Anda gunakan dan gunakan Penurunan harga untuk merender konten terstruktur. |

### `background_check_tasks`: Formulir catatan pemeriksaan latar belakang

| Bidang inti                  | memengaruhi                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------- |
| Company ID / Company name | Catat perusahaan mana yang disurvei ini untuk memfasilitasi pelaksanaan tugas dan tinjauan historis.                                 |
| Status                    | Alur tugas penandaan dari `pending` ke `processing` dan `completed` juga merupakan dasar untuk mencegah pemicuan berulang. |
| Research report           | Simpan laporan penelitian lengkap yang dihasilkan AI kali ini.                                                   |
| Summary                   | Simpan ringkasan AI tentang proses penelitian, poin risiko, dan informasi untuk dilengkapi.                                     |
| Previous background       | Simpan versi lama sebelum menulis kembali, mendukung pelacakan riwayat dan perbandingan laporan lama dan baru.                                   |

![](https://static-docs.nocobase.com/202607121807627.png)

## Masukkan proses penelitian dari informasi perusahaan

Daftar perusahaan merupakan pintu masuk yang paling familiar bagi para pebisnis. Anda dapat melihat nama perusahaan, website resmi, jenis perusahaan, contact person, email dan informasi lainnya di halaman tersebut. Setelah memasuki suatu perusahaan, personel bisnis dapat melihat laporan latar belakang terkini atau memulai penyelidikan latar belakang baru.

Setelah memasuki halaman pengeditan, "Informasi latar belakang" ditampilkan menggunakan komponen pengeditan penurunan harga. Konten yang dihasilkan AI bukanlah ringkasan singkat, melainkan laporan terstruktur yang dapat dibaca, disalin, dan terus dipelihara. Personil bisnis masih dapat memodifikasinya secara manual, namun setiap hasil yang dihasilkan oleh AI akan meninggalkan riwayat yang sesuai di catatan pemeriksaan latar belakang.

![](https://static-docs.nocobase.com/202607121807450.png)

Dengan cara ini, halaman tersebut masih terlihat seperti antarmuka pemeliharaan data perusahaan biasa, dan metode pemrosesan yang mendasarinya telah menjadi "data terkini + riwayat penelitian". Tabel perusahaan menyimpan versi saat ini, dan tabel tugas menyimpan proses dan rantai bukti.

## Tiga metode pemicu

![](https://static-docs.nocobase.com/202607121807495.png)

Penelitian latar belakang tidak boleh hanya mengandalkan tombol manual. Dalam bisnis nyata, Anda mungkin ingin melengkapi informasi secara otomatis setelah menambahkan perusahaan baru, Anda mungkin juga perlu membuat catatan sejarah secara teratur, dan Anda mungkin juga mengambil inisiatif untuk menyelidiki ulang sebelum menandatangani kontrak atau meninjau.

Alur kerja `New company background check` menangani penelitian otomatis setelah menambah atau memperbarui perusahaan. Ini mendengarkan peristiwa data tabel perusahaan dan dipicu ketika nama perusahaan ada dan informasi latar belakangnya kosong. AI tidak akan segera dipanggil setelah dipicu, tetapi akan memeriksa terlebih dahulu apakah ada tugas yang belum selesai untuk perusahaan yang sama; jika tidak, rekaman pemeriksaan latar belakang baru akan dibuat.

![](https://static-docs.nocobase.com/202607121807374.png)

Alur kerja `Timing company background check` bertanggung jawab atas penyelesaian data historis secara berkelanjutan. Ini berjalan setiap 30 menit, menanyakan perusahaan yang informasi latar belakangnya masih kosong, dan mengulangi batch. Di dalam loop, kami juga memeriksa apakah tugas tersebut sudah ada, dan kemudian memutuskan apakah akan membuat tugas baru. Dengan cara ini, tugas terjadwal dapat dijalankan berulang kali tanpa membuat beberapa rekaman yang diproses secara bersamaan karena pemindaian berulang kali.

![](https://static-docs.nocobase.com/202607121807404.png)

Alur kerja `Manual company background check` terikat pada tombol "Jalankan pemeriksaan latar belakang" di halaman detail perusahaan, yang cocok bagi personel bisnis untuk secara proaktif memulai survei sebelum berkunjung, menandatangani kontrak, atau meninjau. Pemicu manual dan pemicu otomatis menggunakan rangkaian tautan tindak lanjut yang sama: catatan pemeriksaan latar belakang dibuat terlebih dahulu, dan kemudian alur kerja pelaksanaan tugas mengambil alih penyelidikan AI.

![](https://static-docs.nocobase.com/202607121807793.png)

Ketiga pintu masuk ini menyelesaikan masalah pada titik waktu yang berbeda, dan pada akhirnya digabungkan ke dalam formulir catatan investigasi latar belakang yang sama. Pemicu baru, pemicu terjadwal, dan pemicu manual hanya bertanggung jawab untuk mencatat "kebutuhan penyelidikan", dan eksekusi spesifik, manajemen status, dan penulisan kembali hasil diserahkan ke alur kerja berikutnya untuk pemrosesan terpadu.

## Ubah penelitian AI menjadi tugas

`Do company background check` adalah alur kerja yang benar-benar melakukan penelitian. Ia mendengarkan catatan `pending` di tabel catatan pemeriksaan latar belakang. Setelah proses otomatis, terjadwal, atau manual sebelumnya membuat tugas, alur kerja ini akan dipicu secara asinkron.

Saat dijalankan, alur kerja pertama-tama menanyakan apakah perusahaan tersebut masih ada. Jika perusahaan tidak ada maka tugas ditutup dan uraiannya ditulis; jika perusahaan itu ada, status tugas akan dialihkan ke `processing`, dan kemudian karyawan AI akan dipanggil untuk membuat laporan. Kata-kata cepat dari karyawan AI memerlukan keluaran dari dua bagian: laporan penurunan harga yang dapat ditulis langsung ke bidang latar belakang perusahaan, dan ringkasan untuk tinjauan manual.

![](https://static-docs.nocobase.com/202607121808833.png)

Setelah AI mengembalikan hasil terstruktur, alur kerja pertama-tama menulis laporan, ringkasan, dan konten latar belakang lama ke dalam catatan pemeriksaan latar belakang, lalu menulis laporan baru kembali ke catatan perusahaan. Urutan ini menghindari masalah "hanya hasil terbaru, tidak ada catatan proses": halaman perusahaan menyimpan konten terbaru yang tersedia, dan catatan tugas mempertahankan konteks sebelum pembuatan dan penulisan kembali ini.

![](https://static-docs.nocobase.com/202607121808662.png)

Setelah penugasan, pemrosesan batch juga akan menjadi lebih natural. Alur kerja terjadwal tidak perlu menunggu penyelesaian penelitian masing-masing perusahaan, tetapi hanya bertanggung jawab untuk membuat banyak catatan untuk diproses; setiap catatan secara independen memicu survei AI. Beberapa perusahaan dapat maju secara paralel, dan jika tugas tertentu gagal atau waktu habis, perusahaan lain tidak akan diblokir.

## Jadikan hasil AI dapat ditinjau

Laporan yang dihasilkan AI disusun menurut struktur tetap: profil perusahaan, bisnis inti, sejarah perkembangan dan latar belakang modal, posisi pasar dan perspektif kompetitif, penilaian tindak lanjut penjualan, dan tautan kutipan. Personil bisnis tidak hanya dapat melihat "kesimpulan", tetapi juga tip risiko dan informasi tambahan yang diberikan oleh AI dalam ringkasan.

Halaman detail catatan investigasi latar belakang menampilkan "Laporan penelitian" dan "Latar belakang sebelumnya" di tab, dan menyediakan operasi "Salin". Dengan cara ini, Anda dapat dengan cepat menyalin laporan ini selama diskusi, peninjauan, atau komunikasi eksternal, dan Anda juga dapat memeriksa perubahan terhadap versi lama.

Detail catatan juga mengonfigurasi dua tugas pekerja AI. di dalam:

- Memperbaiki laporan penelitian latar belakang: membuat ulang laporan setelah menambahkan informasi melalui dialog, dan menulis hasilnya kembali ke catatan perusahaan
- Bandingkan laporan penelitian latar belakang lama dan baru: Baca laporan lama dan baru dan biarkan AI menjelaskan perbedaan substansial yang ditimbulkan oleh pembaruan ini

Hal ini memungkinkan AI untuk tidak berhenti pada “menghasilkan teks satu kali” tetapi untuk berpartisipasi dalam proses pemeliharaan berkelanjutan, peninjauan, dan perbandingan versi.

![](https://static-docs.nocobase.com/202607121808444.png)

## Cara menggabungkan alur kerja

Secara keseluruhan, rangkaian alur kerja ini dapat dibagi menjadi empat lapisan.

Lapisan pertama bertanggung jawab untuk membuat tugas. `New company background check` untuk perusahaan yang baru ditambahkan atau diperbarui, `Timing company background check` untuk penyelesaian data historis, dan `Manual company background check` untuk inisiatif manual. Mereka semua akan memeriksa apakah ada catatan yang belum selesai sebelum membuat tugas, sehingga mengurangi pemrosesan duplikat dari sumbernya.

Lapisan kedua bertanggung jawab untuk melakukan tugas. `Do company background check` mendengarkan catatan pemeriksaan latar belakang, memajukan tugas yang tertunda ke pemrosesan, memanggil karyawan AI, dan menulis laporan, ringkasan, dan bidang latar belakang perusahaan saat ini setelah selesai.

Lapisan ketiga bertanggung jawab untuk menyediakan kemampuan penulisan balik yang terkontrol kepada karyawan AI. Sebagai alur kerja berbasis alat, `Update company background` membatasi AI untuk hanya menulis catatan tertentu sesuai dengan parameter yang jelas untuk menghindari penggunaan izin modifikasi data yang berlebihan.

Lapisan keempat bertanggung jawab atas pembersihan pengecualian. `Clean overtime processing background check` berjalan setiap 30 menit untuk membersihkan tugas yang belum selesai yang belum diselesaikan selama lebih dari 15 menit untuk menghindari pemrosesan tugas jangka panjang setelah gangguan yang tidak normal.

![](https://static-docs.nocobase.com/202607121808799.png)

## Skenario apa yang dapat dimigrasikan?

Adegan ini menunjukkan bukan formulir terisolasi atau tombol AI terpisah, tetapi kombinasi beberapa kemampuan di NocoBase: tabel data bertanggung jawab untuk membawa objek bisnis dan catatan sejarah, halaman bertanggung jawab untuk melihat dan memicu oleh personel bisnis, alur kerja bertanggung jawab untuk menjadwalkan dan menulis kembali, dan staf AI bertanggung jawab untuk menghasilkan hasil terstruktur yang dapat ditinjau.

Model serupa dapat dipindahkan ke skenario seperti penerimaan pemasok, uji tuntas pelanggan, tinjauan awal risiko kontrak, penilaian kualitas prospek, pelacakan opini publik, dan penyaringan awal target investasi dan pembiayaan. Selama ada beberapa persyaratan dalam bisnis seperti "data harus terus diselesaikan", "hasil AI harus ditinggalkan" dan "versi historis tidak dapat ditimpa", proses otomatis yang dapat dijalankan, dilacak, dan terukur dapat dibangun dengan cara yang sama.

## Dokumentasi referensi

- [Alur Kerja NocoBase](/workflow/)
- [Karyawan AI NocoBase](/ai-employees/)
- [Node Karyawan AI Alur Kerja NocoBase ](/ai-employees/workflow/nodes/employee/configuration)
- [Alat kustomisasi karyawan NocoBase AI ](/ai-employees/features/tools)
